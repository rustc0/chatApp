# rooms/schemas.py

from datetime import datetime

from pydantic import BaseModel, ConfigDict

from app.rooms.models import RoomType, RoomRole


class RoomCreate(BaseModel):
    name: str


class DMCreate(BaseModel):
    user_id: int


class RoomUpdate(BaseModel):
    name: str | None = None
    avatar: str | None = None


class RoomOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str | None
    type: RoomType
    created_at: datetime
    modified_at: datetime


class RoomDetailOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str | None
    type: RoomType
    member_count: int
    created_at: datetime
    modified_at: datetime


class RoomMemberOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    room_id: int
    user_id: int
    role: RoomRole
    joined_at: datetime


class AddMemberRequest(BaseModel):
    user_id: int


class AssignRoleRequest(BaseModel):
    role: RoomRole