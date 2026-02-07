from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, status

from app.api.deps import get_current_admin_user
from app.models.base import Usuario
from app.models.dashboard import (
    DashboardOverview,
    OrganizacaoDashboard,
    OrganizacaoDetalhada,
    ProgressoUsuario,
    QuestionarioMetricas,
    QuestionarioStatus,
    SetorDashboard,
    SetorDetalhado,
    UsuarioAtivo,
)
from app.services.dashboard_service import DashboardService

router = APIRouter()


@router.get("/organizacoes", response_model=List[OrganizacaoDashboard])
async def listar_organizacoes(
    current_user: Usuario = Depends(get_current_admin_user),
) -> List[OrganizacaoDashboard]:
    _ = current_user
    service = DashboardService()
    return await service.list_organizacoes()


@router.get("/organizacoes/{org_id}", response_model=OrganizacaoDetalhada)
async def detalhes_organizacao(
    org_id: str,
    current_user: Usuario = Depends(get_current_admin_user),
) -> OrganizacaoDetalhada:
    _ = current_user
    service = DashboardService()
    result = await service.get_organizacao_detalhada(org_id)
    if not result:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Organização não encontrada",
        )
    return result


@router.get("/setores", response_model=List[SetorDashboard])
async def listar_setores(
    org_id: Optional[str] = None,
    current_user: Usuario = Depends(get_current_admin_user),
) -> List[SetorDashboard]:
    _ = current_user
    service = DashboardService()
    return await service.list_setores(org_id=org_id)


@router.get("/setores/{setor_id}", response_model=SetorDetalhado)
async def detalhes_setor(
    setor_id: str,
    current_user: Usuario = Depends(get_current_admin_user),
) -> SetorDetalhado:
    _ = current_user
    service = DashboardService()
    result = await service.get_setor_detalhado(setor_id)
    if not result:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Setor não encontrado",
        )
    return result


@router.get("/usuarios/ativos", response_model=List[UsuarioAtivo])
async def listar_usuarios_ativos(
    org_id: Optional[str] = None,
    setor_id: Optional[str] = None,
    current_user: Usuario = Depends(get_current_admin_user),
) -> List[UsuarioAtivo]:
    _ = current_user
    service = DashboardService()
    return await service.list_usuarios_ativos(org_id=org_id, setor_id=setor_id)


@router.get("/usuarios/{user_id}/progresso", response_model=ProgressoUsuario)
async def progresso_usuario(
    user_id: str,
    current_user: Usuario = Depends(get_current_admin_user),
) -> ProgressoUsuario:
    _ = current_user
    service = DashboardService()
    result = await service.get_usuario_progresso(user_id)
    if not result:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Usuário não encontrado",
        )
    return result


@router.get("/questionarios/status", response_model=List[QuestionarioStatus])
async def status_questionarios(
    current_user: Usuario = Depends(get_current_admin_user),
) -> List[QuestionarioStatus]:
    _ = current_user
    service = DashboardService()
    return await service.list_questionarios_status()


@router.get("/questionarios/{questionario_id}/metricas", response_model=QuestionarioMetricas)
async def metricas_questionario(
    questionario_id: str,
    current_user: Usuario = Depends(get_current_admin_user),
) -> QuestionarioMetricas:
    _ = current_user
    service = DashboardService()
    result = await service.get_questionario_metricas(questionario_id)
    if not result:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Questionário não encontrado",
        )
    return result


@router.get("/overview", response_model=DashboardOverview)
async def dashboard_overview(
    current_user: Usuario = Depends(get_current_admin_user),
) -> DashboardOverview:
    _ = current_user
    service = DashboardService()
    return await service.get_overview()

