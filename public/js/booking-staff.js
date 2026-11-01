

(function () {
  const MS_DAY = 86400000;

  const ymd = (d) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  };

  const esc = (s) => {
    const d = document.createElement("div");
    d.textContent = String(s ?? "");
    return d.innerHTML;
  };

  const readReservations = () => {
    try {
      const arr = JSON.parse(localStorage.getItem("cvrReservations") || "[]");
      return Array.isArray(arr) ? arr : [];
    } catch {
      return [];
    }
  };

  const readBlocked = () => {
    try {
      const arr = JSON.parse(localStorage.getItem("cvrBlockedDates") || "[]");
      return Array.isArray(arr) ? arr.filter((x) => typeof x === "string") : [];
    } catch {
      return [];
    }
  };

  const isCanceled = (r) => String(r.reservationStatus || r.status || "").toLowerCase().includes("cancel");
  const eventDateOf = (r) => String(r.preferredDate || r.eventDate || r.checkIn || "").slice(0, 10);

  const prettyDate = (value) => {
    if (!value) return "";
    const d = new Date(`${value}T12:00:00`);
    if (Number.isNaN(d.getTime())) return value;
    return d.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
  };

  function takenDatesForRoom(packageId, roomTitle, days = 60) {
    const blocked = new Set(readBlocked());
    const taken = new Map();
    const reservations = readReservations().filter((r) => {
      if (isCanceled(r)) return false;
      if (r.bookingType && r.bookingType !== "room") return false;
      if (packageId && r.packageId) return r.packageId === packageId;
      if (roomTitle && r.roomName) return r.roomName === roomTitle;
      return false;
    });

    const start = new Date();
    for (let i = 0; i < days; i += 1) {
      const key = ymd(new Date(start.getTime() + i * MS_DAY));
      if (blocked.has(key)) {
        taken.set(key, "Blocked");
        continue;
      }
      const hit = reservations.find((r) => r.checkIn && r.checkOut && r.checkIn <= key && key < r.checkOut);
      if (hit) taken.set(key, "Booked");
    }
    return taken;
  }

  function upcomingEventDates(days = 90) {
    const today = ymd(new Date());
    const horizonDate = new Date();
    horizonDate.setDate(horizonDate.getDate() + Math.max(0, days - 1));
    const horizon = ymd(horizonDate);
    const blocked = readBlocked().filter((d) => d >= today && d <= horizon);
    const events = readReservations()
      .filter((r) => !isCanceled(r) && r.bookingType === "event")
      .filter((r) => {
        const start = eventDateOf(r);
        const end = String(r.checkOutDate || r.checkOutDateOnly || r.checkOut || start).slice(0, 10);
        return start && start <= horizon && end >= today;
      })
      .sort((a, b) => eventDateOf(a).localeCompare(eventDateOf(b)));
    return { today, horizon, blocked: new Set(blocked), events };
  }

  const eventSessions = [
    { key: "morning", label: "Morning", schedule: "8:00 AM–5:00 PM" },
    { key: "night", label: "Night", schedule: "7:00 PM–5:00 AM" },
    { key: "whole-day", label: "Whole day", schedule: "8:00 AM–5:00 AM (next day)" },
  ];

  function reservationAffectsDate(reservation, date) {
    const start = eventDateOf(reservation);
    const end = String(reservation.checkOutDate || reservation.checkOutDateOnly || reservation.checkOut || start).slice(0, 10);
    return Boolean(start && start <= date && end >= date);
  }

  function eventOverlapsSession(reservation, date, session, cat) {
    const duration = window.CVRDuration;
    const fixed = cat.getFixedEventSchedule?.("", session.key);
    const requested = fixed && duration?.buildFixedWindow
      ? duration.buildFixedWindow(date, fixed.checkInTime, fixed.checkOutTime, fixed.label)
      : null;
    if (requested && reservation.scheduledCheckIn && reservation.scheduledCheckOut && duration?.windowsOverlap) {
      return duration.windowsOverlap(
        requested.scheduledCheckIn,
        requested.scheduledCheckOut,
        reservation.scheduledCheckIn,
        reservation.scheduledCheckOut
      );
    }
    return reservationAffectsDate(reservation, date);
  }

  function eventRecordName(reservation) {
    const packageName = String(reservation.packageOption || "").trim();
    const eventType = String(reservation.eventType || "").trim();
    if (packageName && eventType && packageName !== eventType) return `${eventType} — ${packageName}`;
    return packageName || eventType || "Event booking";
  }

  function eventStatusLabel(reservation) {
    return reservation.reservationStatus || reservation.paymentStatus || "Reserved";
  }

  function eventDayDetails(date, events, blocked, cat) {
    const eventsOnDate = events.filter((event) => reservationAffectsDate(event, date));
    const sessions = eventSessions.map((session) => {
      const event = eventsOnDate.find((item) => eventOverlapsSession(item, date, session, cat));
      return { ...session, event: event || null, available: !blocked.has(date) && !event };
    });
    const availableCount = sessions.filter((session) => session.available).length;
    const status = blocked.has(date)
      ? "Blocked"
      : availableCount === sessions.length
      ? "Available"
      : availableCount
      ? "Partially available"
      : "Fully reserved";
    return { eventsOnDate, sessions, status };
  }

  function availabilityChips(takenMap, days = 21) {
    const start = new Date();
    let out = "";
    for (let i = 0; i < days; i += 1) {
      const key = ymd(new Date(start.getTime() + i * MS_DAY));
      const reason = takenMap.get(key);
      const cls = reason === "Blocked" ? "text-bg-secondary" : reason ? "text-bg-danger" : "text-bg-success";
      const label = new Date(`${key}T12:00:00`).toLocaleDateString(undefined, { month: "short", day: "numeric" });
      out += `<span class="badge ${cls} fw-normal" title="${reason || "Available"}">${esc(label)}</span>`;
    }
    return `<div class="d-flex flex-wrap gap-1 staff-availability-chips">${out}</div>`;
  }

  function renderStaffAvailabilityPanel() {
    const mount = document.getElementById("staffAvailabilityPanel");
    const cat = window.CVRBookingCatalog;
    if (!mount || !cat) return;

    const { today, horizon, blocked, events } = upcomingEventDates();
    const packages = cat.getRoomPackages({ activeOnly: true });

    let eventRows = "";
    const currentDate = new Date(`${today}T12:00:00`);
    const totalDays = Math.round((new Date(`${horizon}T12:00:00`) - currentDate) / MS_DAY);
    for (let offset = 0; offset <= totalDays; offset += 1) {
      const date = new Date(currentDate);
      date.setDate(date.getDate() + offset);
      const dateKey = ymd(date);
      const details = eventDayDetails(dateKey, events, blocked, cat);
      const bookedEvents = details.eventsOnDate.map(eventRecordName);
      const eventSummary = bookedEvents.length
        ? Array.from(new Set(bookedEvents)).join(", ")
        : details.status === "Blocked"
        ? "Resort closed"
        : "—";
      const sessionSummary = details.sessions
        .map((session) => `${session.label}: ${session.available ? "Available" : session.event ? eventRecordName(session.event) : "Blocked"}`)
        .join(" · ");
      const statusClass = details.status === "Available"
        ? "text-bg-success"
        : details.status === "Blocked"
        ? "text-bg-secondary"
        : details.status === "Fully reserved"
        ? "text-bg-danger"
        : "text-bg-warning";
      eventRows += `
        <tr>
          <td><button type="button" class="staff-event-date-button" data-staff-event-date="${dateKey}">${esc(prettyDate(dateKey))}</button></td>
          <td>${esc(eventSummary)}</td>
          <td><span class="badge ${statusClass}">${esc(details.status)}</span></td>
          <td class="small text-muted-brand">${esc(sessionSummary)}</td>
        </tr>`;
    }

    const roomRows = packages
      .map((pkg) => {
        const taken = takenDatesForRoom(pkg.id, pkg.title);
        const nextFree = (() => {
          for (let i = 0; i < 60; i += 1) {
            const key = ymd(new Date(Date.now() + i * MS_DAY));
            if (!taken.has(key)) return key;
          }
          return "";
        })();
        return `
          <div class="col-12">
            <div class="soft-card p-3 h-100">
              <div class="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-2">
                <div>
                  <div class="fw-semibold text-brand">${esc(pkg.title)}</div>
                  <div class="small text-muted-brand">Next available: ${nextFree ? esc(prettyDate(nextFree)) : "Fully booked for 60 days"}</div>
                </div>
                <button type="button" class="btn btn-sm btn-outline-primary staff-room-details-btn" data-package-id="${esc(pkg.id)}">
                  <i class="bi bi-eye me-1"></i>View details
                </button>
              </div>
              ${availabilityChips(taken)}
            </div>
          </div>`;
      })
      .join("");

    mount.innerHTML = `
      <div class="soft-card p-4 mb-4">
        <div class="d-flex align-items-center justify-content-between flex-wrap gap-2 mb-3">
          <div>
            <h4 class="text-brand mb-1"><i class="bi bi-calendar-check me-2"></i>Event availability</h4>
            <p class="small text-muted-brand mb-0">Select a date to see its event bookings and availability for each fixed session over the next 90 days.</p>
          </div>
          <a href="admin/calendar.html" class="btn btn-sm btn-outline-secondary"><i class="bi bi-calendar3 me-1"></i>Open admin calendar</a>
        </div>
        <div class="table-responsive staff-event-availability-table">
          <table class="table table-hover align-middle mb-0">
            <thead><tr><th>Date</th><th>Event / package</th><th>Status</th><th>Session availability</th></tr></thead>
            <tbody>${eventRows}</tbody>
          </table>
        </div>
        <div class="small text-muted-brand mt-2">Green = available · Yellow = partly available · Red = fully reserved · Gray = blocked. Click any date for details.</div>
      </div>

      <div class="soft-card p-4 mb-4">
        <div class="mb-3">
          <h4 class="text-brand mb-1"><i class="bi bi-door-open me-2"></i>Room availability</h4>
          <p class="small text-muted-brand mb-0">Next 3 weeks per room package.</p>
        </div>
        <div class="row g-3">${roomRows}</div>
        <div class="d-flex flex-wrap align-items-center gap-3 small text-muted-brand mt-3">
          <span class="d-inline-flex align-items-center gap-1"><span class="badge text-bg-success">&nbsp;</span> Available</span>
          <span class="d-inline-flex align-items-center gap-1"><span class="badge text-bg-danger">&nbsp;</span> Booked</span>
          <span class="d-inline-flex align-items-center gap-1"><span class="badge text-bg-secondary">&nbsp;</span> Blocked</span>
        </div>
      </div>

      <div class="modal fade" id="staffEventAvailabilityModal" tabindex="-1" aria-labelledby="staffEventAvailabilityTitle" aria-hidden="true">
        <div class="modal-dialog modal-dialog-centered modal-dialog-scrollable">
          <div class="modal-content">
            <div class="modal-header">
              <h5 class="modal-title text-brand" id="staffEventAvailabilityTitle">Event availability</h5>
              <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
            </div>
            <div class="modal-body" id="staffEventAvailabilityDetails"></div>
            <div class="modal-footer">
              <button type="button" class="btn btn-outline-secondary" data-bs-dismiss="modal">Close</button>
            </div>
          </div>
        </div>
      </div>
    `;

    mount.querySelectorAll(".staff-event-date-button").forEach((button) => {
      button.addEventListener("click", () => {
        const date = button.dataset.staffEventDate || "";
        const details = eventDayDetails(date, events, blocked, cat);
        const title = mount.querySelector("#staffEventAvailabilityTitle");
        const content = mount.querySelector("#staffEventAvailabilityDetails");
        if (!title || !content) return;
        title.textContent = `Event availability — ${prettyDate(date)}`;
        const eventCards = details.eventsOnDate.length
          ? details.eventsOnDate.map((event) => `
              <div class="border rounded-3 p-3 mb-2">
                <div class="fw-semibold text-brand">${esc(eventRecordName(event))}</div>
                <div class="small text-muted-brand">${esc(event.checkInLabel || event.eventTime || "Schedule not specified")}${event.checkOutLabel ? ` – ${esc(event.checkOutLabel)}` : ""}</div>
                <div class="small mt-1">${esc(event.guests ?? event.eventGuests ?? "—")} guests · ${esc(eventStatusLabel(event))}</div>
                <div class="small text-muted-brand">${esc(event.customerName || event.fullName || "Guest not specified")}</div>
              </div>`)
            .join("")
          : `<p class="small text-muted-brand mb-0">${details.status === "Blocked" ? "No event booking; the resort is blocked on this date." : "No event bookings on this date."}</p>`;
        const sessionRows = details.sessions.map((session) => `
          <div class="d-flex justify-content-between align-items-start gap-2 border-bottom py-2">
            <div>
              <div class="fw-semibold">${esc(session.label)}</div>
              <div class="small text-muted-brand">${esc(session.schedule)}</div>
              ${session.event ? `<div class="small text-danger">${esc(eventRecordName(session.event))}</div>` : ""}
            </div>
            <span class="badge ${session.available ? "text-bg-success" : session.event ? "text-bg-danger" : "text-bg-secondary"}">${session.available ? "Available" : session.event ? "Reserved" : "Blocked"}</span>
          </div>`).join("");
        content.innerHTML = `
          <div class="mb-3"><span class="badge ${details.status === "Available" ? "text-bg-success" : details.status === "Blocked" ? "text-bg-secondary" : details.status === "Fully reserved" ? "text-bg-danger" : "text-bg-warning"}">${esc(details.status)}</span></div>
          <h6 class="text-brand">Bookings</h6>${eventCards}
          <h6 class="text-brand mt-4">Session availability</h6>${sessionRows}`;
        bootstrap.Modal.getOrCreateInstance(mount.querySelector("#staffEventAvailabilityModal")).show();
      });
    });
    mount.querySelectorAll(".staff-room-details-btn").forEach((btn) => {
      btn.addEventListener("click", () => window.cvrShowRoomDetails?.(btn.dataset.packageId));
    });
  }

  let reviewsCache = null;
  let reviewsPromise = null;

  const starsMarkup = (rating) => {
    const full = Math.floor(rating);
    const fraction = rating - full;
    const hasHalf = fraction >= 0.25 && fraction < 0.75;
    const fullStars = fraction >= 0.75 ? full + 1 : full;
    let html = "";
    for (let i = 1; i <= 5; i++) {
      let icon = "bi-star";
      if (i <= fullStars) icon = "bi-star-fill";
      else if (i === fullStars + 1 && hasHalf) icon = "bi-star-half";
      html += `<i class="bi ${icon}"></i>`;
    }
    return html;
  };

  const initialsFor = (name) => {
    const parts = String(name || "").trim().split(/\s+/).filter(Boolean);
    if (!parts.length) return "G";
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  const reviewCardMarkup = (r, delay) => `
    <div class="room-review-card" style="animation-delay:${delay}ms">
      <div class="d-flex align-items-center gap-2 mb-2">
        ${r.avatarUrl
          ? `<img class="review-card-avatar" src="${esc(r.avatarUrl)}" alt="" loading="lazy">`
          : `<span class="review-card-avatar review-card-avatar--fallback-light">${esc(initialsFor(r.guestName))}</span>`}
        <div>
          <div class="fw-semibold text-brand small">${esc(r.guestName)}</div>
          <div class="small text-muted-brand">${esc(r.location || "")}</div>
        </div>
        <div class="text-warning ms-auto room-review-stars">${starsMarkup(r.rating)}</div>
      </div>
      <p class="small text-muted-brand mb-0">"${esc(r.comment)}"</p>
    </div>`;

  async function loadReviewsOnce() {
    if (reviewsCache) return reviewsCache;
    if (!reviewsPromise) {
      reviewsPromise = (async () => {
        try {
          const { body } = await cvrApiGet("content/reviews");
          reviewsCache = body?.success
            ? {
                reviews: body.data?.reviews || [],
                averageRating: body.data?.averageRating || 0,
                totalReviews: body.data?.totalReviews || 0,
              }
            : { reviews: [], averageRating: 0, totalReviews: 0 };
        } catch {
          reviewsCache = { reviews: [], averageRating: 0, totalReviews: 0 };
        }
        return reviewsCache;
      })();
    }
    return reviewsPromise;
  }

  function renderRoomDetailsReviews(modalEl, packageId) {
    const listEl = modalEl.querySelector("#roomDetailsReviews");
    const summaryEl = modalEl.querySelector("#roomDetailsReviewsSummary");
    if (!listEl) return;
    listEl.innerHTML = `<div class="text-muted-brand small"><span class="spinner-border spinner-border-sm me-2"></span>Loading reviews…</div>`;
    if (summaryEl) summaryEl.textContent = "";

    loadReviewsOnce().then(({ reviews }) => {

      const roomReviews = reviews.filter(
        (r) => r.reviewType === "booking" && r.packageId && r.packageId === packageId
      );
      const roomTotal = roomReviews.length;
      const roomAverage = roomTotal
        ? roomReviews.reduce((sum, r) => sum + Number(r.rating || 0), 0) / roomTotal
        : 0;

      if (summaryEl) {
        summaryEl.innerHTML = roomTotal
          ? `<span class="text-warning fw-semibold">${roomAverage.toFixed(1)}</span> <span class="text-warning">${starsMarkup(roomAverage)}</span> <span>· ${roomTotal} review${roomTotal === 1 ? "" : "s"}</span>`
          : "";
      }
      if (!roomTotal) {
        listEl.innerHTML = `<p class="small text-muted-brand fst-italic mb-0">No guest reviews yet for this room — be the first to share your stay!</p>`;
        return;
      }
      listEl.innerHTML = roomReviews
        .slice(0, 6)
        .map((r, i) => reviewCardMarkup(r, i * 60))
        .join("");
    });
  }

  function showRoomDetails(packageId) {
    const cat = window.CVRBookingCatalog;
    const modalEl = document.getElementById("roomDetailsModal");
    const pkg = cat?.getRoomPackageById?.(packageId);
    if (!cat || !modalEl || !pkg) return;

    modalEl.querySelector("#roomDetailsTitle").textContent = pkg.title;
    const gallery = modalEl.querySelector("#roomDetailsGallery");
    const galleryImages = [
      { src: pkg.image, caption: pkg.title },
      { src: "../images/booking-photo-1.png", caption: "Pool and resort view" },
      { src: "../images/booking-photo-2.png", caption: "Covered lounge and venue" },
      { src: "../images/booking-photo-3.png", caption: "Poolside venue perspective" },
    ].filter((image, index, list) => image.src && list.findIndex((candidate) => candidate.src === image.src) === index);
    if (gallery) {
      gallery.innerHTML = `
        <div id="roomDetailsCarousel" class="carousel slide cvr-booking-gallery" data-bs-ride="false" aria-label="${esc(pkg.title)} photo gallery">
          <div class="carousel-inner">
            ${galleryImages.map((image, index) => {
              const src = window.cvrResolvePackageImage ? cvrResolvePackageImage(image.src) : image.src;
              return `<div class="carousel-item${index === 0 ? " active" : ""}">
                <img src="${esc(src)}" class="d-block w-100" alt="${esc(image.caption)}">
                <div class="carousel-caption"><span>${esc(image.caption)}</span></div>
              </div>`;
            }).join("")}
          </div>
          ${galleryImages.length > 1 ? `<button class="carousel-control-prev" type="button" data-bs-target="#roomDetailsCarousel" data-bs-slide="prev" aria-label="Previous photo"><span class="carousel-control-prev-icon" aria-hidden="true"></span></button>
          <button class="carousel-control-next" type="button" data-bs-target="#roomDetailsCarousel" data-bs-slide="next" aria-label="Next photo"><span class="carousel-control-next-icon" aria-hidden="true"></span></button>` : ""}
        </div>`;
    }

    modalEl.querySelector("#roomDetailsTagline").textContent = pkg.tagline || "";
    modalEl.querySelector("#roomDetailsDescription").textContent = pkg.description || "";
    modalEl.querySelector("#roomDetailsSpecs").innerHTML = [
      `${esc(pkg.areaSqm)} m² · ${esc(pkg.bed)}`,
      `Guests: ${esc(pkg.capacity?.min)}–${esc(pkg.capacity?.max)}`,
      `Check-in / out: ${esc(pkg.standardCheckIn)} / ${esc(pkg.standardCheckOut)}`,
      esc(pkg.availabilityNote || ""),
    ]
      .filter(Boolean)
      .map((line) => `<li>${line}</li>`)
      .join("");
    modalEl.querySelector("#roomDetailsInclusions").innerHTML = (pkg.inclusions || [])
      .map((i) => `<li>${esc(i)}</li>`)
      .join("");
    modalEl.querySelector("#roomDetailsAvailability").innerHTML = availabilityChips(
      takenDatesForRoom(pkg.id, pkg.title),
      28
    );

    renderRoomDetailsReviews(modalEl, pkg.id);

    // Prefill the room's advertised occupancy while keeping children part of the same capacity.
    const roomAdultsEl = modalEl.querySelector("#roomAdults");
    const roomChildrenEl = modalEl.querySelector("#roomChildren");
    const capMin = Math.max(1, pkg.capacity?.min ?? 1);
    const capMax = Math.max(capMin, pkg.capacity?.max ?? capMin);
    const fixedSingleGuest = capMax === 1;
    if (roomAdultsEl) {
      roomAdultsEl.value = String(capMax);
      roomAdultsEl.max = String(capMax);
      roomAdultsEl.disabled = fixedSingleGuest;
    }
    if (roomChildrenEl) roomChildrenEl.value = "0";
    if (roomChildrenEl) {
      roomChildrenEl.max = String(capMax);
      roomChildrenEl.disabled = fixedSingleGuest;
    }
    const guestErrorEl = modalEl.querySelector("#roomGuestError");
    if (guestErrorEl) {
      guestErrorEl.textContent = "";
      guestErrorEl.classList.add("d-none");
    }
    const guestHint = modalEl.querySelector("#roomGuestHint");
    if (guestHint) {
      const min = pkg.capacity?.min ?? 1;
      const max = pkg.capacity?.max ?? 1;
      guestHint.textContent = fixedSingleGuest
        ? "This room is fixed at 1 guest."
        : `Prefilled for ${capMax} guests. Adults and kids share the ${min}–${max} guest room limit.`;
    }

    const staff = typeof isStaffSession === "function" && isStaffSession(getCustomerSession?.());
    const calendarLink = modalEl.querySelector("#roomDetailsCalendarLink");
    const bookBtn = modalEl.querySelector("#roomDetailsBookBtn");
    calendarLink?.classList.toggle("d-none", !staff);
    bookBtn?.classList.toggle("d-none", staff);
    if (bookBtn) {
      bookBtn.onclick = () => {
        const adults = Math.max(0, parseInt(roomAdultsEl?.value, 10) || 0);
        const kids = Math.max(0, parseInt(roomChildrenEl?.value, 10) || 0);
        const total = adults + kids;
        let problem = "";
        if (adults < 1) problem = "Please enter at least one adult.";
        else if (total < capMin || total > capMax) problem = `This room allows ${capMin}\u2013${capMax} guests in total (adults + kids). You entered ${total}.`;
        if (problem) {
          // Keep the dialog open and show the problem right next to the guest fields.
          if (guestErrorEl) {
            guestErrorEl.textContent = problem;
            guestErrorEl.classList.remove("d-none");
          }
          roomAdultsEl?.focus();
          return;
        }
        bootstrap.Modal.getOrCreateInstance(modalEl).hide();
        window.cvrBookRoom?.(pkg.id);
      };
      [roomAdultsEl, roomChildrenEl].forEach((el) => {
        if (el) el.oninput = () => guestErrorEl?.classList.add("d-none");
      });
    }

    bootstrap.Modal.getOrCreateInstance(modalEl).show();
  }

  function initStaffRoomsView() {
    const staff = typeof isStaffSession === "function" && isStaffSession(getCustomerSession?.());
    if (!staff) return false;

    document.body.classList.add("cvr-staff-rooms-view");
    document.querySelector(".booking-filter-card")?.classList.add("d-none");
    document.getElementById("eventBookingSection")?.classList.add("d-none");
    document.getElementById("staffRoomsIntro")?.classList.remove("d-none");
    document.getElementById("staffAvailabilityPanel")?.classList.remove("d-none");
    renderStaffAvailabilityPanel();
    if (!window.__cvrStaffAvailabilityRefreshBound) {
      window.__cvrStaffAvailabilityRefreshBound = true;
      document.addEventListener("cvr-reservations-synced", renderStaffAvailabilityPanel);
      window.addEventListener("storage", (event) => {
        if (event.key === "cvrReservations" || event.key === "cvrBlockedDates") renderStaffAvailabilityPanel();
      });
    }
    if (typeof window.cvrSyncReservationsFromServer === "function") {
      window.cvrSyncReservationsFromServer();
    }
    return true;
  }

  window.cvrShowRoomDetails = showRoomDetails;
  window.initStaffRoomsView = initStaffRoomsView;
})();
