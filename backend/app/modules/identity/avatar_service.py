"""Avatar storage.

The users table already has `avatar_url`; this stores the generated filename in
it and keeps the bytes on a mounted volume. Import these from
app/modules/identity/router.py — see PATCHES.md for the routes.
"""

import os
import secrets
from pathlib import Path

from fastapi import HTTPException, UploadFile

from app.modules.identity.service import _get_user_by_id, _serialize_user

AVATAR_DIR = Path(os.getenv("AVATAR_DIR", "/app/media/avatars"))
AVATAR_DIR.mkdir(parents=True, exist_ok=True)
MAX_AVATAR_BYTES = 2 * 1024 * 1024

ALLOWED_AVATAR_TYPES = {
    "image/png": ".png",
    "image/jpeg": ".jpg",
    "image/webp": ".webp",
}


def avatar_path(filename: str) -> Path:
    """Resolve a stored filename, refusing anything that escapes AVATAR_DIR."""
    root = AVATAR_DIR.resolve()
    candidate = (root / filename).resolve()

    if candidate.parent != root or not candidate.is_file():
        raise HTTPException(status_code=404, detail={"message": "Avatar not found"})

    return candidate


def _delete_avatar_file(filename: str) -> None:
    if not filename:
        return
    try:
        avatar_path(filename).unlink(missing_ok=True)
    except HTTPException:
        pass  # nothing on disk to clean up


async def save_avatar(*, session, user_id: int, upload: UploadFile) -> dict[str, object]:
    extension = ALLOWED_AVATAR_TYPES.get(upload.content_type)
    if extension is None:
        raise HTTPException(
            status_code=415,
            detail={"message": "Use a PNG, JPEG or WebP image"},
        )

    payload = await upload.read()
    if not payload:
        raise HTTPException(status_code=400, detail={"message": "Empty file"})
    if len(payload) > MAX_AVATAR_BYTES:
        raise HTTPException(
            status_code=413,
            detail={"message": "Avatar must be under 2 MB"},
        )

    user = await _get_user_by_id(session, user_id)

    filename = f"{user_id}-{secrets.token_hex(8)}{extension}"
    (AVATAR_DIR / filename).write_bytes(payload)

    previous = user.avatar_url
    user.avatar_url = filename
    await session.commit()
    await session.refresh(user)

    _delete_avatar_file(previous)

    return _serialize_user(user)


async def clear_avatar(*, session, user_id: int) -> dict[str, object]:
    user = await _get_user_by_id(session, user_id)
    previous = user.avatar_url

    user.avatar_url = ""
    await session.commit()
    await session.refresh(user)

    _delete_avatar_file(previous)

    return _serialize_user(user)
