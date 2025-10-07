#!/bin/bash

# 🤖 SETUP AUTOMÁTICO - MATIAS
# Script para configurar completamente o Matias

echo "🤖 Bem-vindo ao setup do MATIAS - Assistente Virtual Ofix"
echo "=================================================="

# Verificar se o Node.js está instalado
if ! command -v node &> /dev/null; then
    echo "❌ Node.js não encontrado. Instale Node.js 18+ e tente novamente."
    exit 1
fi

# Verificar versão do Node.js
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ $NODE_VERSION -lt 18 ]; then
    echo "❌ Node.js versão 18+ é necessária. Versão atual: $(node -v)"
    exit 1
fi

echo "✅ Node.js $(node -v) encontrado"

# Verificar se o npm está instalado
if ! command -v npm &> /dev/null; then
    echo "❌ npm não encontrado"
    exit 1
fi

echo "✅ npm $(npm -v) encontrado"

# Instalar dependências do frontend
echo "📦 Instalando dependências do frontend..."
npm install

if [ $? -ne 0 ]; then
    echo "❌ Erro ao instalar dependências do frontend"
    exit 1
fi

# Instalar dependências do backend
echo "📦 Instalando dependências do backend..."
cd ofix-backend
npm install

if [ $? -ne 0 ]; then
    echo "❌ Erro ao instalar dependências do backend"
    exit 1
fi

# Voltar ao diretório raiz
cd ..

# Criar arquivos de ambiente se não existirem
if [ ! -f "ofix-backend/.env" ]; then
    echo "📝 Criando arquivo .env para o backend..."
    cat > ofix-backend/.env << EOF
# 🤖 CONFIGURAÇÃO MATIAS - DESENVOLVIMENTO

# Node.js
NODE_ENV=development
PORT=10000

# OpenAI (OBRIGATÓRIO)
OPENAI_API_KEY=sk-your-openai-key-here
OPENAI_MODEL=gpt-4o-mini
OPENAI_MAX_TOKENS=1000

# WhatsApp Business API (OPCIONAL)
WHATSAPP_TOKEN=your-whatsapp-token
WHATSAPP_VERIFY_TOKEN=your-verify-token
WHATSAPP_PHONE_NUMBER_ID=your-phone-id

# Database (OPCIONAL - usa SQLite por padrão)
DATABASE_URL=file:./dev.db

# Security
JWT_SECRET=matias-dev-secret-key-2024
ENCRYPTION_KEY=matias-encryption-key-32-chars

# Matias Settings
MATIAS_DEBUG_MODE=true
MATIAS_LOG_LEVEL=debug
MATIAS_VOICE_ENABLED=true
MATIAS_LANGUAGE=pt-BR

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=1000
EOF
    echo "✅ Arquivo .env criado em ofix-backend/.env"
    echo "⚠️  IMPORTANTE: Configure sua chave da OpenAI no arquivo .env"
fi

# Criar diretório de logs
mkdir -p ofix-backend/logs
echo "✅ Diretório de logs criado"

# Verificar se a chave da OpenAI está configurada
if grep -q "sk-your-openai-key-here" ofix-backend/.env; then
    echo "⚠️  ATENÇÃO: Configure sua chave da OpenAI no arquivo ofix-backend/.env"
    echo "   Sem ela, o Matias não funcionará!"
fi

# Instalar dependências de desenvolvimento (Jest, Cypress, etc.)
echo "🧪 Instalando dependências de testes..."
npm install --save-dev jest supertest cypress @testing-library/react @testing-library/jest-dom

# Criar script de inicialização
cat > start-matias.sh << 'EOF'
#!/bin/bash

echo "🤖 Iniciando MATIAS..."

# Verificar se a chave OpenAI está configurada
if grep -q "sk-your-openai-key-here" ofix-backend/.env; then
    echo "❌ Configure sua chave da OpenAI em ofix-backend/.env primeiro!"
    exit 1
fi

# Iniciar backend em background
echo "🔧 Iniciando backend..."
cd ofix-backend
npm run dev &
BACKEND_PID=$!
cd ..

