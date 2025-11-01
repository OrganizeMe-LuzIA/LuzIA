# Guia: Instalar e configurar MongoDB no WSL (Windows)

Este guia explica como instalar e configurar o MongoDB no WSL (Ubuntu) e como executar o script `init.js` do seu projeto localizado em `C:/Users/danie/Desktop/LuzIA/LuzIA-1/backend/mongo/init.js`.

## Pré-requisitos (Windows)
- Windows 10/11 com WSL instalado.
- PowerShell com privilégios de administrador para habilitar recursos se necessário.

## 1) Verificar e instalar o WSL
No PowerShell (Windows):

```powershell
wsl -l -v  # lista distros
```

Se não tiver WSL instalado:

```powershell
wsl --install  # instala WSL e Ubuntu padrão
# Reinicie o PC se solicitado
```

Se já tem WSL, atualize para WSL2 (recomendado):

```powershell
wsl --set-default-version 2
```

## 2) Abrir sua distro Linux (Ubuntu)
- Abra o aplicativo "Ubuntu" pelo menu iniciar.
- Atualize pacotes:

```bash
sudo apt update && sudo apt upgrade -y
```

## 3) (Opcional, recomendado) Ativar systemd no WSL
Para gerenciar serviços com `systemctl` (como `mongod`), ative o systemd:

```bash
sudo nano /etc/wsl.conf
```

Adicione o conteúdo:

```
[boot]
systemd=true
```

Salve, saia e no Windows rode:

```powershell
wsl --shutdown
```

Abra novamente o Ubuntu.

## 4) Instalar MongoDB (repositório oficial)
Instale as dependências necessárias:

```bash
    sudo apt update
    sudo apt install -y gnupg curl
```

Instalar usando o repositório do Ubuntu 22.04 (“jammy”):

```bash
curl -fsSL https://pgp.mongodb.com/server-7.0.asc | \
   sudo gpg -o /usr/share/keyrings/mongodb-server-7.0.gpg --dearmor
```

```bash
echo "deb [ arch=amd64,arm64 signed-by=/usr/share/keyrings/mongodb-server-7.0.gpg ] \
https://repo.mongodb.org/apt/ubuntu jammy/mongodb-org/7.0 multiverse" | \
sudo tee /etc/apt/sources.list.d/mongodb-org-7.0.list
```

```bash
sudo apt update
sudo apt install -y mongodb-org
```

Verifique versões:

```bash
mongod --version
mongosh --version
```

## 5) Iniciar o serviço MongoDB
Com systemd ativo:

```bash
sudo systemctl enable mongod
sudo systemctl start mongod
sudo systemctl status mongod
```

Sem systemd (alternativa manual):

```bash
sudo mkdir -p /data/db
sudo chown -R $(whoami) /data/db
mongod --dbpath /data/db --bind_ip 127.0.0.1 --port 27017 --fork --logpath /tmp/mongod.log
```

Observação: no WSL2, serviços em `localhost:27017` são acessíveis a partir do Windows.

## 6) Testar conexão
Dentro do Ubuntu (WSL):

```bash
mongosh "mongodb://localhost:27017"
show dbs
```

Do Windows (PowerShell), se desejar:

```powershell
mongosh "mongodb://localhost:27017"
```

## 7) Rodar seu init.js a partir do WSL
Seu arquivo está em `<caminho-do-seu-projeto>/backend/mongo/init.js`. No WSL, o caminho é:

`/mnt/c/<caminho-do-seu-projeto>/backend/mongo/init.js`

Execute:

```bash
mongosh --file "/mnt/c/<caminho-do-seu-projeto>/backend/mongo/init.js" "mongodb://localhost:27017/LuzIA"
```

Ou interativamente:

```bash
mongosh "mongodb://localhost:27017/LuzIA"
load("/mnt/c/<caminho-do-seu-projeto>/backend/mongo/init.js")
```

Verifique coleções:

```javascript
db.getCollectionNames()
// Esperado: organizacoes, setores, usuarios, questionarios, perguntas, respostas, diagnosticos, relatorios
```

## 8) Configurações úteis
### Bind IP (acesso)
- Por padrão, `mongod` escuta em `127.0.0.1`. Isso é suficiente para acesso do Windows ao WSL.
- Para acesso externo, ajuste `/etc/mongod.conf` (cuidado de segurança):

```yaml
net:
  bindIp: 0.0.0.0
  port: 27017
```

Reinicie o serviço.

### Habilitar autenticação (opcional)
Crie um usuário admin e ative authorization:

```bash
mongosh
use admin
db.createUser({ user: "admin", pwd: "SENHA_SEGURA", roles: [ { role: "root", db: "admin" } ] })
```

Edite `/etc/mongod.conf`:

```yaml
security:
  authorization: enabled
```

Reinicie `mongod` e conecte com:

```bash
mongosh "mongodb://admin:SENHA_SEGURA@localhost:27017/admin"
```

## 9) Solução de problemas
- `command not found`: reabra o Ubuntu após instalar, ou verifique PATH.
- `systemctl` não funciona: ative systemd (passo 3) e reinicie o WSL (`wsl --shutdown`).
- `Porta 27017 ocupada`: feche instâncias anteriores de `mongod` ou altere a porta em `mongod.conf`.
- `Permissão /data/db`: ajuste com `sudo chown -R mongodb:mongodb /var/lib/mongodb` (instalação via pacote já configura isso).

## 10) Dicas de uso com seu projeto
- Do Windows, você pode rodar: `mongosh --file "C:/Users/danie/Desktop/LuzIA/LuzIA-1/backend/mongo/init.js" "mongodb://localhost:27017/LuzIA"`.
- O script `init.js` é idempotente (usa `createIfNotExists`), pode ser executado várias vezes sem conflito.
- Após rodar, confirme coleções e índices conforme necessidade.

---

Pronto! Com isso, o MongoDB está instalado e configurado no WSL, e seu banco `LuzIA` pode ser inicializado diretamente com o `init.js` do projeto.