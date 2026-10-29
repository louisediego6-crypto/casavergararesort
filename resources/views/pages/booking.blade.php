@verbatim
<!doctype html>
<html lang="en">
<head>
  <link rel="icon" href="/favicon.ico" sizes="any">
  <link rel="icon" type="image/png" sizes="32x32" href="/images/favicon-32.png">
  <link rel="apple-touch-icon" href="/images/apple-touch-icon.png">
  <meta charset="UTF-8" />
  <script src="../js/theme.js?v=20261024f"></script>
  <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover" />
  <title>Casa Vergara - Reservations</title>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Playfair+Display:wght@600;700&display=swap" rel="stylesheet">
  <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css" rel="stylesheet">
  <link href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.css" rel="stylesheet">
  <link href="../css/style.css?v=20261004f" rel="stylesheet">
  <link href="../css/polish.css?v=20260927b" rel="stylesheet">
  <link href="../css/modern.css?v=20261018a" rel="stylesheet">
  <link href="../css/laravel-ui.css?v=20261018b" rel="stylesheet">
  <link href="../css/contact-booking-fixes.css?v=20261018a" rel="stylesheet">
  <link href="../css/cvr-responsive.css?v=20261020a" rel="stylesheet">
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/flatpickr/dist/flatpickr.min.css">
  <link href="../css/theme-auto.css?v=20261024e" rel="stylesheet">
  <link href="../css/theme.css?v=20261024e" rel="stylesheet">
  <link href="../css/calendars.css?v=20261026b" rel="stylesheet">
  <link href="../css/modals.css?v=20261025a" rel="stylesheet">
  <link href="../css/booking-ui.css?v=20261026b" rel="stylesheet">
  <link href="../css/mobile-polish.css?v=20261026a" rel="stylesheet">
  <link href="../css/dark-fixes.css?v=20261026b" rel="stylesheet">
  <link href="../css/booking-extras.css?v=20261026c" rel="stylesheet">
  <link href="../css/modal-responsive.css?v=20261027a" rel="stylesheet">
  <link href="../css/responsive-final.css?v=20261029a" rel="stylesheet">
  <script src="../js/modal-responsive.js?v=20261027a" defer></script>
