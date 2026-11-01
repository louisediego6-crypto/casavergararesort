(() => {
  const frame = document.getElementById("site-content");
  if (frame) {
    const requestedPage = new URLSearchParams(window.location.search).get("page");
    const requestedPath = requestedPage?.split(/[?#]/, 1)[0] || "";

    if (
      requestedPage &&
      /^\/pages\/(?:admin\/)?[A-Za-z0-9-]+\.html$/.test(requestedPath)
    ) {
      frame.src = requestedPage;
    }

    if (window.location.pathname !== "/" || window.location.search || window.location.hash) {
      window.history.replaceState(null, "", "/");
    }

    return;
  }

  if (window.top !== window.self && window.location.pathname.startsWith("/pages/")) {
    return;
  }

  if (window.top === window.self && window.location.pathname.startsWith("/pages/")) {
    const requestedPage = `${window.location.pathname}${window.location.search}${window.location.hash}`;
    window.location.replace(`/?page=${encodeURIComponent(requestedPage)}`);
  }
})();
