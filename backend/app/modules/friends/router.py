from fastapi import APIRouter, Cookie, Depends, HTTPException, Response, Query

from app.database import get_db_session
from app.modules.friends import service
from app.modules.identity import get_current_user

from pydantic import BaseModel, ConfigDict
from datetime import datetime

class FriendModel(BaseModel):
	id: int
	username: str
	bio: str | None = None

	model_config = ConfigDict( from_attributes=True )

class FriendRequestModel(BaseModel):
	sender: FriendModel
	friendship_id: int
	created_at: datetime

	model_config = ConfigDict( from_attributes=True )

router = APIRouter(prefix="/friends", tags=["Friends"])

@router.get("/list")
async def get_friends_list(
	current_user: dict[str, object]=Depends(get_current_user),
	limit: int = Query(50, ge=1, le=100),
	offset: int = Query(0, ge=0),
	session=Depends(get_db_session),
):
	friends = await service.list_friends(
		session=session,
		user_id=current_user["id"],
		limit=limit,
		offset=offset
	)

	return [FriendModel.model_validate(friend) for friend in friends]

@router.get("/requests")
async def get_friend_requests(
	current_user: dict[str, object]=Depends(get_current_user),
	limit: int = Query(50, ge=1, le=100),
	offset: int = Query(0, ge=0),
	session=Depends(get_db_session),
):
	requests = await service.get_friend_requests(
		session=session,
		user_id=current_user["id"],
		limit=limit,
		offset=offset
	)

	return [
		FriendRequestModel.model_validate({
			"sender": request[1],
			"friendship_id": request[0].id,
			"created_at": request[0].created_at
		})
		for request in requests
	]

@router.post("/add/{friend_id}")
async def add_friend(
	response: Response,
	friend_id: int,
	current_user: dict[str, object]=Depends(get_current_user),
	session=Depends(get_db_session),
):
	pass



@router.post("/request/{request_id}/accept")
async def accept_friend_request(
	response: Response,
	request_id: int,
	current_user: dict[str, object]=Depends(get_current_user),
	session=Depends(get_db_session),
):
	pass

@router.post("/request/{request_id}/decline")
async def decline_friend_request(
	response: Response,
	request_id: int,
	current_user: dict[str, object]=Depends(get_current_user),
	session=Depends(get_db_session),
):
	pass

@router.delete("/request/{request_id}")
async def cancel_friend_request(
    response: Response,
    request_id: int,
    current_user: dict[str, object]=Depends(get_current_user),
    session=Depends(get_db_session),
):
    pass

@router.delete("/delete/{friend_id}")
async def delete_friend(
	response: Response,
	friend_id: int,
	current_user: dict[str, object]=Depends(get_current_user),
	session=Depends(get_db_session),
):
	pass