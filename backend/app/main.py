from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from slowapi.util import get_remote_address
from app.config import settings
from app.db.mongodb import close_db, connect_db
from app.routes import ai, auth, ecosystem, presentations, ws

limiter = Limiter(key_func=get_remote_address)


@asynccontextmanager
async def lifespan(app: FastAPI):
    await connect_db()
    yield
    await close_db()


app = FastAPI(
    title=f"{settings.PRODUCT_NAME} Presentation API",
    description=f"Backend API for {settings.PRODUCT_NAME} by {settings.COMPANY_NAME}",
    version="1.0.0",
    lifespan=lifespan,
)

app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[o.strip() for o in settings.CORS_ORIGINS.split(",")],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(presentations.router)
app.include_router(ai.router)
app.include_router(ecosystem.router)
app.include_router(ws.router)


@app.get("/api/health")
async def health():
    return {
        "status": "ok",
        "product": settings.PRODUCT_NAME,
        "company": settings.COMPANY_NAME,
    }

