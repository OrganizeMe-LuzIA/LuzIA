import pytest
from httpx import AsyncClient

@pytest.mark.asyncio
async def test_health_check(test_client: AsyncClient):
    """
    Test the health check endpoint to verify the app starts and connects to DB (via lifespan).
    """
    response = await test_client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "healthy"}

@pytest.mark.asyncio
async def test_db_connection(test_db):
    """
    Directly test the database connection fixture.
    """
    pong = await test_db.command("ping")
    assert pong["ok"] == 1.0
