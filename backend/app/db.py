from motor.motor_asyncio import AsyncIOMotorClient
from app.config import settings
from typing import Optional
import logging

logger = logging.getLogger(__name__)

class Database:
    client: Optional[AsyncIOMotorClient] = None

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
    Initialize MongoDB connection.
    To be called during app startup.
    """
    try:
        db.client = AsyncIOMotorClient(
            settings.MONGO_URI,
            maxPoolSize=settings.MONGO_MAX_POOL_SIZE,
            minPoolSize=settings.MONGO_MIN_POOL_SIZE,
            serverSelectionTimeoutMS=settings.MONGO_TIMEOUT_MS
        )
        # Verify connection
        await db.client.admin.command('ping')
        logger.info("Connected to MongoDB.")
    except Exception as e:
        logger.error(f"Could not connect to MongoDB: {e}")
        raise

async def close_mongo_connection():
    """
    Close MongoDB connection.
    To be called during app shutdown.
    """
    if db.client:
        db.client.close()
        db.client = None
        logger.info("MongoDB connection closed.")
