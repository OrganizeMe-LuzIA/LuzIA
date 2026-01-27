# Plano de Implementação - Melhorias no Backend LuzIA

Este documento detalha o plano para abordar os problemas destacados no relatório `MELHORIAS.md`. As melhorias abrangem consistência de documentação, validação de dados, segurança e implementação/teste de lógica de negócios.

## Alterações Propostas

### 1. Consistência da Documentação
#### [MODIFICAR] `mongo/ModeloConceitual.json`
- Adicionar campos `idSetor` e `metadata` à definição da coleção `usuarios` para refletir o código existente.
- Garantir que a definição do enum `status` corresponda ao código (e vice-versa).

### 2. Validação e Modelos
#### [MODIFICAR] `app/models/base.py`
- Importar `Enum`.
- Definir `StatusEnum` com valores: "ativo", "inativo", "aguardando_confirmacao".
- Atualizar o modelo `Usuario` para usar `StatusEnum` para o campo `status`.
- Garantir que `ConfigDict` permita valores de enum.

### 3. Segurança (Autenticação)
#### [MODIFICAR] `requirements.txt`
- Garantir que `python-jose[cryptography]`, `passlib[bcrypt]`, `python-multipart` estejam presentes.

#### [NOVO] `app/auth.py`
- Implementar funções `create_access_token`, `verify_token`.
- Implementar dependência `get_current_user`.
- Definir modelos `Token` e `TokenData`.

#### [NOVO] `app/routers/auth.py`
- Criar endpoint `POST /login`.
- Aceitar `telefone` (e código opcional).
- Retornar JWT `access_token`.

#### [MODIFICAR] `app/main.py`
- Incluir `auth_router`.

### 4. Lógica de Negócios e Serviços
A lógica de "Diagnósticos" e "Relatórios" está atualmente ausente do código base. Vamos implementá-las em `services` para permitir testes.

#### [NOVO] `app/services/diagnostico_service.py`
- `calculate_score(respostas: List[RespostaItem]) -> Diagnostico`: Lógica para calcular pontuações com base nas respostas.
- Lida com itens invertidos e agregação de domínios.

#### [NOVO] `app/services/relatorio_service.py`
- `generate_relatorio_organizacional(org_id) -> Relatorio`: Lógica para agregar todos os diagnósticos de uma organização.
- Calcula risco global, índice de proteção.

### 5. Testes
#### [MODIFICAR] `tests/test_logic.py`
- Atualizar `test_usuario_model_invalid_status` para esperar erro de validação (ou verificar membro do Enum).

#### [NOVO] `tests/test_services.py`
- Testar `DiagnosticoService.calculate_score` com entradas de exemplo.
- Testar `RelatorioService.generate_relatorio` (mockando chamadas de banco de dados).

## Plano de Verificação

### Testes Automatizados
Executar `pytest` para verificar toda a lógica.
```bash
pytest backend/tests
```

### Verificação Manual
1.  **Consistência**: Verificar `ModeloConceitual.json` contra `base.py`.
2.  **Validação**: Tentar criar um usuário com status inválido `banido` usando um script -> Deve gerar ValidationError.
3.  **Segurança**:
    -   Iniciar app: `uvicorn app.main:app --reload`
    -   Enviar POST para `/auth/login` -> Obter Token.
