#!/usr/bin/env python3
"""
Runner simples de migrações para backend/scripts.
Atualmente executa criação de índices com rollback dos índices criados nesta execução.
"""

import os
from typing import Dict, List

from pymongo import MongoClient
from pymongo.errors import PyMongoError

from create_indexes import create_all_indexes


def _uri() -> str:
    return os.getenv("MONGO_URI", "mongodb://localhost:27017/LuzIA")


def _db_name() -> str:
    return os.getenv("MONGO_DB_NAME", "LuzIA")


def _rollback_indexes(client: MongoClient, created: Dict[str, List[str]]) -> None:
    db = client[_db_name()]
    for collection_name, index_names in created.items():
        collection = db[collection_name]
        for index_name in index_names:
            if index_name == "_id_":
                continue
            try:
                collection.drop_index(index_name)
                print(f"[rollback] {collection_name}.{index_name}")
            except Exception as exc:
                print(f"[rollback][warn] falha ao remover {collection_name}.{index_name}: {exc}")


def main() -> int:
    client = MongoClient(_uri(), serverSelectionTimeoutMS=5000)
    created: Dict[str, List[str]] = {}
    try:
        client.admin.command("ping")
        print("[ok] conexao com MongoDB validada")
        created = create_all_indexes(client)
        print("[ok] migracoes concluidas")
        return 0
    except PyMongoError as exc:
        print(f"[erro] migracao falhou: {exc}")
        if created:
            print("[info] iniciando rollback dos indices criados nesta execucao")
            _rollback_indexes(client, created)
        return 1
    finally:
        client.close()


if __name__ == "__main__":
    raise SystemExit(main())
