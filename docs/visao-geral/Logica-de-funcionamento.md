# Lógica de Funcionamento do Sistema
## Visão Geral

O sistema tem como objetivo aplicar questionários psicossociais (ex.: COPSOQ II) de forma anônima, coletar respostas, gerar diagnósticos individuais e consolidar relatórios organizacionais, respeitando a privacidade dos participantes e fornecendo indicadores confiáveis para tomada de decisão.

Todo o fluxo é orientado a anonimato, segregação por organização e setor e processamento posterior dos dados, evitando exposição de informações pessoais sensíveis.

### 👤 Gestão de Usuários e Anonimato

Os participantes são registrados na collection usuarios, vinculados a:

#### Uma organização

#### Um setor

#### Cada usuário recebe um anonId, que passa a ser a única referência utilizada em respostas, diagnósticos e análises.

## 📌 Regra de negócio importante:
Nenhuma resposta ou diagnóstico utiliza identificadores pessoais (telefone, email, etc.). O anonId garante rastreabilidade técnica sem quebrar o anonimato.

## 🏢 Organizações e Estrutura

### A collection organizacoes representa empresas ou instituições que aplicam os questionários.

#### Cada organização:

Possui múltiplos usuários

Pode gerar relatórios consolidados

Serve como unidade principal para análises estratégicas

### 📋 Questionários e Estrutura Psicossocial

Os instrumentos de avaliação são definidos na collection questionarios.

Cada questionário:

Possui versão, idioma e código único

É composto por domínios e dimensões psicossociais

Pode ser ativado ou desativado conforme a necessidade

As perguntas associadas ficam na collection perguntas, organizadas por:

Domínio

Dimensão

Ordem de aplicação

Tipo de escala (frequência, intensidade, etc.)

Indicação de risco ou proteção

### 📌 Regra de negócio:
A estrutura do questionário define como as respostas serão interpretadas posteriormente no diagnóstico.

#### 📝 Coleta de Respostas

As respostas dos usuários são armazenadas na collection respostas.

##### Fluxo conceitual:

O usuário responde o questionário

As respostas são vinculadas apenas ao anonId

Cada usuário pode responder uma única vez por questionário

#### 📌 Validação de negócio:
O sistema impede múltiplas respostas do mesmo usuário para o mesmo questionário, garantindo integridade estatística.

#### 🧩 Geração de Diagnósticos

Após a submissão das respostas, o sistema gera um diagnóstico individual, armazenado na collection diagnosticos.

O diagnóstico inclui:

Pontuação global

Classificação geral (ex.: baixo, intermediário, alto risco)

Pontuação por domínio e dimensão

Quantidade de itens respondidos

### 📌 Lógica central:
As pontuações consideram:

Tipo de escala

Itens invertidos

Sinal de risco ou proteção

Quantidade válida de respostas

📊 Relatórios Organizacionais

Os dados individuais são consolidados na collection relatorios, com foco organizacional, nunca individual.

Os relatórios apresentam:

Indicadores globais de risco

Índices de proteção

Número de respondentes

Análises por domínio e dimensão

Recomendações gerais

### 📌 Regra de negócio crítica:
Relatórios não expõem diagnósticos individuais, apenas métricas agregadas, preservando o anonimato dos colaboradores.

#### 🔄 Evolução e Consistência de Dados

O sistema permite evolução do modelo de dados sem impacto direto nos usuários.

Alterações de estrutura são validadas em tempo de execução

Versões de questionários garantem comparabilidade histórica

Dados antigos permanecem íntegros mesmo com ajustes futuros

### 🎯 Benefícios do Modelo de Negócio

Privacidade e anonimato garantidos

Escalabilidade para múltiplas organizações

Clareza entre dado bruto, diagnóstico e relatório

Base sólida para decisões estratégicas em saúde ocupacional
