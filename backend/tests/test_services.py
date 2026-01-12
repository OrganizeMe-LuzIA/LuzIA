from app.services.diagnostico_service import DiagnosticoService
from app.services.relatorio_service import RelatorioService
from app.models.base import RespostaItem
import pytest

class TestServices:
    def test_calculate_score(self):
        service = DiagnosticoService()
        perguntas = [
            {"idPergunta": "p1", "dominio": "D1", "dimensao": "Dim1", "itemInvertido": False},
            {"idPergunta": "p2", "dominio": "D1", "dimensao": "Dim1", "itemInvertido": True}, # 0->4
        ]
        respostas = [
            RespostaItem(idPergunta="p1", valor=4),
            RespostaItem(idPergunta="p2", valor=0) # Inverted -> 4
        ]
        questionario = {"_id": "mock_id"}
        
        diag = service.calculate_score(respostas, questionario, perguntas)
        
        assert diag.pontuacaoGlobal == 4.0
        assert len(diag.dimensoes) == 1
        assert diag.dimensoes[0].pontuacao == 4.0

    def test_generate_report(self):
        service = RelatorioService()
        diagnosticos = [
            {"pontuacaoGlobal": 4.0},
            {"pontuacaoGlobal": 0.0}
        ]
        # Avg = 2.0
        
        rel = service.generate_relatorio(diagnosticos, "qid", "organizacional")
        
        assert rel.metricas.mediaRiscoGlobal == 2.0
        assert rel.metricas.totalRespondentes == 2
