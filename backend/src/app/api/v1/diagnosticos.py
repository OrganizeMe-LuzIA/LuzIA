from fastapi import APIRouter, Depends, HTTPException, status
from typing import List, Dict, Any
from app.models.base import Usuario
from app.repositories.diagnosticos import DiagnosticosRepo
from app.api.deps import get_current_active_user

router = APIRouter(prefix="/diagnosticos", tags=["diagnosticos"])

@router.get("/me", response_model=List[Dict[str, Any]])
async def get_my_diagnosticos(
    current_user: Usuario = Depends(get_current_active_user)
) -> List[Dict[str, Any]]:
    """
    Retorna o histórico de diagnósticos do usuário autenticado.
    """
    repo = DiagnosticosRepo()
    
    # anonId do usuário logado
    anon_id = current_user.anonId
    
    if not anon_id:
        return []

    diags = await repo.get_by_anon_id(anon_id)
    
    # Serialize ObjectIds
    results = []
    for d in diags:
        d_dict = dict(d)
        d_dict["id"] = str(d_dict.pop("_id"))
        # Ensure idQuestionario is string
        if "idQuestionario" in d_dict:
            d_dict["idQuestionario"] = str(d_dict["idQuestionario"])
        results.append(d_dict)
        
    return results

@router.get("/{diag_id}", response_model=Dict[str, Any])
async def get_diagnostico_by_id(
    diag_id: str,
    current_user: Usuario = Depends(get_current_active_user)
) -> Dict[str, Any]:
    """
    Obtém um diagnóstico específico pelo ID.
    O usuário só pode ver seus próprios diagnósticos.
    """
    repo = DiagnosticosRepo()
    diag = await repo.get_by_id(diag_id)
    
    if not diag:
        raise HTTPException(status_code=404, detail="Diagnóstico não encontrado")
    
    # Check ownership (anonId matches)
    if diag.get("anonId") != current_user.anonId:
        raise HTTPException(status_code=403, detail="Acesso negado a este diagnóstico")
        
    diag["id"] = str(diag.pop("_id"))
    if "idQuestionario" in diag:
        diag["idQuestionario"] = str(diag["idQuestionario"])
        
    return diag
