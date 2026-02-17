# Lógica de Funcionamento do Sistema

## Visão Geral

O sistema tem como objetivo aplicar questionários psicossociais (COPSOQ II) de forma anônima, coletar respostas, gerar diagnósticos individuais e consolidar relatórios organizacionais. Todo o fluxo é orientado a **anonimato**, **segregação por organização/setor** e **processamento confiável de dados**, evitando exposição de informações pessoais sensíveis.

---

## 1. Gestão de Usuários e Anonimato

Os participantes são registrados na collection `usuarios`, vinculados a uma organização e a um setor. Cada usuário recebe um `anonId` (UUID gerado automaticamente), que passa a ser a **única referência** utilizada em respostas, diagnósticos e análises.

**Regra de negócio crítica:** Nenhuma resposta ou diagnóstico utiliza identificadores pessoais (telefone, email, etc.). O `anonId` garante rastreabilidade técnica sem quebrar o anonimato.

---

## 2. Organizações e Estrutura

A collection `organizacoes` representa empresas ou instituições que aplicam os questionários. Cada organização:

- Possui múltiplos setores e usuários;
- Pode gerar relatórios consolidados;
- Serve como unidade principal para análises estratégicas.

Os **setores** (`setores`) organizam os colaboradores por área, departamento ou unidade. O nome do setor é único por organização.

---

## 3. Questionários e Estrutura Psicossocial

Os instrumentos de avaliação são definidos na collection `questionarios`. Cada questionário:

- Possui versão, idioma e código único (`COPSOQ_CURTA_BR`, `COPSOQ_MEDIA_PT`);
- É composto por domínios e dimensões psicossociais;
- Pode ser ativado ou desativado conforme a necessidade.

As perguntas associadas ficam na collection `perguntas`, organizadas por:

- Domínio e dimensão;
- Ordem de aplicação;
- Tipo de escala (frequência, intensidade, satisfação, etc.);
- Sinal de risco ou proteção;
- Indicação de item invertido.

**Regra de negócio:** A estrutura do questionário define como as respostas serão interpretadas no diagnóstico — especialmente o `sinal` (risco/proteção) e `itemInvertido`.

---

## 4. Coleta de Respostas

As respostas dos usuários são armazenadas na collection `respostas`, vinculadas apenas ao `anonId`.

**Regras de negócio:**
- Cada usuário pode ter **uma única resposta por questionário** (upsert)
- Respostas posteriores sobrescrevem as anteriores
- O fluxo pelo bot WhatsApp garante a ordem correta das perguntas

---

## 5. Geração de Diagnósticos

Após a submissão das respostas, o sistema gera um **diagnóstico individual** assíncrono (via Celery), armazenado na collection `diagnosticos`.

O diagnóstico inclui:

- Pontuação global e classificação geral (favorável/intermediário/risco);
- Pontuação por domínio e dimensão (com tercil e sinal);
- Quantidade de itens respondidos por dimensão.

**Lógica central (COPSOQScoringService):** As pontuações consideram tipo de escala, itens invertidos, sinal de risco ou proteção, e quantidade válida de respostas. Os limites de tercis são `≤2.33` (favorável), `2.33-3.67` (intermediário) e `≥3.67` (risco).

---

## 6. Relatórios Organizacionais

Os dados individuais são consolidados na collection `relatorios`, com foco organizacional — **nunca individual**.

Os relatórios apresentam:

- Indicadores globais de risco (Média de Risco Global);
- Índice de Proteção (0–100%);
- Número de respondentes;
- Análises por domínio e dimensão com distribuição de tercis;
- Recomendações contextualizadas para dimensões em risco.

**Regra de negócio crítica:** Relatórios não expõem diagnósticos individuais, apenas métricas agregadas, preservando o anonimato dos colaboradores.

---

## 7. Benefícios do Modelo

- Privacidade e anonimato garantidos via `anonId`
- Escalabilidade para múltiplas organizações
- Clareza entre dado bruto, diagnóstico e relatório
- Base sólida para decisões estratégicas em saúde ocupacional
- Conformidade com LGPD
