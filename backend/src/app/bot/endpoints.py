from fastapi import APIRouter, Request, Depends, HTTPException
from fastapi.responses import PlainTextResponse
from pydantic import BaseModel
from twilio.twiml.messaging_response import MessagingResponse
from twilio.request_validator import RequestValidator
from app.bot.flow import BotFlow
from app.core.config import get_settings, Settings

router = APIRouter(prefix="/bot", tags=["bot"])

bot_flow = BotFlow()


class DevIncoming(BaseModel):
    phone: str
    text: str


@router.post("/dev/incoming")
async def dev_incoming(payload: DevIncoming):
    """Endpoint de desenvolvimento para testar o bot via JSON (sem Twilio)."""
    reply = await bot_flow.handle_incoming(payload.phone, payload.text)
    return {"reply": reply}


def _validate_twilio_signature(request: Request, settings: Settings) -> None:
    """Valida a assinatura do Twilio para evitar spoofing (produção)."""
    # Note: TWILIO_VALIDATE_SIGNATURE might be in settings, check config.py
    # If not present in Settings model, we might need to add it or ignore.
    # Assuming it exists or using getattr.
    validate = getattr(settings, "TWILIO_VALIDATE_SIGNATURE", False)
    if not validate:
        return
    if not settings.TWILIO_AUTH_TOKEN:
        raise HTTPException(status_code=500, detail="TWILIO_AUTH_TOKEN não configurado para validação de assinatura.")

    # O Twilio assina o URL completo + parâmetros do form
    signature = request.headers.get("X-Twilio-Signature", "")
    validator = RequestValidator(settings.TWILIO_AUTH_TOKEN)

    # Precisamos do URL completo. FastAPI monta em request.url.
    url = str(request.url)



@router.post("/twilio/whatsapp", response_class=PlainTextResponse)
async def twilio_whatsapp_webhook(request: Request, settings: Settings = Depends(get_settings)):
    """Webhook do Twilio para WhatsApp.

    O Twilio envia os campos (form-encoded) como:
      - From: 'whatsapp:+55...'
      - Body: texto da mensagem
    Retornamos TwiML XML com a resposta do bot.
    """
    import logging
    logger = logging.getLogger(__name__)
    
    form = await request.form()
    from_ = str(form.get("From", "")).strip()
    body = str(form.get("Body", "")).strip()
    list_id = str(form.get("ListId", "")).strip()
    list_title = str(form.get("ListTitle", "")).strip()
    button_payload_raw = str(form.get("ButtonPayload", "")).strip()
    button_text = str(form.get("ButtonText", "")).strip()

    logger.info(f"[TWILIO] From={from_} Body='{body}' ListId={list_id}")

    if not from_:
        raise HTTPException(status_code=400, detail="Campo 'From' ausente.")
    if body is None:
        body = ""

    # Validate signature if enabled
    validate = getattr(settings, "TWILIO_VALIDATE_SIGNATURE", False)
    if validate:
        signature = request.headers.get("X-Twilio-Signature", "")
        validator = RequestValidator(settings.TWILIO_AUTH_TOKEN)
        url = str(request.url)
        params = {k: str(v) for k, v in form.items()}
        if not validator.validate(url, params, signature):
            raise HTTPException(status_code=403, detail="Assinatura do Twilio inválida.")

    # Normaliza o numero
    phone = from_.replace("whatsapp:", "")
    button_payload = None
    if list_id:
        button_payload = {"listId": list_id, "body": list_title or body}
    elif button_payload_raw:
        button_payload = {"buttonPayload": button_payload_raw, "body": button_text or body}

    reply = await bot_flow.handle_incoming(
        phone=phone,
        incoming_text=body,
        button_payload=button_payload,
        send_interactive=True,
    )

    logger.info(f"[TWILIO] Reply length={len(reply)} first_50={reply[:50] if reply else 'EMPTY'}")

    resp = MessagingResponse()
    if reply:
        resp.message(reply)
    return PlainTextResponse(str(resp), media_type="application/xml")

