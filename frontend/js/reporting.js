(function initializeReportingPage() {
  "use strict";

  const form = document.getElementById("reportForm");
  if (!form) return;

  const marketplace = window.CampusMarketplace;
  const params = new URLSearchParams(window.location.search);
  const backLink = document.getElementById("backLink");
  const targetSummary = document.getElementById("targetSummary");
  const categoryInput = document.getElementById("reasonCategory");
  const detailsInput = document.getElementById("reasonDetails");
  const reasonCount = document.getElementById("reasonCount");
  const submitButton = document.getElementById("submitButton");
  const formMessage = document.getElementById("formMessage");
  const currentUser = marketplace.getCurrentUser();

  function parsePositiveId(value) {
    const parsed = Number(value);
    return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : null;
  }

  function getQueryId(names) {
    for (const name of names) {
      const parsed = parsePositiveId(params.get(name));
      if (parsed) return parsed;
    }
    return null;
  }

  const listingId = getQueryId(["listingId", "listing_id", "id"]);
  const requestedTargetUserId = getQueryId(["targetUserId", "target_user_id", "sellerId"]);
  let targetUserId = requestedTargetUserId;

  const LISTING_REASONS = [
    "Misleading or inaccurate listing",
    "Prohibited or unsafe item",
    "Spam or duplicate listing",
    "Price or payment issue",
    "Harassment or suspicious communication",
    "Other concern"
  ];

  const USER_REASONS = [
    "Fake or impersonating account",
    "Harassment or abusive messages",
    "Suspicious buyer or seller behaviour",
    "Spam or scam activity",
    "Inappropriate profile content",
    "Other concern"
  ];

  function setReasonOptions() {
    const options = listingId ? LISTING_REASONS : USER_REASONS;
    const placeholder = options[0] === "Misleading or inaccurate listing"
      ? "Choose a listing concern"
      : "Choose a user concern";

    categoryInput.innerHTML = `
      <option value="">${placeholder}</option>
      ${options.map((option) => `<option value="${option}">${option}</option>`).join("")}
    `;
  }

  function setMessage(message, type = "") {
    formMessage.textContent = message;
    formMessage.className = `form-message${type ? ` ${type}` : ""}`;
  }

  function setFormEnabled(enabled) {
    categoryInput.disabled = !enabled;
    detailsInput.disabled = !enabled;
    submitButton.disabled = !enabled;
  }

  async function loadTargetContext() {
    if (!listingId && !targetUserId) {
      targetSummary.textContent = "A listing or user was not provided in the page link.";
      setMessage("Open this form from the listing or profile you want to report.", "error");
      return false;
    }

    if (listingId) {
      backLink.href = `listing.html?id=${listingId}`;
      backLink.textContent = "\u2190 Back to listing";
      const listing = await marketplace.request(`listing/${listingId}`);
      const sellerId = parsePositiveId(listing.seller?.userId ?? listing.userId);

      if (targetUserId && sellerId && targetUserId !== sellerId) {
        throw new Error("The report link does not match this listing's seller.");
      }

      targetUserId = targetUserId || sellerId;
      if (currentUser?.userId === sellerId) {
        throw new Error("You cannot report your own listing.");
      }

      const sellerName = listing.seller?.fullName;
      targetSummary.textContent = sellerName
        ? `Reporting "${listing.title}" by ${sellerName}.`
        : `Reporting "${listing.title}".`;
      return true;
    }

    backLink.href = `profile.html?id=${targetUserId}`;
    backLink.textContent = "\u2190 Back to profile";
    const user = await marketplace.request(`user/${targetUserId}`);
    targetSummary.textContent = `Reporting ${user.fullName || `User #${targetUserId}`}.`;
    return true;
  }

  detailsInput.addEventListener("input", () => {
    reasonCount.textContent = `${detailsInput.value.length} / 1900`;
  });

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    setMessage("");

    const category = categoryInput.value;
    const details = detailsInput.value.trim();

    if (!currentUser?.userId) {
      setMessage("Please log in before submitting a report.", "error");
      return;
    }
    if (!listingId && !targetUserId) {
      setMessage("The report target is missing.", "error");
      return;
    }
    if (targetUserId === currentUser.userId) {
      setMessage("You cannot report yourself.", "error");
      return;
    }
    if (!category) {
      setMessage("Choose the main reason for this report.", "error");
      categoryInput.focus();
      return;
    }
    if (details.length < 10) {
      setMessage("Provide at least 10 characters of detail.", "error");
      detailsInput.focus();
      return;
    }

    submitButton.disabled = true;
    submitButton.textContent = "Submitting...";

    try {
      const result = await marketplace.request("report", {
        method: "POST",
        body: {
          reporterId: currentUser.userId,
          targetUserId,
          listingId,
          reason: `${category}: ${details}`
        }
      });
      setMessage(result.message || "Report submitted.", "success");
      form.reset();
      reasonCount.textContent = "0 / 1900";
    } catch (error) {
      setMessage(error.message || "Could not submit the report.", "error");
    } finally {
      submitButton.disabled = false;
      submitButton.textContent = "Submit report";
    }
  });

  async function initialize() {
    setReasonOptions();
    setFormEnabled(false);
    try {
      await loadTargetContext();
      if (!currentUser?.userId) {
        setMessage("Please log in before submitting a report.", "error");
        return;
      }
      if (targetUserId === currentUser.userId) {
        setMessage("You cannot report yourself.", "error");
        return;
      }
      setFormEnabled(true);
    } catch (error) {
      targetSummary.textContent = "The report target could not be loaded.";
      setMessage(error.message || "Could not load the report target.", "error");
    }
  }

  initialize();
})();
