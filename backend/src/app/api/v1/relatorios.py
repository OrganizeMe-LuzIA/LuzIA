import io
from enum import Enum
from fastapi import APIRouter, Depends, HTTPException, Query, status
from fastapi.encoders import jsonable_encoder
from fastapi.responses import StreamingResponse
from typing import List, Dict, Any, Optional
from pydantic import BaseModel
from app.models.base import Usuario
from app.repositories.relatorios import RelatoriosRepo
from app.repositories.usuarios import UsuariosRepo
from app.repositories.diagnosticos import DiagnosticosRepo
from app.services.relatorio_export_service import RelatorioExportService
from app.services.relatorio_service import RelatorioService
from app.workers.relatorio_tasks import generate_organizational_report, generate_sector_report
from app.api.deps import get_current_admin_user

router = APIRouter(prefix="/relatorios", tags=["relatorios"])

class GerarRelatorioRequest(BaseModel):
    idQuestionario: str
    idOrganizacao: str
    idSetor: Optional[str] = None
    tipo: str # "organizacional" ou "setorial"


class ExportFormat(str, Enum):
    PDF = "pdf"
    CSV = "csv"
    EXCEL = "excel"


def _stringify_id(value: Any) -> Optional[str]:
    if value is None:
        return None
    raw = str(value).strip()
    return raw if raw else None


def _count_dimensoes(relatorio: Dict[str, Any]) -> int:
    total = 0
    for dominio in relatorio.get("dominios") or []:
        total += len(dominio.get("dimensoes") or [])
    return total


def _serialize_relatorio(relatorio_doc: Dict[str, Any], include_full_payload: bool) -> Dict[str, Any]:
    encoded = jsonable_encoder(relatorio_doc)
    result: Dict[str, Any] = {
        "id": _stringify_id(encoded.pop("_id", None)),
        "idQuestionario": _stringify_id(encoded.get("idQuestionario")),
        "idOrganizacao": _stringify_id(encoded.get("idOrganizacao")),
        "idSetor": _stringify_id(encoded.get("idSetor")),
        "tipoRelatorio": encoded.get("tipoRelatorio"),
        "geradoPor": encoded.get("geradoPor"),
        "dataGeracao": encoded.get("dataGeracao"),
        "metricas": encoded.get("metricas") or {},
        "totalDominios": len(encoded.get("dominios") or []),
        "totalDimensoes": _count_dimensoes(encoded),
    }

    if include_full_payload:
        result.update(
            {
                "dominios": encoded.get("dominios") or [],
                "recomendacoes": encoded.get("recomendacoes") or [],
                "observacoes": encoded.get("observacoes"),
            }
        )

    return result


@router.get("", response_model=List[Dict[str, Any]])
async def listar_relatorios(
    questionario_id: Optional[str] = Query(default=None),
    org_id: Optional[str] = Query(default=None),
    setor_id: Optional[str] = Query(default=None),
    tipo: Optional[str] = Query(default=None),
    limit: int = Query(default=20, ge=1, le=200),
    current_user: Usuario = Depends(get_current_admin_user),
) -> List[Dict[str, Any]]:
    _ = current_user
    repo = RelatoriosRepo()
    relatorios = await repo.find_by_filters(
        questionario_id=questionario_id,
        org_id=org_id,
        setor_id=setor_id,
        tipo=tipo,
        limit=limit,
    )
    return [_serialize_relatorio(item, include_full_payload=False) for item in relatorios]

