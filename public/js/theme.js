/* Casa Vergara Resort - light / dark mode.
   Loaded in <head> on every page so the saved theme is applied before first paint (no flash).
   Account menu theme options are rendered by js/main.js and carry [data-cvr-menu-theme]. */
(function () {
  var PREFIX = "cvrTheme:";
  var root = document.documentElement;

  function normalizeSmallTouchViewport() {
    var viewport = document.querySelector('meta[name="viewport"]');
    if (!viewport) return;

    var originalContent = viewport.dataset.cvrOriginalContent || viewport.content;
    viewport.dataset.cvrOriginalContent = originalContent;
    var screenWidth = Math.min(window.screen.width || Infinity, window.screen.height || Infinity);
    var isSmallTouchDevice = navigator.maxTouchPoints > 0 && screenWidth <= 767;
    var desktopLayoutForced = isSmallTouchDevice && window.innerWidth > screenWidth * 1.35;

    if (desktopLayoutForced) {
      viewport.content = "width=device-width, initial-scale=1, viewport-fit=cover";
      root.classList.add("cvr-small-touch-viewport");
    } else {
      viewport.content = originalContent;
      root.classList.remove("cvr-small-touch-viewport");
    }
  }

  window.addEventListener("DOMContentLoaded", normalizeSmallTouchViewport, { once: true });
  window.addEventListener("orientationchange", function () {
    window.setTimeout(normalizeSmallTouchViewport, 100);
  });

  /* The choice is remembered per account (by login email) on this browser.
     Visitors who aren't logged in share a "guest" setting. */
  function key() {
    try {
      var sess = JSON.parse(localStorage.getItem("cvrCustomerSession") || "null");
      var email = sess && sess.email ? String(sess.email).trim().toLowerCase() : "";
      return PREFIX + (email || "guest");
    } catch (e) {
      return PREFIX + "guest";
    }
  }

  function read() {
    try {
      var v = localStorage.getItem(key());
      return v === "dark" || v === "light" ? v : "light";
    } catch (e) {
      return "light";
    }
  }

  function apply(theme) {
    root.setAttribute("data-theme", theme);
    root.setAttribute("data-bs-theme", theme); /* Bootstrap 5.3 dark components (forms, modals, dropdowns, tables) */
    var dark = theme === "dark";
    var label = dark ? "Switch to light mode" : "Switch to dark mode";
    document.querySelectorAll("[data-cvr-theme-toggle]").forEach(function (btn) {
      btn.setAttribute("aria-pressed", dark ? "true" : "false");
      btn.setAttribute("aria-label", label);
      btn.setAttribute("title", label);
    });
    var meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute("content", dark ? "#0e161e" : "#ffffff");
  }

  function set(theme) {
    try { localStorage.setItem(key(), theme); } catch (e) {}
    apply(theme);
  }

  apply(read());

  window.cvrTheme = {
    get: function () { return root.getAttribute("data-theme") || "light"; },
    set: set,
    toggle: function () { set(this.get() === "dark" ? "light" : "dark"); },
    refresh: function () { apply(this.get()); },
  };

  document.addEventListener("click", function (e) {
    var btn = e.target.closest && e.target.closest("[data-cvr-theme-toggle]");
    if (!btn) return;
    e.preventDefault();
    window.cvrTheme.toggle();
  });

  /* keep other open tabs in sync */
  window.addEventListener("storage", function (e) {
    if (e.key === key() || e.key === "cvrCustomerSession") apply(read());
  });

  /* back/forward cache or account switch: re-read this account's setting */
  window.addEventListener("pageshow", function () { apply(read()); });
})();
