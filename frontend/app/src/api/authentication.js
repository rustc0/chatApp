const API_URL = "http://localhost:8000/api/users";

export async function registerUser(username, email, password) {
	const response = await fetch(`${API_URL}/register`, {
	method: "POST",
	headers: {
	  "Content-Type": "application/json"
	},
	body: JSON.stringify({
	  username,
	  email,
	  password
	})
	});

	const data = await response.json();
	if (!response.ok) {
		throw new Error(data.message || "Failed to register user");
	}
	if (data.accessToken) {
		localStorage.setItem("token", data.accessToken);
	}

	return data;
}

export async function loginUser(identifier, password) {
	const response = await fetch(`${API_URL}/login`, {
		method: "POST",
		headers: {
			"Content-Type": "application/json"
		},
		body: JSON.stringify({
			identifier,
			password
		})
	});

	const data = await response.json();

	if (!response.ok) {
		throw new Error(data.message || "Failed to login user");
	}
	if (data.accessToken) {
		localStorage.setItem("token", data.accessToken);
	}

	return data;
}

export async function getMe( token ) {
	const response = await fetch(`${API_URL}/me`, {
		method: "GET",
		headers: {
			"Content-Type": "application/json",
			"Authorization": `Bearer ${token}`	
		}
	});

	const data = await response.json();

	if (!response.ok) {
		throw new Error(data.message || "Failed to fetch user data");
	}

	return data;
}