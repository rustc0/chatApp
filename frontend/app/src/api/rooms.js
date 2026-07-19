export async function getRooms() {
	const response = await fetch("http://localhost:8000/api/rooms");
  
	if (!response.ok) {
	  throw new Error("Failed to fetch rooms");
	}
  
	return response.json();
}