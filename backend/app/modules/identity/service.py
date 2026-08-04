from __future__ import annotations

import hashlib
import asyncio
from argon2 import PasswordHasher
from argon2.exceptions import VerifyMismatchError, VerificationError, InvalidHashError
import os
import secrets
from datetime import UTC, datetime, timedelta

from fastapi import HTTPException
import sqlalchemy as sa
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.identity import Session, User

SESSION_TTL_DAYS = int(os.getenv("SESSION_TTL_DAYS", "7"))


def _normalize_username(username: str) -> str:
	return username.strip().lower()


def _normalize_email(email: str) -> str:
	return email.strip().lower()


def _serialize_user(user: User) -> dict[str, object]:
	return {
		"id": user.id,
		"username": user.username,
		"displayName": user.username,
		"email": user.email,
		"bio": user.bio or "",
		"avatar": user.avatar_url or "",
		"createdAt": user.created_at,
		"updatedAt": user.updated_at,
	}

# Initialize the hasher with standard OWASP-recommended parameters
# - time_cost=3 (iterations)
# - memory_cost=65536 (64 MB)
# - parallelism=4 (threads)
		
ph = PasswordHasher(
    time_cost=3,
    memory_cost=65536,
    parallelism=4,
)


async def _hash_password(password: str) -> str:
	return await asyncio.to_thread(ph.hash, password)


async def _verify_password(password: str, password_hash: str) -> bool:
	try:
		return await asyncio.to_thread(ph.verify, password_hash, password)
	except (VerifyMismatchError, VerificationError, InvalidHashError):
		return False


def _hash_token(token: str) -> str:
	return hashlib.sha256(token.encode("utf-8")).hexdigest()


async def _create_session(session: AsyncSession, user_id: int) -> str:
	token = secrets.token_urlsafe(32)
	token_hash = _hash_token(token)
	expires_at = datetime.now(UTC) + timedelta(days=SESSION_TTL_DAYS)
	session.add(
		Session(
			user_id=user_id,
			token_hash=token_hash,
			expires_at=expires_at,
		)
	)
	await session.commit()
	return token


async def _get_user_by_identifier(session: AsyncSession, identifier: str) -> User | None:
	lowered_identifier = identifier.strip().lower()
	statement = sa.select(User).where(
		sa.or_(
			sa.func.lower(User.username) == lowered_identifier,
			sa.func.lower(User.email) == lowered_identifier,
		)
	)
	result = await session.execute(statement.limit(1))
	return result.scalar_one_or_none()


async def register_user(session: AsyncSession, username: str, email: str, password: str) -> dict[str, object]:
	normalized_username = _normalize_username(username)
	normalized_email = _normalize_email(email)

	if not normalized_username:
		raise HTTPException(status_code=400, detail={"message": "Username is required"})
	if not normalized_email or "@" not in normalized_email:
		raise HTTPException(status_code=400, detail={"message": "A valid email is required"})
	if len(password) < 8:
		raise HTTPException(status_code=400, detail={"message": "Password must be at least 8 characters long"})

	existing = await session.execute(
		sa.select(User.id).where(
			sa.or_(
				sa.func.lower(User.username) == normalized_username,
				sa.func.lower(User.email) == normalized_email,
			),
		).limit(1)
	)
	if existing.scalar_one_or_none() is not None:
		raise HTTPException(status_code=409, detail={"message": "Username or email already exists"})

	user = User(
		username=normalized_username,
		email=normalized_email,
		password_hash=await _hash_password(password),
	)
	session.add(user)
	try:
		await session.flush()
	except IntegrityError as exc:
		await session.rollback()
		raise HTTPException(status_code=409, detail={"message": "Username or email already exists"}) from exc

	await session.refresh(user)
	access_token = await _create_session(session, user.id)
	payload = _serialize_user(user)
	payload["accessToken"] = access_token
	return payload


async def login_user(session: AsyncSession, identifier: str, password: str) -> dict[str, object]:
	lookup = identifier.strip()
	if not lookup:
		raise HTTPException(status_code=400, detail={"message": "Email or username is required"})

	user = await _get_user_by_identifier(session, lookup)
	if user is None or not await _verify_password(password, user.password_hash):
		raise HTTPException(status_code=401, detail={"message": "Invalid credentials"})

	access_token = await _create_session(session, user.id)
	payload = _serialize_user(user)
	payload["accessToken"] = access_token
	return payload


async def get_current_user(session: AsyncSession, token: str) -> dict[str, object]:
	if not token:
		raise HTTPException(status_code=401, detail={"message": "Missing access token"})

	token_hash = _hash_token(token)
	result = await session.execute(
		sa.select(Session, User)
		.join(User, User.id == Session.user_id)
		.where(Session.token_hash == token_hash)
		.limit(1)
	)
	row = result.first()
	if row is None:
		raise HTTPException(status_code=401, detail={"message": "Invalid or expired access token"})

	session_obj, user = row
	if session_obj.expires_at <= datetime.now(UTC):
		await session.delete(session_obj)
		await session.commit()
		raise HTTPException(status_code=401, detail={"message": "Invalid or expired access token"})

	session_obj.last_used_at = datetime.now(UTC)
	await session.commit()
	return _serialize_user(user)
