from contextlib import asynccontextmanager

from fastapi import FastAPI, HTTPException, Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse

from app.database import engine
from app.modules.main_router import router as main_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    try:
        yield
    finally:
        await engine.dispose()


app = FastAPI(lifespan=lifespan)
app.include_router(main_router)


@app.exception_handler(HTTPException)
async def http_exception_handler(_: Request, exc: HTTPException):
    content = exc.detail if isinstance(exc.detail, dict) else {"message": str(exc.detail)}
    if "message" not in content:
        content = {"message": str(exc.detail)}
    if exc.status_code >= 500:
        content = {"message": "Something went wrong. Please try again later."}
    return JSONResponse(status_code=exc.status_code, content=content)


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(_: Request, exc: RequestValidationError):
    message = exc.errors()[0]["msg"] if exc.errors() else "Invalid request"
    return JSONResponse(status_code=422, content={"message": message})


@app.get("/health")
async def health() -> dict[str, str]:
    return {"status": "ok"}
