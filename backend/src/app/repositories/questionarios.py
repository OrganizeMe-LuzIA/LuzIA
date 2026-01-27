"""
Repositório para gerenciamento de questionários e perguntas.
"""
from typing import Optional, List, Dict, Any
from app.db import get_db
from bson import ObjectId
from bson.errors import InvalidId
import logging

logger = logging.getLogger(__name__)


class QuestionariosRepo:
    """Gerencia operações para a coleção de questionários."""

    def __init__(self):
        self.collection_name = "questionarios"

    async def get_active_questionnaire(
        self, name: str = "CoPsoQ II"
    ) -> Optional[Dict[str, Any]]:
        """
        Busca um questionário ativo pelo nome.

        Args:
            name: Nome do instrumento (padrão: "CoPsoQ II").

        Returns:
            Documento do questionário ou None se não encontrado.
        """
        db = await get_db()
        return await db[self.collection_name].find_one({"nome": name, "ativo": True})

    async def get_by_id(self, questionario_id: str) -> Optional[Dict[str, Any]]:
        """
        Busca um questionário pelo seu ID.

        Args:
            questionario_id: ID do questionário.

        Returns:
            Documento do questionário ou None.
        """
        try:
            db = await get_db()
            return await db[self.collection_name].find_one({"_id": ObjectId(questionario_id)})
        except InvalidId:
            logger.warning(f"ID de questionário inválido: {questionario_id}")
            return None

    async def list_questionnaires(self, only_active: bool = True) -> List[Dict[str, Any]]:
        """
        Lista questionários cadastrados.

        Args:
            only_active: Se True, retorna apenas questionários ativos.

        Returns:
            Lista de documentos de questionários.
        """
        db = await get_db()
        query = {"ativo": True} if only_active else {}
        cursor = db[self.collection_name].find(query)
        return await cursor.to_list(length=100)


class PerguntasRepo:
    """Gerencia operações para a coleção de perguntas."""

    def __init__(self):
        self.collection_name = "perguntas"

    async def get_questions(
        self, id_questionario: str, only_active: bool = True
    ) -> List[Dict[str, Any]]:
        """
        Busca todas as perguntas de um questionário, ordenadas por 'idPergunta'.

        Args:
            id_questionario: ID do questionário.
            only_active: Se True, retorna apenas perguntas ativas.

        Returns:
            Lista de perguntas ordenadas.
        """
        try:
            db = await get_db()
            q_id = ObjectId(id_questionario)

            query: Dict[str, Any] = {"idQuestionario": q_id}
            if only_active:
                query["ativo"] = True

            cursor = db[self.collection_name].find(query).sort("idPergunta", 1)
            return await cursor.to_list(length=200)
        except InvalidId:
            logger.warning(f"ID de questionário inválido: {id_questionario}")
            return []

    async def get_question_by_id(self, id_pergunta: str) -> Optional[Dict[str, Any]]:
        """
        Busca uma pergunta pelo seu idPergunta (campo de negócio, não _id).

        Args:
            id_pergunta: Identificador da pergunta no questionário.

        Returns:
            Documento da pergunta ou None.
        """
        db = await get_db()
        return await db[self.collection_name].find_one({"idPergunta": id_pergunta})

    async def count_questions(self, id_questionario: str) -> int:
        """
        Conta o número de perguntas de um questionário.

        Args:
            id_questionario: ID do questionário.

        Returns:
            Número de perguntas.
        """
        try:
            db = await get_db()
            return await db[self.collection_name].count_documents(
                {"idQuestionario": ObjectId(id_questionario), "ativo": True}
            )
        except InvalidId:
            logger.warning(f"ID de questionário inválido: {id_questionario}")
            return 0
