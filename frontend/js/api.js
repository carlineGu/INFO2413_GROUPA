(function initializeCampusMarketplaceApi(global) {
  "use strict";

  const API_PREFIX = "/api";
  const ACCESS_TOKEN_KEY = "accessToken";

  function normalizeUser(rawUser) {
    if (!rawUser || typeof rawUser !== "object") {
      return null;
    }

    const userId = Number(rawUser.userId ?? rawUser.user_id);

    return {
      userId: Number.isFinite(userId) && userId > 0 ? userId : null,
      firstName: rawUser.firstName ?? rawUser.first_name ?? "",
      lastName: rawUser.lastName ?? rawUser.last_name ?? "",
      fullName:
        rawUser.fullName ??
        rawUser.name ??
        [rawUser.firstName ?? rawUser.first_name, rawUser.lastName ?? rawUser.last_name]
          .filter(Boolean)
          .join(" "),
      email: rawUser.email ?? rawUser.email_addr ?? "",
      accountStatus: rawUser.accountStatus ?? rawUser.account_status ?? "",
      user_role: rawUser.user_role ?? rawUser.userRole ?? "",
      department: rawUser.department ?? "No Department"
    };
  }

  function getCurrentUser() {
    const serialized =
      global.localStorage.getItem("user") ??
      global.sessionStorage.getItem("user");

    if (!serialized) {
      return null;
    }

    try {
      return normalizeUser(JSON.parse(serialized));
    } catch (error) {
      console.warn("Ignoring invalid stored user data.", error);
      return null;
    }
  }

  function getAccessToken() {
    return (
      global.localStorage.getItem(ACCESS_TOKEN_KEY) ??
      global.sessionStorage.getItem(ACCESS_TOKEN_KEY)
    );
  }

  function setCurrentUser(user, accessToken) {
    const normalized = normalizeUser(user);
    if (!normalized || !normalized.userId) {
      throw new Error("Cannot store a user without a valid userId.");
    }

    global.localStorage.setItem("user", JSON.stringify(normalized));
    global.sessionStorage.removeItem("user");

    if (typeof accessToken === "string" && accessToken.trim()) {
      global.localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
      global.sessionStorage.removeItem(ACCESS_TOKEN_KEY);
    } else {
      global.localStorage.removeItem(ACCESS_TOKEN_KEY);
      global.sessionStorage.removeItem(ACCESS_TOKEN_KEY);
    }

    return normalized;
  }

  function clearCurrentUser() {
    global.localStorage.removeItem("user");
    global.sessionStorage.removeItem("user");
    global.localStorage.removeItem(ACCESS_TOKEN_KEY);
    global.sessionStorage.removeItem(ACCESS_TOKEN_KEY);
  }

  function buildApiUrl(path) {
    if (path.startsWith("/api/")) {
      return path;
    }

    return `${API_PREFIX}/${path.replace(/^\/+/, "")}`;
  }

  async function request(path, options = {}) {
    const headers = new Headers(options.headers || {});
    const accessToken = getAccessToken();
    let body = options.body;

    if (accessToken && !headers.has("Authorization")) {
      headers.set("Authorization", `Bearer ${accessToken}`);
    }

    if (body && typeof body === "object" && !(body instanceof FormData)) {
      headers.set("Content-Type", "application/json");
      body = JSON.stringify(body);
    }

    const response = await global.fetch(buildApiUrl(path), {
      ...options,
      headers,
      body
    });

    const contentType = response.headers.get("content-type") || "";
    const data = contentType.includes("application/json")
      ? await response.json()
      : await response.text();

    if (!response.ok) {
      const message =
        data && typeof data === "object" && data.message
          ? data.message
          : `Request failed with status ${response.status}.`;
      const error = new Error(message);
      error.status = response.status;
      error.data = data;
      throw error;
    }

    return data;
  }

  function escapeHtml(value) {
    const element = global.document.createElement("div");
    element.textContent = value == null ? "" : String(value);
    return element.innerHTML;
  }

  global.CampusMarketplace = Object.freeze({
    clearCurrentUser,
    escapeHtml,
    getAccessToken,
    getCurrentUser,
    normalizeUser,
    request,
    setCurrentUser
  });
})(window);