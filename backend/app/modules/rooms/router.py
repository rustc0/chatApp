from fastapi import APIRouter, Depends, HTTPException, Query, status

from app.modules.identity.service import get_current_user
from app.database import get_db_session
from app.modules.rooms import service
from app.modules.rooms.service import (
    RoomNotFoundError,
    RoomForbiddenError,
    RoomMemberNotFoundError,
    RoomMemberConflictError,
    UserNotFoundError,
    RoomInviteNotFoundError,
    RoomInviteConflictError,
)

from app.modules.rooms.schemas import (
    RoomCreate,
    DMCreate,
    RoomUpdate,
    RoomOut,
    RoomDetailOut,
    RoomMemberOut,
    AddMemberRequest,
    AssignRoleRequest,
    RoomMemberListItem,
    RoomInviteCreate,
    RoomInviteOut,
)

router = APIRouter(prefix="/rooms", tags=["Rooms"])


@router.get("", response_model=list[RoomOut])
async def list_rooms(
    limit: int = Query(50, ge=1, le=100),
    offset: int = Query(0, ge=0),
    current_user: dict[str, object] = Depends(get_current_user),
    session=Depends(get_db_session),
):
    rooms = await service.list_user_rooms(
        session=session,
        user_id=current_user["user_id"],
        limit=limit,
        offset=offset,
    )
    return rooms


@router.post("", status_code=status.HTTP_201_CREATED, response_model=RoomOut)
async def create_room(
    payload: RoomCreate,
    current_user: dict[str, object] = Depends(get_current_user),
    session=Depends(get_db_session),
):
    room = await service.create_room(
        session=session,
        user_id=current_user["user_id"],
        name=payload.name,
    )
    return room


@router.post("/dm", status_code=status.HTTP_201_CREATED, response_model=RoomOut)
async def get_or_create_dm(
    payload: DMCreate,
    current_user: dict[str, object] = Depends(get_current_user),
    session=Depends(get_db_session),
):
    try:
        room = await service.get_or_create_dm(
            session=session,
            user_id=current_user["user_id"],
            other_user_id=payload.user_id,
        )
    except UserNotFoundError:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "User not found")
    return room 


@router.get("/invites", response_model=list[RoomInviteOut])
async def list_my_invites(
    limit: int = Query(50, ge=1, le=100),
    offset: int = Query(0, ge=0),
    current_user: dict[str, object] = Depends(get_current_user),
    session=Depends(get_db_session),
):
    return await service.list_room_invites(
        session=session,
        user_id=current_user["user_id"],
        room_id=None,
        limit=limit,
        offset=offset,
    )


@router.get("/{room_id}", response_model=RoomDetailOut)
async def get_room(
    room_id: int,
    current_user: dict[str, object] = Depends(get_current_user),
    session=Depends(get_db_session),
):
    try:
        room = await service.get_room_details(
            session=session,
            user_id=current_user["user_id"],
            room_id=room_id,
        )
    except RoomNotFoundError:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Room not found")
    except RoomForbiddenError:
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Not a member of this room")
    return room


@router.patch("/{room_id}", response_model=RoomOut)
async def update_room(
    room_id: int,
    payload: RoomUpdate,
    current_user: dict[str, object] = Depends(get_current_user),
    session=Depends(get_db_session),
):
    try:
        room = await service.update_room(
            session=session,
            user_id=current_user["user_id"],
            room_id=room_id,
            payload=payload,
        )
    except RoomNotFoundError:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Room not found")
    except RoomForbiddenError:
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Owner/admin only")
    return room


@router.delete("/{room_id}", status_code=status.HTTP_204_NO_CONTENT, response_model=None)
async def delete_room(
    room_id: int,
    current_user: dict[str, object] = Depends(get_current_user),
    session=Depends(get_db_session),
):
    try:
        await service.delete_room(
            session=session,
            user_id=current_user["user_id"],
            room_id=room_id,
        )
    except RoomNotFoundError:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Room not found")
    except RoomForbiddenError:
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Owner only")


@router.get("/{room_id}/members", response_model=list[RoomMemberListItem])
async def list_members(
    room_id: int,
    current_user: dict[str, object] = Depends(get_current_user),
    session=Depends(get_db_session),
):
    try:
        members = await service.list_room_members(
            session=session,
            user_id=current_user["user_id"],
            room_id=room_id,
        )
    except RoomNotFoundError:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Room not found")
    except RoomForbiddenError:
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Not a member of this room")
    return members


