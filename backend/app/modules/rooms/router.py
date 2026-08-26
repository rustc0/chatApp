from fastapi import APIRouter, Depends, HTTPException, status

from app.modules.identity.service import get_current_user
from app.database import get_db_session
from app.modules.rooms import service
from app.modules.rooms.service import (
    RoomNotFoundError,
    RoomForbiddenError,
    RoomMemberNotFoundError,
    RoomMemberConflictError,
    UserNotFoundError,
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
)

router = APIRouter(prefix="/rooms", tags=["Rooms"])


@router.get("")
async def list_rooms(
    current_user: dict[str, object] = Depends(get_current_user),
    session=Depends(get_db_session),
):
    rooms = await service.list_user_rooms(
        session=session,
        user_id=current_user["user_id"],
    )
    return [RoomOut.model_validate(room) for room in rooms]


@router.post("", status_code=status.HTTP_201_CREATED)
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
    return RoomOut.model_validate(room)


@router.post("/dm")
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
    return RoomOut.model_validate(room)


@router.get("/{room_id}")
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
    return RoomDetailOut.model_validate(room)


@router.patch("/{room_id}")
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
    return RoomOut.model_validate(room)


@router.delete("/{room_id}", status_code=status.HTTP_204_NO_CONTENT)
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


@router.get("/{room_id}/members")
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
    return [RoomMemberOut.model_validate(member) for member in members]


@router.post("/{room_id}/members", status_code=status.HTTP_201_CREATED)
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
    return RoomMemberOut.model_validate(member)


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


@router.post("/{room_id}/members/{user_id}/roles")
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
    return RoomMemberOut.model_validate(member)