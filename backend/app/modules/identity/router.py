from fastapi import APIRouter, Cookie, Depends, File, HTTPException, Response, UploadFile
from fastapi.responses import FileResponse
from pydantic import BaseModel, Field

from app.modules.identity import avatar_service
from app.modules.identity import service as identity_service
from app.database import get_db_session


class RegisterRequest(BaseModel):
	username: str = Field(min_length=1, max_length=50)
	email: str = Field(min_length=3, max_length=254)
	password: str = Field(min_length=8, max_length=128)


class LoginRequest(BaseModel):
	identifier: str = Field(min_length=1, max_length=254)
	password: str = Field(min_length=1, max_length=128)


class UsernameAvailabilityResponse(BaseModel):
	available: bool


class UserProfileUpdateRequest(BaseModel):
	display_name: str | None = Field(default=None, min_length=1, max_length=50)
	username: str | None = Field(default=None, min_length=3, max_length=20, pattern=r"^[a-zA-Z0-9_]+$")
	bio: str | None = Field(default=None, max_length=280)


class UserProfileResponse(BaseModel):
	id: int
	display_name: str | None
	username: str | None
	bio: str | None

	class Config:
		from_attributes = True

# should move the schemas to a separate file later


router = APIRouter(prefix="/users", tags=["Identity"])


@router.post("/register")
async def register_user(
	payload: RegisterRequest,
	response: Response,
	session=Depends(get_db_session),
):
	return await identity_service.register_user(response=response, session=session, username=payload.username, email=payload.email, password=payload.password)


@router.post("/login")
async def login_user(
	payload: LoginRequest,
	response: Response,
	session=Depends(get_db_session),
):
	return await identity_service.login_user(response=response, session=session, identifier=payload.identifier, password=payload.password)


@router.post("/auth/refresh")
async def refresh_access_token(
	response: Response,
	refresh_token: str | None = Cookie(default=None),
	session=Depends(get_db_session),
):
	await identity_service.refresh_access_token(session=session, response=response, refresh_token=refresh_token)
	return {"message": "Access token refreshed"}


@router.post("/auth/logout")
async def logout_user(
	response: Response,
	refresh_token: str | None = Cookie(default=None),
	session=Depends(get_db_session),
):
	await identity_service.logout_user(
		session=session, response=response, refresh_token=refresh_token
	)
	return {"message": "Logged out"}


@router.get("/me")
async def get_me(
	current_user: dict[str, object] = Depends(identity_service.get_current_user),
	session=Depends(get_db_session),
):
	return await identity_service.get_user_profile(session, int(current_user["user_id"]))

@router.get("/check-username")
async def check_username(
	username: str,
	session=Depends(get_db_session),
):
	available = await identity_service.is_username_available(
		session=session, username=username
	)
	return UsernameAvailabilityResponse.model_validate({"available": available})


@router.get("/by-username", response_model=UserProfileResponse)
async def get_user_by_username(
	username: str,
	session=Depends(get_db_session),
):
	user = await identity_service.get_user_by_username(session=session, username=username)
	if user is None:
		raise HTTPException(status_code=404, detail={"message": "User not found"})
	return UserProfileResponse.model_validate(user)


@router.put("/me")
async def update_profile(
	payload: UserProfileUpdateRequest,
	current_user: dict[str, object] = Depends(identity_service.get_current_user),
	session=Depends(get_db_session),
):
	try:
		user = await identity_service.update_user_profile(
			session=session,
			user_id=int(current_user["user_id"]),
			display_name=payload.display_name,
			username=payload.username,
			bio=payload.bio,
		)
	except identity_service.UsernameTakenError:
		raise HTTPException(status_code=409, detail="Username is already taken")
	except identity_service.UserNotFoundError:
		raise HTTPException(status_code=404, detail="User not found")

	return identity_service._serialize_user(user)


@router.get("/avatar/{filename}")
async def get_avatar(filename: str):
	return FileResponse(avatar_service.avatar_path(filename))


@router.post("/me/avatar")
async def upload_avatar(
	avatar: UploadFile = File(...),
	current_user: dict[str, object] = Depends(identity_service.get_current_user),
	session=Depends(get_db_session),
):
	return await avatar_service.save_avatar(
		session=session, user_id=int(current_user["user_id"]), upload=avatar
	)


@router.delete("/me/avatar")
async def remove_avatar(
	current_user: dict[str, object] = Depends(identity_service.get_current_user),
	session=Depends(get_db_session),
):
	return await avatar_service.clear_avatar(
		session=session, user_id=int(current_user["user_id"])
	)