from datetime import datetime

import sqlalchemy as sa
from sqlalchemy import Index
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base


class User(Base):
	__tablename__ = "users"

	id: Mapped[int] = mapped_column(
		sa.BigInteger,
		primary_key=True,
		autoincrement=True,
	)

	username: Mapped[str] = mapped_column(
		sa.String(32),
		unique=True,
		nullable=False,
	)

	display_name: Mapped[str] = mapped_column(
		sa.String(32),
		nullable=True,
	)

	email: Mapped[str] = mapped_column(
		sa.String(255),
		unique=True,
		nullable=False,
	)

	password_hash: Mapped[str] = mapped_column(
		sa.String(255),
		nullable=False,
	)

	bio: Mapped[str] = mapped_column(
		sa.String(512),
		nullable=False,
		server_default=sa.text("''"),
	)

	avatar_url: Mapped[str] = mapped_column(
		sa.String(512),
		nullable=False,
		server_default=sa.text("''"),
	)

	created_at: Mapped[datetime] = mapped_column(
		sa.DateTime(timezone=True),
		server_default=sa.text("now()"),
		nullable=False,
	)

	updated_at: Mapped[datetime] = mapped_column(
		sa.DateTime(timezone=True),
		server_default=sa.text("now()"),
		onupdate=sa.func.now(),
		nullable=False,
	)

	sessions: Mapped[list["Session"]] = relationship(
		back_populates="user",
		cascade="all, delete-orphan",
	)

class Friendship(Base):
	__tablename__ = "friendships"

	id: Mapped[int] = mapped_column(
		sa.BigInteger,
		primary_key=True,
		autoincrement=True,
	)

	sender_id: Mapped[int] = mapped_column(
		sa.ForeignKey("users.id"),
		nullable=False,
	)

	receiver_id: Mapped[int] = mapped_column(
		sa.ForeignKey("users.id"),
		nullable=False,
	)

	status: Mapped[str] = mapped_column(
		sa.String(32),
		nullable=False,
		server_default=sa.text("'pending'"),
	)

	created_at: Mapped[datetime] = mapped_column(
		sa.DateTime(timezone=True),
		server_default=sa.text("now()"),
		nullable=False,
	)

	__table_args__ = (
		Index("ix_friendships_sender_status", "sender_id", "status", unique=True),
		Index("ix_friendships_receiver_status", "receiver_id", "status", unique=True),
	)


class Session(Base):
	__tablename__ = "sessions"

	id: Mapped[int] = mapped_column(
		sa.BigInteger,
		primary_key=True,
		autoincrement=True,
	)

	user_id: Mapped[int] = mapped_column(
		sa.ForeignKey("users.id"),
		nullable=False,
	)

	token_hash: Mapped[str] = mapped_column(
		sa.String(255),
		unique=True,
		nullable=False,
	)

	expires_at: Mapped[datetime] = mapped_column(
		sa.DateTime(timezone=True),
		nullable=False,
	)

	last_used_at: Mapped[datetime] = mapped_column(
		sa.DateTime(timezone=True),
		nullable=False,
		server_default=sa.text("now()"),
	)

	created_at: Mapped[datetime] = mapped_column(
		sa.DateTime(timezone=True),
		server_default=sa.text("now()"),
		nullable=False,
	)

	user: Mapped["User"] = relationship(
		back_populates="sessions",
	)


sa.Index("users_username_lower_idx", sa.func.lower(User.__table__.c.username), unique=True)
sa.Index("users_email_lower_idx", sa.func.lower(User.__table__.c.email), unique=True)
sa.Index("sessions_user_id_idx", Session.__table__.c.user_id)
sa.Index("sessions_expires_at_idx", Session.__table__.c.expires_at)