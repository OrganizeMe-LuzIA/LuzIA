"""
Repositório para gerenciamento de respostas a questionários.
"""
from typing import Optional, List, Dict, Any
from app.core.database import get_db
from app.repositories.base_repository import BaseRepository
from bson import ObjectId
from bson.errors import InvalidId
from datetime import datetime
import logging

logger = logging.getLogger(__name__)


class RespostasRepo(BaseRepository[Dict[str, Any]]):
    """Gerencia operações para a coleção de respostas."""

    def __init__(self):
        self.collection_name = "respostas"

    def _ensure_object_id(self, value: Any) -> ObjectId:
        """Converte string para ObjectId se necessário."""
        if isinstance(value, str):
            return ObjectId(value)
        return value

    async def push_answer(
        self, anon_id: str, id_questionario: str, id_pergunta: str, valor: int
    ) -> bool:
        """
        Adiciona uma resposta ao array de respostas de uma sessão.
        Cria a sessão se não existir (upsert).

        Args:
            anon_id: ID anônimo do respondente.
            id_questionario: ID do questionário.
            id_pergunta: ID da pergunta.
            valor: Valor da resposta (0-4 para escala Likert).

        Returns:
            True se a operação foi bem-sucedida.
        """
        try:
            db = await get_db()
            q_id = self._ensure_object_id(id_questionario)

            result = await db[self.collection_name].update_one(
                {"anonId": anon_id, "idQuestionario": q_id},
                {
                    "$push": {"respostas": {"valor": valor, "idPergunta": id_pergunta}},
                    "$set": {"data": datetime.utcnow()}
                },
                upsert=True
            )
            return result.acknowledged
        except InvalidId:
            logger.warning(f"ID de questionário inválido: {id_questionario}")
            return False

    async def get_answers(
        self, anon_id: str, id_questionario: str
    ) -> Optional[Dict[str, Any]]:
        """
        Busca as respostas de um respondente para um questionário.

        Args:
            anon_id: ID anônimo do respondente.
            id_questionario: ID do questionário.

        Returns:
            Documento de respostas ou None.
        """
        try:
            db = await get_db()
            q_id = self._ensure_object_id(id_questionario)
            return await db[self.collection_name].find_one(
                {"anonId": anon_id, "idQuestionario": q_id}
            )
        except InvalidId:
            logger.warning(f"ID de questionário inválido: {id_questionario}")
            return None

    async def get_all_answers(
        self, anon_id: str, id_questionario: str
    ) -> Optional[Dict[str, Any]]:
        """
        Alias legada para compatibilidade com testes antigos.
        """
        return await self.get_answers(anon_id, id_questionario)

    async def get_all_answers_for_questionnaire(
        self, id_questionario: str
    ) -> List[Dict[str, Any]]:
        """
        Busca todas as respostas de um questionário (para cálculo de métricas).

        Args:
            id_questionario: ID do questionário.

        Returns:
            Lista de documentos de respostas.
        """
        try:
            db = await get_db()
            q_id = self._ensure_object_id(id_questionario)
            cursor = db[self.collection_name].find({"idQuestionario": q_id})
            return await cursor.to_list(length=1000)
        except InvalidId:
            logger.warning(f"ID de questionário inválido: {id_questionario}")
            return []

    async def count_respondents(self, id_questionario: str) -> int:
        """
        Conta o número de respondentes de um questionário.

        Args:
            id_questionario: ID do questionário.

        Returns:
            Número de respondentes.
        """
        try:
            db = await get_db()
            q_id = self._ensure_object_id(id_questionario)
            return await db[self.collection_name].count_documents({"idQuestionario": q_id})
        except InvalidId:
            logger.warning(f"ID de questionário inválido: {id_questionario}")
            return 0

    async def delete_answers(self, anon_id: str, id_questionario: str) -> bool:
        """
        Remove as respostas de um respondente para um questionário.

        Args:
            anon_id: ID anônimo do respondente.
            id_questionario: ID do questionário.

        Returns:
            True se a remoção foi bem-sucedida.
        """
        try:
            db = await get_db()
            q_id = self._ensure_object_id(id_questionario)
            result = await db[self.collection_name].delete_one(
                {"anonId": anon_id, "idQuestionario": q_id}
            )
            return result.deleted_count > 0
        except InvalidId:
            logger.warning(f"ID de questionário inválido: {id_questionario}")
            return False

    async def save_all_answers(
        self, anon_id: str, id_questionario: str, respostas: List[Dict[str, Any]]
    ) -> bool:
        """
        Salva (sobrescreve) todas as respostas de uma sessão.
        Útil para envio em lote via API REST.

        Args:
            anon_id: ID anônimo do respondente.
            id_questionario: ID do questionário.
            respostas: Lista de dicionários {"idPergunta": "...", "valor": 0}.

        Returns:
            True se a operação foi bem-sucedida.
        """
        try:
            db = await get_db()
            q_id = self._ensure_object_id(id_questionario)

            result = await db[self.collection_name].update_one(
                {"anonId": anon_id, "idQuestionario": q_id},
                {
                    "$set": {
                        "respostas": respostas,
                        "data": datetime.utcnow()
                    }
                },
                upsert=True
            )
            return result.acknowledged
        except InvalidId:
            logger.warning(f"ID de questionário inválido: {id_questionario}")
            return False
    async def create(self, data: Dict[str, Any]) -> str:
        db = await get_db()
        payload = dict(data)
        if "idQuestionario" in payload:
            payload["idQuestionario"] = self._ensure_object_id(payload["idQuestionario"])
        payload.setdefault("data", datetime.utcnow())
        result = await db[self.collection_name].insert_one(payload)
        return str(result.inserted_id)

    async def get_by_id(self, id: str) -> Optional[Dict[str, Any]]:
        try:
            db = await get_db()
            return await db[self.collection_name].find_one({"_id": ObjectId(id)})
        except InvalidId:
            logger.warning(f"ID de resposta inválido: {id}")
            return None

    async def update(self, id: str, data: Dict[str, Any]) -> bool:
        try:
            db = await get_db()
            payload = dict(data)
            if "idQuestionario" in payload:
                payload["idQuestionario"] = self._ensure_object_id(payload["idQuestionario"])
            result = await db[self.collection_name].update_one(
                {"_id": ObjectId(id)},
                {"$set": payload},
            )
            return result.modified_count > 0
        except InvalidId:
            logger.warning(f"ID de resposta inválido para atualização: {id}")
            return False

    async def delete(self, id: str) -> bool:
        try:
            db = await get_db()
            result = await db[self.collection_name].delete_one({"_id": ObjectId(id)})
            return result.deleted_count > 0
        except InvalidId:
            logger.warning(f"ID de resposta inválido para remoção: {id}")
            return False

    async def count_by_filter(self, query: Optional[Dict[str, Any]] = None) -> int:
        db = await get_db()
        return await db[self.collection_name].count_documents(query or {})
