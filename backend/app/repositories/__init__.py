"""
Módulo de repositórios para acesso ao MongoDB.
"""
from app.repositories.organizacoes import OrganizacoesRepo
from app.repositories.setores import SetoresRepo
from app.repositories.usuarios import UsuariosRepo
from app.repositories.questionarios import QuestionariosRepo, PerguntasRepo
from app.repositories.respostas import RespostasRepo
from app.repositories.diagnosticos import DiagnosticosRepo
from app.repositories.relatorios import RelatoriosRepo

__all__ = [
    "OrganizacoesRepo",
    "SetoresRepo",
    "UsuariosRepo",
    "QuestionariosRepo",
    "PerguntasRepo",
    "RespostasRepo",
    "DiagnosticosRepo",
    "RelatoriosRepo",
]
