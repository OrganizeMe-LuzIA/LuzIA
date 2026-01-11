"""
Repositório para gerenciamento de respostas a questionários.
"""
from typing import Optional, List, Dict, Any
from app.db import get_db
from bson import ObjectId
from bson.errors import InvalidId
from datetime import datetime
import logging

logger = logging.getLogger(__name__)


class RespostasRepo:
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
