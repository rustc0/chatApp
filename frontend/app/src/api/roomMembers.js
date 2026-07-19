export async function getRoomMembers(roomId) {
	const response = await fetch(`http://localhost:8000/api/rooms/${roomId}/members`);
	if (!response.ok) {
		throw new Error("Failed to fetch room members");
	}

	return response.json();
}