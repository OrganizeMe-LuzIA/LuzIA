# Sistema de Organizações e Setores

> **Voltar para:** [📚 Documentação](../README.md) | [🏛️ Arquitetura](ARQUITETURA.md)

---

## 🏢 Estrutura Hierárquica

```
Organização (Empresa)
├── Setor 1
│   ├── Usuário 1
│   ├── Usuário 2
│   └── Usuário 3
└── Setor 2
    ├── Usuário 4
    └── Usuário 5
```

---

## 📊 Modelos

### Organização

```python
{
  "_id": ObjectId("..."),
  "cnpj": "12345678000100",
  "nome": "Empresa XYZ Ltda"
}
```

### Setor

```python
{
  "_id": ObjectId("..."),
  "idOrganizacao": ObjectId("..."),
  "nome": "RH",
  "descricao": "Recursos Humanos"
}
```

### Usuário

```python
{
  "_id": ObjectId("..."),
  "telefone": "+5511999999999",
  "idOrganizacao": ObjectId("..."),
  "idSetor": ObjectId("..."),
  "anonId": "USR_1234567890",
  "status": "ativo",
  "respondido": false
}
```

---

## 🔄 Fluxo de Criação

1. Admin cria **Organização**
2. Admin cria **Setores** dentro da organização
3. Admin cadastra **Usuários** vinculados a setores
4. Usuários recebem link via WhatsApp
5. Usuários respondem questionário
6. Diagnósticos e relatórios são gerados

---

## 📈 Relatórios

- **Organizacional**: Todos usuários da empresa
- **Setorial**: Apenas usuários do setor

---

## 🔗 Documentos Relacionados

- [🗄️ Modelos de Dados](MODELOS.md)
- [⚡ Serviços](SERVICOS.md)

---

**Última Atualização:** 2026-02-07
