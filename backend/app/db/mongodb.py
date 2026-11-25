from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase
from app.config import settings

client: AsyncIOMotorClient | None = None
db: AsyncIOMotorDatabase | None = None

COLLECTIONS = [
    "users",
    "presentations",
    "slides",
    "slide_objects",
    "slide_masters",
    "themes",
    "templates",
    "animations",
    "transitions",
    "media_assets",
    "presentation_permissions",
    "comments",
    "revisions",
    "folders",
    "ai_conversations",
    "ai_messages",
    "user_preferences",
    "audit_logs",
]


async def connect_db() -> None:
    global client, db
    client = AsyncIOMotorClient(settings.MONGODB_URI)
    db = client[settings.MONGODB_DB]
    await db["users"].create_index("email", unique=True)
    await db["presentations"].create_index("owner_id")
    await db["presentation_permissions"].create_index([("presentation_id", 1), ("email", 1)])
    await db["slides"].create_index("presentation_id")
    await db["slide_objects"].create_index("slide_id")


async def close_db() -> None:
    global client
    if client:
        client.close()


def get_db() -> AsyncIOMotorDatabase:
    if db is None:
        raise RuntimeError("Database is not initialized")
    return db

