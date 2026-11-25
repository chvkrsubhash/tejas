import httpx
from fastapi import HTTPException
from app.config import settings
from app.models.schemas import AIChatRequest


async def generate_ai_completion(req: AIChatRequest) -> str:
    if req.provider == "ollama":
        async with httpx.AsyncClient(timeout=60) as client:
            resp = await client.post(
                f"{settings.OLLAMA_URL}/api/generate",
                json={
                    "model": req.model or "llama3.2",
                    "prompt": f"{req.system_prompt}\n\n{req.user_prompt}",
                    "stream": False,
                },
            )
            if resp.status_code != 200:
                raise HTTPException(status_code=502, detail=f"Ollama error: {resp.text}")
            return resp.json().get("response", "")

    if req.provider == "gemini":
        if not settings.GEMINI_API_KEY:
            raise HTTPException(status_code=503, detail="GEMINI_API_KEY is not configured on server")
        url = (
            f"https://generativelanguage.googleapis.com/v1beta/models/"
            f"{req.model or 'gemini-2.5-flash'}:generateContent?key={settings.GEMINI_API_KEY}"
        )
        async with httpx.AsyncClient(timeout=60) as client:
            resp = await client.post(
                url,
                json={"contents": [{"parts": [{"text": f"{req.system_prompt}\n\n{req.user_prompt}"}]}]},
            )
            if resp.status_code != 200:
                raise HTTPException(status_code=502, detail=f"Gemini error: {resp.text}")
            data = resp.json()
            return data.get("candidates", [{}])[0].get("content", {}).get("parts", [{}])[0].get("text", "")

    if req.provider in ("groq", "openrouter"):
        key = settings.GROQ_API_KEY if req.provider == "groq" else settings.OPENROUTER_API_KEY
        if not key:
            raise HTTPException(status_code=503, detail=f"{req.provider.upper()}_API_KEY is not configured")
        endpoint = (
            "https://api.groq.com/openai/v1/chat/completions"
            if req.provider == "groq"
            else "https://openrouter.ai/api/v1/chat/completions"
        )
        async with httpx.AsyncClient(timeout=60) as client:
            resp = await client.post(
                endpoint,
                headers={"Authorization": f"Bearer {key}"},
                json={
                    "model": req.model,
                    "messages": [
                        {"role": "system", "content": req.system_prompt},
                        {"role": "user", "content": req.user_prompt},
                    ],
                    "max_tokens": req.max_tokens,
                },
            )
            if resp.status_code != 200:
                raise HTTPException(status_code=502, detail=f"{req.provider} error: {resp.text}")
            return resp.json().get("choices", [{}])[0].get("message", {}).get("content", "")

    raise HTTPException(status_code=400, detail="Unsupported AI provider")

