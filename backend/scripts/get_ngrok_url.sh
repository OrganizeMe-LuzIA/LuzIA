#!/bin/bash


# Script para obter a URL pública do ngrok e exibir o webhook do Twilio
#
# Uso:
#   ./scripts/get_ngrok_url.sh
#
# Pré-requisitos:
#   - ngrok deve estar rodando: ngrok http 8001

set -e

# Cores para output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${BLUE}🔍 Buscando URL do ngrok...${NC}"

# Tenta obter a URL via API local do ngrok
NGROK_URL=$(curl -s localhost:4040/api/tunnels 2>/dev/null | python3 -c "
import json, sys
try:
    data = json.load(sys.stdin)
    tunnels = data.get('tunnels', [])
    for t in tunnels:
        if t.get('proto') == 'https':
            print(t.get('public_url', ''))
            break
    else:
        if tunnels:
            print(tunnels[0].get('public_url', ''))
except:
    pass
" 2>/dev/null)

if [ -z "$NGROK_URL" ]; then
    echo -e "${YELLOW}⚠️  ngrok não está rodando ou não foi possível obter a URL.${NC}"
    echo ""
    echo "Para iniciar o ngrok, execute:"
    echo "  ngrok http 8001"
    exit 1
fi

WEBHOOK_URL="${NGROK_URL}/bot/twilio/whatsapp"

echo ""
echo -e "${GREEN}✅ ngrok está ativo!${NC}"
echo ""
echo -e "${BLUE}📱 URL Pública:${NC}"
echo "   $NGROK_URL"
echo ""
echo -e "${BLUE}🔗 Webhook para Twilio:${NC}"
echo "   $WEBHOOK_URL"
echo ""
echo -e "${YELLOW}📋 Copie o webhook acima e configure em:${NC}"
echo "   https://console.twilio.com/us1/develop/sms/try-it-out/whatsapp-learn"
echo ""

# Opcional: copiar para clipboard se xclip estiver disponível
if command -v xclip &> /dev/null; then
    echo "$WEBHOOK_URL" | xclip -selection clipboard
    echo -e "${GREEN}✅ Webhook copiado para o clipboard!${NC}"
elif command -v clip.exe &> /dev/null; then
    echo "$WEBHOOK_URL" | clip.exe
    echo -e "${GREEN}✅ Webhook copiado para o clipboard!${NC}"
fi
