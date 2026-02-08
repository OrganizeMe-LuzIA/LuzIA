"""
Testes de Integração - Repositórios
Testa operações CRUD dos repositórios usando banco de teste.

Utiliza o fixture test_db do conftest.py para usar um banco separado
que é limpo após os testes.
"""
import pytest
from bson import ObjectId
from datetime import datetime

from app.repositories.organizacoes import OrganizacoesRepo
from app.repositories.questionarios import QuestionariosRepo, PerguntasRepo
from app.repositories.respostas import RespostasRepo
from app.repositories.diagnosticos import DiagnosticosRepo


# ============================================================
# Testes de OrganizacoesRepo
# ============================================================

@pytest.mark.asyncio
async def test_organizacoes_repo_create(test_db):
    """Testa criação de organização."""
    repo = OrganizacoesRepo()
    
    org_data = {
        "cnpj": "22.333.444/0001-81",
        "nome": "Empresa Teste Repo"
    }
    
    org_id = await repo.create_organization(org_data)
    
    assert org_id is not None
    assert isinstance(org_id, str)
    assert len(org_id) == 24  # ObjectId string length


@pytest.mark.asyncio
async def test_organizacoes_repo_find_by_cnpj(test_db):
    """Testa busca por CNPJ."""
    repo = OrganizacoesRepo()
    
    org_data = {
        "cnpj": "33.444.555/0001-81",
        "nome": "Empresa Busca CNPJ"
    }
    await repo.create_organization(org_data)
    
    found = await repo.find_by_cnpj("33.444.555/0001-81")
    
    assert found is not None
    assert found["nome"] == "Empresa Busca CNPJ"


@pytest.mark.asyncio
async def test_organizacoes_repo_find_by_cnpj_not_found(test_db):
    """Retorna None quando CNPJ não existe."""
    repo = OrganizacoesRepo()
    
    found = await repo.find_by_cnpj("99.999.999/0001-99")
    
    assert found is None


@pytest.mark.asyncio
async def test_organizacoes_repo_get_by_id(test_db):
    """Testa busca por ID."""
    repo = OrganizacoesRepo()
    
    org_data = {
        "cnpj": "44.555.666/0001-81",
        "nome": "Empresa ID"
    }
    org_id = await repo.create_organization(org_data)
    
    found = await repo.get_organization(org_id)
    
    assert found is not None
    assert found["cnpj"] == "44.555.666/0001-81"


@pytest.mark.asyncio
async def test_organizacoes_repo_get_invalid_id(test_db):
    """Retorna None para ID inválido."""
    repo = OrganizacoesRepo()
    
    found = await repo.get_organization("invalid_id")
    
    assert found is None


@pytest.mark.asyncio
async def test_organizacoes_repo_list(test_db):
    """Testa listagem de organizações."""
    repo = OrganizacoesRepo()
    
    # Create some orgs
    await repo.create_organization({"cnpj": "55.666.777/0001-81", "nome": "Org List 1"})
    await repo.create_organization({"cnpj": "66.777.888/0001-81", "nome": "Org List 2"})
    
    orgs = await repo.list_organizations(limit=10)
    
    assert isinstance(orgs, list)
    assert len(orgs) >= 2


@pytest.mark.asyncio
async def test_organizacoes_repo_update(test_db):
    """Testa atualização de organização."""
    repo = OrganizacoesRepo()
    
    org_id = await repo.create_organization({
        "cnpj": "77.888.999/0001-81",
        "nome": "Org Original"
    })
    
    success = await repo.update_organization(org_id, {"nome": "Org Atualizada"})
    
    assert success is True
    
    updated = await repo.get_organization(org_id)
    assert updated["nome"] == "Org Atualizada"


@pytest.mark.asyncio
async def test_organizacoes_repo_delete(test_db):
    """Testa remoção de organização."""
    repo = OrganizacoesRepo()
    
    org_id = await repo.create_organization({
        "cnpj": "88.999.000/0001-98",
        "nome": "Org Para Deletar"
    })
    
    success = await repo.delete_organization(org_id)
    
    assert success is True
    
    deleted = await repo.get_organization(org_id)
    assert deleted is None


# ============================================================
# Testes de QuestionariosRepo
# ============================================================

@pytest.mark.asyncio
async def test_questionarios_repo_list_active(test_db):
    """Testa listagem de questionários ativos."""
    repo = QuestionariosRepo()
    
    # O banco de teste pode não ter questionários, então só verificamos o tipo
    qs = await repo.list_questionnaires(only_active=True)
    
    assert isinstance(qs, list)


@pytest.mark.asyncio
async def test_questionarios_repo_get_by_invalid_id(test_db):
    """Retorna None para ID inválido."""
    repo = QuestionariosRepo()
    
    found = await repo.get_by_id("invalid_id_format")
    
    assert found is None


# ============================================================
# Testes de RespostasRepo
# ============================================================

@pytest.mark.asyncio
async def test_respostas_repo_save_and_retrieve(test_db):
    """Testa salvar e recuperar respostas."""
    repo = RespostasRepo()
    
    anon_id = "test_anon_respostas_1"
    q_id = str(ObjectId())
    
    respostas = [
        {"idPergunta": "P01", "valor": 3},
        {"idPergunta": "P02", "valor": 2},
        {"idPergunta": "P03", "valor": 4},
    ]
    
    success = await repo.save_all_answers(anon_id, q_id, respostas)
    
    assert success is True
    
    saved = await repo.get_all_answers(anon_id, q_id)
    
    assert saved is not None
    assert len(saved.get("respostas", [])) == 3


# ============================================================
# Testes de DiagnosticosRepo
# ============================================================

@pytest.mark.asyncio
async def test_diagnosticos_repo_create_and_get(test_db):
    """Testa criar e buscar diagnóstico."""
    repo = DiagnosticosRepo()
    
    diag_data = {
        "anonId": "test_anon_diag_1",
        "idQuestionario": str(ObjectId()),
        "resultadoGlobal": "moderado",
        "pontuacaoGlobal": 2.5,
        "dimensoes": [],
        "dataAnalise": datetime.utcnow()
    }
    
    diag_id = await repo.create_diagnostico(diag_data)
    
    assert diag_id is not None
    
    found = await repo.get_by_id(diag_id)
    
    assert found is not None
    assert found["resultadoGlobal"] == "moderado"


@pytest.mark.asyncio
async def test_diagnosticos_repo_list_by_user(test_db):
    """Testa listagem de diagnósticos por usuário."""
    repo = DiagnosticosRepo()
    
    anon_id = "test_anon_list_diag"
    
    # Create two diagnostics for the same user
    await repo.create_diagnostico({
        "anonId": anon_id,
        "idQuestionario": str(ObjectId()),
        "resultadoGlobal": "baixo",
        "pontuacaoGlobal": 1.0,
        "dimensoes": [],
        "dataAnalise": datetime.utcnow()
    })
    await repo.create_diagnostico({
        "anonId": anon_id,
        "idQuestionario": str(ObjectId()),
        "resultadoGlobal": "alto",
        "pontuacaoGlobal": 4.0,
        "dimensoes": [],
        "dataAnalise": datetime.utcnow()
    })
    
    diags = await repo.list_by_user(anon_id)
    
    assert isinstance(diags, list)
    assert len(diags) >= 2
