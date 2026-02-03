# Implementação do Questionário COPSOQ II - Plano Final

> **Versão:** 2.0  
> **Data:** 2026-02-03  
> **Status:** Aprovado para implementação

Este documento consolida a especificação completa para implementar **duas versões** do questionário COPSOQ II no sistema LuzIA: a versão curta brasileira (40 itens) e a versão média portuguesa (76 perguntas).

---

## Sumário

1. [Visão Geral](#1-visão-geral)
2. [Versão Curta Brasileira (40 itens)](#2-versão-curta-brasileira-40-itens)
3. [Versão Média Portuguesa (76 perguntas)](#3-versão-média-portuguesa-76-perguntas)
4. [Esquema MongoDB](#4-esquema-mongodb)
5. [Modelos Pydantic](#5-modelos-pydantic)
6. [Lógica de Scoring](#6-lógica-de-scoring)
7. [Plano de Execução](#7-plano-de-execução)
8. [Verificação](#8-verificação)

---

## 1. Visão Geral

O **COPSOQ II** (Copenhagen Psychosocial Questionnaire) é um instrumento validado para avaliação de riscos psicossociais no trabalho. O sistema suportará duas versões oficiais:

| Versão | Código | Idioma | Itens | Domínios | Dimensões | Referência |
|--------|--------|--------|-------|----------|-----------|------------|
| **Curta** | `COPSOQ_CURTA_BR` | Português-Brasil | 40 | 7 | 23 | Gonçalves, Moriguchi, Chaves & Sato (2021) |
| **Média** | `COPSOQ_MEDIA_PT` | Português-Portugal | 76 | 8 | 29 | COPSOQ II Versão Portuguesa |

### Características Comuns

| Característica | Valor |
|----------------|-------|
| Escala principal | Likert 5 pontos (0-4 ou 1-5) |
| Classificação | Tercis (verde/amarelo/vermelho) |
| Itens invertidos | Apenas na versão média (2 itens) |

---

## 2. Versão Curta Brasileira (40 itens)

### 2.1 Domínios e Dimensões

| Domínio | Código | Dimensões | Itens |
|---------|--------|-----------|-------|
| Exigências Laborais | `EL` | Exigências quantitativas, Ritmo de trabalho, Exigências emocionais | 6 |
| Organização do Trabalho e Conteúdo | `OTC` | Influência no trabalho, Possibilidades de desenvolvimento, Significado do trabalho, Compromisso com local de trabalho | 8 |
| Relações Sociais e Liderança | `RSL` | Previsibilidade, Recompensas, Transparência do papel, Qualidade da liderança, Apoio social de superiores | 10 |
| Interface Trabalho-Indivíduo | `ITI` | Satisfação no trabalho, Conflito trabalho-família | 3 |
| Valores no Local de Trabalho | `VLT` | Confiança vertical, Justiça e respeito | 4 |
| Saúde e Bem-Estar | `SBE` | Saúde geral, Burnout, Stress | 5 |
| Comportamentos Ofensivos | `CO` | Atenção sexual indesejada, Ameaças de violência, Violência física, Bullying | 4 |

### 2.2 Tipos de Escala

| Tipo | Valores | Uso |
|------|---------|-----|
| `frequencia` | Nunca (0) → Sempre (4) | Maioria das perguntas |
| `intensidade` | Muito pouco (0) → Em grande parte (4) | Perguntas 5-12 |
| `satisfacao` | Muito insatisfeito (0) → Muito satisfeito (3) | Pergunta 13 |
| `conflito_tf` | Não, realmente não (0) → Sim, com certeza (3) | Perguntas 14A, 14B |
| `saude_geral` | Ruim (0) → Excelente (4) | Pergunta 17 |
| `comportamento_ofensivo` | Não (0) → Diariamente (4) | Perguntas 20-23 |

### 2.3 Mapeamento Completo das 40 Perguntas

#### EL - Exigências Laborais (6 itens)

| ID | Dimensão | Texto | Escala | Sinal |
|----|----------|-------|--------|-------|
| EL_EQ_01A | Exigências quantitativas | Você atrasa a entrega do seu trabalho? | frequencia | risco |
| EL_EQ_01B | Exigências quantitativas | O tempo para realizar as suas tarefas no trabalho é suficiente? | frequencia_inv | proteção |
| EL_RT_01A | Ritmo de trabalho | É necessário manter um ritmo acelerado no trabalho? | frequencia | risco |
| EL_RT_01B | Ritmo de trabalho | Você trabalha em ritmo acelerado ao longo de toda jornada? | frequencia | risco |
| EL_EE_01A | Exigências emocionais | Seu trabalho coloca você em situações emocionalmente desgastantes? | frequencia | risco |
| EL_EE_01B | Exigências emocionais | Você tem que lidar com os problemas pessoais de outras pessoas como parte do seu trabalho? | frequencia | risco |

#### OTC - Organização do Trabalho e Conteúdo (8 itens)

| ID | Dimensão | Texto | Escala | Sinal |
|----|----------|-------|--------|-------|
| OTC_IT_01A | Influência no trabalho | Você tem um alto grau de influência nas decisões sobre o seu trabalho? | frequencia | proteção |
| OTC_IT_01B | Influência no trabalho | Você pode interferir na quantidade de trabalho atribuída a você? | frequencia | proteção |
| OTC_PD_01A | Possibilidades de desenvolvimento | Você tem a possibilidade de aprender coisas novas através do seu trabalho? | intensidade | proteção |
| OTC_PD_01B | Possibilidades de desenvolvimento | Seu trabalho exige que você tome iniciativas? | intensidade | proteção |
| OTC_ST_01A | Significado do trabalho | Seu trabalho é significativo? | intensidade | proteção |
| OTC_ST_01B | Significado do trabalho | Você sente que o trabalho que faz é importante? | intensidade | proteção |
| OTC_CLT_01A | Compromisso com local de trabalho | Você sente que o seu local de trabalho é muito importante para você? | intensidade | proteção |
| OTC_CLT_01B | Compromisso com local de trabalho | Você recomendaria a um amigo que se candidatasse a uma vaga no seu local de trabalho? | intensidade | proteção |

#### RSL - Relações Sociais e Liderança (10 itens)

| ID | Dimensão | Texto | Escala | Sinal |
|----|----------|-------|--------|-------|
| RSL_PR_01A | Previsibilidade | No seu local de trabalho, você é informado antecipadamente sobre decisões importantes, mudanças ou planos para o futuro? | intensidade | proteção |
| RSL_PR_01B | Previsibilidade | Você recebe toda a informação necessária para fazer bem o seu trabalho? | intensidade | proteção |
| RSL_RE_01A | Recompensas | O seu trabalho é reconhecido e valorizado pelos seus superiores? | intensidade | proteção |
| RSL_RE_01B | Recompensas | Você é tratado de forma justa no seu local de trabalho? | intensidade | proteção |
| RSL_TP_01A | Transparência do papel | O seu trabalho tem objetivos/metas claros(as)? | intensidade | proteção |
| RSL_TP_01B | Transparência do papel | Você sabe exatamente o que se espera de você no trabalho? | intensidade | proteção |
| RSL_QL_01A | Qualidade da liderança | Você diria que o seu superior imediato dá alta prioridade para a satisfação com trabalho? | intensidade | proteção |
| RSL_QL_01B | Qualidade da liderança | Você diria que o seu superior imediato é bom no planejamento do trabalho? | intensidade | proteção |
| RSL_ASS_01A | Apoio social de superiores | Com que frequência o seu superior imediato está disposto a ouvir os seus problemas no trabalho? | frequencia | proteção |
| RSL_ASS_01B | Apoio social de superiores | Com que frequência você recebe ajuda e suporte do seu superior imediato? | frequencia | proteção |

#### ITI - Interface Trabalho-Indivíduo (3 itens)

| ID | Dimensão | Texto | Escala | Sinal |
|----|----------|-------|--------|-------|
| ITI_ST_01 | Satisfação no trabalho | Qual o seu nível de satisfação com o seu trabalho como um todo, considerando todos os aspectos? | satisfacao | proteção |
| ITI_CTF_01A | Conflito trabalho-família | Você sente que o seu trabalho consome tanto sua energia que ele tem um efeito negativo na sua vida particular? | conflito_tf | risco |
| ITI_CTF_01B | Conflito trabalho-família | Você sente que o seu trabalho ocupa tanto tempo que ele tem um efeito negativo na sua vida particular? | conflito_tf | risco |

#### VLT - Valores no Local de Trabalho (4 itens)

| ID | Dimensão | Texto | Escala | Sinal |
|----|----------|-------|--------|-------|
| VLT_CV_01A | Confiança vertical | Você pode confiar nas informações que vêm dos seus superiores? | intensidade | proteção |
| VLT_CV_01B | Confiança vertical | Os seus superiores confiam que os funcionários farão bem seu trabalho? | intensidade | proteção |
| VLT_JR_01A | Justiça e respeito | Os conflitos são resolvidos de forma justa? | intensidade | proteção |
| VLT_JR_01B | Justiça e respeito | O trabalho é distribuído de forma justa? | intensidade | proteção |

#### SBE - Saúde e Bem-Estar (5 itens)

| ID | Dimensão | Texto | Escala | Sinal |
|----|----------|-------|--------|-------|
| SBE_SG_01 | Saúde geral | Em geral, você diria que a sua saúde é: | saude_geral | proteção |
| SBE_BO_01A | Burnout | Com que frequência você tem se sentido fisicamente esgotado? | frequencia | risco |
| SBE_BO_01B | Burnout | Com que frequência você tem se sentido emocionalmente esgotado? | frequencia | risco |
| SBE_ST_01A | Stress | Com que frequência você tem se sentido estressado? | frequencia | risco |
| SBE_ST_01B | Stress | Com que frequência você tem se sentido irritado? | frequencia | risco |

#### CO - Comportamentos Ofensivos (4 itens)

| ID | Dimensão | Texto | Escala |
|----|----------|-------|--------|
| CO_ASI_01 | Atenção sexual indesejada | Você foi exposto a atenção sexual indesejada no seu local de trabalho durante os últimos 12 meses? | comportamento_ofensivo |
| CO_AV_01 | Ameaças de violência | Você foi exposto a ameaças de violência no seu local de trabalho nos últimos 12 meses? | comportamento_ofensivo |
| CO_VF_01 | Violência física | Você foi exposto a violência física em seu local de trabalho durante os últimos 12 meses? | comportamento_ofensivo |
| CO_BU_01 | Bullying | Você foi exposto a "bullying" no seu local de trabalho nos últimos 12 meses? | comportamento_ofensivo |

---

## 3. Versão Média Portuguesa (76 perguntas)

### 3.1 Domínios e Dimensões

| Domínio | Código | Dimensões | Itens |
|---------|--------|-----------|-------|
| Exigências Laborais | `EL` | Exigências quantitativas, Ritmo de trabalho, Exigências cognitivas, Exigências emocionais | 8 |
| Organização do Trabalho e Conteúdo | `OTC` | Influência no trabalho, Possibilidades de desenvolvimento, Significado do trabalho, Compromisso com local de trabalho | 12 |
| Relações Sociais e Liderança | `RSL` | Previsibilidade, Recompensas, Transparência do papel, Conflitos de papéis, Qualidade da liderança, Apoio social de superiores, Apoio social de colegas | 21 |
| Interface Trabalho-Indivíduo | `ITI` | Insegurança laboral, Satisfação no trabalho, Conflito trabalho-família | 8 |
| Valores no Local de Trabalho | `VLT` | Confiança vertical, Confiança horizontal, Justiça e respeito, Comunidade social no trabalho | 12 |
| Personalidade | `PER` | Auto-eficácia | 2 |
| Saúde e Bem-Estar | `SBE` | Saúde geral, Stress, Burnout, Problemas em dormir, Sintomas depressivos | 9 |
| Comportamentos Ofensivos | `CO` | Atenção sexual indesejada, Ameaças de violência, Violência física, Bullying | 4 |

### 3.2 Mapeamento Completo das 76 Perguntas

#### EL - Exigências Laborais (8 itens)

| ID | Dimensão | Texto | Sinal |
|----|----------|-------|-------|
| EL_EQ_01 | Exigências quantitativas | A sua carga de trabalho acumula-se por ser mal distribuída? | risco |
| EL_EQ_02 | Exigências quantitativas | Com que frequência não tem tempo para completar todas as tarefas? | risco |
| EL_EQ_03 | Exigências quantitativas | Precisa fazer horas extra? | risco |
| EL_RT_01 | Ritmo de trabalho | Precisa trabalhar muito rapidamente? | risco |
| EL_EC_01 | Exigências cognitivas | O seu trabalho exige a sua atenção constante? | risco |
| EL_EC_02 | Exigências cognitivas | O seu trabalho requer que tome decisões difíceis? | risco |
| EL_EC_03 | Exigências cognitivas | O seu trabalho requer que seja bom a propor novas ideias? | risco |
| EL_EE_01 | Exigências emocionais | O seu trabalho é emocionalmente exigente? | risco |

#### OTC - Organização do Trabalho e Conteúdo (12 itens)

| ID | Dimensão | Texto | Sinal |
|----|----------|-------|-------|
| OTC_IT_01 | Influência no trabalho | Tem influência sobre a quantidade de trabalho que lhe compete? | proteção |
| OTC_IT_02 | Influência no trabalho | Tem influência sobre o tipo de tarefas que faz? | proteção |
| OTC_IT_03 | Influência no trabalho | Tem influência sobre a ordem de realização das tarefas? | proteção |
| OTC_IT_04 | Influência no trabalho | Participa na escolha das pessoas com quem trabalha? | proteção |
| OTC_PD_01 | Possibilidades de desenvolvimento | O seu trabalho exige que tenha iniciativa? | proteção |
| OTC_PD_02 | Possibilidades de desenvolvimento | O seu trabalho permite-lhe aprender coisas novas? | proteção |
| OTC_PD_03 | Possibilidades de desenvolvimento | O seu trabalho permite-lhe usar as suas competências? | proteção |
| OTC_ST_01 | Significado do trabalho | O seu trabalho tem significado para si? | proteção |
| OTC_ST_02 | Significado do trabalho | Sente que o trabalho que faz é importante? | proteção |
| OTC_ST_03 | Significado do trabalho | Sente-se motivado e envolvido no seu trabalho? | proteção |
| OTC_CLT_01 | Compromisso com local de trabalho | Gosta de falar sobre o seu local de trabalho com outras pessoas? | proteção |
| OTC_CLT_02 | Compromisso com local de trabalho | Sente que os problemas do seu local de trabalho são seus também? | proteção |

#### RSL - Relações Sociais e Liderança (21 itens)

| ID | Dimensão | Texto | Sinal |
|----|----------|-------|-------|
| RSL_PR_01 | Previsibilidade | É informado com antecedência sobre decisões importantes? | proteção |
| RSL_PR_02 | Previsibilidade | Recebe toda a informação de que necessita para fazer bem o trabalho? | proteção |
| RSL_RE_01 | Recompensas | O seu trabalho é reconhecido e apreciado pela chefia? | proteção |
| RSL_RE_02 | Recompensas | A chefia do seu local de trabalho respeita-o(a)? | proteção |
| RSL_RE_03 | Recompensas | É tratado(a) de forma justa no seu local de trabalho? | proteção |
| RSL_TP_01 | Transparência do papel | O seu trabalho tem objetivos claros? | proteção |
| RSL_TP_02 | Transparência do papel | Sabe exatamente o que é esperado de si no trabalho? | proteção |
| RSL_TP_03 | Transparência do papel | Sabe exatamente quais são as suas responsabilidades? | proteção |
| RSL_CP_01 | Conflitos de papéis | Faz coisas no trabalho que uns aceitam mas outros não? | risco |
| RSL_CP_02 | Conflitos de papéis | Por vezes tem de fazer coisas que deveriam ser feitas de outra forma? | risco |
| RSL_CP_03 | Conflitos de papéis | Por vezes tem de fazer coisas que considera desnecessárias? | risco |
| RSL_QL_01 | Qualidade da liderança | A sua chefia garante boas oportunidades de desenvolvimento? | proteção |
| RSL_QL_02 | Qualidade da liderança | A sua chefia dá prioridade à satisfação no trabalho? | proteção |
| RSL_QL_03 | Qualidade da liderança | A sua chefia é boa a planear o trabalho? | proteção |
| RSL_QL_04 | Qualidade da liderança | A sua chefia é boa a resolver conflitos? | proteção |
| RSL_ASS_01 | Apoio social de superiores | Com que frequência a sua chefia fala consigo sobre o seu trabalho? | proteção |
| RSL_ASS_02 | Apoio social de superiores | Com que frequência tem ajuda e apoio da sua chefia? | proteção |
| RSL_ASS_03 | Apoio social de superiores | Com que frequência a sua chefia fala sobre o seu desempenho? | proteção |
| RSL_ASC_01 | Apoio social de colegas | Com que frequência tem ajuda e apoio dos colegas? | proteção |
| RSL_ASC_02 | Apoio social de colegas | Com que frequência os colegas falam consigo sobre o seu desempenho? | proteção |
| RSL_ASC_03 | Apoio social de colegas | Com que frequência os colegas estão disponíveis para o/a ouvir? | proteção |

#### ITI - Interface Trabalho-Indivíduo (8 itens)

| ID | Dimensão | Texto | Sinal |
|----|----------|-------|-------|
| ITI_IL_01 | Insegurança laboral | Sente-se preocupado(a) em ficar desempregado(a)? | risco |
| ITI_ST_01 | Satisfação no trabalho | Em relação ao seu trabalho em geral, quão satisfeito(a) está? | proteção |
| ITI_ST_02 | Satisfação no trabalho | Quão satisfeito está com as suas perspetivas de trabalho? | proteção |
| ITI_ST_03 | Satisfação no trabalho | Quão satisfeito está com as condições físicas do local de trabalho? | proteção |
| ITI_ST_04 | Satisfação no trabalho | Quão satisfeito está com a forma como as suas capacidades são utilizadas? | proteção |
| ITI_CTF_01 | Conflito trabalho-família | O seu trabalho exige muita energia, afetando a sua vida privada? | risco |
| ITI_CTF_02 | Conflito trabalho-família | O seu trabalho exige muito tempo, afetando a sua vida privada? | risco |
| ITI_CTF_03 | Conflito trabalho-família | A sua família e amigos dizem que trabalha demais? | risco |

#### VLT - Valores no Local de Trabalho (12 itens)

| ID | Dimensão | Texto | Sinal | Inv. |
|----|----------|-------|-------|------|
| VLT_CV_01 | Confiança vertical | A chefia confia nos trabalhadores para fazerem bem o trabalho? | proteção | N |
| VLT_CV_02 | Confiança vertical | Confia na informação da chefia? | proteção | N |
| VLT_CV_03 | Confiança vertical | A chefia esconde informação dos trabalhadores? | risco | **S** |
| VLT_CH_01 | Confiança horizontal | Os trabalhadores escondem informação uns dos outros? | risco | **S** |
| VLT_CH_02 | Confiança horizontal | Os trabalhadores escondem informação da chefia? | risco | N |
| VLT_CH_03 | Confiança horizontal | Confia nos seus colegas de trabalho? | proteção | N |
| VLT_JR_01 | Justiça e respeito | Os conflitos são resolvidos de forma justa? | proteção | N |
| VLT_JR_02 | Justiça e respeito | As sugestões dos trabalhadores são tratadas com seriedade? | proteção | N |
| VLT_JR_03 | Justiça e respeito | O trabalho é distribuído de forma justa? | proteção | N |
| VLT_CST_01 | Comunidade social no trabalho | Há um bom ambiente entre colegas? | proteção | N |
| VLT_CST_02 | Comunidade social no trabalho | Há boa cooperação entre os colegas? | proteção | N |
| VLT_CST_03 | Comunidade social no trabalho | Sente-se parte de uma comunidade no local de trabalho? | proteção | N |

#### PER - Personalidade (2 itens)

| ID | Dimensão | Texto | Sinal |
|----|----------|-------|-------|
| PER_AE_01 | Auto-eficácia | É capaz de resolver a maioria dos problemas se se esforçar? | proteção |
| PER_AE_02 | Auto-eficácia | Consegue sempre resolver problemas difíceis se tentar o suficiente? | proteção |

#### SBE - Saúde e Bem-Estar (9 itens)

| ID | Dimensão | Texto | Sinal |
|----|----------|-------|-------|
| SBE_SG_01 | Saúde geral | Em geral, como descreveria a sua saúde? | proteção |
| SBE_ST_01 | Stress | Com que frequência se sentiu stressado(a)? | risco |
| SBE_ST_02 | Stress | Com que frequência se sentiu tenso(a) ou nervoso(a)? | risco |
| SBE_BO_01 | Burnout | Com que frequência se sentiu fisicamente exausto(a)? | risco |
| SBE_BO_02 | Burnout | Com que frequência se sentiu emocionalmente exausto(a)? | risco |
| SBE_PD_01 | Problemas em dormir | Com que frequência teve dificuldades em adormecer? | risco |
| SBE_PD_02 | Problemas em dormir | Com que frequência acordou várias vezes durante a noite? | risco |
| SBE_SD_01 | Sintomas depressivos | Com que frequência se sentiu triste? | risco |
| SBE_SD_02 | Sintomas depressivos | Com que frequência sentiu falta de interesse pelas coisas? | risco |

#### CO - Comportamentos Ofensivos (4 itens)

| ID | Dimensão | Texto | Escala |
|----|----------|-------|--------|
| CO_ASI_01 | Atenção sexual indesejada | Foi exposto(a) a atenção sexual indesejada nos últimos 12 meses? | comportamento_ofensivo |
| CO_AV_01 | Ameaças de violência | Foi exposto(a) a ameaças de violência nos últimos 12 meses? | comportamento_ofensivo |
| CO_VF_01 | Violência física | Foi exposto(a) a violência física nos últimos 12 meses? | comportamento_ofensivo |
| CO_BU_01 | Bullying | Foi exposto(a) a bullying nos últimos 12 meses? | comportamento_ofensivo |

---

## 4. Esquema MongoDB

### 4.1 Coleção `questionarios`

```javascript
{
  "nome": "COPSOQ II - Versão Curta Brasileira",
  "codigo": "COPSOQ_CURTA_BR",
  "versao": "2.0",
  "tipo": "psicossocial",
  "idioma": "pt-BR",
  "descricao": "Copenhagen Psychosocial Questionnaire II - Versão Curta validada para o Brasil (Gonçalves et al., 2021)",
  "dominios": [
    {"codigo": "EL", "nome": "Exigências Laborais", "ordem": 1},
    {"codigo": "OTC", "nome": "Organização do Trabalho e Conteúdo", "ordem": 2},
    {"codigo": "RSL", "nome": "Relações Sociais e Liderança", "ordem": 3},
    {"codigo": "ITI", "nome": "Interface Trabalho-Indivíduo", "ordem": 4},
    {"codigo": "VLT", "nome": "Valores no Local de Trabalho", "ordem": 5},
    {"codigo": "SBE", "nome": "Saúde e Bem-Estar", "ordem": 6},
    {"codigo": "CO", "nome": "Comportamentos Ofensivos", "ordem": 7}
  ],
  "escalasPossiveis": ["frequencia", "intensidade", "satisfacao", "conflito_tf", "saude_geral", "comportamento_ofensivo"],
  "totalPerguntas": 40,
  "ativo": true
}
```

### 4.2 Coleção `perguntas`

```javascript
{
  "idQuestionario": ObjectId("..."),
  "codigoDominio": "EL",
  "dominio": "Exigências Laborais",
  "dimensao": "Exigências quantitativas",
  "idPergunta": "EL_EQ_01A",
  "texto": "Você atrasa a entrega do seu trabalho?",
  "tipoEscala": "frequencia",
  "sinal": "risco",
  "itemInvertido": false,
  "ordem": 1,
  "opcoesResposta": [
    {"valor": 4, "texto": "Sempre"},
    {"valor": 3, "texto": "Frequentemente"},
    {"valor": 2, "texto": "Às vezes"},
    {"valor": 1, "texto": "Raramente"},
    {"valor": 0, "texto": "Nunca"}
  ],
  "subPergunta": null,
  "ativo": true
}
```

### 4.3 Estrutura para Comportamentos Ofensivos

```javascript
{
  "idPergunta": "CO_ASI_01",
  "tipoEscala": "comportamento_ofensivo",
  "opcoesResposta": [
    {"valor": 0, "texto": "Não"},
    {"valor": 1, "texto": "Sim, poucas vezes"},
    {"valor": 2, "texto": "Sim, mensalmente"},
    {"valor": 3, "texto": "Sim, semanalmente"},
    {"valor": 4, "texto": "Sim, diariamente"}
  ],
  "subPergunta": {
    "condicao": "valor > 0",
    "texto": "Se sim, de quem?",
    "tipoResposta": "multipla_escolha",
    "opcoes": ["Colegas", "Gerente, supervisor", "Subordinados", "Clientes, fregueses, pacientes"]
  }
}
```

---

## 5. Modelos Pydantic

### 5.1 Novos Modelos (adicionar a `base.py`)

```python
# Novas classes auxiliares
class Dominio(BaseModel):
    codigo: str
    nome: str
    ordem: int
    descricao: Optional[str] = None

class OpcaoResposta(BaseModel):
    valor: int
    texto: str

class SubPergunta(BaseModel):
    condicao: str
    texto: str
    tipoResposta: str
    opcoes: List[str]
```

### 5.2 Modelo `Questionario` Atualizado

```python
class Questionario(BaseModel):
    nome: str
    codigo: str  # NOVO: "COPSOQ_CURTA_BR" ou "COPSOQ_MEDIA_PT"
    versao: str
    tipo: str = "psicossocial"
    idioma: str = "pt-BR"  # NOVO
    descricao: str
    dominios: List[Dominio]  # ALTERADO: era List[str]
    escalasPossiveis: List[str]  # NOVO: substitui 'escala'
    totalPerguntas: int
    ativo: bool = True
```

### 5.3 Modelo `Pergunta` Atualizado

```python
class Pergunta(BaseModel):
    idQuestionario: Any
    codigoDominio: str  # NOVO
    dominio: str
    dimensao: str
    idPergunta: str
    texto: str
    tipoEscala: str  # RENOMEADO: era 'tipo'
    sinal: str = "risco"
    itemInvertido: bool = False
    ordem: int  # NOVO
    opcoesResposta: List[OpcaoResposta]  # NOVO
    subPergunta: Optional[SubPergunta] = None  # NOVO
    ativo: bool = True
```

> [!WARNING]
> **Breaking Change**: As alterações em `Questionario` e `Pergunta` requerem atualização de código existente que consome esses modelos.

---

## 6. Lógica de Scoring

### 6.1 Sistema de Tercis

| Classificação | Cor | Fator Risco | Fator Proteção |
|---------------|-----|-------------|----------------|
| Favorável | 🟢 Verde | média ≤ 2.33 | média ≥ 3.67 |
| Intermediário | 🟡 Amarelo | 2.33 < média < 3.67 | 2.33 < média < 3.67 |
| Risco | 🔴 Vermelho | média ≥ 3.67 | média ≤ 2.33 |

### 6.2 Dimensões de Proteção vs Risco

**Proteção** (maior = melhor): Influência no trabalho, Possibilidades de desenvolvimento, Significado do trabalho, Compromisso, Previsibilidade, Recompensas, Transparência do papel, Qualidade da liderança, Apoio social (superiores e colegas), Confiança (vertical e horizontal), Justiça e respeito, Comunidade social, Auto-eficácia, Satisfação no trabalho, Saúde geral

**Risco** (maior = pior): Exigências (quantitativas, cognitivas, emocionais), Ritmo de trabalho, Conflitos de papéis, Insegurança laboral, Conflito trabalho-família, Stress, Burnout, Problemas em dormir, Sintomas depressivos

### 6.3 Itens Invertidos (Apenas versão média)

Os seguintes itens requerem inversão (1→5, 2→4, 3→3, 4→2, 5→1):
- `VLT_CV_03` - A chefia esconde informação dos trabalhadores?
- `VLT_CH_01` - Os trabalhadores escondem informação uns dos outros?

### 6.4 Serviço de Scoring

Arquivo: `backend/src/app/services/copsoq_scoring_service.py`

```python
from typing import List, Dict, Optional
from enum import Enum

class ClassificacaoTercil(str, Enum):
    FAVORAVEL = "favoravel"
    INTERMEDIARIO = "intermediario"
    RISCO = "risco"

class COPSOQScoringService:
    LIMITE_INFERIOR = 2.33
    LIMITE_SUPERIOR = 3.67
    
    ITENS_INVERTIDOS = {
        "COPSOQ_MEDIA_PT": {"VLT_CV_03", "VLT_CH_01"},
        "COPSOQ_CURTA_BR": set()  # Versão curta não tem itens invertidos
    }
    
    DIMENSOES_PROTECAO = {
        "Influência no trabalho", "Possibilidades de desenvolvimento",
        "Significado do trabalho", "Compromisso com local de trabalho",
        "Previsibilidade", "Recompensas", "Transparência do papel",
        "Qualidade da liderança", "Apoio social de superiores",
        "Apoio social de colegas", "Confiança vertical", "Confiança horizontal",
        "Justiça e respeito", "Comunidade social no trabalho",
        "Auto-eficácia", "Satisfação no trabalho", "Saúde geral"
    }
    
    def inverter_valor(self, valor: int, escala_max: int = 5) -> int:
        return (escala_max + 1) - valor
    
    def calcular_pontuacao_item(self, valor: int, id_pergunta: str, codigo_questionario: str) -> int:
        itens_inv = self.ITENS_INVERTIDOS.get(codigo_questionario, set())
        if id_pergunta in itens_inv:
            return self.inverter_valor(valor)
        return valor
    
    def classificar_tercil(self, media: float, dimensao: str) -> ClassificacaoTercil:
        eh_protecao = dimensao in self.DIMENSOES_PROTECAO
        
        if eh_protecao:
            if media >= self.LIMITE_SUPERIOR:
                return ClassificacaoTercil.FAVORAVEL
            elif media > self.LIMITE_INFERIOR:
                return ClassificacaoTercil.INTERMEDIARIO
            return ClassificacaoTercil.RISCO
        else:
            if media <= self.LIMITE_INFERIOR:
                return ClassificacaoTercil.FAVORAVEL
            elif media < self.LIMITE_SUPERIOR:
                return ClassificacaoTercil.INTERMEDIARIO
            return ClassificacaoTercil.RISCO
```

---

## 7. Plano de Execução

### Sequência de Implementação

| Ordem | Tarefa | Arquivo | Dependências |
|-------|--------|---------|--------------| 
| 1 | Criar modelos auxiliares | `backend/src/app/models/base.py` | - |
| 2 | Atualizar `Questionario` | `backend/src/app/models/base.py` | Passo 1 |
| 3 | Atualizar `Pergunta` | `backend/src/app/models/base.py` | Passo 1 |
| 4 | Implementar scoring service | `backend/src/app/services/copsoq_scoring_service.py` | - |
| 5 | Criar testes unitários | `backend/tests/unit/test_copsoq_scoring.py` | Passo 4 |
| 6 | Criar script seed versão curta BR | `backend/mongo/seed_copsoq_curta_br.js` | Passos 2-3 |
| 7 | Criar script seed versão média PT | `backend/mongo/seed_copsoq_media_pt.js` | Passos 2-3 |
| 8 | Validar integração | - | Todos |

### Arquivos Envolvidos

| Arquivo | Ação | Tipo |
|---------|------|------|
| [base.py](file:///root/LuzIA/backend/src/app/models/base.py) | MODIFICAR | ⚠️ Breaking Change |
| [copsoq_scoring_service.py](file:///root/LuzIA/backend/src/app/services/copsoq_scoring_service.py) | CRIAR | Novo |
| [test_copsoq_scoring.py](file:///root/LuzIA/backend/tests/unit/test_copsoq_scoring.py) | CRIAR | Novo |
| [seed_copsoq_curta_br.js](file:///root/LuzIA/backend/mongo/seed_copsoq_curta_br.js) | CRIAR | Novo |
| [seed_copsoq_media_pt.js](file:///root/LuzIA/backend/mongo/seed_copsoq_media_pt.js) | CRIAR | Novo |

---

## 8. Verificação

### Testes Automatizados

```bash
# Testes unitários do scoring
cd /root/LuzIA/backend
source ../venv/bin/activate
pytest tests/unit/test_copsoq_scoring.py -v

# Validar seed no MongoDB (quando disponível)
mongosh LuzIA --eval "
  const qCurta = db.questionarios.findOne({codigo: 'COPSOQ_CURTA_BR'});
  const qMedia = db.questionarios.findOne({codigo: 'COPSOQ_MEDIA_PT'});
  
  const totalCurta = db.perguntas.countDocuments({idQuestionario: qCurta._id});
  const totalMedia = db.perguntas.countDocuments({idQuestionario: qMedia._id});
  
  print('Versão Curta BR: ' + totalCurta + '/40');
  print('Versão Média PT: ' + totalMedia + '/76');
  
  assert.eq(totalCurta, 40);
  assert.eq(totalMedia, 76);
"
```

### Checklist de Validação

#### Versão Curta Brasileira
- [ ] 40 perguntas inseridas no MongoDB
- [ ] 7 domínios mapeados corretamente
- [ ] 23 dimensões únicas
- [ ] 4 perguntas com `subPergunta` (Comportamentos Ofensivos)
- [ ] Textos em português do Brasil

#### Versão Média Portuguesa
- [ ] 76 perguntas inseridas no MongoDB
- [ ] 8 domínios mapeados corretamente
- [ ] 29 dimensões únicas
- [ ] 2 itens invertidos marcados (`VLT_CV_03`, `VLT_CH_01`)
- [ ] 4 perguntas com `subPergunta` (Comportamentos Ofensivos)
- [ ] Textos em português de Portugal

#### Geral
- [ ] Scoring retorna classificações corretas para casos de teste
- [ ] Modelos Pydantic serializando/desserializando corretamente
- [ ] API listando ambas versões do questionário
