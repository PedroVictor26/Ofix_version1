# 🧪 Script de Teste Automatizado - Melhorias OFIX Backend

# Configurações
$BACKEND_URL = "https://ofix-backend-prod.onrender.com"
$API_BASE = "$BACKEND_URL/api/agno"

Write-Host "🚀 Iniciando testes automatizados das melhorias..." -ForegroundColor Cyan
Write-Host ""

# ============================================================
# TESTE 1: VALIDAÇÃO DE MENSAGENS
# ============================================================
Write-Host "🧪 TESTE 1: Validação de Mensagens" -ForegroundColor Yellow
Write-Host "=" * 60

# Teste 1.1: Mensagem vazia
Write-Host "Testando mensagem vazia..." -ForegroundColor Gray
try {
    $response = Invoke-RestMethod -Uri "$API_BASE/chat-public" `
                                  -Method POST `
                                  -ContentType "application/json" `
                                  -Body '{"message":""}' `
                                  -ErrorAction Stop
    Write-Host "❌ FALHOU: Aceitou mensagem vazia" -ForegroundColor Red
} catch {
    if ($_.Exception.Response.StatusCode -eq 400) {
        Write-Host "✅ PASSOU: Rejeitou mensagem vazia (400)" -ForegroundColor Green
    } else {
        Write-Host "❌ FALHOU: Status inesperado - $($_.Exception.Response.StatusCode)" -ForegroundColor Red
    }
}

