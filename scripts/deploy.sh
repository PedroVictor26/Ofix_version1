#!/bin/bash

# 🚀 SCRIPT DE DEPLOY AUTOMATIZADO - Sistema Matias
# Deploy completo para produção com verificações de segurança

set -euo pipefail

# Configurações
PROJECT_NAME="matias"
DEPLOY_ENV="${1:-production}"
VERSION=$(date +%Y%m%d-%H%M%S)
BACKUP_DIR="/backups"
LOG_FILE="/var/log/deploy-${VERSION}.log"

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Funções de logging
log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] INFO: $1${NC}" | tee -a "$LOG_FILE"
}

warn() {
    echo -e "${YELLOW}[$(date +'%Y-%m-%d %H:%M:%S')] WARN: $1${NC}" | tee -a "$LOG_FILE"
}

error() {
    echo -e "${RED}[$(date +'%Y-%m-%d %H:%M:%S')] ERROR: $1${NC}" | tee -a "$LOG_FILE"
    exit 1
}

info() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')] INFO: $1${NC}" | tee -a "$LOG_FILE"
}

# Verificar se está sendo executado como root
check_root() {
    if [[ $EUID -eq 0 ]]; then
        error "Este script não deve ser executado como root!"
    fi
}

# Verificar dependências
check_dependencies() {
    info "🔍 Verificando dependências..."
    
    local deps=("docker" "docker-compose" "git" "curl" "jq")
    
    for dep in "${deps[@]}"; do
        if ! command -v "$dep" &> /dev/null; then
            error "Dependência necessária não encontrada: $dep"
        fi
    done
    
    log "✅ Todas as dependências estão instaladas"
}

# Verificar configurações
check_config() {
    info "⚙️ Verificando configurações..."
    
    if [[ ! -f ".env.${DEPLOY_ENV}" ]]; then
        error "Arquivo de configuração .env.${DEPLOY_ENV} não encontrado!"
    fi
    
    # Carregar variáveis de ambiente
    source ".env.${DEPLOY_ENV}"
    
    # Verificar variáveis obrigatórias
    local required_vars=(
        "DATABASE_URL"
        "REDIS_URL" 
        "OPENAI_API_KEY"
        "JWT_SECRET"
        "ENCRYPTION_KEY"
    )
    
    for var in "${required_vars[@]}"; do
        if [[ -z "${!var:-}" ]]; then
            error "Variável de ambiente obrigatória não definida: $var"
        fi
    done
    
    log "✅ Configurações validadas"
}

# Executar testes
run_tests() {
    info "🧪 Executando testes..."
    
    # Testes unitários
    log "Executando testes unitários..."
    npm test || error "Testes unitários falharam!"
    
    # Testes de integração
    log "Executando testes de integração..."
    npm run test:integration || error "Testes de integração falharam!"
    
    # Verificação de segurança
    log "Executando verificação de segurança..."
    npm audit --audit-level=moderate || warn "Vulnerabilidades de segurança encontradas"
    
    # Linting
    log "Executando verificação de código..."
    npm run lint || error "Problemas de linting encontrados!"
    
    log "✅ Todos os testes passaram"
}

# Backup do banco de dados
backup_database() {
    info "💾 Criando backup do banco de dados..."
    
    local timestamp=$(date +%Y%m%d_%H%M%S)
    local backup_file="${BACKUP_DIR}/matias_backup_${timestamp}.sql"
    
    # Criar diretório de backup se não existir
    mkdir -p "$BACKUP_DIR"
    
    # Realizar backup
    docker-compose -f docker-compose.prod.yml exec -T postgres pg_dump \
        -U "${POSTGRES_USER}" \
        -d "${POSTGRES_DB}" \
        --clean --if-exists > "$backup_file" || error "Falha no backup do banco de dados!"
    
    # Comprimir backup
    gzip "$backup_file"
    
    log "✅ Backup criado: ${backup_file}.gz"
}

# Build das imagens Docker
build_images() {
    info "🏗️ Construindo imagens Docker..."
    
    # Build da imagem principal
    log "Construindo imagem do Matias..."
    docker build -f Dockerfile.prod -t "matias:${VERSION}" -t "matias:latest" . || error "Falha no build da imagem!"
    
    # Verificar imagem
    docker run --rm "matias:${VERSION}" node --version || error "Imagem inválida!"
    
    log "✅ Imagens construídas com sucesso"
}

# Deploy da aplicação
deploy_application() {
    info "🚀 Iniciando deploy da aplicação..."
    
    # Parar serviços atuais (se existirem)
    log "Parando serviços atuais..."
    docker-compose -f docker-compose.prod.yml down --remove-orphans || warn "Nenhum serviço rodando"
    
    # Aplicar migrações do banco
    log "Aplicando migrações do banco de dados..."
    docker-compose -f docker-compose.prod.yml run --rm matias-app npx prisma migrate deploy || error "Falha nas migrações!"
    
    # Subir serviços
    log "Iniciando serviços..."
    docker-compose -f docker-compose.prod.yml up -d || error "Falha ao iniciar serviços!"
    
    log "✅ Aplicação deployada"
}

