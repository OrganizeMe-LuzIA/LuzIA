"""
Repositório para gerenciamento de usuários.
"""
from typing import Optional, Dict, Any, List
from app.core.database import get_db
from app.repositories.base_repository import BaseRepository
from bson import ObjectId
from bson.errors import InvalidId
from datetime import datetime
import logging

logger = logging.getLogger(__name__)


class UsuariosRepo(BaseRepository[Dict[str, Any]]):
    """Gerencia operações CRUD para a coleção de usuários."""

    def __init__(self):
        self.collection_name = "usuarios"

    def _ensure_object_id(self, data: Dict[str, Any], field: str) -> None:
        """Converte um campo string para ObjectId se necessário."""
        if field in data and isinstance(data[field], str):
            data[field] = ObjectId(data[field])

    async def find_by_phone(self, phone: str) -> Optional[Dict[str, Any]]:
        """
        Busca um usuário pelo número de telefone.

        Args:
            phone: Número de telefone no formato E.164.

        Returns:
            Documento do usuário ou None.
        """
        db = await get_db()
        return await db[self.collection_name].find_one({"telefone": phone})

    async def find_by_email(self, email: str) -> Optional[Dict[str, Any]]:
        """
        Busca um usuário pelo email.

        Args:
            email: Email do usuário.

        Returns:
            Documento do usuário ou None.
        """
        db = await get_db()
        return await db[self.collection_name].find_one({"email": email.strip().lower()})

    async def find_by_anon_id(self, anon_id: str) -> Optional[Dict[str, Any]]:
        """
        Busca um usuário pelo seu ID anônimo.

        Args:
            anon_id: ID anônimo do usuário.

        Returns:
            Documento do usuário ou None.
        """
        db = await get_db()
        return await db[self.collection_name].find_one({"anonId": anon_id})

    async def create_user(self, user_data: Dict[str, Any]) -> str:
        """
        Cria um novo usuário.

        Args:
            user_data: Dicionário contendo dados do usuário.

        Returns:
            ID do usuário criado como string.
        """
        db = await get_db()
        
        # Converte IDs para ObjectId
        self._ensure_object_id(user_data, "idOrganizacao")
        self._ensure_object_id(user_data, "idSetor")

        # Normaliza email se presente
        if isinstance(user_data.get("email"), str):
            user_data["email"] = user_data["email"].strip().lower()

        # Adiciona data de cadastro se não existir
        user_data.setdefault("dataCadastro", datetime.utcnow())
        user_data.setdefault("status", "aguardando_confirmacao")
        user_data.setdefault("respondido", False)

        result = await db[self.collection_name].insert_one(user_data)
        logger.info(f"Usuário criado com ID: {result.inserted_id}")
        return str(result.inserted_id)

    async def update_chat_state(self, phone: str, state_update: Dict[str, Any]) -> bool:
        """
        Atualiza o estado da conversa do bot armazenado em 'metadata'.

        Args:
            phone: Número de telefone do usuário.
            state_update: Dados do estado a serem atualizados.

        Returns:
            True se a atualização foi bem-sucedida.
        """
        db = await get_db()
        result = await db[self.collection_name].update_one(
            {"telefone": phone},
            {"$set": {"metadata.chat_state": state_update}}
        )
        return result.modified_count > 0

    async def update_status(self, phone: str, status: str) -> bool:
        """
        Atualiza o status de um usuário.

        Args:
            phone: Número de telefone do usuário.
            status: Novo status (ativo, inativo, aguardando_confirmacao).

        Returns:
            True se a atualização foi bem-sucedida.
        """
        db = await get_db()
        result = await db[self.collection_name].update_one(
            {"telefone": phone},
            {"$set": {"status": status, "ultimoAcesso": datetime.utcnow()}}
        )
        return result.modified_count > 0

    async def mark_as_responded(self, phone: str) -> bool:
        """
        Marca o usuário como tendo respondido ao questionário.

        Args:
            phone: Número de telefone do usuário.

        Returns:
            True se a atualização foi bem-sucedida.
        """
        db = await get_db()
        result = await db[self.collection_name].update_one(
            {"telefone": phone},
            {"$set": {"respondido": True, "ultimoAcesso": datetime.utcnow()}}
        )
        return result.modified_count > 0

    async def list_users_by_org(
        self, org_id: str, setor_id: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        """
        Lista usuários de uma organização, opcionalmente filtrados por setor.

        Args:
            org_id: ID da organização.
            setor_id: ID do setor (opcional).

        Returns:
            Lista de usuários.
        """
        try:
            db = await get_db()
            query: Dict[str, Any] = {"idOrganizacao": ObjectId(org_id)}
            if setor_id:
                query["idSetor"] = ObjectId(setor_id)

            cursor = db[self.collection_name].find(query)
            return await cursor.to_list(length=1000)
        except InvalidId as e:
            logger.warning(f"ID inválido: {e}")
            return []

    async def update_org_setor(
        self,
        phone: str,
        org_id: str,
        setor_id: str,
        unidade: Optional[str] = None,
    ) -> bool:
        """
        Atualiza organização, setor e unidade do usuário.

        Args:
            phone: Número de telefone do usuário.
            org_id: ID da organização.
            setor_id: ID do setor.
            unidade: Número da unidade (opcional).

        Returns:
            True se a atualização foi bem-sucedida.
        """
        try:
            update: Dict[str, Any] = {
                "idOrganizacao": ObjectId(org_id),
                "idSetor": ObjectId(setor_id),
            }
            if unidade:
                update["numeroUnidade"] = unidade
            else:
                update["numeroUnidade"] = None

            db = await get_db()
            result = await db[self.collection_name].update_one(
                {"telefone": phone},
                {"$set": update},
            )
            return result.modified_count > 0
        except InvalidId as e:
            logger.warning(f"ID inválido ao atualizar organização/setor do usuário: {e}")
            return False

    async def delete_user(self, phone: str) -> bool:
        """
        Remove um usuário pelo número de telefone.

        Args:
            phone: Número de telefone do usuário.

        Returns:
            True se a remoção foi bem-sucedida.
        """
        db = await get_db()
        result = await db[self.collection_name].delete_one({"telefone": phone})
        return result.deleted_count > 0
    async def create(self, data: Dict[str, Any]) -> str:
        return await self.create_user(data)

    async def get_by_id(self, id: str) -> Optional[Dict[str, Any]]:
        try:
            db = await get_db()
            return await db[self.collection_name].find_one({"_id": ObjectId(id)})
        except InvalidId:
            logger.warning(f"ID de usuário inválido: {id}")
            return None

    async def update(self, id: str, data: Dict[str, Any]) -> bool:
        try:
            db = await get_db()
            result = await db[self.collection_name].update_one(
                {"_id": ObjectId(id)},
                {"$set": data},
            )
            return result.modified_count > 0
        except InvalidId:
            logger.warning(f"ID de usuário inválido para atualização: {id}")
            return False

    async def delete(self, id: str) -> bool:
        try:
            db = await get_db()
            result = await db[self.collection_name].delete_one({"_id": ObjectId(id)})
            return result.deleted_count > 0
        except InvalidId:
            logger.warning(f"ID de usuário inválido para remoção: {id}")
            return False
