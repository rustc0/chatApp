export async function getDirectMessages() {
	const response = await fetch("http://localhost:8000/api/direct-messages");
  
	if (!response.ok) {
	  throw new Error("Failed to fetch messages");
	}
  
	return response.json();
}