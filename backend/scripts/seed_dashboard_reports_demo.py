#!/usr/bin/env python3
"""
Popula dados de demonstração para dashboard e relatórios.

O script cria/atualiza:
- organizações e setores
- usuários com status variados
- respostas e diagnósticos
- relatórios consolidados (organizacional e setorial)

Uso:
  PYTHONPATH=backend/src python backend/scripts/seed_dashboard_reports_demo.py
"""

import asyncio
import random
from collections import defaultdict
from datetime import UTC, datetime, timedelta
from typing import Any, Dict, List, Optional

from bson import ObjectId
from motor.motor_asyncio import AsyncIOMotorClient
from pymongo import ReturnDocument

from app.core.config import settings
from app.services.relatorio_service import RelatorioService


SEED_PREFIX = "demo-seed-2026-"
SEED_ACTOR = "seed-demo-relatorios-v1"
QUESTIONARIO_CODE = "COPSOQ_DEMO_RELATORIOS_2026"

STATUS_POOL = [
    "finalizado",
    "em andamento",
    "não iniciado",
]

DIMENSOES_BASE = [
    {"codigo": "EL", "dominio": "Exigências Laborais", "dimensao": "Exigências quantitativas", "sinal": "risco"},
    {"codigo": "OTC", "dominio": "Organização do Trabalho e Conteúdo", "dimensao": "Influência no trabalho", "sinal": "protecao"},
    {"codigo": "RSL", "dominio": "Relações Sociais e Liderança", "dimensao": "Apoio social de superiores", "sinal": "protecao"},
    {"codigo": "VLT", "dominio": "Valores no Local de Trabalho", "dimensao": "Confiança vertical", "sinal": "protecao"},
    {"codigo": "ITI", "dominio": "Interface Trabalho-Indivíduo", "dimensao": "Conflito trabalho-família", "sinal": "risco"},
    {"codigo": "SBE", "dominio": "Saúde e Bem-Estar", "dimensao": "Burnout", "sinal": "risco"},
]

ORG_BLUEPRINT = [
    {
        "codigo": "DEMO_ORG_A",
        "nome": "LuzIA Indústria Demo",
        "cnpj": "11111111000111",
        "risk_bias": 3.8,
        "setores": ["Operações", "Administrativo"],
    },
    {
        "codigo": "DEMO_ORG_B",
        "nome": "LuzIA Serviços Demo",
        "cnpj": "22222222000122",
        "risk_bias": 3.0,
        "setores": ["Comercial", "Atendimento"],
    },
    {
        "codigo": "DEMO_ORG_C",
        "nome": "LuzIA Tecnologia Demo",
        "cnpj": "33333333000133",
        "risk_bias": 2.3,
        "setores": ["Produto", "Engenharia"],
    },
]


def _classificar(score: float, sinal: str) -> str:
    if sinal == "protecao":
        if score >= 3.67:
            return "favoravel"
        if score > 2.33:
            return "intermediario"
        return "risco"

    if score <= 2.33:
        return "favoravel"
    if score < 3.67:
        return "intermediario"
    return "risco"


def _score_for_dimension(rng: random.Random, risk_bias: float, sinal: str) -> float:
    if sinal == "protecao":
        center = 6.0 - risk_bias
    else:
        center = risk_bias
    value = rng.gauss(center, 0.55)
    return round(max(1.0, min(5.0, value)), 2)


def _resultado_global(dimensoes: List[Dict[str, Any]]) -> str:
    riscos = sum(1 for item in dimensoes if item["classificacao"] == "risco")
    favoraveis = sum(1 for item in dimensoes if item["classificacao"] == "favoravel")
    if riscos >= 3:
        return "risco"
    if favoraveis >= 3:
        return "favoravel"
    return "intermediario"


async def _upsert_questionario(db) -> ObjectId:
    payload = {
        "codigo": QUESTIONARIO_CODE,
        "nome": "COPSOQ Demo Relatórios",
        "versao": "2026.1",
        "descricao": "Questionário de demonstração para dashboard e relatórios.",
        "dominios": [item["dominio"] for item in DIMENSOES_BASE],
        "totalPerguntas": 24,
        "ativo": True,
    }
    result = await db["questionarios"].find_one_and_update(
        {"codigo": QUESTIONARIO_CODE},
        {"$set": payload, "$setOnInsert": {"dataCriacao": datetime.now(UTC)}},
        upsert=True,
        return_document=ReturnDocument.AFTER,
    )
    if result and isinstance(result.get("_id"), ObjectId):
        return result["_id"]
    created = await db["questionarios"].find_one({"codigo": QUESTIONARIO_CODE}, {"_id": 1})
    return created["_id"]


