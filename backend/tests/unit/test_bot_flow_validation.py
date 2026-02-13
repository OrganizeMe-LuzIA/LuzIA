from unittest.mock import AsyncMock

import pytest

from app.bot.flow import BotFlow


@pytest.mark.asyncio
async def test_validacao_empresa_valida_unica():
    flow = BotFlow()
    phone = "+5511999999999"
    flow.users_repo.find_by_phone = AsyncMock(
        return_value={"anonId": "anon-1", "metadata": {"chat_state": {"statusChat": "VALIDACAO_EMPRESA"}}}
    )
    flow.organizacoes_repo.find_by_name = AsyncMock(
        return_value=[{"_id": "org1", "nome": "Empresa ABC"}]
    )
    flow.setores_repo.get_sectors_by_org = AsyncMock(
        return_value=[{"_id": "set1", "nome": "TI"}, {"_id": "set2", "nome": "RH"}]
    )
    flow.users_repo.update_chat_state = AsyncMock(return_value=True)

    reply = await flow.handle_incoming(phone, "Empresa ABC")

    assert "Empresa confirmada: Empresa ABC." in reply
    assert "0 - TI" in reply
    assert "1 - RH" in reply
    saved_state = flow.users_repo.update_chat_state.await_args.args[1]
    assert saved_state["statusChat"] == "VALIDACAO_SETOR"
    assert saved_state["idOrganizacaoTemp"] == "org1"


@pytest.mark.asyncio
async def test_validacao_empresa_multiplas_correspondencias():
    flow = BotFlow()
    phone = "+5511999999999"
    flow.users_repo.find_by_phone = AsyncMock(
        return_value={"anonId": "anon-1", "metadata": {"chat_state": {"statusChat": "VALIDACAO_EMPRESA"}}}
    )
    flow.organizacoes_repo.find_by_name = AsyncMock(
        return_value=[
            {"_id": "org1", "nome": "Empresa ABC"},
            {"_id": "org2", "nome": "Empresa ABCD"},
        ]
    )
    flow.users_repo.update_chat_state = AsyncMock(return_value=True)

    reply = await flow.handle_incoming(phone, "Empresa ABC")

    assert "Encontrei mais de uma empresa" in reply
    assert "0 - Empresa ABC" in reply
    assert "1 - Empresa ABCD" in reply
    saved_state = flow.users_repo.update_chat_state.await_args.args[1]
    assert saved_state["statusChat"] == "SELECAO_EMPRESA"
    assert len(saved_state["empresasCandidatas"]) == 2


@pytest.mark.asyncio
async def test_selecao_empresa_por_numero():
    flow = BotFlow()
    phone = "+5511999999999"
    candidatas = [
        {"id": "org1", "nome": "Empresa ABC"},
        {"id": "org2", "nome": "Empresa ABCD"},
    ]
    flow.users_repo.find_by_phone = AsyncMock(
        return_value={
            "anonId": "anon-1",
            "metadata": {
                "chat_state": {
                    "statusChat": "SELECAO_EMPRESA",
                    "empresasCandidatas": candidatas,
                }
            },
        }
    )
    flow.setores_repo.get_sectors_by_org = AsyncMock(
        return_value=[{"_id": "set1", "nome": "TI"}, {"_id": "set2", "nome": "RH"}]
    )
    flow.users_repo.update_chat_state = AsyncMock(return_value=True)

    reply = await flow.handle_incoming(phone, "0")

    assert "Empresa confirmada: Empresa ABC." in reply
    assert "0 - TI" in reply
    saved_state = flow.users_repo.update_chat_state.await_args.args[1]
    assert saved_state["statusChat"] == "VALIDACAO_SETOR"
    assert saved_state["idOrganizacaoTemp"] == "org1"


@pytest.mark.asyncio
async def test_validacao_empresa_invalida():
    flow = BotFlow()
    phone = "+5511999999999"
    flow.users_repo.find_by_phone = AsyncMock(
        return_value={"anonId": "anon-1", "metadata": {"chat_state": {"statusChat": "VALIDACAO_EMPRESA"}}}
    )
    flow.organizacoes_repo.find_by_name = AsyncMock(return_value=[])
    flow.users_repo.update_chat_state = AsyncMock(return_value=True)

    reply = await flow.handle_incoming(phone, "INEXISTENTE")

    assert reply == "Empresa não encontrada. Verifique o nome e tente novamente."
    flow.users_repo.update_chat_state.assert_not_awaited()


