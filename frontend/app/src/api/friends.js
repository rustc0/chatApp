import { authedFetch } from "./authentication";

async function parseJsonResponse(response) {
  const text = await response.text();
  if (!text) return null;

  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

export async function getFriendsList() {
  const response = await authedFetch("/api/friends/list");
  const data = await parseJsonResponse(response);

  if (!response.ok) {
    throw new Error(data?.message || "Failed to fetch friends");
  }

  return data;
}

export async function removeFriend(friendId) {
  const response = await authedFetch(`/api/friends/delete/${friendId}`, {
    method: "DELETE",
  });

  if (!response.ok) {
    const data = await parseJsonResponse(response);
    throw new Error(data?.message || "Failed to remove friend");
  }
}
