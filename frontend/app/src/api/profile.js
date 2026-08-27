import { authedFetch } from "./authentication";

const API_BASE = "/api/users"

export async function checkUsernameAvailability(username, { signal } = {}) {
  const res = await authedFetch(
    `${API_BASE}/check-username?username=${encodeURIComponent(username)}`,
    { signal }
  );
  if (!res.ok) throw new Error("Failed to check username");
  return res.json(); // { available: boolean }
}

export async function updateProfile(payload) {
  const res = await authedFetch(`${API_BASE}/me`, {
    method: "PUT",
	headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail ?? "Failed to update profile");
  }
  return res.json();
}