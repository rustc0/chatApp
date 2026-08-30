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

export async function getUserByUsername(username) {
  const res = await authedFetch(
    `${API_BASE}/by-username?username=${encodeURIComponent(username)}`
  );
  const data = await res.json().catch(() => null);

  if (!res.ok) {
    throw new Error(data?.message || "User not found");
  }

  return data;
}

export async function getAvatarBlob(avatarFile) {
  const response = await authedFetch(`/api/users/avatar/${avatarFile}`);
  if (!response.ok) {
    throw new Error("Failed to fetch avatar");
  }
  return response.blob();
}

export async function uploadAvatar(file) {
  const formData = new FormData();
  formData.append("avatar", file);

  const response = await authedFetch("/api/users/me/avatar", {
    method: "POST",
    body: formData,
  });

  const data = await parseJsonResponse(response);
  if (!response.ok) throw new Error(data?.message || "Failed to upload avatar");
  return data;
}