from app.services.copsoq_scoring_service import (
    COPSOQScoringService,
    ClassificacaoTercil,
)


def test_classificacao_tercil_risco():
    service = COPSOQScoringService()
    assert service.classificar_tercil(4.0, "Burnout") == ClassificacaoTercil.RISCO


def test_classificacao_tercil_protecao():
    service = COPSOQScoringService()
    assert service.classificar_tercil(4.0, "Satisfação no trabalho") == ClassificacaoTercil.FAVORAVEL


def test_inversao_item():
    service = COPSOQScoringService()
    score = service.calcular_pontuacao_item(
        valor=5,
        id_pergunta="VLT_CV_03",
        codigo_questionario="COPSOQ_MEDIA_PT",
    )
    assert score == 1


def test_dimensao_protecao_identificacao():
    service = COPSOQScoringService()
    assert service.eh_dimensao_protecao("Satisfação no trabalho") is True
    assert service.eh_dimensao_protecao("Burnout") is False


def test_calculo_media_com_itens_invertidos():
    service = COPSOQScoringService()
    respostas = [
        {"id_pergunta": "VLT_CV_03", "valor": 5},
        {"id_pergunta": "VLT_CV_01", "valor": 3},
    ]
    media = service.calcular_media_dimensao(
        respostas=respostas,
        codigo_questionario="COPSOQ_MEDIA_PT",
    )
    assert media == 2.0
