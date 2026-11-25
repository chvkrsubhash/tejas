from datetime import datetime
from typing import Any, Literal, Optional
from pydantic import BaseModel, EmailStr, Field


class UserRegister(BaseModel):
    name: str = Field(min_length=1, max_length=120)
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: dict[str, Any]


class PresentationCreate(BaseModel):
    title: str = Field(default="Untitled Presentation", max_length=200)
    aspect_ratio: Literal["16:9", "4:3", "portrait", "custom"] = "16:9"
    width: int = 1280
    height: int = 720
    theme_id: str = "corporate"
    slides: list[dict[str, Any]] = Field(default_factory=list)
    masters: list[dict[str, Any]] = Field(default_factory=list)


class PresentationUpdate(BaseModel):
    title: Optional[str] = None
    theme_id: Optional[str] = None
    width: Optional[int] = None
    height: Optional[int] = None
    slides: Optional[list[dict[str, Any]]] = None
    masters: Optional[list[dict[str, Any]]] = None
    sections: Optional[list[dict[str, Any]]] = None
    is_favorite: Optional[bool] = None
    is_trashed: Optional[bool] = None
    folder_id: Optional[str] = None


class PermissionRequest(BaseModel):
    email: EmailStr
    name: str = ""
    role: Literal["editor", "commenter", "viewer"]


class CommentCreate(BaseModel):
    slide_id: str
    object_id: Optional[str] = None
    text: str = Field(min_length=1, max_length=2000)


class AIChatRequest(BaseModel):
    provider: Literal["gemini", "groq", "openrouter", "ollama"] = "gemini"
    model: str = "gemini-2.5-flash"
    system_prompt: str = ""
    user_prompt: str = Field(min_length=1, max_length=16000)
    max_tokens: int = Field(default=2048, ge=64, le=8192)


class EcosystemImportRequest(BaseModel):
    source_app: Literal["titan", "europa"]
    document_id: str
    title: str
    markdown_content: str
    created_at: Optional[datetime] = None

