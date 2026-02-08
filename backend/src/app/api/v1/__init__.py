# API v1 routers
from fastapi import APIRouter

from . import auth, dashboard, diagnosticos, organizacoes, questionarios, relatorios, respostas

api_router = APIRouter()

api_router.include_router(auth.router, tags=["auth"])
api_router.include_router(organizacoes.router, tags=["organizacoes"])
api_router.include_router(questionarios.router, tags=["questionarios"])
api_router.include_router(respostas.router, tags=["respostas"])
api_router.include_router(diagnosticos.router, tags=["diagnosticos"])
api_router.include_router(relatorios.router, tags=["relatorios"])
api_router.include_router(dashboard.router, tags=["dashboard"])
