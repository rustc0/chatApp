const API_URL = "/api/users";

let refreshPromise = null;

async function parseResponse(response) {
	const body = await response.text();
	if (!body) {
		return null;
	}

	try {
		return JSON.parse(body);
	} catch {
		return body;
	}
}

async function requestJson(url, init = {}) {
	const response = await fetch(url, {
		...init,
		credentials: "include",
	});
	const data = await parseResponse(response);

	if (!response.ok) {
		throw new Error(data?.message || "Request failed");
	}

	return data;
}

async function refreshAccessToken() {
	if (!refreshPromise) {
		refreshPromise = fetch(`${API_URL}/auth/refresh`, {
			method: "POST",
			credentials: "include",
			headers: {
				Accept: "application/json",
			},
		}).then(async (response) => {
			if (!response.ok) {
				const data = await parseResponse(response);
				throw new Error(data?.message || "Unable to refresh session");
			}

			return parseResponse(response);
		}).finally(() => {
			refreshPromise = null;
		});
	}

	return refreshPromise;
}

export async function authedFetch(url, init = {}) {
	const requestInit = {
		...init,
		credentials: "include",
		headers: {
			...(init.headers || {}),
		},
	};

	const response = await fetch(url, requestInit);
	if (response.status !== 401) {
		return response;
	}

	try {
		await refreshAccessToken();
	} catch {
		return response;
	}

	return fetch(url, requestInit);
}

export async function registerUser(username, email, password) {
	return requestJson(`${API_URL}/register`, {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
		},
		body: JSON.stringify({
			username,
			email,
			password,
		}),
	});
}

export async function loginUser(identifier, password) {
	return requestJson(`${API_URL}/login`, {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
		},
		body: JSON.stringify({
			identifier,
			password,
		}),
	});
}

export async function logoutUser() {
	return requestJson(`${API_URL}/auth/logout`, {
		method: "POST",
	});
}

export async function getMe() {
	const response = await authedFetch(`${API_URL}/me`, {
		method: "GET",
	});
	const data = await parseResponse(response);

	if (!response.ok) {
		throw new Error(data?.message || "Failed to fetch user data");
	}

	return data;
}