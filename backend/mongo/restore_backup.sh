#!/bin/bash
# ============================================
# Restaurar backup do MongoDB
# ============================================
# Uso: ./restore_backup.sh <caminho_do_backup>
#
# Restaura um backup criado pelo script backup_before_test.sh

BACKUP_PATH="$1"

if [ -z "$BACKUP_PATH" ]; then
    echo "❌ Uso: ./restore_backup.sh <caminho_do_backup>"
    echo ""
    echo "Backups disponíveis:"
    ls -la /root/LuzIA/backend/mongo/backups/ 2>/dev/null || echo "   Nenhum backup encontrado."
    exit 1
fi

if [ ! -d "$BACKUP_PATH" ]; then
    echo "❌ Diretório de backup não encontrado: $BACKUP_PATH"
    exit 1
fi

echo "⚠️  ATENÇÃO: Isso irá SUBSTITUIR todos os dados atuais do banco LuzIA!"
read -p "   Continuar? (s/N): " confirm

if [ "$confirm" != "s" ] && [ "$confirm" != "S" ]; then
    echo "Operação cancelada."
    exit 0
fi

echo ""
echo "🔄 Restaurando backup..."

# Verificar se está usando Docker ou instalação local
if docker ps | grep -q luzia-mongo; then
    echo "📦 Detectado MongoDB via Docker..."
    docker cp "$BACKUP_PATH" luzia-mongo:/tmp/restore_backup
    docker exec luzia-mongo mongorestore --db LuzIA --drop /tmp/restore_backup/LuzIA
    docker exec luzia-mongo rm -rf /tmp/restore_backup
else
    echo "💻 Usando MongoDB local..."
    mongorestore --db LuzIA --drop "$BACKUP_PATH/LuzIA"
fi

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Backup restaurado com sucesso!"
else
    echo ""
    echo "❌ Erro ao restaurar backup!"
    exit 1
fi
