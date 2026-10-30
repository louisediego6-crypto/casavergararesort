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
  <title>Casa Vergara - My Dashboard</title>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Playfair+Display:wght@600;700&display=swap" rel="stylesheet">
  <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css" rel="stylesheet">
  <link href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.css" rel="stylesheet">
  <link href="../css/style.css?v=20261004f" rel="stylesheet">
  <link href="../css/polish.css?v=20260830i" rel="stylesheet">
  <link href="../css/modern.css?v=20261018a" rel="stylesheet">
  <link href="../css/laravel-ui.css?v=20261018b" rel="stylesheet">
  <link href="../css/cvr-responsive.css?v=20261020a" rel="stylesheet">
  <script>
    (function () {
      try {
        var raw = localStorage.getItem("cvrCustomerSession");
        var s = raw ? JSON.parse(raw) : null;
        if (!s || !s.email) window.location.replace("login.html");
      } catch (err) {
        window.location.replace("login.html");
      }
    })();
  </script>
  <link href="../css/theme-auto.css?v=20261024e" rel="stylesheet">
  <link href="../css/theme.css?v=20261024e" rel="stylesheet">
  <link href="../css/modals.css?v=20261025a" rel="stylesheet">
  <link href="../css/mobile-polish.css?v=20261026a" rel="stylesheet">
  <link href="../css/dark-fixes.css?v=20261026b" rel="stylesheet">
  <link href="../css/modal-responsive.css?v=20261027a" rel="stylesheet">
<<<<<<< HEAD
  <link href="../css/account-ui.css?v=20261030a" rel="stylesheet">
=======
  <link href="../css/responsive-final.css?v=20261029a" rel="stylesheet">
>>>>>>> c0e89b761c22c3ccc94ad70b9c35ee89ba76b63b
  <script src="../js/modal-responsive.js?v=20261027a" defer></script>
