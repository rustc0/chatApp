from fastapi import APIRouter

from app.modules.identity.router import router as identity_router
from app.modules.rooms.router import router as rooms_router
from app.modules.friends.router import router as friends_router
from app.modules.messages.router import router as messages_router
from app.modules.messages.router import ws_router as messages_ws_router

router = APIRouter()
router.include_router(identity_router)
router.include_router(friends_router)
router.include_router(rooms_router)
router.include_router(messages_router)
router.include_router(messages_ws_router)
