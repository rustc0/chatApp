from __future__ import annotations

import asyncio
import base64
import hashlib
import hmac
import json
import os
import secrets
from datetime import UTC, datetime, timedelta

from argon2 import PasswordHasher
from argon2.exceptions import InvalidHashError, VerificationError, VerifyMismatchError
from fastapi import Cookie, Depends, HTTPException, Response
import sqlalchemy as sa
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.models.identity import Session, User
from app.database import get_db_session


class UsernameTakenError(Exception):
	pass


class UserNotFoundError(Exception):
	pass

ACCESS_TOKEN_TTL_SECONDS = 5 * 60
SESSION_TTL_DAYS = int(os.getenv("SESSION_TTL_DAYS", "7"))
ACCESS_TOKEN_COOKIE_NAME = "access_token"
REFRESH_TOKEN_COOKIE_NAME = "refresh_token"
REFRESH_TOKEN_COOKIE_PATH = "/api/users/auth"


def _normalize_username(username: str) -> str:
	return username.strip().lower()


def _normalize_email(email: str) -> str:
	return email.strip().lower()


def _serialize_user(user: User) -> dict[str, object]:
	return {
		"id": user.id,
		"username": user.username,
		"displayName": user.display_name or "",
		"email": user.email,
		"bio": user.bio or "",
		"avatar": user.avatar_url or "",
		"createdAt": user.created_at,
		"updatedAt": user.updated_at,
	}


def _require_jwt_secret() -> str:
	secret = os.getenv("JWT_SECRET")
	if not secret:
		raise HTTPException(status_code=500, detail={"message": "JWT secret is not configured"})
	return secret


def _base64url_encode(data: bytes) -> str:
	return base64.urlsafe_b64encode(data).rstrip(b"=").decode("ascii")


def _base64url_decode(data: str) -> bytes:
	padding = "=" * (-len(data) % 4)
	return base64.urlsafe_b64decode(data + padding)


def _encode_access_token(user_id: int) -> str:
	now = datetime.now(UTC)
	payload = {
		"user_id": user_id,
		"exp": int((now + timedelta(seconds=ACCESS_TOKEN_TTL_SECONDS)).timestamp()),
	}
	header = {"alg": "HS256", "typ": "JWT"}
	encoded_header = _base64url_encode(json.dumps(header, separators=(",", ":")).encode("utf-8"))
	encoded_payload = _base64url_encode(json.dumps(payload, separators=(",", ":")).encode("utf-8"))
	signing_input = f"{encoded_header}.{encoded_payload}".encode("ascii")
	signature = hmac.new(
		_require_jwt_secret().encode("utf-8"),
		signing_input,
		hashlib.sha256,
	).digest()
	return f"{encoded_header}.{encoded_payload}.{_base64url_encode(signature)}"


def _decode_access_token(token: str) -> dict[str, object]:
	try:
		header_segment, payload_segment, signature_segment = token.split(".")
		header = json.loads(_base64url_decode(header_segment))
		if header.get("alg") != "HS256":
			raise ValueError("Unsupported JWT algorithm")

		signing_input = f"{header_segment}.{payload_segment}".encode("ascii")
		expected_signature = hmac.new(
			_require_jwt_secret().encode("utf-8"),
			signing_input,
			hashlib.sha256,
		).digest()
		provided_signature = _base64url_decode(signature_segment)
		if not hmac.compare_digest(expected_signature, provided_signature):
			raise ValueError("Invalid JWT signature")

		payload = json.loads(_base64url_decode(payload_segment))
		expiry = payload.get("exp")
		user_id = payload.get("user_id")
		if not isinstance(expiry, (int, float)) or not isinstance(user_id, int):
			raise ValueError("Invalid JWT payload")
		if expiry <= datetime.now(UTC).timestamp():
			raise ValueError("Expired JWT")
		return {"user_id": user_id, "exp": int(expiry)}
	except (ValueError, json.JSONDecodeError, UnicodeDecodeError, OSError) as exc:
		raise HTTPException(status_code=401, detail={"message": "Invalid or expired access token"}) from exc


def _set_auth_cookies(response: Response, access_token: str, refresh_token: str | None = None) -> None:
	response.set_cookie(
		key=ACCESS_TOKEN_COOKIE_NAME,
		value=access_token,
		httponly=True,
		secure=True,
		samesite="lax",
		path="/",
		max_age=ACCESS_TOKEN_TTL_SECONDS,
	)
	if refresh_token is not None:
		response.set_cookie(
			key=REFRESH_TOKEN_COOKIE_NAME,
			value=refresh_token,
			httponly=True,
			secure=True,
			samesite="lax",
			path=REFRESH_TOKEN_COOKIE_PATH,
			max_age=SESSION_TTL_DAYS * 24 * 60 * 60,
		)


