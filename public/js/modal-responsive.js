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
