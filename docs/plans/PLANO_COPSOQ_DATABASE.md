# Implementação do Questionário COPSOQ II no Banco de Dados

Este documento detalha como implementar a lógica completa do questionário COPSOQ II (Copenhagen Psychosocial Questionnaire, Versão Portuguesa) no banco de dados MongoDB do sistema LuzIA.

## Contexto

O **COPSOQ II** é um instrumento validado para avaliação de riscos psicossociais no trabalho. A versão média portuguesa possui:
- **8 domínios** principais (incluindo Comportamentos Ofensivos)
- **29 dimensões** (subescalas)  
- **76 perguntas** (itens)
- **Escala Likert de 5 pontos** (1-5) para maioria dos itens
- **2 itens invertidos** (perguntas sobre satisfação e compromisso)
- **Sistema de interpretação por tercis** (semáforo: verde/amarelo/vermelho)

---

## Estrutura do Questionário COPSOQ II

### Tabela de Domínios, Dimensões e Quantidade de Itens

| Domínio | Código | Dimensões (Subescalas) | Qtd. Itens |
|---------|--------|------------------------|------------|
| **Exigências Laborais** | `EL` | Exigências quantitativas (3), Ritmo de trabalho (1), Exigências cognitivas (3), Exigências emocionais (1) | 8 |
| **Organização do Trabalho e Conteúdo** | `OTC` | Influência no trabalho (4), Possibilidades de desenvolvimento (3), Significado do trabalho (3), Compromisso com local de trabalho (2) | 12 |
| **Relações Sociais e Liderança** | `RSL` | Previsibilidade (2), Recompensas (3), Transparência do papel (3), Conflitos de papéis (3), Qualidade da liderança (4), Apoio social de superiores (3), Apoio social de colegas (3) | 21 |
| **Interface Trabalho-Indivíduo** | `ITI` | Insegurança laboral (1), Satisfação no trabalho (4), Conflito trabalho-família (3) | 8 |
| **Valores no Local de Trabalho** | `VLT` | Confiança vertical (3), Confiança horizontal (3), Justiça e respeito (3), Comunidade social no trabalho (3) | 12 |
| **Personalidade** | `PER` | Auto-eficácia (2) | 2 |
| **Saúde e Bem-Estar** | `SBE` | Saúde geral (1), Stress (2), Burnout (2), Problemas em dormir (2), Sintomas depressivos (2) | 9 |
| **Comportamentos Ofensivos** | `CO` | Atenção sexual indesejada (1), Ameaças de violência (1), Violência física (1), Bullying (1) | 4 |

**Total: 76 perguntas**

---

## Tipos de Escala

O COPSOQ II utiliza diferentes tipos de escala dependendo da natureza da pergunta:

### Escala de Frequência (5 pontos)
| Valor | Texto |
|-------|-------|
| 1 | Nunca/quase nunca |
| 2 | Raramente |
| 3 | Às vezes |
| 4 | Frequentemente |
| 5 | Sempre |

### Escala de Intensidade (5 pontos)
| Valor | Texto |
|-------|-------|
| 1 | Nada/quase nada |
| 2 | Um pouco |
| 3 | Moderadamente |
| 4 | Muito |
| 5 | Extremamente |

### Escala de Comportamentos Ofensivos (5 pontos)
| Valor | Texto |
|-------|-------|
| 0 | Não |
| 1 | Sim, poucas vezes |
| 2 | Sim, mensalmente |
| 3 | Sim, semanalmente |
| 4 | Sim, diariamente |

---

## Alterações Propostas

### 1. Script de Seed de Dados COPSOQ II

#### [NOVO] [seed_copsoq_ii.js](file:///root/LuzIA/backend/mongo/seed_copsoq_ii.js)

Script MongoDB para popular o banco de dados com:
- Registro do questionário COPSOQ II na coleção `questionarios`
- Todas as 76 perguntas na coleção `perguntas` com mapeamento correto de domínio/dimensão
- Indicação de itens invertidos
- Tipo de escala por pergunta

