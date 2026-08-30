import { useCallback, useEffect, useRef, useState } from "react";
import { listMessages, openRoomSocket, sendMessage } from "../api/messages";

/**
 * One room's messages: REST history on mount, WebSocket for anything that
 * arrives afterwards. `state` mirrors the "loading" | "success" | "error"
 * convention the views already use.
 */
export function useRoomMessages(roomId) {
  const [messages, setMessages] = useState([]);
  const [state, setState] = useState("loading");
  const [connection, setConnection] = useState("connecting");
  const [sending, setSending] = useState(false);
  const socketRef = useRef(null);

  const appendMessage = useCallback((message) => {
    if (!message?.id) return;
    setMessages((previous) =>
      previous.some((item) => item.id === message.id) ? previous : [...previous, message],
    );
  }, []);

  useEffect(() => {
    if (!roomId) return undefined;

    let cancelled = false;
    setState("loading");
    setMessages([]);

    listMessages(roomId)
      .then((data) => {
        if (cancelled) return;
        setMessages(Array.isArray(data) ? data : []);
        setState("success");
      })
      .catch(() => {
        if (!cancelled) setState("error");
      });

    const socket = openRoomSocket(roomId, {
      onMessage: (event) => {
        if (event?.type === "message.created") appendMessage(event.message);
      },
      onStatus: (status) => {
        if (!cancelled) setConnection(status);
      },
    });

    socketRef.current = socket;

    return () => {
      cancelled = true;
      socket.close();
      socketRef.current = null;
    };
  }, [roomId, appendMessage]);

  const send = useCallback(
    async (content) => {
      const text = (content || "").trim();
      if (!text) return null;

      setSending(true);
      try {
        const created = await sendMessage(roomId, text);
        appendMessage(created); // the socket echo is deduped by id
        return created;
      } finally {
        setSending(false);
      }
    },
    [roomId, appendMessage],
  );

  return { messages, state, connection, sending, send };
}
