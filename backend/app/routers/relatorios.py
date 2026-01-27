from fastapi import APIRouter, Depends, HTTPException, status
from typing import List, Dict, Any, Optional
from pydantic import BaseModel
from app.models.base import Usuario
from app.repositories.relatorios import RelatoriosRepo
from app.repositories.usuarios import UsuariosRepo
from app.repositories.diagnosticos import DiagnosticosRepo
from app.services.relatorio_service import RelatorioService
from app.routers.deps import get_current_admin_user

router = APIRouter(prefix="/relatorios", tags=["relatorios"])

class GerarRelatorioRequest(BaseModel):
    idQuestionario: str
    idOrganizacao: str
    idSetor: Optional[str] = None
    tipo: str # "organizacional" ou "setorial"

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
        
    rel["id"] = str(rel.pop("_id"))
    # Converter ObjectIds para string
    for field in ["idQuestionario", "idOrganizacao", "idSetor"]:
        if field in rel and rel[field]:
            rel[field] = str(rel[field])
            
    return rel
