"""
Testes de Integração - Router de Respostas
/api/v1/respostas

Testa:
- Submissão de respostas (usuário ativo)
- Validação de questionário inexistente
- Validação de dados inválidos
"""
import pytest
from fastapi.testclient import TestClient
from unittest.mock import patch, AsyncMock, MagicMock
from app.main import app
from app.api.deps import get_current_active_user

client = TestClient(app)


# ============================================================
# Testes de Submissão de Respostas
# ============================================================

def test_submit_respostas_valid(mock_user):
    """Usuário pode submeter respostas válidas."""
    async def override():
        return mock_user
    
    app.dependency_overrides[get_current_active_user] = override
    
    with patch('app.api.v1.respostas.QuestionariosRepo') as MockQRepo, \
         patch('app.api.v1.respostas.RespostasRepo') as MockRRepo, \
         patch('app.api.v1.respostas.calculate_diagnostico') as mock_diag:
        
        mock_q_repo = MockQRepo.return_value
        mock_q_repo.get_by_id = AsyncMock(return_value={"_id": "q123", "nome": "Test"})
        
        mock_r_repo = MockRRepo.return_value
        mock_r_repo.save_all_answers = AsyncMock(return_value=True)
        mock_diag.delay.return_value.id = "task-123"
        
        response = client.post(
            "/api/v1/respostas/",
            json={
                "anonId": "anon123",
                "idQuestionario": "q123",
                "respostas": [
                    {"idPergunta": "P01", "valor": 3},
                    {"idPergunta": "P02", "valor": 2},
                ]
            }
        )
        
        assert response.status_code == 201
        assert "sucesso" in response.json()["message"].lower()
    
    app.dependency_overrides.clear()


def test_submit_respostas_invalid_questionario(mock_user):
    """Retorna 404 quando questionário não existe."""
    async def override():
        return mock_user
    
    app.dependency_overrides[get_current_active_user] = override
    
    with patch('app.api.v1.respostas.QuestionariosRepo') as MockRepo:
        mock_repo = MockRepo.return_value
        mock_repo.get_by_id = AsyncMock(return_value=None)
        
        response = client.post(
            "/api/v1/respostas/",
            json={
                "anonId": "anon123",
                "idQuestionario": "id_inexistente",
                "respostas": [{"idPergunta": "P01", "valor": 3}]
            }
        )
        
        assert response.status_code == 404
        assert "not found" in response.json()["detail"].lower()
    
    app.dependency_overrides.clear()


def test_submit_respostas_validation_error(mock_user):
    """Retorna 422 para dados inválidos."""
    async def override():
        return mock_user
    
    app.dependency_overrides[get_current_active_user] = override
    
    # Missing required fields
    response = client.post(
        "/api/v1/respostas/",
        json={"anonId": "anon123"}  # Missing idQuestionario and respostas
    )
    
    assert response.status_code == 422
    
    app.dependency_overrides.clear()


def test_submit_respostas_invalid_valor_range(mock_user):
    """Valor fora do range (0-4) deve falhar validação."""
    async def override():
        return mock_user
    
    app.dependency_overrides[get_current_active_user] = override
    
    response = client.post(
        "/api/v1/respostas/",
        json={
            "anonId": "anon123",
            "idQuestionario": "q123",
            "respostas": [{"idPergunta": "P01", "valor": 10}]  # valor > 4
        }
    )
    
    assert response.status_code == 422
    
    app.dependency_overrides.clear()


def test_submit_respostas_unauthorized():
    """Acesso sem token retorna 401."""
    app.dependency_overrides.clear()
    
    response = client.post(
        "/api/v1/respostas/",
        json={
            "anonId": "anon123",
            "idQuestionario": "q123",
            "respostas": [{"idPergunta": "P01", "valor": 3}]
        }
    )
    
    assert response.status_code == 401
