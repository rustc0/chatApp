import { buildQuery, jsonBody, refreshSession, request } from "./http";

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

      if (event.code === 1008) {
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
