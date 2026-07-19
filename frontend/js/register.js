const registerForm = document.getElementById("registerForm");

const fullNameInput = document.getElementById("fullName");
const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");
const termsInput = document.getElementById("terms");

const fullNameError = document.getElementById("fullNameError");
const emailError = document.getElementById("emailError");
const passwordError = document.getElementById("passwordError");
const termsError = document.getElementById("termsError");

const termsRow = document.getElementById("termsRow");
const registerMessage = document.getElementById("registerMessage");
const submitButton = registerForm.querySelector('button[type="submit"]');

registerForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  clearErrors();

  const fullName = fullNameInput.value.trim();
  const email = emailInput.value.trim().toLowerCase();
  const password = passwordInput.value;
  const termsAccepted = termsInput.checked;

  let isValid = true;

  if (fullName.length < 2) {
    showFieldError(
      fullNameInput,
      fullNameError,
      "Please enter your full name."
    );

    isValid = false;
  }

  if (!email) {
    showFieldError(
      emailInput,
      emailError,
      "Please enter your KPU email."
    );

    isValid = false;
  } else if (!email.endsWith("@student.kpu.ca")) {
    showFieldError(
      emailInput,
      emailError,
      "Please use an email ending in @student.kpu.ca."
    );

    isValid = false;
  }

  if (password.length < 8) {
    showFieldError(
      passwordInput,
      passwordError,
      "Password must contain at least 8 characters."
    );

    isValid = false;
  }

  if (!termsAccepted) {
    termsError.textContent =
      "You must agree to the terms of service.";

    termsRow.classList.add("terms-error");
    isValid = false;
  }

  if (!isValid) {
    showMessage("Please fix the errors above.", "error");
    return;
  }

  try {
    submitButton.disabled = true;
    submitButton.textContent = "Creating account...";

    const response = await fetch(
      "http://localhost:3000/api/auth/register",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          fullName,
          email,
          password
        })
      }
    );

    const data = await response.json();

    if (!response.ok) {
      showMessage(
        data.message || "Registration failed.",
        "error"
      );

      return;
    }

    showMessage(
      "Account created successfully. Redirecting...",
      "success"
    );

    registerForm.reset();

    setTimeout(() => {
      window.location.href = "login.html";
    }, 1200);
  } catch (error) {
    console.error("Registration request failed:", error);

    showMessage(
      "Could not connect to the backend server.",
      "error"
    );
  } finally {
    submitButton.disabled = false;
    submitButton.textContent = "Sign Up";
  }
});

function showFieldError(input, errorElement, message) {
  input.classList.add("input-error");
  errorElement.textContent = message;
}

function clearErrors() {
  const inputs = [
    fullNameInput,
    emailInput,
    passwordInput
  ];

  inputs.forEach((input) => {
    input.classList.remove("input-error");
  });

  fullNameError.textContent = "";
  emailError.textContent = "";
  passwordError.textContent = "";
  termsError.textContent = "";

  termsRow.classList.remove("terms-error");

  registerMessage.textContent = "";
  registerMessage.className = "form-message";
}

function showMessage(message, type) {
  registerMessage.textContent = message;
  registerMessage.className = `form-message ${type}`;
}