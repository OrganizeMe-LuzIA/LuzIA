"""
Repositório para gerenciamento de relatórios consolidados.
"""
from typing import Optional, List, Dict, Any
from app.core.database import get_db
from app.repositories.base_repository import BaseRepository
from bson import ObjectId
from bson.errors import InvalidId
from datetime import datetime
import logging

logger = logging.getLogger(__name__)


class RelatoriosRepo(BaseRepository[Dict[str, Any]]):
    """Gerencia operações para a coleção de relatórios."""

    def __init__(self):
        self.collection_name = "relatorios"

    def _ensure_object_id(self, data: Dict[str, Any], field: str) -> None:
        """Converte um campo string para ObjectId se necessário."""
        if field in data and data[field] and isinstance(data[field], str):
            data[field] = ObjectId(data[field])

    async def create_relatorio(self, relatorio_data: Dict[str, Any]) -> str:
        """
        Cria um novo relatório consolidado.

        Args:
            relatorio_data: Dicionário contendo 'idQuestionario', 'tipoRelatorio',
                            'metricas', 'dominios', etc.

        Returns:
            O ID do relatório criado como string.
        """
        db = await get_db()

        # Converte IDs para ObjectId
        for field in ["idQuestionario", "idOrganizacao", "idSetor"]:
            self._ensure_object_id(relatorio_data, field)

        # Adiciona data de geração se não existir
        relatorio_data.setdefault("dataGeracao", datetime.utcnow())

        result = await db[self.collection_name].insert_one(relatorio_data)
        logger.info(f"Relatório criado com ID: {result.inserted_id}")
        return str(result.inserted_id)

    async def find_by_filters(
        self,
        questionario_id: Optional[str] = None,
        org_id: Optional[str] = None,
        setor_id: Optional[str] = None,
        tipo: Optional[str] = None,
        limit: int = 100
    ) -> List[Dict[str, Any]]:
        """
        Busca relatórios utilizando filtros opcionais.

        Args:
            questionario_id: Filtrar por questionário.
            org_id: Filtrar por organização.
            setor_id: Filtrar por setor.
            tipo: Filtrar por tipo (organizacional, setorial, individual).
            limit: Número máximo de resultados.

        Returns:
            Lista de relatórios ordenados por data de geração (mais recente primeiro).
        """
        db = await get_db()
        query: Dict[str, Any] = {}

        try:
            if questionario_id:
                query["idQuestionario"] = ObjectId(questionario_id)
            if org_id:
                query["idOrganizacao"] = ObjectId(org_id)
            if setor_id:
                query["idSetor"] = ObjectId(setor_id)
        except InvalidId as e:
            logger.warning(f"ID inválido nos filtros: {e}")
            return []

        if tipo:
            query["tipoRelatorio"] = tipo

        cursor = db[self.collection_name].find(query).sort("dataGeracao", -1)
        return await cursor.to_list(length=limit)

    async def get_by_id(self, relatorio_id: str) -> Optional[Dict[str, Any]]:
        """
        Busca um relatório pelo seu ID.

        Args:
            relatorio_id: ID do relatório.

        Returns:
            Documento do relatório ou None.
        """
        try:
            db = await get_db()
            return await db[self.collection_name].find_one({"_id": ObjectId(relatorio_id)})
        except InvalidId:
            logger.warning(f"ID de relatório inválido: {relatorio_id}")
            return None

    async def update(self, id: str, data: Dict[str, Any]) -> bool:
        try:
            db = await get_db()
            payload = dict(data)
            for field in ["idQuestionario", "idOrganizacao", "idSetor"]:
                self._ensure_object_id(payload, field)
            result = await db[self.collection_name].update_one(
                {"_id": ObjectId(id)},
                {"$set": payload},
            )
            return result.modified_count > 0
        except InvalidId:
            logger.warning(f"ID de relatório inválido para atualização: {id}")
            return False

    async def delete_relatorio(self, relatorio_id: str) -> bool:
        """
        Remove um relatório do banco de dados.

        Args:
            relatorio_id: ID do relatório.

        Returns:
            True se a remoção foi bem-sucedida, False caso contrário.
        """
        try:
            db = await get_db()
            result = await db[self.collection_name].delete_one({"_id": ObjectId(relatorio_id)})
            return result.deleted_count > 0
        except InvalidId:
            logger.warning(f"ID de relatório inválido para remoção: {relatorio_id}")
            return False

    async def delete(self, id: str) -> bool:
        return await self.delete_relatorio(id)

    async def count_by_filter(self, query: Optional[Dict[str, Any]] = None) -> int:
        db = await get_db()
        return await db[self.collection_name].count_documents(query or {})
    async def create(self, data: Dict[str, Any]) -> str:
        return await self.create_relatorio(data)
