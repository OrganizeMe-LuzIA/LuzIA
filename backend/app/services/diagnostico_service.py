from typing import List, Dict, Any, Optional
from app.models.base import RespostaItem, Diagnostico, DiagnosticoDimensao

class DiagnosticoService:
    def calculate_score(self, respostas: List[RespostaItem], questionario: Dict[str, Any], perguntas: List[Dict[str, Any]]) -> Diagnostico:
        # Map perguntas by ID for easy access
        perguntas_map = {p["idPergunta"]: p for p in perguntas}
        
        # Group answers by Domain/Dimension
        domain_scores = {} # (dominio, dimensao) -> [score_list]

        for resp in respostas:
            p = perguntas_map.get(resp.idPergunta)
            if not p:
                continue
            
            # Calculate value considering inversion
            val = resp.valor
            if p.get("itemInvertido", False):
                # Scale 0-4 becomes 4-0
                val = 4 - val
            
            key = (p["dominio"], p["dimensao"])
            if key not in domain_scores:
                domain_scores[key] = []
            domain_scores[key].append(val)
        
        # Calculate averages for each dimension
        dimensoes_result: List[DiagnosticoDimensao] = []
        total_sum = 0
        count_dims = 0

        for (dominio, dimensao), scores in domain_scores.items():
            avg = sum(scores) / len(scores)
            # Classification logic (Mock/Simple for now)
            # CoPsoQ usually compares with benchmarks. We will use simple threshold.
            classificacao = "medio_risco"
            if avg < 1.0: classificacao = "baixo_risco"
            elif avg > 3.0: classificacao = "alto_risco"
            
            # Identify risk (sinal) from questions. 
            # Simplified: Assuming all items in dimension have same 'sinal' or mixed.
            # Real implementation needs more robust logic.
            
            dimensoes_result.append(DiagnosticoDimensao(
                dominio=dominio,
                dimensao=dimensao,
                pontuacao=round(avg, 2),
                classificacao=classificacao
            ))
            total_sum += avg
            count_dims += 1

        global_score = total_sum / count_dims if count_dims > 0 else 0
        
        return Diagnostico(
            anonId="calculated", # Placeholder, filler caller sets it
            idQuestionario=questionario["_id"],
            resultadoGlobal="alto_risco" if global_score > 3 else "medio_risco" if global_score > 1 else "baixo_risco",
            pontuacaoGlobal=round(global_score, 2),
            dimensoes=dimensoes_result
        )
