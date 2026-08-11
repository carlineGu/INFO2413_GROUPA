const form = document.getElementById("resetPasswordForm");
const tokenInput = document.getElementById("token");
const passwordInput = document.getElementById("password");
const confirmPasswordInput = document.getElementById("confirmPassword");
const passwordError = document.getElementById("passwordError");
const confirmPasswordError = document.getElementById("confirmPasswordError");
const formMessage = document.getElementById("formMessage");
const submitButton = form.querySelector('button[type="submit"]');

const params = new URLSearchParams(window.location.search);
const token = params.get("token");

if (!token) {
  showMessage("This password reset link is invalid or missing a token.", "error");
  submitButton.disabled = true;
} else {
  tokenInput.value = token;
}

form.addEventListener("submit", async (event) => {
  event.preventDefault();

  clearFeedback();

  const password = passwordInput.value;
  const confirmPassword = confirmPasswordInput.value;

  if (!password) {
    passwordError.textContent = "Please enter a new password.";
    showMessage("Please enter a new password.", "error");
    return;
  }

  if (password.length < 8) {
    passwordError.textContent = "Password must be at least 8 characters long.";
    showMessage("Password must be at least 8 characters long.", "error");
    return;
  }

  if (password !== confirmPassword) {
    confirmPasswordError.textContent = "Passwords do not match.";
    showMessage("Passwords do not match.", "error");
    return;
  }

  try {
    submitButton.disabled = true;
    submitButton.textContent = "Updating...";

    await window.CampusMarketplace.request("auth/reset-password", {
      method: "POST",
      body: {
        token: tokenInput.value,
        password
      }
    });

    showMessage("Password reset successful. Redirecting to login...", "success");
    setTimeout(() => {
      window.location.href = "login.html";
    }, 1500);
  } catch (error) {
    console.error("Password reset failed:", error);
    showMessage(error.message || "Could not reset the password.", "error");
  } finally {
    submitButton.disabled = false;
    submitButton.textContent = "Update password";
  }
});

function clearFeedback() {
  passwordError.textContent = "";
  confirmPasswordError.textContent = "";
  formMessage.textContent = "";
  formMessage.className = "form-message";
}

function showMessage(message, type) {
  formMessage.textContent = message;
  formMessage.className = `form-message ${type}`;
}
