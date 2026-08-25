from Enum import Enum
from datetime import datetime

from sqlalchemy import ForeignKey, Text, Index
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.sql import func

from app.models.base import Base


class RoomType(str, Enum):
	DM = "dm"
	ROOM = "room"


class RoomRole(str, Enum):
	OWNER = "owner"
	ADMIN = "admin"
	MEMBER = "member"


class Room(Base):
	__tablename__ = "rooms"

	id: Mapped[int] = mapped_column(primary_key=True)
	name: Mapped[str | None] = mapped_column(Text, nullable=True)  # null for DMs
	type: Mapped[RoomType] = mapped_column(nullable=False)
	created_at: Mapped[datetime] = mapped_column(server_default=func.now())
	modified_at: Mapped[datetime] = mapped_column(
		server_default=func.now(), onupdate=func.now()
	)

	members: Mapped[list["RoomMember"]] = relationship(
		back_populates="room", cascade="all, delete-orphan"
	)
	messages: Mapped[list["Message"]] = relationship(
		back_populates="room", cascade="all, delete-orphan"
	)


class RoomMember(Base):
	__tablename__ = "room_members"
	__table_args__ = (
		# "rooms I'm in" / "is user X a member of room Y" lookups
		Index("ix_room_members_user_id_room_id", "user_id", "room_id"),
	)

	room_id: Mapped[int] = mapped_column(
		ForeignKey("rooms.id", ondelete="CASCADE"), primary_key=True
	)
	user_id: Mapped[int] = mapped_column(
		ForeignKey("users.id", ondelete="CASCADE"), primary_key=True
	)
	role: Mapped[RoomRole] = mapped_column(nullable=False, default=RoomRole.MEMBER)
	joined_at: Mapped[datetime] = mapped_column(server_default=func.now())

	room: Mapped["Room"] = relationship(back_populates="members")


class Message(Base):
	__tablename__ = "messages"
	__table_args__ = (
		# "give me room X's messages ordered by time" — the core message query
		Index("ix_messages_room_id_sent_at", "room_id", "sent_at"),
	)

	id: Mapped[int] = mapped_column(primary_key=True)
	room_id: Mapped[int] = mapped_column(
		ForeignKey("rooms.id", ondelete="CASCADE"), nullable=False
	)
	sender_id: Mapped[int] = mapped_column(
		ForeignKey("users.id", ondelete="CASCADE"), nullable=False
	)
	content: Mapped[str] = mapped_column(Text, nullable=False)
	sent_at: Mapped[datetime] = mapped_column(server_default=func.now())

	room: Mapped["Room"] = relationship(back_populates="messages")