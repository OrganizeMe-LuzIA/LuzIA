"""
Testes Unitários - COPSOQ Scoring Service

Testa:
- Inversão de valores
- Classificação por tercis (proteção e risco)
- Cálculo de média por dimensão
- Processamento completo de dimensão
"""

import pytest
from app.services.copsoq_scoring_service import (
    COPSOQScoringService,
    ClassificacaoTercil,
    ResultadoDimensao,
)


# =============================================================================
# Fixtures
# =============================================================================

@pytest.fixture
def scoring_service():
    """Instância do serviço de scoring"""
    return COPSOQScoringService()


# =============================================================================
# Testes de Inversão de Valores
# =============================================================================

class TestInversaoValores:
    """Testes para inversão de valores de respostas"""
    
    def test_inverter_valor_escala_5(self, scoring_service):
        """Inversão em escala de 1-5"""
        assert scoring_service.inverter_valor(1, escala_max=5) == 5
        assert scoring_service.inverter_valor(2, escala_max=5) == 4
        assert scoring_service.inverter_valor(3, escala_max=5) == 3
        assert scoring_service.inverter_valor(4, escala_max=5) == 2
        assert scoring_service.inverter_valor(5, escala_max=5) == 1
    
    def test_inverter_valor_escala_4(self, scoring_service):
        """Inversão em escala de 0-4"""
        assert scoring_service.inverter_valor(0, escala_max=4) == 4
        assert scoring_service.inverter_valor(1, escala_max=4) == 3
        assert scoring_service.inverter_valor(2, escala_max=4) == 2
        assert scoring_service.inverter_valor(3, escala_max=4) == 1
        assert scoring_service.inverter_valor(4, escala_max=4) == 0
    
    def test_pontuacao_item_sem_inversao(self, scoring_service):
        """Item normal não deve ser invertido"""
        resultado = scoring_service.calcular_pontuacao_item(
            valor=4,
            id_pergunta="EL_EQ_01",
            codigo_questionario="COPSOQ_MEDIA_PT"
        )
        assert resultado == 4
    
    def test_pontuacao_item_com_inversao_media_pt(self, scoring_service):
        """Itens invertidos na versão média portuguesa"""
        # VLT_CV_03 deve ser invertido
        resultado = scoring_service.calcular_pontuacao_item(
            valor=5,
            id_pergunta="VLT_CV_03",
            codigo_questionario="COPSOQ_MEDIA_PT"
        )
        assert resultado == 1
        
        # VLT_CH_01 também deve ser invertido
        resultado = scoring_service.calcular_pontuacao_item(
            valor=1,
            id_pergunta="VLT_CH_01",
            codigo_questionario="COPSOQ_MEDIA_PT"
        )
        assert resultado == 5
    
    def test_pontuacao_item_curta_br_sem_inversoes(self, scoring_service):
        """Versão curta brasileira (v3) não tem itens invertidos"""
        # VLT_CV_03 NÃO deve ser invertido na versão curta
        resultado = scoring_service.calcular_pontuacao_item(
            valor=5,
            id_pergunta="VLT_CV_03",
            codigo_questionario="COPSOQ_CURTA_BR"
        )
        assert resultado == 5


# =============================================================================
# Testes de Classificação por Tercis
# =============================================================================

