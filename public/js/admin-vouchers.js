/* Admin / staff voucher manager (Admin > Vouchers). Both admin and event-manager accounts can create, edit,
   hide and delete vouchers. Cards use cvrVoucherCardHtml() from main.js so they match what guests see. */

function initAdminVouchersPage() {
  const grid = document.getElementById("voucherGrid");
  if (!grid) return;

  const $ = (id) => document.getElementById(id);
  const emptyBox = $("voucherEmpty");
  const alertBox = $("voucherAlert");
  const searchInput = $("voucherSearch");
  const statusFilter = $("voucherStatusFilter");
  const resultCount = $("voucherResultCount");

  const modalEl = $("voucherModal");
  const modal = modalEl && window.bootstrap ? new bootstrap.Modal(modalEl) : null;
  const delEl = $("voucherDeleteModal");
  const delModal = delEl && window.bootstrap ? new bootstrap.Modal(delEl) : null;

  const f = {
    id: $("voucherId"),
    title: $("voucherTitle"),
    code: $("voucherCode"),
    desc: $("voucherDescription"),
    typePercent: $("voucherTypePercent"),
    typeFixed: $("voucherTypeFixed"),
    value: $("voucherValue"),
    max: $("voucherMax"),
    maxWrap: $("voucherMaxWrap"),
    minSpend: $("voucherMinSpend"),
    appliesTo: $("voucherAppliesTo"),
    usageLimit: $("voucherUsageLimit"),
    validFrom: $("voucherValidFrom"),
    validUntil: $("voucherValidUntil"),
    terms: $("voucherTerms"),
    active: $("voucherActive"),
    pub: $("voucherPublic"),
    logoResort: $("voucherLogoResort"),
    logoCustom: $("voucherLogoCustom"),
    logoWrap: $("voucherLogoUploadWrap"),
    logoFile: $("voucherLogoFile"),
    logoHint: $("voucherLogoHint"),
    swatches: $("voucherSwatches"),
    alert: $("voucherFormAlert"),
    preview: $("voucherPreview"),
    previewTerms: $("voucherPreviewTerms"),
    save: $("voucherSaveBtn"),
  };

  const PALETTE = ["#0c3b5d", "#2f86bd", "#0f766e", "#b45309", "#9d174d", "#6d28d9", "#1f2937", "#b91c1c"];
  let vouchers = [];
  let accent = PALETTE[0];
  let logoPath = "";
  let logoUrl = "";
  let pendingDeleteId = 0;

  const showAlert = (message, kind = "danger") => {
    alertBox.className = `alert alert-${kind}`;
    alertBox.textContent = message;
    alertBox.classList.remove("d-none");
    if (kind === "success") setTimeout(() => alertBox.classList.add("d-none"), 3500);
  };

  const todayStr = () => new Date().toISOString().slice(0, 10);

  const stateOf = (v) => {
    if (!v.isActive) return { key: "inactive", label: "Off", cls: "text-bg-secondary" };
    if (v.validUntil && v.validUntil < todayStr()) return { key: "expired", label: "Expired", cls: "text-bg-danger" };
    if (v.usageLimit != null && v.usedCount >= v.usageLimit) return { key: "expired", label: "Used up", cls: "text-bg-danger" };
    if (v.validFrom && v.validFrom > todayStr()) return { key: "active", label: "Scheduled", cls: "text-bg-info" };
    return { key: "active", label: "Active", cls: "text-bg-success" };
  };

  /* ---------- list ---------- */
  const render = () => {
    const q = (searchInput.value || "").trim().toLowerCase();
    const filter = statusFilter.value;
    const shown = vouchers.filter((v) => {
      if (q && !(`${v.title} ${v.code}`.toLowerCase().includes(q))) return false;
      const st = stateOf(v);
      if (filter === "active") return st.key === "active";
      if (filter === "inactive") return st.key === "inactive";
      if (filter === "expired") return st.key === "expired";
      return true;
    });

    $("voucherKpiTotal").textContent = vouchers.length;
    $("voucherKpiActive").textContent = vouchers.filter((v) => stateOf(v).key === "active").length;
    $("voucherKpiExpired").textContent = vouchers.filter((v) => stateOf(v).key === "expired").length;
    $("voucherKpiUsed").textContent = vouchers.reduce((n, v) => n + (v.usedCount || 0), 0);
    resultCount.textContent = vouchers.length ? `${shown.length} of ${vouchers.length} shown` : "";

    emptyBox.classList.toggle("d-none", vouchers.length > 0);
    grid.classList.toggle("d-none", vouchers.length === 0);

    grid.innerHTML = shown
      .map((v) => {
        const st = stateOf(v);
        const usage = v.usageLimit != null ? `${v.usedCount} / ${v.usageLimit} used` : `${v.usedCount} used`;
        const footer = `
          <div class="cvr-voucher-admin-bar">
            <span class="badge ${st.cls}">${st.label}</span>
            <span class="badge text-bg-light border">${v.isPublic ? "Shown to guests" : "Code only"}</span>
            <span class="small text-muted-brand ms-auto">${escapeHtml(usage)}</span>
          </div>`;
        return `
          <div class="cvr-voucher-cell" data-id="${v.id}">
            ${cvrVoucherCardHtml(v, { dim: st.key !== "active" })}
            ${footer}
            <div class="cvr-voucher-actions">
              <div class="form-check form-switch mb-0">
                <input class="form-check-input voucher-toggle" type="checkbox" role="switch" id="vt${v.id}" ${v.isActive ? "checked" : ""}>
                <label class="form-check-label small" for="vt${v.id}">Active</label>
              </div>
              <div class="ms-auto d-flex gap-2">
                <button type="button" class="btn btn-sm btn-outline-primary voucher-edit"><i class="bi bi-pencil me-1"></i>Edit</button>
                <button type="button" class="btn btn-sm btn-outline-danger voucher-delete"><i class="bi bi-trash3 me-1"></i>Delete</button>
              </div>
            </div>
          </div>`;
      })
      .join("");

    applySiteImages();

    grid.querySelectorAll(".cvr-voucher-cell").forEach((cell) => {
      const v = vouchers.find((x) => x.id === Number(cell.dataset.id));
      cell.querySelector(".voucher-edit").addEventListener("click", () => openForm(v));
      cell.querySelector(".voucher-delete").addEventListener("click", () => askDelete(v));
      cell.querySelector(".voucher-toggle").addEventListener("change", (e) => toggleActive(v, e.target));
    });
  };

  const load = async () => {
    try {
      const { body } = await cvrApiGet("admin/vouchers-list");
      if (!body.success) throw new Error(body.message || "Could not load vouchers.");
      vouchers = body.data.vouchers || [];
      render();
    } catch (e) {
      showAlert(e.message || "Could not load vouchers.");
    }
  };

  const toPayload = (v, overrides = {}) => ({
    id: v.id,
    code: v.code,
    title: v.title,
    description: v.description,
    discountType: v.discountType,
    discountValue: v.discountValue,
    maxDiscount: v.maxDiscount,
    minSpend: v.minSpend,
    appliesTo: v.appliesTo,
    validFrom: v.validFrom || "",
    validUntil: v.validUntil || "",
    usageLimit: v.usageLimit,
    accentColor: v.accentColor,
    logoPath: v.logoPath || "",
    terms: v.terms || "",
    isActive: v.isActive,
    isPublic: v.isPublic,
    ...overrides,
  });

  const toggleActive = async (v, input) => {
    input.disabled = true;
    const { body } = await cvrApiPost("admin/vouchers-save", toPayload(v, { isActive: input.checked }));
    input.disabled = false;
    if (!body.success) {
      input.checked = !input.checked;
      showAlert(body.message || "Could not update the voucher.");
      return;
    }
    await load();
  };

  /* ---------- form ---------- */
  const type = () => (f.typeFixed.checked ? "fixed" : "percent");

  const currentVoucher = () => ({
    code: (f.code.value || "").trim().toUpperCase() || "YOURCODE",
    title: f.title.value.trim() || "Your voucher title",
    description: f.desc.value.trim() || "A short description appears here.",
    discountType: type(),
    discountValue: Number(f.value.value) || 0,
    maxDiscount: f.max.value !== "" ? Number(f.max.value) : null,
    minSpend: Number(f.minSpend.value) || 0,
    appliesTo: f.appliesTo.value,
    validFrom: f.validFrom.value || null,
    validUntil: f.validUntil.value || null,
    accentColor: accent,
    logoUrl: f.logoCustom.checked && logoUrl ? logoUrl : null,
  });

  const paintPreview = () => {
    const v = currentVoucher();
    f.preview.innerHTML = cvrVoucherCardHtml(v);
    f.previewTerms.textContent = f.terms.value.trim() ? "Terms: " + f.terms.value.trim() : "";
    f.maxWrap.classList.toggle("d-none", type() !== "percent");
    applySiteImages();
  };

  const paintSwatches = () => {
    f.swatches.innerHTML =
      PALETTE.map(
        (c) => `<button type="button" class="cvr-swatch ${c === accent ? "is-active" : ""}" style="--c:${c}" data-color="${c}" aria-label="Use colour ${c}"></button>`
      ).join("") + `<label class="cvr-swatch cvr-swatch--custom" title="Custom colour"><input type="color" id="voucherCustomColor" value="${accent}"><i class="bi bi-palette"></i></label>`;
    f.swatches.querySelectorAll(".cvr-swatch[data-color]").forEach((b) =>
      b.addEventListener("click", () => {
        accent = b.dataset.color;
        paintSwatches();
        paintPreview();
      })
    );
    $("voucherCustomColor")?.addEventListener("input", (e) => {
      accent = e.target.value;
      f.swatches.querySelectorAll(".cvr-swatch[data-color]").forEach((b) => b.classList.remove("is-active"));
      paintPreview();
    });
  };

  const setLogoMode = () => {
    f.logoWrap.classList.toggle("d-none", !f.logoCustom.checked);
    f.logoHint.textContent = logoUrl
      ? "Custom logo uploaded. Choose another file to replace it, or switch back to the resort logo."
      : "PNG, JPG or WEBP up to 2 MB. A square logo looks best.";
    paintPreview();
  };

  const formAlert = (message) => {
    f.alert.textContent = message || "";
    f.alert.classList.toggle("d-none", !message);
  };

  const openForm = (v) => {
    formAlert("");
    const editing = Boolean(v);
    $("voucherModalLabel").textContent = editing ? "Edit voucher" : "New voucher";
    f.id.value = editing ? v.id : 0;
    f.title.value = editing ? v.title : "";
    f.code.value = editing ? v.code : "";
    f.desc.value = editing ? v.description || "" : "";
    f.typePercent.checked = !editing || v.discountType === "percent";
    f.typeFixed.checked = editing && v.discountType === "fixed";
    f.value.value = editing ? v.discountValue : "";
    f.max.value = editing && v.maxDiscount != null ? v.maxDiscount : "";
    f.minSpend.value = editing && v.minSpend ? v.minSpend : "";
    f.appliesTo.value = editing ? v.appliesTo : "all";
    f.usageLimit.value = editing && v.usageLimit != null ? v.usageLimit : "";
    f.validFrom.value = editing ? v.validFrom || "" : "";
    f.validUntil.value = editing ? v.validUntil || "" : "";
    f.terms.value = editing ? v.terms || "" : "";
    f.active.checked = editing ? v.isActive : true;
    f.pub.checked = editing ? v.isPublic : true;
    accent = editing ? v.accentColor || PALETTE[0] : PALETTE[0];
    logoPath = editing ? v.logoPath || "" : "";
    logoUrl = editing ? v.logoUrl || "" : "";
    f.logoResort.checked = !logoUrl;
    f.logoCustom.checked = Boolean(logoUrl);
    f.logoFile.value = "";
    paintSwatches();
    setLogoMode();
    modal?.show();
  };

  const askDelete = (v) => {
    pendingDeleteId = v.id;
    $("voucherDeleteText").textContent = `“${v.title}” (${v.code}) will be removed. Reservations that already used it keep their discount.`;
    delModal?.show();
  };

  /* ---------- events ---------- */
  [f.title, f.code, f.desc, f.value, f.max, f.minSpend, f.validFrom, f.validUntil, f.terms].forEach((el) =>
    el.addEventListener("input", paintPreview)
  );
  [f.typePercent, f.typeFixed, f.appliesTo, f.validFrom, f.validUntil].forEach((el) => el.addEventListener("change", paintPreview));
  [f.logoResort, f.logoCustom].forEach((el) => el.addEventListener("change", setLogoMode));
  f.code.addEventListener("input", () => {
    f.code.value = f.code.value.toUpperCase().replace(/[^A-Z0-9_-]/g, "");
    paintPreview();
  });

  $("voucherGenCode").addEventListener("click", () => {
    const base = (f.title.value || "CASA").toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 6) || "CASA";
    const n = f.value.value ? Math.round(Number(f.value.value)) : Math.floor(10 + Math.random() * 80);
    f.code.value = `${base}${n}`;
    paintPreview();
  });

  f.logoFile.addEventListener("change", async () => {
    const file = f.logoFile.files?.[0];
    if (!file) return;
    formAlert("");
    f.logoHint.textContent = "Uploading logo…";
    const fd = new FormData();
    fd.append("logo", file);
    try {
      const { body } = await cvrApiPostForm("admin/vouchers-logo", fd);
      if (!body.success) throw new Error(body.message || "Upload failed.");
      logoPath = body.data.logoPath;
      logoUrl = body.data.logoUrl;
      setLogoMode();
    } catch (e) {
      formAlert(e.message || "The logo could not be uploaded.");
      f.logoHint.textContent = "PNG, JPG or WEBP up to 2 MB. A square logo looks best.";
    }
  });

  f.save.addEventListener("click", async () => {
    formAlert("");
    const payload = {
      id: Number(f.id.value || 0),
      code: f.code.value.trim(),
      title: f.title.value.trim(),
      description: f.desc.value.trim(),
      discountType: type(),
      discountValue: f.value.value,
      maxDiscount: type() === "percent" ? f.max.value : "",
      minSpend: f.minSpend.value || 0,
      appliesTo: f.appliesTo.value,
      validFrom: f.validFrom.value,
      validUntil: f.validUntil.value,
      usageLimit: f.usageLimit.value,
      accentColor: accent,
      logoPath: f.logoCustom.checked ? logoPath : "",
      terms: f.terms.value.trim(),
      isActive: f.active.checked,
      isPublic: f.pub.checked,
    };
    if (!payload.title) return formAlert("Give the voucher a title.");
    if (payload.code.length < 3) return formAlert("The code needs at least 3 letters or numbers.");
    if (!(Number(payload.discountValue) > 0)) return formAlert("Enter a discount value greater than zero.");
    if (payload.discountType === "percent" && Number(payload.discountValue) > 100) return formAlert("A percentage discount cannot be more than 100%.");
    if (f.logoCustom.checked && !logoPath) return formAlert("Upload a custom logo, or switch back to the resort logo.");

    f.save.disabled = true;
    const { body } = await cvrApiPost("admin/vouchers-save", payload);
    f.save.disabled = false;
    if (!body.success) return formAlert(body.message || "Could not save this voucher.");
    modal?.hide();
    showAlert(payload.id ? "Voucher updated." : "Voucher created.", "success");
    load();
  });

  $("voucherDeleteConfirmBtn").addEventListener("click", async () => {
    const btn = $("voucherDeleteConfirmBtn");
    btn.disabled = true;
    const { body } = await cvrApiPost("admin/vouchers-delete", { id: pendingDeleteId });
    btn.disabled = false;
    delModal?.hide();
    if (!body.success) return showAlert(body.message || "Could not delete the voucher.");
    showAlert("Voucher deleted.", "success");
    load();
  });

  $("voucherAddBtn").addEventListener("click", () => openForm(null));
  $("voucherEmptyAddBtn")?.addEventListener("click", () => openForm(null));
  searchInput.addEventListener("input", render);
  statusFilter.addEventListener("change", render);

  load();
}

window.initAdminVouchersPage = initAdminVouchersPage;
