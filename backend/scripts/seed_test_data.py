"""
Dev seed script: creates test users, friends them with a given main user,
and adds them to N newly created rooms.

Run inside the backend container so it picks up the app's DB env vars:
    docker exec chatapp-backend python -m scripts.seed_test_data
"""

import asyncio
import sys

import sqlalchemy as sa
from argon2 import PasswordHasher

sys.path.insert(0, "/app")

from app.database import async_session_factory
from app.models.identity import User, Friendship
from app.models.rooms import Room, RoomMember, RoomType, RoomRole

MAIN_USERNAME = "rust"
NUM_USERS = 5
NEW_USERNAMES = [f"testuser{i}" for i in range(1, NUM_USERS + 1)]
DEFAULT_PASSWORD = "password123"
ROOM_NAMES = ["Test Room A", "Test Room B"]

ph = PasswordHasher()


async def main() -> None:
    async with async_session_factory() as session:
        main_user = (
            await session.execute(sa.select(User).where(User.username == MAIN_USERNAME))
        ).scalar_one_or_none()
        if main_user is None:
            raise SystemExit(f"Main user '{MAIN_USERNAME}' not found")

        new_users = []
        for username in NEW_USERNAMES:
            existing = (
                await session.execute(sa.select(User).where(User.username == username))
            ).scalar_one_or_none()
            if existing is not None:
                new_users.append(existing)
                continue

            user = User(
                username=username,
                email=f"{username}@test.local",
                password_hash=ph.hash(DEFAULT_PASSWORD),
            )
            session.add(user)
            await session.flush()
            new_users.append(user)

        for user in new_users:
            if user.id == main_user.id:
                continue
            existing = (
                await session.execute(
                    sa.select(Friendship).where(
                        sa.or_(
                            sa.and_(
                                Friendship.sender_id == main_user.id,
                                Friendship.receiver_id == user.id,
                            ),
                            sa.and_(
                                Friendship.sender_id == user.id,
                                Friendship.receiver_id == main_user.id,
                            ),
                        )
                    )
                )
            ).scalar_one_or_none()
            if existing is not None:
                existing.status = "accepted"
            else:
                session.add(
                    Friendship(
                        sender_id=main_user.id,
                        receiver_id=user.id,
                        status="accepted",
                    )
                )

        rooms = []
        for name in ROOM_NAMES:
            room = Room(name=name, type=RoomType.ROOM)
            session.add(room)
            await session.flush()
            session.add(RoomMember(room_id=room.id, user_id=main_user.id, role=RoomRole.OWNER))
            rooms.append(room)

        for room in rooms:
            for user in new_users:
                existing = await session.get(RoomMember, (room.id, user.id))
                if existing is None:
                    session.add(
                        RoomMember(room_id=room.id, user_id=user.id, role=RoomRole.MEMBER)
                    )

        await session.commit()

        print(f"Main user: {main_user.username} (id={main_user.id})")
        print("Users:", [(u.username, u.id) for u in new_users])
        print("Rooms:", [(r.name, r.id) for r in rooms])
        print(f"Password for new users: {DEFAULT_PASSWORD}")


if __name__ == "__main__":
    asyncio.run(main())
