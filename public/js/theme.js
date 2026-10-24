/* Casa Vergara Resort - light / dark mode.
   Loaded in <head> on every page so the saved theme is applied before first paint (no flash).
   The toggle buttons are rendered by js/main.js (navbar + admin top bar) and carry [data-cvr-theme-toggle]. */
(function () {
  var KEY = "cvrTheme";
  var root = document.documentElement;

  function read() {
    try {
      var v = localStorage.getItem(KEY);
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

  function set(theme, animate) {
    try { localStorage.setItem(KEY, theme); } catch (e) {}
    if (animate) {
      root.classList.add("cvr-theme-anim");
      setTimeout(function () { root.classList.remove("cvr-theme-anim"); }, 400);
    }
    apply(theme);
  }

  apply(read());

  window.cvrTheme = {
    get: function () { return root.getAttribute("data-theme") || "light"; },
    set: set,
    toggle: function () { set(this.get() === "dark" ? "light" : "dark", true); },
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
    if (e.key === KEY) apply(read());
  });
})();
