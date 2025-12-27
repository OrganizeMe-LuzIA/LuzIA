from motor.motor_asyncio import AsyncIOMotorClient
import os
from typing import Optional

# Variável global para armazenar a conexão com o MongoDB
_client: Optional[AsyncIOMotorClient] = None

def get_client() -> AsyncIOMotorClient:
    """
    Retorna uma instância do cliente MongoDB, criando uma nova se necessário.
    """
    global _client
    if _client is None:
        mongo_uri = os.getenv("MONGO_URI", "mongodb://localhost:27017")
        _client = AsyncIOMotorClient(mongo_uri)
    return _client

async def get_db():
    """
    Retorna o banco de dados configurado.
    """
    client = get_client()
    db_name = os.getenv("MONGO_DB_NAME", "LuzIA")
    return client[db_name]

async def close_db():
    """
    Fecha a conexão com o MongoDB.
    """
    global _client
    if _client:
        _client.close()
        _client = None
