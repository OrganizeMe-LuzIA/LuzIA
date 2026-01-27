"""
Testes de Integração - Router de Diagnósticos
/api/v1/diagnosticos

Testa:
- Histórico de diagnósticos do usuário
- Busca por ID específico
- Tratamento de 404
"""
import pytest
from fastapi.testclient import TestClient
from unittest.mock import patch, AsyncMock
from app.main import app
from app.routers.deps import get_current_active_user

client = TestClient(app)


# ============================================================
# Testes de Histórico de Diagnósticos
# ============================================================

def test_get_my_diagnosticos_success(mock_user):
    """Usuário pode ver seu histórico de diagnósticos."""
    async def override():
        return mock_user
    
    app.dependency_overrides[get_current_active_user] = override
    
    with patch('app.routers.diagnosticos.DiagnosticosRepo') as MockRepo:
        mock_repo = MockRepo.return_value
        mock_repo.get_by_anon_id = AsyncMock(return_value=[
            {
                "_id": "d1",
                "anonId": mock_user.anonId,
                "resultadoGlobal": "moderado",
                "pontuacaoGlobal": 2.5
            },
            {
                "_id": "d2",
                "anonId": mock_user.anonId,
                "resultadoGlobal": "baixo",
                "pontuacaoGlobal": 1.2
            }
        ])
        
        response = client.get("/api/v1/diagnosticos/me")
        
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        assert len(data) == 2
    
    app.dependency_overrides.clear()


def test_get_my_diagnosticos_empty(mock_user):
    """Retorna lista vazia quando não há diagnósticos."""
    async def override():
        return mock_user
    
    app.dependency_overrides[get_current_active_user] = override
    
    with patch('app.routers.diagnosticos.DiagnosticosRepo') as MockRepo:
        mock_repo = MockRepo.return_value
        mock_repo.get_by_anon_id = AsyncMock(return_value=[])
        
        response = client.get("/api/v1/diagnosticos/me")
        
        assert response.status_code == 200
        assert response.json() == []
    
    app.dependency_overrides.clear()


def test_get_my_diagnosticos_unauthorized():
    """Acesso sem token retorna 401."""
    app.dependency_overrides.clear()
    
    response = client.get("/api/v1/diagnosticos/me")
    
    assert response.status_code == 401


# ============================================================
# Testes de Busca por ID
# ============================================================

def test_get_diagnostico_by_id_success(mock_user):
    """Busca diagnóstico específico por ID."""
    async def override():
        return mock_user
    
    app.dependency_overrides[get_current_active_user] = override
    
    with patch('app.routers.diagnosticos.DiagnosticosRepo') as MockRepo:
        mock_repo = MockRepo.return_value
        mock_repo.get_by_id = AsyncMock(return_value={
            "_id": "diag123",
            "anonId": mock_user.anonId,
            "resultadoGlobal": "alto",
            "pontuacaoGlobal": 3.8,
            "dimensoes": []
        })
        
        response = client.get("/api/v1/diagnosticos/diag123")
        
        assert response.status_code == 200
        data = response.json()
        assert data["id"] == "diag123"
        assert data["resultadoGlobal"] == "alto"
    
    app.dependency_overrides.clear()


def test_get_diagnostico_not_found(mock_user):
    """Retorna 404 quando diagnóstico não existe."""
    async def override():
        return mock_user
    
    app.dependency_overrides[get_current_active_user] = override
    
    with patch('app.routers.diagnosticos.DiagnosticosRepo') as MockRepo:
        mock_repo = MockRepo.return_value
        mock_repo.get_by_id = AsyncMock(return_value=None)
        
        response = client.get("/api/v1/diagnosticos/id_inexistente")
        
        assert response.status_code == 404
    
    app.dependency_overrides.clear()


def test_get_diagnostico_wrong_user(mock_user):
    """Usuário não pode acessar diagnóstico de outro usuário."""
    async def override():
        return mock_user
    
    app.dependency_overrides[get_current_active_user] = override
    
    with patch('app.routers.diagnosticos.DiagnosticosRepo') as MockRepo:
        mock_repo = MockRepo.return_value
        # Return a diagnostic that belongs to a different user
        mock_repo.get_by_id = AsyncMock(return_value={
            "_id": "diag_outro",
            "anonId": "outro_usuario_anon_id",
            "resultadoGlobal": "baixo",
            "pontuacaoGlobal": 1.0
        })
        
        response = client.get("/api/v1/diagnosticos/diag_outro")
        
        # Should be 403 or 404 depending on implementation
        # If the router checks ownership, it should return 403
        # If it just returns 404 for "not found for this user", that's also valid
        assert response.status_code in [403, 404]
    
    app.dependency_overrides.clear()
