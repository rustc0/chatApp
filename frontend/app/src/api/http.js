/**
 * Shared HTTP plumbing for the api layer.
 *
 * Every module used to carry its own copy of parseJsonResponse; this is the one
 * place that knows about cookies, the refresh dance and the backend's error
 * envelope ({ "message": "..." }, set by main.py's exception handlers).
 */

const REFRESH_URL = "/api/users/auth/refresh";

export class ApiError extends Error {
  constructor(message, status, data) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.data = data;
  }
}

async function parseBody(response) {
  const text = await response.text();
  if (!text) return null;

  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

function errorMessage(data, fallback) {
  if (!data) return fallback;
  if (typeof data === "string") return data;
  return data.message || data.detail || fallback;
}

export function buildQuery(params = {}) {
  const query = new URLSearchParams();

  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === "") continue;
    query.set(key, String(value));
  }

  const queryString = query.toString();
  return queryString ? `?${queryString}` : "";
}

export function jsonBody(payload) {
  return {
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  };
}

let refreshPromise = null;

/** Rotates the access token cookie. Concurrent callers share one request. */
export function refreshSession() {
  if (!refreshPromise) {
    refreshPromise = fetch(REFRESH_URL, {
      method: "POST",
      credentials: "include",
      headers: { Accept: "application/json" },
    })
      .then(async (response) => {
        if (!response.ok) {
          const data = await parseBody(response);
          throw new ApiError(errorMessage(data, "Session expired"), response.status, data);
        }
        return parseBody(response);
      })
      .finally(() => {
        refreshPromise = null;
      });
  }

  return refreshPromise;
}

/** fetch + cookies, retried once through /auth/refresh on a 401. */
export async function authedFetch(url, init = {}) {
  const requestInit = { ...init, credentials: "include" };

  const response = await fetch(url, requestInit);
  if (response.status !== 401) return response;

  try {
    await refreshSession();
  } catch {
    return response;
  }

  return fetch(url, requestInit);
}

/** authedFetch + JSON parsing + ApiError on failure. */
export async function request(url, init = {}, fallback = "Request failed") {
  const response = await authedFetch(url, init);
  const data = await parseBody(response);

  if (!response.ok) {
    throw new ApiError(errorMessage(data, fallback), response.status, data);
  }

  return data;
}

/** For endpoints that run before a session exists (register, login). */
export async function requestPublic(url, init = {}, fallback = "Request failed") {
  const response = await fetch(url, { ...init, credentials: "include" });
  const data = await parseBody(response);

  if (!response.ok) {
    throw new ApiError(errorMessage(data, fallback), response.status, data);
  }

  return data;
}
