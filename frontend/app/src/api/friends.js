import { buildQuery, request } from "./http";

const FRIENDS = "/api/friends";

/** limit/offset are now forwarded — the router has always accepted them. */
export async function getFriendsList({ limit = 50, offset = 0 } = {}) {
  return request(
    `${FRIENDS}/list${buildQuery({ limit, offset })}`,
    {},
    "Failed to fetch friends",
  );
}

export async function getFriendRequests({ limit = 50, offset = 0 } = {}) {
  return request(
    `${FRIENDS}/requests${buildQuery({ limit, offset })}`,
    {},
    "Failed to fetch friend requests",
  );
}

export async function sendFriendRequest(friendId) {
  return request(
    `${FRIENDS}/add/${friendId}`,
    { method: "POST" },
    "Failed to send friend request",
  );
}

export async function acceptFriendRequest(requestId) {
  return request(
    `${FRIENDS}/request/${requestId}/accept`,
    { method: "POST" },
    "Failed to accept friend request",
  );
}

export async function declineFriendRequest(requestId) {
  return request(
    `${FRIENDS}/request/${requestId}/decline`,
    { method: "POST" },
    "Failed to decline friend request",
  );
}

/** Cancels a request *you* sent (DELETE /friends/request/{id}). */
export async function cancelFriendRequest(requestId) {
  return request(
    `${FRIENDS}/request/${requestId}`,
    { method: "DELETE" },
    "Failed to cancel friend request",
  );
}

export async function removeFriend(friendId) {
  return request(
    `${FRIENDS}/delete/${friendId}`,
    { method: "DELETE" },
    "Failed to remove friend",
  );
}