</head>
<body>
  <div id="site-navbar"></div>

  <section class="section-pad pb-4 booking-page">
    <div class="container">
      <div class="text-center mb-4 booking-page-header">
        <p class="text-uppercase text-primary fw-semibold small mb-2">Reservations</p>
        <h1 class="display-5 fw-bold text-brand">Book Your Stay or Event</h1>
        <ol class="bk-steps" aria-label="Booking steps">
          <li class="active"><span class="n">1</span>Pick dates</li>
          <li><span class="n">2</span>Choose a room</li>
          <li><span class="n">3</span>Guest details &amp; payment</li>
        </ol>
        <div id="staffRoomsIntro" class="alert alert-info d-none mt-3 mb-0 text-start">
          <i class="bi bi-shield-check me-2"></i>
          <strong>Staff view.</strong> Booking is disabled for admin and staff accounts. Below you can see event and room availability, and open any room for full details.
        </div>
      </div>

      <div id="staffAvailabilityPanel" class="d-none"></div>

      <div class="soft-card p-4 mb-4 booking-filter-card booking-filter-unified" id="bkFilterCard">
        <h2 class="bk-filter-title"><i class="bi bi-calendar-check"></i>Find your stay <small>Choose a date and how long you'd like to stay</small></h2>
        <div class="row g-3 align-items-start booking-filter-row" id="bookingFilterRow">
          <div class="col-12 col-sm-6 col-lg-2 cvr-filter-shrink-col">
            <label for="bookingType" class="form-label text-brand">Booking Type</label>
            <select id="bookingType" class="form-select">
              <option value="room">Room Stay</option>
              <option value="event">Event Reservation</option>
            </select>
          </div>
          <div class="col-12 col-sm-6 col-lg-2 cvr-filter-shrink-col" id="cvrCheckInWrap">
            <label for="checkInDateDisplay" class="form-label text-brand">Check-in Date</label>
            <div class="cvr-search-date-field">
              <input id="checkInDateDisplay" type="text" class="form-control cvr-search-date-input" placeholder="Select date" readonly autocomplete="off">
              <i class="bi bi-calendar3 cvr-search-date-icon"></i>
            </div>
            <input type="hidden" id="checkInDate" style="display:none !important;">
            <input type="text" id="cvrCheckInAnchor" style="position:absolute; width:1px; height:1px; padding:0; margin:0; border:0; opacity:0; pointer-events:none;" tabindex="-1" aria-hidden="true">
          </div>
          <div class="col-12 col-sm-6 col-lg-2" id="cvrCheckOutWrap">
            <label for="checkOutDateDisplay" class="form-label text-brand">Check-out Date</label>
            <div class="cvr-search-date-field">
              <input id="checkOutDateDisplay" type="text" class="form-control cvr-search-date-input" placeholder="Select date" readonly autocomplete="off">
              <i class="bi bi-calendar3 cvr-search-date-icon"></i>
            </div>
            <input type="hidden" id="checkOutDate" style="display:none !important;">
            <input type="text" id="cvrCheckOutAnchor" style="position:absolute; width:1px; height:1px; padding:0; margin:0; border:0; opacity:0; pointer-events:none;" tabindex="-1" aria-hidden="true">
          </div>
          <div class="col-12 col-sm-6 col-lg-4" id="cvrStayDurationWrap">
            <label for="stayDuration" class="form-label text-brand">Stay Duration</label>
            <select id="stayDuration" class="form-select">
              <option value="3hr">3-Hours Stay</option>
              <option value="12hr">12-Hours Stay</option>
              <option value="24hr" selected>24-Hours Stay</option>
              <option value="extended">Multi-Day / Extended Stay (2+ nights)</option>
            </select>
          </div>
          <div class="col-12 col-sm-6 col-lg-2 d-grid cvr-filter-shrink-col" id="cvrSearchBtnWrap">
            <label class="form-label invisible d-none d-lg-block" aria-hidden="true">Search</label>
            <button class="btn btn-brand" type="button" id="bookingSearchBtn"><i class="bi bi-search me-2"></i>Search</button>
          </div>
          <div class="col-12 col-sm-6 col-lg-6" id="cvrCheckInTimeWrap">
            <label class="form-label text-brand cvr-time-label-row" for="cvrCheckInHour">Check-in Time <span class="cvr-time-flex-badge">Flexible</span></label>
            <div class="cvr-time-picker-group" role="group" aria-label="Preferred check-in time">
              <select id="cvrCheckInHour" class="form-select" aria-label="Check-in hour">
                <option value="" selected disabled>Hr</option>
                <option value="1">1</option><option value="2">2</option><option value="3">3</option>
                <option value="4">4</option><option value="5">5</option><option value="6">6</option>
                <option value="7">7</option><option value="8">8</option><option value="9">9</option>
                <option value="10">10</option><option value="11">11</option><option value="12">12</option>
              </select>
              <span class="cvr-time-picker-sep">:</span>
              <select id="cvrCheckInMinute" class="form-select" aria-label="Check-in minute">
                <option value="" selected disabled>Min</option>
                <option value="0">00</option>
                <option value="15">15</option>
                <option value="30">30</option>
                <option value="45">45</option>
              </select>
              <select id="cvrCheckInMeridiem" class="form-select" aria-label="Check-in AM or PM">
                <option value="" selected disabled>--</option>
                <option value="AM">AM</option>
                <option value="PM">PM</option>
              </select>
            </div>
            <small class="text-muted-brand d-block mt-1" id="cvrCheckInTimeHint">Pick your own arrival time, or leave blank to use the default for this duration. Check-out moves with it so you always get the full duration.</small>
          </div>
          <div class="col-12 col-sm-6 col-lg-6 d-none" id="cvrRoomCheckOutTimeWrap">
            <label class="form-label text-brand cvr-time-label-row" for="cvrCheckOutHour">Check-out Time <span class="cvr-time-flex-badge">Flexible</span></label>
            <div class="cvr-time-picker-group" role="group" aria-label="Preferred departure time">
              <select id="cvrCheckOutHour" class="form-select" aria-label="Check-out hour">
                <option value="" selected disabled>Hr</option>
                <option value="1">1</option><option value="2">2</option><option value="3">3</option>
                <option value="4">4</option><option value="5">5</option><option value="6">6</option>
                <option value="7">7</option><option value="8">8</option><option value="9">9</option>
                <option value="10">10</option><option value="11">11</option><option value="12">12</option>
              </select>
              <span class="cvr-time-picker-sep">:</span>
              <select id="cvrCheckOutMinute" class="form-select" aria-label="Check-out minute">
                <option value="" selected disabled>Min</option>
                <option value="0">00</option>
                <option value="15">15</option>
                <option value="30">30</option>
                <option value="45">45</option>
              </select>
              <select id="cvrCheckOutMeridiem" class="form-select" aria-label="Check-out AM or PM">
                <option value="" selected disabled>--</option>
                <option value="AM">AM</option>
                <option value="PM">PM</option>
              </select>
            </div>
            <small class="text-muted-brand d-block mt-1">Only for Multi-Day stays: pick your departure time on the last day, or leave blank to use the default 12:00 NN.</small>
          </div>
          <div class="col-12" id="cvrRoomTimingNote">
            <p class="small text-muted-brand mb-0"><i class="bi bi-alarm me-1"></i>Both your arrival and check-out times are flexible: check-out is exactly 3, 12, or 24 hours after your actual check-in, so the full duration is always fulfilled. Staying past that check-out time is billed as overtime — see each room's rates below.</p>
          </div>
          <div class="col-12">
            <div id="bookingFeedback" class="alert alert-success d-none mb-0" role="alert"></div>
          </div>
        </div>
      </div>

      <div id="roomBookingSection">
        <div class="bk-results-head" id="bkResultsHead">
          <h2 class="text-brand">Choose your room</h2>
          <p class="bk-results-meta" id="bkResultsMeta"></p>
        </div>
        <div class="row g-4 booking-room-grid" id="roomPackagesGrid"></div>
      </div>

      <div id="eventBookingSection" class="d-none">
        <div class="bk-results-head">
          <h2 class="text-brand">Event Reservation</h2>
          <p class="bk-results-meta">Four quick steps. Dates with an existing event or blocked day can't be selected.</p>
        </div>
        <div class="soft-card p-4 booking-event-card">
          <form id="eventReservationForm" class="row g-4 booking-event-form">
            <div class="col-12"><div class="bk-form-section">
              <div class="bk-sec-head"><span class="n">1</span><div><h3>What are you celebrating?</h3><p>Pick the event type, and a package if you have one in mind.</p></div></div>
              <div class="row g-3">
            <div class="col-md-6">
              <label for="eventType" class="form-label text-brand">Event Type</label>
              <select id="eventType" class="form-select" required>
                <option value="">Select event type</option>
                <optgroup label="General">
                  <option value="Birthday">Birthday</option>
                  <option value="Reunion">Reunion</option>
                  <option value="Team Building">Team Building</option>
                  <option value="Others">Others</option>
                </optgroup>
                <optgroup label="Full-Event Packages" id="eventTypeVenueGroup"></optgroup>
              </select>
            </div>
            <div class="col-md-6 d-none" id="eventOtherSpecifyWrap">
              <label for="eventOtherSpecify" class="form-label text-brand">Please specify <span class="text-danger">*</span></label>
              <input id="eventOtherSpecify" type="text" class="form-control" placeholder="Tell us what kind of event this is">
            </div>
            <div class="col-md-6 d-none" id="eventBirthdayPackageWrap">
              <label for="eventBirthdayPackage" class="form-label text-brand">Birthday Package (optional)</label>
              <select id="eventBirthdayPackage" class="form-select"></select>
            </div>
            <div class="col-12">
              <div id="eventPackageDetails" class="booking-event-package-details d-none"></div>
            </div>
            <div class="col-md-6 d-none" id="eventMotifBookingWrap">
              <label for="eventMotifSelect" class="form-label text-brand">Motif / color theme (optional)</label>
              <select id="eventMotifSelect" class="form-select">
                <option value="">Select later on reservation form</option>
              </select>
            </div>
              </div>
            </div>
            </div>
            <div class="col-12"><div class="bk-form-section">
              <div class="bk-sec-head"><span class="n">2</span><div><h3>Who is coming?</h3><p>Adults and kids always add up to your total guests.</p></div></div>
              <div class="row g-3">
            <div class="col-12 col-lg-8">
              <span class="form-label text-brand d-block">Number of Guests <span class="text-danger">*</span></span>
              <div class="bk-guest-grid" role="group" aria-label="Number of guests">
                <div class="bk-guest-field bk-guest-field--total">
                  <label for="eventGuests" class="small text-muted-brand mb-1">Total guests</label>
                  <div class="bk-stepper">
                    <button type="button" class="bk-stepper-btn" data-guest-step="-1" data-guest-target="eventGuests" aria-label="Fewer total guests"><i class="bi bi-dash-lg"></i></button>
                    <input id="eventGuests" type="number" min="0" value="" placeholder="0" class="form-control" inputmode="numeric">
                    <button type="button" class="bk-stepper-btn" data-guest-step="1" data-guest-target="eventGuests" aria-label="More total guests"><i class="bi bi-plus-lg"></i></button>
                  </div>
                </div>
                <div class="bk-guest-eq" aria-hidden="true">=</div>
                <div class="bk-guest-field">
                  <label for="eventAdults" class="small text-muted-brand mb-1">Adults</label>
                  <div class="bk-stepper">
                    <button type="button" class="bk-stepper-btn" data-guest-step="-1" data-guest-target="eventAdults" aria-label="Fewer adults"><i class="bi bi-dash-lg"></i></button>
                    <input id="eventAdults" type="number" min="0" value="" placeholder="0" class="form-control" inputmode="numeric">
                    <button type="button" class="bk-stepper-btn" data-guest-step="1" data-guest-target="eventAdults" aria-label="More adults"><i class="bi bi-plus-lg"></i></button>
                  </div>
                </div>
                <div class="bk-guest-eq" aria-hidden="true">+</div>
                <div class="bk-guest-field">
                  <label for="eventChildren" class="small text-muted-brand mb-1">Kids</label>
                  <div class="bk-stepper">
                    <button type="button" class="bk-stepper-btn" data-guest-step="-1" data-guest-target="eventChildren" aria-label="Fewer kids"><i class="bi bi-dash-lg"></i></button>
                    <input id="eventChildren" type="number" min="0" value="" placeholder="0" class="form-control" inputmode="numeric">
                    <button type="button" class="bk-stepper-btn" data-guest-step="1" data-guest-target="eventChildren" aria-label="More kids"><i class="bi bi-plus-lg"></i></button>
                  </div>
                </div>
              </div>
              <div class="small text-muted-brand mt-2" id="eventGuestTotalText" aria-live="polite">No guests added yet</div>
              <div class="small text-muted-brand">Total, adults and kids stay in sync: change any one and the others update.</div>
            </div>
              </div>
            </div>
            </div>
            <div class="col-12"><div class="bk-form-section">
              <div class="bk-sec-head"><span class="n">3</span><div><h3>When is it?</h3><p>Choose your date, then how long you need the venue.</p></div></div>
              <div class="row g-3">
            <div class="col-12 booking-event-date-col">
              <label class="form-label text-brand">Preferred Date <span class="text-danger">*</span></label>
              <p class="small text-muted-brand mb-3 mb-md-2">Dates with an existing event booking or blocked days cannot be selected.</p>
              <input type="hidden" id="eventDate" name="eventDate" value="" required>
              <div class="cvr-event-date-shell">
                <div class="cvr-stay-calendars-wrap cvr-event-pref-inner">
                  <div id="cvrEventPreferredMount" class="cvr-fp-mount cvr-event-pref-mount border-0 bg-white"></div>
                </div>
                <div class="cvr-calendar-legend cvr-event-date-legend d-flex flex-wrap align-items-center justify-content-center gap-3 small text-muted-brand">
                  <span class="d-inline-flex align-items-center gap-2"><span class="cvr-legend-swatch cvr-legend-available"></span> Available</span>
                  <span class="d-inline-flex align-items-center gap-2"><span class="cvr-legend-swatch cvr-legend-booked"></span> Event booked</span>
                  <span class="d-inline-flex align-items-center gap-2"><span class="cvr-legend-swatch cvr-legend-blocked"></span> Blocked</span>
                  <span class="d-inline-flex align-items-center gap-2"><span class="cvr-legend-swatch cvr-legend-holiday"></span> PH holiday</span>
                </div>
              </div>
            </div>
            <div class="col-md-6" id="eventDurationWrap">
              <label for="eventDuration" class="form-label text-brand">Event Duration <span class="text-danger">*</span></label>
              <select id="eventDuration" class="form-select" required>
                <option value="3hr">3-Hours Stay</option>
                <option value="12hr">12-Hours Stay</option>
                <option value="24hr">24-Hours Stay</option>
                <option value="extended">Multi-Day / Extended Event (2+ nights)</option>
              </select>
              <p class="small text-muted-brand mb-0 mt-1" id="eventDurationHint">Your check-in time is flexible and check-out follows exactly 3, 12, or 24 hours later, so the full event duration is always fulfilled. Overtime is billed per hour past that check-out time.</p>
            </div>
            <div class="col-12 d-none" id="eventFixedScheduleNote">
              <p class="small text-muted-brand mb-0"><i class="bi bi-clock-history me-1"></i><span id="eventFixedScheduleText"></span> This package runs on a fixed schedule, so there's no duration or check-in time to choose.</p>
            </div>
            <div class="col-md-6 d-none" id="eventNightsWrap">
              <label for="eventNights" class="form-label text-brand">Number of Nights <span class="text-danger">*</span></label>
              <input type="number" id="eventNights" class="form-control" min="2" max="14" value="2">
              <p class="small text-muted-brand mb-0 mt-1">2–14 nights. Check-out lands this many nights after your arrival date.</p>
            </div>
            <div class="col-md-6" id="eventCheckInTimeWrap">
              <label class="form-label text-brand cvr-time-label-row" for="eventCheckInHour">Check-in Time <span class="cvr-time-flex-badge">Flexible</span></label>
              <div class="cvr-time-picker-group" role="group" aria-label="Preferred event check-in time">
                <select id="eventCheckInHour" class="form-select" aria-label="Check-in hour">
                  <option value="" selected disabled>Hr</option>
                  <option value="1">1</option><option value="2">2</option><option value="3">3</option>
                  <option value="4">4</option><option value="5">5</option><option value="6">6</option>
                  <option value="7">7</option><option value="8">8</option><option value="9">9</option>
                  <option value="10">10</option><option value="11">11</option><option value="12">12</option>
                </select>
                <span class="cvr-time-picker-sep">:</span>
                <select id="eventCheckInMinute" class="form-select" aria-label="Check-in minute">
                  <option value="" selected disabled>Min</option>
                  <option value="0">00</option>
                  <option value="15">15</option>
                  <option value="30">30</option>
                  <option value="45">45</option>
                </select>
                <select id="eventCheckInMeridiem" class="form-select" aria-label="Check-in AM or PM">
                  <option value="" selected disabled>--</option>
                  <option value="AM">AM</option>
                  <option value="PM">PM</option>
                </select>
              </div>
              <small class="text-muted-brand d-block mt-1">Pick your own arrival time, or leave blank to use the default for this duration.</small>
            </div>
            <div class="col-md-6 d-none" id="eventCheckOutTimeWrap">
              <label class="form-label text-brand cvr-time-label-row" for="eventCheckOutHour">Check-out Time <span class="cvr-time-flex-badge">Flexible</span></label>
              <div class="cvr-time-picker-group" role="group" aria-label="Preferred event check-out time">
                <select id="eventCheckOutHour" class="form-select" aria-label="Check-out hour">
                  <option value="" selected disabled>Hr</option>
                  <option value="1">1</option><option value="2">2</option><option value="3">3</option>
                  <option value="4">4</option><option value="5">5</option><option value="6">6</option>
                  <option value="7">7</option><option value="8">8</option><option value="9">9</option>
                  <option value="10">10</option><option value="11">11</option><option value="12">12</option>
                </select>
                <span class="cvr-time-picker-sep">:</span>
                <select id="eventCheckOutMinute" class="form-select" aria-label="Check-out minute">
                  <option value="" selected disabled>Min</option>
                  <option value="0">00</option>
                  <option value="15">15</option>
                  <option value="30">30</option>
                  <option value="45">45</option>
                </select>
                <select id="eventCheckOutMeridiem" class="form-select" aria-label="Check-out AM or PM">
                  <option value="" selected disabled>--</option>
                  <option value="AM">AM</option>
                  <option value="PM">PM</option>
                </select>
              </div>
              <small class="text-muted-brand d-block mt-1">Pick your own departure time on the last day, or leave blank to use the default 12:00 NN.</small>
            </div>
              </div>
            </div>
            </div>
            <div class="col-12"><div class="bk-form-section">
              <div class="bk-sec-head"><span class="n">4</span><div><h3>Anything else?</h3><p>Special requests, setup ideas, or questions for our team.</p></div></div>
              <div class="row g-3">
            <div class="col-12">
              <label for="eventNotes" class="form-label text-brand">Additional Notes</label>
              <textarea id="eventNotes" class="form-control" rows="4" placeholder="Enter any special requests or notes"></textarea>
            </div>
              </div>
            </div>
            </div>
            <div class="col-12 bk-submit-bar">
              <button type="submit" class="btn btn-brand px-4"><i class="bi bi-send-check me-2"></i>Submit Event Reservation</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  </section>

  <div class="modal fade cvr-room-modal" id="roomDetailsModal" tabindex="-1" aria-labelledby="roomDetailsTitle" aria-hidden="true">
    <div class="modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable">
      <div class="modal-content">
        <div class="modal-header">
          <h5 class="modal-title text-brand" id="roomDetailsTitle">Room details</h5>
          <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
        </div>
        <div class="modal-body">
          <div class="room-details-photo-wrap mb-3">
            <img id="roomDetailsPhoto" src="" alt="" class="room-details-photo">
          </div>
          <p class="text-muted-brand mb-1" id="roomDetailsTagline"></p>
          <p class="text-muted-brand" id="roomDetailsDescription"></p>
          <h6 class="text-brand mt-4 mb-2">Room facts</h6>
          <ul class="small text-muted-brand ps-3" id="roomDetailsSpecs"></ul>
          <h6 class="text-brand mt-4 mb-2">Inclusions</h6>
          <ul class="small text-muted-brand ps-3" id="roomDetailsInclusions"></ul>
          <h6 class="text-brand mt-4 mb-2">Availability (next 4 weeks)</h6>
          <div id="roomDetailsAvailability"></div>

          <div class="d-flex align-items-center justify-content-between mt-4 mb-2 flex-wrap gap-2">
            <h6 class="text-brand mb-0">Guest Reviews</h6>
            <div id="roomDetailsReviewsSummary" class="small text-muted-brand"></div>
          </div>
          <p class="small text-muted-brand fst-italic mb-2">Reviews from guests who've stayed in this specific room, shown here so you can see what to expect before booking it.</p>
          <div id="roomDetailsReviews" class="room-details-reviews"></div>
          <div class="room-guest-picker mt-3 p-3 rounded-3 border">
            <h6 class="text-brand mb-2">Guests for this stay</h6>
            <div class="row g-2">
              <div class="col-6">
                <label for="roomAdults" class="small text-muted-brand mb-1">Adults</label>
                <input id="roomAdults" type="number" min="1" value="1" class="form-control" inputmode="numeric">
              </div>
              <div class="col-6">
                <label for="roomChildren" class="small text-muted-brand mb-1">Kids</label>
                <input id="roomChildren" type="number" min="0" value="0" class="form-control" inputmode="numeric">
              </div>
            </div>
            <div class="small text-muted-brand mt-2" id="roomGuestHint"></div>
            <div class="small text-danger fw-semibold mt-1 d-none" id="roomGuestError" role="alert"></div>
          </div>
        </div>
        <div class="modal-footer">
          <button type="button" class="btn btn-outline-secondary" data-bs-dismiss="modal">Close</button>
          <a href="admin/calendar.html" id="roomDetailsCalendarLink" class="btn btn-brand d-none"><i class="bi bi-calendar3 me-1"></i>Open calendar</a>
          <button type="button" id="roomDetailsBookBtn" class="btn btn-brand d-none">Book Now</button>
        </div>
      </div>
    </div>
  </div>

  <div class="modal fade cvr-room-modal" id="eventDetailsModal" tabindex="-1" aria-labelledby="eventDetailsTitle" aria-hidden="true">
    <div class="modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable">
      <div class="modal-content">
        <div class="modal-header">
          <h5 class="modal-title text-brand" id="eventDetailsTitle">Package details</h5>
          <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
        </div>
        <div class="modal-body">
          <div id="eventDetailsPhoto" class="mb-3"></div>
          <div class="d-flex justify-content-between align-items-start gap-2 flex-wrap">
            <p class="text-muted-brand mb-1" id="eventDetailsTagline"></p>
            <div class="text-end ms-auto">
              <div class="fw-bold text-brand fs-5" id="eventDetailsPrice"></div>
              <div class="small text-muted-brand" id="eventDetailsPriceNote"></div>
              <div class="small text-primary" id="eventDetailsSurcharge"></div>
            </div>
          </div>
          <h6 class="text-brand mt-4 mb-2">Package facts</h6>
          <ul class="small text-muted-brand ps-3" id="eventDetailsFacts"></ul>
          <h6 class="text-brand mt-4 mb-2">Inclusions</h6>
          <ul class="small text-muted-brand ps-3" id="eventDetailsInclusions"></ul>
          <div id="eventDetailsAddonsWrap">
            <h6 class="text-brand mt-4 mb-2">Available add-ons</h6>
            <ul class="small text-muted-brand ps-3" id="eventDetailsAddons"></ul>
          </div>
          <div id="eventDetailsMotifsWrap">
            <h6 class="text-brand mt-4 mb-2">Motif / color themes</h6>
            <div class="d-flex flex-wrap gap-2" id="eventDetailsMotifs"></div>
          </div>
        </div>
        <div class="modal-footer">
          <button type="button" class="btn btn-outline-secondary" data-bs-dismiss="modal">Close</button>
          <button type="button" id="eventDetailsContinueBtn" class="btn btn-brand">Continue booking</button>
        </div>
      </div>
    </div>
  </div>

  <button type="button" class="bk-float" id="bkFloat" aria-label="Change dates"><i class="bi bi-sliders"></i>Change dates</button>
  <div id="site-footer"></div>
  <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/js/bootstrap.bundle.min.js"></script>
  <script src="../js/main.js?v=20261025e"></script>
  <script src="../js/duration-pricing.js?v=20260924d"></script>
  <script src="../js/booking-data.js?v=20261025a"></script>
  <script src="https://cdn.jsdelivr.net/npm/flatpickr"></script>
  <script src="../js/ph-holidays.js?v=20260830i"></script>
  <script src="../js/reservation-calendar.js?v=20261026a"></script>
  <script src="../js/package-media.js?v=20261026a"></script>
  <script src="../js/booking.js?v=20261026c"></script>
  <script src="../js/booking-search-calendar.js?v=20261026a"></script>
  <script src="../js/booking-staff.js?v=20260830i"></script>
  <script>
    (async () => {

      await window.CVRBookingCatalog?.catalogReady;
      renderNavbar("booking");
      renderFooter();
      initBookingPage();

      if (!initStaffRoomsView()) initBookingSearchDateRange();
    })();
  </script>
</body>
</html>

@endverbatim
