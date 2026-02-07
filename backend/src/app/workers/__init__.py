from celery import Celery

from app.core.config import settings

celery_app = Celery(
    "luzia_workers",
    broker=settings.CELERY_BROKER_URL,
    backend=settings.CELERY_RESULT_BACKEND,
)

celery_app.conf.update(
    task_serializer="json",
    result_serializer="json",
    accept_content=["json"],
    timezone="America/Sao_Paulo",
    enable_utc=True,
)

# Registra módulos de tasks para auto-discovery.
celery_app.autodiscover_tasks(["app.workers"])