```javascript
// Estrutura do documento questionario
{
  "nome": "COPSOQ II - Versão Média Portuguesa",
  "versao": "2.0",
  "descricao": "Copenhagen Psychosocial Questionnaire - Versão Portuguesa adaptada para avaliação de riscos psicossociais no trabalho",
  "dominios": [
    {"codigo": "EL", "nome": "Exigências Laborais", "ordem": 1},
    {"codigo": "OTC", "nome": "Organização do Trabalho e Conteúdo", "ordem": 2},
    {"codigo": "RSL", "nome": "Relações Sociais e Liderança", "ordem": 3},
    {"codigo": "ITI", "nome": "Interface Trabalho-Indivíduo", "ordem": 4},
    {"codigo": "VLT", "nome": "Valores no Local de Trabalho", "ordem": 5},
    {"codigo": "PER", "nome": "Personalidade", "ordem": 6},
    {"codigo": "SBE", "nome": "Saúde e Bem-Estar", "ordem": 7},
    {"codigo": "CO", "nome": "Comportamentos Ofensivos", "ordem": 8}
  ],
  "escalasPossiveis": ["frequencia", "intensidade", "comportamento_ofensivo"],
  "totalPerguntas": 76,
  "ativo": true,
  "createdAt": new Date()
}
```

---

### 2. Mapeamento Completo de Perguntas

#### Estrutura de cada pergunta no MongoDB:

```javascript
{
  "idQuestionario": ObjectId("..."),  // Referência ao COPSOQ II
  "codigoDominio": "EL",
  "dominio": "Exigências Laborais",
  "dimensao": "Exigências quantitativas",
  "idPergunta": "EL_EQ_01",           // Formato: DOMINIO_DIMENSAO_NUMERO
  "texto": "A sua carga de trabalho acumula-se por ser mal distribuída?",
  "tipoEscala": "frequencia",
  "sinal": "risco",                   // risco = maior valor = pior; protecao = inverso
  "itemInvertido": false,
  "escala": 5,
  "ativo": true,
  "ordem": 1,
  "opcoesResposta": [
    {"valor": 1, "texto": "Nunca/quase nunca"},
    {"valor": 2, "texto": "Raramente"},
    {"valor": 3, "texto": "Às vezes"},
    {"valor": 4, "texto": "Frequentemente"},
    {"valor": 5, "texto": "Sempre"}
  ]
}
```

#### Mapeamento Completo das 76 Perguntas

##### Domínio: Exigências Laborais (EL) - 8 itens

| ID | Dimensão | Texto | Sinal | Inv. |
|----|----------|-------|-------|------|
| EL_EQ_01 | Exigências quantitativas | A sua carga de trabalho acumula-se por ser mal distribuída? | risco | N |
| EL_EQ_02 | Exigências quantitativas | Com que frequência não tem tempo para completar todas as tarefas do seu trabalho? | risco | N |
| EL_EQ_03 | Exigências quantitativas | Precisa fazer horas extra? | risco | N |
| EL_RT_01 | Ritmo de trabalho | Precisa trabalhar muito rapidamente? | risco | N |
| EL_EC_01 | Exigências cognitivas | O seu trabalho exige a sua atenção constante? | risco | N |
| EL_EC_02 | Exigências cognitivas | O seu trabalho requer que tome decisões difíceis? | risco | N |
| EL_EC_03 | Exigências cognitivas | O seu trabalho requer que seja bom a propor novas ideias? | risco | N |
| EL_EE_01 | Exigências emocionais | O seu trabalho é emocionalmente exigente? | risco | N |

##### Domínio: Organização do Trabalho e Conteúdo (OTC) - 12 itens

