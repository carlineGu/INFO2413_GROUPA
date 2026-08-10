const loginForm = document.getElementById("loginForm");
const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");
const emailError = document.getElementById("emailError");
const passwordError = document.getElementById("passwordError");
const loginMessage = document.getElementById("loginMessage");
const submitButton = loginForm.querySelector('button[type="submit"]');

loginForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  clearErrors();

  const email = emailInput.value.trim().toLowerCase();
  const password = passwordInput.value;
  let isValid = true;

  if (!email && email !== "admin") {
    emailError.textContent = "Please enter your email.";
    isValid = false;
  }

  if (!password) {
    passwordError.textContent = "Please enter your password.";
    isValid = false;
  }

  if (!isValid) {
    showMessage("Please fix the errors above.", "error");
    return;
  }

  try {
    submitButton.disabled = true;
    submitButton.textContent = "Logging in...";

    const data = await window.CampusMarketplace.request("auth/login", {
      method: "POST",
      body: { email, password }
    });

    window.CampusMarketplace.setCurrentUser(data.user, data.accessToken);
    showMessage("Login successful. Redirecting...", "success");
    
    // console.log("Data = ", data);
    // console.log("User Role = ", data.user.user_role);

    if(data.user.user_role === "ADMIN") {
      setTimeout(() => {
        window.location.href = "admin_dashboard.html";
      }, 800);
    }
    else {
      setTimeout(() => {
        window.location.href = "index.html";
      }, 800);
    }
  } catch (error) {
    console.error("Login request failed:", error);
    showMessage(error.message || "Could not connect to the backend server.", "error");
  } finally {
    submitButton.disabled = false;
    submitButton.textContent = "Log In";
  }
});

function clearErrors() {
  emailError.textContent = "";
  passwordError.textContent = "";
  loginMessage.textContent = "";
  loginMessage.className = "form-message";
}

function showMessage(message, type) {
  loginMessage.textContent = message;
  loginMessage.className = `form-message ${type}`;
}
