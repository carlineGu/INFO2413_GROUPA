(function initializeReviewPage() {
  "use strict";

  const form = document.getElementById("reviewForm");
  if (!form) return;

  const marketplace = window.CampusMarketplace;
  const params = new URLSearchParams(window.location.search);
  const backLink = document.getElementById("backLink");
  const targetSummary = document.getElementById("targetSummary");
  const ratingInput = document.getElementById("rating");
  const commentInput = document.getElementById("comment");
  const commentCount = document.getElementById("commentCount");
  const submitButton = document.getElementById("submitButton");
  const formMessage = document.getElementById("formMessage");
  const reviewsPanel = document.getElementById("reviewsPanel");
  const reviewsList = document.getElementById("reviewsList");
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
  let reviewedUserId = getQueryId(["reviewedUserId", "reviewed_user_id", "sellerId"]);

  function setMessage(message, type = "") {
    formMessage.textContent = message;
    formMessage.className = `form-message${type ? ` ${type}` : ""}`;
  }

  function setFormEnabled(enabled) {
    ratingInput.disabled = !enabled;
    commentInput.disabled = !enabled;
    submitButton.disabled = !enabled;
  }

  async function loadListingContext() {
    if (!listingId) {
      throw new Error("Open this form from a listing so the review reaches the correct seller.");
    }

    backLink.href = `listing.html?id=${listingId}`;
    backLink.textContent = "\u2190 Back to listing";
    const listing = await marketplace.request(`listing/${listingId}`);
    const sellerId = parsePositiveId(listing.seller?.userId ?? listing.userId);

    if (reviewedUserId && sellerId && reviewedUserId !== sellerId) {
      throw new Error("The review link does not match this listing's seller.");
    }

    reviewedUserId = reviewedUserId || sellerId;
    if (!reviewedUserId) {
      throw new Error("The seller could not be identified.");
    }

    targetSummary.textContent = `Reviewing ${listing.seller?.fullName || "the seller"} for "${listing.title}".`;
  }

  function renderReviews(reviews) {
    reviewsList.replaceChildren();
    if (!Array.isArray(reviews) || reviews.length === 0) {
      reviewsPanel.hidden = true;
      return;
    }

    reviews.slice(0, 5).forEach((review) => {
      const article = document.createElement("article");
      article.className = "review-item";
      const meta = document.createElement("div");
      meta.className = "review-meta";
      const author = document.createElement("strong");
      author.textContent = review.reviewerName || "Marketplace user";
      const details = document.createElement("span");
      const createdAt = review.createdAt ? new Date(review.createdAt) : null;
      const dateLabel = createdAt && !Number.isNaN(createdAt.getTime())
        ? ` \u00b7 ${createdAt.toLocaleDateString()}`
        : "";
      details.textContent = `${review.rating} / 5${dateLabel}`;
      meta.append(author, details);
      article.appendChild(meta);

      if (review.comment) {
        const comment = document.createElement("p");
        comment.className = "review-comment";
        comment.textContent = review.comment;
        article.appendChild(comment);
      }
      reviewsList.appendChild(article);
    });

    reviewsPanel.hidden = false;
  }

  async function loadRecentReviews() {
    if (!reviewedUserId) return;
    try {
      const result = await marketplace.request(`review?reviewedUserId=${reviewedUserId}&limit=5`);
      renderReviews(result.reviews);
    } catch (error) {
      console.error("Could not load recent reviews:", error);
    }
  }

  commentInput.addEventListener("input", () => {
    commentCount.textContent = `${commentInput.value.length} / 2000`;
  });

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    setMessage("");
    const rating = Number(ratingInput.value);
    const comment = commentInput.value.trim();

    if (!currentUser?.userId) {
      setMessage("Please log in before submitting a review.", "error");
      return;
    }
    if (!listingId || !reviewedUserId) {
      setMessage("The listing or seller is missing from this review link.", "error");
      return;
    }
    if (currentUser.userId === reviewedUserId) {
      setMessage("You cannot review yourself.", "error");
      return;
    }
    if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
      setMessage("Choose a rating from 1 to 5 stars.", "error");
      ratingInput.focus();
      return;
    }

    submitButton.disabled = true;
    submitButton.textContent = "Submitting...";
    try {
      const result = await marketplace.request("review", {
        method: "POST",
        body: {
          reviewerUserId: currentUser.userId,
          reviewedUserId,
          listingId,
          rating,
          comment
        }
      });
      setMessage(result.message || "Review submitted.", "success");
      form.reset();
      commentCount.textContent = "0 / 2000";
      await loadRecentReviews();
    } catch (error) {
      setMessage(error.message || "Could not submit the review.", "error");
    } finally {
      submitButton.disabled = false;
      submitButton.textContent = "Submit review";
    }
  });

  async function initialize() {
    setFormEnabled(false);
    try {
      await loadListingContext();
      await loadRecentReviews();
      if (!currentUser?.userId) {
        setMessage("Please log in before submitting a review.", "error");
        return;
      }
      if (currentUser.userId === reviewedUserId) {
        setMessage("You cannot review your own seller profile.", "error");
        return;
      }
      setFormEnabled(true);
    } catch (error) {
      targetSummary.textContent = "The listing details could not be loaded.";
      setMessage(error.message || "Could not load the review target.", "error");
    }
  }

  initialize();
})();
