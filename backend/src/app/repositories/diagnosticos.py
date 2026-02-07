"""
Repositório para gerenciamento de diagnósticos individuais.
"""
from typing import Optional, List, Dict, Any
from app.core.database import get_db
from app.repositories.base_repository import BaseRepository
from bson import ObjectId
from bson.errors import InvalidId
from datetime import datetime
import logging

logger = logging.getLogger(__name__)


class DiagnosticosRepo(BaseRepository[Dict[str, Any]]):
    """Gerencia operações para a coleção de diagnósticos."""

    def __init__(self):
        self.collection_name = "diagnosticos"

    async def create(self, data: Dict[str, Any]) -> str:
        return await self.create_diagnostico(data)

    def _ensure_object_id(self, data: Dict[str, Any], field: str) -> None:
        """Converte um campo string para ObjectId se necessário."""
        if field in data and isinstance(data[field], str):
            data[field] = ObjectId(data[field])

    async def create_diagnostico(self, diagnostico_data: Dict[str, Any]) -> str:
        """
        Cria um novo diagnóstico para um respondente.

        Args:
            diagnostico_data: Dicionário contendo 'anonId', 'idQuestionario',
                              'resultadoGlobal', 'dimensoes', etc.

        Returns:
            O ID do diagnóstico criado como string.
        """
        db = await get_db()
        
        # Converte IDs para ObjectId
        self._ensure_object_id(diagnostico_data, "idQuestionario")

        # Adiciona timestamps se não existirem
        now = datetime.utcnow()
        diagnostico_data.setdefault("dataAnalise", now)
        diagnostico_data.setdefault("dataCriacao", now)
        diagnostico_data["atualizadoEm"] = now

        result = await db[self.collection_name].insert_one(diagnostico_data)
        logger.info(f"Diagnóstico criado com ID: {result.inserted_id}")
        return str(result.inserted_id)

    async def get_by_anon_id(
        self, anon_id: str, questionario_id: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        """
        Busca diagnósticos por anonId, opcionalmente filtrados por questionário.

        Args:
            anon_id: ID anônimo do respondente.
            questionario_id: ID do questionário (opcional).

        Returns:
            Lista de diagnósticos ordenados por data (mais recente primeiro).
        """
        db = await get_db()
        query: Dict[str, Any] = {"anonId": anon_id}

        if questionario_id:
            try:
                query["idQuestionario"] = ObjectId(questionario_id)
            except InvalidId:
                logger.warning(f"ID de questionário inválido: {questionario_id}")
                return []

        cursor = db[self.collection_name].find(query).sort("dataAnalise", -1)
        return await cursor.to_list(length=100)

    async def get_latest_by_anon_id(
        self, anon_id: str, questionario_id: str
    ) -> Optional[Dict[str, Any]]:
        """
        Busca o diagnóstico mais recente de um respondente para um questionário.

        Args:
            anon_id: ID anônimo do respondente.
            questionario_id: ID do questionário.

        Returns:
            O diagnóstico mais recente ou None.
        """
        try:
            db = await get_db()
            return await db[self.collection_name].find_one(
                {"anonId": anon_id, "idQuestionario": ObjectId(questionario_id)},
                sort=[("dataAnalise", -1)]
            )
        except InvalidId:
            logger.warning(f"ID de questionário inválido: {questionario_id}")
            return None

    async def get_by_id(self, diagnostico_id: str) -> Optional[Dict[str, Any]]:
        """
        Busca um diagnóstico pelo seu ID.

        Args:
            diagnostico_id: ID do diagnóstico.

        Returns:
            Documento do diagnóstico ou None.
        """
        try:
            db = await get_db()
            return await db[self.collection_name].find_one({"_id": ObjectId(diagnostico_id)})
        except InvalidId:
            logger.warning(f"ID de diagnóstico inválido: {diagnostico_id}")
            return None

    async def update(self, id: str, data: Dict[str, Any]) -> bool:
        try:
            db = await get_db()
            payload = dict(data)
            self._ensure_object_id(payload, "idQuestionario")
            payload["atualizadoEm"] = datetime.utcnow()
            result = await db[self.collection_name].update_one(
                {"_id": ObjectId(id)},
                {"$set": payload},
            )
            return result.modified_count > 0
        except InvalidId:
            logger.warning(f"ID de diagnóstico inválido para atualização: {id}")
            return False

    async def delete(self, id: str) -> bool:
        try:
            db = await get_db()
            result = await db[self.collection_name].delete_one({"_id": ObjectId(id)})
            return result.deleted_count > 0
        except InvalidId:
            logger.warning(f"ID de diagnóstico inválido para remoção: {id}")
            return False

    async def count_by_filter(self, query: Optional[Dict[str, Any]] = None) -> int:
        db = await get_db()
        return await db[self.collection_name].count_documents(query or {})

    async def find_by_anon_ids(
        self, anon_ids: List[str], questionario_id: str
    ) -> List[Dict[str, Any]]:
        """
        Busca diagnósticos para uma lista de IDs anônimos e um questionário.
        Útil para relatórios consolidados.
        
        Args:
            anon_ids: Lista de strings (anonId).
            questionario_id: ID do questionário.
            
        Returns:
            Lista de diagnósticos (somente o mais recente por usuário se necessário, 
            mas aqui trazemos todos e o service filtra).
            Para simplificar, trazemos o último de cada user usando sort/limit ou let service handle.
            Aqui: trazemos todos por data desc.
        """
        try:
            db = await get_db()
            q_id = ObjectId(questionario_id)
            
            cursor = db[self.collection_name].find({
                "anonId": {"$in": anon_ids},
                "idQuestionario": q_id
            }).sort("dataAnalise", -1)
            
            return await cursor.to_list(length=2000)
        except InvalidId:
            logger.warning(f"ID inválido: {questionario_id}")
            return []
