

(function () {

  let serverOccupiedCache = null;
  let serverOccupiedPromise = null;

  function fetchServerOccupied() {
    if (serverOccupiedPromise) return serverOccupiedPromise;

    const getter = typeof window.cvrApiGet === "function"
      ? window.cvrApiGet("content/occupied-dates")
      : fetch("api/content/occupied-dates", { credentials: "same-origin" }).then((res) => ({ ok: res.ok, body: {} }));
    serverOccupiedPromise = Promise.resolve(getter)
      .then((result) => {
        const body = result && result.body ? result.body : result;
        serverOccupiedCache = (body && body.data && Array.isArray(body.data.reservations)) ? body.data.reservations : [];
        return serverOccupiedCache;
      })
      .catch(() => {
        serverOccupiedCache = [];
        return serverOccupiedCache;
      });
    return serverOccupiedPromise;
  }
  window.__cvrFetchServerOccupied = fetchServerOccupied;

  function formatYMD(d) {
    if (!(d instanceof Date) || Number.isNaN(d.getTime())) return "";
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  }

  function readReservations() {
    let local = [];
    try {
      local = JSON.parse(localStorage.getItem("cvrReservations") || "[]");
    } catch {
      local = [];
    }

    return local.concat(serverOccupiedCache || []);
  }

  function isReservationCanceled(r) {
    const s = String(r.reservationStatus || "").toLowerCase();
    return s.includes("cancel");
  }

  function getBlockedYmdSet() {
    try {
      const raw = localStorage.getItem("cvrBlockedDates");
      if (!raw) return new Set();
      const arr = JSON.parse(raw);
      if (!Array.isArray(arr)) return new Set();
      return new Set(arr.filter((x) => typeof x === "string"));
    } catch {
      return new Set();
    }
  }

  function sameRoom(r, packageId, roomTitle) {
    if (r.bookingType && r.bookingType !== "room") return false;
    if (isReservationCanceled(r)) return false;
    if (r.packageId && packageId) return r.packageId === packageId;
    if (roomTitle && r.roomName) return r.roomName === roomTitle;
    return !!(r.packageId && r.packageId === packageId);
  }

  function getOccupiedRanges(packageId, roomTitle, excludeReservationId) {
    const ranges = [];
    for (const r of readReservations()) {
      if (excludeReservationId && r.id === excludeReservationId) continue;
      if (!sameRoom(r, packageId, roomTitle)) continue;
      if (!r.checkIn || !r.checkOut) continue;
      ranges.push({ start: r.checkIn, end: r.checkOut });
    }
    return ranges;
  }

  function isOccupiedNight(ymd, ranges) {
    return ranges.some(({ start, end }) => start <= ymd && ymd < end);
  }

  function stayOverlaps(ci, co, ranges) {
    for (const { start, end } of ranges) {
      if (ci < end && co > start) return true;
    }
    return false;
  }

  function todayYmd() {
    return formatYMD(new Date());
  }

  function styleHolidayDay(dayElem, d) {
    const ymd = formatYMD(d);
    const holiday = typeof window.getPHHoliday === "function" ? window.getPHHoliday(ymd) : null;
    if (!holiday) return;
    dayElem.classList.add("cvr-cal-day-holiday");
    dayElem.setAttribute("title", `${holiday.name} (${holiday.typeLabel})`);
  }

  window.cvrRoomStayOverlapsExisting = function (packageId, roomName, checkIn, checkOut, excludeReservationId, scheduledCheckIn, scheduledCheckOut) {
    const dur = window.CVRDuration;
    if (dur && scheduledCheckIn && scheduledCheckOut) {
      for (const r of readReservations()) {
        if (excludeReservationId && r.id === excludeReservationId) continue;
        if (!sameRoom(r, packageId, roomName)) continue;
        if (r.scheduledCheckIn && r.scheduledCheckOut) {
          if (dur.windowsOverlap(scheduledCheckIn, scheduledCheckOut, r.scheduledCheckIn, r.scheduledCheckOut)) return true;
        } else if (r.checkIn && r.checkOut) {

          if (checkIn < r.checkOut && checkOut > r.checkIn) return true;
        }
      }
      return false;
    }
    const ranges = getOccupiedRanges(packageId, roomName || "", excludeReservationId || "");
    return stayOverlaps(checkIn, checkOut, ranges);
  };

  window.cvrEventOverlapsExisting = function (scheduledCheckIn, scheduledCheckOut, excludeReservationId, requestedSlots, days) {
    const dur = window.CVRDuration;
    if (!dur || !scheduledCheckIn || !scheduledCheckOut) return false;
    const newStartYmd = formatYMD(new Date(scheduledCheckIn));
    const slots = Array.isArray(requestedSlots) && requestedSlots.length ? requestedSlots : ALL_SLOTS;
    if (Number(days) > 1) return isEventRangeUnavailable(newStartYmd, days, excludeReservationId, slots, getBlockedYmdSet());
    return isEventDateTaken(newStartYmd, excludeReservationId, slots);
  };

  window.initReservationAvailabilityCalendars = async function (opts) {
    const packageId = opts.packageId;
    const roomTitle = opts.roomTitle || "";
    const excludeReservationId = opts.excludeReservationId || "";
    const onChange = typeof opts.onChange === "function" ? opts.onChange : function () {};

    const mountIn = document.getElementById("cvrFpCheckInMount");
    const mountOut = document.getElementById("cvrFpCheckOutMount");
    const hiddenIn = document.getElementById("resCheckIn");
    const hiddenOut = document.getElementById("resCheckOut");
    if (!mountIn || !mountOut || !hiddenIn || !hiddenOut || typeof flatpickr === "undefined") {
      return;
    }

    mountIn.innerHTML = '<p class="text-muted-brand small mb-0">Loading availability…</p>';
    mountOut.innerHTML = '<p class="text-muted-brand small mb-0">Loading availability…</p>';
    await fetchServerOccupied();
    mountIn.innerHTML = "";
    mountOut.innerHTML = "";

    const blocked = getBlockedYmdSet();
    let ranges = getOccupiedRanges(packageId, roomTitle, excludeReservationId);
    let selectedCheckIn = hiddenIn.value || null;

    // Highlights check-in → check-out as one continuous band.
    function styleStayRange(dayElem, ymd) {
      const ci = hiddenIn.value;
      const co = hiddenOut.value;
      if (!ci || !co || co <= ci) return;
      if (ymd < ci || ymd > co) return;
      dayElem.classList.add("cvr-cal-day-stay");
      if (ymd === ci) dayElem.classList.add("cvr-cal-day-stay-start");
      if (ymd === co) dayElem.classList.add("cvr-cal-day-stay-end");
    }

    function redrawStay() {
      try { if (fpIn) fpIn.redraw(); } catch (e) { /* ignore */ }
      try { if (fpOut) fpOut.redraw(); } catch (e) { /* ignore */ }
    }

    function styleDayBooked(dayElem, d) {
      const ymd = formatYMD(d);
      styleStayRange(dayElem, ymd);
      const isBooked = isOccupiedNight(ymd, ranges);
      const isBlocked = blocked.has(ymd);
      const isPast = ymd < todayYmd();
      if (isBooked) {
        dayElem.classList.add("cvr-cal-day-booked");
        dayElem.setAttribute("title", "Already booked - not available");
      }
      if (isBlocked) {
        dayElem.classList.add("cvr-cal-day-blocked");
        dayElem.setAttribute("title", "Unavailable (closed / maintenance)");
      }
      if (!isBooked && !isBlocked && !isPast) {
        dayElem.classList.add("cvr-cal-day-available");
        if (!dayElem.getAttribute("title")) dayElem.setAttribute("title", "Available");
      }
    }

    let fpIn;
    let fpOut;

    fpOut = flatpickr(mountOut, {
      disableMobile: true,
      inline: true,
      appendTo: mountOut,
      dateFormat: "Y-m-d",
      defaultDate: hiddenOut.value || undefined,
      disable: [
        function (date) {
          const ci = selectedCheckIn || hiddenIn.value;
          const ymd = formatYMD(date);
          if (!ci) return true;
          if (ymd < ci) return true;
          if (blocked.has(ymd)) return true;
          if (ymd === ci) return false;
          return stayOverlaps(ci, ymd, ranges);
        },
      ],
      onChange: function (selectedDates) {
        if (!selectedDates.length) {
          hiddenOut.value = "";
          redrawStay();
          onChange();
          return;
        }
        const ymd = formatYMD(selectedDates[0]);
        const ci = selectedCheckIn || hiddenIn.value;
        if (!ci || ymd < ci || (ymd !== ci && stayOverlaps(ci, ymd, ranges))) {
          hiddenOut.value = "";
          redrawStay();
          onChange();
          return;
        }
        hiddenOut.value = ymd;
        redrawStay();
        onChange();
      },
      onDayCreate: function (_dObj, _dStr, _fp, dayElem) {
        if (dayElem && dayElem.dateObj) {
          styleDayBooked(dayElem, dayElem.dateObj);
          styleHolidayDay(dayElem, dayElem.dateObj);
        }
      },
    });

    fpIn = flatpickr(mountIn, {
      disableMobile: true,
      inline: true,
      appendTo: mountIn,
      dateFormat: "Y-m-d",
      minDate: "today",
      defaultDate: hiddenIn.value || undefined,
      disable: [
        function (date) {
          const ymd = formatYMD(date);
          if (ymd < todayYmd()) return true;
          if (blocked.has(ymd)) return true;
          return isOccupiedNight(ymd, ranges);
        },
      ],
      onChange: function (selectedDates) {
        if (!selectedDates.length) {
          hiddenIn.value = "";
          selectedCheckIn = null;
          hiddenOut.value = "";
          fpOut.clear();
          redrawStay();
          onChange();
          return;
        }
        const d = selectedDates[0];
        selectedCheckIn = formatYMD(d);
        hiddenIn.value = selectedCheckIn;

        const minOut = new Date(d.getTime());
        fpOut.set("minDate", minOut);

        const co = hiddenOut.value;
        if (!co || co < selectedCheckIn || (co !== selectedCheckIn && stayOverlaps(selectedCheckIn, co, ranges))) {
          let candidate = new Date(minOut.getTime());
          for (let i = 0; i < 400; i += 1) {
            const coY = formatYMD(candidate);
            if (
              coY >= selectedCheckIn &&
              !blocked.has(coY) &&
              (coY === selectedCheckIn || !stayOverlaps(selectedCheckIn, coY, ranges))
            ) {
              hiddenOut.value = coY;
              fpOut.setDate(candidate, false);
              break;
            }
            candidate.setDate(candidate.getDate() + 1);
          }
        } else {
          fpOut.setDate(hiddenOut.value, false);
        }
        redrawStay();
        onChange();
      },
      onDayCreate: function (_dObj, _dStr, _fp, dayElem) {
        if (dayElem && dayElem.dateObj) {
          styleDayBooked(dayElem, dayElem.dateObj);
          styleHolidayDay(dayElem, dayElem.dateObj);
        }
      },
    });

    if (hiddenIn.value) {
      selectedCheckIn = hiddenIn.value;
      fpOut.set("minDate", new Date(hiddenIn.value + "T12:00:00"));
    }
    if (hiddenIn.value && hiddenOut.value && hiddenOut.value >= hiddenIn.value) {
      fpOut.setDate(hiddenOut.value, false);
    }
  };

  function getEventWindowForDate(ymd) {
    const duration = window.CVRDuration;
    return duration?.buildFixedWindow
      ? duration.buildFixedWindow(ymd, "00:00", "00:00", "Single-day event")
      : null;
  }

  // ---- Event sessions: Morning and Night can be booked separately on the same date ----
  const PV_MORNING = "Private Venue – Morning (8:00 AM–5:00 PM)";
  const PV_NIGHT = "Private Venue – Night (7:00 PM–5:00 AM)";
  const PV_WHOLE = "Private Venue – Whole Day (2 Sessions)";
  const ALL_SLOTS = ["morning", "night"];

  function slotsForSession(sessionKey) {
    if (sessionKey === "morning") return ["morning"];
    if (sessionKey === "night") return ["night"];
    if (sessionKey === "whole-day" || sessionKey === "multi-day") return ALL_SLOTS.slice();
    return null;
  }

  /** Which time slots (morning / night) a package + session occupies; null when not known yet. */
  function eventSlotsFor(packageOption, sessionKey) {
    const pkg = String(packageOption || "");
    if (pkg === PV_MORNING) return ["morning"];
    if (pkg === PV_NIGHT) return ["night"];
    if (pkg === PV_WHOLE) return ALL_SLOTS.slice();
    return slotsForSession(sessionKey);
  }
  window.cvrEventSlotsFor = eventSlotsFor;

  function slotsOfReservation(r) {
    return eventSlotsFor(r.packageOption || r.packageId, r.eventSession) || ALL_SLOTS.slice();
  }

  function takenSlotsOnDate(ymd, excludeReservationId) {
    const taken = new Set();
    for (const r of readReservations()) {
      if (excludeReservationId && r.id === excludeReservationId) continue;
      if (r.bookingType && r.bookingType !== "event") continue;
      if (isReservationCanceled(r)) continue;
      const eventStart = String(r.preferredDate || r.checkIn || "").slice(0, 10);
      if (!eventStart) continue;
      const eventEnd = String(r.checkOutDate || r.checkOutDateOnly || r.checkOut || eventStart).slice(0, 10);
      if (ymd >= eventStart && ymd <= eventEnd) slotsOfReservation(r).forEach((slot) => taken.add(slot));
    }
    return taken;
  }

  /**
   * requestedSlots: the slots the guest wants (array). When null/empty (session not chosen yet),
   * the date only counts as taken once both Morning and Night are booked.
   */
  function isEventDateTaken(ymd, excludeReservationId, requestedSlots) {
    const taken = takenSlotsOnDate(ymd, excludeReservationId);
    if (!taken.size) return false;
    if (Array.isArray(requestedSlots) && requestedSlots.length) {
      return requestedSlots.some((slot) => taken.has(slot));
    }
    return ALL_SLOTS.every((slot) => taken.has(slot));
  }

  function addDaysYmd(ymd, n) {
    const d = new Date(`${ymd}T00:00:00`);
    d.setDate(d.getDate() + n);
    return formatYMD(d);
  }

  /** A multi-day stay needs every day of the range to be open (not booked, not closed, not in the past). */
  function isEventRangeUnavailable(startYmd, days, excludeReservationId, requestedSlots, blockedSet) {
    const count = Math.max(1, Number(days) || 1);
    for (let i = 0; i < count; i += 1) {
      const ymd = i === 0 ? startYmd : addDaysYmd(startYmd, i);
      if (blockedSet && blockedSet.has(ymd)) return true;
      if (isEventDateTaken(ymd, excludeReservationId, requestedSlots)) return true;
    }
    return false;
  }


  window.initEventPreferredDateCalendar = async function (opts = {}) {
    const excludeReservationId = opts.excludeReservationId || "";
    const mountId = opts.mountId || "cvrEventPreferredMount";
    const hiddenId = opts.hiddenId || "eventDate";
    const mount = document.getElementById(mountId);
    const hidden = document.getElementById(hiddenId);
    if (!mount || !hidden || typeof flatpickr === "undefined") return;
    if (mount.querySelector(".flatpickr-calendar")) return;

    mount.innerHTML = '<p class="text-muted-brand small mb-0">Loading availability…</p>';
    await fetchServerOccupied();
    if (mount.querySelector(".flatpickr-calendar")) return;
    mount.innerHTML = "";

    const blocked = getBlockedYmdSet();
    const getSlots = () => {
      try {
        const fn = typeof opts.getSlots === "function" ? opts.getSlots : window.cvrEventRequestedSlots;
        const slots = typeof fn === "function" ? fn() : null;
        return Array.isArray(slots) && slots.length ? slots : null;
      } catch {
        return null;
      }
    };
    const getDays = () => {
      try {
        const fn = typeof opts.getDays === "function" ? opts.getDays : window.cvrEventRequestedDays;
        const n = typeof fn === "function" ? Number(fn()) : 1;
        return Number.isFinite(n) && n > 1 ? Math.round(n) : 1;
      } catch {
        return 1;
      }
    };
    const slotLabel = (slot) => (slot === "morning" ? "Morning session" : "Night session");

    function styleEventDay(dayElem, d) {
      const ymd = formatYMD(d);
      const isBooked = isEventDateTaken(ymd, excludeReservationId, getSlots());
      const takenSlots = takenSlotsOnDate(ymd, excludeReservationId);
      const isPartial = !isBooked && takenSlots.size > 0;
      const isBlocked = blocked.has(ymd);
      const isPast = ymd < todayYmd();
      if (isBooked) {
        dayElem.classList.add("cvr-cal-day-booked");
        dayElem.setAttribute("title", takenSlots.size && takenSlots.size < ALL_SLOTS.length
          ? `${Array.from(takenSlots).map(slotLabel).join(" & ")} already booked - choose another session or date`
          : "Already booked - not available");
      } else if (isPartial) {
        dayElem.classList.add("cvr-cal-day-partial");
        const free = ALL_SLOTS.filter((slot) => !takenSlots.has(slot)).map(slotLabel).join(" & ");
        dayElem.setAttribute("title", `${Array.from(takenSlots).map(slotLabel).join(" & ")} booked - ${free} still available`);
      }
      if (isBlocked) {
        dayElem.classList.add("cvr-cal-day-blocked");
        dayElem.setAttribute("title", "Unavailable (closed / maintenance)");
      }
      const days = getDays();
      const rangeShort = days > 1 && !isBooked && !isBlocked && !isPast
        && isEventRangeUnavailable(ymd, days, excludeReservationId, getSlots(), blocked);
      if (rangeShort) {
        dayElem.classList.add("cvr-cal-day-stay-short");
        dayElem.setAttribute("title", `A ${days}-day stay from this date runs into a booked or closed day`);
      } else if (!isBooked && !isBlocked && !isPast) {
        dayElem.classList.add("cvr-cal-day-available");
        if (!dayElem.getAttribute("title")) dayElem.setAttribute("title", days > 1 ? `Available - ${days}-day stay starts here` : "Available");
      }
    }

    // Multi-day: shade every day of the chosen stay.
    let pickerRef = null;
    const paintStayRange = (_dates, _str, inst) => {
      const fp = inst && inst.days ? inst : pickerRef;
      if (!fp || !fp.days) return;
      const days = getDays();
      const start = hidden.value;
      const end = days > 1 && start ? addDaysYmd(start, days - 1) : "";
      fp.days.querySelectorAll(".flatpickr-day").forEach((el) => {
        const inStay = Boolean(end) && el.dateObj && formatYMD(el.dateObj) >= start && formatYMD(el.dateObj) <= end;
        el.classList.toggle("cvr-cal-day-stay", inStay);
      });
    };

    const eventDatePicker = flatpickr(mount, {
      disableMobile: true,
      inline: true,
      appendTo: mount,
      dateFormat: "Y-m-d",
      minDate: "today",
      defaultDate: hidden.value || undefined,
      disable: [
        function (date) {
          const ymd = formatYMD(date);
          if (ymd < todayYmd()) return true;
          if (blocked.has(ymd)) return true;
          const days = getDays();
          if (days > 1) return isEventRangeUnavailable(ymd, days, excludeReservationId, getSlots(), blocked);
          return isEventDateTaken(ymd, excludeReservationId, getSlots());
        },
      ],
      onChange: function (selectedDates) {
        hidden.value = selectedDates.length ? formatYMD(selectedDates[0]) : "";
        paintStayRange();
        if (typeof opts.onChange === "function") opts.onChange();
      },
      onReady: paintStayRange,
      onMonthChange: paintStayRange,
      onYearChange: paintStayRange,
      onDayCreate: function (_dObj, _dStr, _fp, dayElem) {
        if (dayElem && dayElem.dateObj) {
          styleEventDay(dayElem, dayElem.dateObj);
          styleHolidayDay(dayElem, dayElem.dateObj);
        }
      },
    });
    pickerRef = eventDatePicker;
    const refreshEventAvailability = () => {
      // The chosen date may no longer be free for the newly chosen session.
      const days = getDays();
      const unavailable = hidden.value && (days > 1
        ? isEventRangeUnavailable(hidden.value, days, excludeReservationId, getSlots(), blocked)
        : (blocked.has(hidden.value) || isEventDateTaken(hidden.value, excludeReservationId, getSlots())));
      if (unavailable) {
        eventDatePicker.clear();
        hidden.value = "";
        if (typeof opts.onChange === "function") opts.onChange();
      }
      eventDatePicker.redraw();
      paintStayRange();
    };
    window.cvrRefreshEventAvailability = refreshEventAvailability;
    ["eventType", "eventBirthdayPackage", "eventSession"].forEach((id) => {
      document.getElementById(id)?.addEventListener("change", refreshEventAvailability);
    });
  };
})();
