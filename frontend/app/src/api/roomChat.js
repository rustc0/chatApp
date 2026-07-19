export async function getRoomChat(roomId) {
	  const response = await fetch(`http://localhost:8000/api/rooms/${roomId}/chat`);

  if (!response.ok) {
	throw new Error("Failed to fetch room chat");
  }

  return response.json();
}