from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks
from typing import List, Dict, Any
from app.models.base import Respostas, Usuario, RespostaItem
from app.repositories.respostas import RespostasRepo
from app.repositories.questionarios import QuestionariosRepo, PerguntasRepo
from app.repositories.diagnosticos import DiagnosticosRepo
from app.services.diagnostico_service import DiagnosticoService
from app.routers.deps import get_current_active_user

router = APIRouter(prefix="/respostas", tags=["respostas"])

async def run_diagnostic_calculation(anon_id: str, q_id: str, respostas: List[RespostaItem]):
    """
    Background task to calculate and save diagnostic.
    """
    try:
        # 1. Fetch needed data
        q_repo = QuestionariosRepo()
        questionario = await q_repo.get_by_id(q_id)
        
        p_repo = PerguntasRepo()
        perguntas = await p_repo.get_questions(q_id)
        
        # 2. Calculate
        service = DiagnosticoService()
        diagnostico = service.calculate_score(respostas, questionario, perguntas)
        diagnostico.anonId = anon_id # Ensure ID matches
        
        # 3. Save
        d_repo = DiagnosticosRepo()
        # Create dict from Pydantic
        diag_data = diagnostico.model_dump()
        # Convert objects to strs for MongoDB insertion if needed, or let Driver handle
        # The repo uses insert_one.
        
        await d_repo.create_diagnostico(diag_data)
        
    except Exception as e:
        print(f"Error calculating diagnostic: {e}")
        # In production: Log error properly

@router.post("/", status_code=status.HTTP_201_CREATED)
async def submit_respostas(
    submission: Respostas,
    background_tasks: BackgroundTasks,
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
        
    # 4. Trigger Diagnostic Calculation
    # We pass the pydantic objects to the background task
    background_tasks.add_task(
        run_diagnostic_calculation, 
        anon_id, 
        q_id, 
        submission.respostas
    )
    
    return {"message": "Respostas salvas com sucesso. Diagnóstico em processamento."}
