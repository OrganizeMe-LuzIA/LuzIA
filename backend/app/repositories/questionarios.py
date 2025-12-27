from typing import Optional, List, Dict, Any
from app.db import get_db

class QuestionariosRepo:
    def __init__(self):
        self.collection_name = "questionarios"

    async def get_active_questionnaire(self, name: str = "CoPsoQ II") -> Optional[Dict[str, Any]]:
        db = await get_db()
        return await db[self.collection_name].find_one({"nome": name, "ativo": True})

    async def get_questions(self, id_questionario: str) -> List[Dict[str, Any]]:
        db = await get_db()
        from bson import ObjectId
        q_id = ObjectId(id_questionario) if isinstance(id_questionario, str) else id_questionario
        cursor = db["perguntas"].find({"idQuestionario": q_id}).sort("ordem", 1)
        return await cursor.to_list(length=100)
