"""
Repositório para gerenciamento de usuários.
"""
from typing import Optional, Dict, Any, List
from app.db import get_db
from bson import ObjectId
from bson.errors import InvalidId
from datetime import datetime
import logging

logger = logging.getLogger(__name__)


class UsuariosRepo:
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
