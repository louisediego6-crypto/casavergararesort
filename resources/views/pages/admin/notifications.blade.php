@verbatim
<!doctype html>
<html lang="en">
<head>
  <link rel="icon" href="/favicon.ico" sizes="any">
  <link rel="icon" type="image/png" sizes="32x32" href="/images/favicon-32.png">
  <link rel="apple-touch-icon" href="/images/apple-touch-icon.png">
  <meta charset="UTF-8" />
  <script src="../../js/theme.js?v=20261024f"></script>
  <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover" />
  <title>Notifications - Admin - Casa Vergara</title>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Playfair+Display:wght@600;700&display=swap" rel="stylesheet">
  <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css" rel="stylesheet">
  <link href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.css" rel="stylesheet">
  <link href="../../css/style.css?v=20260926c" rel="stylesheet">
  <link href="../../css/polish.css?v=20260830i" rel="stylesheet">
  <link href="../../css/modern.css?v=20261018a" rel="stylesheet">
  <link href="../../css/laravel-ui.css?v=20261018b" rel="stylesheet">
  <link href="../../css/admin-modern.css?v=20261018a" rel="stylesheet">
  <link href="../../css/cvr-responsive.css?v=20261020a" rel="stylesheet">
  <link href="../../css/theme-auto.css?v=20261024e" rel="stylesheet">
  <link href="../../css/theme.css?v=20261024e" rel="stylesheet">
  <link href="../../css/modals.css?v=20261025a" rel="stylesheet">
  <link href="../../css/mobile-polish.css?v=20261026a" rel="stylesheet">
  <link href="../../css/dark-fixes.css?v=20261026b" rel="stylesheet">
  <link href="../../css/modal-responsive.css?v=20261027a" rel="stylesheet">
  <script src="../../js/modal-responsive.js?v=20261027a" defer></script>
</head>
<body>
  <div class="admin-wrap admin-page admin-notifications-page">
    <div id="admin-sidebar"></div>
    <main class="admin-main">
      <div class="d-flex justify-content-between align-items-center mb-4 admin-page-head flex-wrap gap-3">
        <div>
          <h1 class="h2 text-brand mb-1"><i class="bi bi-bell me-2"></i>Notifications</h1>
          <p class="text-muted-brand mb-0">Contact-form replies and site updates addressed to your account.</p>
        </div>
        <button type="button" class="btn btn-outline-secondary btn-sm" id="adminNotifMarkAllBtn">
          <i class="bi bi-check2-all me-1"></i>Mark all as read
        </button>
      </div>

      <div class="soft-card p-4">
        <div id="adminNotifPageList">
          <p class="small text-muted-brand mb-0">Loading…</p>
        </div>
      </div>
    </main>
  </div>

  <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/js/bootstrap.bundle.min.js"></script>
  <script src="../../js/main.js?v=20261025e"></script>
  <script>
    renderAdminSidebar("notifications");
    initAdminNotificationsPage();
  </script>
</body>
</html>

@endverbatim
