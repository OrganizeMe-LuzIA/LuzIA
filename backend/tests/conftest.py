import pytest
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from app.config import settings
from app.db import db
from httpx import AsyncClient
from app.main import app

@pytest.fixture(scope="session")
def event_loop():
    """Create an instance of the default event loop for each test case."""
    loop = asyncio.get_event_loop_policy().new_event_loop()
    yield loop
    loop.close()

@pytest.fixture(scope="session")
async def test_client():
    """
    Test client for FastAPI app.
    This will trigger the lifespan events (startup/shutdown).
    """
    async with AsyncClient(app=app, base_url="http://test") as ac:
        yield ac

@pytest.fixture(scope="session")
async def test_db():
    """
    Fixture for the test database.
    Uses a separate database name for testing to avoid data loss.
    """
    test_db_name = f"{settings.MONGO_DB_NAME}_test"
    
    # Ensure connection is established (if not already by lifespan)
    if db.client is None:
        db.client = AsyncIOMotorClient(settings.MONGO_URI)
    
    database = db.client[test_db_name]
    yield database
    
    # Cleanup: Drop the test database after tests
    await db.client.drop_database(test_db_name)
