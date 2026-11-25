import uuid
from datetime import datetime, timezone
from fastapi import APIRouter, Depends
from app.models.schemas import EcosystemImportRequest
from app.services.auth import get_current_user

router = APIRouter(prefix="/api/ecosystem", tags=["AkashaVyom Ecosystem"])


@router.post("/import-to-slides")
async def import_from_titan_or_europa(
    payload: EcosystemImportRequest, user: dict = Depends(get_current_user)
):
    """Convert a Titan document or Europa notebook page into structured slide outlines."""
    sections = [s.strip() for s in payload.markdown_content.split("# ") if s.strip()]
    slides = []
    for idx, block in enumerate(sections or [payload.title]):
        lines = block.splitlines()
        heading = lines[0] if lines else f"Slide {idx + 1}"
        body = "\n".join(lines[1:]).strip() or "• Key takeaway"
        slides.append({
            "id": f"slide-{uuid.uuid4().hex[:8]}",
            "order": idx,
            "title": heading,
            "layout": "title_content",
            "source_app": payload.source_app,
            "source_document_id": payload.document_id,
            "body": body,
        })

    return {
        "presentation_id": f"pres-{uuid.uuid4().hex[:10]}",
        "title": payload.title,
        "owner_id": user["_id"],
        "source_app": payload.source_app,
        "slides": slides,
        "imported_at": datetime.now(timezone.utc).isoformat(),
    }

