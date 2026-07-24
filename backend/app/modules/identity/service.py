from __future__ import annotations

import hashlib
import asyncio
from argon2 import PasswordHasher
from argon2.exceptions import VerifyMismatchError, VerificationError, InvalidHashError
import os
import secrets
from datetime import UTC, datetime, timedelta

import asyncpg
from fastapi import HTTPException

PASSWORD_HASH_ALGORITHM = "pbkdf2_sha256"
PASSWORD_HASH_ITERATIONS = 390000
PASSWORD_SALT_BYTES = 16
SESSION_TTL_DAYS = int(os.getenv("SESSION_TTL_DAYS", "7"))

SCHEMA_SQL = """
CREATE TABLE IF NOT EXISTS users (
    id BIGSERIAL PRIMARY KEY,
    username TEXT NOT NULL UNIQUE,
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    bio TEXT NOT NULL DEFAULT '',
    avatar_url TEXT NOT NULL DEFAULT '',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS users_username_lower_idx ON users (LOWER(username));
CREATE UNIQUE INDEX IF NOT EXISTS users_email_lower_idx ON users (LOWER(email));

CREATE TABLE IF NOT EXISTS sessions (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash TEXT NOT NULL UNIQUE,
    expires_at TIMESTAMPTZ NOT NULL,
    last_used_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS sessions_user_id_idx ON sessions (user_id);
CREATE INDEX IF NOT EXISTS sessions_expires_at_idx ON sessions (expires_at);
"""


def _db_config() -> dict[str, object]:
	return {
		"host": os.getenv("POSTGRES_HOST", "localhost"),
		"port": int(os.getenv("POSTGRES_PORT", "5432")),
		"user": os.getenv("POSTGRES_USER", "postgres"),
		"password": os.getenv("POSTGRES_PASSWORD", "postgres"),
		"database": os.getenv("POSTGRES_DB", "chatapp"),
	}


async def init_pool() -> asyncpg.Pool:
	return await asyncpg.create_pool(
		min_size=int(os.getenv("DB_POOL_MIN_SIZE", "1")),
		max_size=int(os.getenv("DB_POOL_MAX_SIZE", "5")),
		**_db_config(),
	)


async def close_pool(pool: asyncpg.Pool | None) -> None:
	if pool is not None:
		await pool.close()


async def ensure_schema(pool: asyncpg.Pool) -> None:
	await pool.execute(SCHEMA_SQL)


def _normalize_username(username: str) -> str:
	return username.strip().lower()


def _normalize_email(email: str) -> str:
	return email.strip().lower()


def _serialize_user(row: asyncpg.Record) -> dict[str, object]:
	return {
		"id": row["id"],
		"username": row["username"],
		"displayName": row["username"],
		"email": row["email"],
		"bio": row["bio"] or "",
		"avatar": row["avatar_url"] or "",
		"createdAt": row["created_at"],
		"updatedAt": row["updated_at"],
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


async def _create_session(pool: asyncpg.Pool, user_id: int) -> str:
	token = secrets.token_urlsafe(32)
	token_hash = _hash_token(token)
	expires_at = datetime.now(UTC) + timedelta(days=SESSION_TTL_DAYS)
	await pool.execute(
		"""
		INSERT INTO sessions (user_id, token_hash, expires_at)
		VALUES ($1, $2, $3)
		""",
		user_id,
		token_hash,
		expires_at,
	)
	return token


async def _get_user_by_identifier(pool: asyncpg.Pool, identifier: str) -> asyncpg.Record | None:
	return await pool.fetchrow(
		"""
		SELECT id, username, email, password_hash, bio, avatar_url, created_at, updated_at
		FROM users
		WHERE LOWER(username) = LOWER($1) OR LOWER(email) = LOWER($1)
		LIMIT 1
		""",
		identifier,
	)


async def register_user(pool: asyncpg.Pool, username: str, email: str, password: str) -> dict[str, object]:
	normalized_username = _normalize_username(username)
	normalized_email = _normalize_email(email)

	if not normalized_username:
		raise HTTPException(status_code=400, detail={"message": "Username is required"})
	if not normalized_email or "@" not in normalized_email:
		raise HTTPException(status_code=400, detail={"message": "A valid email is required"})
	if len(password) < 8:
		raise HTTPException(status_code=400, detail={"message": "Password must be at least 8 characters long"})

	existing = await pool.fetchrow(
		"""
		SELECT id
		FROM users
		WHERE LOWER(username) = LOWER($1) OR LOWER(email) = LOWER($2)
		LIMIT 1
		""",
		normalized_username,
		normalized_email,
	)
	if existing is not None:
		raise HTTPException(status_code=409, detail={"message": "Username or email already exists"})

	user = await pool.fetchrow(
		"""
		INSERT INTO users (username, email, password_hash)
		VALUES ($1, $2, $3)
		RETURNING id, username, email, bio, avatar_url, created_at, updated_at
		""",
		normalized_username,
		normalized_email,
		await _hash_password(password),
	)
	if user is None:
		raise HTTPException(status_code=500, detail={"message": "Failed to create user"})

	access_token = await _create_session(pool, user["id"])
	payload = _serialize_user(user)
	payload["accessToken"] = access_token
	return payload


async def login_user(pool: asyncpg.Pool, identifier: str, password: str) -> dict[str, object]:
	lookup = identifier.strip()
	if not lookup:
		raise HTTPException(status_code=400, detail={"message": "Email or username is required"})

	user = await _get_user_by_identifier(pool, lookup)
	if user is None or not await _verify_password(password, user["password_hash"]):
		raise HTTPException(status_code=401, detail={"message": "Invalid credentials"})

	access_token = await _create_session(pool, user["id"])
	payload = _serialize_user(user)
	payload["accessToken"] = access_token
	return payload


async def get_current_user(pool: asyncpg.Pool, token: str) -> dict[str, object]:
	if not token:
		raise HTTPException(status_code=401, detail={"message": "Missing access token"})

	token_hash = _hash_token(token)
	row = await pool.fetchrow(
		"""
		SELECT
		    s.expires_at,
		    u.id,
		    u.username,
		    u.email,
		    u.bio,
		    u.avatar_url,
		    u.created_at,
		    u.updated_at
		FROM sessions s
		JOIN users u ON u.id = s.user_id
		WHERE s.token_hash = $1
		LIMIT 1
		""",
		token_hash,
	)
	if row is None:
		raise HTTPException(status_code=401, detail={"message": "Invalid or expired access token"})

	if row["expires_at"] <= datetime.now(UTC):
		await pool.execute("DELETE FROM sessions WHERE token_hash = $1", token_hash)
		raise HTTPException(status_code=401, detail={"message": "Invalid or expired access token"})

	await pool.execute(
		"UPDATE sessions SET last_used_at = NOW() WHERE token_hash = $1",
		token_hash,
	)
	return _serialize_user(row)