# Teste 1.2: Mensagem muito longa
Write-Host "Testando mensagem muito longa (>5000 chars)..." -ForegroundColor Gray
$longMessage = "a" * 6000
try {
    $response = Invoke-RestMethod -Uri "$API_BASE/chat-public" `
                                  -Method POST `
                                  -ContentType "application/json" `
                                  -Body "{`"message`":`"$longMessage`"}" `
                                  -ErrorAction Stop
    Write-Host "❌ FALHOU: Aceitou mensagem longa" -ForegroundColor Red
} catch {
    if ($_.Exception.Response.StatusCode -eq 400) {
        Write-Host "✅ PASSOU: Rejeitou mensagem longa (400)" -ForegroundColor Green
    } else {
        Write-Host "❌ FALHOU: Status inesperado - $($_.Exception.Response.StatusCode)" -ForegroundColor Red
    }
}

Write-Host ""

# ============================================================
# TESTE 2: CACHE DE RESPOSTAS
# ============================================================
Write-Host "🧪 TESTE 2: Cache de Respostas" -ForegroundColor Yellow
Write-Host "=" * 60

$testMessage = "Quanto custa troca de óleo?"

# Primeira chamada (sem cache)
Write-Host "Primeira chamada (sem cache)..." -ForegroundColor Gray
$stopwatch1 = [System.Diagnostics.Stopwatch]::StartNew()
try {
    $response1 = Invoke-RestMethod -Uri "$API_BASE/chat-public" `
                                   -Method POST `
                                   -ContentType "application/json" `
                                   -Body "{`"message`":`"$testMessage`"}"
    $stopwatch1.Stop()
    $time1 = $stopwatch1.ElapsedMilliseconds
    Write-Host "  Tempo: ${time1}ms" -ForegroundColor Cyan
    
    # Segunda chamada (com cache)
    Write-Host "Segunda chamada (esperado do cache)..." -ForegroundColor Gray
    Start-Sleep -Seconds 1
    
    $stopwatch2 = [System.Diagnostics.Stopwatch]::StartNew()
    $response2 = Invoke-RestMethod -Uri "$API_BASE/chat-public" `
                                   -Method POST `
                                   -ContentType "application/json" `
                                   -Body "{`"message`":`"$testMessage`"}"
    $stopwatch2.Stop()
    $time2 = $stopwatch2.ElapsedMilliseconds
    Write-Host "  Tempo: ${time2}ms" -ForegroundColor Cyan
    
    # Verificar se segunda é mais rápida (cache)
    if ($time2 -lt ($time1 * 0.5)) {
        Write-Host "✅ PASSOU: Cache funcionando (2ª chamada 50%+ mais rápida)" -ForegroundColor Green
        Write-Host "  Economia: $([math]::Round((1 - $time2/$time1) * 100, 1))%" -ForegroundColor Green
    } else {
        Write-Host "⚠️  ALERTA: Cache pode não estar funcionando" -ForegroundColor Yellow
        Write-Host "  1ª: ${time1}ms | 2ª: ${time2}ms" -ForegroundColor Yellow
    }
    
    # Verificar se resposta é idêntica
    if ($response1.response -eq $response2.response) {
        Write-Host "✅ PASSOU: Respostas idênticas" -ForegroundColor Green
    } else {
        Write-Host "❌ FALHOU: Respostas diferentes" -ForegroundColor Red
    }
    
} catch {
    Write-Host "❌ ERRO: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""

# ============================================================
# TESTE 3: RATE LIMITER
# ============================================================
Write-Host "🧪 TESTE 3: Rate Limiter Público (20 req/15min)" -ForegroundColor Yellow
Write-Host "=" * 60

Write-Host "Enviando 25 requests..." -ForegroundColor Gray
$blocked = 0
$passed = 0

for ($i = 1; $i -le 25; $i++) {
    Write-Progress -Activity "Testando Rate Limiter" -Status "Request $i/25" -PercentComplete (($i/25)*100)
    
    try {
        $response = Invoke-RestMethod -Uri "$API_BASE/chat-public" `
                                      -Method POST `
                                      -ContentType "application/json" `
                                      -Body "{`"message`":`"teste $i`"}" `
                                      -ErrorAction Stop
        $passed++
    } catch {
        if ($_.Exception.Response.StatusCode -eq 429) {
            $blocked++
        }
    }
    
    Start-Sleep -Milliseconds 200
}

Write-Host "  Passaram: $passed" -ForegroundColor Cyan
Write-Host "  Bloqueadas: $blocked" -ForegroundColor Cyan

if ($blocked -ge 5) {
    Write-Host "✅ PASSOU: Rate limiter ativo (bloqueou $blocked requests)" -ForegroundColor Green
} elseif ($blocked -gt 0) {
    Write-Host "⚠️  PARCIAL: Rate limiter funcionando parcialmente" -ForegroundColor Yellow
} else {
    Write-Host "❌ FALHOU: Rate limiter não bloqueou nenhuma request" -ForegroundColor Red
}

Write-Host ""

# ============================================================
# TESTE 4: VERIFICAÇÃO DE CONFIG
# ============================================================
Write-Host "🧪 TESTE 4: Verificação de Configuração" -ForegroundColor Yellow
Write-Host "=" * 60

try {
    $config = Invoke-RestMethod -Uri "$API_BASE/config" -Method GET
    
    Write-Host "  Agno URL: $($config.agno_url)" -ForegroundColor Cyan
    Write-Host "  Configurado: $($config.configured)" -ForegroundColor Cyan
    Write-Host "  Agent ID: $($config.agent_id)" -ForegroundColor Cyan
    Write-Host "  Warmed: $($config.warmed)" -ForegroundColor Cyan
    
    if ($config.configured -and $config.agent_id -eq 'matias') {
        Write-Host "✅ PASSOU: Configuração correta" -ForegroundColor Green
    } else {
        Write-Host "❌ FALHOU: Configuração incorreta" -ForegroundColor Red
    }
} catch {
    Write-Host "❌ ERRO: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""

# ============================================================
# TESTE 5: CLASSIFIER (CONVERSA CONTEXTUAL)
# ============================================================
Write-Host "🧪 TESTE 5: Classifier - 'meu carro' não é CONSULTA_OS" -ForegroundColor Yellow
Write-Host "=" * 60

# Sequência de conversa
Write-Host "Pergunta 1: Orçamento..." -ForegroundColor Gray
try {
    $response1 = Invoke-RestMethod -Uri "$API_BASE/chat-public" `
                                   -Method POST `
                                   -ContentType "application/json" `
                                   -Body '{"message":"Quanto custa alinhamento e balanceamento?"}'
    Write-Host "  Resposta: $($response1.response.Substring(0, [Math]::Min(80, $response1.response.Length)))..." -ForegroundColor Cyan
    
    Start-Sleep -Seconds 2
    
    Write-Host "Pergunta 2: Modelo do carro..." -ForegroundColor Gray
    $response2 = Invoke-RestMethod -Uri "$API_BASE/chat-public" `
                                   -Method POST `
                                   -ContentType "application/json" `
                                   -Body '{"message":"meu carro é um gol 2015"}'
    
    if ($response2.success) {
        Write-Host "  Resposta: $($response2.response.Substring(0, [Math]::Min(80, $response2.response.Length)))..." -ForegroundColor Cyan
        Write-Host "✅ PASSOU: Continuou conversa (não deu erro Prisma)" -ForegroundColor Green
    } else {
        Write-Host "❌ FALHOU: Erro na resposta" -ForegroundColor Red
    }
    
} catch {
    Write-Host "❌ ERRO: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""

# ============================================================
# RESUMO
# ============================================================
Write-Host "=" * 60 -ForegroundColor Cyan
Write-Host "🎯 RESUMO DOS TESTES" -ForegroundColor Cyan
Write-Host "=" * 60 -ForegroundColor Cyan
Write-Host ""
Write-Host "Para verificar logs detalhados:" -ForegroundColor White
Write-Host "  https://dashboard.render.com → ofix-backend-prod → Logs" -ForegroundColor Gray
Write-Host ""
Write-Host "Comandos úteis para análise:" -ForegroundColor White
Write-Host "  grep '[CACHE] Hit' - Verificar cache hits" -ForegroundColor Gray
Write-Host "  grep '[AUTO-WARMUP]' - Verificar warm-up inteligente" -ForegroundColor Gray
Write-Host "  grep 'Cannot read properties' - Verificar erros Prisma" -ForegroundColor Gray
Write-Host ""
Write-Host "✨ Testes concluídos!" -ForegroundColor Green
