from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    PRODUCT_NAME: str = "Tejas"
    COMPANY_NAME: str = "AkashaVyom Labs"
    MONGODB_URI: str = "mongodb://localhost:27017"
    MONGODB_DB: str = "tejas_presentations"
    JWT_SECRET: str = "change-me-in-production-use-64-char-secret"
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440
    CORS_ORIGINS: str = "http://localhost:5173"
    MAX_UPLOAD_MB: int = 50
    GEMINI_API_KEY: str = ""
    GROQ_API_KEY: str = ""
    OPENROUTER_API_KEY: str = ""
    OLLAMA_URL: str = "http://localhost:11434"

    class Config:
        env_file = ".env"


settings = Settings()

