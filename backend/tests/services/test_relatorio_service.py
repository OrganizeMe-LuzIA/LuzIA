from app.services.copsoq_scoring_service import ClassificacaoTercil
from app.services.relatorio_service import RelatorioService


def _diagnostico_exemplo(classificacao: str, pontuacao: float, dim: str = "Exigências quantitativas"):
    return {
        "dimensoes": [
            {
                "codigoDominio": "EL",
                "dominio": "Exigências Laborais",
                "dimensao": dim,
                "pontuacao": pontuacao,
                "classificacao": classificacao,
                "sinal": "risco",
            }
        ]
    }


def test_gera_relatorio_organizacional():
    service = RelatorioService()
    diagnosticos = [
        _diagnostico_exemplo("risco", 3.8),
        _diagnostico_exemplo("intermediario", 3.0),
    ]
    rel = service.generate_relatorio(diagnosticos, "qid", "organizacional", org_id="org1")
    assert rel.tipoRelatorio == "organizacional"
    assert rel.idOrganizacao == "org1"
    assert rel.metricas.totalRespondentes == 2


def test_gera_relatorio_setorial():
    service = RelatorioService()
    diagnosticos = [_diagnostico_exemplo("favoravel", 2.0)]
    rel = service.generate_relatorio(diagnosticos, "qid", "setorial", org_id="org1", setor_id="set1")
    assert rel.tipoRelatorio == "setorial"
    assert rel.idSetor == "set1"


def test_recomendacoes_automaticas():
    service = RelatorioService()
    diagnosticos = [_diagnostico_exemplo("risco", 4.0, dim="Burnout")]
    rel = service.generate_relatorio(diagnosticos, "qid", "organizacional")
    assert any("esgotamento" in rec.lower() for rec in rel.recomendacoes)


def test_calculo_metricas():
    service = RelatorioService()
    diagnosticos = [
        _diagnostico_exemplo("risco", 4.0),
        _diagnostico_exemplo("favoravel", 2.0),
    ]
    rel = service.generate_relatorio(diagnosticos, "qid", "organizacional")
    assert rel.metricas.totalRespondentes == 2
    assert rel.metricas.mediaRiscoGlobal >= 0
    assert isinstance(rel.dominios[0].dimensoes[0].classificacao, ClassificacaoTercil)


def test_diagnosticos_vazios():
    service = RelatorioService()
    rel = service.generate_relatorio([], "qid", "organizacional")
    assert rel.metricas.totalRespondentes == 0
    assert rel.recomendacoes == ["Sem dados suficientes."]
