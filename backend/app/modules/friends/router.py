from fastapi import APIRouter, Depends, HTTPException, Query

from app.database import get_db_session
from app.modules.friends import service
from app.modules.identity.service import get_current_user

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
    friend_id: int,
    current_user: dict[str, object]=Depends(get_current_user),
    session=Depends(get_db_session),
):
    try:
        friendship = await service.add_friend(
            session=session, user_id=current_user["id"], friend_id=friend_id
        )
    except UserNotFoundError:
        raise HTTPException(status_code=404, detail={"message": "User not found"})
    except FriendshipConflictError as e:
        raise HTTPException(status_code=409, detail={"message": str(e)})

    return {"status": friendship.status}



@router.post("/request/{request_id}/accept")
async def accept_friend_request(
    request_id: int,
    current_user: dict[str, object]=Depends(get_current_user),
    session=Depends(get_db_session),
):
    try:
        friendship = await service.accept_friend_request(
            session=session, user_id=current_user["id"], request_id=request_id
        )
    except FriendshipNotFoundError:
        raise HTTPException(status_code=404, detail={"message": "Request not found"})
    except FriendshipForbiddenError:
        raise HTTPException(status_code=403, detail={"message": "Not allowed to modify this request"})
    except FriendshipConflictError as e:
        raise HTTPException(status_code=409, detail={"message": str(e)})

    return {"status": friendship.status}

@router.post("/request/{request_id}/decline", status_code=204)
async def decline_friend_request(
    request_id: int,
    current_user: dict[str, object]=Depends(get_current_user),
    session=Depends(get_db_session),
):
    try:
        await service.decline_friend_request(
            session=session, user_id=current_user["id"], request_id=request_id
        )
    except FriendshipNotFoundError:
        raise HTTPException(status_code=404, detail={"message": "Request not found"})
    except FriendshipForbiddenError:
        raise HTTPException(status_code=403, detail={"message": "Not allowed to modify this request"})
    except FriendshipConflictError as e:
        raise HTTPException(status_code=409, detail={"message": str(e)})

    return None

@router.delete("/request/{request_id}")
async def cancel_friend_request(
    request_id: int,
    current_user: dict[str, object]=Depends(get_current_user),
    session=Depends(get_db_session),
):
    try:
        await service.cancel_friend_request(
            session=session, user_id=current_user["id"], request_id=request_id
        )
    except FriendshipNotFoundError:
        raise HTTPException(status_code=404, detail={"message": "Request not found"})
    except FriendshipForbiddenError:
        raise HTTPException(status_code=403, detail={"message": "Not allowed to cancel this request"})
    except FriendshipConflictError as e:
        raise HTTPException(status_code=409, detail={"message": str(e)})

    return None

@router.delete("/delete/{friend_id}")
async def delete_friend(
    friend_id: int,
    current_user: dict[str, object]=Depends(get_current_user),
    session=Depends(get_db_session),
):
    try:
        await service.delete_friend(
            session=session, user_id=current_user["id"], friend_id=friend_id
        )
    except FriendshipNotFoundError:
        raise HTTPException(status_code=404, detail={"message": "Friendship not found"})
    except FriendshipForbiddenError:
        raise HTTPException(status_code=403, detail={"message": "Not allowed to delete this friendship"})

    return None