# LuzIA

Sistema de diagnóstico e análise empresarial inteligente.

## 📁 Estrutura do Projeto

```
LuzIA/
├── docs/                  # Documentação centralizada
│   ├── api/              # Especificações da API
│   ├── guides/           # Guias de desenvolvimento
│   ├── plans/            # Planos de implementação
│   └── security/         # Documentação de segurança
├── backend/              # API Backend (FastAPI)
│   ├── src/app/          # Código fonte
│   │   ├── core/         # Config, DB, Security
│   │   ├── api/v1/       # Routers versionados
│   │   ├── models/       # Modelos de dados
│   │   ├── repositories/ # Acesso a dados
│   │   └── services/     # Lógica de negócio
│   └── tests/            # Testes (unit/integration)
├── frontend/             # Interface do usuário (futuro)
├── infrastructure/       # Docker e DevOps
└── Makefile              # Comandos automatizados
```

## 🚀 Início Rápido

### Pré-requisitos
- Python 3.10+
- MongoDB
- Docker (opcional)

### Instalação

```bash
# Clone o repositório
git clone <repo-url>
cd LuzIA

# Instale dependências
make install

# Configure variáveis de ambiente
cp backend/.env.example backend/.env
# Edite backend/.env com suas configurações

# Inicie o servidor
make run
```

### Comandos Disponíveis

```bash
make help       # Lista todos os comandos
make test       # Executa todos os testes
make test-unit  # Apenas testes unitários
make test-int   # Apenas testes de integração
make lint       # Verifica código
make run        # Inicia servidor de desenvolvimento
```

## 📚 Documentação

- [Visão Geral do Projeto](docs/visao-geral/README.md)
- [API Reference](docs/api/API.md)
- [Guia de Implementação](docs/guides/Guia-Implementacao-Backend.md)
- [Segurança](docs/security/SEGURANCA.md)

## 🤝 Contribuindo

Veja [CONTRIBUTING.md](CONTRIBUTING.md) para diretrizes de contribuição.

## 📄 Licença

Este projeto está sob a licença MIT - veja [LICENSE](LICENSE) para detalhes.
