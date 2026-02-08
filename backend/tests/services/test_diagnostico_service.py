from app.models.base import DiagnosticoDimensao, RespostaItem
from app.services.copsoq_scoring_service import ClassificacaoTercil
from app.services.diagnostico_service import DiagnosticoService


def test_calcula_diagnostico_copsoq_curta():
    service = DiagnosticoService()
    questionario = {"_id": "q1", "codigo": "COPSOQ_CURTA_BR"}
    perguntas = [
        {
            "idPergunta": "p1",
            "codigoDominio": "OTC",
            "dominio": "Organização do Trabalho e Conteúdo",
            "dimensao": "Influência no trabalho",
            "sinal": "protecao",
        },
        {
            "idPergunta": "p2",
            "codigoDominio": "OTC",
            "dominio": "Organização do Trabalho e Conteúdo",
            "dimensao": "Influência no trabalho",
            "sinal": "protecao",
        },
    ]
    respostas = [RespostaItem(idPergunta="p1", valor=4), RespostaItem(idPergunta="p2", valor=4)]

    resultado = service.calculate_score(respostas, questionario, perguntas)

    assert resultado.resultadoGlobal == "favoravel"
    assert len(resultado.dimensoes) == 1
    assert resultado.dimensoes[0].classificacao == ClassificacaoTercil.FAVORAVEL


def test_calcula_diagnostico_copsoq_media():
    service = DiagnosticoService()
    questionario = {"_id": "q2", "codigo": "COPSOQ_MEDIA_PT"}
    perguntas = [
        {
            "idPergunta": "VLT_CV_03",
            "codigoDominio": "VLT",
            "dominio": "Valores no Local de Trabalho",
            "dimensao": "Confiança vertical",
            "sinal": "protecao",
        }
    ]
    respostas = [RespostaItem(idPergunta="VLT_CV_03", valor=4)]

    resultado = service.calculate_score(respostas, questionario, perguntas)

    assert resultado.resultadoGlobal in {"risco", "intermediario", "favoravel"}
    assert len(resultado.dimensoes) == 1
    assert resultado.dimensoes[0].dimensao == "Confiança vertical"


def test_detecta_escala_automaticamente():
    service = DiagnosticoService()
    resposta_escala5 = RespostaItem.model_construct(idPergunta="p1", valor=5)
    assert service._detectar_escala_max([resposta_escala5]) == 5
    assert service._detectar_escala_max([RespostaItem(idPergunta="p2", valor=4)]) == 4


def test_resultado_global_predominantemente_risco():
    service = DiagnosticoService()
    dimensoes = [
        DiagnosticoDimensao(
            dominio="D1",
            dimensao="X",
            pontuacao=4.0,
            classificacao=ClassificacaoTercil.RISCO,
        ),
        DiagnosticoDimensao(
            dominio="D1",
            dimensao="Y",
            pontuacao=4.0,
            classificacao=ClassificacaoTercil.RISCO,
        ),
        DiagnosticoDimensao(
            dominio="D1",
            dimensao="Z",
            pontuacao=2.0,
            classificacao=ClassificacaoTercil.FAVORAVEL,
        ),
    ]
    resultado, _ = service._resultado_global(dimensoes)
    assert resultado == "risco"


def test_resultado_global_predominantemente_favoravel():
    service = DiagnosticoService()
    dimensoes = [
        DiagnosticoDimensao(
            dominio="D1",
            dimensao="X",
            pontuacao=2.0,
            classificacao=ClassificacaoTercil.FAVORAVEL,
        ),
        DiagnosticoDimensao(
            dominio="D1",
            dimensao="Y",
            pontuacao=2.0,
            classificacao=ClassificacaoTercil.FAVORAVEL,
        ),
    ]
    resultado, _ = service._resultado_global(dimensoes)
    assert resultado == "favoravel"


def test_dimensoes_vazias():
    service = DiagnosticoService()
    resultado, pontuacao = service._resultado_global([])
    assert resultado == "intermediario"
    assert pontuacao == 0.0
