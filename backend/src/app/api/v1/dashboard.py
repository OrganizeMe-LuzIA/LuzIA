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

router = APIRouter(prefix="/dashboard")
# Legacy routes kept for backward compatibility with older frontend bundles.
legacy_router = APIRouter()


@router.get(
    "/organizacoes",
    response_model=List[OrganizacaoDashboard],
    tags=["Dashboard"],
    summary="Lista todas as organizações",
    description="Retorna métricas agregadas de todas as organizações cadastradas",
    responses={
        200: {
            "description": "Lista de organizações com métricas",
            "content": {
                "application/json": {
                    "example": [
                        {
                            "id": "507f1f77bcf86cd799439011",
                            "cnpj": "12345678000190",
                            "nome": "Empresa Exemplo Ltda",
                            "total_setores": 5,
                            "total_usuarios": 120,
                            "usuarios_ativos": 98,
                            "questionarios_em_andamento": 2,
                            "taxa_conclusao": 75.5,
                        }
                    ]
                }
            },
        }
    },
)
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
@legacy_router.get("/setores", response_model=List[SetorDashboard])
async def listar_setores(
    org_id: Optional[str] = None,
    current_user: Usuario = Depends(get_current_admin_user),
) -> List[SetorDashboard]:
    _ = current_user
    service = DashboardService()
    return await service.list_setores(org_id=org_id)


@router.get("/setores/{setor_id}", response_model=SetorDetalhado)
@legacy_router.get("/setores/{setor_id}", response_model=SetorDetalhado)
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
@legacy_router.get("/usuarios/ativos", response_model=List[UsuarioAtivo])
async def listar_usuarios_ativos(
    org_id: Optional[str] = None,
    setor_id: Optional[str] = None,
    current_user: Usuario = Depends(get_current_admin_user),
) -> List[UsuarioAtivo]:
    _ = current_user
    service = DashboardService()
    return await service.list_usuarios_ativos(org_id=org_id, setor_id=setor_id)


@router.get("/usuarios/{user_id}/progresso", response_model=ProgressoUsuario)
@legacy_router.get("/usuarios/{user_id}/progresso", response_model=ProgressoUsuario)
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
@legacy_router.get("/questionarios/status", response_model=List[QuestionarioStatus])
async def status_questionarios(
    current_user: Usuario = Depends(get_current_admin_user),
) -> List[QuestionarioStatus]:
    _ = current_user
    service = DashboardService()
    return await service.list_questionarios_status()


@router.get("/questionarios/{questionario_id}/metricas", response_model=QuestionarioMetricas)
@legacy_router.get("/questionarios/{questionario_id}/metricas", response_model=QuestionarioMetricas)
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


@router.get(
    "/overview",
    response_model=DashboardOverview,
    tags=["Dashboard"],
    summary="Resumo executivo do dashboard",
    description="Retorna indicadores gerais agregados do sistema.",
)
@legacy_router.get(
    "/overview",
    response_model=DashboardOverview,
    tags=["Dashboard"],
    summary="Resumo executivo do dashboard (legacy)",
    description="Rota mantida para compatibilidade com frontend antigo.",
)
async def dashboard_overview(
    current_user: Usuario = Depends(get_current_admin_user),
) -> DashboardOverview:
    _ = current_user
    service = DashboardService()
    return await service.get_overview()
