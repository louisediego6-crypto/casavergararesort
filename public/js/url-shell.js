(() => {
  const frame = document.getElementById("site-content");
  if (frame) {
    const loading = document.getElementById("site-loading");
    let loadingTimer = null;
    let hideTimer = null;

    const showLoading = (delay = 0) => {
      window.clearTimeout(loadingTimer);
      window.clearTimeout(hideTimer);
      loadingTimer = window.setTimeout(() => {
        loading.hidden = false;
        requestAnimationFrame(() => loading.classList.add("is-visible"));
      }, delay);
    };

    const hideLoading = () => {
      window.clearTimeout(loadingTimer);
      loading.classList.remove("is-visible");
      hideTimer = window.setTimeout(() => {
        loading.hidden = true;
      }, 180);
    };

    frame.addEventListener("load", hideLoading);
    window.addEventListener("message", (event) => {
      if (
        event.origin === window.location.origin &&
        event.source === frame.contentWindow &&
        event.data === "cvr:navigating"
      ) {
        showLoading(100);
      }
    });

    const requestedPage = new URLSearchParams(window.location.search).get("page");
    const requestedPath = requestedPage?.split(/[?#]/, 1)[0] || "";

    if (
      requestedPage &&
      /^\/pages\/(?:admin\/)?[A-Za-z0-9-]+\.html$/.test(requestedPath)
    ) {
      frame.src = requestedPage;
    }

    if (
      frame.contentDocument?.readyState === "complete" &&
      (!requestedPage || frame.contentWindow.location.pathname === requestedPath)
    ) {
      hideLoading();
    }

    if (window.location.pathname !== "/" || window.location.search || window.location.hash) {
      window.history.replaceState(null, "", "/");
    }

    return;
  }

  window.addEventListener("beforeunload", () => {
    if (window.top !== window.self) {
      window.parent.postMessage("cvr:navigating", window.location.origin);
    }
  });

  if (window.top !== window.self && window.location.pathname.startsWith("/pages/")) {
    return;
  }

  if (window.top === window.self && window.location.pathname.startsWith("/pages/")) {
    const requestedPage = `${window.location.pathname}${window.location.search}${window.location.hash}`;
    window.location.replace(`/?page=${encodeURIComponent(requestedPage)}`);
  }
})();