| ID | Dimensão | Texto | Sinal | Inv. |
|----|----------|-------|-------|------|
| OTC_IT_01 | Influência no trabalho | Tem influência sobre a quantidade de trabalho que lhe compete a si? | proteção | N |
| OTC_IT_02 | Influência no trabalho | Tem influência sobre o tipo de tarefas que faz? | proteção | N |
| OTC_IT_03 | Influência no trabalho | Tem influência sobre a ordem de realização das tarefas? | proteção | N |
| OTC_IT_04 | Influência no trabalho | Participa na escolha das pessoas com quem trabalha? | proteção | N |
| OTC_PD_01 | Possibilidades de desenvolvimento | O seu trabalho exige que tenha iniciativa? | proteção | N |
| OTC_PD_02 | Possibilidades de desenvolvimento | O seu trabalho permite-lhe aprender coisas novas? | proteção | N |
| OTC_PD_03 | Possibilidades de desenvolvimento | O seu trabalho permite-lhe usar as suas habilidades ou competências? | proteção | N |
| OTC_ST_01 | Significado do trabalho | O seu trabalho tem significado para si? | proteção | N |
| OTC_ST_02 | Significado do trabalho | Sente que o trabalho que faz é importante? | proteção | N |
| OTC_ST_03 | Significado do trabalho | Sente-se motivado e envolvido no seu trabalho? | proteção | N |
| OTC_CLT_01 | Compromisso com local de trabalho | Gosta de falar sobre o seu local de trabalho com outras pessoas? | proteção | N |
| OTC_CLT_02 | Compromisso com local de trabalho | Sente que os problemas do seu local de trabalho são seus também? | proteção | N |

##### Domínio: Relações Sociais e Liderança (RSL) - 21 itens

| ID | Dimensão | Texto | Sinal | Inv. |
|----|----------|-------|-------|------|
| RSL_PR_01 | Previsibilidade | É informado com antecedência sobre decisões importantes? | proteção | N |
| RSL_PR_02 | Previsibilidade | Recebe toda a informação de que necessita para fazer bem o seu trabalho? | proteção | N |
| RSL_RE_01 | Recompensas | O seu trabalho é reconhecido e apreciado pela gestão/chefia? | proteção | N |
| RSL_RE_02 | Recompensas | A gestão/chefia do seu local de trabalho respeita-o(a)? | proteção | N |
| RSL_RE_03 | Recompensas | É tratado(a) de forma justa no seu local de trabalho? | proteção | N |
| RSL_TP_01 | Transparência do papel | O seu trabalho tem objetivos claros? | proteção | N |
| RSL_TP_02 | Transparência do papel | Sabe exatamente o que é esperado de si no trabalho? | proteção | N |
| RSL_TP_03 | Transparência do papel | Sabe exatamente quais são as suas responsabilidades? | proteção | N |
| RSL_CP_01 | Conflitos de papéis | Faz coisas no trabalho que uns aceitam mas outros não? | risco | N |
| RSL_CP_02 | Conflitos de papéis | Por vezes tem de fazer coisas que deveriam ser feitas de outra forma? | risco | N |
| RSL_CP_03 | Conflitos de papéis | Por vezes tem de fazer coisas que considera desnecessárias? | risco | N |
| RSL_QL_01 | Qualidade da liderança | A sua chefia/gestão garante boas oportunidades de desenvolvimento? | proteção | N |
| RSL_QL_02 | Qualidade da liderança | A sua chefia/gestão dá prioridade à satisfação no trabalho? | proteção | N |
| RSL_QL_03 | Qualidade da liderança | A sua chefia/gestão é boa a planear o trabalho? | proteção | N |
| RSL_QL_04 | Qualidade da liderança | A sua chefia/gestão é boa a resolver conflitos? | proteção | N |
| RSL_ASS_01 | Apoio social de superiores | Com que frequência a sua chefia fala consigo sobre como está o seu trabalho? | proteção | N |
| RSL_ASS_02 | Apoio social de superiores | Com que frequência tem ajuda e apoio da sua chefia? | proteção | N |
| RSL_ASS_03 | Apoio social de superiores | Com que frequência a sua chefia fala sobre o seu desempenho? | proteção | N |
| RSL_ASC_01 | Apoio social de colegas | Com que frequência tem ajuda e apoio dos colegas? | proteção | N |
| RSL_ASC_02 | Apoio social de colegas | Com que frequência os colegas falam consigo sobre o seu desempenho? | proteção | N |
| RSL_ASC_03 | Apoio social de colegas | Com que frequência os colegas estão disponíveis para o/a ouvir? | proteção | N |

##### Domínio: Interface Trabalho-Indivíduo (ITI) - 8 itens

