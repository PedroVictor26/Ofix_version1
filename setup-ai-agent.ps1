# Setup Simples do AI Agent OFIX
# Execute este script no PowerShell

Write-Host "Configurando AI Agent OFIX..." -ForegroundColor Cyan

# Verificar se estamos na pasta correta
if (-not (Test-Path "ai-agent")) {
    Write-Host "Erro: Execute este script na pasta raiz do projeto OFIX" -ForegroundColor Red
    Write-Host "Voce deve estar em: C:\OfixNovo\ofix_new" -ForegroundColor Yellow
    exit 1
}

Write-Host "Pasta do projeto encontrada" -ForegroundColor Green

# Verificar Node.js
try {
    $nodeVersion = node --version
    Write-Host "Node.js encontrado: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "Node.js nao encontrado. Instale Node.js 18+ primeiro" -ForegroundColor Red
    exit 1
}

# Instalar dependências do AI Agent
Write-Host "Instalando dependencias do AI Agent..." -ForegroundColor Yellow
Set-Location ai-agent

try {
    npm install
    Write-Host "Dependencias instaladas com sucesso" -ForegroundColor Green
} catch {
    Write-Host "Erro ao instalar dependencias" -ForegroundColor Red
    Write-Host "Tente: npm install --force" -ForegroundColor Yellow
}

Set-Location ..

# Criar arquivo .env se não existir
if (-not (Test-Path ".env")) {
    Write-Host "Criando arquivo .env..." -ForegroundColor Yellow
    
    $envContent = @"
# OFIX AI Agent Configuration

# AI Provider API Keys (adicione pelo menos uma)
CLAUDE_API_KEY=sua_chave_claude_aqui
OPENAI_API_KEY=sua_chave_openai_aqui

# AI Agent Settings
AI_AGENT_LOG_LEVEL=info
AI_AGENT_ENABLE_DASHBOARD=true
AI_AGENT_DASHBOARD_PORT=3001
AI_AGENT_AUTO_SUGGESTIONS=true
AI_AGENT_CODE_REVIEW=true
AI_AGENT_PERFORMANCE_MONITORING=true
AI_AGENT_SECURITY_SCANNING=true

# Development Settings
AI_AGENT_DEVELOPMENT_MODE=true
AI_AGENT_CACHE_ENABLED=true
AI_AGENT_METRICS_ENABLED=true
"@
    
    $envContent | Out-File -FilePath ".env" -Encoding UTF8
    Write-Host "Arquivo .env criado" -ForegroundColor Green
    Write-Host "IMPORTANTE: Edite o arquivo .env e adicione sua chave de API!" -ForegroundColor Yellow
} else {
    Write-Host "Arquivo .env ja existe" -ForegroundColor Green
}

# Teste básico
Write-Host "Testando AI Agent..." -ForegroundColor Yellow

try {
    $testOutput = node ai-agent/cli.js --help 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "AI Agent CLI funcionando!" -ForegroundColor Green
    } else {
        Write-Host "AI Agent com problemas, mas CLI encontrado" -ForegroundColor Yellow
    }
} catch {
    Write-Host "Erro ao testar AI Agent CLI" -ForegroundColor Red
}

# Criar scripts de conveniência
Write-Host "Criando scripts de conveniencia..." -ForegroundColor Yellow

# Script para análise rápida
$analyzeScript = @"
# Analise rapida com AI Agent
Write-Host "Analisando codigo..." -ForegroundColor Cyan
node ai-agent/cli.js analyze src
"@

$analyzeScript | Out-File -FilePath "ai-analyze.ps1" -Encoding UTF8

# Script para dashboard
$dashboardScript = @"
# Abrir dashboard do AI Agent
Write-Host "Iniciando dashboard..." -ForegroundColor Cyan
Write-Host "Abra: http://localhost:3001" -ForegroundColor Yellow
node ai-agent/src/web/dashboard-server.js
"@

$dashboardScript | Out-File -FilePath "ai-dashboard.ps1" -Encoding UTF8

Write-Host "Scripts criados: ai-analyze.ps1, ai-dashboard.ps1" -ForegroundColor Green

# Resumo final
Write-Host ""
Write-Host "Setup concluido!" -ForegroundColor Green
Write-Host ""
Write-Host "Proximos passos:" -ForegroundColor Cyan
Write-Host "1. Edite o arquivo .env e adicione sua chave de API (Claude ou OpenAI)" -ForegroundColor White
Write-Host "2. Teste: node ai-agent/cli.js --help" -ForegroundColor White
Write-Host "3. Analise: node ai-agent/cli.js analyze src" -ForegroundColor White
Write-Host "4. Dashboard: ./ai-dashboard.ps1" -ForegroundColor White
Write-Host ""
Write-Host "Guia completo: COMO_USAR_AI_AGENT.md" -ForegroundColor Yellow

# Verificar se há chave de API
$envContent = Get-Content .env -Raw
if ($envContent -match "sua_chave_") {
    Write-Host ""
    Write-Host "LEMBRE-SE: Configure sua chave de API no arquivo .env!" -ForegroundColor Red
    Write-Host "Obtenha uma chave em: https://console.anthropic.com (Claude) ou https://platform.openai.com (OpenAI)" -ForegroundColor Yellow
}
