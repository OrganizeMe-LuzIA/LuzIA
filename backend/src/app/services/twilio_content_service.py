from __future__ import annotations

import json
import logging
from typing import Any, Dict, List, Optional

from app.core.config import get_settings

logger = logging.getLogger(__name__)


class TwilioContentService:
    """Gerencia envio de perguntas com Content Templates e fallback em texto."""

    ESCALA_TEMPLATES: Dict[str, str] = {
        "frequencia": "TWILIO_TEMPLATE_FREQUENCIA",
        "intensidade": "TWILIO_TEMPLATE_INTENSIDADE",
        "satisfacao": "TWILIO_TEMPLATE_SATISFACAO",
        "conflito_tf": "TWILIO_TEMPLATE_CONFLITO_TF",
        "saude_geral": "TWILIO_TEMPLATE_SAUDE_GERAL",
        "comportamento_ofensivo": "TWILIO_TEMPLATE_COMPORTAMENTO_OFENSIVO",
    }

    def __init__(self, client: Any = None):
        self.settings = get_settings()
        self._client = client
        self._templates_cache: Dict[str, str] = {}

    def _get_client(self):
        if self._client is not None:
            return self._client

        if not self.settings.TWILIO_ACCOUNT_SID or not self.settings.TWILIO_AUTH_TOKEN:
            return None

        try:
            from twilio.rest import Client

            self._client = Client(self.settings.TWILIO_ACCOUNT_SID, self.settings.TWILIO_AUTH_TOKEN)
            return self._client
        except Exception as exc:
            logger.warning(f"Falha ao inicializar cliente Twilio: {exc}")
            return None

    def _normalize_to(self, phone: str) -> str:
        return phone if phone.startswith("whatsapp:") else f"whatsapp:{phone}"

    def _from_sender(self) -> str:
        sender = self.settings.TWILIO_WHATSAPP_FROM or self.settings.TWILIO_WHATSAPP_NUMBER
        if not sender:
            return ""
        return sender if sender.startswith("whatsapp:") else f"whatsapp:{sender}"

    @staticmethod
    def _montar_texto_pergunta(texto_pergunta: str, numero_atual: int, total: int) -> str:
        return f"{numero_atual}/{total} - {texto_pergunta}"

    @staticmethod
    def _montar_opcoes_texto(opcoes: List[Dict[str, Any]]) -> str:
        linhas = []
        for opcao in opcoes:
            valor = opcao.get("valor")
            texto = str(opcao.get("texto") or "").strip()
            if valor is None or not texto:
                continue
            linhas.append(f"{valor} - {texto}")
        return "\n".join(linhas)

    async def criar_content_templates(self) -> Dict[str, str]:
        """Carrega SIDs de templates já configurados em variáveis de ambiente."""

        if self._templates_cache:
            return dict(self._templates_cache)

        loaded: Dict[str, str] = {}
        for escala, env_var in self.ESCALA_TEMPLATES.items():
            sid = getattr(self.settings, env_var, "")
            if sid:
                loaded[escala] = sid

        self._templates_cache = loaded
        return dict(loaded)

    async def enviar_mensagem_texto(self, telefone: str, texto: str) -> str:
        client = self._get_client()
        if client is None:
            logger.info("Twilio não configurado; mensagem de texto não enviada externamente.")
            return ""

        params: Dict[str, Any] = {
            "to": self._normalize_to(telefone),
            "body": texto,
        }

        if self.settings.TWILIO_MESSAGING_SERVICE_SID:
            params["messaging_service_sid"] = self.settings.TWILIO_MESSAGING_SERVICE_SID
        else:
            from_ = self._from_sender()
            if not from_:
                logger.warning("TWILIO_WHATSAPP_FROM/TWILIO_WHATSAPP_NUMBER não configurado.")
                return ""
            params["from_"] = from_

        try:
            message = client.messages.create(**params)
            return str(message.sid)
        except Exception as exc:
            logger.warning(f"Falha ao enviar mensagem de texto no Twilio: {exc}")
            return ""

    async def enviar_pergunta_interativa(
        self,
        telefone: str,
        texto_pergunta: str,
        tipo_escala: str,
        opcoes: List[Dict[str, Any]],
        numero_atual: int,
        total: int,
        orientacao: str = "",
    ) -> str:
        """Envia pergunta usando Content Template.

        Returns:
            SID da mensagem se o template foi enviado com sucesso, "" caso contrário.
            Quando retorna "", o chamador deve enviar a pergunta via TwiML.
        """

        # Se há orientação, envia como mensagem de texto separada antes da pergunta
        if orientacao:
            await self.enviar_mensagem_texto(telefone, orientacao)

        templates = await self.criar_content_templates()
        content_sid = templates.get(tipo_escala)
        if not content_sid:
            return ""

        client = self._get_client()
        if not client:
            return ""

        texto_base = self._montar_texto_pergunta(texto_pergunta, numero_atual, total)
        opcoes_texto = self._montar_opcoes_texto(opcoes)

        params: Dict[str, Any] = {
            "to": self._normalize_to(telefone),
            "content_sid": content_sid,
            "content_variables": json.dumps(
                {
                    "1": texto_base,
                    "2": opcoes_texto,
                },
                ensure_ascii=False,
            ),
        }
        if self.settings.TWILIO_MESSAGING_SERVICE_SID:
            params["messaging_service_sid"] = self.settings.TWILIO_MESSAGING_SERVICE_SID
        else:
            from_ = self._from_sender()
            if from_:
                params["from_"] = from_

        try:
            message = client.messages.create(**params)
            return str(message.sid)
        except Exception as exc:
            logger.warning(f"Falha ao enviar template interativo; fallback TwiML. Erro: {exc}")
            return ""