| ID | Dimensão | Texto | Sinal | Inv. |
|----|----------|-------|-------|------|
| ITI_IL_01 | Insegurança laboral | Sente-se preocupado(a) em ficar desempregado(a)? | risco | N |
| ITI_ST_01 | Satisfação no trabalho | Em relação ao seu trabalho em geral, quão satisfeito(a) está? | proteção | N |
| ITI_ST_02 | Satisfação no trabalho | Quão satisfeito está com as suas perspetivas de trabalho? | proteção | N |
| ITI_ST_03 | Satisfação no trabalho | Quão satisfeito está com as condições físicas do seu local de trabalho? | proteção | N |
| ITI_ST_04 | Satisfação no trabalho | Quão satisfeito está com a forma como as suas capacidades são utilizadas? | proteção | N |
| ITI_CTF_01 | Conflito trabalho-família | Sente que o seu trabalho lhe exige muita energia, afetando a sua vida privada? | risco | N |
| ITI_CTF_02 | Conflito trabalho-família | Sente que o seu trabalho lhe exige muito tempo, afetando a sua vida privada? | risco | N |
| ITI_CTF_03 | Conflito trabalho-família | A sua família e amigos dizem que trabalha demais? | risco | N |

##### Domínio: Valores no Local de Trabalho (VLT) - 12 itens

| ID | Dimensão | Texto | Sinal | Inv. |
|----|----------|-------|-------|------|
| VLT_CV_01 | Confiança vertical | A gestão/chefia confia nos trabalhadores para fazerem bem o trabalho? | proteção | N |
| VLT_CV_02 | Confiança vertical | Confia na informação da gestão/chefia? | proteção | N |
| VLT_CV_03 | Confiança vertical | A gestão/chefia esconde informação dos trabalhadores? | risco | **S** |
| VLT_CH_01 | Confiança horizontal | Os trabalhadores escondem informação uns dos outros? | risco | **S** |
| VLT_CH_02 | Confiança horizontal | Os trabalhadores escondem informação da gestão/chefia? | risco | N |
| VLT_CH_03 | Confiança horizontal | Confia nos seus colegas de trabalho? | proteção | N |
| VLT_JR_01 | Justiça e respeito | Os conflitos são resolvidos de forma justa? | proteção | N |
| VLT_JR_02 | Justiça e respeito | As sugestões dos trabalhadores são tratadas com seriedade? | proteção | N |
| VLT_JR_03 | Justiça e respeito | O trabalho é distribuído de forma justa? | proteção | N |
| VLT_CST_01 | Comunidade social no trabalho | Há um bom ambiente entre colegas? | proteção | N |
| VLT_CST_02 | Comunidade social no trabalho | Há boa cooperação entre os colegas? | proteção | N |
| VLT_CST_03 | Comunidade social no trabalho | Sente-se parte de uma comunidade no local de trabalho? | proteção | N |

##### Domínio: Personalidade (PER) - 2 itens

| ID | Dimensão | Texto | Sinal | Inv. |
|----|----------|-------|-------|------|
| PER_AE_01 | Auto-eficácia | É capaz de resolver a maioria dos problemas se se esforçar? | proteção | N |
| PER_AE_02 | Auto-eficácia | Consegue sempre resolver problemas difíceis se tentar o suficiente? | proteção | N |

##### Domínio: Saúde e Bem-Estar (SBE) - 9 itens

| ID | Dimensão | Texto | Sinal | Inv. |
|----|----------|-------|-------|------|
| SBE_SG_01 | Saúde geral | Em geral, como descreveria a sua saúde? | proteção | N |
| SBE_ST_01 | Stress | Com que frequência se sentiu stressado(a)? | risco | N |
| SBE_ST_02 | Stress | Com que frequência se sentiu tenso(a) ou nervoso(a)? | risco | N |
| SBE_BO_01 | Burnout | Com que frequência se sentiu fisicamente exausto(a)? | risco | N |
| SBE_BO_02 | Burnout | Com que frequência se sentiu emocionalmente exausto(a)? | risco | N |
| SBE_PD_01 | Problemas em dormir | Com que frequência teve dificuldades em adormecer? | risco | N |
| SBE_PD_02 | Problemas em dormir | Com que frequência acordou várias vezes durante a noite? | risco | N |
| SBE_SD_01 | Sintomas depressivos | Com que frequência se sentiu triste? | risco | N |
| SBE_SD_02 | Sintomas depressivos | Com que frequência sentiu falta de interesse pelas coisas? | risco | N |

