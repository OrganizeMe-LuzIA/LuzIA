import pytest

from app.services.twilio_content_service import TwilioContentService


@pytest.mark.asyncio
async def test_criar_templates_carrega_do_settings():
    service = TwilioContentService(client=object())
    service.settings.TWILIO_TEMPLATE_FREQUENCIA = "HXFREQ"
    service.settings.TWILIO_TEMPLATE_INTENSIDADE = "HXINT"

    templates = await service.criar_content_templates()

    assert templates["frequencia"] == "HXFREQ"
    assert templates["intensidade"] == "HXINT"


def test_formatar_pergunta_com_progresso():
    texto = TwilioContentService._montar_texto_pergunta("Como você está?", 1, 41)
    assert texto == "1/41 - Como você está?"


@pytest.mark.asyncio
async def test_enviar_pergunta_interativa_fallback_texto(monkeypatch):
    service = TwilioContentService(client=None)

    async def _fake_texto(telefone: str, texto: str) -> str:
        assert telefone == "+5511999999999"
        assert "1/41 -" in texto
        assert "4 - Sempre" in texto
        return "SM123"

    monkeypatch.setattr(service, "enviar_mensagem_texto", _fake_texto)

    sid = await service.enviar_pergunta_interativa(
        telefone="+5511999999999",
        texto_pergunta="Com que frequência você se sente cansado?",
        tipo_escala="frequencia",
        opcoes=[
            {"valor": 4, "texto": "Sempre"},
            {"valor": 3, "texto": "Frequentemente"},
        ],
        numero_atual=1,
        total=41,
    )

    assert sid == "SM123"
