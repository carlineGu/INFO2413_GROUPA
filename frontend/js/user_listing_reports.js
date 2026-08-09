(function initializeUserListingReportsPage() {
  "use strict";

  const tableBody = document.getElementById("reportsTableBody");
  const reportsCount = document.getElementById("reportsCount");
  const statTotal = document.getElementById("statTotal");
  const statPending = document.getElementById("statPending");
  const statResolved = document.getElementById("statResolved");
  const statIssue = document.getElementById("statIssue");
  const signOutButton = document.getElementById("signOutButton");

  const STATUS_LABELS = {
    PENDING: "Pending",
    UNDER_REVIEW: "Under Review",
    RESOLVED: "Resolved",
    REJECTED: "Dismissed"
  };

  let currentReports = [];
  const detailCache = new Map();
  const openDetailIds = new Set();

  function formatDate(value) {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return "";
    }
    return date.toISOString().slice(0, 10);
  }

  function isClosed(status) {
    return status === "RESOLVED" || status === "REJECTED";
  }

  function renderStats(reports) {
    const total = reports.length;
    const pending = reports.filter(
      (r) => r.status === "PENDING" || r.status === "UNDER_REVIEW"
    ).length;
    const resolved = reports.filter((r) => isClosed(r.status)).length;

    const reasonCounts = new Map();
    reports.forEach((r) => {
      reasonCounts.set(r.reason, (reasonCounts.get(r.reason) || 0) + 1);
    });
    let topReason = "\u2013";
    let topCount = 0;
    reasonCounts.forEach((count, reason) => {
      if (count > topCount) {
        topCount = count;
        topReason = reason;
      }
    });

    statTotal.textContent = String(total);
    statPending.textContent = String(pending);
    statResolved.textContent = String(resolved);
    statIssue.textContent = topReason;
  }

  function detailFieldHtml(label, value) {
    return `
      <div class="detail-field">
        <span class="detail-label">${CampusMarketplace.escapeHtml(label)}</span>
        ${CampusMarketplace.escapeHtml(value ?? "\u2013")}
      </div>
    `;
  }

  function renderListingDetail(listing) {
    const photosHtml = listing.photos && listing.photos.length
      ? `<div class="detail-photos">${listing.photos
          .map(
            (photo) =>
              `<img src="${CampusMarketplace.escapeHtml(photo)}" alt="${CampusMarketplace.escapeHtml(listing.title || "Listing photo")}">`
          )
          .join("")}</div>`
      : '<p class="detail-no-photos">No photos on this listing.</p>';

    return `
      <div class="detail-grid">
        ${detailFieldHtml("Title", listing.title)}
        ${detailFieldHtml("Price", `$${Number(listing.price).toFixed(2)}`)}
        ${detailFieldHtml("Condition", listing.condition)}
        ${detailFieldHtml("Status", listing.status)}
        ${detailFieldHtml("Category", listing.categoryName)}
        ${detailFieldHtml("Department", listing.departmentName)}
        ${detailFieldHtml("Location", listing.locationName)}
        ${detailFieldHtml("Seller", listing.seller?.fullName)}
      </div>
      <p class="detail-description">${CampusMarketplace.escapeHtml(listing.description || "No description provided.")}</p>
      ${photosHtml}
    `;
  }

  function renderUserDetail(user) {
    return `
      <div class="detail-grid">
        ${detailFieldHtml("Full Name", user.fullName)}
        ${detailFieldHtml("Account Status", user.accountStatus)}
        ${detailFieldHtml("Member Since", formatDate(user.memberSince))}
        ${detailFieldHtml("Active Listings", user.listingCount)}
        ${detailFieldHtml("Average Rating", user.averageRating ? user.averageRating : "No ratings yet")}
        ${detailFieldHtml("Review Count", user.reviewCount)}
      </div>
    `;
  }

  async function loadDetail(report) {
    if (detailCache.has(report.reportId)) {
      return detailCache.get(report.reportId);
    }

    const data =
      report.type === "LISTING"
        ? await CampusMarketplace.request(`listing/${report.listingId}`)
        : await CampusMarketplace.request(`user/${report.targetUserId}`);

    const html = report.type === "LISTING" ? renderListingDetail(data) : renderUserDetail(data);
    detailCache.set(report.reportId, html);
    return html;
  }

  async function renderDetailRow(report) {
    const panel = document.getElementById(`detail-panel-${report.reportId}`);
    if (!panel) return;

    panel.innerHTML = '<p class="detail-loading">Loading details&hellip;</p>';
    try {
      const html = await loadDetail(report);
      panel.innerHTML = html;
    } catch (error) {
      panel.innerHTML = `<p class="detail-error">${CampusMarketplace.escapeHtml(error.message || "Could not load details.")}</p>`;
    }
  }

  function renderRows(reports) {
    reportsCount.textContent = `${reports.length} total`;

    if (reports.length === 0) {
      tableBody.innerHTML = '<tr><td colspan="7" class="empty-state">No reports have been submitted.</td></tr>';
      return;
    }

    tableBody.innerHTML = reports
      .map((report) => {
        const statusClass = `status-${report.status.toLowerCase()}`;
        const statusLabel = STATUS_LABELS[report.status] || report.status;
        const typeLabel = report.type === "LISTING" ? "Listing" : "User";
        const disableDismiss = isClosed(report.status);

        return `
          <tr data-report-id="${report.reportId}">
            <td><button type="button" class="name-toggle" data-toggle-detail="${report.reportId}">${CampusMarketplace.escapeHtml(report.name)}</button></td>
            <td><span class="type-pill">${typeLabel}</span></td>
            <td>${CampusMarketplace.escapeHtml(report.reason)}</td>
            <td>${CampusMarketplace.escapeHtml(report.reportedBy)}</td>
            <td>${formatDate(report.createdAt)}</td>
            <td><span class="status-pill ${statusClass}">${statusLabel}</span></td>
            <td>
              <div class="actions-cell">
                <button type="button" class="action-button dismiss-button" data-action="dismiss" ${disableDismiss ? "disabled" : ""}>Dismiss</button>
                <button type="button" class="action-button remove-button" data-action="remove">Remove</button>
              </div>
            </td>
          </tr>
          <tr class="detail-row" id="detail-row-${report.reportId}" hidden>
            <td colspan="7">
              <div class="detail-panel" id="detail-panel-${report.reportId}"></div>
            </td>
          </tr>
        `;
      })
      .join("");

    openDetailIds.forEach((reportId) => {
      const row = document.getElementById(`detail-row-${reportId}`);
      const report = reports.find((r) => String(r.reportId) === String(reportId));
      if (row && report) {
        row.hidden = false;
        renderDetailRow(report);
      }
    });
  }

  async function loadReports() {
    tableBody.innerHTML = '<tr><td colspan="7" class="loading-state">Loading reports&hellip;</td></tr>';
    try {
      const { reports } = await CampusMarketplace.request("report");
      currentReports = reports;
      renderStats(reports);
      renderRows(reports);
    } catch (error) {
      console.error("Failed to load reports:", error);
      tableBody.innerHTML = `<tr><td colspan="7" class="error-state">${CampusMarketplace.escapeHtml(error.message || "Could not load reports.")}</td></tr>`;
    }
  }

  async function handleTableClick(event) {
    const toggleButton = event.target.closest("button[data-toggle-detail]");
    if (toggleButton) {
      const reportId = toggleButton.getAttribute("data-toggle-detail");
      const row = document.getElementById(`detail-row-${reportId}`);
      if (!row) return;

      if (row.hidden) {
        row.hidden = false;
        openDetailIds.add(reportId);
        const report = currentReports.find((r) => String(r.reportId) === String(reportId));
        if (report) {
          renderDetailRow(report);
        }
      } else {
        row.hidden = true;
        openDetailIds.delete(reportId);
      }
      return;
    }

    const actionButton = event.target.closest("button[data-action]");
    if (!actionButton || actionButton.disabled) {
      return;
    }

    const row = actionButton.closest("tr[data-report-id]");
    const reportId = row && row.getAttribute("data-report-id");
    if (!reportId) {
      return;
    }

    const action = actionButton.getAttribute("data-action");
    actionButton.disabled = true;

    try {
      await CampusMarketplace.request(`report/${reportId}/${action}`, { method: "PATCH" });
      await loadReports();
    } catch (error) {
      console.error(`Failed to ${action} report:`, error);
      window.alert(error.message || `Could not ${action} the report.`);
      actionButton.disabled = false;
    }
  }

  if (signOutButton) {
    signOutButton.addEventListener("click", () => {
      CampusMarketplace.clearCurrentUser();
      window.location.href = "login.html";
    });
  }

  tableBody.addEventListener("click", handleTableClick);

  loadReports();
})();