##### Domínio: Comportamentos Ofensivos (CO) - 4 itens

> [!WARNING]
> Este domínio usa escala diferente e possui sub-perguntas condicionais.

| ID | Dimensão | Texto | Escala | 
|----|----------|-------|--------|
| CO_ASI_01 | Atenção sexual indesejada | Foi exposto(a) a atenção sexual indesejada nos últimos 12 meses? | comportamento_ofensivo |
| CO_AV_01 | Ameaças de violência | Foi exposto(a) a ameaças de violência nos últimos 12 meses? | comportamento_ofensivo |
| CO_VF_01 | Violência física | Foi exposto(a) a violência física nos últimos 12 meses? | comportamento_ofensivo |
| CO_BU_01 | Bullying | Foi exposto(a) a bullying nos últimos 12 meses? | comportamento_ofensivo |

---

### 3. Lógica de Cálculo de Pontuação (Scoring)

#### [NOVO] [copsoq_scoring_service.py](file:///root/LuzIA/backend/src/app/services/copsoq_scoring_service.py)

Serviço para calcular pontuações baseado nas regras do COPSOQ II:

```python
from typing import List, Dict, Literal
from enum import Enum

class ClassificacaoTercil(str, Enum):
    FAVORAVEL = "favoravel"      # Verde
    INTERMEDIARIO = "intermediario"  # Amarelo
    RISCO = "risco"              # Vermelho

class COPSOQScoringService:
    """Serviço de cálculo de pontuação COPSOQ II."""
    
    # Limites dos tercis (sem gaps)
    LIMITE_TERCIL_INFERIOR = 2.33
    LIMITE_TERCIL_SUPERIOR = 3.67
    
    # Itens invertidos (IDs que exigem inversão na cotação)
    ITENS_INVERTIDOS = ["VLT_CV_03", "VLT_CH_01"]
    
    # Dimensões onde MAIOR valor = MELHOR (fatores de proteção)
    DIMENSOES_PROTECAO = {
        "Influência no trabalho",
        "Possibilidades de desenvolvimento",
        "Previsibilidade",
        "Transparência do papel",
        "Recompensas",
        "Apoio social de colegas",
        "Apoio social de superiores",
        "Comunidade social no trabalho",
        "Qualidade da liderança",
        "Confiança horizontal",
        "Confiança vertical",
        "Justiça e respeito",
        "Auto-eficácia",
        "Significado do trabalho",
        "Compromisso com local de trabalho",
        "Satisfação no trabalho",
        "Saúde geral"
    }
    
    def inverter_valor(self, valor: int) -> int:
        """Inverte valor na escala 1-5 (1→5, 2→4, 3→3, 4→2, 5→1)."""
        return 6 - valor
    
    def calcular_pontuacao_item(self, valor: int, id_pergunta: str) -> int:
        """Calcula pontuação do item, invertendo se necessário."""
        if id_pergunta in self.ITENS_INVERTIDOS:
            return self.inverter_valor(valor)
        return valor
    
    def calcular_media_dimensao(
        self, 
        respostas: List[Dict], 
        perguntas_dimensao: List[Dict]
    ) -> float:
        """
        Calcula média dos itens de uma dimensão.
        
        Args:
            respostas: Lista de dicts com {idPergunta, valor}
            perguntas_dimensao: Lista de perguntas da dimensão
        
        Returns:
            Média calculada ou None se não houver respostas válidas
        """
        valores = []
        respostas_map = {r["idPergunta"]: r["valor"] for r in respostas}
        
        for pergunta in perguntas_dimensao:
            id_perg = pergunta["idPergunta"]
            if id_perg in respostas_map:
                valor_original = respostas_map[id_perg]
                valor_calculado = self.calcular_pontuacao_item(valor_original, id_perg)
                valores.append(valor_calculado)
        
        if not valores:
            return None
        
        return sum(valores) / len(valores)
    
    def classificar_tercil(
        self, 
        media: float, 
        nome_dimensao: str
    ) -> ClassificacaoTercil:
        """
        Classifica a média em tercil (semáforo).
        
        A interpretação inverte para fatores de proteção:
        - Risco: maior valor = pior
        - Proteção: maior valor = melhor
        """
        eh_protecao = nome_dimensao in self.DIMENSOES_PROTECAO
        
        if eh_protecao:
            # Para proteção: maior valor = melhor
            if media >= self.LIMITE_TERCIL_SUPERIOR:
                return ClassificacaoTercil.FAVORAVEL
            elif media > self.LIMITE_TERCIL_INFERIOR:
                return ClassificacaoTercil.INTERMEDIARIO
            else:
                return ClassificacaoTercil.RISCO
        else:
            # Para risco: menor valor = melhor
            if media <= self.LIMITE_TERCIL_INFERIOR:
                return ClassificacaoTercil.FAVORAVEL
            elif media < self.LIMITE_TERCIL_SUPERIOR:
                return ClassificacaoTercil.INTERMEDIARIO
            else:
                return ClassificacaoTercil.RISCO
    
    def calcular_resultado_completo(
        self, 
        respostas: List[Dict],
        perguntas: List[Dict]
    ) -> Dict:
        """
        Calcula resultado completo do questionário.
        
        Returns:
            Dict com médias e classificações por dimensão e domínio
        """
        # Agrupar perguntas por dimensão
        perguntas_por_dimensao = {}
        for p in perguntas:
            dim = p["dimensao"]
            if dim not in perguntas_por_dimensao:
                perguntas_por_dimensao[dim] = []
            perguntas_por_dimensao[dim].append(p)
        
        resultados = {
            "dimensoes": {},
            "dominios": {},
            "resumo": {
                "favoravel": 0,
                "intermediario": 0,
                "risco": 0
            }
        }
        
        for dimensao, perguntas_dim in perguntas_por_dimensao.items():
            media = self.calcular_media_dimensao(respostas, perguntas_dim)
            if media is not None:
                classificacao = self.classificar_tercil(media, dimensao)
                resultados["dimensoes"][dimensao] = {
                    "media": round(media, 2),
                    "classificacao": classificacao.value
                }
                resultados["resumo"][classificacao.value] += 1
        
        return resultados
```

