

function cvrProofStatusClass(status) {
  return typeof getStatusChipClass === "function" ? getStatusChipClass(status) : "chip-yellow";
}

function cvrEscapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, (char) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  })[char]);
}

let cvrLatestPaymentProofs = [];
let cvrReceiptObjectUrl = null;
let cvrReceiptRequestId = 0;

/** Shows a payment receipt in a Bootstrap modal (image, PDF, or a download card for other files). */
async function cvrOpenReceiptModal(proof) {
  if (!proof) return;
  let el = document.getElementById("cvrReceiptModal");
  if (!el) {
    el = document.createElement("div");
    el.className = "modal fade";
    el.id = "cvrReceiptModal";
    el.tabIndex = -1;
    el.setAttribute("aria-labelledby", "cvrReceiptModalTitle");
    el.setAttribute("aria-hidden", "true");
    el.innerHTML = `
      <div class="modal-dialog modal-dialog-centered modal-dialog-scrollable modal-lg modal-fullscreen-sm-down">
        <div class="modal-content">
          <div class="modal-header">
            <div class="min-w-0">
              <h5 class="modal-title text-brand mb-0 text-truncate" id="cvrReceiptModalTitle">Proof of payment</h5>
              <div class="small text-muted-brand text-truncate" id="cvrReceiptModalSub"></div>
            </div>
            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
          </div>
          <div class="modal-body p-2 p-md-3 text-center" id="cvrReceiptModalBody" style="min-height:40vh;"></div>
          <div class="modal-footer">
            <a class="btn btn-outline-secondary btn-sm" id="cvrReceiptModalOpen" target="_blank" rel="noopener"><i class="bi bi-box-arrow-up-right me-1"></i>Open in new tab</a>
            <a class="btn btn-brand btn-sm" id="cvrReceiptModalDownload" download><i class="bi bi-download me-1"></i>Download</a>
            <button type="button" class="btn btn-outline-primary btn-sm" data-bs-dismiss="modal">Close</button>
          </div>
        </div>
      </div>`;
    document.body.appendChild(el);
    el.addEventListener("hidden.bs.modal", () => {
      cvrReceiptRequestId++;
      const b = el.querySelector("#cvrReceiptModalBody");
      if (b) b.innerHTML = "";
      if (cvrReceiptObjectUrl) {
        URL.revokeObjectURL(cvrReceiptObjectUrl);
        cvrReceiptObjectUrl = null;
      }
    });
  }

  const requestId = ++cvrReceiptRequestId;
  const type = (proof.fileType || "").toLowerCase();
  const name = (proof.fileName || "").toLowerCase();
  const isImage = type.startsWith("image/") || /\.(jpe?g|png|gif|webp|bmp)$/.test(name);
  const isPdf = type.includes("pdf") || name.endsWith(".pdf");

  el.querySelector("#cvrReceiptModalSub").textContent = [proof.reservationId, proof.customerName].filter(Boolean).join(" · ");
  const body = el.querySelector("#cvrReceiptModalBody");
  const openButton = el.querySelector("#cvrReceiptModalOpen");
  const downloadButton = el.querySelector("#cvrReceiptModalDownload");
  if (cvrReceiptObjectUrl) {
    URL.revokeObjectURL(cvrReceiptObjectUrl);
    cvrReceiptObjectUrl = null;
  }
  openButton.removeAttribute("href");
  downloadButton.removeAttribute("href");
  body.innerHTML = `<div class="py-5 text-muted-brand" role="status"><span class="spinner-border spinner-border-sm me-2" aria-hidden="true"></span>Loading receipt…</div>`;
  window.bootstrap?.Modal.getOrCreateInstance(el).show();

  try {
    const fileUrl = new URL(proof.fileUrl || "", window.location.href);
    const fileMatch = fileUrl.pathname.match(/(?:^|\/)(proof_[A-Za-z0-9_-]+\.[A-Za-z0-9]+)$/);
    if (fileUrl.origin !== window.location.origin || !fileMatch) {
      throw new Error("The receipt link is invalid. Refresh the submissions and try again.");
    }

    const endpoint = `${cvrApiBase()}/admin/payment-proof/${encodeURIComponent(fileMatch[1])}`;
    const response = await fetch(endpoint, { credentials: "same-origin", cache: "no-store" });
    if (!response.ok) {
      if (response.status === 401 || response.status === 403) {
        throw new Error("Your staff session has expired or does not have permission to view this receipt. Sign in again.");
      }
      if (response.status === 404) {
        throw new Error("This receipt file is no longer on the server (it was uploaded before receipts were saved to the database). Open the original receipt from the 'Proof of Payment' email sent to the admin, or ask the guest to re-upload it.");
      }
      throw new Error(`The receipt server returned an error (${response.status}). Please try again or contact support.`);
    }

    const blob = await response.blob();
    if (requestId !== cvrReceiptRequestId || !el.classList.contains("show")) return;
    if (!blob.size || blob.type.includes("json") || blob.type.includes("text/html")) {
      throw new Error("The server did not return a receipt file. Refresh the submissions and try again.");
    }

    cvrReceiptObjectUrl = URL.createObjectURL(blob);
    openButton.href = cvrReceiptObjectUrl;
    downloadButton.href = cvrReceiptObjectUrl;
    downloadButton.setAttribute("download", proof.fileName || "receipt");

    if (isImage) {
      const image = document.createElement("img");
      image.src = cvrReceiptObjectUrl;
      image.alt = "Proof of payment";
      image.style.cssText = "max-width:100%;max-height:70vh;object-fit:contain;border-radius:8px;";
      body.replaceChildren(image);
    } else if (isPdf) {
      const frame = document.createElement("iframe");
      frame.src = cvrReceiptObjectUrl;
      frame.title = "Proof of payment";
      frame.style.cssText = "width:100%;height:70vh;border:0;border-radius:8px;";
      body.replaceChildren(frame);
    } else {
      body.innerHTML = `<div class="py-5"><i class="bi bi-file-earmark-text display-4 text-muted-brand"></i><p class="mt-3 mb-0 text-muted-brand">This file type can't be previewed here. Use Download to open it.</p></div>`;
    }
  } catch (error) {
    if (requestId !== cvrReceiptRequestId || !el.classList.contains("show")) return;
    body.innerHTML = `<div class="alert alert-danger m-3" role="alert">${cvrEscapeHtml(error.message || "This receipt could not be loaded. Please try again.")}</div>`;
  }
}
window.getAdminPaymentProofs = () => cvrLatestPaymentProofs;

