import asyncio
from typing import Optional

from app.core.database import connect_to_mongo, db
from app.repositories.diagnosticos import DiagnosticosRepo
from app.repositories.relatorios import RelatoriosRepo
from app.repositories.usuarios import UsuariosRepo
from app.services.relatorio_service import RelatorioService
from app.workers import celery_app


async def _ensure_db_connection() -> None:
    if db.client is None:
        await connect_to_mongo()


def _run(coro):
    return asyncio.run(coro)


async def _generate_report_async(
    questionario_id: str,
    org_id: str,
    setor_id: Optional[str],
    tipo: str,
    gerado_por: str,
) -> Optional[str]:
    await _ensure_db_connection()
    u_repo = UsuariosRepo()
    d_repo = DiagnosticosRepo()
    r_repo = RelatoriosRepo()
    service = RelatorioService()

    users = await u_repo.list_users_by_org(org_id, setor_id)
    anon_ids = [u.get("anonId") for u in users if u.get("anonId")]
    if not anon_ids:
        return None

    diagnosticos = await d_repo.find_by_anon_ids(anon_ids, questionario_id)
    if not diagnosticos:
        return None

    latest_diag_map = {}
    for d in diagnosticos:
        aid = d.get("anonId")
        if aid and aid not in latest_diag_map:
            latest_diag_map[aid] = d
    clean_diags = list(latest_diag_map.values())

    relatorio = service.generate_relatorio(
        clean_diags,
        questionario_id,
        tipo,
        org_id,
        setor_id,
        gerado_por=gerado_por,
    )
    relatorio_id = await r_repo.create_relatorio(relatorio.model_dump())
    return relatorio_id


@celery_app.task(name="generate_organizational_report")
def generate_organizational_report(
    questionario_id: str,
    org_id: str,
    gerado_por: str = "system",
) -> Optional[str]:
    return _run(
        _generate_report_async(
            questionario_id=questionario_id,
            org_id=org_id,
            setor_id=None,
            tipo="organizacional",
            gerado_por=gerado_por,
        )
    )


@celery_app.task(name="generate_sector_report")
def generate_sector_report(
    questionario_id: str,
    setor_id: str,
    org_id: str,
    gerado_por: str = "system",
) -> Optional[str]:
    return _run(
        _generate_report_async(
            questionario_id=questionario_id,
            org_id=org_id,
            setor_id=setor_id,
            tipo="setorial",
            gerado_por=gerado_por,
        )
    )

