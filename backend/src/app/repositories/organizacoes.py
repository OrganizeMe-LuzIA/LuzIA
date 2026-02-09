"""
Repositório para gerenciamento de organizações.
"""
import re
from typing import Optional, List, Dict, Any
from app.core.database import get_db
from app.repositories.base_repository import BaseRepository
from bson import ObjectId
from bson.errors import InvalidId
import logging

logger = logging.getLogger(__name__)


class OrganizacoesRepo(BaseRepository[Dict[str, Any]]):
    """Gerencia operações CRUD para a coleção de organizações."""

    def __init__(self):
        self.collection_name = "organizacoes"

    async def create(self, data: Dict[str, Any]) -> str:
        return await self.create_organization(data)

    async def get_by_id(self, id: str) -> Optional[Dict[str, Any]]:
        return await self.get_organization(id)

    async def update(self, id: str, data: Dict[str, Any]) -> bool:
        return await self.update_organization(id, data)

    async def delete(self, id: str) -> bool:
        return await self.delete_organization(id)

    async def create_organization(self, org_data: Dict[str, Any]) -> str:
        """
        Cria uma nova organização no banco de dados.

        Args:
            org_data: Dicionário contendo 'cnpj' e 'nome'.

        Returns:
            O ID da organização criada como string.
        """
        db = await get_db()
        result = await db[self.collection_name].insert_one(org_data)
        logger.info(f"Organização criada com ID: {result.inserted_id}")
        return str(result.inserted_id)

    async def get_organization(self, org_id: str) -> Optional[Dict[str, Any]]:
        """
        Busca uma organização pelo seu ID.

        Args:
            org_id: ID da organização (string do ObjectId).

        Returns:
            Documento da organização ou None se não encontrada.
        """
        try:
            db = await get_db()
            return await db[self.collection_name].find_one({"_id": ObjectId(org_id)})
        except InvalidId:
            logger.warning(f"ID de organização inválido: {org_id}")
            return None

    async def find_by_cnpj(self, cnpj: str) -> Optional[Dict[str, Any]]:
        """
        Busca uma organização pelo CNPJ.

        Args:
            cnpj: CNPJ da organização.

        Returns:
            Documento da organização ou None se não encontrada.
        """
        db = await get_db()
        return await db[self.collection_name].find_one({"cnpj": cnpj})

    async def find_by_code(self, code: str) -> Optional[Dict[str, Any]]:
        """
        Busca uma organização por código curto ou CNPJ.

        Args:
            code: Código da organização (ex.: EMP001) ou CNPJ.

        Returns:
            Documento da organização ou None.
        """
        raw = (code or "").strip()
        if not raw:
            return None

        codigo = raw.upper()
        cnpj_digits = re.sub(r"\D", "", raw)
        db = await get_db()

        or_filters: List[Dict[str, Any]] = [{"codigo": codigo}]
        if cnpj_digits:
            or_filters.append({"cnpj": cnpj_digits})
        if raw != cnpj_digits:
            or_filters.append({"cnpj": raw})

        return await db[self.collection_name].find_one({"$or": or_filters})

    async def list_organizations(self, limit: int = 100) -> List[Dict[str, Any]]:
        """
        Lista todas as organizações cadastradas.

        Args:
            limit: Número máximo de resultados (padrão: 100).

        Returns:
            Lista de documentos de organizações.
        """
        db = await get_db()
        cursor = db[self.collection_name].find()
        return await cursor.to_list(length=limit)

    async def update_organization(self, org_id: str, update_data: Dict[str, Any]) -> bool:
        """
        Atualiza os dados de uma organização.

        Args:
            org_id: ID da organização.
            update_data: Campos a serem atualizados.

        Returns:
            True se a atualização foi bem-sucedida, False caso contrário.
        """
        try:
            db = await get_db()
            result = await db[self.collection_name].update_one(
                {"_id": ObjectId(org_id)},
                {"$set": update_data}
            )
            return result.modified_count > 0
        except InvalidId:
            logger.warning(f"ID de organização inválido para atualização: {org_id}")
            return False

    async def delete_organization(self, org_id: str) -> bool:
        """
        Remove uma organização do banco de dados.

        Args:
            org_id: ID da organização.

        Returns:
            True se a remoção foi bem-sucedida, False caso contrário.
        """
        try:
            db = await get_db()
            result = await db[self.collection_name].delete_one({"_id": ObjectId(org_id)})
            return result.deleted_count > 0
        except InvalidId:
            logger.warning(f"ID de organização inválido para remoção: {org_id}")
            return False
