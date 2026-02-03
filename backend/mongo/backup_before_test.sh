#!/bin/bash
# ============================================
# Backup MongoDB antes de testes
# ============================================
# Uso: ./backup_before_test.sh
#
# Este script cria um backup completo do banco LuzIA
# antes de executar testes com o frontend.

BACKUP_DIR="/root/LuzIA/backend/mongo/backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_PATH="$BACKUP_DIR/backup_$TIMESTAMP"

echo "🔄 Iniciando backup do MongoDB..."
echo "   Diretório: $BACKUP_PATH"

# Criar diretório de backups se não existir
mkdir -p "$BACKUP_DIR"

# Verificar se está usando Docker ou instalação local
if docker ps | grep -q luzia-mongo; then
    echo "📦 Detectado MongoDB via Docker..."
    docker exec luzia-mongo mongodump --db LuzIA --out /tmp/backup_$TIMESTAMP
    docker cp luzia-mongo:/tmp/backup_$TIMESTAMP "$BACKUP_PATH"
    docker exec luzia-mongo rm -rf /tmp/backup_$TIMESTAMP
else
    echo "💻 Usando MongoDB local..."
    mongodump --db LuzIA --out "$BACKUP_PATH"
fi

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Backup criado com sucesso!"
    echo "   📁 Local: $BACKUP_PATH"
    echo ""
    echo "Para restaurar, execute:"
    echo "   ./restore_backup.sh $BACKUP_PATH"
else
    echo ""
    echo "❌ Erro ao criar backup!"
    exit 1
fi
