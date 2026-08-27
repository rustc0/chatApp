from sqlalchemy import select, func
from sqlalchemy.orm import aliased
from fastapi import HTTPException, status

import random

from app.models.identity import User
from app.models.rooms import Room, RoomMember, RoomType, RoomRole


class RoomNotFoundError(Exception):
    pass


class RoomForbiddenError(Exception):
    pass


class RoomMemberNotFoundError(Exception):
    pass


class RoomMemberConflictError(Exception):
    pass


class UserNotFoundError(Exception):
    pass

async def _get_room_or_404(session, room_id: int) -> Room:
    room = await session.get(Room, room_id)
    if room is None:
        raise RoomNotFoundError
    return room


async def _require_membership(session, room_id: int, user_id: int) -> RoomMember:
    membership = await session.get(RoomMember, (room_id, user_id))
    if membership is None:
        raise RoomForbiddenError
    return membership


async def list_user_rooms(session, user_id: int):
    stmt = (
        select(Room)
        .join(RoomMember, RoomMember.room_id == Room.id)
        .where(RoomMember.user_id == user_id)
        .order_by(Room.modified_at.desc())
    )
    result = await session.execute(stmt)
    return result.scalars().all()


async def create_room(session, user_id: int, name: str) -> Room:
    room = Room(name=name, type=RoomType.ROOM)
    session.add(room)
    await session.flush()  # populate room.id before referencing it below

    session.add(RoomMember(room_id=room.id, user_id=user_id, role=RoomRole.OWNER))
    await session.commit()
    await session.refresh(room)
    return room


async def get_or_create_dm(session, user_id: int, other_user_id: int) -> Room:
    if user_id == other_user_id:
        raise RoomForbiddenError

    other_user = await session.get(User, other_user_id)
    if other_user is None:
        raise UserNotFoundError()

    rm1 = aliased(RoomMember)
    rm2 = aliased(RoomMember)
    stmt = (
        select(Room)
        .join(rm1, rm1.room_id == Room.id)
        .join(rm2, rm2.room_id == Room.id)
        .where(
            Room.type == RoomType.DM,
            rm1.user_id == user_id,
            rm2.user_id == other_user_id,
        )
    )
    result = await session.execute(stmt)
    existing = result.scalars().first()
    if existing is not None:
        return existing

    room = Room(name=None, type=RoomType.DM)
    session.add(room)
    await session.flush()

    session.add_all(
        [
            RoomMember(room_id=room.id, user_id=user_id, role=RoomRole.MEMBER),
            RoomMember(room_id=room.id, user_id=other_user_id, role=RoomRole.MEMBER),
        ]
    )
    await session.commit()
    await session.refresh(room)
    return room


async def get_room_details(session, user_id: int, room_id: int) -> Room:
    room = await _get_room_or_404(session, room_id)
    await _require_membership(session, room_id, user_id)

    count_stmt = select(func.count()).select_from(RoomMember).where(
        RoomMember.room_id == room_id
    )
    result = await session.execute(count_stmt)
    room.member_count = result.scalar_one()  # dynamic attr, read by RoomDetailOut.model_validate
    return room


async def update_room(session, user_id: int, room_id: int, payload) -> Room:
    room = await _get_room_or_404(session, room_id)
    membership = await _require_membership(session, room_id, user_id)

    if membership.role not in (RoomRole.OWNER, RoomRole.ADMIN):
        raise RoomForbiddenError

    if payload.name is not None:
        room.name = payload.name
    # payload.avatar not applied -- no column on Room yet

    await session.commit()
    await session.refresh(room)
    return room


async def delete_room(session, user_id: int, room_id: int) -> None:
    room = await _get_room_or_404(session, room_id)
    membership = await _require_membership(session, room_id, user_id)

    if membership.role != RoomRole.OWNER:
        raise RoomForbiddenError

    await session.delete(room)
    await session.commit()


# hardcoded for now, I'll change when I implement presence tracking

def get_user_status() -> str:
    return random.choice(["online", "offline"])

# -----------------------------------------------------------------

async def list_room_members(session, user_id: int, room_id: int):
    await _get_room_or_404(session, room_id)
    await _require_membership(session, room_id, user_id)

    stmt = (
        select(User, RoomMember)
        .join(RoomMember, RoomMember.user_id == User.id)
        .where(RoomMember.room_id == room_id)
    )

    result = await session.execute(stmt)
    rows = result.all()

    return [
        {
            "username": user.username,
            "role": room_member.role,
            "status": get_user_status(),
        }
        for user, room_member in rows
    ]


async def add_member(session, user_id: int, room_id: int, new_member_id: int) -> RoomMember:
    await _get_room_or_404(session, room_id)
    membership = await _require_membership(session, room_id, user_id)

    if membership.role not in (RoomRole.OWNER, RoomRole.ADMIN):
        raise RoomForbiddenError

    new_user = await session.get(User, new_member_id)
    if new_user is None:
        raise UserNotFoundError()

    existing = await session.get(RoomMember, (room_id, new_member_id))
    if existing is not None:
        raise RoomMemberConflictError

    member = RoomMember(room_id=room_id, user_id=new_member_id, role=RoomRole.MEMBER)
    session.add(member)
    await session.commit()
    await session.refresh(member)
    return member


async def remove_member(session, user_id: int, room_id: int, target_user_id: int) -> None:
    await _get_room_or_404(session, room_id)

    target_membership = await session.get(RoomMember, (room_id, target_user_id))
    if target_membership is None:
        raise RoomMemberNotFoundError

    if target_user_id == user_id:
        # leaving -- owner must transfer ownership before leaving
        if target_membership.role == RoomRole.OWNER:
            raise RoomForbiddenError
    else:
        # kicking -- actor must be admin+, owner cannot be kicked
        actor_membership = await _require_membership(session, room_id, user_id)
        if actor_membership.role not in (RoomRole.OWNER, RoomRole.ADMIN):
            raise RoomForbiddenError
        if target_membership.role == RoomRole.OWNER:
            raise RoomForbiddenError

    await session.delete(target_membership)
    await session.commit()


async def assign_role(
    session, user_id: int, room_id: int, target_user_id: int, role: RoomRole
) -> RoomMember:
    await _get_room_or_404(session, room_id)
    actor_membership = await _require_membership(session, room_id, user_id)

    if actor_membership.role != RoomRole.OWNER:
        raise RoomForbiddenError

    target_membership = await session.get(RoomMember, (room_id, target_user_id))
    if target_membership is None:
        raise RoomMemberNotFoundError

    if role == RoomRole.OWNER:
        # ownership transfer: demote current owner, promote target
        actor_membership.role = RoomRole.ADMIN
        target_membership.role = RoomRole.OWNER
    else:
        target_membership.role = role

    await session.commit()
    await session.refresh(target_membership)
    return target_membership