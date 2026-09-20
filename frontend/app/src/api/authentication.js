import { jsonBody, refreshSession, request, requestPublic } from "./http";
import { clearSession, setSession } from "./session";

export { authedFetch, ApiError, LOGOUT_EVENT } from "./http";
export { hasSession } from "./session";
export { refreshSession };

const API_URL = "/api/users";

export async function registerUser(username, email, password) {
  const user = await requestPublic(
    `${API_URL}/register`,
    { method: "POST", ...jsonBody({ username, email, password }) },
    "Failed to create account",
  );
  return setSession(user);
}

export async function loginUser(identifier, password) {
  const user = await requestPublic(
    `${API_URL}/login`,
    { method: "POST", ...jsonBody({ identifier, password }) },
    "Failed to log in",
  );
  return setSession(user);
}

/** Clears the cookies server-side, then forgets the local session regardless. */
export async function logoutUser() {
  try {
    return await request(`${API_URL}/auth/logout`, { method: "POST" }, "Failed to log out");
  } finally {
    clearSession();
  }
}

export async function getMe() {
  const me = await request(`${API_URL}/me`, { method: "GET" }, "Failed to fetch user data");
  return setSession(me);
}
