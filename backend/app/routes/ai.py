from fastapi import APIRouter, Request
from app.models.schemas import AIChatRequest
from app.services.ai_service import generate_ai_completion

router = APIRouter(prefix="/api/ai", tags=["AI Assistant"])


@router.post("/chat")
async def ai_chat(request: Request, payload: AIChatRequest):
    content = await generate_ai_completion(payload)
    return {"content": content, "provider": payload.provider, "model": payload.model}

