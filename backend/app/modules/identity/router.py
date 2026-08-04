from fastapi import APIRouter, Depends, Header, HTTPException
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
async def register_user(payload: RegisterRequest, session = Depends(get_db_session)):
	return await service.register_user(session, payload.username, payload.email, payload.password)


@router.post("/login")
async def login_user(payload: LoginRequest, session = Depends(get_db_session)):
	return await service.login_user(session, payload.identifier, payload.password)


@router.get("/me")
async def get_me(authorization: str | None = Header(default=None),
				 session = Depends(get_db_session)):
	if authorization is None or not authorization.startswith("Bearer "):
		raise HTTPException(status_code=401, detail={"message": "Missing access token"})

	token = authorization.removeprefix("Bearer ").strip()
	return await service.get_current_user(session, token)