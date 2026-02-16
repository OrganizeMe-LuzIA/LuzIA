import json
from contextlib import asynccontextmanager
from fastapi import FastAPI, APIRouter
from fastapi.middleware.cors import CORSMiddleware
from app.core.database import connect_to_mongo, close_mongo_connection, db
from app.api.v1 import api_router
from app.bot.endpoints import router as bot_router
from app.core.config import settings


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Connect to MongoDB
    await connect_to_mongo()
    yield
    # Shutdown: Close MongoDB connection
    await close_mongo_connection()


app = FastAPI(
    title="LuzIA - Sistema de Avaliação Psicossocial",
    description="""
API para gestão de questionários COPSOQ II, diagnósticos e relatórios.

Funcionalidades:
- Organizações e Setores
- Usuários com anonimização
- Questionários COPSOQ
- Diagnósticos por tercis
- Relatórios organizacionais/setoriais
- Dashboard executivo
""",
    version="2.1.1",
    contact={"name": "LuzIA Team", "email": "contato@luzia.example.com"},
    license_info={"name": "MIT"},
    lifespan=lifespan
)

# Configuração de CORS - Restritivo por padrão
# Em desenvolvimento: adicione http://localhost:3000 ao CORS_ORIGINS no .env
# Em produção: adicione apenas os domínios autorizados
DEFAULT_CORS_ORIGINS = [
    "http://localhost:3000",      # Frontend dev
    "http://localhost:8080",      # Alternative dev
    "http://127.0.0.1:3000",
]


def _parse_cors_origins(origins: object) -> list[str]:
    if origins is None:
        return DEFAULT_CORS_ORIGINS

    if isinstance(origins, str):
        normalized = origins.strip()
        if not normalized:
            return DEFAULT_CORS_ORIGINS
        if normalized == "*":
            return ["*"]

        # Suporte a valor JSON: ["https://a.com","https://b.com"]
        if normalized.startswith("[") and normalized.endswith("]"):
            try:
                loaded = json.loads(normalized)
                if isinstance(loaded, list):
                    parsed = [str(origin).strip().rstrip("/") for origin in loaded if str(origin).strip()]
                    return parsed or DEFAULT_CORS_ORIGINS
            except json.JSONDecodeError:
                pass

        parsed = [origin.strip().rstrip("/") for origin in normalized.split(",") if origin.strip()]
        return parsed or DEFAULT_CORS_ORIGINS

    if isinstance(origins, list):
        parsed = [str(origin).strip().rstrip("/") for origin in origins if str(origin).strip()]
        return parsed or DEFAULT_CORS_ORIGINS

    return DEFAULT_CORS_ORIGINS


CORS_ORIGINS = _parse_cors_origins(getattr(settings, "CORS_ORIGINS", None))
ALLOW_CREDENTIALS = CORS_ORIGINS != ["*"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=ALLOW_CREDENTIALS,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type", "Accept"],
    max_age=600,  # Cache preflight por 10 minutos
)

# API Router Setup
app.include_router(api_router, prefix="/api/v1")

# Bot Router (webhook Twilio - sem autenticação JWT, usa validação Twilio)
app.include_router(bot_router)

# Rotas de teste
@app.get("/")
async def root():
    return {"message": "Bem-vindo à API do LuzIA"}

def _mongo_provider(uri: str) -> str:
    normalized = (uri or "").strip().lower()
    if normalized.startswith("mongodb+srv://"):
        return "atlas"
    if "localhost" in normalized or "127.0.0.1" in normalized or "mongo:27017" in normalized:
        return "local"
    return "custom"

@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "mongo": "connected" if db.connected else "disconnected",
        "mongo_provider": _mongo_provider(settings.MONGO_URI),
    }
