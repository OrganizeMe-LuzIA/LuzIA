"""
Interface base para repositories.
"""
from abc import ABC, abstractmethod
from typing import Any, Dict, Generic, Optional, TypeVar

T = TypeVar("T")


class BaseRepository(ABC, Generic[T]):
    """Contrato CRUD mínimo para repositories."""

    @abstractmethod
    async def create(self, data: Dict[str, Any]) -> str:
        """Cria um novo documento e retorna o ID."""

    @abstractmethod
    async def get_by_id(self, id: str) -> Optional[T]:
        """Busca um documento por ID."""

    @abstractmethod
    async def update(self, id: str, data: Dict[str, Any]) -> bool:
        """Atualiza um documento por ID."""

    @abstractmethod
    async def delete(self, id: str) -> bool:
        """Remove um documento por ID."""
