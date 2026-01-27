from contextlib import asynccontextmanager
from fastapi import FastAPI, APIRouter
from fastapi.middleware.cors import CORSMiddleware
from app.db import connect_to_mongo, close_mongo_connection
from app.routers import auth, organizacoes, questionarios, respostas, diagnosticos, relatorios
from app.config import settings

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Connect to MongoDB
    await connect_to_mongo()
    yield
    # Shutdown: Close MongoDB connection
    await close_mongo_connection()

app = FastAPI(
    title="LuzIA Backend",
    description="API para o sistema de questionários de saúde mental",
    version="0.1.0",
    lifespan=lifespan
)

# Configuração de CORS - Restritivo por padrão
# Em desenvolvimento: adicione http://localhost:3000 ao CORS_ORIGINS no .env
# Em produção: adicione apenas os domínios autorizados
CORS_ORIGINS = getattr(settings, 'CORS_ORIGINS', None) or [
    "http://localhost:3000",      # Frontend dev
    "http://localhost:8080",      # Alternative dev
    "http://127.0.0.1:3000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type", "Accept"],
    max_age=600,  # Cache preflight por 10 minutos
)

# API Router Setup
api_router = APIRouter()
api_router.include_router(auth.router)
api_router.include_router(organizacoes.router)
api_router.include_router(questionarios.router)
api_router.include_router(respostas.router)
api_router.include_router(diagnosticos.router)
api_router.include_router(relatorios.router)

app.include_router(api_router, prefix="/api/v1")

# Rotas de teste
@app.get("/")
async def root():
    return {"message": "Bem-vindo à API do LuzIA"}

@app.get("/health")
async def health_check():
    return {"status": "healthy"}
