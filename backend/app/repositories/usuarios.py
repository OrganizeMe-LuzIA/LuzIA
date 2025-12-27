from typing import Optional, Dict, Any, List
from app.db import get_db
from datetime import datetime
from bson import ObjectId
import logging

logger = logging.getLogger(__name__)

class UsuariosRepo:
    def __init__(self):
        self.collection_name = "usuarios"

    async def find_by_phone(self, phone: str) -> Optional[Dict[str, Any]]:
        db = await get_db()
        return await db[self.collection_name].find_one({"telefone": phone})

    async def create_user(self, user_data: Dict[str, Any]):
        db = await get_db()
        return await db[self.collection_name].insert_one(user_data)

    async def update_chat_state(self, phone: str, state_update: Dict[str, Any]):
        """
        Updates the bot state stored inside 'metadata'.
        """
        db = await get_db()
        return await db[self.collection_name].update_one(
            {"telefone": phone},
            {"$set": {"metadata.chat_state": state_update}}
        )

    async def push_answer(self, anon_id: str, id_questionario: str, id_pergunta: str, valor: int):
        """
        Pushes an answer to the 'respostas' array in the 'respostas' collection.
        This follows the nested structure defined in init_final.js.
        """
        db = await get_db()
        q_id = ObjectId(id_questionario) if isinstance(id_questionario, str) else id_questionario
        
        # We try to update an existing session for this user/questionnaire
        # If it doesn't exist, we'll need to create it (upsert)
        result = await db["respostas"].update_one(
            {"anonId": anon_id, "idQuestionario": q_id},
            {
                "$push": {"respostas": {"valor": valor, "idPergunta": id_pergunta}},
                "$set": {"data": datetime.utcnow()}
            },
            upsert=True
        )
        return result