# Aguardar backend inicializar
sleep 5

# Verificar se backend está funcionando
if curl -f http://localhost:10000/api/health > /dev/null 2>&1; then
    echo "✅ Backend iniciado com sucesso"
else
    echo "❌ Backend falhou ao iniciar"
    kill $BACKEND_PID 2>/dev/null
    exit 1
fi

# Iniciar frontend
echo "🖥️ Iniciando frontend..."
npm run dev

# Cleanup quando script for interrompido
trap 'echo "🛑 Parando serviços..."; kill $BACKEND_PID 2>/dev/null; exit' INT TERM
EOF

chmod +x start-matias.sh
echo "✅ Script de inicialização criado: ./start-matias.sh"

# Criar script de testes
cat > test-matias.sh << 'EOF'
#!/bin/bash

echo "🧪 Executando testes do Matias..."

# Testes unitários
echo "📋 Testes unitários..."
npm test

# Testes de integração
echo "🔗 Testes de integração..."
npm run test:integration

# Health check
echo "🩺 Health check..."
if curl -f http://localhost:10000/api/matias/health > /dev/null 2>&1; then
    echo "✅ Health check passou"
else
    echo "⚠️ Health check falhou - certifique-se que o backend está rodando"
fi

echo "✅ Testes concluídos"
EOF

chmod +x test-matias.sh
echo "✅ Script de testes criado: ./test-matias.sh"

# Criar script de build para produção
cat > build-matias.sh << 'EOF'
#!/bin/bash

echo "🏗️ Building Matias para produção..."

# Build do frontend
echo "📦 Building frontend..."
npm run build

# Verificar se build foi bem-sucedido
if [ -d "dist" ]; then
    echo "✅ Frontend build concluído"
else
    echo "❌ Frontend build falhou"
    exit 1
fi

# Preparar backend para produção
echo "🔧 Preparando backend..."
cd ofix-backend

# Instalar apenas dependências de produção
npm ci --only=production

cd ..

echo "✅ Build para produção concluído"
echo "📁 Frontend: ./dist/"
echo "📁 Backend: ./ofix-backend/"
EOF

chmod +x build-matias.sh
echo "✅ Script de build criado: ./build-matias.sh"

# Verificar se tudo está funcionando
echo ""
echo "🧪 Verificando instalação..."

# Testar se consegue importar os módulos principais
node -e "
try {
  require('./ofix-backend/src/controllers/matias.controller.js');
  console.log('✅ Matias Controller OK');
} catch (e) {
  console.log('⚠️ Matias Controller:', e.message);
}

try {
  require('./ofix-backend/src/services/knowledgeBase.service.js');
  console.log('✅ Knowledge Base OK');
} catch (e) {
  console.log('⚠️ Knowledge Base:', e.message);
}
"

echo ""
echo "🎉 SETUP CONCLUÍDO!"
echo "=================================================="
echo ""
echo "📋 PRÓXIMOS PASSOS:"
echo ""
echo "1. 🔑 Configure sua chave da OpenAI:"
echo "   Edite: ofix-backend/.env"
echo "   Substitua: OPENAI_API_KEY=sk-your-openai-key-here"
echo ""
echo "2. 🚀 Inicie o Matias:"
echo "   ./start-matias.sh"
echo ""
echo "3. 🧪 Execute os testes:"
echo "   ./test-matias.sh"
echo ""
echo "4. 🌐 Acesse o sistema:"
echo "   Frontend: http://localhost:5173"
echo "   Backend: http://localhost:10000"
echo ""
echo "📚 DOCUMENTAÇÃO:"
echo "   📖 Arquitetura: MATIAS_ARCHITECTURE.md"
echo "   📘 Manual: MATIAS_README.md"
echo "   👨‍🔧 Manutenção: MATIAS_MANUAL.md"
echo "   🎭 Estilo: MATIAS_STYLE_GUIDE.md"
echo ""
echo "🆘 SUPORTE:"
echo "   - GitHub Issues"
echo "   - Email: suporte@ofix.com"
echo ""
echo "Matias está pronto para ser o braço direito digital da Ofix! 🤖⚡"
