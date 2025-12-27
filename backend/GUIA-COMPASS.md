# Guia de Visualização do Banco de Dados — MongoDB Compass

Este guia explica como conectar uma interface gráfica (GUI) ao seu banco de dados MongoDB que está rodando dentro do WSL.

## 1. Por que usar o MongoDB Compass?
O navegador (Chrome/Edge) não consegue exibir os dados do MongoDB diretamente. O **MongoDB Compass** é a ferramenta oficial que permite:
- Visualizar todos os documentos e coleções.
- Editar ou deletar dados manualmente.
- Criar consultas (queries) visuais de forma simples.

## 2. Instalação
1. Baixe o instalador para Windows aqui: [MongoDB Compass Download](https://www.mongodb.com/try/download/compass).
2. Execute o instalador e abra o aplicativo.

## 3. Como Conectar (WSL para Windows)

Como o seu banco de dados está rodando no ambiente Linux (WSL), o Windows o enxerga através do `localhost`.

1. Certifique-se de que o MongoDB está rodando no terminal do WSL:
   ```bash
   sudo systemctl start mongod
   ```
2. Abra o **MongoDB Compass**.
3. Na tela inicial, em **URI**, cole o seguinte endereço:
   ```text
   mongodb://localhost:27017
   ```
4. Clique no botão verde **Connect**.

## 4. O que verificar após conectar
- No menu lateral esquerdo, você deverá encontrar o banco de dados chamado **`LuzIA`**.
- Dentro dele, você verá as coleções: `usuarios`, `perguntas`, `respostas`, `diagnosticos`, etc.
- Você pode clicar em qualquer coleção para ver os dados que foram inseridos durante os testes.

---

## 5. Solução de Problemas

### Erro "Connection Refused"
Isso geralmente significa que o serviço do MongoDB não está rodando no WSL.
- **Solução**: No terminal do WSL, execute `sudo systemctl restart mongod`.

### Não vejo o banco "LuzIA"
Isso acontece se o script de inicialização ainda não foi rodado ou se o banco está vazio.
- **Solução**: Execute os testes conforme o `GUIA-TESTES.md` ou rode o script `init_final.js` no WSL:
  ```bash
  mongosh --file "/mnt/c/Users/ResTIC55/Desktop/LuzIA/LuzIA/backend/mongo/init_final.js" "mongodb://localhost:27017/LuzIA"
  ```
