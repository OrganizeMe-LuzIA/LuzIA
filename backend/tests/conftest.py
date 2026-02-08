import pytest
from motor.motor_asyncio import AsyncIOMotorClient
from app.core.config import settings
from app.core.database import db
from httpx import AsyncClient, ASGITransport
from app.main import app
from app.models.base import Usuario, StatusEnum
from app.core.security import create_access_token
from datetime import timedelta

@pytest.fixture
async def test_db():
    """
    Fixture for the test database.
    Uses a separate database name for testing to avoid data loss.
    """
    test_db_name = f"{settings.MONGO_DB_NAME}_test"
    original_db_name = settings.MONGO_DB_NAME

    client = AsyncIOMotorClient(settings.MONGO_URI)
    db.client = client
    settings.MONGO_DB_NAME = test_db_name
    database = client[test_db_name]
    yield database

    # Cleanup isolado por teste para evitar vazamento de estado e loop fechado.
    await client.drop_database(test_db_name)
    client.close()
    settings.MONGO_DB_NAME = original_db_name
    if db.client is client:
        db.client = None

@pytest.fixture(scope="session")
async def test_client():
    """
    Test client for FastAPI app.
    This will trigger the lifespan events (startup/shutdown).
    """
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac

# ============================================================
# Authentication Fixtures
# ============================================================

@pytest.fixture
def mock_user_data():
    """Returns mock user data for testing."""
    return {
        "telefone": "+5511999990001",
        "idOrganizacao": "507f1f77bcf86cd799439011",
        "idSetor": None,
        "status": "ativo",
        "respondido": False,
        "anonId": "test_anon_user_001",
        "metadata": {}
    }

@pytest.fixture
def mock_admin_data():
    """Returns mock admin user data for testing."""
    return {
        "telefone": "+5511999990000",
        "idOrganizacao": "507f1f77bcf86cd799439011",
        "idSetor": None,
        "status": "ativo",
        "respondido": False,
        "anonId": "test_anon_admin_001",
        "metadata": {"is_admin": True}
    }

@pytest.fixture
def mock_user(mock_user_data) -> Usuario:
    """Returns a Usuario instance for a regular active user."""
    return Usuario(**mock_user_data)

@pytest.fixture
def mock_admin_user(mock_admin_data) -> Usuario:
    """Returns a Usuario instance for an admin user."""
    return Usuario(**mock_admin_data)

@pytest.fixture
def auth_token(mock_user_data) -> str:
    """Creates a valid JWT token for a regular user."""
    return create_access_token(
        data={"sub": mock_user_data["telefone"]},
        expires_delta=timedelta(minutes=30)
    )

@pytest.fixture
def admin_token(mock_admin_data) -> str:
    """Creates a valid JWT token for an admin user."""
    return create_access_token(
        data={"sub": mock_admin_data["telefone"]},
        expires_delta=timedelta(minutes=30)
    )

@pytest.fixture
def auth_headers(auth_token) -> dict:
    """Returns authorization headers for a regular user."""
    return {"Authorization": f"Bearer {auth_token}"}

@pytest.fixture
def admin_headers(admin_token) -> dict:
    """Returns authorization headers for an admin user."""
    return {"Authorization": f"Bearer {admin_token}"}
