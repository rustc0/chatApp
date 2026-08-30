import { jsonBody, refreshSession, request, requestPublic } from "./http";

export { authedFetch, ApiError } from "./http";
export { refreshSession };

const API_URL = "/api/users";

export async function registerUser(username, email, password) {
  return requestPublic(
    `${API_URL}/register`,
    { method: "POST", ...jsonBody({ username, email, password }) },
    "Failed to create account",
  );
}

export async function loginUser(identifier, password) {
  return requestPublic(
    `${API_URL}/login`,
    { method: "POST", ...jsonBody({ identifier, password }) },
    "Failed to log in",
  );
}

export async function logoutUser() {
  return request(`${API_URL}/auth/logout`, { method: "POST" }, "Failed to log out");
}

export async function getMe() {
  return request(`${API_URL}/me`, { method: "GET" }, "Failed to fetch user data");
}
