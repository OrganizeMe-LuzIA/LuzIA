import json
import logging
from typing import Any, Optional

from app.core.config import settings

logger = logging.getLogger(__name__)

try:
    import redis.asyncio as redis
except Exception:  # pragma: no cover
    redis = None


class CacheClient:
    def __init__(self) -> None:
        self._client = None

    async def _get_client(self):
        if redis is None:
            return None
        if self._client is None:
            self._client = redis.from_url(settings.REDIS_URL, decode_responses=True)
        return self._client

    async def get(self, key: str) -> Optional[Any]:
        client = await self._get_client()
        if client is None:
            return None
        try:
            payload = await client.get(key)
            return json.loads(payload) if payload else None
        except Exception as exc:
            logger.warning("Cache get falhou para %s: %s", key, exc)
            return None

    async def set(self, key: str, value: Any, ttl: Optional[int] = None) -> None:
        client = await self._get_client()
        if client is None:
            return
        expire = ttl if ttl is not None else settings.CACHE_TTL
        try:
            await client.set(key, json.dumps(value, default=str), ex=expire)
        except Exception as exc:
            logger.warning("Cache set falhou para %s: %s", key, exc)

    async def delete(self, key: str) -> None:
        client = await self._get_client()
        if client is None:
            return
        try:
            await client.delete(key)
        except Exception as exc:
            logger.warning("Cache delete falhou para %s: %s", key, exc)

    async def invalidate_pattern(self, pattern: str) -> int:
        client = await self._get_client()
        if client is None:
            return 0
        deleted = 0
        try:
            async for key in client.scan_iter(match=pattern):
                deleted += await client.delete(key)
        except Exception as exc:
            logger.warning("Cache invalidate_pattern falhou para %s: %s", pattern, exc)
        return deleted


cache = CacheClient()
