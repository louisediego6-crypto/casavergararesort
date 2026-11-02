function initBookingPage() {
  const bookingTypeSelect = document.getElementById("bookingType");
  const roomSection = document.getElementById("roomBookingSection");
  const eventSection = document.getElementById("eventBookingSection");
  const eventForm = document.getElementById("eventReservationForm");
  const feedback = document.getElementById("bookingFeedback");
  const cat = window.CVRBookingCatalog;

  if (!bookingTypeSelect || !roomSection || !eventSection || !feedback || !cat) return;

  const isStaffBrowsing = typeof isStaffSession === "function" && isStaffSession(getCustomerSession?.());
  const blockStaffBooking = () => {
    if (!isStaffBrowsing) return false;
    feedback.textContent = "Admin and event manager accounts can't create bookings here. Manage reservations from the admin dashboard instead.";
    feedback.classList.remove("d-none", "alert-success");
    feedback.classList.add("alert-danger");
    feedback.scrollIntoView({ behavior: "smooth", block: "center" });
    return true;
  };

  const escapeHtml = (s) => {
    const d = document.createElement("div");
    d.textContent = String(s ?? "");
    return d.innerHTML;
  };

  const showMessage = (message, isError = false) => {
    feedback.textContent = message;
    feedback.classList.remove("d-none", "alert-success", "alert-danger");
    feedback.classList.add(isError ? "alert-danger" : "alert-success");
    if (isError) feedback.scrollIntoView({ behavior: "smooth", block: "center" });
    window.setTimeout(() => feedback.classList.add("d-none"), 8000);
  };

  const playSwitchAnim = (el) => {
    if (!el) return;
    el.classList.remove("cvr-filter-anim");

    void el.offsetWidth;
    el.classList.add("cvr-filter-anim");
  };

  const stayDurationWrap = document.getElementById("cvrStayDurationWrap");
  const roomTimingNote = document.getElementById("cvrRoomTimingNote");
  const filterRow = document.getElementById("bookingFilterRow");

  const toggleSections = () => {
    const isRoom = bookingTypeSelect.value === "room";
    const isMultiDay = isRoom && getSelectedDuration() === "extended";
    roomSection.classList.toggle("d-none", !isRoom);
    eventSection.classList.toggle("d-none", isRoom);
    stayDurationWrap?.classList.toggle("d-none", !isRoom);
    document.getElementById("cvrCheckInTimeWrap")?.classList.toggle("d-none", !isMultiDay);
    document.getElementById("cvrRoomCheckOutTimeWrap")?.classList.toggle("d-none", !isMultiDay);
    document.getElementById("cvrCheckOutWrap")?.classList.toggle("d-none", !isMultiDay);
    roomTimingNote?.classList.toggle("d-none", !isRoom);

    filterRow?.classList.toggle("cvr-filter-event-mode", !isRoom);
    playSwitchAnim(filterRow);

    playSwitchAnim(isRoom ? roomSection : eventSection);
  };

  const setDefaultDates = () => {
    const checkIn = document.getElementById("checkInDate");
    if (!checkIn) return;
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const iso = (d) => d.toISOString().slice(0, 10);
    if (!checkIn.value) checkIn.value = iso(tomorrow);
    checkIn.min = iso(today);
  };

  const getSelectedDuration = () => document.getElementById("stayDuration")?.value || "";

  const getRawExtendedNights = () => {
    const checkIn = document.getElementById("checkInDate")?.value || "";
    const checkOut = document.getElementById("checkOutDate")?.value || "";
    if (!checkIn || !checkOut) return 0;
    return cat.countNightsBetween ? cat.countNightsBetween(checkIn, checkOut) : 0;
  };
  const getSelectedNights = () => window.CVRDuration?.clampExtendedNights(getRawExtendedNights() || 2) ?? 2;

  const checkOutWrap = document.getElementById("cvrCheckOutWrap");
  const checkOutDateHidden = document.getElementById("checkOutDate");
  const checkInTimeWrap = document.getElementById("cvrCheckInTimeWrap");
  const roomCheckOutTimeWrap = document.getElementById("cvrRoomCheckOutTimeWrap");
  const extOpt = window.CVRDuration?.get("extended");
  const extMinNights = extOpt?.minNights ?? 2;
  const extMaxNights = extOpt?.maxNights ?? 14;

  const readTimeTriplet = (hourId, minuteId, meridiemId) => {
    const hour = document.getElementById(hourId)?.value ?? "";
    const minute = document.getElementById(minuteId)?.value ?? "";
    const meridiem = document.getElementById(meridiemId)?.value ?? "";
    const anyFilled = Boolean(hour || minute !== "" || meridiem);
    const allFilled = Boolean(hour && minute !== "" && meridiem);
    const parsed = allFilled ? window.CVRDuration?.parse12HourTime?.(hour, minute, meridiem) || null : null;
    const allowed = parsed ? Boolean(window.CVRDuration?.isCustomCheckInTimeAllowed?.(parsed)) : false;
    return {
      time: allowed ? parsed : null,
      incomplete: anyFilled && !allFilled,
      outOfRange: Boolean(parsed) && !allowed,
    };
  };

  const getCheckInTimeSelection = () => readTimeTriplet("cvrCheckInHour", "cvrCheckInMinute", "cvrCheckInMeridiem");

  const getCheckOutTimeSelection = () => readTimeTriplet("cvrCheckOutHour", "cvrCheckOutMinute", "cvrCheckOutMeridiem");

  const applyDefaultCheckInTimeForDuration = () => {
    ["cvrCheckInHour", "cvrCheckInMinute", "cvrCheckInMeridiem", "cvrCheckOutHour", "cvrCheckOutMinute", "cvrCheckOutMeridiem"].forEach((id) => {
      const el = document.getElementById(id);
      if (el) el.value = "";
    });
  };

  const syncCheckOutVisibility = () => {
    const isExtended = getSelectedDuration() === "extended";
    checkOutWrap?.classList.toggle("d-none", !isExtended);
    roomCheckOutTimeWrap?.classList.toggle("d-none", !isExtended);
    checkInTimeWrap?.classList.toggle("d-none", !isExtended);
    applyDefaultCheckInTimeForDuration();
    playSwitchAnim(filterRow);
  };
  document.getElementById("stayDuration")?.addEventListener("change", () => {
    syncCheckOutVisibility();

    renderRoomCards();
  });

  document.getElementById("checkInDate")?.addEventListener("change", () => renderRoomCards());
  checkOutDateHidden?.addEventListener("change", () => renderRoomCards());

  ["cvrCheckInHour", "cvrCheckInMinute", "cvrCheckInMeridiem"].forEach((id) => {
    document.getElementById(id)?.addEventListener("change", () => renderRoomCards());
  });
  syncCheckOutVisibility();

  // Mobile/tablet: floating shortcut back to the date filters once they scroll out of view.
  const floatBtn = document.getElementById("bkFloat");
  const filterCard = document.getElementById("bkFilterCard");
  if (floatBtn && filterCard && "IntersectionObserver" in window) {
    new IntersectionObserver(([entry]) => floatBtn.classList.toggle("show", !entry.isIntersecting && bookingTypeSelect.value === "room"), { threshold: 0 }).observe(filterCard);
    floatBtn.addEventListener("click", () => filterCard.scrollIntoView({ behavior: "smooth", block: "start" }));
  }

  const validateRoomBooking = (pkg, checkIn, durationKey, guestsNum, nights, checkInSelection, checkOutSelection) => {
    if (!checkIn) return "Please select your check-in date.";
    const today = new Date().toISOString().slice(0, 10);
    if (checkIn < today) return "Check-in date cannot be in the past.";
    if (!window.CVRDuration?.get(durationKey)) return "Please select a stay duration.";
    if (durationKey === "extended") {
      const checkOut = document.getElementById("checkOutDate")?.value || "";
      if (!checkOut) return "Please select your check-out date.";
      const rawNights = getRawExtendedNights();
      if (rawNights < extMinNights || rawNights > extMaxNights) {
        return `Multi-Day / Extended Stay must be between ${extMinNights} and ${extMaxNights} nights. Please choose a different check-out date.`;
      }
    }

    if (durationKey === "extended") {
      if (checkInSelection.incomplete) {
        return "Choose hour, minutes, and AM/PM for your arrival time, or clear all three to use the standard time.";
      }
      if (checkInSelection.outOfRange) {
        return "Please choose a valid arrival time.";
      }
      if (checkOutSelection.incomplete) {
        return "Choose hour, minutes, and AM/PM for your departure time, or clear all three to use the standard time.";
      }
      if (checkOutSelection.outOfRange) {
        return "Please choose a valid departure time.";
      }
    }
    if (guestsNum < pkg.capacity.min || guestsNum > pkg.capacity.max) {
      return `This package allows ${pkg.capacity.min}–${pkg.capacity.max} guests.`;
    }
    if (typeof window.roomStayOverlapsExisting === "function") {
      const win = window.CVRDuration.buildWindow(checkIn, durationKey, nights, checkInSelection.time, checkOutSelection.time);
      if (win && window.roomStayOverlapsExisting(pkg.id, pkg.title, win.checkInDateOnly, win.checkOutDateOnly, "", win.scheduledCheckIn, win.scheduledCheckOut)) {
        return "Sorry, that fixed time slot was just booked for this room. Please choose a different date or duration.";
      }
    }
    return "";
  };

  const bookRoom = (packageId) => {
    if (blockStaffBooking()) return;
    const pkg = cat.getRoomPackageById(packageId);
    if (!pkg) {
      showMessage("Package not found. Please refresh the page.", true);
      return;
    }
    const checkIn = document.getElementById("checkInDate")?.value || "";
    const durationKey = getSelectedDuration();
    const nights = durationKey === "extended" ? getSelectedNights() : 1;
    const checkInSelection = getCheckInTimeSelection();
    const checkOutSelection = durationKey === "extended" ? getCheckOutTimeSelection() : { time: null, incomplete: false, outOfRange: false };
    // Guests are what the visitor typed in the room dialog: adults and kids are counted separately.
    const roomAdults = Math.max(0, parseInt(document.getElementById("roomAdults")?.value, 10) || 0);
    const roomChildren = Math.max(0, parseInt(document.getElementById("roomChildren")?.value, 10) || 0);
    const guestsNum = roomAdults + roomChildren;
    if (roomAdults < 1) {
      showMessage("Please enter at least one adult.", true);
      return;
    }

    const err = validateRoomBooking(pkg, checkIn, durationKey, guestsNum, nights, checkInSelection, checkOutSelection);
    if (err) {
      showMessage(err, true);
      return;
    }

    const win = window.CVRDuration.buildWindow(checkIn, durationKey, nights, checkInSelection.time, checkOutSelection.time);

    cat.setPendingReservation({
      bookingType: "room",
      packageId: pkg.id,
      durationKey,
      extendedNights: durationKey === "extended" ? nights : null,
      customCheckInTime: win.customCheckInTime,
      customCheckOutTime: win.customCheckOutTime,
      checkInDate: win.checkInDateOnly,
      checkOutDate: win.checkOutDateOnly,
      scheduledCheckIn: win.scheduledCheckIn,
      scheduledCheckOut: win.scheduledCheckOut,
      checkInLabel: win.checkInLabel,
      checkOutLabel: win.checkOutLabel,
      guests: guestsNum,
      adults: roomAdults,
      children: roomChildren,
      createdAt: new Date().toISOString(),
    });
    if (typeof window.cvrGoToReservationForm === "function") window.cvrGoToReservationForm();
    else window.location.href = "reservation-form.html";
  };
  window.cvrBookRoom = bookRoom;

  const renderRoomCards = () => {
    const grid = document.getElementById("roomPackagesGrid");
    if (!grid) return;
    const durationKey = getSelectedDuration();
    const duration = window.CVRDuration?.get(durationKey);
    const checkIn = document.getElementById("checkInDate")?.value || "";
    const rawNights = getRawExtendedNights();
    const extendedNightsValid = durationKey === "extended" && rawNights >= extMinNights && rawNights <= extMaxNights;
    const extendedNights = extendedNightsValid ? rawNights : extMinNights;
    const checkInSelection = durationKey === "extended" ? getCheckInTimeSelection() : { time: null };
    const checkOutSelection = durationKey === "extended" ? getCheckOutTimeSelection() : { time: null };
    const extendedWindow = durationKey === "extended" && extendedNightsValid
      ? window.CVRDuration?.buildWindow(checkIn || "2000-01-01", "extended", extendedNights, checkInSelection.time, checkOutSelection.time)
      : null;
    const timing = duration
      ? durationKey === "extended"
        ? extendedWindow
          ? `${extendedWindow.checkInLabel} check-in · ${extendedWindow.checkOutLabel} check-out`
          : "Select valid dates to see the Multi-Day schedule"
        : `${duration.checkInLabel}–${duration.checkOutLabel}`
      : "Choose a stay duration to see the fixed schedule";
    const fixedTimingText = document.getElementById("cvrRoomTimingText");
    if (fixedTimingText) {
      fixedTimingText.innerHTML = `<i class="bi bi-alarm me-1"></i>${escapeHtml(timing)}${durationKey === "extended" ? ". Flexible times are available for Multi-Day stays only." : durationKey ? ". Check-in and check-out times are fixed." : ". Only Multi-Day stays allow flexible times."} Overtime is billed past the scheduled check-out.`;
    }

    const allPackages = cat.getRoomPackages({ activeOnly: true });
    const canCheckAvailability = Boolean(
      duration &&
      checkIn &&
      (durationKey !== "extended" || (extendedNightsValid && extendedWindow))
    );
    const availablePackages = canCheckAvailability && typeof window.roomStayOverlapsExisting === "function"
      ? allPackages.filter((pkg) => {
        const stay = durationKey === "extended"
          ? extendedWindow
          : window.CVRDuration?.buildWindow(checkIn, durationKey, null, null, null);
        return !stay || !window.roomStayOverlapsExisting(
          pkg.id,
          pkg.title,
          stay.checkInDateOnly,
          stay.checkOutDateOnly,
          "",
          stay.scheduledCheckIn,
          stay.scheduledCheckOut
        );
      })
      : allPackages;
    grid.dataset.availableCount = String(availablePackages.length);
    grid.dataset.searchApplied = String(canCheckAvailability);

    if (!availablePackages.length) {
      grid.innerHTML = `<div class="col-12"><div class="alert alert-info mb-0">No rooms are available for the selected date and fixed time. Choose another date or duration.</div></div>`;
    } else {
      grid.innerHTML = availablePackages
      .map((pkg) => {
        const inc = pkg.inclusions.slice(0, 4).join(" · ");
        const more = pkg.inclusions.length > 4 ? " +" + (pkg.inclusions.length - 4) + " more" : "";
        const dur = window.CVRDuration;
        const rate3 = dur ? dur.roomRate(pkg.pricePerNight, "3hr") : 0;
        const rate12 = dur ? dur.roomRate(pkg.pricePerNight, "12hr") : 0;
        const rate24 = dur ? dur.roomRate(pkg.pricePerNight, "24hr") : 0;
        const rateExtended = dur ? dur.roomRate(pkg.pricePerNight, "extended", extendedNights) : 0;
        const standardSchedule = (key) => {
          const option = dur?.get(key);
          return option ? `${option.checkInLabel}–${option.checkOutLabel}` : "";
        };
        const rateBox = (key, label, time, price) => `<div class="bk-rate${durationKey === key ? " is-selected" : ""}"${durationKey === key ? ' aria-current="true"' : ""}><span class="l">${label}</span><span class="t">${time}</span><span class="p">${cat.formatMoney(price, pkg.currency)}</span></div>`;
        const extBox = extendedNightsValid
          ? `<div class="bk-rate ext${durationKey === "extended" ? " is-selected" : ""}"${durationKey === "extended" ? ' aria-current="true"' : ""}><span class="l">Multi-Day</span><span class="t">${extendedNights} night${extendedNights !== 1 ? "s" : ""} · ${escapeHtml(timing)}</span><span class="p">${cat.formatMoney(rateExtended, pkg.currency)}</span></div>`
          : `<div class="bk-rate ext${durationKey === "extended" ? " is-selected" : ""}"><span class="l">Multi-Day</span><span class="t">${extMinNights}–${extMaxNights} nights</span><span class="p hint">Pick valid dates above</span></div>`;
        const selectedPrice = durationKey === "3hr" ? cat.formatMoney(rate3, pkg.currency)
          : durationKey === "12hr" ? cat.formatMoney(rate12, pkg.currency)
          : durationKey === "24hr" ? cat.formatMoney(rate24, pkg.currency)
          : durationKey === "extended" && extendedNightsValid ? cat.formatMoney(rateExtended, pkg.currency)
          : "";
        const priceBadge = selectedPrice
          ? `from <strong>${selectedPrice}</strong> · ${escapeHtml(timing)}`
          : durationKey === "extended"
            ? "Select a valid Multi-Day date range"
            : "Select a stay duration";
        return `
      <div class="col-12 col-md-6 col-lg-4" id="pkg-${pkg.id}">
        <div class="soft-card overflow-hidden h-100 booking-room-card d-flex flex-column">
          <div class="room-cover-wrap" data-package-id="${escapeHtml(pkg.id)}" role="button" tabindex="0" aria-label="View ${escapeHtml(pkg.title)} details and reviews">
            <img class="room-cover" loading="lazy" src="${window.cvrResolvePackageImage ? cvrResolvePackageImage(pkg.image) : pkg.image}" alt="${escapeHtml(pkg.title)}">
            <span class="bk-price-badge">${priceBadge}</span>
            <div class="room-cover-overlay">
              <span class="room-cover-overlay-pill"><i class="bi bi-zoom-in me-1"></i>View details &amp; reviews</span>
            </div>
          </div>
          <div class="p-4 d-flex flex-column flex-grow-1">
            <div>
              <h5 class="text-brand">${pkg.title}</h5>
              <p class="small text-muted-brand mb-0">${pkg.tagline}</p>
            </div>
            <ul class="bk-chips">
              <li><i class="bi bi-people"></i>${pkg.capacity.min}–${pkg.capacity.max} guests</li>
              <li><i class="bi bi-rulers"></i>${pkg.areaSqm} m²</li>
              <li><i class="bi bi-moon-stars"></i>${pkg.bed}</li>
            </ul>
            <p class="bk-desc">${pkg.description}</p>
            <p class="bk-incl"><b>Includes:</b> ${inc}${more}</p>
            <div class="bk-rates">
              ${rateBox("3hr", "3-Hour Quick Stay", standardSchedule("3hr"), rate3)}
              ${rateBox("12hr", "12-Hour Day Tour", standardSchedule("12hr"), rate12)}
              ${rateBox("24hr", "24-Hour Overnight", standardSchedule("24hr"), rate24)}
              ${extBox}
            </div>
            <details class="bk-note">
              <summary>Timing &amp; overtime info</summary>
              <p class="mt-1 mb-0">${escapeHtml(pkg.availabilityNote)} Check-in and check-out times are fixed for 3-, 12-, and 24-hour stays. Only Multi-Day stays allow flexible times; overtime is billed per hour past check-out.</p>
            </details>
            <div class="bk-actions">
              <button type="button" class="btn btn-outline-primary room-view-btn" data-package-id="${pkg.id}"><i class="bi bi-eye me-1"></i>Details</button>
              ${isStaffBrowsing ? "" : `<button type="button" class="btn btn-brand booking-now-btn room-book-btn" data-package-id="${pkg.id}"${duration ? "" : " disabled"}>Book Now</button>`}
            </div>
          </div>
        </div>
      </div>`;
      })
      .join("");
    }

    const metaEl = document.getElementById("bkResultsMeta");
    if (metaEl) {
      const count = grid.querySelectorAll(".booking-room-card").length;
      const durSel = document.getElementById("stayDuration");
      const durText = durSel?.selectedOptions?.[0]?.textContent?.trim() || "";
      const dateText = document.getElementById("checkInDateDisplay")?.value || "";
      metaEl.innerHTML = `<strong>${count}</strong> room${count !== 1 ? "s" : ""} shown${dateText ? ` · ${escapeHtml(dateText)}` : ""}${durText ? ` · ${escapeHtml(durText)}` : ""}`;
    }

    grid.querySelectorAll(".room-cover-wrap").forEach((wrap) => {
      const open = () => window.cvrShowRoomDetails?.(wrap.dataset.packageId);
      wrap.addEventListener("click", open);
      wrap.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          open();
        }
      });
    });

    grid.querySelectorAll(".room-view-btn").forEach((button) => {
      button.addEventListener("click", () => window.cvrShowRoomDetails?.(button.dataset.packageId));
    });

    grid.querySelectorAll(".room-book-btn").forEach((button) => {
      button.addEventListener("click", () => {
        if (typeof window.cvrShowRoomDetails === "function") window.cvrShowRoomDetails(button.dataset.packageId);
        else bookRoom(button.dataset.packageId);
      });
    });

    const params = new URLSearchParams(window.location.search);
    const pre = params.get("package");
    if (pre) {
      const el = document.getElementById(`pkg-${pre}`);
      el?.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  };

  let eventPreferredCalendarReady = false;
  const ensureEventPreferredCalendar = () => {
    if (eventPreferredCalendarReady) return;
    if (typeof window.initEventPreferredDateCalendar === "function") {
      window.initEventPreferredDateCalendar();
      eventPreferredCalendarReady = true;
    }
  };

  bookingTypeSelect.addEventListener("change", () => {
    toggleSections();
    syncCheckOutVisibility();
    if (bookingTypeSelect.value === "event") ensureEventPreferredCalendar();
  });
  toggleSections();
  if (bookingTypeSelect.value === "event") ensureEventPreferredCalendar();
  setDefaultDates();
  renderRoomCards();

  const searchBtn = document.getElementById("bookingSearchBtn");
  searchBtn?.addEventListener("click", () => {
    toggleSections();
    const isRoom = bookingTypeSelect.value === "room";
    if (isRoom) {
      const checkIn = document.getElementById("checkInDate")?.value || "";
      if (!checkIn) {
        showMessage("Please select your arrival date.", true);
        return;
      }
      const durationKey = getSelectedDuration();
      if (!durationKey) {
        showMessage("Please select a stay duration.", true);
        return;
      }
      const selectedNights = durationKey === "extended" ? getRawExtendedNights() : 1;
      const extendedNightsValid = selectedNights >= extMinNights && selectedNights <= extMaxNights;
      if (durationKey === "extended" && !extendedNightsValid) {
        showMessage(`Choose a check-out date between ${extMinNights} and ${extMaxNights} nights after arrival.`, true);
        return;
      }
      renderRoomCards();
      const availableCount = Number(document.getElementById("roomPackagesGrid")?.dataset.availableCount || 0);
      document.getElementById("roomPackagesGrid")?.scrollIntoView({ behavior: "smooth", block: "start" });
      showMessage(`Found ${availableCount} available room${availableCount === 1 ? "" : "s"} for the selected ${window.CVRDuration?.get(durationKey)?.label} schedule.`);
      return;
    }
    document.getElementById("eventBookingSection")?.scrollIntoView({ behavior: "smooth", block: "start" });
    ensureEventPreferredCalendar();
    showMessage("Complete the event form below to continue.");
  });

  if (eventForm) {

    const PRIVATE_VENUE_PACKAGE_KEYS = [
      "Private Venue – Morning (8:00 AM–5:00 PM)",
      "Private Venue – Night (7:00 PM–5:00 AM)",
      "Private Venue – Whole Day (2 Sessions)",
    ];
    const VENUE_PACKAGE_KEYS = [
      ...PRIVATE_VENUE_PACKAGE_KEYS,
      "Wedding Package",
      "Debut Package",
    ];
    const BIRTHDAY_PACKAGE_KEYS = ["Ayesha Package", "Anica Package", "Amarah Package", "Custom Package"];

    const getFixedSchedule = (key) => PRIVATE_VENUE_PACKAGE_KEYS.includes(key)
      ? cat.getFixedEventSchedule?.(key, "") || null
      : null;
    const isBirthdayKey = (key) => Boolean(cat.isBirthdayPackage?.(key));

    const eventTypeEl = document.getElementById("eventType");
    const venueGroupEl = document.getElementById("eventTypeVenueGroup");
    const birthdayWrapEl = document.getElementById("eventBirthdayPackageWrap");
    const birthdayEl = document.getElementById("eventBirthdayPackage");
    const otherSpecifyWrapEl = document.getElementById("eventOtherSpecifyWrap");
    const otherSpecifyEl = document.getElementById("eventOtherSpecify");
    const detailsEl = document.getElementById("eventPackageDetails");
    const sessionWrapEl = document.getElementById("eventSessionWrap");
    const sessionEl = document.getElementById("eventSession");
    const sessionHintEl = document.getElementById("eventSessionHint");

    // Session picker (Morning / Night / Whole day) for events that are not Private Venue packages.
    const syncSessionOptions = (packageKey) => {
      if (!sessionWrapEl || !sessionEl) return [];
      const options = packageKey && cat.getEventSessionOptions ? cat.getEventSessionOptions(packageKey) : [];
      if (!options.length) {
        sessionWrapEl.classList.add("d-none");
<<<<<<< HEAD
        sessionEl.value = "";
        sessionEl.dataset.pkg = "";
        const clearCards = document.getElementById("eventSessionCards");
        if (clearCards) clearCards.innerHTML = "";
=======
        sessionEl.innerHTML = "";
        sessionEl.dataset.pkg = "";
>>>>>>> 5e658af493732b6c58daf423aa329e2c7aed3155
        if (sessionHintEl) sessionHintEl.textContent = "";
        return [];
      }
      sessionWrapEl.classList.remove("d-none");
<<<<<<< HEAD
      const cardsEl = document.getElementById("eventSessionCards");
      if (sessionEl.dataset.pkg !== packageKey && cardsEl) {
        const previous = sessionEl.value;
        const icons = { morning: "bi-sunrise", night: "bi-moon-stars", "whole-day": "bi-calendar-day" };
        cardsEl.innerHTML = options.map((o) => {
          const price = cat.formatMoney(cat.getEventSessionRate(packageKey, o.key), "PHP");
          return `<div class="col-12 col-md-4">
            <input type="radio" class="btn-check" name="eventSessionChoice" id="eventSession_${escapeHtml(o.key)}" value="${escapeHtml(o.key)}" autocomplete="off">
            <label class="btn btn-outline-primary cvr-session-card w-100 text-start" for="eventSession_${escapeHtml(o.key)}">
              <span class="d-flex align-items-center gap-2 mb-1"><i class="bi ${icons[o.key] || "bi-clock"} fs-5"></i><span class="fw-semibold">${escapeHtml(o.name)}</span></span>
              <span class="d-block small">${escapeHtml(o.label)}</span>
              <span class="d-block fw-bold mt-1">${escapeHtml(price)}</span>
            </label>
          </div>`;
        }).join("");
        sessionEl.dataset.pkg = packageKey;
        sessionEl.value = options.some((o) => o.key === previous) ? previous : "";
        cardsEl.querySelectorAll('input[name="eventSessionChoice"]').forEach((radio) => {
          radio.checked = radio.value === sessionEl.value;
          radio.addEventListener("change", () => {
            sessionEl.value = radio.value;
            sessionEl.dispatchEvent(new Event("change", { bubbles: true }));
          });
        });
=======
      if (sessionEl.dataset.pkg !== packageKey) {
        const previous = sessionEl.value;
        sessionEl.innerHTML = `<option value="">Select session</option>` + options.map((o) => {
          const price = cat.formatMoney(cat.getEventSessionRate(packageKey, o.key), "PHP");
          return `<option value="${escapeHtml(o.key)}">${escapeHtml(o.name)} · ${escapeHtml(o.label)} — ${escapeHtml(price)}</option>`;
        }).join("");
        sessionEl.dataset.pkg = packageKey;
        if (options.some((o) => o.key === previous)) sessionEl.value = previous;
>>>>>>> 5e658af493732b6c58daf423aa329e2c7aed3155
      }
      const chosen = cat.getEventSession?.(sessionEl.value);
      if (sessionHintEl) sessionHintEl.textContent = chosen ? `${chosen.name}: ${chosen.label}` : "Choose the time slot for your event.";
      return options;
    };

    const syncOtherSpecifyVisibility = () => {
      if (!otherSpecifyWrapEl) return;
      const isOthers = eventTypeEl?.value === "Others";
      otherSpecifyWrapEl.classList.toggle("d-none", !isOthers);
      if (!isOthers && otherSpecifyEl) otherSpecifyEl.value = "";
    };

    if (cat.getEventPackageKeys) {
      const activeKeys = new Set(cat.getEventPackageKeys({ activeOnly: true }));

      if (eventTypeEl && venueGroupEl) {
        const currentValue = eventTypeEl.value;
        venueGroupEl.innerHTML = VENUE_PACKAGE_KEYS.filter((k) => activeKeys.has(k))
          .map((key) => `<option value="${escapeHtml(key)}">${escapeHtml(key)}</option>`)
          .join("");
        if (currentValue) eventTypeEl.value = currentValue;
      }

      if (birthdayEl) {
        const currentValue = birthdayEl.value;
        birthdayEl.innerHTML =
          `<option value="">Select package</option>` +
          BIRTHDAY_PACKAGE_KEYS.filter((k) => activeKeys.has(k))
            .map((key) => `<option value="${escapeHtml(key)}">${escapeHtml(key)}</option>`)
            .join("");
        if (BIRTHDAY_PACKAGE_KEYS.includes(currentValue)) birthdayEl.value = currentValue;
      }
    }

    const getSelectedPackageKey = () => {
      const typeVal = eventTypeEl?.value || "";
      if (cat.getEventPackageCatalog(typeVal)) return typeVal;
      if (typeVal === "Birthday") return birthdayEl?.value || "";
      return "";
    };

    const syncBirthdayPackageVisibility = () => {
      if (!birthdayWrapEl) return;
      const isBirthday = eventTypeEl?.value === "Birthday";
      birthdayWrapEl.classList.toggle("d-none", !isBirthday);
      if (!isBirthday && birthdayEl) birthdayEl.value = "";
    };

    const renderPackageDetails = () => {
      if (!detailsEl) return;
      const key = getSelectedPackageKey();
      const pkg = cat.getEventPackageCatalog(key);
      const sessionOptions = syncSessionOptions(key);
      const selectedSession = sessionOptions.length ? (cat.getEventSession?.(sessionEl?.value) || null) : null;
      const motifWrap = document.getElementById("eventMotifBookingWrap");
      const motifSelect = document.getElementById("eventMotifSelect");
      if (motifWrap && motifSelect && cat.getEventMotifs) {
        const motifs = cat.getEventMotifs(key);
        if (motifs.length) {
          motifWrap.classList.remove("d-none");
          motifSelect.innerHTML =
            `<option value="">Select on next step (or choose now)</option>` +
            motifs.map((m) => `<option value="${escapeHtml(m.id)}">${escapeHtml(m.label)}</option>`).join("");
        } else {
          motifWrap.classList.add("d-none");
          motifSelect.innerHTML = "";
        }
      }
      if (!pkg) {
        detailsEl.classList.add("d-none");
        detailsEl.innerHTML = "";
        return;
      }

      const fixedSchedule = key ? getFixedSchedule(key) : null;
      const durationKey = fixedSchedule?.durationKey || selectedSession?.durationKey || "12hr";
      const durationRate = selectedSession
        ? cat.getEventSessionRate(key, selectedSession.key)
        : pkg.flatRate
        ? Math.max(0, Number(pkg.price) || 0)
        : pkg.doubleRateOn24hr && durationKey === "24hr"
        ? (cat.cvrWholeDayRate ? cat.cvrWholeDayRate(pkg) : Math.max(0, Number(pkg.price) || 0) * 2)
        : window.CVRDuration
        ? window.CVRDuration.eventRate(pkg.price, durationKey)
        : pkg.price;
      const guestCountVal = Number(document.getElementById("eventGuests")?.value) || 0;
      const paxSurcharge = cat.calculatePaxSurcharge ? cat.calculatePaxSurcharge(guestCountVal, key, eventTypeEl?.value || "") : null;
      const totalWithSurcharge = durationRate + (paxSurcharge?.price || 0);
      const money = cat.formatMoney(totalWithSurcharge, "PHP");
      const paxLabel = isBirthdayKey(key)
        ? `Birthday package · no additional guest surcharge · maximum ${cat.EVENT_MAX_GUESTS || 200} guests`
        : `Includes ${cat.EVENT_INCLUDED_GUESTS || 50} guests · maximum ${cat.EVENT_MAX_GUESTS || 200} · +₱${(cat.EVENT_EXTRA_GUEST_RATE || 1500).toLocaleString()} per additional ${cat.EVENT_INCLUDED_GUESTS || 50}-guest band`;
      const priceLabel = fixedSchedule
        ? `package price · ${fixedSchedule.name} (${fixedSchedule.label})`
        : selectedSession
        ? `package price · ${selectedSession.name} (${selectedSession.label})`
        : sessionOptions.length
        ? "starting price · choose a session above"
        : pkg.flatRate
        ? "flat package price · single-day event"
        : pkg.isCustom
        ? "starting price · single-day event"
        : "package price · single-day event";
      const addOnCount = cat.getPackageAddOns("event", key).length;
      detailsEl.classList.remove("d-none");
      const mediaKind = pkg.image && window.CVRPackageMedia ? window.CVRPackageMedia.kindOf(pkg.image) : "image";
      const coverUrl = pkg.image ? (window.cvrResolvePackageImage ? cvrResolvePackageImage(pkg.image) : pkg.image) : "";
      const coverDarkUrl = pkg.imageDark && mediaKind === "image" ? (window.cvrResolvePackageImage ? cvrResolvePackageImage(pkg.imageDark) : pkg.imageDark) : "";
      // Same look as the room cards: photo + price badge + "View details" overlay.
      // Photos open the details dialog; other file types (PDF, video, docs...) open the file viewer.
      const photo = !pkg.image
        ? ""
        : mediaKind === "image"
        ? `<div class="room-cover-wrap bk-event-cover${isBirthdayKey(key) ? " cvr-themed-photo" : ""}${coverDarkUrl ? " cvr-has-dark" : ""}" data-event-details role="button" tabindex="0" aria-label="View ${escapeHtml(key)} package details">
            <img class="room-cover${coverDarkUrl ? " cvr-img-light" : ""}" src="${escapeHtml(coverUrl)}" alt="${escapeHtml(key)}">${coverDarkUrl ? `<img class="room-cover cvr-img-dark" src="${escapeHtml(coverDarkUrl)}" alt="${escapeHtml(key)}">` : ""}
            <span class="bk-price-badge"><strong>${escapeHtml(money)}</strong></span>
            <div class="room-cover-overlay"><span class="room-cover-overlay-pill"><i class="bi bi-zoom-in me-1"></i>View package details</span></div>
          </div>`
        : window.CVRPackageMedia.render(pkg.image, key, { themed: isBirthdayKey(key), dark: pkg.imageDark });
      lastEventView = { key, pkg, money, paxLabel, priceLabel, durationKey, guestCountVal, paxSurcharge };
      detailsEl.innerHTML = `
        <div class="soft-card overflow-hidden border bk-event-pkg">
          ${photo}
          <div class="p-3">
          <div class="d-flex justify-content-between align-items-start gap-2 flex-wrap">
            <div>
              <h6 class="text-brand mb-1">${escapeHtml(key)}</h6>
              <div class="small text-muted-brand">${escapeHtml(paxLabel)}</div>
            </div>
            <div class="text-end">
              <div class="fw-semibold text-brand">${escapeHtml(money)}</div>
              <div class="small text-muted-brand">${escapeHtml(priceLabel)}</div>
              ${paxSurcharge ? `<div class="small text-primary mt-1">+ ${escapeHtml(cat.formatMoney(paxSurcharge.price, "PHP"))} for ${escapeHtml(String(guestCountVal))} guests</div>` : ""}
            </div>
          </div>
          <hr class="my-3">
          <ul class="small text-muted-brand mb-0 ps-3">
            ${(pkg.inclusions || []).map((it) => `<li>${escapeHtml(it)}</li>`).join("")}
          </ul>
          ${
            pkg.isCustom
              ? `<div class="small text-primary mt-3 mb-0"><i class="bi bi-stars me-1"></i>Mix and match — choose your own lighting, sound, motif, and decor add-ons on the next step (${addOnCount} options available).</div>`
              : ""
          }
          ${pkg.image && mediaKind === "image" ? `<button type="button" class="btn btn-outline-primary btn-sm mt-3" data-event-details><i class="bi bi-info-circle me-1"></i>View package details</button>` : ""}
          </div>
        </div>
      `;
    };

    // ---- Event package details dialog (same style as the room details dialog) ----
    let lastEventView = null;
    const openEventDetails = () => {
      const v = lastEventView;
      const modalEl = document.getElementById("eventDetailsModal");
      if (!v || !modalEl || typeof bootstrap === "undefined") return;
      const { key, pkg } = v;
      const q = (sel) => modalEl.querySelector(sel);
      q("#eventDetailsTitle").textContent = key;
      q("#eventDetailsTagline").textContent = v.paxLabel;
      q("#eventDetailsPrice").textContent = v.money;
      q("#eventDetailsPriceNote").textContent = v.priceLabel;
      q("#eventDetailsSurcharge").textContent = v.paxSurcharge
        ? `+ ${cat.formatMoney(v.paxSurcharge.price, "PHP")} for ${v.guestCountVal} guests`
        : "";
      const eventGalleryEl = q("#eventDetailsPhoto");
      if (pkg.image && window.CVRPackageMedia?.kindOf(pkg.image) === "image") {
        const images = [pkg.image, "../images/booking-photo-1.png", "../images/booking-photo-2.png", "../images/booking-photo-3.png"]
          .filter((image, index, list) => image && list.indexOf(image) === index);
        const galleryId = "eventDetailsGallery";
        eventGalleryEl.innerHTML = `
          <div id="${galleryId}" class="carousel slide cvr-booking-gallery" data-bs-ride="false" aria-label="${escapeHtml(key)} photo gallery">
            <div class="carousel-inner">
              ${images.map((image, index) => {
                const src = window.cvrResolvePackageImage ? cvrResolvePackageImage(image) : image;
                const caption = index === 0 ? `${key} package` : `Casa Vergara venue view ${index}`;
                return `<div class="carousel-item${index === 0 ? " active" : ""}">
                  <img src="${escapeHtml(src)}" class="d-block w-100" alt="${escapeHtml(caption)}">
                  <div class="carousel-caption"><span>${escapeHtml(caption)}</span></div>
                </div>`;
              }).join("")}
            </div>
            ${images.length > 1 ? `<button class="carousel-control-prev" type="button" data-bs-target="#${galleryId}" data-bs-slide="prev" aria-label="Previous photo"><span class="carousel-control-prev-icon" aria-hidden="true"></span></button>
            <button class="carousel-control-next" type="button" data-bs-target="#${galleryId}" data-bs-slide="next" aria-label="Next photo"><span class="carousel-control-next-icon" aria-hidden="true"></span></button>` : ""}
          </div>`;
      } else {
        eventGalleryEl.innerHTML = pkg.image && window.CVRPackageMedia
          ? window.CVRPackageMedia.render(pkg.image, key, { themed: isBirthdayKey(key), dark: pkg.imageDark })
          : "";
      }

      const facts = [
        isBirthdayKey(key)
          ? `Birthday package: no additional guest surcharge · maximum ${cat.EVENT_MAX_GUESTS || 200} guests`
          : `Includes ${cat.EVENT_INCLUDED_GUESTS || 50} guests · +${cat.formatMoney(cat.EVENT_EXTRA_GUEST_RATE || 1500, "PHP")} per additional ${cat.EVENT_INCLUDED_GUESTS || 50}-guest band · maximum ${cat.EVENT_MAX_GUESTS || 200}`,
        "Single-day event booking",
          pkg.flatRate ? "Flat package price" : "",
      ].filter(Boolean);
      q("#eventDetailsFacts").innerHTML = facts.map((f) => `<li>${escapeHtml(f)}</li>`).join("");
      q("#eventDetailsInclusions").innerHTML = (pkg.inclusions || []).map((i) => `<li>${escapeHtml(i)}</li>`).join("");

      const addOns = cat.getPackageAddOns("event", key);
      q("#eventDetailsAddonsWrap").classList.toggle("d-none", !addOns.length);
      q("#eventDetailsAddons").innerHTML = addOns
        .map((a) => `<li>${escapeHtml(a.label)}${Number(a.price) ? ` <span class="text-brand fw-semibold">· ${escapeHtml(cat.formatMoney(Number(a.price), "PHP"))}${a.perPax ? " per guest" : ""}</span>` : ""}</li>`)
        .join("");

      const motifs = (cat.getEventMotifs ? cat.getEventMotifs(key) : pkg.motifs) || [];
      q("#eventDetailsMotifsWrap").classList.toggle("d-none", !motifs.length);
      q("#eventDetailsMotifs").innerHTML = motifs.map((m) => `<span class="bk-motif-chip">${escapeHtml(m.label)}</span>`).join("");

      const cont = q("#eventDetailsContinueBtn");
      if (cont) {
        cont.onclick = () => {
          bootstrap.Modal.getOrCreateInstance(modalEl).hide();
          document.getElementById("eventAdults")?.closest(".bk-form-section")?.scrollIntoView({ behavior: "smooth", block: "start" });
        };
      }
      bootstrap.Modal.getOrCreateInstance(modalEl).show();
    };
    detailsEl?.addEventListener("click", (e) => {
      if (e.target.closest("[data-event-details]")) openEventDetails();
    });
    detailsEl?.addEventListener("keydown", (e) => {
      if ((e.key === "Enter" || e.key === " ") && e.target.matches(".room-cover-wrap[data-event-details]")) {
        e.preventDefault();
        openEventDetails();
      }
    });

    eventTypeEl?.addEventListener("change", () => {
      syncBirthdayPackageVisibility();
      syncOtherSpecifyVisibility();
      renderPackageDetails();
      playSwitchAnim(eventForm);
    });
    birthdayEl?.addEventListener("change", () => {
      renderPackageDetails();
      playSwitchAnim(eventForm);
    });
    sessionEl?.addEventListener("change", () => renderPackageDetails());
    // The event calendar asks which slots (morning / night) the selected package + session needs.
    window.cvrEventRequestedSlots = () => {
      const key = getSelectedPackageKey();
      const sessionKey = cat.getEventSessionOptions?.(key)?.length ? (sessionEl?.value || "") : "";
      return window.cvrEventSlotsFor ? window.cvrEventSlotsFor(key, sessionKey) : null;
    };
    // Total guests, adults and kids are linked:
    //   - editing Adults or Kids updates the Total
    //   - editing the Total keeps the Kids count and adjusts Adults (at least 1 adult),
    //     and trims Kids only if the Total is too small to fit them
    const guestAdultsEl = document.getElementById("eventAdults");
    const guestKidsEl = document.getElementById("eventChildren");
    const guestTotalEl = document.getElementById("eventGuests");
    const maxEventGuests = cat.EVENT_MAX_GUESTS || 200;
    const readCount = (el, min) => Math.max(min, parseInt(el?.value, 10) || 0);

    const paintGuestSummary = (a, c) => {
      const text = document.getElementById("eventGuestTotalText");
      if (!text) return;
      const t = a + c;
      const overLimit = t > maxEventGuests;
      text.textContent = t === 0
        ? `No guests added yet · maximum ${maxEventGuests} guests`
        : `${t} guest${t !== 1 ? "s" : ""} in total: ${a} adult${a !== 1 ? "s" : ""}${c ? ` + ${c} kid${c !== 1 ? "s" : ""}` : ""} · maximum ${maxEventGuests}`;
      text.classList.toggle("text-danger", overLimit);
      text.classList.toggle("text-muted-brand", !overLimit);
    };
    // 0 shows as an empty box (placeholder "0") so nothing is pre-filled
    const setCount = (el, n) => { if (el) el.value = n > 0 ? String(n) : ""; };

    // source: "parts" (adults/kids edited) or "total" (total edited)
    const syncEventGuestTotal = (source = "parts") => {
      let a = readCount(guestAdultsEl, 0);
      let c = readCount(guestKidsEl, 0);
      if (source === "total") {
        const total = readCount(guestTotalEl, 0);
        if (total === 0) { a = 0; c = 0; }
        else {
          c = Math.min(c, Math.max(0, total - 1));
          a = Math.max(1, total - c);
        }
        setCount(guestAdultsEl, a);
        setCount(guestKidsEl, c);
      } else {
        setCount(guestTotalEl, a + c);
      }
      paintGuestSummary(a, c);
      renderPackageDetails();
    };
    guestAdultsEl?.addEventListener("input", () => syncEventGuestTotal("parts"));
    guestKidsEl?.addEventListener("input", () => syncEventGuestTotal("parts"));
    guestTotalEl?.addEventListener("input", () => {
      // let the field stay empty while typing; only sync once there is a number
      if (guestTotalEl.value === "") return;
      syncEventGuestTotal("total");
    });
    guestTotalEl?.addEventListener("blur", () => syncEventGuestTotal("total"));
    // +/- steppers next to each count
    document.querySelectorAll("[data-guest-step]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const target = document.getElementById(btn.dataset.guestTarget);
        if (!target) return;
        const current = parseInt(target.value, 10) || 0;
        const otherGuests = target === guestTotalEl ? 0
          : (parseInt(guestTotalEl?.value, 10) || 0) - current;
        const next = Math.max(0, Math.min(
          target === guestTotalEl ? maxEventGuests : maxEventGuests - otherGuests,
          current + Number(btn.dataset.guestStep)
        ));
        setCount(target, next);
        syncEventGuestTotal(target === guestTotalEl ? "total" : "parts");
      });
    });
    syncBirthdayPackageVisibility();
    syncOtherSpecifyVisibility();
    syncEventGuestTotal("parts");

    // Deep link from the homepage, e.g. booking.html?type=event&event=Wedding%20Package
    (() => {
      const qs = new URLSearchParams(window.location.search);
      if (qs.get("type") !== "event") return;
      bookingTypeSelect.value = "event";
      bookingTypeSelect.dispatchEvent(new Event("change"));
      const wanted = qs.get("event");
      if (wanted && eventTypeEl && Array.from(eventTypeEl.options).some((o) => o.value === wanted)) {
        eventTypeEl.value = wanted;
        eventTypeEl.dispatchEvent(new Event("change"));
      }
    })();

    eventForm.addEventListener("submit", (event) => {
      event.preventDefault();
      if (blockStaffBooking()) return;

      const rawEventType = eventTypeEl?.value || "";
      const otherSpecifyVal = (otherSpecifyEl?.value || "").trim();
      const packageOption = getSelectedPackageKey();
      const fixedSchedule = getFixedSchedule(packageOption);
      const sessionOptions = cat.getEventSessionOptions ? cat.getEventSessionOptions(packageOption) : [];
      const sessionKey = sessionOptions.length ? (sessionEl?.value || "") : "";
      const chosenSession = sessionKey ? cat.getEventSession?.(sessionKey) : null;
      const eventGuests = document.getElementById("eventGuests")?.value || "";
      const eventDateVal = document.getElementById("eventDate")?.value || "";
      const durationKey = fixedSchedule?.durationKey || chosenSession?.durationKey || "12hr";
      const additionalNotes = document.getElementById("eventNotes")?.value || "";

      const eventType = rawEventType === "Others" && otherSpecifyVal ? `Others - ${otherSpecifyVal}` : rawEventType;

      if (!rawEventType) {
        showMessage("Please select an event type.", true);
        return;
      }
      if (rawEventType === "Others" && !otherSpecifyVal) {
        showMessage("Please specify your event type.", true);
        return;
      }
      const eventAdults = Math.max(0, parseInt(document.getElementById("eventAdults")?.value, 10) || 0);
      const eventChildren = Math.max(0, parseInt(document.getElementById("eventChildren")?.value, 10) || 0);
      const adultInputValue = Number(document.getElementById("eventAdults")?.value || 0);
      const childInputValue = Number(document.getElementById("eventChildren")?.value || 0);
      if (!Number.isInteger(Number(eventGuests)) || !Number.isInteger(adultInputValue) || !Number.isInteger(childInputValue)) {
        showMessage("Guest counts must be whole numbers.", true);
        return;
      }
      if (eventAdults < 1) {
        showMessage("Please enter at least one adult.", true);
        return;
      }
      if (!eventGuests || Number(eventGuests) < 1) {
        showMessage("Enter a valid number of guests.", true);
        return;
      }
      if (Number(eventGuests) > maxEventGuests || eventAdults + eventChildren > maxEventGuests) {
        showMessage(`The maximum occupancy for the resort is ${maxEventGuests} guests per event.`, true);
        return;
      }
      if (sessionOptions.length && !chosenSession) {
        showMessage("Please select a session (morning, night, or whole day) for your event.", true);
        return;
      }
      if (!eventDateVal) {
        showMessage("Please choose a preferred date.", true);
        return;
      }
      if (!window.CVRDuration?.get(durationKey)) {
        showMessage("The selected event package is not available.", true);
        return;
      }

      const win = window.CVRDuration.buildFixedWindow(eventDateVal, "00:00", "00:00", "Single-day event");
      if (!win) {
        showMessage("Please select a valid event date.", true);
        return;
      }
      if (typeof window.cvrEventOverlapsExisting === "function" && window.cvrEventOverlapsExisting(win.scheduledCheckIn, win.scheduledCheckOut, "", window.cvrEventSlotsFor?.(packageOption, sessionKey))) {
        showMessage(sessionKey || fixedSchedule ? "Sorry, that session is already booked on this date. Please choose another session or date." : "Sorry, that event date is already booked or unavailable. Please choose another date.", true);
        return;
      }
      const totals = cat.calculateDurationEventTotal(eventDateVal, durationKey, packageOption, [], null, null, null, Number(eventGuests), sessionKey || null, rawEventType) || cat.calculateEventTotal(packageOption, [], Number(eventGuests), rawEventType);
      const motifSelect = document.getElementById("eventMotifSelect");
      const motifId = motifSelect?.value || "";
      const motifs = cat.getEventMotifs ? cat.getEventMotifs(packageOption) : [];
      const motif = motifs.find((m) => m.id === motifId) || null;

      cat.setPendingReservation({
        bookingType: "event",
        eventType,
        eventGuests: Number(eventGuests),
        adults: eventAdults,
        children: eventChildren,
        preferredDate: win.checkInDateOnly,
        durationKey: totals?.durationKey || durationKey,
        durationLabel: totals?.durationLabel || "Single-day event",
        extendedNights: null,
        scheduledCheckIn: win.scheduledCheckIn,
        scheduledCheckOut: win.scheduledCheckOut,
        checkInLabel: "",
        checkOutLabel: "",
        checkOutDate: eventDateVal,
        customCheckInTime: null,
        customCheckOutTime: null,
        eventTime: totals?.eventTime || "",
        packageOption,
        eventSession: chosenSession ? chosenSession.key : null,
        additionalNotes,
        motif,
        ...totals,
        durationLabel: totals?.durationLabel || "Single-day event",
        extendedNights: null,
        scheduledCheckIn: win.scheduledCheckIn,
        scheduledCheckOut: win.scheduledCheckOut,
        checkInLabel: "",
        checkOutLabel: "",
        checkOutDate: eventDateVal,
        customCheckInTime: null,
        customCheckOutTime: null,
        eventTime: totals?.eventTime || "",
        eventSession: chosenSession ? chosenSession.key : null,
        currency: "PHP",
        createdAt: new Date().toISOString(),
      });

      if (typeof window.cvrGoToReservationForm === "function") window.cvrGoToReservationForm();
    else window.location.href = "reservation-form.html";
    });
  }
}