</head>
<body id="customerDashboardRoot">
  <div id="site-navbar"></div>

  <section class="section-pad pb-5 acct-page">
    <div class="container acct-container">
      <div class="row g-4 align-items-start">
        <div class="col-lg-4">
          <aside class="acct-profile-card customer-dash-profile" aria-label="Your profile">
            <div class="acct-profile-cover" aria-hidden="true"></div>
            <div class="acct-profile-body">
              <div class="dash-avatar-lg-wrap acct-avatar position-relative flex-shrink-0">
                <img id="dashProfileAvatarImg" class="dash-avatar-lg-img rounded-circle object-fit-cover d-none" width="88" height="88" alt="">
                <div class="dash-avatar-lg text-white fw-bold" id="dashProfileAvatar" aria-hidden="true">—</div>
              </div>
              <h1 class="acct-profile-name text-truncate" id="dashProfileName">Guest</h1>
              <span class="acct-chip"><i class="bi bi-patch-check-fill" aria-hidden="true"></i>Customer account</span>

              <div class="acct-stats" role="list">
                <div class="acct-stat" role="listitem"><strong id="dashStatTotal">0</strong><span>Reservations</span></div>
                <div class="acct-stat" role="listitem"><strong id="dashStatActive">0</strong><span>Active</span></div>
                <div class="acct-stat" role="listitem"><strong id="dashStatUnread">0</strong><span>Unread</span></div>
              </div>

              <ul class="acct-info-list">
                <li><span class="acct-info-ico"><i class="bi bi-envelope" aria-hidden="true"></i></span><div><small>Email</small><span id="dashProfileEmail" class="text-break">—</span></div></li>
                <li><span class="acct-info-ico"><i class="bi bi-telephone" aria-hidden="true"></i></span><div><small>Phone</small><span id="dashProfilePhone">—</span></div></li>
                <li><span class="acct-info-ico"><i class="bi bi-calendar-heart" aria-hidden="true"></i></span><div><small>Member since</small><span id="dashProfileMemberSince">—</span></div></li>
              </ul>

              <div class="acct-profile-actions">
                <a href="booking.html" class="btn btn-accent w-100"><i class="bi bi-calendar-plus me-2"></i>Plan a stay</a>
                <a href="customer-settings.html" class="btn btn-outline-secondary w-100"><i class="bi bi-person-gear me-2"></i>Edit profile &amp; settings</a>
              </div>
            </div>
          </aside>
        </div>

        <div class="col-lg-8">
          <header class="acct-hero">
            <p class="acct-eyebrow">Guest hub</p>
            <h2 class="acct-hero-title">Welcome back, <span id="dashWelcomeName">guest</span></h2>
            <p class="acct-hero-sub">Jump to reservations, payments, or track the status of your booking.</p>
          </header>

          <div class="acct-tiles">
            <a href="booking.html" data-cvr-smart="reservation" class="acct-tile acct-tile--gold">
              <span class="acct-tile-ico"><i class="bi bi-journal-check"></i></span>
              <span class="acct-tile-text"><strong>Reservation</strong><small>Browse packages and complete your reservation details.</small></span>
              <i class="bi bi-arrow-right acct-tile-go" aria-hidden="true"></i>
            </a>
            <a href="booking.html" class="acct-tile acct-tile--teal">
              <span class="acct-tile-ico"><i class="bi bi-door-open"></i></span>
              <span class="acct-tile-text"><strong>Booking</strong><small>Browse rooms and events, then start a new hold.</small></span>
              <i class="bi bi-arrow-right acct-tile-go" aria-hidden="true"></i>
            </a>
            <a href="payment.html" data-cvr-smart="payment" class="acct-tile acct-tile--green">
              <span class="acct-tile-ico"><i class="bi bi-credit-card-2-front"></i></span>
              <span class="acct-tile-text"><strong>Payment</strong><small>Upload proof of payment for an active reservation.</small></span>
              <i class="bi bi-arrow-right acct-tile-go" aria-hidden="true"></i>
            </a>
            <a href="reservation-status.html" data-cvr-smart="status" class="acct-tile acct-tile--violet">
              <span class="acct-tile-ico"><i class="bi bi-activity"></i></span>
              <span class="acct-tile-text"><strong>Status</strong><small>See verification progress and booking summary.</small></span>
              <i class="bi bi-arrow-right acct-tile-go" aria-hidden="true"></i>
            </a>
            <a href="customer-dashboard.html#live-chat" class="acct-tile acct-tile--blue acct-tile--wide" id="dashLiveChatTile">
              <span class="acct-tile-ico"><i class="bi bi-chat-dots"></i></span>
              <span class="acct-tile-text"><strong>Live Chat</strong><small>Send us a message for reservation inquiries and concerns. Our team will respond as soon as available.</small></span>
              <i class="bi bi-arrow-right acct-tile-go" aria-hidden="true"></i>
            </a>
          </div>

          <section class="acct-panel" aria-labelledby="dashResHeading">
            <div class="acct-panel-head">
              <h3 id="dashResHeading"><span class="acct-panel-ico"><i class="bi bi-calendar2-check"></i></span>Your reservations</h3>
            </div>
            <div id="dashReservationsList"></div>
          </section>

          <section class="acct-panel" id="notifications" aria-labelledby="dashNotifHeading">
            <div class="acct-panel-head">
              <h3 id="dashNotifHeading"><span class="acct-panel-ico"><i class="bi bi-bell"></i></span>Notifications</h3>
              <span id="dashNotifUnreadBadge" class="badge rounded-pill text-bg-danger d-none"></span>
            </div>
            <p class="acct-panel-note">Replies to your Contact Us messages, plus updates about your reservations — payment verification, quotations, and booking status. You'll also get these by email.</p>
            <div id="dashNotificationsList">
              <p class="small text-muted-brand mb-0">Loading…</p>
            </div>
          </section>
        </div>
      </div>
    </div>
  </section>

  <div id="site-footer"></div>

  <div class="modal fade" id="dashPayModal" tabindex="-1" aria-labelledby="dashPayModalLabel" aria-hidden="true">
    <div class="modal-dialog modal-dialog-centered">
      <div class="modal-content">
        <div class="modal-header">
          <h5 class="modal-title text-brand" id="dashPayModalLabel"><i class="bi bi-credit-card me-2"></i>Proceed to payment</h5>
          <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
        </div>
        <div class="modal-body">
          <p class="small text-muted-brand mb-3">You're about to upload proof of payment for reservation <strong id="dashPayModalId">—</strong>.</p>
          <div class="d-flex justify-content-between small mb-1"><span>Total package price</span><strong id="dashPayModalTotal">—</strong></div>
          <div class="d-flex justify-content-between small mb-1"><span id="dashPayModalDpLabel">Downpayment due now</span><strong id="dashPayModalDownpayment">—</strong></div>
          <div class="d-flex justify-content-between small text-muted-brand"><span>Balance due before check-in</span><span id="dashPayModalBalance">—</span></div>
        </div>
        <div class="modal-footer">
          <button type="button" class="btn btn-outline-secondary" data-bs-dismiss="modal">Cancel</button>
          <a href="#" id="dashPayModalConfirmBtn" class="btn btn-brand">Continue to payment</a>
        </div>
      </div>
    </div>
  </div>

  <div class="modal fade" id="dashCheckoutModal" tabindex="-1" aria-labelledby="dashCheckoutModalLabel" aria-hidden="true">
    <div class="modal-dialog modal-dialog-centered">
      <div class="modal-content">
        <div class="modal-header">
          <h5 class="modal-title text-brand" id="dashCheckoutModalLabel"><i class="bi bi-door-open me-2"></i>Check out now</h5>
          <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
        </div>
        <div class="modal-body">
          <p class="small text-muted-brand mb-0" id="dashCheckoutModalText">—</p>
        </div>
        <div class="modal-footer">
          <button type="button" class="btn btn-outline-secondary" data-bs-dismiss="modal">Cancel</button>
          <button type="button" class="btn btn-brand" id="dashCheckoutModalConfirmBtn">
            <i class="bi bi-door-open me-1"></i>Confirm check out
          </button>
        </div>
      </div>
    </div>
  </div>

  <div class="modal fade" id="dashCancelModal" tabindex="-1" aria-labelledby="dashCancelModalLabel" aria-hidden="true">
    <div class="modal-dialog modal-dialog-centered">
      <div class="modal-content">
        <div class="modal-header">
          <h5 class="modal-title text-danger" id="dashCancelModalLabel"><i class="bi bi-x-circle me-2"></i>Cancel booking</h5>
          <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
        </div>
        <div class="modal-body">
          <p class="small text-muted-brand mb-0" id="dashCancelModalText">—</p>
        </div>
        <div class="modal-footer">
          <button type="button" class="btn btn-outline-secondary" data-bs-dismiss="modal">Keep booking</button>
          <button type="button" class="btn btn-danger" id="dashCancelModalConfirmBtn">
            <i class="bi bi-x-circle me-1"></i>Yes, cancel booking
          </button>
        </div>
      </div>
    </div>
  </div>

  <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/js/bootstrap.bundle.min.js"></script>
  <script src="../js/duration-pricing.js?v=20260924d"></script>
  <script src="../js/main.js?v=20261030a"></script>
  <script>
    renderNavbar("");
    renderFooter();
    document.getElementById("dashLiveChatTile")?.addEventListener("click", (e) => {
      e.preventDefault();
      window.__cvrOpenLiveChatPending = true;
      document.dispatchEvent(new CustomEvent("cvr-open-live-chat"));
    });
  </script>
</body>
</html>

@endverbatim
