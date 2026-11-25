from datetime import datetime, timezone
import uuid
from fastapi import APIRouter, Depends, File, UploadFile
from app.db.mongodb import get_db
from app.models.schemas import CommentCreate, PermissionRequest, PresentationCreate, PresentationUpdate
from app.services.auth import check_presentation_access, get_current_user
from app.services.pptx_service import parse_pptx_bytes

router = APIRouter(prefix="/api/presentations", tags=["Presentations"])


@router.get("")
async def list_presentations(user: dict = Depends(get_current_user)):
    db = get_db()
    perms = await db["presentation_permissions"].find({"email": user["email"]}).to_list(200)
    shared_ids = [p["presentation_id"] for p in perms]
    cursor = db["presentations"].find(
        {"$or": [{"owner_id": user["_id"]}, {"_id": {"$in": shared_ids}}]}
    ).sort("updated_at", -1)
    docs = await cursor.to_list(200)
    return {"items": docs}


@router.post("")
async def create_presentation(payload: PresentationCreate, user: dict = Depends(get_current_user)):
    db = get_db()
    now = datetime.now(timezone.utc).isoformat()
    pres_id = f"pres-{uuid.uuid4().hex[:12]}"
    doc = {
        "_id": pres_id,
        "id": pres_id,
        "title": payload.title,
        "owner_id": user["_id"],
        "owner_name": user["name"],
        "aspect_ratio": payload.aspect_ratio,
        "width": payload.width,
        "height": payload.height,
        "theme_id": payload.theme_id,
        "slides": payload.slides,
        "masters": payload.masters,
        "sections": [],
        "is_favorite": False,
        "is_trashed": False,
        "created_at": now,
        "updated_at": now,
    }
    await db["presentations"].insert_one(doc)
    await db["audit_logs"].insert_one({
        "user_id": user["_id"],
        "action": "create_presentation",
        "presentation_id": pres_id,
        "timestamp": now,
    })
    return doc


@router.get("/{presentation_id}")
async def get_presentation(presentation_id: str, user: dict = Depends(get_current_user)):
    return await check_presentation_access(presentation_id, user, ("owner", "editor", "commenter", "viewer"))


@router.put("/{presentation_id}")
async def update_presentation(
    presentation_id: str, payload: PresentationUpdate, user: dict = Depends(get_current_user)
):
    await check_presentation_access(presentation_id, user, ("owner", "editor"))
    db = get_db()
    updates = {k: v for k, v in payload.model_dump(exclude_none=True).items()}
    updates["updated_at"] = datetime.now(timezone.utc).isoformat()
    await db["presentations"].update_one({"_id": presentation_id}, {"$set": updates})
    return await db["presentations"].find_one({"_id": presentation_id})


@router.delete("/{presentation_id}")
async def delete_presentation(presentation_id: str, user: dict = Depends(get_current_user)):
    await check_presentation_access(presentation_id, user, ("owner",))
    db = get_db()
    await db["presentations"].delete_one({"_id": presentation_id})
    await db["presentation_permissions"].delete_many({"presentation_id": presentation_id})
    return {"deleted": True}


@router.post("/{presentation_id}/permissions")
async def add_permission(
    presentation_id: str, payload: PermissionRequest, user: dict = Depends(get_current_user)
):
    await check_presentation_access(presentation_id, user, ("owner",))
    db = get_db()
    entry = {
        "_id": f"perm-{uuid.uuid4().hex[:10]}",
        "presentation_id": presentation_id,
        "email": payload.email.lower(),
        "name": payload.name or payload.email,
        "role": payload.role,
        "added_at": datetime.now(timezone.utc).isoformat(),
    }
    await db["presentation_permissions"].insert_one(entry)
    return entry


@router.post("/{presentation_id}/comments")
async def add_comment(
    presentation_id: str, payload: CommentCreate, user: dict = Depends(get_current_user)
):
    await check_presentation_access(presentation_id, user, ("owner", "editor", "commenter"))
    db = get_db()
    comment = {
        "_id": f"cmt-{uuid.uuid4().hex[:10]}",
        "presentation_id": presentation_id,
        "slide_id": payload.slide_id,
        "object_id": payload.object_id,
        "author_id": user["_id"],
        "author_name": user["name"],
        "text": payload.text,
        "resolved": False,
        "created_at": datetime.now(timezone.utc).isoformat(),
        "replies": [],
    }
    await db["comments"].insert_one(comment)
    return comment


@router.post("/import/pptx")
async def import_pptx(file: UploadFile = File(...), user: dict = Depends(get_current_user)):
    raw = await file.read()
    title = (file.filename or "Imported Presentation").rsplit(".", 1)[0]
    return parse_pptx_bytes(raw, title, user["_id"], user["name"])

