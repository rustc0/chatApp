from fastapi import HTTPException
import sqlalchemy as sa
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.identity import User, Friendship

async def list_friends(session: AsyncSession, user_id: int,
	limit: int, offset: int) -> list[User]:
	result = await session.execute(
		sa.select(User).join(
			Friendship, sa.or_(
				sa.and_(Friendship.sender_id == user_id, Friendship.receiver_id == User.id),
				sa.and_(Friendship.receiver_id == user_id, Friendship.sender_id == User.id)
			)
		).where(Friendship.status == "accepted").order_by(
			Friendship.created_at.desc(),
			Friendship.id.desc(),
		).offset(offset).limit(limit)
	)
	return result.scalars().all()


async def get_friend_requests(session: AsyncSession, user_id: int,
	limit: int, offset: int) -> list[tuple[Friendship, User]]:
	result = await session.execute(
		sa.select(Friendship, User).join(
			User, Friendship.sender_id == User.id
		).where(
			Friendship.receiver_id == user_id,
			Friendship.status == "pending"
		).order_by(
			Friendship.created_at.desc(),
			Friendship.id.desc(),
		).offset(offset).limit(limit)
	)
	return result.all()