@pytest.mark.asyncio
async def test_validacao_setor_por_numero():
    flow = BotFlow()
    phone = "+5511999999999"
    flow.users_repo.find_by_phone = AsyncMock(
        return_value={
            "anonId": "anon-1",
            "metadata": {
                "chat_state": {
                    "statusChat": "VALIDACAO_SETOR",
                    "idOrganizacaoTemp": "org1",
                    "organizacaoNomeTemp": "Empresa ABC",
                }
            },
        }
    )
    flow.setores_repo.get_sectors_by_org = AsyncMock(
        return_value=[{"_id": "set1", "nome": "TI"}, {"_id": "set2", "nome": "RH"}]
    )
    flow.setores_repo.find_by_name_and_org = AsyncMock(return_value=None)
    flow.users_repo.update_chat_state = AsyncMock(return_value=True)

    reply = await flow.handle_incoming(phone, "1")

    assert reply == "Informe o número da sua unidade (ou 'pular' se não aplicável):"
    saved_state = flow.users_repo.update_chat_state.await_args.args[1]
    assert saved_state["statusChat"] == "VALIDACAO_UNIDADE"
    assert saved_state["idSetorTemp"] == "set2"


@pytest.mark.asyncio
async def test_validacao_setor_por_nome():
    flow = BotFlow()
    phone = "+5511999999999"
    flow.users_repo.find_by_phone = AsyncMock(
        return_value={
            "anonId": "anon-1",
            "metadata": {
                "chat_state": {
                    "statusChat": "VALIDACAO_SETOR",
                    "idOrganizacaoTemp": "org1",
                    "organizacaoNomeTemp": "Empresa ABC",
                }
            },
        }
    )
    flow.setores_repo.get_sectors_by_org = AsyncMock(
        return_value=[{"_id": "set1", "nome": "TI"}, {"_id": "set2", "nome": "RH"}]
    )
    flow.setores_repo.find_by_name_and_org = AsyncMock(return_value={"_id": "set2", "nome": "RH"})
    flow.users_repo.update_chat_state = AsyncMock(return_value=True)

    reply = await flow.handle_incoming(phone, "rh")

    assert reply == "Informe o número da sua unidade (ou 'pular' se não aplicável):"
    saved_state = flow.users_repo.update_chat_state.await_args.args[1]
    assert saved_state["statusChat"] == "VALIDACAO_UNIDADE"
    assert saved_state["idSetorTemp"] == "set2"


@pytest.mark.asyncio
async def test_pular_unidade():
    flow = BotFlow()
    phone = "+5511999999999"
    flow.users_repo.find_by_phone = AsyncMock(
        return_value={
            "anonId": "anon-1",
            "metadata": {
                "chat_state": {
                    "statusChat": "VALIDACAO_UNIDADE",
                    "idOrganizacaoTemp": "org1",
                    "idSetorTemp": "set2",
                    "organizacaoNomeTemp": "Empresa ABC",
                    "setorNomeTemp": "RH",
                }
            },
        }
    )
    flow.users_repo.update_org_setor = AsyncMock(return_value=True)
    flow.users_repo.update_chat_state = AsyncMock(return_value=True)

    reply = await flow.handle_incoming(phone, "pular")

    assert "Pronto! Você está cadastrado como:" in reply
    assert "Empresa: Empresa ABC" in reply
    assert "Setor: RH" in reply
    assert "Unidade: não informada" in reply
    assert "responda: SIM" in reply
    flow.users_repo.update_org_setor.assert_awaited_once_with(
        phone=phone,
        org_id="org1",
        setor_id="set2",
        unidade=None,
    )


@pytest.mark.asyncio
async def test_inicio_fluxo_exibe_apresentacao_antes_da_empresa():
    flow = BotFlow()
    phone = "+5511999999999"
    flow.users_repo.find_by_phone = AsyncMock(
        return_value={"anonId": "anon-1", "metadata": {"chat_state": {"statusChat": "INATIVO"}}}
    )
    flow.users_repo.update_chat_state = AsyncMock(return_value=True)

    reply = await flow.handle_incoming(phone, "oi")

    assert "Olá! Eu sou a LuzIA!" in reply
    assert "informe o nome da sua empresa" in reply.lower()
    saved_state = flow.users_repo.update_chat_state.await_args.args[1]
    assert saved_state["statusChat"] == "VALIDACAO_EMPRESA"


@pytest.mark.asyncio
async def test_reiniciar_reexibe_apresentacao_inicial():
    flow = BotFlow()
    phone = "+5511999999999"
    flow.users_repo.find_by_phone = AsyncMock(
        return_value={
            "anonId": "anon-1",
            "metadata": {"chat_state": {"statusChat": "EM_CURSO", "indicePergunta": 3, "idQuestionario": "q1"}},
        }
    )
    flow.users_repo.update_chat_state = AsyncMock(return_value=True)
    flow.respostas_repo.delete_answers = AsyncMock(return_value=True)

    reply = await flow.handle_incoming(phone, "#reset")

    assert "Olá! Eu sou a LuzIA!" in reply
    assert "informe o nome da sua empresa" in reply.lower()
    assert flow.users_repo.update_chat_state.await_count == 2
    flow.respostas_repo.delete_answers.assert_awaited_once_with("anon-1", "q1")
