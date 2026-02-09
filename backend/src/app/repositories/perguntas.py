"""
Repositório para gerenciamento de perguntas.
"""
from typing import Any, Dict, List, Optional
import logging

from bson import ObjectId
from bson.errors import InvalidId

from app.core.database import get_db
from app.repositories.base_repository import BaseRepository

logger = logging.getLogger(__name__)


class PerguntasRepo(BaseRepository[Dict[str, Any]]):
    """Gerencia operações para a coleção de perguntas."""

    def __init__(self):
        self.collection_name = "perguntas"

    async def create(self, data: Dict[str, Any]) -> str:
        return await self.create_question(data)

    async def get_by_id(self, id: str) -> Optional[Dict[str, Any]]:
        return await self.get_question_by_id(id)

    async def update(self, id: str, data: Dict[str, Any]) -> bool:
        return await self.update_question(id, data)

    async def delete(self, id: str) -> bool:
        try:
            db = await get_db()
            result = await db[self.collection_name].delete_one({"idPergunta": id})
            return result.deleted_count > 0
        except Exception as exc:
            logger.warning(f"Erro removendo pergunta {id}: {exc}")
            return False

    async def get_questions(
        self, id_questionario: str, only_active: bool = True
    ) -> List[Dict[str, Any]]:
        try:
            db = await get_db()
            q_id = ObjectId(id_questionario)
            query: Dict[str, Any] = {"idQuestionario": q_id}
            if only_active:
                query["ativo"] = True
            cursor = db[self.collection_name].find(query).sort("ordem", 1)
            return await cursor.to_list(length=200)
        except InvalidId:
            logger.warning(f"ID de questionário inválido: {id_questionario}")
            return []

    async def get_question_by_id(self, id_pergunta: str) -> Optional[Dict[str, Any]]:
        db = await get_db()
        return await db[self.collection_name].find_one({"idPergunta": id_pergunta})

    async def count_questions(self, id_questionario: str) -> int:
        try:
            db = await get_db()
            return await db[self.collection_name].count_documents(
                {"idQuestionario": ObjectId(id_questionario), "ativo": True}
            )
        except InvalidId:
            logger.warning(f"ID de questionário inválido: {id_questionario}")
            return 0

    async def create_question(self, data: Dict[str, Any]) -> str:
        db = await get_db()
        payload = dict(data)
        if "idQuestionario" in payload and isinstance(payload["idQuestionario"], str):
            payload["idQuestionario"] = ObjectId(payload["idQuestionario"])
        payload.setdefault("ativo", True)
        result = await db[self.collection_name].insert_one(payload)
        return str(result.inserted_id)

    async def update_question(self, id: str, data: Dict[str, Any]) -> bool:
        db = await get_db()
        payload = dict(data)
        if "idQuestionario" in payload and isinstance(payload["idQuestionario"], str):
            try:
                payload["idQuestionario"] = ObjectId(payload["idQuestionario"])
            except InvalidId:
                logger.warning(f"ID de questionário inválido na atualização: {payload['idQuestionario']}")
                return False
        result = await db[self.collection_name].update_one(
            {"idPergunta": id},
            {"$set": payload},
        )
        return result.modified_count > 0

    async def activate_question(self, id: str) -> bool:
        return await self.update_question(id, {"ativo": True})

    async def deactivate_question(self, id: str) -> bool:
        return await self.update_question(id, {"ativo": False})

    async def bulk_create_questions(self, questions: List[Dict[str, Any]]) -> List[str]:
        if not questions:
            return []
        db = await get_db()
        payload: List[Dict[str, Any]] = []
        for q in questions:
            item = dict(q)
            if "idQuestionario" in item and isinstance(item["idQuestionario"], str):
                try:
                    item["idQuestionario"] = ObjectId(item["idQuestionario"])
                except InvalidId:
                    logger.warning(f"ID de questionário inválido no lote: {item['idQuestionario']}")
                    continue
            item.setdefault("ativo", True)
            payload.append(item)
        if not payload:
            return []
        result = await db[self.collection_name].insert_many(payload)
        return [str(i) for i in result.inserted_ids]