async def _ensure_org_and_setores(db) -> List[Dict[str, Any]]:
    final_orgs: List[Dict[str, Any]] = []
    for blueprint in ORG_BLUEPRINT:
        org_doc = await db["organizacoes"].find_one_and_update(
            {"codigo": blueprint["codigo"]},
            {
                "$set": {
                    "nome": blueprint["nome"],
                    "cnpj": blueprint["cnpj"],
                    "codigo": blueprint["codigo"],
                }
            },
            upsert=True,
            return_document=ReturnDocument.AFTER,
        )
        if not org_doc:
            org_doc = await db["organizacoes"].find_one({"codigo": blueprint["codigo"]})
        if not org_doc:
            continue

        setores: List[Dict[str, Any]] = []
        for setor_nome in blueprint["setores"]:
            setor_doc = await db["setores"].find_one_and_update(
                {"idOrganizacao": org_doc["_id"], "nome": setor_nome},
                {"$set": {"idOrganizacao": org_doc["_id"], "nome": setor_nome}},
                upsert=True,
                return_document=ReturnDocument.AFTER,
            )
            if not setor_doc:
                setor_doc = await db["setores"].find_one({"idOrganizacao": org_doc["_id"], "nome": setor_nome})
            if setor_doc:
                setores.append(setor_doc)

        final_orgs.append(
            {
                "org": org_doc,
                "setores": setores,
                "risk_bias": blueprint["risk_bias"],
            }
        )
    return final_orgs


async def _seed_users_respostas_diagnosticos(db, questionario_id: ObjectId) -> Dict[str, Any]:
    rng = random.Random(20260217)
    await db["respostas"].delete_many({"anonId": {"$regex": f"^{SEED_PREFIX}"}})
    await db["diagnosticos"].delete_many({"anonId": {"$regex": f"^{SEED_PREFIX}"}})
    await db["usuarios"].delete_many({"anonId": {"$regex": f"^{SEED_PREFIX}"}})
    await db["relatorios"].delete_many({"geradoPor": SEED_ACTOR})

    orgs_info = await _ensure_org_and_setores(db)
    users_to_insert: List[Dict[str, Any]] = []
    respostas_to_insert: List[Dict[str, Any]] = []
    diagnosticos_to_insert: List[Dict[str, Any]] = []

    index = 0
    for org_info in orgs_info:
        org_doc = org_info["org"]
        setores = org_info["setores"]
        risk_bias = org_info["risk_bias"]
        if not setores:
            continue

        for setor in setores:
            for _ in range(9):
                index += 1
                anon_id = f"{SEED_PREFIX}{index:04d}"
                status = rng.choices(STATUS_POOL, weights=[0.34, 0.46, 0.20], k=1)[0]
                respondido = status == "finalizado" or rng.random() > 0.35
                cadastro = datetime.now(UTC) - timedelta(days=rng.randint(0, 45))
                ultimo_acesso = cadastro + timedelta(hours=rng.randint(1, 72))

                user_doc = {
                    "telefone": f"+5511999{index:06d}",
                    "email": f"demo.user.{index:04d}@luzia.local",
                    "idOrganizacao": org_doc["_id"],
                    "idSetor": setor["_id"],
                    "numeroUnidade": str(rng.randint(1, 4)),
                    "status": status,
                    "respondido": bool(respondido),
                    "anonId": anon_id,
                    "dataCadastro": cadastro,
                    "ultimoAcesso": ultimo_acesso,
                    "metadata": {
                        "preenchimento": {
                            "origem": "seed",
                            "status": status,
                            "atualizadoEm": ultimo_acesso,
                        }
                    },
                }
                users_to_insert.append(user_doc)

                respostas_count = rng.randint(16, 24) if respondido else rng.randint(2, 12)
                respostas_to_insert.append(
                    {
                        "anonId": anon_id,
                        "idQuestionario": questionario_id,
                        "data": ultimo_acesso,
                        "respostas": [
                            {
                                "idPergunta": f"DEMO_{n + 1:03d}",
                                "valor": int(max(0, min(5, round(rng.gauss(3, 1.1))))),
                            }
                            for n in range(respostas_count)
                        ],
                    }
                )

                dimensoes: List[Dict[str, Any]] = []
                for dim in DIMENSOES_BASE:
                    score = _score_for_dimension(rng, risk_bias, dim["sinal"])
                    classificacao = _classificar(score, dim["sinal"])
                    dimensoes.append(
                        {
                            "codigoDominio": dim["codigo"],
                            "dominio": dim["dominio"],
                            "dimensao": dim["dimensao"],
                            "pontuacao": score,
                            "classificacao": classificacao,
                            "sinal": dim["sinal"],
                            "total_itens": 2,
                            "itens_respondidos": 2,
                            "itens": [],
                        }
                    )

                diagnosticos_to_insert.append(
                    {
                        "anonId": anon_id,
                        "idQuestionario": questionario_id,
                        "resultadoGlobal": _resultado_global(dimensoes),
                        "pontuacaoGlobal": round(sum(item["pontuacao"] for item in dimensoes) / len(dimensoes), 2),
                        "dimensoes": dimensoes,
                        "dataAnalise": ultimo_acesso,
                        "dataCriacao": ultimo_acesso,
                        "atualizadoEm": ultimo_acesso,
                    }
                )

    if users_to_insert:
        await db["usuarios"].insert_many(users_to_insert, ordered=False)
    if respostas_to_insert:
        await db["respostas"].insert_many(respostas_to_insert, ordered=False)
    if diagnosticos_to_insert:
        await db["diagnosticos"].insert_many(diagnosticos_to_insert, ordered=False)

    return {
        "total_users": len(users_to_insert),
        "total_respostas": len(respostas_to_insert),
        "total_diagnosticos": len(diagnosticos_to_insert),
    }


