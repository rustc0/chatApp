"""In-process fan-out for room sockets.

One set of live sockets per room id. Good enough for a single uvicorn worker;
with more than one worker (or more than one container) the broadcast has to go
through Redis pub/sub instead — see PATCHES.md.
"""

import asyncio
from collections import defaultdict

from fastapi import WebSocket


class RoomHub:
    def __init__(self) -> None:
        self._rooms: dict[int, set[WebSocket]] = defaultdict(set)
        self._lock = asyncio.Lock()

    async def join(self, room_id: int, websocket: WebSocket) -> None:
        async with self._lock:
            self._rooms[room_id].add(websocket)

    async def leave(self, room_id: int, websocket: WebSocket) -> None:
        async with self._lock:
            connections = self._rooms.get(room_id)
            if connections is None:
                return
            connections.discard(websocket)
            if not connections:
                self._rooms.pop(room_id, None)

    async def broadcast(self, room_id: int, payload: dict) -> None:
        async with self._lock:
            connections = list(self._rooms.get(room_id, ()))

        stale: list[WebSocket] = []
        for connection in connections:
            try:
                await connection.send_json(payload)
            except Exception:  # client vanished mid-send
                stale.append(connection)

        for connection in stale:
            await self.leave(room_id, connection)


hub = RoomHub()
