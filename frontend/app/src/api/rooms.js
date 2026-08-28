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

export async function getRooms() {
	const response = await authedFetch("/api/rooms");
	const data = await parseJsonResponse(response);
	if (!response.ok) throw new Error(data?.message || "Failed to fetch rooms");
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