# Funcionalidades do Sistema LuzIA

O LuzIA foi desenvolvido para tornar a avaliação de riscos psicossociais mais simples, acessível e segura para empresas e colaboradores.

---

## ✅ COPSOQ II - Avaliação Psicossocial Científica

O LuzIA possui **implementação completa e validada** do COPSOQ II (Copenhagen Psychosocial Questionnaire), metodologia científica reconhecida mundialmente para avaliação de riscos psicossociais no trabalho.

### Versões Suportadas

- **Versão Curta Brasileira** (40 itens, 23 dimensões, 7 domínios)
- **Versão Média Portuguesa** (76 itens, 29 dimensões, 8 domínios)

### Funcionalidades

✅ **Classificação por Tercis** - Categorização científica (favorável/intermediário/risco)  
✅ **Dimensões de Proteção vs Risco** - Interpretação diferenciada conforme metodologia  
✅ **Diagnósticos Individuais** - Análise personalizada com insights acionáveis  
✅ **Relatórios Organizacionais** - Agregação por domínios e dimensões  
✅ **Índice de Proteção** - Métrica de saúde organizacional (0-100%)  
✅ **Recomendações Contextualizadas** - Ações específicas por dimensão em risco

📖 [Documentação Completa COPSOQ II](../guides/GUIA-COPSOQ-II.md)

---

## 💬 Interação via WhatsApp

Os colaboradores respondem aos questionários diretamente pelo WhatsApp, um canal familiar e de fácil acesso, o que aumenta a adesão e reduz barreiras de participação.

**Recursos:**
- Envio automático de perguntas sequenciais
- Validação de respostas em tempo real
- Confirmação de conclusão
- Suporte a múltiplos usuários simultâneos

---

## 🔒 Privacidade e Anonimização (LGPD)

As respostas são registradas sem associação direta à identidade do colaborador, garantindo privacidade, segurança das informações e conformidade com a LGPD.

**Recursos:**
- ID anônimo gerado automaticamente (`anonId`)
- Desvinculação de dados pessoais
- Criptografia de dados sensíveis
- Controle de acesso por roles

---

## 📊 Diagnósticos e Relatórios

O sistema gera automaticamente diagnósticos individuais e relatórios organizacionais com análises baseadas em metodologias científicas.

### Diagnóstico Individual

- Resultado global (favorável/intermediário/risco)
- Análise por dimensão psicossocial
- Pontuações classificadas por tercis
- Identificação de aspectos positivos e áreas de atenção

### Relatórios Organizacionais

- Agregação por domínios e dimensões
- Distribuição de respostas (favorável/intermediário/risco)
- Métricas organizacionais (Média de Risco, Índice de Proteção)
- Comparação entre setores
- Recomendações priorizadas

---

## 🎨 Painel de Controle

Ambiente web onde gestores autorizados acompanham e gerenciam todo o processo de avaliação.

**Funcionalidades:**
- Visualização de métricas detalhadas
- Gráficos interativos por dimensão/domínio
- Acompanhamento de participação
- Geração de relatórios customizados
- Exportação de dados
- Gestão de organizações e setores

---

## 🏢 Multi-tenant

Suporte completo a múltiplas organizações e setores com isolamento de dados.

**Estrutura:**
```
Organização → Setores → Usuários
```

**Benefícios:**
- Relatórios por organização ou setor
- Controle de acesso granular
- Comparações entre setores
- Gestão centralizada

---

## 🚀 Benefícios

✨ **Aumenta a adesão** dos colaboradores às avaliações  
⚡ **Reduz esforços manuais** no processo de aplicação e análise  
🔐 **Garante privacidade** e segurança dos dados (LGPD)  
📈 **Oferece insights acionáveis** baseados em ciência  
🎯 **Facilita tomada de decisão** com dados organizados e claros

---

**Veja também:**
- [Objetivo do Projeto](objetivo.md)
- [Guia COPSOQ II](../guides/GUIA-COPSOQ-II.md)
- [Documentação da API](../api/API.md)

