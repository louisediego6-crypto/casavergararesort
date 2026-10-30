/*
 * Package media for guests (event/room package photos and attachments).
 *
 * - Accepts ANY file type an admin uploaded for a package:
 *     images (jpg, jfif, png, webp, gif, avif, bmp, tiff, heic ...) show as a photo,
 *     PDFs / videos / audio open in an embedded viewer,
 *     everything else (docx, xlsx, zip ...) shows as a tidy file card with Open / Download.
 *   If a browser can't display an "image" (e.g. HEIC on Chrome) it falls back to the file card.
 * - Every thumbnail is clickable / keyboard-activatable and opens a full-screen viewer.
 * - Fully responsive (fluid thumbnail, viewer fits any screen, safe-area aware).
 *
 * Usage:  CVRPackageMedia.render(path, label)  -> HTML string
 *         CVRPackageMedia.open(url, label)     -> opens the viewer
 */
(function () {
  const IMAGE = new Set(["jpg", "jpeg", "jfif", "pjpeg", "pjp", "png", "apng", "webp", "gif", "bmp", "avif", "ico", "tif", "tiff", "heic", "heif", "jxl"]);
  const VIDEO = new Set(["mp4", "webm", "ogv", "mov", "m4v", "3gp"]);
  const AUDIO = new Set(["mp3", "wav", "ogg", "oga", "m4a", "aac", "flac"]);
  const PDF = new Set(["pdf"]);
  const ICONS = {
    pdf: "bi-file-earmark-pdf", video: "bi-camera-video", audio: "bi-music-note-beamed",
    doc: "bi-file-earmark-word", docx: "bi-file-earmark-word", odt: "bi-file-earmark-text", rtf: "bi-file-earmark-text", txt: "bi-file-earmark-text",
    xls: "bi-file-earmark-excel", xlsx: "bi-file-earmark-excel", csv: "bi-file-earmark-spreadsheet", ods: "bi-file-earmark-spreadsheet",
    ppt: "bi-file-earmark-slides", pptx: "bi-file-earmark-slides", odp: "bi-file-earmark-slides",
    zip: "bi-file-earmark-zip", rar: "bi-file-earmark-zip", "7z": "bi-file-earmark-zip",
  };

  const esc = (s) => {
    const d = document.createElement("div");
    d.textContent = String(s ?? "");
    return d.innerHTML.replace(/"/g, "&quot;");
  };
  const ext = (path) => {
    const clean = String(path || "").split("#")[0].split("?")[0];
    const last = clean.split("/").pop() || "";
    return last.includes(".") ? last.split(".").pop().toLowerCase() : "";
  };
  const kindOf = (path) => {
    const e = ext(path);
    if (PDF.has(e)) return "pdf";
    if (VIDEO.has(e)) return "video";
    if (AUDIO.has(e)) return "audio";
    if (IMAGE.has(e) || !e) return "image"; // no extension: try as a photo, fall back if it fails
    return "file";
  };
  const resolve = (path) => (window.cvrResolvePackageImage ? window.cvrResolvePackageImage(path) : String(path || ""));
  const fileName = (path) => decodeURIComponent(String(path || "").split("?")[0].split("/").pop() || "file");

  function fileCard(url, label, kind, e) {
    const icon = ICONS[e] || ICONS[kind] || "bi-file-earmark";
    const type = (e || "file").toUpperCase();
    return `<span class="cvr-media-file">
      <i class="bi ${icon}" aria-hidden="true"></i>
      <span class="cvr-media-file-name">${esc(fileName(url))}</span>
      <span class="cvr-media-file-hint">${type} · Tap to view</span>
    </span>`;
  }

  function render(path, label, opts) {
    const themed = Boolean(opts && opts.themed);
    const raw = String(path || "").trim();
    if (!raw) return "";
    const url = resolve(raw);
    const kind = kindOf(raw);
    const e = ext(raw);
    const inner = kind === "image"
      ? `<img class="cvr-media-img" src="${esc(url)}" alt="${esc(label)}" loading="lazy" decoding="async">
         <span class="cvr-media-zoom"><i class="bi bi-arrows-angle-expand" aria-hidden="true"></i><span>View</span></span>`
      : fileCard(url, label, kind, e);
    return `<button type="button" class="cvr-media-thumb${themed ? " cvr-themed-photo" : ""}"${themed ? ' data-cvr-media-themed="1"' : ""} data-cvr-media="${esc(url)}" data-cvr-media-label="${esc(label)}" data-cvr-media-kind="${kind}" aria-label="Open ${esc(label)} ${kind === "image" ? "photo" : "file"}">${inner}</button>`;
  }

  let viewer = null;
  let lastFocus = null;

  function close() {
    if (!viewer) return;
    viewer.remove();
    viewer = null;
    document.body.classList.remove("cvr-media-open");
    document.removeEventListener("keydown", onKey, true);
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  }
  function onKey(ev) {
    if (ev.key === "Escape") { ev.stopPropagation(); close(); }
    else if (ev.key === "Tab" && viewer) {
      const f = viewer.querySelectorAll("button, a[href]");
      if (!f.length) return;
      const first = f[0], last = f[f.length - 1];
      if (ev.shiftKey && document.activeElement === first) { ev.preventDefault(); last.focus(); }
      else if (!ev.shiftKey && document.activeElement === last) { ev.preventDefault(); first.focus(); }
    }
  }

  function open(url, label, kindHint, themed) {
    close();
    lastFocus = document.activeElement;
    const kind = kindHint || kindOf(url);
    const e = ext(url);
    let body;
    if (kind === "image") body = `<img class="cvr-media-view-img" src="${esc(url)}" alt="${esc(label)}">`;
    else if (kind === "pdf") body = `<iframe class="cvr-media-view-frame" src="${esc(url)}" title="${esc(label)}"></iframe>`;
    else if (kind === "video") body = `<video class="cvr-media-view-video" src="${esc(url)}" controls playsinline></video>`;
    else if (kind === "audio") body = `<audio class="cvr-media-view-audio" src="${esc(url)}" controls></audio>`;
    else body = `<div class="cvr-media-view-file">${fileCard(url, label, kind, e)}<p>This file type can't be previewed here. Open or download it to view.</p></div>`;

    viewer = document.createElement("div");
    viewer.className = "cvr-media-viewer" + (themed ? " cvr-themed-viewer" : "");
    viewer.setAttribute("role", "dialog");
    viewer.setAttribute("aria-modal", "true");
    viewer.setAttribute("aria-label", label || "Package media");
    viewer.innerHTML = `
      <div class="cvr-media-view-bar">
        <span class="cvr-media-view-title">${esc(label)}</span>
        <span class="cvr-media-view-actions">
          <a class="cvr-media-btn" href="${esc(url)}" target="_blank" rel="noopener"><i class="bi bi-box-arrow-up-right"></i><span>Open</span></a>
          <a class="cvr-media-btn" href="${esc(url)}" download><i class="bi bi-download"></i><span>Download</span></a>
          <button type="button" class="cvr-media-btn cvr-media-close" aria-label="Close viewer"><i class="bi bi-x-lg"></i></button>
        </span>
      </div>
      <div class="cvr-media-view-stage">${body}</div>`;
    viewer.addEventListener("click", (ev) => {
      if (ev.target.closest(".cvr-media-close")) return close();
      // click on the dim backdrop (not the media or the bar) closes
      if (ev.target === viewer || ev.target.classList.contains("cvr-media-view-stage")) close();
      // tap a photo to toggle fit / actual size
      if (ev.target.classList.contains("cvr-media-view-img")) ev.target.classList.toggle("is-zoomed");
    });
    // a photo the browser can't decode (e.g. HEIC) falls back to Open / Download
    viewer.querySelector(".cvr-media-view-img")?.addEventListener("error", () => {
      const stage = viewer?.querySelector(".cvr-media-view-stage");
      if (stage) stage.innerHTML = `<div class="cvr-media-view-file">${fileCard(url, label, "file", e)}<p>Your browser can't display this image format. Open or download it to view.</p></div>`;
    });
    (document.querySelector(".modal.show") || document.body).appendChild(viewer);
    document.body.classList.add("cvr-media-open");
    document.addEventListener("keydown", onKey, true);
    viewer.querySelector(".cvr-media-close")?.focus();
  }

  // Thumbnails render inside dynamic HTML, so listen on the document.
  document.addEventListener("click", (ev) => {
    const t = ev.target.closest("[data-cvr-media]");
    if (!t) return;
    ev.preventDefault();
    open(t.dataset.cvrMedia, t.dataset.cvrMediaLabel || "", t.dataset.cvrMediaKind || "", t.dataset.cvrMediaThemed === "1");
  });
  // A thumbnail photo that fails to load (unsupported format, missing file) becomes a file card.
  document.addEventListener("error", (ev) => {
    const img = ev.target;
    if (!(img instanceof HTMLImageElement) || !img.classList.contains("cvr-media-img")) return;
    const thumb = img.closest(".cvr-media-thumb");
    if (!thumb) return;
    const url = thumb.dataset.cvrMedia;
    thumb.dataset.cvrMediaKind = "file";
    thumb.innerHTML = fileCard(url, thumb.dataset.cvrMediaLabel, "file", ext(url));
  }, true);

  window.CVRPackageMedia = { render, open, close, kindOf };
})();
