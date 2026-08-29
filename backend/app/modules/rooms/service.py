from sqlalchemy import select, func
from sqlalchemy.orm import aliased
from fastapi import HTTPException, status

import random

from app.models.identity import User
from app.models.rooms import Room, RoomMember, RoomType, RoomRole, RoomInvite, RoomInviteStatus


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


class RoomInviteNotFoundError(Exception):
    pass


class RoomInviteConflictError(Exception):
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

    target_membership = await session.get(
        RoomMember,
        (room_id, target_user_id),
    )

    if target_membership is None:
        raise RoomMemberNotFoundError

    if target_user_id == user_id:
        # Leaving the room

        members = await session.execute(
            select(RoomMember).where(RoomMember.room_id == room_id)
        )
        members = members.scalars().all()

        if len(members) == 1:
            # Last member is leaving.
            # Delete the room entirely.
            room = await session.get(Room, room_id)

            await session.delete(room)
            await session.commit()
            return

        if target_membership.role == RoomRole.OWNER:
            # Owner is leaving while other members remain.
            # Make sure the room will still have an admin.

            admin_exists = any(
                member.role == RoomRole.ADMIN
                for member in members
                if member.user_id != target_user_id
            )

            if not admin_exists:
                # No admin remains, so promote another member.
                new_admin = next(
                    member
                    for member in members
                    if member.user_id != target_user_id
                )

                new_admin.role = RoomRole.ADMIN

        await session.delete(target_membership)
        await session.commit()
        return

    # Kicking another member
    actor_membership = await _require_membership(
        session,
        room_id,
        user_id,
    )

    if actor_membership.role not in (
        RoomRole.OWNER,
        RoomRole.ADMIN,
    ):
        raise RoomForbiddenError

    # Owner cannot be kicked.
    if target_membership.role == RoomRole.OWNER:
        raise RoomForbiddenError

    # Admins cannot kick other admins.
    if (
        actor_membership.role == RoomRole.ADMIN
        and target_membership.role == RoomRole.ADMIN
    ):
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



async def list_room_invites(session, user_id: int, room_id: int, limit: int, offset: int):
    inviter = aliased(User)
    stmt = (
        select(RoomInvite, Room, inviter)
        .join(Room, Room.id == RoomInvite.room_id)
        .join(inviter, inviter.id == RoomInvite.inviter_id)
        .where(
            RoomInvite.invitee_id == user_id,
            RoomInvite.status == RoomInviteStatus.PENDING,
        )
        .order_by(RoomInvite.created_at.desc(), RoomInvite.id.desc())
        .offset(offset)
        .limit(limit)
    )
    result = await session.execute(stmt)
    rows = result.all()
    return [
        {
            "id": invite.id,
            "room_id": invite.room_id,
            "room_name": room.name,
            "inviter_username": inviter_user.username,
            "status": invite.status,
            "created_at": invite.created_at,
        }
        for invite, room, inviter_user in rows
    ]


async def invite_user_to_room(session, user_id: int, room_id: int, invitee_id: int) -> RoomInvite:
    await _get_room_or_404(session, room_id)
    membership = await _require_membership(session, room_id, user_id)

    if membership.role not in (RoomRole.OWNER, RoomRole.ADMIN):
        raise RoomForbiddenError

    invitee = await session.get(User, invitee_id)
    if invitee is None:
        raise UserNotFoundError()

    existing_member = await session.get(RoomMember, (room_id, invitee_id))
    if existing_member is not None:
        raise RoomInviteConflictError()

    result = await session.execute(
        select(RoomInvite).where(
            RoomInvite.room_id == room_id,
            RoomInvite.invitee_id == invitee_id,
            RoomInvite.status == RoomInviteStatus.PENDING,
        )
    )
    existing = result.scalars().first()
    if existing is not None:
        raise RoomInviteConflictError()

    invite = RoomInvite(
        room_id=room_id,
        inviter_id=user_id,
        invitee_id=invitee_id,
        status=RoomInviteStatus.PENDING,
    )
    session.add(invite)
    await session.commit()
    await session.refresh(invite)
    return invite


async def accept_room_invite(session, user_id: int, invite_id: int) -> RoomInvite:
    invite = await session.get(RoomInvite, invite_id)
    if invite is None:
        raise RoomInviteNotFoundError()
    if invite.invitee_id != user_id:
        raise RoomForbiddenError
    if invite.status != RoomInviteStatus.PENDING:
        raise RoomInviteConflictError()

    room_member = await session.get(RoomMember, (invite.room_id, user_id))
    if room_member is None:
        session.add(
            RoomMember(room_id=invite.room_id, user_id=user_id, role=RoomRole.MEMBER)
        )

    invite.status = RoomInviteStatus.ACCEPTED
    await session.commit()
    await session.refresh(invite)
    return invite


async def decline_room_invite(session, user_id: int, invite_id: int) -> None:
    invite = await session.get(RoomInvite, invite_id)
    if invite is None:
        raise RoomInviteNotFoundError()
    if invite.invitee_id != user_id:
        raise RoomForbiddenError
    if invite.status != RoomInviteStatus.PENDING:
        raise RoomInviteConflictError()

    invite.status = RoomInviteStatus.DECLINED
    await session.commit()