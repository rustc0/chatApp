from sqlalchemy import select, update
from sqlalchemy.sql import func

from app.models.identity import User
from app.models.rooms import Message, Room, RoomMember


class RoomNotFoundError(Exception):
    pass


class RoomForbiddenError(Exception):
    pass


async def require_membership(session, room_id: int, user_id: int) -> Room:
    room = await session.get(Room, room_id)
    if room is None:
        raise RoomNotFoundError

    membership = await session.get(RoomMember, (room_id, user_id))
    if membership is None:
        raise RoomForbiddenError

    return room


def _serialize(message: Message, username: str) -> dict:
    return {
        "id": message.id,
        "room_id": message.room_id,
        "sender_id": message.sender_id,
        "sender_username": username or "",
        "content": message.content,
        "sent_at": message.sent_at,
    }


async def list_room_messages(
    session,
    user_id: int,
    room_id: int,
    limit: int = 50,
    before: int | None = None,
) -> list[dict]:
    """Newest `limit` messages, returned oldest -> newest so the view can append."""
    await require_membership(session, room_id, user_id)

    stmt = (
        select(Message, User.username)
        .join(User, User.id == Message.sender_id)
        .where(Message.room_id == room_id)
    )

    if before is not None:
        stmt = stmt.where(Message.id < before)

    stmt = stmt.order_by(Message.id.desc()).limit(limit)

    rows = (await session.execute(stmt)).all()
    return [_serialize(message, username) for message, username in reversed(rows)]


async def create_message(session, user_id: int, room_id: int, content: str) -> dict:
    await require_membership(session, room_id, user_id)

    message = Message(room_id=room_id, sender_id=user_id, content=content.strip())
    session.add(message)

    # Bump the room so list_user_rooms' "most recent first" ordering is real.
    await session.execute(
        update(Room).where(Room.id == room_id).values(modified_at=func.now())
    )

    await session.commit()
    await session.refresh(message)

    username = await session.scalar(select(User.username).where(User.id == user_id))
    return _serialize(message, username)
