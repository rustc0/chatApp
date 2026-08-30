import { buildQuery, jsonBody, request } from "./http";

const ROOMS = "/api/rooms";

export async function getRooms({ limit, offset } = {}) {
  return request(`${ROOMS}${buildQuery({ limit, offset })}`, {}, "Failed to fetch rooms");
}

/**
 * Invites addressed to the current user.
 * Needs the new `GET /rooms/invites` route (declared above `GET /{room_id}`,
 * otherwise FastAPI reads "invites" as a room id and 422s).
 */
export async function getRoomInvites({ limit = 50, offset = 0 } = {}) {
  return request(
    `${ROOMS}/invites${buildQuery({ limit, offset })}`,
    {},
    "Failed to fetch room invites",
  );
}

export async function getRoom(roomId) {
  return request(`${ROOMS}/${roomId}`, {}, "Failed to fetch room");
}

export async function createRoom(name) {
  return request(
    ROOMS,
    { method: "POST", ...jsonBody({ name }) },
    "Failed to create room",
  );
}

/** Opens (or reuses) the DM room with another user. */
export async function getOrCreateDm(userId) {
  return request(
    `${ROOMS}/dm`,
    { method: "POST", ...jsonBody({ user_id: userId }) },
    "Failed to open conversation",
  );
}

export async function updateRoom(roomId, payload) {
  return request(
    `${ROOMS}/${roomId}`,
    { method: "PATCH", ...jsonBody(payload) },
    "Failed to update room",
  );
}

export async function deleteRoom(roomId) {
  return request(`${ROOMS}/${roomId}`, { method: "DELETE" }, "Failed to delete room");
}

export async function getRoomMembers(roomId) {
  return request(`${ROOMS}/${roomId}/members`, {}, "Failed to fetch room members");
}

export async function addMember(roomId, userId) {
  return request(
    `${ROOMS}/${roomId}/members`,
    { method: "POST", ...jsonBody({ user_id: userId }) },
    "Failed to add member",
  );
}

export async function removeMember(roomId, userId) {
  return request(
    `${ROOMS}/${roomId}/members/${userId}`,
    { method: "DELETE" },
    "Failed to remove member",
  );
}

/** Leaving is removing yourself. */
export async function leaveRoom(roomId, userId) {
  return removeMember(roomId, userId);
}

export async function assignRole(roomId, userId, role) {
  return request(
    `${ROOMS}/${roomId}/members/${userId}/roles`,
    { method: "POST", ...jsonBody({ role }) },
    "Failed to assign role",
  );
}

export async function getRoomPendingInvites(roomId) {
  return request(`${ROOMS}/${roomId}/invites`, {}, "Failed to fetch pending invites");
}

export async function inviteToRoom(roomId, userId) {
  return request(
    `${ROOMS}/${roomId}/invites`,
    { method: "POST", ...jsonBody({ user_id: userId }) },
    "Failed to send invite",
  );
}

export async function acceptRoomInvite(inviteId) {
  return request(
    `${ROOMS}/invites/${inviteId}/accept`,
    { method: "POST" },
    "Failed to accept invite",
  );
}

export async function declineRoomInvite(inviteId) {
  return request(
    `${ROOMS}/invites/${inviteId}`,
    { method: "DELETE" },
    "Failed to decline invite",
  );
}

export function formatTimestamp(value) {
  if (!value) return "";

  const sent = new Date(value);
  if (Number.isNaN(sent.getTime())) return "";

  const now = new Date();
  const sameDay = sent.toDateString() === now.toDateString();
  if (sameDay) {
    return sent.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  }

  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  if (sent.toDateString() === yesterday.toDateString()) return "Yesterday";

  return sent.toLocaleDateString([], { day: "2-digit", month: "short" });
}

/**
 * The DM list shape the UI actually renders. `peer` and `last_message` come
 * from the widened /rooms payload — the old code read conversation.username off
 * a room object that only ever had id/name/type/created_at/modified_at.
 */
export function toConversation(room) {
  const peer = room.peer ?? null;
  const last = room.last_message ?? null;

  return {
    id: room.id,
    userId: peer?.id ?? null,
    username: peer?.username ?? room.name ?? "Direct message",
    status: peer?.status ?? "offline",
    lastMessage: last?.content ?? "",
    timestamp: formatTimestamp(last?.sent_at),
  };
}

export async function listDmConversations() {
  const rooms = await getRooms();
  return (rooms || []).filter((room) => room.type === "dm").map(toConversation);
}
