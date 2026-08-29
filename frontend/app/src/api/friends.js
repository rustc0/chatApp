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

export async function getFriendRequests() {
  const response = await authedFetch("/api/friends/requests");
  const data = await parseJsonResponse(response);

  if (!response.ok) {
    throw new Error(data?.message || "Failed to fetch friend requests");
  }

  return data;
}

export async function sendFriendRequest(friendId) {
  const response = await authedFetch(`/api/friends/add/${friendId}`, {
    method: "POST",
  });

  if (!response.ok) {
    const data = await parseJsonResponse(response);
    throw new Error(data?.message || "Failed to send friend request");
  }

  return parseJsonResponse(response);
}

export async function acceptFriendRequest(requestId) {
  const response = await authedFetch(`/api/friends/request/${requestId}/accept`, {
    method: "POST",
  });

  if (!response.ok) {
    const data = await parseJsonResponse(response);
    throw new Error(data?.message || "Failed to accept friend request");
  }

  return parseJsonResponse(response);
}

export async function declineFriendRequest(requestId) {
  const response = await authedFetch(`/api/friends/request/${requestId}/decline`, {
    method: "POST",
  });

  if (!response.ok) {
    const data = await parseJsonResponse(response);
    throw new Error(data?.message || "Failed to decline friend request");
  }
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
