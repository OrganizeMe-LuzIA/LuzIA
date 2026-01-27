# Relatório de Análise e Melhorias Sugeridas - LuzIA Backend

**Data:** 11 de Janeiro de 2026
**Status:** Análise Inicial Concluída

## 1. Consistência entre Documentação e Código

Foi identificada uma discrepância significativa entre o **Modelo Conceitual** (`ModeloConceitual.json`) e a implementação do código (`app/models/base.py` e `mongo/init_final.js`).

*   **Modelo de Usuário:**
    *   **Código:** Inclui campos como `idSetor` e `metadata` (usado para estado do chat).
    *   **Documentação (JSON):** Não lista `idSetor` ou `metadata` na coleção `usuarios`.
    *   **Ação Recomendada:** Atualizar o `ModeloConceitual.json` para refletir a realidade do código, garantindo que futuros desenvolvedores não se baseiem em documentação obsoleta.

*   **Validação de Enum (Status):**
    *   **Banco de Dados:** O script `init_final.js` define um ENUM estrito para o status do usuário (`ativo`, `inativo`, `aguardando_confirmacao`).
    *   **Código (Pydantic):** O modelo `Usuario` em `base.py` define `status` apenas como `str`. Isso permite que o código Python instancie objetos com status inválidos (ex: "banido"), que só darão erro ao tentar inserir no MongoDB (se a validação do banco estiver ativa).
    *   **Ação Recomendada:** Alterar `app/models/base.py` para usar `enum.Enum` do Python para o campo `status`, garantindo validação na camada da aplicação antes de chegar ao banco.

## 2. Segurança e Autenticação

A arquitetura atual sugere um modelo "Passwordless" baseado em Telefone e ID Anônimo.

*   **Ausência de Autenticação Forte:** Não há campos de senha ou hash. A segurança depende inteiramente da verificação externa (provavelmente OTP via Twilio/WhatsApp).
*   **Risco:** Se a API `create_user` ou `find_by_phone` estiver exposta publicamente sem um middleware de verificação de token (JWT gerado após OTP), qualquer pessoa pode se passar por qualquer número.
*   **Ação Recomendada:** 
    1.  Garantir que os endpoints críticos (leitura de dados, diagnósticos) exijam um Token JWT.
    2.  O Token JWT deve ser emitido **apenas** após confirmação bem-sucedida do código OTP enviado via WhatsApp.
    3.  Verificar se o `UsuariosRepo` está blindado contra injeção ou manipulação de dados sensíveis (o uso do Motor/MongoDB driver atual parece seguro, mas a lógica de negócio deve validar a posse do telefone).

## 3. Índices de Banco de Dados

Os índices definidos em `init_final.js` estão corretos e cobrem as consultas principais (`anonId`, `telefone`), o que é excelente para performance.

*   **Ação:** Garantir que o script `init_final.js` seja executado em todos os ambientes (dev/prod) na inicialização, pois o código assume que a unicidade de `anonId` e `telefone` é garantida pelo banco.

## 4. Testes

Os testes atuais (`test_db.py`) cobrem apenas a conectividade.
*   **Ação Realizada:** Foi criado o arquivo `tests/test_logic.py` cobrindo a lógica de criação e busca de usuários.
*   **Recomendação:** Expandir os testes para cobrir o fluxo completo de "Diagnóstico" e "Geração de Relatório", que possuem lógicas de cálculo mais complexas.
