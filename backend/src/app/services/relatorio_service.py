from typing import List, Dict, Any
from app.models.base import Relatorio, RelatorioMetricas, Diagnostico

class RelatorioService: 
    def generate_relatorio(
        self, 
        diagnosticos: List[Dict[str, Any]], 
        questionario_id: Any,
        tipo: str,
        org_id: Any = None,
        setor_id: Any = None,
        gerado_por: str = "system"
    ) -> Relatorio:
        
        if not diagnosticos:
            # Empty report
            return Relatorio(
                idQuestionario=questionario_id,
                idOrganizacao=org_id,
                idSetor=setor_id,
                tipoRelatorio=tipo,
                geradoPor=gerado_por,
                metricas=RelatorioMetricas(mediaRiscoGlobal=0, indiceProtecao=0, totalRespondentes=0),
                dominios=[],
                recomendacoes=["Sem dados suficientes."]
            )

        total_respondentes = len(diagnosticos)
        soma_risco_global = sum(d["pontuacaoGlobal"] for d in diagnosticos)
        media_risco_global = soma_risco_global / total_respondentes

        # Calculate Protection Index (Mock: inverted risk for simplicity)
        indice_protecao = 100 - (media_risco_global * 25) # Scale 0-4 to 0-100 inverted

        return Relatorio(
            idQuestionario=questionario_id,
            idOrganizacao=org_id,
            idSetor=setor_id,
            tipoRelatorio=tipo,
            geradoPor=gerado_por,
            metricas=RelatorioMetricas(
                mediaRiscoGlobal=round(media_risco_global, 2),
                indiceProtecao=round(indice_protecao, 2),
                totalRespondentes=total_respondentes
            ),
            dominios=[], # Detailed domain aggregation deferred for brevity
            recomendacoes=["Promover ações de bem-estar."] if media_risco_global > 2 else ["Manter ações atuais."]
        )
