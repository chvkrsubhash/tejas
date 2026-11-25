from datetime import datetime, timezone
import uuid
from fastapi import APIRouter, HTTPException, status
from app.db.mongodb import get_db
from app.models.schemas import TokenResponse, UserLogin, UserRegister
from app.services.auth import create_access_token, hash_password, verify_password

router = APIRouter(prefix="/api/auth", tags=["Authentication"])


@router.post("/register", response_model=TokenResponse)
async def register(payload: UserRegister):
    db = get_db()
    existing = await db["users"].find_one({"email": payload.email.lower()})
    if existing:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Email already registered")

    user_id = f"usr-{uuid.uuid4().hex[:12]}"
    doc = {
        "_id": user_id,
        "name": payload.name.strip(),
        "email": payload.email.lower(),
        "password_hash": hash_password(payload.password),
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    await db["users"].insert_one(doc)
    token = create_access_token(user_id, doc["email"])
    return TokenResponse(
        access_token=token,
        user={"id": user_id, "name": doc["name"], "email": doc["email"]},
    )


@router.post("/login", response_model=TokenResponse)
async def login(payload: UserLogin):
    db = get_db()
    user = await db["users"].find_one({"email": payload.email.lower()})
    if not user or not verify_password(payload.password, user["password_hash"]):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")

    token = create_access_token(user["_id"], user["email"])
    return TokenResponse(
        access_token=token,
        user={"id": user["_id"], "name": user["name"], "email": user["email"]},
    )