@router.post("/{room_id}/members", status_code=status.HTTP_201_CREATED, response_model=RoomMemberOut)
async def add_member(
    room_id: int,
    payload: AddMemberRequest,
    current_user: dict[str, object] = Depends(get_current_user),
    session=Depends(get_db_session),
):
    try:
        member = await service.add_member(
            session=session,
            user_id=current_user["user_id"],
            room_id=room_id,
            new_member_id=payload.user_id,
        )
    except RoomNotFoundError:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Room not found")
    except UserNotFoundError:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "User not found")
    except RoomForbiddenError:
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Admin+ only")
    except RoomMemberConflictError:
        raise HTTPException(status.HTTP_409_CONFLICT, "User already a member")
    return member


@router.delete("/{room_id}/members/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
async def remove_member(
    room_id: int,
    user_id: int,
    current_user: dict[str, object] = Depends(get_current_user),
    session=Depends(get_db_session),
):
    try:
        await service.remove_member(
            session=session,
            user_id=current_user["user_id"],
            room_id=room_id,
            target_user_id=user_id,
        )
    except RoomNotFoundError:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Room not found")
    except RoomMemberNotFoundError:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Member not found")
    except RoomForbiddenError:
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Not allowed to remove this member")


@router.post("/{room_id}/members/{user_id}/roles", response_model=RoomMemberOut)
async def assign_role(
    room_id: int,
    user_id: int,
    payload: AssignRoleRequest,
    current_user: dict[str, object] = Depends(get_current_user),
    session=Depends(get_db_session),
):
    try:
        member = await service.assign_role(
            session=session,
            user_id=current_user["user_id"],
            room_id=room_id,
            target_user_id=user_id,
            role=payload.role,
        )
    except RoomNotFoundError:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Room not found")
    except RoomMemberNotFoundError:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Member not found")
    except RoomForbiddenError:
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Not allowed to assign roles")
    return member



@router.get("/{room_id}/invites", response_model=list[RoomInviteOut])
async def list_invites(
    room_id: int,
    current_user: dict[str, object] = Depends(get_current_user),
    session=Depends(get_db_session),
):
    try:
        return await service.list_room_invites(
            session=session,
            user_id=current_user["user_id"],
            room_id=room_id,
            limit=100,
            offset=0,
        )
    except RoomNotFoundError:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Room not found")
    except RoomForbiddenError:
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Admin+ only")


@router.post("/{room_id}/invites", status_code=status.HTTP_201_CREATED, response_model=RoomInviteOut)
async def invite_member(
    room_id: int,
    payload: RoomInviteCreate,
    current_user: dict[str, object] = Depends(get_current_user),
    session=Depends(get_db_session),
):
    try:
        invite = await service.invite_user_to_room(
            session=session,
            user_id=current_user["user_id"],
            room_id=room_id,
            invitee_id=payload.user_id,
        )
    except RoomNotFoundError:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Room not found")
    except UserNotFoundError:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "User not found")
    except RoomForbiddenError:
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Admin+ only")
    except RoomInviteConflictError:
        raise HTTPException(status.HTTP_409_CONFLICT, "Invite already exists")
    return invite


@router.post("/invites/{invite_id}/accept", response_model=RoomInviteOut)
async def accept_invite(
    invite_id: int,
    current_user: dict[str, object] = Depends(get_current_user),
    session=Depends(get_db_session),
):
    try:
        invite = await service.accept_room_invite(
            session=session,
            user_id=current_user["user_id"],
            invite_id=invite_id,
        )
    except RoomInviteNotFoundError:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Invite not found")
    except RoomForbiddenError:
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Not allowed to modify this invite")
    except RoomInviteConflictError:
        raise HTTPException(status.HTTP_409_CONFLICT, "Invite is no longer pending")
    return invite


@router.delete("/invites/{invite_id}", status_code=status.HTTP_204_NO_CONTENT)
async def decline_invite(
    invite_id: int,
    current_user: dict[str, object] = Depends(get_current_user),
    session=Depends(get_db_session),
):
    try:
        await service.decline_room_invite(
            session=session,
            user_id=current_user["user_id"],
            invite_id=invite_id,
        )
    except RoomInviteNotFoundError:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Invite not found")
    except RoomForbiddenError:
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Not allowed to modify this invite")
    except RoomInviteConflictError:
        raise HTTPException(status.HTTP_409_CONFLICT, "Invite is no longer pending")