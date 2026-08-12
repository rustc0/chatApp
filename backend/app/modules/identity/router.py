from fastapi import APIRouter, Cookie, Depends, HTTPException, Response
from pydantic import BaseModel, Field

from app.modules.identity import service
from app.database import get_db_session


class RegisterRequest(BaseModel):
	username: str = Field(min_length=1, max_length=50)
	email: str = Field(min_length=3, max_length=254)
	password: str = Field(min_length=8, max_length=128)


class LoginRequest(BaseModel):
	identifier: str = Field(min_length=1, max_length=254)
	password: str = Field(min_length=1, max_length=128)


router = APIRouter(prefix="/users", tags=["Identity"])


@router.post("/register")
async def register_user(
	payload: RegisterRequest,
	response: Response,
	session=Depends(get_db_session),
):
	return await service.register_user(response=response, session=session, username=payload.username, email=payload.email, password=payload.password)


@router.post("/login")
async def login_user(
	payload: LoginRequest,
	response: Response,
	session=Depends(get_db_session),
):
	return await service.login_user(response=response, session=session, identifier=payload.identifier, password=payload.password)


@router.post("/refresh")
async def refresh_access_token(
	response: Response,
	refresh_token: str | None = Cookie(default=None),
	session=Depends(get_db_session),
):
	await service.refresh_access_token(session=session, response=response, refresh_token=refresh_token)
	return {"message": "Access token refreshed"}


@router.post("/logout")
async def logout_user(
	response: Response,
	refresh_token: str | None = Cookie(default=None),
	session=Depends(get_db_session),
):
	await service.logout_user(session=session, response=response, refresh_token=refresh_token)
	return {"message": "Logged out"}


@router.get("/me")
async def get_me(
	access_token: str | None = Cookie(default=None),
	session=Depends(get_db_session),
):
	if access_token is None:
		raise HTTPException(status_code=401, detail={"message": "Missing access token"})

	current_user = await service.get_current_user(session, access_token)
	return await service.get_user_profile(session, int(current_user["user_id"]))