/**
 * Who is signed in, client-side.
 *
 * The tokens themselves live in httpOnly cookies, so nothing here can read
 * them — this only remembers *that* a session was established (so App can skip
 * the /me round trip when there is nothing to restore) and caches the user so
 * callers that need the current id synchronously don't have to await /me.
 *
 * Storage can throw (private mode, blocked site data); every access is guarded
 * and falls back to an in-memory copy.
 */

const STORAGE_KEY = "ft.session";

let currentUser = null;
let signedIn = false;

function readFlag() {
  try {
    return localStorage.getItem(STORAGE_KEY) === "1";
  } catch {
    return signedIn;
  }
}

/** True when a session was established in this browser (cookies may still have expired). */
export function hasSession() {
  return signedIn || readFlag();
}

export function getCurrentUser() {
  return currentUser;
}

export function getCurrentUserId() {
  return currentUser?.id ?? null;
}

/** Called after login/register/me — remembers the user and raises the flag. */
export function setSession(user) {
  currentUser = user ?? null;
  signedIn = true;

  try {
    localStorage.setItem(STORAGE_KEY, "1");
  } catch {
    // the in-memory copy is enough for this tab
  }

  return user;
}

export function clearSession() {
  currentUser = null;
  signedIn = false;

  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // nothing to clear
  }
}
