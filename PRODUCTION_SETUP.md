# 🚀 CONFIGURAÇÃO DE PRODUÇÃO - MATIAS

## Dockerfile para Backend

FROM node:18-alpine
WORKDIR /app

# Copiar package.json
COPY ofix-backend/package*.json ./
RUN npm ci --only=production

# Copiar código fonte
COPY ofix-backend/src ./src
COPY ofix-backend/.env.production ./.env

# Criar diretório de logs
RUN mkdir -p logs

# Expor porta
EXPOSE 10000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:10000/api/matias/health || exit 1

# Executar aplicação
CMD ["node", "src/server.js"]

---

## docker-compose.yml

version: '3.8'

services:
  matias-backend:
    build: .
    ports:
      - "10000:10000"
    environment:
      - NODE_ENV=production
      - OPENAI_API_KEY=${OPENAI_API_KEY}
      - WHATSAPP_TOKEN=${WHATSAPP_TOKEN}
      - DATABASE_URL=${DATABASE_URL}
    volumes:
      - ./logs:/app/logs
    restart: unless-stopped
    networks:
      - ofix-network

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - ./ssl:/etc/ssl
    depends_on:
      - matias-backend
    networks:
      - ofix-network

networks:
  ofix-network:
    driver: bridge

---

## nginx.conf

events {
    worker_connections 1024;
}

http {
    upstream matias_backend {
        server matias-backend:10000;
    }

    # Rate limiting
    limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;
    limit_req_zone $binary_remote_addr zone=chat:10m rate=5r/s;

    server {
        listen 80;
        server_name ofix.com www.ofix.com;
        
        # Redirect HTTP to HTTPS
        return 301 https://$server_name$request_uri;
    }

    server {
        listen 443 ssl http2;
        server_name ofix.com www.ofix.com;

        # SSL Configuration
        ssl_certificate /etc/ssl/ofix.crt;
        ssl_certificate_key /etc/ssl/ofix.key;
        ssl_protocols TLSv1.2 TLSv1.3;
        ssl_ciphers HIGH:!aNULL:!MD5;

        # Security Headers
        add_header X-Frame-Options DENY;
        add_header X-Content-Type-Options nosniff;
        add_header X-XSS-Protection "1; mode=block";
        add_header Strict-Transport-Security "max-age=31536000; includeSubDomains";

        # Matias API
        location /api/matias/ {
            limit_req zone=api burst=20 nodelay;
            
            proxy_pass http://matias_backend;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            
            # WebSocket support
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection "upgrade";
            
            # Timeouts
            proxy_connect_timeout 5s;
            proxy_send_timeout 60s;
            proxy_read_timeout 60s;
        }

        # Chat endpoint com rate limiting específico
        location /api/matias/chat {
            limit_req zone=chat burst=10 nodelay;
            
            proxy_pass http://matias_backend;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }

        # Frontend estático
        location / {
            root /var/www/html;
            try_files $uri $uri/ /index.html;
            
            # Cache estático
            location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2)$ {
                expires 1y;
                add_header Cache-Control "public, immutable";
            }
        }
    }
}

---

## .env.production

# 🔐 CONFIGURAÇÃO DE PRODUÇÃO - NÃO COMMITAR

# Node.js
NODE_ENV=production
PORT=10000

# OpenAI
OPENAI_API_KEY=sk-your-real-openai-key-here
OPENAI_MODEL=gpt-4
OPENAI_MAX_TOKENS=1000

# WhatsApp Business API
WHATSAPP_TOKEN=your-whatsapp-business-token
WHATSAPP_VERIFY_TOKEN=your-verify-token-here
WHATSAPP_PHONE_NUMBER_ID=your-phone-number-id

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/ofix_prod

# Security
JWT_SECRET=your-super-secure-jwt-secret-here
ENCRYPTION_KEY=your-32-char-encryption-key-here

# Matias Configuration
MATIAS_DEBUG_MODE=false
MATIAS_LOG_LEVEL=info
MATIAS_VOICE_ENABLED=true
MATIAS_LANGUAGE=pt-BR

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Monitoring
SENTRY_DSN=your-sentry-dsn-here
LOG_RETENTION_DAYS=30

