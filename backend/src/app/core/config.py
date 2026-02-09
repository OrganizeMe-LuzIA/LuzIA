from pydantic_settings import BaseSettings
from functools import lru_cache
import os
from dotenv import load_dotenv

# Carrega as variáveis de ambiente do arquivo .env
load_dotenv()

class Settings(BaseSettings):
    # Configurações da API
    API_V1_STR: str = "/api/v1"
    PROJECT_NAME: str = "LuzIA Backend"
    
    # Configurações do MongoDB
    MONGO_URI: str = os.getenv("MONGO_URI", "mongodb://localhost:27017")
    MONGO_DB_NAME: str = os.getenv("MONGO_DB_NAME", "LuzIA")
    MONGO_MAX_POOL_SIZE: int = int(os.getenv("MONGO_MAX_POOL_SIZE", "100"))
    MONGO_MIN_POOL_SIZE: int = int(os.getenv("MONGO_MIN_POOL_SIZE", "10"))
    MONGO_TIMEOUT_MS: int = int(os.getenv("MONGO_TIMEOUT_MS", "5000"))
    
    # Configurações de Segurança
    SECRET_KEY: str = os.getenv("SECRET_KEY", "your-secret-key-here")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 8  # 8 dias
    
    # Configurações do Twilio (WhatsApp)
    TWILIO_ACCOUNT_SID: str = os.getenv("TWILIO_ACCOUNT_SID", "")
    TWILIO_AUTH_TOKEN: str = os.getenv("TWILIO_AUTH_TOKEN", "")
    TWILIO_WHATSAPP_NUMBER: str = os.getenv("TWILIO_WHATSAPP_NUMBER", "")
    TWILIO_WHATSAPP_FROM: str = os.getenv("TWILIO_WHATSAPP_FROM", "")
    TWILIO_MESSAGING_SERVICE_SID: str = os.getenv("TWILIO_MESSAGING_SERVICE_SID", "")
    TWILIO_VALIDATE_SIGNATURE: bool = os.getenv("TWILIO_VALIDATE_SIGNATURE", "false").lower() == "true"
    TWILIO_TEMPLATE_FREQUENCIA: str = os.getenv("TWILIO_TEMPLATE_FREQUENCIA", "")
    TWILIO_TEMPLATE_INTENSIDADE: str = os.getenv("TWILIO_TEMPLATE_INTENSIDADE", "")
    TWILIO_TEMPLATE_SATISFACAO: str = os.getenv("TWILIO_TEMPLATE_SATISFACAO", "")
    TWILIO_TEMPLATE_CONFLITO_TF: str = os.getenv("TWILIO_TEMPLATE_CONFLITO_TF", "")
    TWILIO_TEMPLATE_SAUDE_GERAL: str = os.getenv("TWILIO_TEMPLATE_SAUDE_GERAL", "")
    TWILIO_TEMPLATE_COMPORTAMENTO_OFENSIVO: str = os.getenv("TWILIO_TEMPLATE_COMPORTAMENTO_OFENSIVO", "")

    # Configurações Celery
    REDIS_URL: str = os.getenv("REDIS_URL", "redis://localhost:6379")
    CACHE_TTL: int = int(os.getenv("CACHE_TTL", "300"))
    CELERY_BROKER_URL: str = os.getenv("CELERY_BROKER_URL", f"{REDIS_URL}/0")
    CELERY_RESULT_BACKEND: str = os.getenv("CELERY_RESULT_BACKEND", f"{REDIS_URL}/1")
    
    class Config:
        case_sensitive = True

@lru_cache()
def get_settings() -> Settings:
    return Settings()

# Instância de configurações globais
settings = get_settings()
