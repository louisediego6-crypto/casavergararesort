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
    var touchDevice = navigator.maxTouchPoints > 0 || "ontouchstart" in window;
    var mobileUserAgent = /Android.*Mobile|iPhone|iPod|Mobile/i.test(navigator.userAgent || "");
    var highDensityTouchScreen = touchDevice && window.devicePixelRatio >= 2.5;
    return touchDevice && (
      (Math.min(width, height) > 0 && Math.min(width, height) <= 767) ||
      mobileUserAgent ||
      highDensityTouchScreen
    );
  };
  var useCompactLayout = isSmallTouchScreen() && (window.innerWidth > 767 || screenWidth() > 767);

  function applyViewport() {
    if (useCompactLayout && isSmallTouchScreen()) {
      var deviceWidth = Math.min(screenWidth(), Math.round(window.screen.height || screenWidth()));
      var compactWidth = deviceWidth <= 767 ? deviceWidth : 390;
      viewport.content = originalContent.replace(/(^|,)\s*width\s*=\s*[^,]+/i, "$1 width=" + compactWidth);
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
