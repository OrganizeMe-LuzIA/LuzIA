"""
Repositório para gerenciamento de setores.
"""
from typing import Optional, List, Dict, Any
from app.core.database import get_db
from bson import ObjectId
from bson.errors import InvalidId
import logging

logger = logging.getLogger(__name__)


class SetoresRepo:
    """Gerencia operações CRUD para a coleção de setores."""

    def __init__(self):
        self.collection_name = "setores"

    def _ensure_object_id(self, data: Dict[str, Any], field: str) -> None:
        """Converte um campo string para ObjectId se necessário."""
        if field in data and isinstance(data[field], str):
            data[field] = ObjectId(data[field])

    async def create_sector(self, sector_data: Dict[str, Any]) -> str:
        """
        Cria um novo setor vinculado a uma organização.

        Args:
            sector_data: Dicionário contendo 'idOrganizacao', 'nome' e opcionalmente 'descricao'.

        Returns:
            O ID do setor criado como string.
        """
        db = await get_db()
        # Garante que idOrganizacao seja um ObjectId
        self._ensure_object_id(sector_data, "idOrganizacao")

        result = await db[self.collection_name].insert_one(sector_data)
        logger.info(f"Setor criado com ID: {result.inserted_id}")
        return str(result.inserted_id)

    async def get_sector(self, sector_id: str) -> Optional[Dict[str, Any]]:
        """
        Busca um setor pelo seu ID.

        Args:
            sector_id: ID do setor (string do ObjectId).

        Returns:
            Documento do setor ou None se não encontrado.
        """
        try:
            db = await get_db()
            return await db[self.collection_name].find_one({"_id": ObjectId(sector_id)})
        except InvalidId:
            logger.warning(f"ID de setor inválido: {sector_id}")
            return None

    async def get_sectors_by_org(self, org_id: str) -> List[Dict[str, Any]]:
        """
        Lista todos os setores de uma organização.

        Args:
            org_id: ID da organização.

        Returns:
            Lista de documentos de setores.
        """
        try:
            db = await get_db()
            cursor = db[self.collection_name].find({"idOrganizacao": ObjectId(org_id)})
            return await cursor.to_list(length=100)
        except InvalidId:
            logger.warning(f"ID de organização inválido: {org_id}")
            return []

    async def update_sector(self, sector_id: str, update_data: Dict[str, Any]) -> bool:
        """
        Atualiza os dados de um setor.

        Args:
            sector_id: ID do setor.
            update_data: Campos a serem atualizados.

        Returns:
            True se a atualização foi bem-sucedida, False caso contrário.
        """
        try:
            db = await get_db()
            result = await db[self.collection_name].update_one(
                {"_id": ObjectId(sector_id)},
                {"$set": update_data}
            )
            return result.modified_count > 0
        except InvalidId:
            logger.warning(f"ID de setor inválido para atualização: {sector_id}")
            return False

    async def delete_sector(self, sector_id: str) -> bool:
        """
        Remove um setor do banco de dados.

        Args:
            sector_id: ID do setor.

        Returns:
            True se a remoção foi bem-sucedida, False caso contrário.
        """
        try:
            db = await get_db()
            result = await db[self.collection_name].delete_one({"_id": ObjectId(sector_id)})
            return result.deleted_count > 0
        except InvalidId:
            logger.warning(f"ID de setor inválido para remoção: {sector_id}")
            return False
