"""
Repositório para gerenciamento de questionários.
"""
from typing import Any, Dict, List, Optional
import logging

from bson import ObjectId
from bson.errors import InvalidId

from app.core.database import get_db
from app.repositories.base_repository import BaseRepository

logger = logging.getLogger(__name__)


class QuestionariosRepo(BaseRepository[Dict[str, Any]]):
    """Gerencia operações para a coleção de questionários."""

    def __init__(self):
        self.collection_name = "questionarios"

    async def create(self, data: Dict[str, Any]) -> str:
        return await self.create_questionnaire(data)

    async def get_by_id(self, questionario_id: str) -> Optional[Dict[str, Any]]:
        try:
            db = await get_db()
            return await db[self.collection_name].find_one({"_id": ObjectId(questionario_id)})
        except InvalidId:
            logger.warning(f"ID de questionário inválido: {questionario_id}")
            return None

    async def update(self, id: str, data: Dict[str, Any]) -> bool:
        return await self.update_questionnaire(id, data)

    async def delete(self, id: str) -> bool:
        try:
            db = await get_db()
            result = await db[self.collection_name].delete_one({"_id": ObjectId(id)})
            return result.deleted_count > 0
        except InvalidId:
            logger.warning(f"ID de questionário inválido para remoção: {id}")
            return False

    async def get_active_questionnaire(
        self, name: str = "CoPsoQ II"
    ) -> Optional[Dict[str, Any]]:
        db = await get_db()
        return await db[self.collection_name].find_one({"nome": name, "ativo": True})

    async def list_questionnaires(self, only_active: bool = True) -> List[Dict[str, Any]]:
        db = await get_db()
        query = {"ativo": True} if only_active else {}
        cursor = db[self.collection_name].find(query)
        return await cursor.to_list(length=100)

    async def create_questionnaire(self, data: Dict[str, Any]) -> str:
        db = await get_db()
        payload = dict(data)
        payload.setdefault("ativo", True)
        result = await db[self.collection_name].insert_one(payload)
        return str(result.inserted_id)

    async def update_questionnaire(self, id: str, data: Dict[str, Any]) -> bool:
        try:
            db = await get_db()
            result = await db[self.collection_name].update_one(
                {"_id": ObjectId(id)},
                {"$set": dict(data)},
            )
            return result.modified_count > 0
        except InvalidId:
            logger.warning(f"ID de questionário inválido para atualização: {id}")
            return False

    async def activate_questionnaire(self, id: str) -> bool:
        return await self.update_questionnaire(id, {"ativo": True})

    async def deactivate_questionnaire(self, id: str) -> bool:
        return await self.update_questionnaire(id, {"ativo": False})

    async def clone_questionnaire(self, id: str, new_name: str) -> Optional[str]:
        original = await self.get_by_id(id)
        if not original:
            return None

        clone = dict(original)
        clone.pop("_id", None)
        clone["nome"] = new_name
        clone["ativo"] = False
        result = await self.create_questionnaire(clone)
        return result


# Compatibilidade retroativa para imports existentes.
from app.repositories.perguntas import PerguntasRepo  # noqa: E402

