# API v1 routers
from fastapi import APIRouter

from . import auth, diagnosticos, organizacoes, questionarios, relatorios, respostas

api_router = APIRouter()

api_router.include_router(auth.router, prefix="/auth", tags=["auth"])
api_router.include_router(organizacoes.router, prefix="/organizacoes", tags=["organizacoes"])
api_router.include_router(questionarios.router, prefix="/questionarios", tags=["questionarios"])
api_router.include_router(respostas.router, prefix="/respostas", tags=["respostas"])
api_router.include_router(diagnosticos.router, prefix="/diagnosticos", tags=["diagnosticos"])
api_router.include_router(relatorios.router, prefix="/relatorios", tags=["relatorios"])