---

### 4. Tratamento de Comportamentos Ofensivos

As perguntas de comportamentos ofensivos têm formato especial:
- **Escala própria**: Não/Poucas vezes/Mensalmente/Semanalmente/Diariamente
- **Sub-pergunta condicional**: "De quem?" (se resposta ≠ Não)
- **Não calculam média**: Reportados como indicadores separados

#### Estrutura completa no banco:

```javascript
{
  "idPergunta": "CO_ASI_01",
  "codigoDominio": "CO",
  "dominio": "Comportamentos Ofensivos",
  "dimensao": "Atenção sexual indesejada",
  "texto": "Foi exposto(a) a atenção sexual indesejada no seu local de trabalho durante os últimos 12 meses?",
  "tipoEscala": "comportamento_ofensivo",
  "sinal": "risco",
  "escala": 5,
  "ordem": 73,
  "opcoesResposta": [
    {"valor": 0, "texto": "Não"},
    {"valor": 1, "texto": "Sim, poucas vezes"},
    {"valor": 2, "texto": "Sim, mensalmente"},
    {"valor": 3, "texto": "Sim, semanalmente"},
    {"valor": 4, "texto": "Sim, diariamente"}
  ],
  "subPergunta": {
    "id": "CO_ASI_01_QUEM",
    "condicao": "valor > 0",
    "texto": "Se sim, de quem?",
    "tipoResposta": "multipla_escolha",
    "permiteMultipla": true,
    "opcoes": [
      "Colegas de trabalho",
      "Gestor/chefia direta",
      "Subordinados",
      "Clientes/pacientes/alunos"
    ]
  },
  "ativo": true
}
```

