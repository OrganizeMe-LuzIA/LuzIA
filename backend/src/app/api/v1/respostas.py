from fastapi import APIRouter, Depends, HTTPException, status
from app.models.base import Respostas, Usuario
from app.repositories.respostas import RespostasRepo
from app.repositories.questionarios import QuestionariosRepo
from app.workers.diagnostico_tasks import calculate_diagnostico
from app.api.deps import get_current_active_user

router = APIRouter(prefix="/respostas", tags=["respostas"])

@router.post("/", status_code=status.HTTP_201_CREATED)
async def submit_respostas(
    submission: Respostas,
    current_user: Usuario = Depends(get_current_active_user)
):
    """
    Recebe um lote de respostas.
    - Sobrescreve respostas anteriores para o mesmo questionário.
    - Dispara cálculo de diagnóstico em background.
    """
    # 1. Validate Questionnaire
    q_repo = QuestionariosRepo()
    q_id = str(submission.idQuestionario)
    if not await q_repo.get_by_id(q_id):
        raise HTTPException(status_code=404, detail="Questionnaire not found")
        
    # 2. Force identity
    anon_id = current_user.anonId
    
    # 3. Save Answers
    repo = RespostasRepo()
    
    # Convert Pydantic list to list of dicts
    respostas_dict = [r.model_dump() for r in submission.respostas]
    
    success = await repo.save_all_answers(anon_id, q_id, respostas_dict)
    
    if not success:
        raise HTTPException(status_code=500, detail="Failed to save answers")
        
    # 4. Trigger Diagnostic Calculation (Celery)
    task = calculate_diagnostico.delay(anon_id=anon_id, questionario_id=q_id)

    return {
        "message": "Respostas salvas com sucesso. Diagnóstico em processamento.",
        "task_id": task.id,
    }