async def _build_seed_reports(db, questionario_id: ObjectId) -> int:
    service = RelatorioService()
    users = await db["usuarios"].find({"anonId": {"$regex": f"^{SEED_PREFIX}"}}).to_list(length=5000)
    if not users:
        return 0

    users_by_scope: Dict[tuple, List[str]] = defaultdict(list)
    for user in users:
        org_id = user.get("idOrganizacao")
        setor_id = user.get("idSetor")
        anon_id = user.get("anonId")
        if not org_id or not anon_id:
            continue
        users_by_scope[(org_id, None, "organizacional")].append(anon_id)
        if setor_id:
            users_by_scope[(org_id, setor_id, "setorial")].append(anon_id)

    total_reports = 0
    for (org_id, setor_id, tipo), anon_ids in users_by_scope.items():
        diagnosticos = await db["diagnosticos"].find(
            {
                "anonId": {"$in": anon_ids},
                "idQuestionario": questionario_id,
            }
        ).sort("dataAnalise", -1).to_list(length=5000)

        latest_by_anon: Dict[str, Dict[str, Any]] = {}
        for diagnostico in diagnosticos:
            anon_id = diagnostico.get("anonId")
            if anon_id and anon_id not in latest_by_anon:
                latest_by_anon[anon_id] = diagnostico

        if not latest_by_anon:
            continue

        relatorio = service.generate_relatorio(
            diagnosticos=list(latest_by_anon.values()),
            questionario_id=str(questionario_id),
            tipo=tipo,
            org_id=str(org_id),
            setor_id=str(setor_id) if setor_id else None,
            gerado_por=SEED_ACTOR,
        ).model_dump()

        relatorio["idQuestionario"] = questionario_id
        relatorio["idOrganizacao"] = org_id
        relatorio["idSetor"] = setor_id
        relatorio["geradoPor"] = SEED_ACTOR
        relatorio["dataGeracao"] = datetime.now(UTC)

        await db["relatorios"].update_one(
            {
                "idQuestionario": questionario_id,
                "idOrganizacao": org_id,
                "idSetor": setor_id,
                "tipoRelatorio": tipo,
                "geradoPor": SEED_ACTOR,
            },
            {"$set": relatorio},
            upsert=True,
        )
        total_reports += 1

    return total_reports


async def main() -> None:
    client = AsyncIOMotorClient(settings.MONGO_URI)
    db = client[settings.MONGO_DB_NAME]
    print(f"[seed] Database: {settings.MONGO_DB_NAME}")
    print("[seed] Iniciando população de dados de demonstração...")

    questionario_id = await _upsert_questionario(db)
    counts = await _seed_users_respostas_diagnosticos(db, questionario_id)
    reports = await _build_seed_reports(db, questionario_id)

    print(f"[seed] Questionário demo: {questionario_id}")
    print(
        f"[seed] Inseridos: usuários={counts['total_users']} "
        f"respostas={counts['total_respostas']} diagnósticos={counts['total_diagnosticos']}"
    )
    print(f"[seed] Relatórios demo criados/atualizados: {reports}")

    client.close()


if __name__ == "__main__":
    asyncio.run(main())
