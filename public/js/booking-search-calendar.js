

(function () {
  const MAX_YEAR = 2030;

  function formatYMD(d) {
    if (!(d instanceof Date) || Number.isNaN(d.getTime())) return "";
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  }

  function formatPretty(ymd) {
    if (!ymd) return "";
    const d = new Date(`${ymd}T12:00:00`);
    if (Number.isNaN(d.getTime())) return "";
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  }

  function addDays(d, n) {
    const copy = new Date(d.getTime());
    copy.setDate(copy.getDate() + n);
    return copy;
  }

  function extendedNightsRange() {
    const opt = window.CVRDuration?.get("extended");
    return { min: opt?.minNights ?? 2, max: opt?.maxNights ?? 14 };
  }

  window.initBookingSearchDateRange = function () {
    const inWrap = document.getElementById("cvrCheckInWrap");
    const outWrap = document.getElementById("cvrCheckOutWrap");
    const inDisplay = document.getElementById("checkInDateDisplay");
    const outDisplay = document.getElementById("checkOutDateDisplay");
    const inHidden = document.getElementById("checkInDate");
    const outHidden = document.getElementById("checkOutDate");

    const inAnchor = document.getElementById("cvrCheckInAnchor");
    const outAnchor = document.getElementById("cvrCheckOutAnchor");
    if (
      !inWrap || !outWrap || !inDisplay || !outDisplay ||
      !inHidden || !outHidden || !inAnchor || !outAnchor ||
      typeof flatpickr === "undefined"
    ) {
      return;
    }

    // Phones get a bottom-sheet calendar with a dimmed backdrop (see calendars.css).
    const isPhone = () => window.matchMedia("(max-width: 575.98px)").matches;
    function sheetOpen() {
      if (isPhone()) document.body.classList.add("cvr-fp-sheet-open");
    }
    function sheetClose() {
      // deferred: when switching check-in → check-out, one closes as the other opens
      setTimeout(() => {
        if (!document.querySelector(".flatpickr-calendar.cvr-search-fp.open")) {
          document.body.classList.remove("cvr-fp-sheet-open");
        }
      }, 0);
    }

    // Keep both calendars showing the same highlighted stay (check-in → check-out).
    function redrawStay() {
      try { fpIn.redraw(); } catch (e) { /* not ready yet */ }
      try { fpOut.redraw(); } catch (e) { /* not ready yet */ }
    }

    function holidayDayCreate(_dObj, _dStr, _instance, dayElem) {
      if (!dayElem || !dayElem.dateObj) return;
      const ymd = formatYMD(dayElem.dateObj);
      const ci = inHidden.value;
      const co = outHidden.value;
      if (ci && co && co > ci && ymd >= ci && ymd <= co) {
        dayElem.classList.add("cvr-cal-day-stay");
        if (ymd === ci) dayElem.classList.add("cvr-cal-day-stay-start");
        if (ymd === co) dayElem.classList.add("cvr-cal-day-stay-end");
      }
      const holiday = typeof window.getPHHoliday === "function" ? window.getPHHoliday(ymd) : null;
      if (!holiday) return;
      dayElem.classList.add("cvr-cal-day-holiday");
      dayElem.setAttribute("title", `${holiday.name} (${holiday.typeLabel})`);
    }

    function legendHtml() {
      return `
        <div class="cvr-search-fp-legend">
          <span class="d-inline-flex align-items-center gap-2"><span class="cvr-legend-swatch cvr-legend-holiday"></span>PH holiday</span>
        </div>`;
    }

    function footerHtml() {
      return `
        <div class="cvr-search-fp-footer">
          <button type="button" class="cvr-search-fp-btn cvr-search-fp-clear">Clear</button>
          <button type="button" class="cvr-search-fp-btn cvr-search-fp-today">Today</button>
          <button type="button" class="cvr-search-fp-btn cvr-search-fp-done">Done</button>
        </div>`;
    }

    let fpIn;
    let fpOut;

    fpOut = flatpickr(outAnchor, {
      disableMobile: true,
      mode: "single",
      inline: false,
      allowInput: false,
      positionElement: outWrap,
      showMonths: 1,
      dateFormat: "Y-m-d",
      minDate: "today",
      maxDate: `${MAX_YEAR}-12-31`,
      onReady: function (_sel, _str, instance) {
        instance.calendarContainer.classList.add("cvr-search-fp");
        instance.calendarContainer.insertAdjacentHTML("beforeend", legendHtml() + footerHtml());
        instance.calendarContainer.querySelector(".cvr-search-fp-clear")?.addEventListener("click", () => {
          instance.clear();
          outHidden.value = "";
          outDisplay.value = "";
        });
        instance.calendarContainer.querySelector(".cvr-search-fp-today")?.addEventListener("click", () => {
          instance.jumpToDate(new Date(), true);
        });
        instance.calendarContainer.querySelector(".cvr-search-fp-done")?.addEventListener("click", () => instance.close());
      },
      onOpen: sheetOpen,
      onClose: sheetClose,
      onChange: function (selectedDates) {
        const co = selectedDates[0] ? formatYMD(selectedDates[0]) : "";
        outHidden.value = co;
        outDisplay.value = formatPretty(co);
        outHidden.dispatchEvent(new Event("change"));
        redrawStay();
      },
      onDayCreate: holidayDayCreate,
    });

    fpIn = flatpickr(inAnchor, {
      disableMobile: true,
      mode: "single",
      inline: false,
      allowInput: false,
      positionElement: inWrap,
      showMonths: 1,
      dateFormat: "Y-m-d",
      minDate: "today",
      maxDate: `${MAX_YEAR}-12-31`,
      onReady: function (_sel, _str, instance) {
        instance.calendarContainer.classList.add("cvr-search-fp");
        instance.calendarContainer.insertAdjacentHTML("beforeend", legendHtml() + footerHtml());
        instance.calendarContainer.querySelector(".cvr-search-fp-clear")?.addEventListener("click", () => {
          instance.clear();
          inHidden.value = "";
          inDisplay.value = "";
          outHidden.value = "";
          outDisplay.value = "";
          fpOut.clear();
          fpOut.set("minDate", "today");
          redrawStay();
        });
        instance.calendarContainer.querySelector(".cvr-search-fp-today")?.addEventListener("click", () => {
          instance.jumpToDate(new Date(), true);
        });
        instance.calendarContainer.querySelector(".cvr-search-fp-done")?.addEventListener("click", () => instance.close());
      },
      onOpen: sheetOpen,
      onClose: sheetClose,
      onChange: function (selectedDates) {
        const ci = selectedDates[0] ? formatYMD(selectedDates[0]) : "";
        inHidden.value = ci;
        inDisplay.value = formatPretty(ci);
        inHidden.dispatchEvent(new Event("change"));
        if (!ci) return;

        const { min, max } = extendedNightsRange();
        const minOut = addDays(selectedDates[0], min);
        const maxOut = addDays(selectedDates[0], max);
        fpOut.set("minDate", minOut);
        fpOut.set("maxDate", maxOut);

        const co = outHidden.value;
        if (!co || co < formatYMD(minOut) || co > formatYMD(maxOut)) {
          fpOut.setDate(minOut, true);
        }
        redrawStay();
      },
      onDayCreate: holidayDayCreate,
    });

    fpIn.set("ignoredFocusElements", [outAnchor, outDisplay, fpOut.calendarContainer]);
    fpOut.set("ignoredFocusElements", [inAnchor, inDisplay, fpIn.calendarContainer]);

    inDisplay.addEventListener("click", () => fpIn.open());
    outDisplay.addEventListener("click", () => fpOut.open());

    if (inHidden.value) {
      fpIn.setDate(new Date(`${inHidden.value}T12:00:00`), false);
      inDisplay.value = formatPretty(inHidden.value);
      const { min, max } = extendedNightsRange();
      const baseDate = new Date(`${inHidden.value}T12:00:00`);
      fpOut.set("minDate", addDays(baseDate, min));
      fpOut.set("maxDate", addDays(baseDate, max));
    }
    if (outHidden.value) {
      fpOut.setDate(new Date(`${outHidden.value}T12:00:00`), false);
      outDisplay.value = formatPretty(outHidden.value);
    }
  };
})();