class TestClassificacaoTercis:
    """Testes para classificação por tercis (semáforo)"""
    
    # Dimensões de proteção (maior = melhor)
    
    def test_protecao_favoravel(self, scoring_service):
        """Média alta em dimensão de proteção = favorável"""
        resultado = scoring_service.classificar_tercil(
            media=4.0,
            dimensao="Satisfação no trabalho"
        )
        assert resultado == ClassificacaoTercil.FAVORAVEL
    
    def test_protecao_limite_superior(self, scoring_service):
        """Média no limite superior em dimensão de proteção = favorável"""
        resultado = scoring_service.classificar_tercil(
            media=3.67,
            dimensao="Satisfação no trabalho"
        )
        assert resultado == ClassificacaoTercil.FAVORAVEL
    
    def test_protecao_intermediario(self, scoring_service):
        """Média média em dimensão de proteção = intermediário"""
        resultado = scoring_service.classificar_tercil(
            media=3.0,
            dimensao="Qualidade da liderança"
        )
        assert resultado == ClassificacaoTercil.INTERMEDIARIO
    
    def test_protecao_risco(self, scoring_service):
        """Média baixa em dimensão de proteção = risco"""
        resultado = scoring_service.classificar_tercil(
            media=2.0,
            dimensao="Apoio social de superiores"
        )
        assert resultado == ClassificacaoTercil.RISCO
    
    def test_protecao_limite_inferior(self, scoring_service):
        """Média no limite inferior em dimensão de proteção = risco"""
        resultado = scoring_service.classificar_tercil(
            media=2.33,
            dimensao="Apoio social de colegas"
        )
        assert resultado == ClassificacaoTercil.RISCO
    
    # Dimensões de risco (menor = melhor)
    
    def test_risco_favoravel(self, scoring_service):
        """Média baixa em dimensão de risco = favorável"""
        resultado = scoring_service.classificar_tercil(
            media=2.0,
            dimensao="Burnout"
        )
        assert resultado == ClassificacaoTercil.FAVORAVEL
    
    def test_risco_limite_inferior(self, scoring_service):
        """Média no limite inferior em dimensão de risco = favorável"""
        resultado = scoring_service.classificar_tercil(
            media=2.33,
            dimensao="Stress"
        )
        assert resultado == ClassificacaoTercil.FAVORAVEL
    
    def test_risco_intermediario(self, scoring_service):
        """Média média em dimensão de risco = intermediário"""
        resultado = scoring_service.classificar_tercil(
            media=3.0,
            dimensao="Exigências quantitativas"
        )
        assert resultado == ClassificacaoTercil.INTERMEDIARIO
    
    def test_risco_alto(self, scoring_service):
        """Média alta em dimensão de risco = risco"""
        resultado = scoring_service.classificar_tercil(
            media=4.0,
            dimensao="Conflito trabalho-família"
        )
        assert resultado == ClassificacaoTercil.RISCO
    
    def test_risco_limite_superior(self, scoring_service):
        """Média no limite superior em dimensão de risco = risco"""
        resultado = scoring_service.classificar_tercil(
            media=3.67,
            dimensao="Ritmo de trabalho"
        )
        assert resultado == ClassificacaoTercil.RISCO


# =============================================================================
# Testes de Cálculo de Média
# =============================================================================

class TestCalculoMedia:
    """Testes para cálculo de média por dimensão"""
    
    def test_media_simples(self, scoring_service):
        """Cálculo de média simples"""
        respostas = [
            {"id_pergunta": "P1", "valor": 3},
            {"id_pergunta": "P2", "valor": 4},
            {"id_pergunta": "P3", "valor": 5},
        ]
        media = scoring_service.calcular_media_dimensao(
            respostas=respostas,
            codigo_questionario="COPSOQ_CURTA_BR"
        )
        assert media == 4.0  # (3+4+5)/3 = 4.0
    
    def test_media_com_inversao(self, scoring_service):
        """Média com item invertido"""
        respostas = [
            {"id_pergunta": "VLT_CV_01", "valor": 4},  # Normal
            {"id_pergunta": "VLT_CV_03", "valor": 5},  # Invertido: 5→1
        ]
        media = scoring_service.calcular_media_dimensao(
            respostas=respostas,
            codigo_questionario="COPSOQ_MEDIA_PT"
        )
        assert media == 2.5  # (4+1)/2 = 2.5
    
    def test_media_lista_vazia(self, scoring_service):
        """Lista vazia retorna 0"""
        media = scoring_service.calcular_media_dimensao(
            respostas=[],
            codigo_questionario="COPSOQ_CURTA_BR"
        )
        assert media == 0.0


# =============================================================================
# Testes de Processamento de Dimensão
# =============================================================================