#### Interpretação dos Comportamentos Ofensivos:

| Valor | Frequência | Classificação |
|-------|------------|---------------|
| 0 | Não | Sem exposição |
| 1-2 | Poucas vezes / Mensalmente | Exposição ocasional |
| 3-4 | Semanalmente / Diariamente | Exposição frequente (crítico) |

---

### 5. Valores de Referência Normativos (Opcional)

Para comparação com a população portuguesa, incluir tabela de referência:

```javascript
// Coleção: referencias_normativas
{
  "idQuestionario": ObjectId("..."),
  "populacao": "Trabalhadores portugueses",
  "anoEstudo": 2012,
  "n": 4162,
  "dimensoes": {
    "Exigências quantitativas": {
      "media": 2.45,
      "dp": 0.89,
      "tercilInferior": 1.89,
      "tercilSuperior": 3.00
    },
    // ... outras dimensões
  }
}
```

---

### 6. Atualização do Modelo Conceitual

#### [MODIFICAR] [ModeloConceitual.json](file:///root/LuzIA/backend/mongo/ModeloConceitual.json)

Adicionar:
- Campo `tipoEscala` (frequencia | intensidade | comportamento_ofensivo)
- Campo `codigoDominio` para facilitar agrupamentos
- Objeto `subPergunta` para perguntas condicionais
- Array `opcoesResposta` com objetos {valor, texto}

---

## Arquivos a Criar/Modificar

| Ação | Arquivo | Descrição |
|------|---------|-----------|
| **NOVO** | `backend/mongo/seed_copsoq_ii.js` | Script de seed com todas as 76 perguntas |
| **NOVO** | `backend/src/app/services/copsoq_scoring_service.py` | Serviço de cálculo de pontuação |
| **NOVO** | `backend/tests/unit/test_copsoq_scoring.py` | Testes unitários do scoring |
| **MODIFICAR** | `backend/mongo/ModeloConceitual.json` | Adicionar novos campos |
| **OPCIONAL** | `backend/mongo/seed_referencias_normativas.js` | Valores de referência da população |

---

## Plano de Verificação

### Testes Automatizados

1. **Teste de validação do seed**:
```bash
mongosh LuzIA --eval "
  const q = db.questionarios.findOne({nome: /COPSOQ/});
  const totalPerguntas = db.perguntas.countDocuments({idQuestionario: q._id});
  const totalDimensoes = db.perguntas.distinct('dimensao', {idQuestionario: q._id}).length;
  print('Total perguntas: ' + totalPerguntas + ' (esperado: 76)');
  print('Total dimensões: ' + totalDimensoes + ' (esperado: 29)');
  assert.eq(totalPerguntas, 76, 'Deve haver 76 perguntas');
"
```

2. **Testes unitários do scoring service**:
```bash
cd /root/LuzIA/backend
pytest tests/unit/test_copsoq_scoring.py -v
```

3. **Testes de inversão de itens**:
```python
# test_copsoq_scoring.py
def test_itens_invertidos():
    service = COPSOQScoringService()
    assert service.calcular_pontuacao_item(1, "VLT_CV_03") == 5
    assert service.calcular_pontuacao_item(5, "VLT_CV_03") == 1
    assert service.calcular_pontuacao_item(3, "EL_EQ_01") == 3  # não invertido
```

### Verificação Manual

1. Validar via MongoDB Compass:
   - Verificar se questionário COPSOQ II foi criado
   - Verificar se todas as dimensões estão mapeadas
   - Verificar se itens invertidos estão marcados

2. Testar cálculo de pontuação com respostas de exemplo

---

## Decisões de Implementação

> [!NOTE]
> **Decisões já tomadas neste plano:**
>
> 1. **Versão média (76 perguntas)**: Utilizamos a estrutura completa conforme o manual COPSOQ II
> 2. **Armazenamento de sub-perguntas**: Sim, para comportamentos ofensivos
> 3. **IDs consistentes**: Formato `DOMINIO_DIMENSAO_NUMERO` (ex: `EL_EQ_01`)
> 4. **Itens invertidos identificados**: `VLT_CV_03` e `VLT_CH_01`
