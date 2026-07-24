from fastapi import APIRouter, Header, HTTPException, Request
from pydantic import BaseModel, Field

from app.modules.identity import service


class RegisterRequest(BaseModel):
	username: str = Field(min_length=1, max_length=50)
	email: str = Field(min_length=3, max_length=254)
	password: str = Field(min_length=8, max_length=128)


class LoginRequest(BaseModel):
	identifier: str = Field(min_length=1, max_length=254)
	password: str = Field(min_length=1, max_length=128)


router = APIRouter(prefix="/users", tags=["Identity"])


@router.post("/register")
async def register_user(request: Request, payload: RegisterRequest):
	pool = request.app.state.db_pool
	return await service.register_user(pool, payload.username, payload.email, payload.password)


@router.post("/login")
async def login_user(request: Request, payload: LoginRequest):
	pool = request.app.state.db_pool
	return await service.login_user(pool, payload.identifier, payload.password)


@router.get("/me")
async def get_me(request: Request, authorization: str | None = Header(default=None)):
	if authorization is None or not authorization.startswith("Bearer "):
		raise HTTPException(status_code=401, detail={"message": "Missing access token"})

	token = authorization.removeprefix("Bearer ").strip()
	pool = request.app.state.db_pool
	return await service.get_current_user(pool, token)