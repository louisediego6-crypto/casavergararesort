(function () {
  var viewport = document.querySelector('meta[name="viewport"]');
  if (!viewport) return;

  var originalContent = viewport.content;
  var root = document.documentElement;
  var screenWidth = function () {
    return Math.round(window.screen.width || 0);
  };
  var isSmallTouchScreen = function () {
    var width = screenWidth();
    var height = Math.round(window.screen.height || 0);
    return (navigator.maxTouchPoints > 0 || "ontouchstart" in window) && Math.min(width, height) > 0 && Math.min(width, height) <= 767;
  };
  var useCompactLayout = isSmallTouchScreen() && window.innerWidth > screenWidth() * 1.05;

  function applyViewport() {
    if (useCompactLayout && isSmallTouchScreen()) {
      viewport.content = originalContent.replace(/(^|,)\s*width\s*=\s*[^,]+/i, "$1 width=" + screenWidth());
      root.classList.add("cvr-small-touch-viewport");
    } else {
      viewport.content = originalContent;
      root.classList.remove("cvr-small-touch-viewport");
    }
  }

  applyViewport();
  window.addEventListener("orientationchange", function () {
    window.setTimeout(applyViewport, 100);
  });
})();
