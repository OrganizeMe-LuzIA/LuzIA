from app.services.diagnostico_service import DiagnosticoService
from app.services.relatorio_service import RelatorioService
from app.models.base import RespostaItem
from app.services.copsoq_scoring_service import ClassificacaoTercil
import pytest

class TestServices:
    def test_calculate_score(self):
        service = DiagnosticoService()
        perguntas = [
            {
                "idPergunta": "p1",
                "codigoDominio": "OTC",
                "dominio": "Organização do Trabalho e Conteúdo",
                "dimensao": "Influência no trabalho",
                "itemInvertido": False,
                "sinal": "protecao",
            },
            {
                "idPergunta": "p2",
                "codigoDominio": "OTC",
                "dominio": "Organização do Trabalho e Conteúdo",
                "dimensao": "Influência no trabalho",
                "itemInvertido": False,
                "sinal": "protecao",
            },
        ]
        respostas = [
            RespostaItem(idPergunta="p1", valor=4),
            RespostaItem(idPergunta="p2", valor=4)
        ]
        questionario = {"_id": "mock_id", "codigo": "COPSOQ_CURTA_BR"}
        
        diag = service.calculate_score(respostas, questionario, perguntas)
        
        assert diag.resultadoGlobal == "favoravel"
        assert len(diag.dimensoes) == 1
        assert diag.dimensoes[0].pontuacao == 4.0
        assert diag.dimensoes[0].classificacao == ClassificacaoTercil.FAVORAVEL

    def test_generate_report(self):
        service = RelatorioService()
        diagnosticos = [
            {
                "dimensoes": [
                    {
                        "codigoDominio": "EL",
                        "dominio": "Exigências Laborais",
                        "dimensao": "Exigências quantitativas",
                        "pontuacao": 3.8,
                        "classificacao": "risco",
                        "sinal": "risco",
                    }
                ]
            },
            {
                "dimensoes": [
                    {
                        "codigoDominio": "EL",
                        "dominio": "Exigências Laborais",
                        "dimensao": "Exigências quantitativas",
                        "pontuacao": 3.6,
                        "classificacao": "intermediario",
                        "sinal": "risco",
                    }
                ]
            }
        ]
        
        rel = service.generate_relatorio(diagnosticos, "qid", "organizacional")
        
        assert len(rel.dominios) == 1
        assert rel.dominios[0].dimensoes[0].dimensao == "Exigências quantitativas"
        assert rel.dominios[0].dimensoes[0].distribuicao["risco"] == 1
        assert rel.dominios[0].dimensoes[0].distribuicao["intermediario"] == 1
        assert rel.metricas.totalRespondentes == 2
