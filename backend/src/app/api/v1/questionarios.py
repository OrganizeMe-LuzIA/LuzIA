from fastapi import APIRouter, Depends, HTTPException, status
from typing import List, Dict, Any
from app.models.base import Usuario
from app.repositories.questionarios import QuestionariosRepo, PerguntasRepo
from app.routers.deps import get_current_active_user, get_current_admin_user

router = APIRouter(prefix="/questionarios", tags=["questionarios"])

@router.get("/", response_model=List[Dict[str, Any]])
async def list_questionarios(
    current_user: Usuario = Depends(get_current_active_user)
) -> List[Dict[str, Any]]:
    """
    Lista todos os questionários ativos.
    """
    repo = QuestionariosRepo()
    qs = await repo.list_questionnaires()
    
    # Serialize ObjectId
    results = []
    for q in qs:
        q_dict = dict(q)
        q_dict["id"] = str(q_dict.pop("_id"))
        results.append(q_dict)
        
    return results

@router.get("/{q_id}", response_model=Dict[str, Any])
async def get_questionario(
    q_id: str,
    current_user: Usuario = Depends(get_current_active_user)
) -> Dict[str, Any]:
    """
    Obtém detalhes de um questionário específico.
    """
    repo = QuestionariosRepo()
    q = await repo.get_by_id(q_id)
    if not q:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Questionário não encontrado"
        )
    
    q["id"] = str(q.pop("_id"))
    return q

@router.get("/{q_id}/perguntas", response_model=List[Dict[str, Any]])
async def list_perguntas(
    q_id: str,
    current_user: Usuario = Depends(get_current_active_user)
) -> List[Dict[str, Any]]:
    """
    Lista todas as perguntas de um questionário.
    """
    # 1. Verificar se questionário existe
    q_repo = QuestionariosRepo()
    q = await q_repo.get_by_id(q_id)
    if not q:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Questionário não encontrado"
        )
        
    # 2. Buscar perguntas
    p_repo = PerguntasRepo()
    perguntas = await p_repo.get_questions(q_id)
    
    results = []
    for p in perguntas:
        p_dict = dict(p)
        p_dict["id"] = str(p_dict.pop("_id"))
        p_dict["idQuestionario"] = str(p_dict["idQuestionario"])
        results.append(p_dict)
        
    return results

# TODO: Implementar POST (Create) se necessário no futuro (requer update no Repository)