class TestProcessamentoDimensao:
    """Testes para processamento completo de dimensão"""
    
    def test_processar_dimensao_protecao(self, scoring_service):
        """Processamento de dimensão de proteção"""
        respostas = [
            {"id_pergunta": "ITI_ST_01", "valor": 4},
            {"id_pergunta": "ITI_ST_02", "valor": 4},
        ]
        resultado = scoring_service.processar_dimensao(
            dimensao="Satisfação no trabalho",
            dominio="Interface Trabalho-Indivíduo",
            respostas=respostas,
            codigo_questionario="COPSOQ_CURTA_BR"
        )
        
        assert isinstance(resultado, ResultadoDimensao)
        assert resultado.dimensao == "Satisfação no trabalho"
        assert resultado.dominio == "Interface Trabalho-Indivíduo"
        assert resultado.media == 4.0
        assert resultado.classificacao == ClassificacaoTercil.FAVORAVEL
        assert resultado.total_itens == 2
    
    def test_processar_dimensao_risco(self, scoring_service):
        """Processamento de dimensão de risco"""
        respostas = [
            {"id_pergunta": "SBE_BO_01", "valor": 4},
            {"id_pergunta": "SBE_BO_02", "valor": 4},
        ]
        resultado = scoring_service.processar_dimensao(
            dimensao="Burnout",
            dominio="Saúde e Bem-Estar",
            respostas=respostas,
            codigo_questionario="COPSOQ_CURTA_BR"
        )
        
        assert resultado.media == 4.0
        assert resultado.classificacao == ClassificacaoTercil.RISCO


# =============================================================================
# Testes de Identificação de Dimensões
# =============================================================================

class TestIdentificacaoDimensoes:
    """Testes para identificação de tipo de dimensão"""
    
    def test_dimensao_protecao(self, scoring_service):
        """Identificação de dimensões de proteção"""
        assert scoring_service.eh_dimensao_protecao("Satisfação no trabalho") is True
        assert scoring_service.eh_dimensao_protecao("Qualidade da liderança") is True
        assert scoring_service.eh_dimensao_protecao("Saúde geral") is True
    
    def test_dimensao_risco(self, scoring_service):
        """Identificação de dimensões de risco"""
        assert scoring_service.eh_dimensao_protecao("Burnout") is False
        assert scoring_service.eh_dimensao_protecao("Stress") is False
        assert scoring_service.eh_dimensao_protecao("Conflito trabalho-família") is False


class TestFaixasOficiaisCurtaBR:
    """Testes das faixas por soma da pontuação oficial BR."""

    def test_curta_br_ritmo_intermediario_por_soma(self, scoring_service):
        respostas = [
            {"id_pergunta": "EL_RT_01A", "valor": 3},
            {"id_pergunta": "EL_RT_01B", "valor": 2},
        ]  # soma=5 -> intermediário
        resultado = scoring_service.processar_dimensao(
            dimensao="Ritmo de trabalho",
            dominio="Exigências Laborais",
            respostas=respostas,
            codigo_questionario="COPSOQ_CURTA_BR",
        )
        assert resultado.classificacao == ClassificacaoTercil.INTERMEDIARIO

    def test_curta_br_influencia_favoravel_por_soma(self, scoring_service):
        respostas = [
            {"id_pergunta": "OTC_IT_01A", "valor": 4},
            {"id_pergunta": "OTC_IT_01B", "valor": 4},
        ]  # soma=8 -> favorável
        resultado = scoring_service.processar_dimensao(
            dimensao="Influência no trabalho",
            dominio="Organização do Trabalho e Conteúdo",
            respostas=respostas,
            codigo_questionario="COPSOQ_CURTA_BR",
        )
        assert resultado.classificacao == ClassificacaoTercil.FAVORAVEL

    def test_curta_br_burnout_intermediario_por_soma(self, scoring_service):
        respostas = [
            {"id_pergunta": "SBE_BO_01A", "valor": 2},
            {"id_pergunta": "SBE_BO_01B", "valor": 1},
        ]  # soma=3 -> intermediário
        resultado = scoring_service.processar_dimensao(
            dimensao="Burnout",
            dominio="Saúde e Bem-Estar",
            respostas=respostas,
            codigo_questionario="COPSOQ_CURTA_BR",
        )
        assert resultado.classificacao == ClassificacaoTercil.INTERMEDIARIO

    def test_curta_br_ofensivo_sim_e_risco(self, scoring_service):
        respostas = [{"id_pergunta": "CO_AV_01", "valor": 1}]  # sim
        resultado = scoring_service.processar_dimensao(
            dimensao="Ameaças de violência",
            dominio="Comportamentos Ofensivos",
            respostas=respostas,
            codigo_questionario="COPSOQ_CURTA_BR",
        )
        assert resultado.classificacao == ClassificacaoTercil.RISCO
