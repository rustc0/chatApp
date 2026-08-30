import sqlalchemy as sa
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.identity import User, Friendship

class UserNotFoundError(Exception):
	pass

class FriendshipNotFoundError(Exception):
	pass

class FriendshipForbiddenError(Exception):
	pass

class FriendshipConflictError(Exception):
	def __init__(self, message: str):
		self.message = message
		super().__init__(message)


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

async def add_friend(session: AsyncSession, user_id: int, friend_id: int) -> Friendship:
	if user_id == friend_id:
		raise FriendshipConflictError("Cannot add yourself as a friend")

	friend = await session.get(User, friend_id)
	if friend is None:
		raise UserNotFoundError()

	# Serialize on the unordered pair so two racing requests (in either
	# direction) can't both pass the existence check below.
	lock_key = (min(user_id, friend_id) << 32) | max(user_id, friend_id)
	await session.execute(sa.select(sa.func.pg_advisory_xact_lock(lock_key)))

	result = await session.execute(
		sa.select(Friendship).where(
			sa.or_(
				sa.and_(Friendship.sender_id == user_id,
				Friendship.receiver_id == friend_id),
				sa.and_(Friendship.sender_id == friend_id,
				Friendship.receiver_id == user_id),
			)
		)
	)
	existing = result.scalars().first()

	if existing is not None:
		if existing.status == "accepted":
			raise FriendshipConflictError("Already friends")
		if existing.status == "pending":
			if existing.sender_id == friend_id:
				# they already requested us -> auto-accept instead of a second row
				existing.status = "accepted"
				await session.commit()
				await session.refresh(existing)
				return existing
			raise FriendshipConflictError("Friend request already sent")

	friendship = Friendship(sender_id=user_id, receiver_id=friend_id, status="pending")
	session.add(friendship)
	try:
		await session.commit()
	except IntegrityError as exc:
		await session.rollback()
		raise FriendshipConflictError("Friend request already sent") from exc
	await session.refresh(friendship)
	return friendship


async def accept_friend_request(session: AsyncSession, user_id: int, request_id: int) -> Friendship:
	friendship = await session.get(Friendship, request_id)
	if friendship is None:
		raise FriendshipNotFoundError()
	if friendship.receiver_id != user_id:
		raise FriendshipForbiddenError()
	if friendship.status != "pending":
		raise FriendshipConflictError("Request is no longer pending")

	friendship.status = "accepted"
	await session.commit()
	await session.refresh(friendship)
	return friendship


async def decline_friend_request(session: AsyncSession, user_id: int, request_id: int) -> None:
	friendship = await session.get(Friendship, request_id)
	if friendship is None:
		raise FriendshipNotFoundError()
	if friendship.receiver_id != user_id:
		raise FriendshipForbiddenError()
	if friendship.status != "pending":
		raise FriendshipConflictError("Request is no longer pending")

	await session.delete(friendship)
	await session.commit()

async def cancel_friend_request(session: AsyncSession, user_id: int, request_id: int) -> None:
    friendship = await session.get(Friendship, request_id)
    if friendship is None:
        raise FriendshipNotFoundError()
    if friendship.sender_id != user_id:
        raise FriendshipForbiddenError()
    if friendship.status != "pending":
        raise FriendshipConflictError("Request is no longer pending")

    await session.delete(friendship)
    await session.commit()


async def delete_friend(session: AsyncSession, user_id: int, friend_id: int) -> None:
    result = await session.execute(
        sa.select(Friendship).where(
            sa.and_(
                Friendship.status == "accepted",
                sa.or_(
                    sa.and_(Friendship.sender_id == user_id, Friendship.receiver_id == friend_id),
                    sa.and_(Friendship.sender_id == friend_id, Friendship.receiver_id == user_id),
                ),
            )
        )
    )
    friendship = result.scalars().first()

    if friendship is None:
        raise FriendshipNotFoundError()

    await session.delete(friendship)
    await session.commit()