# Cache
REDIS_URL=redis://localhost:6379

---

## scripts/deploy.sh

#!/bin/bash

echo "🚀 Iniciando deploy do Matias..."

# Verificar se estamos na branch correta
BRANCH=$(git branch --show-current)
if [ "$BRANCH" != "main" ]; then
    echo "❌ Deploy deve ser feito a partir da branch main"
    exit 1
fi

# Verificar se existem mudanças não commitadas
if [[ -n $(git status --porcelain) ]]; then
    echo "❌ Existem mudanças não commitadas"
    exit 1
fi

# Build do frontend
echo "📦 Building frontend..."
npm run build

# Build da imagem Docker
echo "🐳 Building Docker image..."
docker build -t matias:latest .

# Parar serviços existentes
echo "🛑 Stopping existing services..."
docker-compose down

# Iniciar novos serviços
echo "▶️ Starting new services..."
docker-compose up -d

# Aguardar health check
echo "🩺 Waiting for health check..."
sleep 10

# Verificar se está funcionando
HEALTH=$(curl -f http://localhost:10000/api/matias/health || echo "FAIL")
if [[ $HEALTH == *"healthy"* ]]; then
    echo "✅ Deploy realizado com sucesso!"
else
    echo "❌ Health check falhou"
    docker-compose logs matias-backend
    exit 1
fi

echo "🎉 Matias está no ar!"

---

## scripts/backup.sh

#!/bin/bash

DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/backups/matias"

echo "💾 Iniciando backup do Matias..."

# Criar diretório de backup
mkdir -p $BACKUP_DIR

# Backup de logs
echo "📝 Backing up logs..."
tar -czf "$BACKUP_DIR/logs_$DATE.tar.gz" logs/

# Backup de configurações
echo "⚙️ Backing up configurations..."
cp -r config/ "$BACKUP_DIR/config_$DATE/"

# Backup do banco de dados (se aplicável)
echo "🗄️ Backing up database..."
# pg_dump $DATABASE_URL > "$BACKUP_DIR/database_$DATE.sql"

# Limpeza de backups antigos (manter últimos 30 dias)
find $BACKUP_DIR -name "*.tar.gz" -mtime +30 -delete
find $BACKUP_DIR -name "*.sql" -mtime +30 -delete

echo "✅ Backup concluído: $BACKUP_DIR"

---

## scripts/monitoring.sh

#!/bin/bash

# 📊 Script de Monitoramento do Matias

echo "📊 Status do Matias - $(date)"

# Verificar se o container está rodando
if docker ps | grep -q matias-backend; then
    echo "✅ Container matias-backend está executando"
else
    echo "❌ Container matias-backend não está executando"
    exit 1
fi

# Health check
HEALTH=$(curl -s http://localhost:10000/api/matias/health)
if [[ $HEALTH == *"healthy"* ]]; then
    echo "✅ Health check OK"
else
    echo "❌ Health check FAIL"
    echo "Response: $HEALTH"
fi

# Verificar uso de CPU e memória
STATS=$(docker stats matias-backend --no-stream --format "table {{.CPUPerc}}\t{{.MemUsage}}")
echo "📈 Recursos:"
echo "$STATS"

# Verificar logs de erro
ERROR_COUNT=$(docker logs matias-backend --since="1h" 2>&1 | grep -c "ERROR")
if [ $ERROR_COUNT -gt 10 ]; then
    echo "⚠️ Muitos erros detectados: $ERROR_COUNT"
else
    echo "✅ Nível de erros normal: $ERROR_COUNT"
fi

# Verificar espaço em disco
DISK_USAGE=$(df -h /var/lib/docker | tail -1 | awk '{print $5}' | sed 's/%//')
if [ $DISK_USAGE -gt 80 ]; then
    echo "⚠️ Uso de disco alto: $DISK_USAGE%"
else
    echo "✅ Uso de disco OK: $DISK_USAGE%"
fi

echo "📊 Monitoramento concluído"
