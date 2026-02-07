from app.workers import celery_app

# Import side effects para registro de tasks.
from app.workers import diagnostico_tasks as _diagnostico_tasks  # noqa: F401
from app.workers import relatorio_tasks as _relatorio_tasks  # noqa: F401

