from __future__ import annotations

import asyncio
import logging
from datetime import datetime, timezone
from typing import Any, Optional

from app.core.cache import cache
from app.core.config import get_settings
from app.models.dashboard import TwilioSaldo

logger = logging.getLogger(__name__)


class TwilioAccountService:
    """Consulta dados operacionais da conta Twilio usados no dashboard."""

    CACHE_KEY_PREFIX = "dashboard:twilio:saldo"
    CACHE_TTL_SECONDS = 60

    def __init__(self, client: Any = None):
        self.settings = get_settings()
        self._client = client

    def _is_configured(self) -> bool:
        return bool(self.settings.TWILIO_ACCOUNT_SID and self.settings.TWILIO_AUTH_TOKEN)

    def _cache_key(self) -> str:
        account_sid = (self.settings.TWILIO_ACCOUNT_SID or "nao_configurado").strip() or "nao_configurado"
        return f"{self.CACHE_KEY_PREFIX}:{account_sid}"

    def _build_result(
        self,
        *,
        configurado: bool,
        disponivel: bool,
        saldo: Optional[str] = None,
        moeda: Optional[str] = None,
        erro: Optional[str] = None,
    ) -> TwilioSaldo:
        return TwilioSaldo(
            configurado=configurado,
            disponivel=disponivel,
            saldo=saldo,
            moeda=moeda,
            erro=erro,
            ultima_atualizacao=datetime.now(timezone.utc),
        )

    def _get_client(self) -> tuple[Any | None, Optional[str]]:
        if self._client is not None:
            return self._client, None

        if not self._is_configured():
            return None, "Twilio não configurado."

        try:
            from twilio.rest import Client

            self._client = Client(self.settings.TWILIO_ACCOUNT_SID, self.settings.TWILIO_AUTH_TOKEN)
            return self._client, None
        except Exception as exc:
            logger.warning("Falha ao inicializar cliente Twilio para consulta de saldo: %s", exc)
            return None, "Não foi possível inicializar o cliente do Twilio."

    async def get_balance(self) -> TwilioSaldo:
        cached = await cache.get(self._cache_key())
        if cached:
            return TwilioSaldo(**cached)

        result = await self._fetch_balance()
        await cache.set(self._cache_key(), result.model_dump(), ttl=self.CACHE_TTL_SECONDS)
        return result

    async def _fetch_balance(self) -> TwilioSaldo:
        if not self._is_configured():
            return self._build_result(
                configurado=False,
                disponivel=False,
                erro="Twilio não configurado.",
            )

        client, client_error = self._get_client()
        if client is None:
            return self._build_result(
                configurado=True,
                disponivel=False,
                erro=client_error or "Não foi possível inicializar o cliente do Twilio.",
            )

        try:
            balance = await asyncio.to_thread(client.api.v2010.balance.fetch)
        except Exception as exc:
            logger.warning("Falha ao consultar saldo do Twilio: %s", exc)
            return self._build_result(
                configurado=True,
                disponivel=False,
                erro="Não foi possível consultar o saldo do Twilio.",
            )

        saldo = str(getattr(balance, "balance", "") or "").strip() or None
        moeda = str(getattr(balance, "currency", "") or "").strip() or None

        if not saldo or not moeda:
            return self._build_result(
                configurado=True,
                disponivel=False,
                saldo=saldo,
                moeda=moeda,
                erro="O Twilio não retornou um saldo utilizável.",
            )

        return self._build_result(
            configurado=True,
            disponivel=True,
            saldo=saldo,
            moeda=moeda,
        )