# Verificar saúde dos serviços
health_check() {
    info "🩺 Verificando saúde dos serviços..."
    
    local max_attempts=30
    local attempt=1
    
    while [[ $attempt -le $max_attempts ]]; do
        log "Tentativa $attempt/$max_attempts - Verificando saúde..."
        
        # Verificar aplicação principal
        if curl -f -s http://localhost:3000/health > /dev/null; then
            log "✅ Aplicação principal está saudável"
            break
        fi
        
        if [[ $attempt -eq $max_attempts ]]; then
            error "Aplicação não respondeu após $max_attempts tentativas!"
        fi
        
        sleep 10
        ((attempt++))
    done
    
    # Verificar outros serviços
    local services=("postgres:5432" "redis:6379" "prometheus:9090")
    
    for service in "${services[@]}"; do
        local host=$(echo "$service" | cut -d':' -f1)
        local port=$(echo "$service" | cut -d':' -f2)
        
        if nc -z localhost "$port" 2>/dev/null; then
            log "✅ Serviço $host está rodando"
        else
            warn "⚠️ Serviço $host não está respondendo na porta $port"
        fi
    done
}

# Testes de fumaça
smoke_tests() {
    info "💨 Executando testes de fumaça..."
    
    # Teste básico da API
    log "Testando endpoint principal..."
    local response=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/health)
    if [[ "$response" != "200" ]]; then
        error "Endpoint principal retornou código $response"
    fi
    
    # Teste do chat do Matias
    log "Testando chat do Matias..."
    local chat_response=$(curl -s -X POST http://localhost:3000/api/matias/chat \
        -H "Content-Type: application/json" \
        -d '{"message": "Hello Matias", "language": "en"}')
    
    if ! echo "$chat_response" | jq -e '.success' > /dev/null; then
        error "Chat do Matias não está funcionando corretamente"
    fi
    
    # Teste de métricas
    log "Testando métricas..."
    if ! curl -f -s http://localhost:9090/api/v1/query?query=up > /dev/null; then
        warn "Métricas não estão acessíveis"
    fi
    
    log "✅ Testes de fumaça passaram"
}

# Notificar equipe
notify_team() {
    local status="$1"
    local message="$2"
    
    info "📢 Notificando equipe..."
    
    # Slack webhook (se configurado)
    if [[ -n "${SLACK_WEBHOOK_URL:-}" ]]; then
        curl -X POST -H 'Content-type: application/json' \
            --data "{\"text\":\"🚀 Deploy Matias - $status: $message\"}" \
            "$SLACK_WEBHOOK_URL" || warn "Falha ao enviar notificação Slack"
    fi
    
    # Email (se configurado)
    if command -v mail &> /dev/null && [[ -n "${NOTIFICATION_EMAIL:-}" ]]; then
        echo "$message" | mail -s "Deploy Matias - $status" "$NOTIFICATION_EMAIL" || warn "Falha ao enviar email"
    fi
}

# Rollback em caso de falha
rollback() {
    error "🔄 Iniciando rollback..."
    
    # Parar serviços atuais
    docker-compose -f docker-compose.prod.yml down
    
    # Restaurar backup mais recente
    local latest_backup=$(ls -t "${BACKUP_DIR}"/matias_backup_*.sql.gz | head -1)
    
    if [[ -n "$latest_backup" ]]; then
        log "Restaurando backup: $latest_backup"
        gunzip -c "$latest_backup" | docker-compose -f docker-compose.prod.yml exec -T postgres psql \
            -U "${POSTGRES_USER}" -d "${POSTGRES_DB}"
    fi
    
    # Reverter para versão anterior
    docker-compose -f docker-compose.prod.yml up -d
    
    notify_team "FAILED" "Deploy falhou. Rollback executado."
    exit 1
}

# Limpeza pós-deploy
cleanup() {
    info "🧹 Executando limpeza..."
    
    # Remover imagens antigas (manter últimas 3)
    log "Removendo imagens antigas..."
    docker images "matias" --format "table {{.Repository}}:{{.Tag}}\t{{.CreatedAt}}" | \
        tail -n +4 | awk '{print $1}' | xargs -r docker rmi || warn "Falha na limpeza de imagens"
    
    # Limpar volumes não utilizados
    docker volume prune -f || warn "Falha na limpeza de volumes"
    
    # Limpar logs antigos (manter últimos 30 dias)
    find /var/log -name "deploy-*.log" -mtime +30 -delete || warn "Falha na limpeza de logs"
    
    log "✅ Limpeza concluída"
}

# Função principal
main() {
    log "🚀 Iniciando deploy do Sistema Matias v${VERSION}"
    log "Ambiente: ${DEPLOY_ENV}"
    
    # Configurar trap para rollback em caso de erro
    trap rollback ERR
    
    # Executar verificações pré-deploy
    check_root
    check_dependencies
    check_config
    run_tests
    
    # Executar deploy
    backup_database
    build_images
    deploy_application
    
    # Verificações pós-deploy
    health_check
    smoke_tests
    
    # Finalizar
    cleanup
    
    local deploy_time=$(($(date +%s) - $(date -d "$(echo $VERSION | sed 's/-/ /' | sed 's/\([0-9]\{4\}\)\([0-9]\{2\}\)\([0-9]\{2\}\)/\1-\2-\3/')" +%s)))
    
    log "✅ Deploy concluído com sucesso!"
    log "Versão: ${VERSION}"
    log "Tempo total: ${deploy_time}s"
    
    notify_team "SUCCESS" "Deploy do Matias v${VERSION} concluído com sucesso em ${deploy_time}s"
    
    # Remover trap de rollback
    trap - ERR
}

# Verificar argumentos
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    if [[ $# -gt 1 ]]; then
        error "Uso: $0 [environment]"
    fi
    
    main "$@"
fi
