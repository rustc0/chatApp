from fastapi import APIRouter

from app.modules.identity.router import router as identity_router
from app.modules.rooms.router import router as rooms_router
from app.modules.friends.router import router as friends_router

router = APIRouter()
router.include_router(identity_router)
router.include_router(friends_router)
router.include_router(rooms_router)
