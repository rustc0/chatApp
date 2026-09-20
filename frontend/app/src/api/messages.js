import { buildQuery, jsonBody, LOGOUT_EVENT, refreshSession, request } from "./http";

/**
 * Messages. REST for history and for sending; a WebSocket per open room for
 * live delivery. Both are new on the backend (app/modules/messages/).
 */

export async function listMessages(roomId, { limit = 50, before } = {}) {
  // Returns oldest -> newest. `before` is a message id, for paging upwards.
  return request(
    `/api/rooms/${roomId}/messages${buildQuery({ limit, before })}`,
    {},
    "Failed to load messages",
  );
}

export async function sendMessage(roomId, content) {
  return request(
    `/api/rooms/${roomId}/messages`,
    { method: "POST", ...jsonBody({ content }) },
    "Failed to send message",
  );
}

export function roomSocketUrl(roomId) {
  const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
  return `${protocol}//${window.location.host}/ws/rooms/${roomId}`;
}

/**
 * Opens a room socket that survives an expired access token: the server closes
 * with 1008, we refresh the cookie, then reconnect with backoff.
 */
export function openRoomSocket(roomId, { onMessage, onStatus } = {}) {
  let socket = null;
  let timer = null;
  let attempt = 0;
  let disposed = false;

  const connect = () => {
    if (disposed) return;

    onStatus?.("connecting");
    socket = new WebSocket(roomSocketUrl(roomId));

    socket.onopen = () => {
      attempt = 0;
      onStatus?.("open");
    };

    socket.onmessage = (event) => {
      try {
        onMessage?.(JSON.parse(event.data));
      } catch {
        // ignore frames that aren't JSON
      }
    };

    socket.onerror = () => onStatus?.("error");

    socket.onclose = async (event) => {
      if (disposed) return;
      onStatus?.("closed");

      // A rejected handshake (expired cookie) surfaces to the browser as an
      // abnormal 1006 close, not the server's 1008 -- refresh on any
      // unexpected close so a stale access token can't loop forever.
      if (event.code !== 1000) {
        try {
          await refreshSession();
        } catch {
          return; // session is gone for good; App will bounce to /auth
        }
      }

      attempt += 1;
      const delay = Math.min(1000 * 2 ** (attempt - 1), 15000);
      timer = setTimeout(connect, delay);
    };
  };

  connect();

  return {
    send(payload) {
      if (socket?.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify(payload));
      }
    },
    close() {
      disposed = true;
      clearTimeout(timer);
      socket?.close();
    },
  };
}

// --- subscriptions ------------------------------------------------------------
//
// The views subscribe per room and read one connection status. The transport
// underneath is still a socket per open room; this keeps the bookkeeping in one
// place so a room opened twice (a view plus a preview) shares one socket.

const rooms = new Map(); // roomId -> { socket, handlers: Set<handler>, status }
const statusListeners = new Set();

let status = "closed";

/** The worst status across the open rooms — the UI shows one indicator. */
function aggregateStatus() {
  const values = [...rooms.values()].map((entry) => entry.status);
  if (values.length === 0) return "closed";

  for (const candidate of ["error", "closed", "connecting"]) {
    if (values.includes(candidate)) return candidate;
  }

  return "open";
}

function publishStatus() {
  const next = aggregateStatus();
  if (next === status) return;

  status = next;
  statusListeners.forEach((listener) => listener(next));
}

/** Live messages for one room. Returns an unsubscribe function. */
export function subscribeToRoom(roomId, handler) {
  let entry = rooms.get(roomId);

  if (!entry) {
    // The entry has to exist before openRoomSocket runs: it reports
    // "connecting" synchronously.
    entry = { socket: null, handlers: new Set(), status: "connecting" };
    rooms.set(roomId, entry);

    entry.socket = openRoomSocket(roomId, {
      onMessage: (event) => {
        if (event?.type !== "message.created") return;
        entry.handlers.forEach((subscriber) => subscriber(event.message));
      },
      onStatus: (next) => {
        entry.status = next;
        publishStatus();
      },
    });
  }

  entry.handlers.add(handler);
  publishStatus();

  return () => {
    entry.handlers.delete(handler);
    if (entry.handlers.size > 0) return;

    rooms.delete(roomId);
    entry.socket?.close();
    publishStatus();
  };
}

/** Socket status: "connecting" | "open" | "closed" | "error". */
export function onConnectionStatus(listener) {
  statusListeners.add(listener);
  listener(status);
  return () => statusListeners.delete(listener);
}

window.addEventListener(LOGOUT_EVENT, () => {
  rooms.forEach((entry) => entry.socket?.close());
  rooms.clear();
  publishStatus();
});