def _clear_auth_cookies(response: Response) -> None:
	response.delete_cookie(key=ACCESS_TOKEN_COOKIE_NAME, path="/")
	response.delete_cookie(key=REFRESH_TOKEN_COOKIE_NAME, path=REFRESH_TOKEN_COOKIE_PATH)

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
			User.username == lowered_identifier,
			User.email == lowered_identifier,
		)
	)
	result = await session.execute(statement.limit(1))
	return result.scalar_one_or_none()


async def _get_user_by_id(session: AsyncSession, user_id: int) -> User:
	result = await session.execute(sa.select(User).where(User.id == user_id).limit(1))
	user = result.scalar_one_or_none()
	if user is None:
		raise HTTPException(status_code=401, detail={"message": "Invalid or expired access token"})
	return user


async def register_user(
	session: AsyncSession,
	response: Response,
	username: str,
	email: str,
	password: str,
) -> dict[str, object]:
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
				User.username == normalized_username,
				User.email == normalized_email,
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
	refresh_token = await _create_session(session, user.id)
	access_token = _encode_access_token(user.id)
	_set_auth_cookies(response, access_token, refresh_token)
	return _serialize_user(user)


async def login_user(
	session: AsyncSession,
	response: Response,
	identifier: str,
	password: str,
) -> dict[str, object]:
	lookup = identifier.strip()
	if not lookup:
		raise HTTPException(status_code=400, detail={"message": "Email or username is required"})

	user = await _get_user_by_identifier(session, lookup)
	if user is None or not await _verify_password(password, user.password_hash):
		raise HTTPException(status_code=401, detail={"message": "Invalid credentials"})

	refresh_token = await _create_session(session, user.id)
	access_token = _encode_access_token(user.id)
	_set_auth_cookies(response, access_token, refresh_token)
	return _serialize_user(user)


async def refresh_access_token(session: AsyncSession, response: Response, refresh_token: str | None) -> None:
	if not refresh_token:
		raise HTTPException(status_code=401, detail={"message": "Missing refresh token"})

	token_hash = _hash_token(refresh_token)
	result = await session.execute(
		sa.select(Session).where(Session.token_hash == token_hash).limit(1)
	)
	session_obj = result.scalar_one_or_none()
	if session_obj is None:
		raise HTTPException(status_code=401, detail={"message": "Invalid or expired refresh token"})

	if session_obj.expires_at <= datetime.now(UTC):
		await session.delete(session_obj)
		await session.commit()
		raise HTTPException(status_code=401, detail={"message": "Invalid or expired refresh token"})

	session_obj.last_used_at = datetime.now(UTC)
	await session.commit()
	access_token = _encode_access_token(session_obj.user_id)
	_set_auth_cookies(response, access_token)


async def logout_user(session: AsyncSession, response: Response, refresh_token: str | None) -> None:
	if refresh_token:
		token_hash = _hash_token(refresh_token)
		result = await session.execute(
			sa.select(Session).where(Session.token_hash == token_hash).limit(1)
		)
		session_obj = result.scalar_one_or_none()
		if session_obj is not None:
			await session.delete(session_obj)
			await session.commit()
	else:
		print("# DEBUG: No refresh token provided for logout; skipping session deletion.")
	_clear_auth_cookies(response)


async def get_current_user(
	session: AsyncSession = Depends(get_db_session),
	access_token: str | None = Cookie(default=None),
) -> dict[str, object]:
	if access_token is None:
		raise HTTPException(status_code=401, detail={"message": "Missing access token"})
	return _decode_access_token(access_token)


async def get_user_profile(session: AsyncSession, user_id: int) -> dict[str, object]:
	user = await _get_user_by_id(session, user_id)
	return _serialize_user(user)


async def is_username_available(*, session, username: str) -> bool:
	result = await session.execute(select(User).where(User.username == username))
	return result.scalar_one_or_none() is None


async def update_user_profile(
    *,
    session,
    user_id: int,
    display_name: str | None,
    username: str | None,
    bio: str | None,
) -> User:
	user = await session.get(User, user_id)
	if user is None:
		raise UserNotFoundError()

	if username is not None and username != user.username:
		if not await is_username_available(session=session, username=username):
			raise UsernameTakenError()
		user.username = username

	if display_name is not None:
		user.display_name = display_name

	if bio is not None:
		user.bio = bio

	await session.commit()
	await session.refresh(user)
	return user