async function initAdminSubmittedProofs() {
  const tableBody = document.getElementById("submittedProofsTableBody");
  if (!tableBody) return;

  const countWaiting = document.getElementById("proofCountWaiting");
  const countApproved = document.getElementById("proofCountApproved");
  const countRejected = document.getElementById("proofCountRejected");
  const kpiTotal = document.getElementById("paymentKpiTotal");
  const kpiWaiting = document.getElementById("paymentKpiWaiting");
  const kpiVerified = document.getElementById("paymentKpiVerified");
  const kpiRejected = document.getElementById("paymentKpiRejected");

  const render = async () => {
    tableBody.innerHTML = `<tr><td colspan="7" class="text-center text-muted-brand py-4">Loading submissions…</td></tr>`;

    const { body } = await cvrApiGet("admin/payments-list");
    if (!body?.success) {
      tableBody.innerHTML = `<tr><td colspan="7" class="text-center text-danger py-4">${cvrEscapeHtml(body?.message || "Could not load submissions.")}</td></tr>`;
      cvrLatestPaymentProofs = [];
      if (kpiTotal) kpiTotal.textContent = "—";
      if (kpiWaiting) kpiWaiting.textContent = "—";
      if (kpiVerified) kpiVerified.textContent = "—";
      if (kpiRejected) kpiRejected.textContent = "—";
      return;
    }

    const proofs = body.data?.proofs || [];
    const counts = body.data?.counts || {};
    cvrLatestPaymentProofs = proofs;

    if (countWaiting) countWaiting.textContent = counts.waiting ?? 0;
    if (countApproved) countApproved.textContent = counts.approved ?? 0;
    if (countRejected) countRejected.textContent = counts.rejected ?? 0;

    if (kpiTotal) kpiTotal.textContent = proofs.length;
    if (kpiWaiting) kpiWaiting.textContent = counts.waiting ?? 0;
    if (kpiVerified) kpiVerified.textContent = counts.approved ?? 0;
    if (kpiRejected) kpiRejected.textContent = counts.rejected ?? 0;

    if (!proofs.length) {
      tableBody.innerHTML = `<tr><td colspan="7" class="text-center text-muted-brand py-4">No proof of payment submitted yet.</td></tr>`;
      return;
    }

    tableBody.innerHTML = proofs
      .map((proof) => {
        const submitted = proof.createdAt ? new Date(proof.createdAt.replace(" ", "T")).toLocaleString() : "—";

        const fileType = (proof.fileType || "").toLowerCase();
        const fileName = (proof.fileName || "").toLowerCase();
        const isImage = fileType.startsWith("image/") || /\.(jpe?g|png|gif|webp|bmp|tiff?|heic|heif)$/.test(fileName);
        const isPdf = fileType.includes("pdf") || fileName.endsWith(".pdf");
        const isWord = fileType.includes("word") || /\.docx?$/.test(fileName);
        const isExcel = fileType.includes("sheet") || fileType.includes("excel") || /\.xlsx?$/.test(fileName);
        const isPpt = fileType.includes("presentation") || fileType.includes("powerpoint") || /\.pptx?$/.test(fileName);
        const isArchive = /\.(zip|rar|7z)$/.test(fileName);

        let thumb;
        if (isImage) {
          thumb = `<img src="${cvrEscapeHtml(proof.fileUrl)}" alt="Proof of payment" loading="lazy" style="width:52px;height:52px;object-fit:cover;border-radius:8px;">`;
        } else if (isPdf) {
          thumb = `<i class="bi bi-file-earmark-pdf fs-4 text-danger"></i>`;
        } else if (isWord) {
          thumb = `<i class="bi bi-file-earmark-word fs-4 text-primary"></i>`;
        } else if (isExcel) {
          thumb = `<i class="bi bi-file-earmark-excel fs-4 text-success"></i>`;
        } else if (isPpt) {
          thumb = `<i class="bi bi-file-earmark-ppt fs-4 text-warning"></i>`;
        } else if (isArchive) {
          thumb = `<i class="bi bi-file-earmark-zip fs-4 text-secondary"></i>`;
        } else {
          thumb = `<i class="bi bi-file-earmark-text fs-4 text-muted-brand"></i>`;
        }
        const money = (n) =>
          "₱" + Number(n).toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

        // Payment check (server-computed): 50% downpayment, or the full amount when the guest chose to pay in full.
        const isFullPlan = proof.paymentPlan === "full";
        const planWord = isFullPlan ? "full payment" : "50% downpayment";
        const dpBadge =
          proof.downpaymentRequired == null
            ? `<div class="small text-muted-brand mt-1">Reservation total not found</div>`
            : proof.downpaymentVerified
              ? `<span class="badge text-bg-success mt-1"><i class="bi bi-check2-circle me-1"></i>${isFullPlan ? "Full payment verified" : "50% verified"}</span>`
              : `<span class="badge text-bg-danger mt-1"><i class="bi bi-exclamation-circle me-1"></i>${isFullPlan ? "Below full amount" : "Below 50%"}</span>
                 <div class="small text-danger">Required ${money(proof.downpaymentRequired)}</div>`;

        // Once approved the button is greyed out; it also stays disabled until the required payment is verified.
        const isApproved = proof.status === "Approved";
        const approveBtn = isApproved
          ? `<button class="btn btn-sm btn-secondary proof-action-btn" data-action="Approved" disabled title="This payment is already approved"><i class="bi bi-check2-all me-1"></i>Approved</button>`
          : proof.downpaymentVerified
            ? `<button class="btn btn-sm btn-outline-success proof-action-btn" data-action="Approved">Approve</button>`
            : `<button class="btn btn-sm btn-outline-secondary proof-action-btn" data-action="Approved" disabled title="The ${planWord} must be verified before approving">Approve</button>`;

        return `
          <tr data-proof-id="${proof.id}">
            <td>
              <div class="fw-semibold">${cvrEscapeHtml(proof.reservationId)}</div>
              <div class="small text-muted-brand">${cvrEscapeHtml(proof.packageName || "")}</div>
            </td>
            <td>
              <div>${cvrEscapeHtml(proof.customerName || "Guest")}</div>
              <div class="small text-muted-brand">${cvrEscapeHtml(proof.email || "")}</div>
            </td>
            <td class="small">${cvrEscapeHtml(submitted)}</td>
            <td class="small">${cvrEscapeHtml(proof.amount || "—")}<div class="small text-muted-brand">${cvrEscapeHtml(proof.paymentMethod || "")}</div>${dpBadge}</td>
            <td>
              <button type="button" class="btn btn-link p-0 border-0 d-inline-flex align-items-center gap-2 text-decoration-none proof-view-btn" data-proof-view="${proof.id}" aria-label="View receipt">
                ${thumb}<span class="small">View</span>
              </button>
            </td>
            <td><span class="status-chip ${cvrProofStatusClass(proof.status)}">${cvrEscapeHtml(proof.status)}</span></td>
            <td>
              <div class="d-flex gap-2 flex-wrap">
                ${approveBtn}
                <button class="btn btn-sm btn-outline-danger proof-action-btn" data-action="Rejected">Reject</button>
                <button class="btn btn-sm btn-outline-secondary proof-delete-btn admin-only-action" title="Delete submission" aria-label="Delete submission"><i class="bi bi-trash3"></i></button>
              </div>
            </td>
          </tr>
        `;
      })
      .join("");

    tableBody.querySelectorAll("[data-proof-view]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const id = Number(btn.dataset.proofView);
        cvrOpenReceiptModal(cvrLatestPaymentProofs.find((p) => Number(p.id) === id));
      });
    });

    tableBody.querySelectorAll(".proof-action-btn").forEach((button) => {
      button.addEventListener("click", async () => {
        const row = button.closest("tr");
        const id = Number(row?.dataset.proofId || 0);
        const status = button.dataset.action;
        if (!id) return;

        const guest = row?.querySelector("td:nth-child(2) div")?.textContent?.trim() || "the guest";
        const reference = row?.querySelector("td:nth-child(1) .fw-semibold")?.textContent?.trim() || "";

        let note = "";
        if (status === "Rejected") {

          const result = await window.cvrConfirmModal({
            title: "Reject payment",
            message: `${guest}'s receipt for ${reference} will be rejected, ${guest} will be emailed, and the submission will be permanently removed from this list. This cannot be undone.`,
            confirmText: "Reject & remove",
            icon: "bi-x-octagon",
            withReason: true,
            reasonLabel: "Reason for rejecting (emailed to the guest)",
            reasonPlaceholder: "e.g. The receipt is unreadable — please upload a clearer photo.",
          });
          if (!result.confirmed) return;
          note = result.reason;
        }

        button.disabled = true;
        const { body } = await cvrApiPost("admin/payments-update", { id, status, note });
        button.disabled = false;

        if (!body?.success) {
          cvrToast(body?.message || "Could not update this submission.", "danger");
          return;
        }
        cvrToast(
          status === "Approved"
            ? "Payment verified — the guest has been emailed."
            : "Payment rejected — the guest has been emailed and the submission removed.",
          "success",
        );
        render();
      });
    });

    tableBody.querySelectorAll(".proof-delete-btn").forEach((button) => {
      button.addEventListener("click", async () => {
        const row = button.closest("tr");
        const id = Number(row?.dataset.proofId || 0);
        if (!id) return;

        const reference = row?.querySelector("td:nth-child(1) .fw-semibold")?.textContent?.trim() || "";
        const { confirmed } = await window.cvrConfirmModal({
          title: "Delete payment submission",
          message: `The receipt submitted for ${reference || "this reservation"} will be permanently deleted, including the uploaded file. This cannot be undone.`,
          confirmText: "Delete submission",
          icon: "bi-trash3",
        });
        if (!confirmed) return;

        button.disabled = true;
        const { body } = await cvrApiPost("admin/payments-delete", { id });
        button.disabled = false;

        if (!body?.success) {
          cvrToast(body?.message || "Could not delete this submission.", "danger");
          return;
        }
        cvrToast("Payment submission deleted.", "success");
        render();
      });
    });
  };

  render();
}

document.addEventListener("DOMContentLoaded", initAdminSubmittedProofs);
