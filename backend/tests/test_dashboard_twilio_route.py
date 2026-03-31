from datetime import datetime, timezone
from unittest.mock import AsyncMock, patch

from fastapi.testclient import TestClient

from app.api.deps import get_current_admin_user
from app.main import app
from app.models.dashboard import TwilioSaldo

client = TestClient(app)


def test_get_twilio_balance_as_admin(mock_admin_user):
    async def override():
        return mock_admin_user

    app.dependency_overrides[get_current_admin_user] = override

    mock_payload = TwilioSaldo(
        configurado=True,
        disponivel=True,
        saldo="42.10",
        moeda="USD",
        erro=None,
        ultima_atualizacao=datetime.now(timezone.utc),
    )

    with patch("app.api.v1.dashboard.TwilioAccountService") as MockService:
        mock_service = MockService.return_value
        mock_service.get_balance = AsyncMock(return_value=mock_payload)

        response = client.get("/api/v1/dashboard/integracoes/twilio/saldo")

    assert response.status_code == 200
    data = response.json()
    assert data["configurado"] is True
    assert data["disponivel"] is True
    assert data["saldo"] == "42.10"
    assert data["moeda"] == "USD"

    app.dependency_overrides.clear()
