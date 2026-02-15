# Integração WhatsApp via Twilio

> **Voltar para:** [Documentacao](../README.md) | [README Principal](../../README.md)

---

## Visao Geral

O LuzIA utiliza a **API do Twilio** para integração com o WhatsApp. O bot conversacional guia os usuários através do questionário COPSOQ II, coletando respostas de forma interativa e gerando diagnósticos automaticamente.

### Componentes

| Arquivo | Responsabilidade |
|---------|-----------------|
| `bot/endpoints.py` | Webhook Twilio e endpoint de desenvolvimento |
| `bot/flow.py` | Fluxo conversacional (estados, navegação, lógica) |
| `bot/parsers.py` | Parsing e normalização de mensagens |
| `services/twilio_content_service.py` | Envio de Content Templates interativos |

---

## Configuração

### Variáveis de Ambiente

```env
# Credenciais Twilio (obtenha em https://console.twilio.com/)
TWILIO_ACCOUNT_SID=ACXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
TWILIO_AUTH_TOKEN=your_auth_token_here

# Número / remetente do WhatsApp via Twilio
TWILIO_WHATSAPP_FROM=whatsapp:+1XXXXXXXXXX
TWILIO_WHATSAPP_NUMBER=whatsapp:+1XXXXXXXXXX

# (Opcional) Messaging Service
TWILIO_MESSAGING_SERVICE_SID=MGXXXXXXXXXXXXXXXXXXXXXXXXXXXX

# Validação de assinatura (ativar em produção)
TWILIO_VALIDATE_SIGNATURE=false

# Content Templates por escala COPSOQ (preenchidos após criação no Twilio)
TWILIO_TEMPLATE_FREQUENCIA=HXxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_TEMPLATE_INTENSIDADE=HXxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_TEMPLATE_SATISFACAO=HXxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_TEMPLATE_CONFLITO_TF=HXxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_TEMPLATE_SAUDE_GERAL=HXxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_TEMPLATE_COMPORTAMENTO_OFENSIVO=HXxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

### Configuração no Twilio Console

1. Acesse [console.twilio.com](https://console.twilio.com/)
2. Ative o **WhatsApp Sandbox** (desenvolvimento) ou configure um número dedicado (produção)
3. Configure o **Webhook URL** do seu backend:
   - **When a message comes in:** `https://seu-dominio.com/bot/twilio/whatsapp`
   - **HTTP Method:** `POST`

---

## Endpoints

### `POST /bot/twilio/whatsapp`

Webhook principal do Twilio. Recebe mensagens do WhatsApp e retorna respostas em TwiML.

**Campos recebidos (form-encoded):**

| Campo | Descrição |
|-------|-----------|
| `From` | Número do remetente (`whatsapp:+55...`) |
| `Body` | Texto da mensagem |
| `ListId` | ID da opção selecionada (mensagens interativas) |
| `ListTitle` | Título da opção selecionada |
| `ButtonPayload` | Payload do botão clicado |
| `ButtonText` | Texto do botão clicado |

**Resposta:** TwiML XML com a mensagem de resposta do bot.

### `POST /bot/dev/incoming`

Endpoint de desenvolvimento para testar o bot sem Twilio.

```json
{
  "phone": "+5511999999999",
  "text": "Olá"
}
```

### `GET /bot/dev/user/{phone}`

Endpoint de desenvolvimento para consultar dados e respostas de um usuário.

---

## Fluxo Conversacional

O bot gerencia o estado do usuário através de um fluxo sequencial:

```
1. Primeira mensagem → Auto-registro do usuário
2. Mensagem de boas-vindas (LuzIA se apresenta)
3. Usuário informa o nome da empresa
4. Sistema valida a organização no banco
5. Usuário seleciona o setor
6. Usuário informa a unidade (ou "pular")
7. Confirmação para iniciar o questionário
8. Perguntas enviadas sequencialmente (1 a 40)
9. Respostas coletadas e salvas
10. Diagnóstico gerado automaticamente
11. Mensagem de conclusão
```

### Comandos do Usuário

| Comando | Ação |
|---------|------|
| `#reset` | Reinicia o questionário (não apaga respostas anteriores) |
| Qualquer texto | Processado conforme o estado atual do fluxo |

### Content Templates

O Twilio Content API é utilizado para enviar mensagens interativas (listas de opções) nas escalas do COPSOQ:

- **Frequência** - Sempre/Às vezes/Nunca etc.
- **Intensidade** - Em grande medida/Moderado etc.
- **Satisfação** - Muito satisfeito/Insatisfeito etc.
- **Conflito trabalho-família**
- **Saúde geral**
- **Comportamento ofensivo**

Quando os templates não estão configurados, o bot faz fallback para mensagens de texto simples via TwiML.

---

## Segurança

### Validação de Assinatura Twilio

Em produção, ative `TWILIO_VALIDATE_SIGNATURE=true` para validar que as requisições realmente vêm do Twilio:

- Verifica o header `X-Twilio-Signature`
- Usa `RequestValidator` do SDK Twilio
- Retorna HTTP 403 se a assinatura for inválida

### Anonimização

- O número do telefone é usado apenas para identificar a sessão
- As respostas são associadas a um `anonId` (UUID gerado no cadastro)
- Os diagnósticos não contêm dados pessoais identificáveis

---

## Troubleshooting

**Bot não responde:**
- Verifique se o webhook está configurado corretamente no Twilio Console
- Confira os logs: `docker-compose logs -f backend`
- Teste com o endpoint `/bot/dev/incoming`

**Mensagens interativas não aparecem:**
- Verifique se os Content Templates estão criados no Twilio
- Confirme que as variáveis `TWILIO_TEMPLATE_*` estão preenchidas
- O bot fará fallback para texto simples se os templates não estiverem configurados

**Erro 403 no webhook:**
- Desative `TWILIO_VALIDATE_SIGNATURE` em desenvolvimento
- Em produção, garanta que `TWILIO_AUTH_TOKEN` está correto

---

**Última Atualização:** 2026-02-15
