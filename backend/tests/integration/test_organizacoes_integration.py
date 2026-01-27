"""
Testes de Integração - Router de Organizações
/api/v1/organizacoes

Testa:
- Criação de organizações (admin only)
- Listagem de organizações (admin only)
- Busca por ID
- Validações de permissão (403 para não-admin)
"""
import pytest
from fastapi.testclient import TestClient
from unittest.mock import patch, AsyncMock
from app.main import app
from app.models.base import Usuario
from app.routers.deps import get_current_active_user, get_current_admin_user

client = TestClient(app)


# ============================================================
# Fixtures locais com override de dependências
# ============================================================

@pytest.fixture
def override_admin_user(mock_admin_user):
    """Override dependency to return admin user."""
    async def _override():
        return mock_admin_user
    return _override

@pytest.fixture
def override_regular_user(mock_user):
    """Override dependency to return regular user."""
    async def _override():
        return mock_user
    return _override


# ============================================================
# Testes de Criação de Organização
# ============================================================

def test_create_organization_as_admin(mock_admin_user):
    """Admin pode criar uma organização."""
    async def override():
        return mock_admin_user
    
    app.dependency_overrides[get_current_admin_user] = override
    
    with patch('app.routers.organizacoes.OrganizacoesRepo') as MockRepo:
        mock_repo = MockRepo.return_value
        mock_repo.find_by_cnpj = AsyncMock(return_value=None)
        mock_repo.create_organization = AsyncMock(return_value="new_org_id_123")
        
        response = client.post(
            "/api/v1/organizacoes/",
            json={"cnpj": "12.345.678/0001-99", "nome": "Empresa Teste"}
        )
        
        assert response.status_code == 201
        data = response.json()
        assert data["id"] == "new_org_id_123"
        assert "message" in data
    
    app.dependency_overrides.clear()


def test_create_organization_duplicate_cnpj(mock_admin_user):
    """Deve retornar 400 quando CNPJ já existe."""
    async def override():
        return mock_admin_user
    
    app.dependency_overrides[get_current_admin_user] = override
    
    with patch('app.routers.organizacoes.OrganizacoesRepo') as MockRepo:
        mock_repo = MockRepo.return_value
        mock_repo.find_by_cnpj = AsyncMock(return_value={"cnpj": "12.345.678/0001-99", "nome": "Existente"})
        
        response = client.post(
            "/api/v1/organizacoes/",
            json={"cnpj": "12.345.678/0001-99", "nome": "Duplicada"}
        )
        
        assert response.status_code == 400
        assert "CNPJ já existe" in response.json()["detail"]
    
    app.dependency_overrides.clear()


def test_create_organization_as_user_forbidden(mock_user):
    """Usuário comum não pode criar organização (403)."""
    async def override():
        return mock_user
    
    # Override get_current_active_user but NOT get_current_admin_user
    # This simulates a user that passes active check but fails admin check
    app.dependency_overrides[get_current_active_user] = override
    
    # Remove any admin override to let the real check run
    if get_current_admin_user in app.dependency_overrides:
        del app.dependency_overrides[get_current_admin_user]
    
    response = client.post(
        "/api/v1/organizacoes/",
        json={"cnpj": "12.345.678/0001-99", "nome": "Empresa Teste"}
    )
    
    # Should be 403 Forbidden (admin check fails) or 401 if token validation runs
    assert response.status_code in [401, 403]
    
    app.dependency_overrides.clear()


# ============================================================
# Testes de Listagem
# ============================================================

def test_list_organizations_as_admin(mock_admin_user):
    """Admin pode listar organizações."""
    async def override():
        return mock_admin_user
    
    app.dependency_overrides[get_current_admin_user] = override
    
    with patch('app.routers.organizacoes.OrganizacoesRepo') as MockRepo:
        mock_repo = MockRepo.return_value
        mock_repo.list_organizations = AsyncMock(return_value=[
            {"_id": "org1", "cnpj": "11.111.111/0001-11", "nome": "Org 1"},
            {"_id": "org2", "cnpj": "22.222.222/0001-22", "nome": "Org 2"},
        ])
        
        response = client.get("/api/v1/organizacoes/")
        
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        assert len(data) == 2
        assert data[0]["id"] == "org1"
    
    app.dependency_overrides.clear()


# ============================================================
# Testes de Busca por ID
# ============================================================

def test_get_organization_success(mock_admin_user):
    """Busca organização existente por ID."""
    async def override():
        return mock_admin_user
    
    app.dependency_overrides[get_current_admin_user] = override
    
    with patch('app.routers.organizacoes.OrganizacoesRepo') as MockRepo:
        mock_repo = MockRepo.return_value
        mock_repo.get_organization = AsyncMock(return_value={
            "_id": "org123",
            "cnpj": "33.333.333/0001-33",
            "nome": "Org Encontrada"
        })
        
        response = client.get("/api/v1/organizacoes/org123")
        
        assert response.status_code == 200
        data = response.json()
        assert data["id"] == "org123"
        assert data["nome"] == "Org Encontrada"
    
    app.dependency_overrides.clear()


def test_get_organization_not_found(mock_admin_user):
    """Retorna 404 quando organização não existe."""
    async def override():
        return mock_admin_user
    
    app.dependency_overrides[get_current_admin_user] = override
    
    with patch('app.routers.organizacoes.OrganizacoesRepo') as MockRepo:
        mock_repo = MockRepo.return_value
        mock_repo.get_organization = AsyncMock(return_value=None)
        
        response = client.get("/api/v1/organizacoes/id_inexistente")
        
        assert response.status_code == 404
        assert "não encontrada" in response.json()["detail"]
    
    app.dependency_overrides.clear()


# ============================================================
# Testes de Validação de Input
# ============================================================

def test_create_organization_missing_fields(mock_admin_user):
    """Deve retornar 422 quando campos obrigatórios faltam."""
    async def override():
        return mock_admin_user
    
    app.dependency_overrides[get_current_admin_user] = override
    
    response = client.post(
        "/api/v1/organizacoes/",
        json={"cnpj": "12.345.678/0001-99"}  # Falta 'nome'
    )
    
    assert response.status_code == 422
    
    app.dependency_overrides.clear()
