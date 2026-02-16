import pytest
from app.repositories.usuarios import UsuariosRepo
from app.models.base import Usuario, Questionario, Pergunta
from pydantic import ValidationError
from datetime import datetime

# --- Testes de Unidade: Validação de Modelos (Pydantic) ---

def test_usuario_model_valid():
    """Testa a criação de um modelo de Usuário válido."""
    user_data = {
        "telefone": "+5511999999999",
        "idOrganizacao": "507f1f77bcf86cd799439011", # ObjectId fictício
        "anonId": "anon123",
        "status": "em andamento"
    }
    user = Usuario(**user_data)
    assert user.telefone == user_data["telefone"]
    assert user.status == "em andamento"
    assert user.respondido is False # Default

def test_usuario_model_legacy_status_alias():
    """Status legados devem ser normalizados para os novos valores canônicos."""
    user_data = {
        "telefone": "+5511999999998",
        "idOrganizacao": "507f1f77bcf86cd799439011",
        "anonId": "anon_legacy_status",
        "status": "ativo",
    }
    user = Usuario(**user_data)
    assert user.status == "em andamento"

def test_usuario_model_invalid_status():
    """Testa falha ao usar status inválido (embora Pydantic por padrão aceite string, vamos checar se o enum deveria ser forçado se fosse strict)."""
    # Nota: No base.py atual, 'status' é str, não Enum, então isso passaria a menos que mudemos o model.
    # O teste serve para validar o comportamento ATUAL.
    user_data = {
        "telefone": "+5511999999999",
        "idOrganizacao": "507f1f77bcf86cd799439011",
        "anonId": "anon123",
        "status": "status_que_nao_existe"
    }
    # Agora esperamos ValidationError devido a validacao estrita do enum
    with pytest.raises(ValidationError):
        Usuario(**user_data)

def test_questionario_model_validation():
    """Testa validação básica de questionário."""
    q_data = {
        "nome": "Q1",
        "versao": "1.0",
        "descricao": "Teste",
        "dominios": ["D1"],
        "escala": "likert",
        "totalPerguntas": 10
    }
    q = Questionario(**q_data)
    assert q.ativo is True

# --- Testes de Integração: Repositório (Usa Fixture test_db) ---

@pytest.mark.asyncio
async def test_repo_create_user(test_db):
    """Testa criar um usuário no banco de teste."""
    repo = UsuariosRepo()
    # Injeta o banco de teste no repositório (mock ou override dependency se necessário)
    # Como UsuariosRepo usa get_db(), e get_db() usa a global db.client, 
    # o fixture test_db em conftest.py já deve ter configurado o db.client ou precisamos garantir que ele aponte para o teste.
    
    # IMPORTANTE: O fixture 'test_db' do conftest configura o db.client.
    
    user_data = {
        "telefone": "+5511888888888",
        "idOrganizacao": "507f1f77bcf86cd799439011",
        "anonId": "anon_test_1"
    }
    
    user_id = await repo.create_user(user_data)
    assert isinstance(user_id, str)
    assert len(user_id) > 0

    # Verifica se salvou
    saved_user = await repo.find_by_phone("+5511888888888")
    assert saved_user is not None
    assert saved_user["anonId"] == "anon_test_1"
    assert saved_user["status"] == "não iniciado" # Default do Repo

@pytest.mark.asyncio
async def test_repo_find_by_anon_id(test_db):
    """Testa busca por ID anônimo."""
    repo = UsuariosRepo()
    user_data = {
        "telefone": "+5511777777777",
        "idOrganizacao": "507f1f77bcf86cd799439011",
        "anonId": "anon_unique_99"
    }
    await repo.create_user(user_data)
    
    found = await repo.find_by_anon_id("anon_unique_99")
    assert found is not None
    assert found["telefone"] == "+5511777777777"

@pytest.mark.asyncio
async def test_repo_update_status(test_db):
    """Testa atualização de status."""
    repo = UsuariosRepo()
    phone = "+5511666666666"
    user_data = {
        "telefone": phone,
        "idOrganizacao": "507f1f77bcf86cd799439011",
        "anonId": "anon_status_test"
    }
    await repo.create_user(user_data)
    
    success = await repo.update_status(phone, "em andamento")
    assert success is True
    
    updated = await repo.find_by_phone(phone)
    assert updated["status"] == "em andamento"
    assert "ultimoAcesso" in updated