@router.post("/gerar", status_code=status.HTTP_201_CREATED)
async def gerar_relatorio(
    req: GerarRelatorioRequest,
    current_user: Usuario = Depends(get_current_admin_user)
) -> Dict[str, Any]:
    """
    Gera um relatório consolidado a partir dos diagnósticos existentes.
    Agrega dados da organização ou setor especificado.
    """
    # 1. Buscar usuários do escopo (Org ou Setor)
    u_repo = UsuariosRepo()
    users = await u_repo.list_users_by_org(req.idOrganizacao, req.idSetor)
    
    if not users:
        raise HTTPException(status_code=404, detail="Nenhum usuário encontrado para os filtros informados.")
        
    anon_ids = [u["anonId"] for u in users if "anonId" in u]
    
    if not anon_ids:
        raise HTTPException(status_code=404, detail="Nenhum usuário com AnonID encontrado.")

    # 2. Buscar Diagnósticos desses usuários
    d_repo = DiagnosticosRepo()
    diagnosticos = await d_repo.find_by_anon_ids(anon_ids, req.idQuestionario)
    
    if not diagnosticos:
        raise HTTPException(status_code=404, detail="Nenhum diagnóstico encontrado para gerar o relatório.")

    # 3. Filtrar apenas o diagnóstico mais recente de cada usuário
    # A query find_by_anon_ids retorna ordenado por dataAnalise desc
    latest_diag_map = {}
    for d in diagnosticos:
        aid = d["anonId"]
        if aid not in latest_diag_map:
            latest_diag_map[aid] = d 
            
    clean_diags = list(latest_diag_map.values())

    # 4. Gerar Relatório usando Service
    service = RelatorioService()
    # O Pydantic Model Relatorio espera IDs (Any). O service gera o objeto Pydantic.
    relatorio = service.generate_relatorio(
        clean_diags, 
        req.idQuestionario, 
        req.tipo, 
        req.idOrganizacao, 
        req.idSetor,
        gerado_por=current_user.telefone # Identifica quem gerou
    )
    
    # 5. Salvar no Banco
    r_repo = RelatoriosRepo()
    # model_dump para dict
    rel_data = relatorio.model_dump()
    
    rid = await r_repo.create_relatorio(rel_data)
    
    return {
        "id": rid, 
        "message": f"Relatório gerado com sucesso base em {len(clean_diags)} diagnósticos."
    }


@router.post("/gerar-async", status_code=status.HTTP_202_ACCEPTED)
async def gerar_relatorio_async(
    req: GerarRelatorioRequest,
    current_user: Usuario = Depends(get_current_admin_user),
) -> Dict[str, Any]:
    """
    Dispara geração assíncrona de relatório via Celery.
    """
    if req.tipo == "setorial":
        if not req.idSetor:
            raise HTTPException(status_code=400, detail="idSetor é obrigatório para relatório setorial")
        task = generate_sector_report.delay(
            questionario_id=req.idQuestionario,
            setor_id=req.idSetor,
            org_id=req.idOrganizacao,
            gerado_por=current_user.telefone,
        )
    else:
        task = generate_organizational_report.delay(
            questionario_id=req.idQuestionario,
            org_id=req.idOrganizacao,
            gerado_por=current_user.telefone,
        )

    return {
        "task_id": task.id,
        "status": "queued",
        "message": "Geração de relatório enviada para processamento assíncrono.",
    }

@router.get("/{rel_id}", response_model=Dict[str, Any])
async def get_relatorio(
    rel_id: str,
    current_user: Usuario = Depends(get_current_admin_user)
) -> Dict[str, Any]:
    """
    Obtém um relatório pelo ID.
    """
    repo = RelatoriosRepo()
    rel = await repo.get_by_id(rel_id)
    
    if not rel:
        raise HTTPException(status_code=404, detail="Relatório não encontrado")

    return _serialize_relatorio(rel, include_full_payload=True)


@router.get("/{rel_id}/export")
async def exportar_relatorio(
    rel_id: str,
    format: ExportFormat = Query(default=ExportFormat.PDF),
    current_user: Usuario = Depends(get_current_admin_user),
) -> StreamingResponse:
    _ = current_user
    repo = RelatoriosRepo()
    relatorio = await repo.get_by_id(rel_id)
    if not relatorio:
        raise HTTPException(status_code=404, detail="Relatório não encontrado")

    serializado = _serialize_relatorio(relatorio, include_full_payload=True)
    service = RelatorioExportService()
    try:
        exported = service.export(serializado, format.value)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))
    except RuntimeError as exc:
        raise HTTPException(status_code=500, detail=str(exc))

    headers = {
        "Content-Disposition": f"attachment; filename=\"{exported['filename']}\"",
        "Cache-Control": "no-store",
    }
    return StreamingResponse(
        io.BytesIO(exported["payload"]),
        media_type=exported["media_type"],
        headers=headers,
    )
