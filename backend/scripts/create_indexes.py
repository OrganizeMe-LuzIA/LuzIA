#!/usr/bin/env python3
"""
Cria índices recomendados para o MongoDB do LuzIA.
"""

import os
from typing import Any, Dict, List, Tuple

from pymongo import ASCENDING, DESCENDING, MongoClient
from pymongo.collection import Collection
from pymongo.errors import PyMongoError


IndexSpec = Tuple[List[Tuple[str, int]], Dict]


def _uri() -> str:
    return os.getenv("MONGO_URI", "mongodb://localhost:27017/LuzIA")


def _db_name() -> str:
    return os.getenv("MONGO_DB_NAME", "LuzIA")


def _normalized_options(options: Dict[str, Any]) -> Dict[str, Any]:
    return {
        "unique": bool(options.get("unique", False)),
        "sparse": bool(options.get("sparse", False)),
    }


def _has_equivalent_index(collection: Collection, keys: List[Tuple[str, int]], options: Dict[str, Any]) -> bool:
    wanted_keys = list(keys)
    wanted_opts = _normalized_options(options)
    for idx in collection.list_indexes():
        idx_keys = list(idx.get("key", {}).items())
        if idx_keys != wanted_keys:
            continue
        existing_opts = _normalized_options(idx)
        if existing_opts == wanted_opts:
            return True
    return False


def _ensure_indexes(collection: Collection, specs: List[IndexSpec]) -> List[str]:
    created: List[str] = []
    for keys, options in specs:
        if _has_equivalent_index(collection, keys, options):
            continue
        name = collection.create_index(keys, **options)
        created.append(name)
    return created


def create_all_indexes(client: MongoClient) -> Dict[str, List[str]]:
    db = client[_db_name()]
    created: Dict[str, List[str]] = {}

    created["usuarios"] = _ensure_indexes(
        db["usuarios"],
        [
            ([("telefone", ASCENDING)], {"name": "ux_usuarios_telefone", "unique": True}),
            ([("anonId", ASCENDING)], {"name": "ux_usuarios_anonId", "unique": True}),
            ([("idOrganizacao", ASCENDING), ("idSetor", ASCENDING)], {"name": "ix_usuarios_org_setor"}),
        ],
    )

    created["respostas"] = _ensure_indexes(
        db["respostas"],
        [
            (
                [("anonId", ASCENDING), ("idQuestionario", ASCENDING)],
                {"name": "ux_respostas_anon_questionario", "unique": True},
            ),
        ],
    )

    created["diagnosticos"] = _ensure_indexes(
        db["diagnosticos"],
        [
            ([("anonId", ASCENDING), ("idQuestionario", ASCENDING)], {"name": "ix_diagnosticos_anon_questionario"}),
            ([("dataAnalise", DESCENDING)], {"name": "ix_diagnosticos_dataAnalise_desc"}),
        ],
    )

    created["questionarios"] = _ensure_indexes(
        db["questionarios"],
        [
            ([("codigo", ASCENDING)], {"name": "ix_questionarios_codigo_sparse", "sparse": True}),
            ([("ativo", ASCENDING)], {"name": "ix_questionarios_ativo"}),
        ],
    )

    created["perguntas"] = _ensure_indexes(
        db["perguntas"],
        [
            ([("idQuestionario", ASCENDING), ("ordem", ASCENDING)], {"name": "ix_perguntas_questionario_ordem"}),
            ([("idPergunta", ASCENDING)], {"name": "ix_perguntas_idPergunta"}),
        ],
    )

    created["organizacoes"] = _ensure_indexes(
        db["organizacoes"],
        [
            ([("cnpj", ASCENDING)], {"name": "ux_organizacoes_cnpj", "unique": True}),
        ],
    )

    created["relatorios"] = _ensure_indexes(
        db["relatorios"],
        [
            ([("idQuestionario", ASCENDING)], {"name": "ix_relatorios_questionario"}),
            ([("tipoRelatorio", ASCENDING)], {"name": "ix_relatorios_tipo"}),
            ([("idOrganizacao", ASCENDING), ("idSetor", ASCENDING)], {"name": "ix_relatorios_org_setor_sparse", "sparse": True}),
        ],
    )

    return created


def main() -> int:
    client = MongoClient(_uri(), serverSelectionTimeoutMS=5000)
    try:
        client.admin.command("ping")
        created = create_all_indexes(client)
        print("Indices processados com sucesso:")
        for col, idxs in created.items():
            print(f"- {col}: {', '.join(idxs)}")
        return 0
    except PyMongoError as exc:
        print(f"Erro ao criar indices: {exc}")
        return 1
    finally:
        client.close()


if __name__ == "__main__":
    raise SystemExit(main())
