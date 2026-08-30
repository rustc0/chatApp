from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
    Query,
    WebSocket,
    WebSocketDisconnect,
    status,
)
from fastapi.encoders import jsonable_encoder

from app.database import async_session_factory, get_db_session
from app.modules.identity.service import decode_access_token, get_current_user
from app.modules.messages import service
from app.modules.messages.hub import hub
from app.modules.messages.schemas import MessageCreate, MessageOut
from app.modules.messages.service import RoomForbiddenError, RoomNotFoundError

router = APIRouter(prefix="/rooms", tags=["Messages"])


@router.get("/{room_id}/messages", response_model=list[MessageOut])
async def list_messages(
    room_id: int,
    limit: int = Query(50, ge=1, le=100),
    before: int | None = Query(None, ge=1),
    current_user: dict[str, object] = Depends(get_current_user),
    session=Depends(get_db_session),
):
    try:
        return await service.list_room_messages(
            session=session,
            user_id=int(current_user["user_id"]),
            room_id=room_id,
            limit=limit,
            before=before,
        )
    except RoomNotFoundError:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Room not found")
    except RoomForbiddenError:
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Not a member of this room")


@router.post(
    "/{room_id}/messages",
    status_code=status.HTTP_201_CREATED,
    response_model=MessageOut,
)
async def create_message(
    room_id: int,
    payload: MessageCreate,
    current_user: dict[str, object] = Depends(get_current_user),
    session=Depends(get_db_session),
):
    try:
        message = await service.create_message(
            session=session,
            user_id=int(current_user["user_id"]),
            room_id=room_id,
            content=payload.content,
        )
    except RoomNotFoundError:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Room not found")
    except RoomForbiddenError:
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Not a member of this room")

    await hub.broadcast(
        room_id, {"type": "message.created", "message": jsonable_encoder(message)}
    )
    return message


ws_router = APIRouter(prefix="/ws", tags=["Messages"])


@ws_router.websocket("/rooms/{room_id}")
async def room_socket(websocket: WebSocket, room_id: int):
    """Live messages for one room.

    Auth is the same access_token cookie the REST calls use, read at handshake.
    Closing with 1008 tells the client to refresh the cookie and reconnect.
    """
    access_token = websocket.cookies.get("access_token")
    if not access_token:
        await websocket.close(code=1008)
        return

    try:
        claims = decode_access_token(access_token)
    except HTTPException:
        await websocket.close(code=1008)
        return

    user_id = int(claims["user_id"])

    async with async_session_factory() as session:
        try:
            await service.require_membership(session, room_id, user_id)
        except (RoomNotFoundError, RoomForbiddenError):
            await websocket.close(code=1008)
            return

    await websocket.accept()
    await hub.join(room_id, websocket)

    try:
        while True:
            payload = await websocket.receive_json()
            content = (payload or {}).get("content")

            if not isinstance(content, str) or not content.strip():
                continue

            async with async_session_factory() as session:
                message = await service.create_message(
                    session=session,
                    user_id=user_id,
                    room_id=room_id,
                    content=content[:2000],
                )

            await hub.broadcast(
                room_id,
                {"type": "message.created", "message": jsonable_encoder(message)},
            )
    except WebSocketDisconnect:
        pass
    finally:
        await hub.leave(room_id, websocket)
