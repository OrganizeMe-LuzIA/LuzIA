"""
Módulo de repositórios para acesso ao MongoDB.
"""
from app.repositories.base_repository import BaseRepository
from app.repositories.organizacoes import OrganizacoesRepo
from app.repositories.setores import SetoresRepo
from app.repositories.usuarios import UsuariosRepo
from app.repositories.questionarios import QuestionariosRepo
from app.repositories.perguntas import PerguntasRepo
from app.repositories.respostas import RespostasRepo
from app.repositories.diagnosticos import DiagnosticosRepo
from app.repositories.relatorios import RelatoriosRepo

__all__ = [
    "BaseRepository",
    "OrganizacoesRepo",
    "SetoresRepo",
    "UsuariosRepo",
    "QuestionariosRepo",
    "PerguntasRepo",
    "RespostasRepo",
    "DiagnosticosRepo",
    "RelatoriosRepo",
]
