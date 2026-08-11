const form = document.getElementById("forgotPasswordForm");
const emailInput = document.getElementById("email");
const emailError = document.getElementById("emailError");
const formMessage = document.getElementById("formMessage");
const submitButton = form.querySelector('button[type="submit"]');

form.addEventListener("submit", async (event) => {
  event.preventDefault();

  clearFeedback();

  const email = emailInput.value.trim().toLowerCase();

  if (!email) {
    emailError.textContent = "Please enter your email.";
    showMessage("Please enter your email.", "error");
    return;
  }

  try {
    submitButton.disabled = true;
    submitButton.textContent = "Sending...";

    await window.CampusMarketplace.request("auth/request-password-reset", {
      method: "POST",
      body: { email }
    });

    showMessage(
      "If an account exists for that email, a password reset link has been sent.",
      "success"
    );
    form.reset();
  } catch (error) {
    console.error("Password reset request failed:", error);
    const message = error?.message === "This email does not have an account with us."
      ? "This email does not have an account with us"
      : error.message || "Could not send the reset email.";
    showMessage(message, "error");
  } finally {
    submitButton.disabled = false;
    submitButton.textContent = "Send reset link";
  }
});

function clearFeedback() {
  emailError.textContent = "";
  formMessage.textContent = "";
  formMessage.className = "form-message";
}

function showMessage(message, type) {
  formMessage.textContent = message;
  formMessage.className = `form-message ${type}`;
}
