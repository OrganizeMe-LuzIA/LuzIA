import asyncio
from typing import List

from app.core.database import connect_to_mongo, db
from app.models.base import RespostaItem
from app.repositories.diagnosticos import DiagnosticosRepo
from app.repositories.perguntas import PerguntasRepo
from app.repositories.questionarios import QuestionariosRepo
from app.repositories.respostas import RespostasRepo
from app.services.diagnostico_service import DiagnosticoService
from app.workers import celery_app


async def _ensure_db_connection() -> None:
    if db.client is None:
        await connect_to_mongo()


def _run(coro):
    return asyncio.run(coro)


async def _calculate_diagnostico_async(anon_id: str, questionario_id: str) -> str:
    await _ensure_db_connection()
    respostas_repo = RespostasRepo()
    q_repo = QuestionariosRepo()
    d_repo = DiagnosticosRepo()

    respostas_doc = await respostas_repo.get_answers(anon_id, questionario_id)
    if not respostas_doc:
        return "sem_respostas"

    questionario = await q_repo.get_by_id(questionario_id)
    if not questionario:
        return "questionario_nao_encontrado"

    perguntas = await PerguntasRepo().get_questions(questionario_id)
    respostas = [RespostaItem(**r) for r in respostas_doc.get("respostas", [])]

    service = DiagnosticoService()
    diagnostico = service.calculate_score(
        respostas=respostas,
        questionario=questionario,
        perguntas=perguntas,
    )
    diagnostico.anonId = anon_id
    await d_repo.create_diagnostico(diagnostico.model_dump())
    return "ok"


@celery_app.task(name="calculate_diagnostico")
def calculate_diagnostico(anon_id: str, questionario_id: str) -> str:
    return _run(_calculate_diagnostico_async(anon_id, questionario_id))


@celery_app.task(name="batch_calculate_diagnosticos")
def batch_calculate_diagnosticos(anon_ids: List[str], questionario_id: str) -> dict:
    resultados = {"ok": 0, "erro": 0}
    for anon_id in anon_ids:
        try:
            status = _run(_calculate_diagnostico_async(anon_id, questionario_id))
            if status == "ok":
                resultados["ok"] += 1
            else:
                resultados["erro"] += 1
        except Exception:
            resultados["erro"] += 1
    return resultados
