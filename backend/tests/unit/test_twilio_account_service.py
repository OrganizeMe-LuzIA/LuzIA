import pytest

from app.services.twilio_account_service import TwilioAccountService


class _FakeBalance:
    balance = "42.10"
    currency = "USD"


class _FakeBalanceResource:
    def fetch(self):
        return _FakeBalance()


class _FakeFailingBalanceResource:
    def fetch(self):
        raise RuntimeError("boom")


class _FakeApiV2010:
    def __init__(self, balance_resource):
        self.balance = balance_resource


class _FakeApi:
    def __init__(self, balance_resource):
        self.v2010 = _FakeApiV2010(balance_resource)


class _FakeClient:
    def __init__(self, balance_resource):
        self.api = _FakeApi(balance_resource)


@pytest.mark.asyncio
async def test_get_balance_returns_not_configured_when_credentials_are_missing():
    service = TwilioAccountService(client=object())
    service.settings.TWILIO_ACCOUNT_SID = ""
    service.settings.TWILIO_AUTH_TOKEN = ""

    result = await service.get_balance()

    assert result.configurado is False
    assert result.disponivel is False
    assert result.saldo is None
    assert result.erro == "Twilio não configurado."


@pytest.mark.asyncio
async def test_get_balance_returns_payload_when_twilio_responds():
    service = TwilioAccountService(client=_FakeClient(_FakeBalanceResource()))
    service.settings.TWILIO_ACCOUNT_SID = "ACbalance-ok"
    service.settings.TWILIO_AUTH_TOKEN = "token"

    result = await service.get_balance()

    assert result.configurado is True
    assert result.disponivel is True
    assert result.saldo == "42.10"
    assert result.moeda == "USD"
    assert result.erro is None


@pytest.mark.asyncio
async def test_get_balance_returns_unavailable_when_twilio_request_fails():
    service = TwilioAccountService(client=_FakeClient(_FakeFailingBalanceResource()))
    service.settings.TWILIO_ACCOUNT_SID = "ACbalance-fail"
    service.settings.TWILIO_AUTH_TOKEN = "token"

    result = await service.get_balance()

    assert result.configurado is True
    assert result.disponivel is False
    assert result.saldo is None
    assert result.erro == "Não foi possível consultar o saldo do Twilio."
