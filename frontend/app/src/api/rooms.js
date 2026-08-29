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

function buildQuery(params = {}) {
  const query = new URLSearchParams();

  if (params.limit !== undefined) {
    query.set("limit", params.limit);
  }

  if (params.offset !== undefined) {
    query.set("offset", params.offset);
  }

  const qs = query.toString();
  return qs ? `?${qs}` : "";
}

export async function getRooms(params = {}) {
  const response = await authedFetch(`/api/rooms${buildQuery(params)}`);
  const data = await parseJsonResponse(response);
  if (!response.ok) throw new Error(data?.message || "Failed to fetch rooms");
  return data;
}

export async function getRoomInvites(params = {}) {
  const response = await authedFetch(`/api/rooms/invites${buildQuery(params)}`);
  const data = await parseJsonResponse(response);
  if (!response.ok) throw new Error(data?.message || "Failed to fetch room invites");
  return data;
}

export async function getRoom(roomId) {
  const response = await authedFetch(`/api/rooms/${roomId}`);
  const data = await parseJsonResponse(response);
  if (!response.ok) throw new Error(data?.message || "Failed to fetch room");
  return data;
}

export async function createRoom(name) {
  const response = await authedFetch("/api/rooms", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name }),
  });
  const data = await parseJsonResponse(response);
  if (!response.ok) throw new Error(data?.message || "Failed to create room");
  return data;
}

export async function getRoomMembers(roomId) {
  const response = await authedFetch(`/api/rooms/${roomId}/members`);
  const data = await parseJsonResponse(response);
  if (!response.ok) throw new Error(data?.message || "Failed to fetch room members");
  return data;
}

export async function getDirectMessages() {
  const response = await authedFetch("/api/direct-messages");
  const data = await parseJsonResponse(response);
  if (!response.ok) throw new Error(data?.message || "Failed to fetch messages");
  return data;
}

export async function leaveRoom(roomId, userId) {
  const response = await authedFetch(`/api/rooms/${roomId}/members/${userId}`, {
    method: "DELETE",
  });

  if (!response.ok) {
    const data = await parseJsonResponse(response);
    throw new Error(data?.message || "Failed to leave room");
  }
}

export async function acceptRoomInvite(inviteId) {
  const response = await authedFetch(`/api/rooms/invites/${inviteId}/accept`, {
    method: "POST",
  });
  const data = await parseJsonResponse(response);
  if (!response.ok) throw new Error(data?.message || "Failed to accept invite");
  return data;
}

export async function declineRoomInvite(inviteId) {
  const response = await authedFetch(`/api/rooms/invites/${inviteId}`, {
    method: "DELETE",
  });
  if (!response.ok) {
    const data = await parseJsonResponse(response);
    throw new Error(data?.message || "Failed to decline invite");
  }
}

export async function getRoomPendingInvites(roomId) {
  const response = await authedFetch(`/api/rooms/${roomId}/invites`);
  const data = await parseJsonResponse(response);
  if (!response.ok) throw new Error(data?.message || "Failed to fetch pending invites");
  return data;
}

export async function inviteToRoom(roomId, userId) {
  const response = await authedFetch(`/api/rooms/${roomId}/invites`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ user_id: userId }),
  });
  const data = await parseJsonResponse(response);
  if (!response.ok) throw new Error(data?.message || "Failed to send invite");
  return data;
}