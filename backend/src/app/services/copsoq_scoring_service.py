"""
Serviço de Scoring para o Questionário COPSOQ II

Este serviço implementa a lógica de cálculo de pontuação e classificação
por tercis (verde/amarelo/vermelho) para ambas as versões do COPSOQ II:
- COPSOQ_CURTA_BR: Versão curta brasileira (seed versionada como 3.0)
- COPSOQ_MEDIA_PT: Versão média portuguesa (76 perguntas)

Referências:
- Gonçalves, Moriguchi, Chaves & Sato (2021) - Versão brasileira
- COPSOQ II Versão Portuguesa - Manual de utilização
"""

from typing import List, Dict, Optional, Set
from enum import Enum
from pydantic import BaseModel


class ClassificacaoTercil(str, Enum):
    """Classificação por tercis (semáforo)"""
    FAVORAVEL = "favoravel"       # 🟢 Verde
    INTERMEDIARIO = "intermediario"  # 🟡 Amarelo
    RISCO = "risco"               # 🔴 Vermelho


class ResultadoDimensao(BaseModel):
    """Resultado do cálculo para uma dimensão"""
    dimensao: str
    dominio: str
    media: float
    classificacao: ClassificacaoTercil
    total_itens: int
    itens_respondidos: int


class COPSOQScoringService:
    """
    Serviço de scoring para o questionário COPSOQ II.
    
    Implementa:
    - Classificação por tercis (verde/amarelo/vermelho)
    - Tratamento de itens invertidos
    - Suporte para ambas versões (curta BR e média PT)
    """
    
    # Limites para classificação por tercis
    LIMITE_INFERIOR = 2.33
    LIMITE_SUPERIOR = 3.67
    
    # Itens que requerem inversão de valor (por versão)
    ITENS_INVERTIDOS: Dict[str, Set[str]] = {
        "COPSOQ_MEDIA_PT": {"VLT_CV_03", "VLT_CH_01"},
        "COPSOQ_CURTA_BR": set()  # Versão curta não tem itens invertidos
    }
    
    # Dimensões de proteção (maior valor = melhor)
    # As demais são dimensões de risco (menor valor = melhor)
    DIMENSOES_PROTECAO: Set[str] = {
        # Organização do Trabalho e Conteúdo
        "Influência no trabalho",
        "Possibilidades de desenvolvimento",
        "Significado do trabalho",
        "Compromisso com local de trabalho",
        # Relações Sociais e Liderança
        "Previsibilidade",
        "Recompensas",
        "Transparência do papel",
        "Qualidade da liderança",
        "Apoio social de superiores",
        "Apoio social de colegas",
        # Valores no Local de Trabalho
        "Confiança vertical",
        "Confiança horizontal",
        "Justiça e respeito",
        "Comunidade social no trabalho",
        # Personalidade
        "Auto-eficácia",
        # Interface Trabalho-Indivíduo
        "Satisfação no trabalho",
        # Saúde e Bem-Estar
        "Saúde geral",
    }

    # Faixas oficiais de classificação por soma para COPSOQ_CURTA_BR (PDF de pontuação BR).
    # Regras aplicadas apenas quando os IDs de pergunta batem com o mapeamento esperado.
    REGRAS_SOMA_CURTA_BR: Dict[str, Dict[str, object]] = {
        "Exigências quantitativas": {"ids": {"EL_EQ_01A", "EL_EQ_01B"}, "favoravel": [(0, 3)], "intermediario": [(4, 4)], "risco": [(5, 8)]},
        "Ritmo de trabalho": {"ids": {"EL_RT_01A", "EL_RT_01B"}, "favoravel": [(0, 3)], "intermediario": [(4, 5)], "risco": [(6, 8)]},
        "Exigências emocionais": {"ids": {"EL_EE_01A", "EL_EE_01B"}, "favoravel": [(0, 3)], "intermediario": [(4, 4)], "risco": [(5, 8)]},
        "Influência no trabalho": {"ids": {"OTC_IT_01A", "OTC_IT_01B"}, "favoravel": [(5, 8)], "intermediario": [(4, 4)], "risco": [(0, 3)]},
        "Possibilidades de desenvolvimento": {"ids": {"OTC_PD_01A", "OTC_PD_01B"}, "favoravel": [(5, 8)], "intermediario": [(4, 4)], "risco": [(0, 3)]},
        "Significado do trabalho": {"ids": {"OTC_ST_01A", "OTC_ST_01B"}, "favoravel": [(6, 8)], "intermediario": [(5, 5)], "risco": [(0, 4)]},
        "Compromisso com local de trabalho": {"ids": {"OTC_CLT_01A", "OTC_CLT_01B"}, "favoravel": [(5, 8)], "intermediario": [(4, 4)], "risco": [(0, 3)]},
        "Previsibilidade": {"ids": {"RSL_PR_01A", "RSL_PR_01B"}, "favoravel": [(5, 8)], "intermediario": [(4, 4)], "risco": [(0, 3)]},
        "Recompensas": {"ids": {"RSL_RE_01A", "RSL_RE_01B"}, "favoravel": [(5, 8)], "intermediario": [(4, 4)], "risco": [(0, 3)]},
        "Transparência do papel": {"ids": {"RSL_TP_01A", "RSL_TP_01B"}, "favoravel": [(6, 8)], "intermediario": [(4, 5)], "risco": [(0, 3)]},
        "Qualidade da liderança": {"ids": {"RSL_QL_01A", "RSL_QL_01B"}, "favoravel": [(5, 8)], "intermediario": [(4, 4)], "risco": [(0, 3)]},
        "Apoio social de superiores": {"ids": {"RSL_ASS_01A", "RSL_ASS_01B"}, "favoravel": [(6, 8)], "intermediario": [(4, 5)], "risco": [(0, 3)]},
        "Satisfação no trabalho": {"ids": {"ITI_ST_01"}, "favoravel": [(2, 3)], "intermediario": [], "risco": [(0, 1)]},
        "Conflito trabalho-família": {"ids": {"ITI_CTF_01A", "ITI_CTF_01B"}, "favoravel": [(0, 2)], "intermediario": [(3, 3)], "risco": [(4, 6)]},
        "Confiança vertical": {"ids": {"VLT_CV_01A", "VLT_CV_01B"}, "favoravel": [(5, 8)], "intermediario": [(4, 4)], "risco": [(0, 3)]},
        "Justiça e respeito": {"ids": {"VLT_JR_01A", "VLT_JR_01B"}, "favoravel": [(5, 8)], "intermediario": [(4, 4)], "risco": [(0, 3)]},
        "Saúde geral": {"ids": {"SBE_SG_01"}, "favoravel": [(3, 4)], "intermediario": [(2, 2)], "risco": [(0, 1)]},
        "Burnout": {"ids": {"SBE_BO_01A", "SBE_BO_01B"}, "favoravel": [(0, 2)], "intermediario": [(3, 3)], "risco": [(4, 8)]},
        "Stress": {"ids": {"SBE_ST_01A", "SBE_ST_01B"}, "favoravel": [(0, 2)], "intermediario": [(3, 3)], "risco": [(4, 8)]},
        "Atenção sexual indesejada": {"ids": {"CO_ASI_01"}, "favoravel": [(0, 0)], "intermediario": [], "risco": [(1, 4)]},
        "Ameaças de violência": {"ids": {"CO_AV_01"}, "favoravel": [(0, 0)], "intermediario": [], "risco": [(1, 4)]},
        "Violência física": {"ids": {"CO_VF_01"}, "favoravel": [(0, 0)], "intermediario": [], "risco": [(1, 4)]},
        "Bullying": {"ids": {"CO_BU_01"}, "favoravel": [(0, 0)], "intermediario": [], "risco": [(1, 4)]},
    }

    @staticmethod
    def _valor_em_faixas(valor: int, faixas: List[tuple]) -> bool:
        return any(inicio <= valor <= fim for inicio, fim in faixas)

    def _classificar_curta_br_por_soma(
        self,
        dimensao: str,
        respostas: List[Dict[str, int]],
        escala_max: int = 4,
    ) -> Optional[ClassificacaoTercil]:
        regra = self.REGRAS_SOMA_CURTA_BR.get(dimensao)
        if not regra:
            return None

        ids_esperados = regra["ids"]  # type: ignore[index]
        ids_resposta = {r["id_pergunta"] for r in respostas if "id_pergunta" in r}
        if not ids_resposta or not ids_resposta.issubset(ids_esperados):  # type: ignore[arg-type]
            return None

        soma = sum(int(r["valor"]) for r in respostas)
        favoravel = regra["favoravel"]  # type: ignore[index]
        intermediario = regra["intermediario"]  # type: ignore[index]
        risco = regra["risco"]  # type: ignore[index]

        if self._valor_em_faixas(soma, favoravel):
            return ClassificacaoTercil.FAVORAVEL
        if self._valor_em_faixas(soma, intermediario):
            return ClassificacaoTercil.INTERMEDIARIO
        if self._valor_em_faixas(soma, risco):
            return ClassificacaoTercil.RISCO
        return None
    
    def inverter_valor(self, valor: int, escala_max: int = 5) -> int:
        """
        Inverte o valor de uma resposta.
        
        Para escala de 1-5: 1→5, 2→4, 3→3, 4→2, 5→1
        Para escala de 0-4: 0→4, 1→3, 2→2, 3→1, 4→0
        
        Args:
            valor: Valor original da resposta
            escala_max: Valor máximo da escala (5 para 1-5, 4 para 0-4)
            
        Returns:
            Valor invertido
        """
        if escala_max == 4:
            return escala_max - valor
        return (escala_max + 1) - valor
    
    def calcular_pontuacao_item(
        self,
        valor: int,
        id_pergunta: str,
        codigo_questionario: str,
        escala_max: int = 5
    ) -> int:
        """
        Calcula a pontuação de um item, aplicando inversão se necessário.
        
        Args:
            valor: Valor da resposta
            id_pergunta: ID da pergunta
            codigo_questionario: Código do questionário (COPSOQ_CURTA_BR ou COPSOQ_MEDIA_PT)
            escala_max: Valor máximo da escala
            
        Returns:
            Pontuação calculada
        """
        itens_invertidos = self.ITENS_INVERTIDOS.get(codigo_questionario, set())
        
        if id_pergunta in itens_invertidos:
            return self.inverter_valor(valor, escala_max)
        
        return valor
    
    def eh_dimensao_protecao(self, dimensao: str) -> bool:
        """
        Verifica se a dimensão é de proteção (maior = melhor).
        
        Args:
            dimensao: Nome da dimensão
            
        Returns:
            True se for dimensão de proteção, False se for de risco
        """
        return dimensao in self.DIMENSOES_PROTECAO
    
    def classificar_tercil(
        self,
        media: float,
        dimensao: str
    ) -> ClassificacaoTercil:
        """
        Classifica uma média em tercis (verde/amarelo/vermelho).
        
        A interpretação depende do tipo de dimensão:
        - Proteção: maior = melhor (≥3.67 = verde, ≤2.33 = vermelho)
        - Risco: menor = melhor (≤2.33 = verde, ≥3.67 = vermelho)
        
        Args:
            media: Média calculada para a dimensão
            dimensao: Nome da dimensão
            
        Returns:
            Classificação (FAVORAVEL, INTERMEDIARIO ou RISCO)
        """
        eh_protecao = self.eh_dimensao_protecao(dimensao)
        
        if eh_protecao:
            # Maior = melhor
            if media >= self.LIMITE_SUPERIOR:
                return ClassificacaoTercil.FAVORAVEL
            elif media > self.LIMITE_INFERIOR:
                return ClassificacaoTercil.INTERMEDIARIO
            else:
                return ClassificacaoTercil.RISCO
        else:
            # Menor = melhor
            if media <= self.LIMITE_INFERIOR:
                return ClassificacaoTercil.FAVORAVEL
            elif media < self.LIMITE_SUPERIOR:
                return ClassificacaoTercil.INTERMEDIARIO
            else:
                return ClassificacaoTercil.RISCO
    
    def calcular_media_dimensao(
        self,
        respostas: List[Dict[str, int]],
        codigo_questionario: str,
        escala_max: int = 5
    ) -> float:
        """
        Calcula a média de uma dimensão a partir das respostas.
        
        Args:
            respostas: Lista de dicionários com {id_pergunta, valor}
            codigo_questionario: Código do questionário
            escala_max: Valor máximo da escala
            
        Returns:
            Média calculada
        """
        if not respostas:
            return 0.0
        
        total = sum(
            self.calcular_pontuacao_item(
                r["valor"],
                r["id_pergunta"],
                codigo_questionario,
                escala_max
            )
            for r in respostas
        )
        
        return total / len(respostas)
    
    def processar_dimensao(
        self,
        dimensao: str,
        dominio: str,
        respostas: List[Dict[str, int]],
        codigo_questionario: str,
        escala_max: int = 5
    ) -> ResultadoDimensao:
        """
        Processa uma dimensão completa: calcula média e classificação.
        
        Args:
            dimensao: Nome da dimensão
            dominio: Nome do domínio
            respostas: Lista de respostas da dimensão
            codigo_questionario: Código do questionário
            escala_max: Valor máximo da escala
            
        Returns:
            ResultadoDimensao com média e classificação
        """
        media = self.calcular_media_dimensao(
            respostas,
            codigo_questionario,
            escala_max
        )
        
        classificacao = None
        if codigo_questionario == "COPSOQ_CURTA_BR":
            classificacao = self._classificar_curta_br_por_soma(
                dimensao=dimensao,
                respostas=respostas,
                escala_max=escala_max,
            )
        if classificacao is None:
            classificacao = self.classificar_tercil(media, dimensao)
        
        return ResultadoDimensao(
            dimensao=dimensao,
            dominio=dominio,
            media=round(media, 2),
            classificacao=classificacao,
            total_itens=len(respostas),
            itens_respondidos=len(respostas)
        )


# Instância singleton do serviço
copsoq_scoring_service = COPSOQScoringService()
