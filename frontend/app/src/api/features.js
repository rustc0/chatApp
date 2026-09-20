import { ApiError } from "./http";

/**
 * Backend endpoints the UI is written against but that don't exist yet. The UI
 * stays in the tree; the gate decides whether it is shown or usable. When an
 * endpoint ships, set its entry to null.
 */
export const missingEndpoints = {
  usernameLookup: null, // GET /api/users/by-username
  usernameCheck: null, // GET /api/users/check-username
  avatarDelete: null, // DELETE /api/users/me/avatar
  sentFriendRequests: "backend: outgoing requests on GET /api/friends/requests",
};

export function isAvailable(feature) {
  return !missingEndpoints[feature];
}

/** Throws a readable "not available yet" error when the endpoint is missing. */
export function requireEndpoint(feature) {
  const needs = missingEndpoints[feature];
  if (needs) {
    throw new ApiError(`Not available yet: needs ${needs}`, 501, null);
  }
}
