from motor.motor_asyncio import AsyncIOMotorClient
from app.core.config import settings
from typing import Optional
import asyncio
import logging

logger = logging.getLogger(__name__)

MAX_RETRIES = 5
RETRY_DELAY_SECONDS = 3

class Database:
    client: Optional[AsyncIOMotorClient] = None
    connected: bool = False

db = Database()

async def get_db():
    """
    Dependency injection for FastAPI routes.
    """
    if db.client is None:
        raise RuntimeError("Database client is not initialized.")
    return db.client[settings.MONGO_DB_NAME]

async def connect_to_mongo():
    """
    Initialize MongoDB connection with retry.
    The app starts even if MongoDB is temporarily unreachable.
    """
    db.client = AsyncIOMotorClient(
        settings.MONGO_URI,
        maxPoolSize=settings.MONGO_MAX_POOL_SIZE,
        minPoolSize=settings.MONGO_MIN_POOL_SIZE,
        serverSelectionTimeoutMS=settings.MONGO_TIMEOUT_MS,
    )
    for attempt in range(1, MAX_RETRIES + 1):
        try:
            await db.client.admin.command('ping')
            db.connected = True
            logger.info("Connected to MongoDB.")
            return
        except Exception as e:
            logger.warning(
                f"MongoDB connection attempt {attempt}/{MAX_RETRIES} failed: {e}"
            )
            if attempt < MAX_RETRIES:
                await asyncio.sleep(RETRY_DELAY_SECONDS)

    logger.error(
        "Could not verify MongoDB connection after %d attempts. "
        "App will start anyway — requests that need the DB may fail.",
        MAX_RETRIES,
    )

async def close_mongo_connection():
    """
    Close MongoDB connection.
    To be called during app shutdown.
    """
    if db.client:
        db.client.close()
        db.client = None
        logger.info("MongoDB connection closed.")
