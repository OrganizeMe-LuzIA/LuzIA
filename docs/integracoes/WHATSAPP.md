# Integração WhatsApp/Baileys

> **Voltar para:** [📚 Documentação](../README.md)

---

## 💬 Visão Geral

O LuzIA usa **Baileys** para conectar ao WhatsApp e enviar questionários diretamente aos usuários.

---

## ⚙️ Configuração

```env
WHATSAPP_ENABLED=true
WHATSAPP_SESSION_PATH=./sessions
```

---

## 🔄 Fluxo

1. Usuário cadastrado recebe link via WhatsApp
2. Bot envia perguntas sequencialmente
3. Usuário responde com números (1-5)
4. Bot salva respostas
5. Ao final, gera diagnóstico

---

## 📝 Handlers

- `on_message`: Processa respostas
- `on_connect`: Inicia sessão
- `on_disconnect`: Reconecta

---

**Última Atualização:** 2026-02-07
