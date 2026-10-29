/* Casa Vergara — keeps modals fitting the *visible* screen.
   - sets --cvr-vh to the real visible height (handles mobile toolbars + on-screen keyboard)
   - scrolls a focused field into view inside a modal so the keyboard never covers it
   Safe to delete together with css/modal-responsive.css. */
(function () {
  "use strict";
  var root = document.documentElement;
  var vv = window.visualViewport;

  function setVh() {
    var h = vv ? vv.height : window.innerHeight;
    root.style.setProperty("--cvr-vh", Math.round(h) + "px");
  }
  setVh();
  window.addEventListener("resize", setVh, { passive: true });
  window.addEventListener("orientationchange", function () { setTimeout(setVh, 250); });
  if (vv) {
    vv.addEventListener("resize", setVh);
    vv.addEventListener("scroll", setVh);
  }


  // Toast position: sit just below whichever header the page has (admin top bar,
  // site header, navbar) so pop-up notices never cover the logo or menu buttons.
  function setToastTop() {
    var bottom = 0;
    var els = document.querySelectorAll(".admin-topbar, #siteHeader, header.site-header, .navbar.fixed-top, .navbar.sticky-top");
    for (var i = 0; i < els.length; i++) {
      var cs = getComputedStyle(els[i]);
      if (cs.display === "none" || cs.visibility === "hidden") continue;
      var r = els[i].getBoundingClientRect();
      if (r.height > 0 && r.bottom > bottom) bottom = r.bottom;
    }
    root.style.setProperty("--cvr-toast-top", Math.round(Math.max(bottom, 0) + 10) + "px");
  }
  var toastRaf;
  function queueToastTop() {
    cancelAnimationFrame(toastRaf);
    toastRaf = requestAnimationFrame(setToastTop);
  }
  window.addEventListener("scroll", queueToastTop, { passive: true });
  window.addEventListener("resize", queueToastTop, { passive: true });
  window.addEventListener("load", queueToastTop);
  document.addEventListener("DOMContentLoaded", queueToastTop);
  // headers like the admin bar are rendered by JS after load, so re-check when the page changes
  try {
    new MutationObserver(queueToastTop).observe(document.documentElement, { childList: true, subtree: true });
  } catch (_) {}
  // always re-measure right before a toast is shown
  var origToast = null;
  document.addEventListener("DOMContentLoaded", function () {
    if (typeof window.cvrToast === "function" && !origToast) {
      origToast = window.cvrToast;
      window.cvrToast = function () { setToastTop(); return origToast.apply(this, arguments); };
    }
  });

  // Keep the active field visible when the keyboard opens inside a modal
  document.addEventListener("focusin", function (e) {
    var t = e.target;
    if (!t || !t.closest || !t.closest(".modal.show")) return;
    if (!/^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName)) return;
    setTimeout(function () {
      try { t.scrollIntoView({ block: "center", behavior: "smooth" }); } catch (_) { t.scrollIntoView(); }
    }, 300);
  });

  // Wrap bare tables inside modals so wide tables scroll instead of breaking the layout
  function wrapTables(scope) {
    (scope || document).querySelectorAll(".modal .modal-body table").forEach(function (tb) {
      if (tb.closest(".table-responsive, .cvr-table-scroll")) return;
      var w = document.createElement("div");
      w.className = "cvr-table-scroll";
      tb.parentNode.insertBefore(w, tb);
      w.appendChild(tb);
    });
  }
  document.addEventListener("shown.bs.modal", function (e) { wrapTables(e.target); });
})();
