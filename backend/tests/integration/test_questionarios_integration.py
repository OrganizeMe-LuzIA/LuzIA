"""
Testes de Integração - Router de Questionários
/api/v1/questionarios

Testa:
- Listagem de questionários (usuário ativo)
- Busca por ID
- Listagem de perguntas de um questionário
- Tratamento de 404
"""
import pytest
from fastapi.testclient import TestClient
from unittest.mock import patch, AsyncMock
from app.main import app
from app.api.deps import get_current_active_user

client = TestClient(app)


# ============================================================
# Testes de Listagem de Questionários
# ============================================================

def test_list_questionarios_authenticated(mock_user):
    """Usuário autenticado pode listar questionários."""
    async def override():
        return mock_user
    
    app.dependency_overrides[get_current_active_user] = override
    
    with patch('app.api.v1.questionarios.QuestionariosRepo') as MockRepo:
        mock_repo = MockRepo.return_value
        mock_repo.list_questionnaires = AsyncMock(return_value=[
            {"_id": "q1", "nome": "CoPsoQ II", "versao": "1.0", "ativo": True},
            {"_id": "q2", "nome": "Outro", "versao": "2.0", "ativo": True},
        ])
        
        response = client.get("/api/v1/questionarios/")
        
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        assert len(data) == 2
        assert data[0]["id"] == "q1"
        assert data[0]["nome"] == "CoPsoQ II"
    
    app.dependency_overrides.clear()


def test_list_questionarios_empty(mock_user):
    """Lista vazia quando não há questionários."""
    async def override():
        return mock_user
    
    app.dependency_overrides[get_current_active_user] = override
    
    with patch('app.api.v1.questionarios.QuestionariosRepo') as MockRepo:
        mock_repo = MockRepo.return_value
        mock_repo.list_questionnaires = AsyncMock(return_value=[])
        
        response = client.get("/api/v1/questionarios/")
        
        assert response.status_code == 200
        assert response.json() == []
    
    app.dependency_overrides.clear()


def test_list_questionarios_unauthorized():
    """Acesso sem token retorna 401."""
    app.dependency_overrides.clear()
    
    response = client.get("/api/v1/questionarios/")
    
    assert response.status_code == 401


# ============================================================
# Testes de Busca por ID
# ============================================================

def test_get_questionario_success(mock_user):
    """Busca questionário existente por ID."""
    async def override():
        return mock_user
    
    app.dependency_overrides[get_current_active_user] = override
    
    with patch('app.api.v1.questionarios.QuestionariosRepo') as MockRepo:
        mock_repo = MockRepo.return_value
        mock_repo.get_by_id = AsyncMock(return_value={
            "_id": "q123",
            "nome": "CoPsoQ II",
            "versao": "1.0",
            "dominios": ["D1", "D2"],
            "ativo": True
        })
        
        response = client.get("/api/v1/questionarios/q123")
        
        assert response.status_code == 200
        data = response.json()
        assert data["id"] == "q123"
        assert data["nome"] == "CoPsoQ II"
    
    app.dependency_overrides.clear()


def test_get_questionario_not_found(mock_user):
    """Retorna 404 quando questionário não existe."""
    async def override():
        return mock_user
    
    app.dependency_overrides[get_current_active_user] = override
    
    with patch('app.api.v1.questionarios.QuestionariosRepo') as MockRepo:
        mock_repo = MockRepo.return_value
        mock_repo.get_by_id = AsyncMock(return_value=None)
        
        response = client.get("/api/v1/questionarios/id_inexistente")
        
        assert response.status_code == 404
        assert "não encontrado" in response.json()["detail"]
    
    app.dependency_overrides.clear()


# ============================================================
# Testes de Perguntas do Questionário
# ============================================================

def test_list_perguntas_success(mock_user):
    """Lista perguntas de um questionário existente."""
    async def override():
        return mock_user
    
    app.dependency_overrides[get_current_active_user] = override
    
    with patch('app.api.v1.questionarios.QuestionariosRepo') as MockQRepo, \
         patch('app.api.v1.questionarios.PerguntasRepo') as MockPRepo:
        
        mock_q_repo = MockQRepo.return_value
        mock_q_repo.get_by_id = AsyncMock(return_value={"_id": "q123", "nome": "Test"})
        
        mock_p_repo = MockPRepo.return_value
        mock_p_repo.get_questions = AsyncMock(return_value=[
            {"_id": "p1", "idQuestionario": "q123", "idPergunta": "P01", "texto": "Pergunta 1"},
            {"_id": "p2", "idQuestionario": "q123", "idPergunta": "P02", "texto": "Pergunta 2"},
        ])
        
        response = client.get("/api/v1/questionarios/q123/perguntas")
        
        assert response.status_code == 200
        data = response.json()
        assert len(data) == 2
        assert data[0]["idPergunta"] == "P01"
    
    app.dependency_overrides.clear()


def test_list_perguntas_questionario_not_found(mock_user):
    """Retorna 404 quando questionário não existe ao buscar perguntas."""
    async def override():
        return mock_user
    
    app.dependency_overrides[get_current_active_user] = override
    
    with patch('app.api.v1.questionarios.QuestionariosRepo') as MockRepo:
        mock_repo = MockRepo.return_value
        mock_repo.get_by_id = AsyncMock(return_value=None)
        
        response = client.get("/api/v1/questionarios/id_inexistente/perguntas")
        
        assert response.status_code == 404
        assert "não encontrado" in response.json()["detail"]
    
    app.dependency_overrides.clear()
