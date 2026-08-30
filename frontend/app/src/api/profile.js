import { ApiError, authedFetch, buildQuery, jsonBody, request } from "./http";

const API_BASE = "/api/users";

export async function checkUsernameAvailability(username, { signal } = {}) {
  // -> { available: boolean }
  return request(
    `${API_BASE}/check-username${buildQuery({ username })}`,
    { signal },
    "Failed to check username",
  );
}

export async function updateProfile(payload) {
  // payload: { display_name, username, bio } — any subset
  return request(
    `${API_BASE}/me`,
    { method: "PUT", ...jsonBody(payload) },
    "Failed to update profile",
  );
}

export async function getUserByUsername(username) {
  return request(
    `${API_BASE}/by-username${buildQuery({ username })}`,
    {},
    "User not found",
  );
}

/**
 * /me returns the stored filename in `avatar` (it was read as `avatar_file`
 * before, which never existed on the response).
 */
export function avatarUrl(avatar) {
  return avatar ? `${API_BASE}/avatar/${encodeURIComponent(avatar)}` : null;
}

export async function getAvatarBlob(avatar) {
  const response = await authedFetch(avatarUrl(avatar));

  if (!response.ok) {
    throw new ApiError("Failed to fetch avatar", response.status, null);
  }

  return response.blob();
}

export async function uploadAvatar(file) {
  const formData = new FormData();
  formData.append("avatar", file);

  // No Content-Type header — the browser sets the multipart boundary.
  return request(
    `${API_BASE}/me/avatar`,
    { method: "POST", body: formData },
    "Failed to upload avatar",
  );
}

export async function deleteAvatar() {
  return request(`${API_BASE}/me/avatar`, { method: "DELETE" }, "Failed to remove avatar");
}
