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
  <title>Casa Vergara - Account settings</title>
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
  <link href="../css/responsive-final.css?v=20261029a" rel="stylesheet">
  <link href="../css/account-ui.css?v=20261031b" rel="stylesheet">
  <script src="../js/modal-responsive.js?v=20261027a" defer></script>
</head>
<body id="customerSettingsRoot">
  <div id="site-navbar"></div>

  <section class="section-pad pb-5 acct-page">
    <div class="container acct-container acct-container--narrow">
      <nav class="mb-3" aria-label="breadcrumb">
        <ol class="breadcrumb small mb-0">
          <li class="breadcrumb-item"><a href="customer-dashboard.html" class="text-decoration-none">Dashboard</a></li>
          <li class="breadcrumb-item active" aria-current="page">Settings</li>
        </ol>
      </nav>

      <header class="acct-settings-head acct-settings-head--banner">
        <div>
          <p class="acct-eyebrow">Profile</p>
          <h1 class="acct-hero-title"><i class="bi bi-person-gear me-2"></i>Account settings</h1>
          <p class="acct-hero-sub">Update your profile photo, display name, and password.</p>
        </div>
        <a href="customer-dashboard.html" class="btn acct-back-btn"><i class="bi bi-arrow-left me-2"></i>Back to dashboard</a>
      </header>

      <div class="row g-4">
        <div class="col-lg-4">
          <section class="acct-panel acct-photo-panel">
            <div class="acct-panel-head">
              <h2 class="h6"><span class="acct-panel-ico"><i class="bi bi-camera"></i></span>Profile picture</h2>
            </div>
            <div id="settingsPhotoAlert" class="alert d-none small mb-3" role="alert"></div>
            <div class="settings-photo-frame acct-photo-frame">
              <img id="settingsPhotoPreview" class="settings-photo-preview rounded-circle object-fit-cover d-none" width="132" height="132" alt="" onerror="this.classList.add('d-none'); document.getElementById('settingsPhotoPlaceholder')?.classList.remove('d-none');">
              <div id="settingsPhotoPlaceholder" class="settings-photo-placeholder rounded-circle d-flex align-items-center justify-content-center text-white fw-semibold">
                <i class="bi bi-person fs-1 opacity-75" aria-hidden="true"></i>
              </div>
            </div>
            <h3 class="acct-set-name" id="settingsHeadName">—</h3>
            <p class="acct-set-email" id="settingsHeadEmail">—</p>
            <input type="file" id="settingsPhotoFile" class="d-none" accept="*/*">
            <div class="acct-photo-actions">
              <button type="button" class="btn btn-brand btn-sm" id="settingsPhotoPickBtn"><i class="bi bi-upload me-1"></i>Upload photo</button>
              <button type="button" class="btn btn-outline-secondary btn-sm d-none" id="removeCustomerPhotoBtn">Remove</button>
            </div>
            <p class="acct-photo-hint"><i class="bi bi-info-circle me-1"></i>JPG, PNG, GIF, WebP, HEIC, SVG, PDF and more &middot; up to 5&nbsp;MB. Non-image files are saved but shown as a placeholder.</p>
          </section>
        </div>

        <div class="col-lg-8">
          <section class="acct-panel">
            <div class="acct-panel-head">
              <h2 class="h6"><span class="acct-panel-ico"><i class="bi bi-person-vcard"></i></span>Profile details</h2>
            </div>
            <div id="settingsNameAlert" class="alert d-none small mb-3" role="alert"></div>
            <div class="row g-3">
              <div class="col-md-6">
                <label class="form-label small text-brand mb-1" for="settingsFirstName">First name</label>
                <span class="acct-field"><i class="bi bi-person" aria-hidden="true"></i><input type="text" class="form-control" id="settingsFirstName" autocomplete="given-name"></span>
              </div>
              <div class="col-md-6">
                <label class="form-label small text-brand mb-1" for="settingsLastName">Last name</label>
                <span class="acct-field"><i class="bi bi-person-badge" aria-hidden="true"></i><input type="text" class="form-control" id="settingsLastName" autocomplete="family-name"></span>
              </div>
              <div class="col-md-6">
                <label class="form-label small text-brand mb-1" for="settingsPhone">Phone number</label>
                <span class="acct-field"><i class="bi bi-telephone" aria-hidden="true"></i><input type="tel" class="form-control" id="settingsPhone" autocomplete="tel" placeholder="09XXXXXXXXX"></span>
              </div>
            </div>
            <div class="acct-form-foot">
              <button type="button" class="btn btn-accent" id="saveCustomerNameBtn"><i class="bi bi-check2-circle me-2"></i>Save changes</button>
            </div>
          </section>

          <section class="acct-panel">
            <div class="acct-panel-head">
              <h2 class="h6"><span class="acct-panel-ico"><i class="bi bi-shield-lock"></i></span>Password</h2>
            </div>
            <div id="settingsPasswordAlert" class="alert d-none small mb-3" role="alert"></div>
            <div class="row g-3">
              <div class="col-12">
                <label class="form-label small text-brand mb-1" for="settingsCurrentPassword">Current password</label>
                <span class="acct-field"><i class="bi bi-lock" aria-hidden="true"></i><input type="password" class="form-control" id="settingsCurrentPassword" autocomplete="current-password"><button type="button" class="acct-eye" data-eye="settingsCurrentPassword" aria-label="Show password"><i class="bi bi-eye"></i></button></span>
              </div>
              <div class="col-md-6">
                <label class="form-label small text-brand mb-1" for="settingsNewPassword">New password</label>
                <span class="acct-field"><i class="bi bi-lock" aria-hidden="true"></i><input type="password" class="form-control" id="settingsNewPassword" autocomplete="new-password" minlength="6"><button type="button" class="acct-eye" data-eye="settingsNewPassword" aria-label="Show password"><i class="bi bi-eye"></i></button></span>
              </div>
              <div class="col-md-6">
                <label class="form-label small text-brand mb-1" for="settingsConfirmPassword">Confirm new password</label>
                <span class="acct-field"><i class="bi bi-lock" aria-hidden="true"></i><input type="password" class="form-control" id="settingsConfirmPassword" autocomplete="new-password" minlength="6"><button type="button" class="acct-eye" data-eye="settingsConfirmPassword" aria-label="Show password"><i class="bi bi-eye"></i></button></span>
              </div>
            </div>
            <p class="acct-field-hint"><i class="bi bi-shield-check me-1"></i>Use at least 6 characters. You&rsquo;ll stay signed in after changing it.</p>
            <div class="acct-form-foot">
              <button type="button" class="btn btn-outline-primary" id="saveCustomerPasswordBtn"><i class="bi bi-key me-2"></i>Update password</button>
            </div>
          </section>
        </div>
      </div>
    </div>
  </section>

  <div id="site-footer"></div>
  <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/js/bootstrap.bundle.min.js"></script>
  <script src="../js/main.js?v=20261031a"></script>
  <script>
    renderNavbar("");
    renderFooter();
    (function () {
      try {
        var s = getCustomerSession();
        if (s) {
          var n = document.getElementById("settingsHeadName");
          var e = document.getElementById("settingsHeadEmail");
          if (n) n.textContent = customerProfileDisplayName(s) || "Guest";
          if (e) e.textContent = s.email || "";
        }
      } catch (err) {}
      document.addEventListener("click", function (ev) {
        var b = ev.target.closest && ev.target.closest("[data-eye]");
        if (!b) return;
        var inp = document.getElementById(b.getAttribute("data-eye"));
        if (!inp) return;
        var show = inp.type === "password";
        inp.type = show ? "text" : "password";
        b.setAttribute("aria-label", show ? "Hide password" : "Show password");
        b.firstElementChild.className = "bi " + (show ? "bi-eye-slash" : "bi-eye");
      });
    })();
  </script>
</body>
</html>

@endverbatim
