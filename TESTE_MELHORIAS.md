# 🧪 Guia de Testes - Melhorias Implementadas

## 📋 Checklist de Testes

### ✅ PRÉ-REQUISITOS
- [ ] Deploy feito no Render
- [ ] Backend rodando em produção
- [ ] Frontend acessível

---

## 🔴 **TESTE 1: Erro Prisma Corrigido (Consulta OS)**

### Objetivo
Verificar que consultas de Ordem de Serviço não geram mais erro `TypeError: Cannot read properties of undefined`

### Como Testar

**No chat do Matias:**
```
1. Digite: "status da os 123"
2. Digite: "consultar os número 45"
3. Digite: "ver ordem de serviço"
```

**✅ SUCESSO se:**
- Não aparecer erro no console do Render
- Matias responde (mesmo que não encontre OS)
- Logs mostram: `🔧 [ACAO_LOCAL] Processando: CONSULTA_OS`

**❌ FALHA se:**
- Console mostrar: `Cannot read properties of undefined (reading 'findMany')`
- Erro 500 retornado

---

## 💾 **TESTE 2: Cache de Respostas (60% Economia)**

### Objetivo
Verificar que perguntas repetidas usam cache em vez de chamar API

### Como Testar

**Passo 1 - Primeira pergunta:**
```
1. Digite: "Quanto custa troca de óleo?"
2. Observe tempo de resposta (~4-5s)
3. Verifique logs do Render
```

**Logs esperados (primeira vez):**
```
🧠 [AGNO_AI] Conectando com Agno...
✅ [AGNO_AI] Resposta recebida
💾 [CACHE] Resposta salva no cache
```

**Passo 2 - Mesma pergunta novamente:**
```
1. Digite: "quanto custa troca de óleo?" (idêntica)
2. Observe tempo de resposta (~100ms - instantâneo!)
3. Verifique logs do Render
```

**Logs esperados (segunda vez):**
```
✅ [CACHE] Hit - resposta do cache
```

**✅ SUCESSO se:**
- Segunda resposta é instantânea (<500ms)
- Logs mostram "Hit - resposta do cache"
- Resposta idêntica à primeira

**❌ FALHA se:**
- Segunda resposta demora 4-5s novamente
- Logs mostram "Conectando com Agno..." na segunda vez

**💡 DICA:** Cache expira após 1 hora. Para testar novamente, espere 1h ou reinicie o backend.

---

## 🔥 **TESTE 3: Warm-up Inteligente (50% Economia)**

### Objetivo
Verificar que warm-up só acontece quando necessário

### Como Testar

**Cenário 1 - Sistema ativo:**
```
1. Use o chat normalmente por 5 minutos
2. Aguarde 10 minutos (tempo do intervalo de warm-up)
3. Verifique logs do Render após 10 minutos
```

**Logs esperados:**
```
✅ [AUTO-WARMUP] Ativo (5min) - warm-up desnecessário
```

**Cenário 2 - Sistema inativo:**
```
1. NÃO use o chat por 15 minutos
2. Aguarde o intervalo de warm-up (10 min)
3. Verifique logs do Render
```

**Logs esperados:**
```
🔥 [AUTO-WARMUP] Inativo 15min - aquecendo...
✅ [AUTO-WARMUP] Agno AI aquecido com sucesso
```

**✅ SUCESSO se:**
- Sistema ativo: não faz warm-up desnecessário
- Sistema inativo: aquece proativamente

---

## 🔒 **TESTE 4: Validação de Mensagens**

### Objetivo
Verificar que mensagens inválidas são rejeitadas

### Como Testar

**Teste 4.1 - Mensagem vazia:**
```javascript
// Abra DevTools (F12) → Console
fetch('https://ofix-backend-prod.onrender.com/api/agno/chat-inteligente', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ message: '', usuario_id: 'test' })
})
.then(r => r.json())
.then(console.log);
```

**✅ SUCESSO se:**
- Retorna: `{ error: 'Mensagem obrigatória' }`
- Status: 400

**Teste 4.2 - Mensagem muito longa:**
```javascript
// Mensagem com 6000 caracteres (limite é 5000)
const longMessage = 'a'.repeat(6000);

fetch('https://ofix-backend-prod.onrender.com/api/agno/chat-inteligente', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ message: longMessage, usuario_id: 'test' })
})
.then(r => r.json())
.then(console.log);
```

**✅ SUCESSO se:**
- Retorna: `{ error: 'Mensagem muito longa (max 5000 caracteres)' }`
- Status: 400

---

## 🚫 **TESTE 5: Rate Limiter Público**

### Objetivo
Verificar que endpoint público bloqueia após 20 requests

### Como Testar

**Abra terminal e execute:**
```powershell
# Script para testar rate limit (faz 25 requests)
for ($i=1; $i -le 25; $i++) {
    Write-Host "Request $i"
    curl -X POST https://ofix-backend-prod.onrender.com/api/agno/chat-public `
         -H "Content-Type: application/json" `
         -d '{"message":"teste"}' | ConvertFrom-Json
    Start-Sleep -Milliseconds 200
}
```

**✅ SUCESSO se:**
- Requests 1-20: retornam normalmente
- Requests 21-25: retornam `{ error: 'Muitas requisições deste IP', retry_after: '15 minutos' }`
- Status 429 nas últimas 5

**❌ FALHA se:**
- Todas as 25 requests passam

---

## 🧠 **TESTE 6: Classifier Ajustado**

### Objetivo
Verificar que "meu carro" não é mais detectado como CONSULTA_OS

### Como Testar

**Sequência:**
```
1. Digite: "Quanto custa troca de óleo?"
   → Matias responde perguntando modelo do carro
   
2. Digite: "meu carro é um gol"
   → Deve CONTINUAR a conversa (AGNO_AI)
   → NÃO deve dar erro de Prisma
```

**Verifique logs:**
```
💬 [CLASSIFIER] Detectado: ORCAMENTO (Orçamentos e preços)
🎯 [CLASSIFIER] Resultado: { processor: 'AGNO_AI', ... }
🧠 [AGNO_AI] Enviando para Agno AI...
```

**✅ SUCESSO se:**
- Matias continua a conversa sobre orçamento
- Logs mostram processor: 'AGNO_AI'
- Nenhum erro de Prisma

**❌ FALHA se:**
- Logs mostram: `CONSULTA_OS`
- Erro: `Cannot read properties of undefined`

---

## 📊 **TESTE 7: Monitoramento de Impacto**

### Objetivo
Verificar métricas após 24h de uso

### Como Monitorar

**No Render → Logs:**
```bash
# Contar hits de cache (após 24h):
grep "[CACHE] Hit" logs | wc -l

# Contar chamadas à API:
grep "[AGNO_AI] Conectando" logs | wc -l

# Contar warm-ups evitados:
grep "warm-up desnecessário" logs | wc -l
```

**✅ SUCESSO se (após 24h):**
- Hits de cache > 40% das requisições
- Warm-ups evitados > 50% dos intervalos
- Sem erros de Prisma

---

## 🔍 **TESTE RÁPIDO - Validação Geral**

### 1️⃣ Teste de Saudação (Backend Local)
```
Digite: "oi"
✅ Resposta instantânea (<100ms)
✅ Logs: [BACKEND_LOCAL] Processado
```

### 2️⃣ Teste de Orçamento (Agno AI)
```
Digite: "quanto custa troca de óleo?"
✅ Resposta em ~4-5s
✅ Logs: [AGNO_AI] Resposta recebida
```

### 3️⃣ Teste de Cache
```
Digite: "quanto custa troca de óleo?" (novamente)
✅ Resposta instantânea (<500ms)
✅ Logs: [CACHE] Hit
```

### 4️⃣ Teste de Continuação
```
Digite: "meu carro é um gol"
✅ Matias responde sobre o Gol
✅ SEM erro de Prisma
```

### 5️⃣ Teste de Validação
```
Digite mensagem vazia ou muito longa
✅ Erro 400 retornado
✅ Mensagem de erro clara
```

---

## 🛠️ **FERRAMENTAS DE TESTE**

### DevTools do Chrome
```
F12 → Network → filtrar "agno"
```

### Render Logs em Tempo Real
```
https://dashboard.render.com
→ ofix-backend-prod
→ Logs (tail)
```

### PowerShell para Testes de Carga
```powershell
# 10 requests em sequência
1..10 | ForEach-Object {
    Invoke-RestMethod -Uri "https://ofix-backend-prod.onrender.com/api/agno/chat-inteligente" `
                      -Method POST `
                      -ContentType "application/json" `
                      -Body '{"message":"teste '$_'","usuario_id":"test"}'
}
```

---

## 📈 **MÉTRICAS DE SUCESSO**

### Após implementação:

| Métrica | Antes | Meta | Como Medir |
|---------|-------|------|------------|
| **Tempo resposta (cache)** | 4-5s | <500ms | Perguntar 2x a mesma coisa |
| **Chamadas API economizadas** | 0% | 60% | Contar cache hits vs total |
| **Warm-ups evitados** | 0% | 50% | Logs "warm-up desnecessário" |
| **Erros Prisma** | Sim | 0 | Testar CONSULTA_OS |
| **Requests bloqueadas (público)** | Não | >20/15min | Teste de carga |

---

## 🚨 **PROBLEMAS COMUNS E SOLUÇÕES**

### "Cache não funciona"
- ✅ Verificar se mensagem é EXATAMENTE igual (case-insensitive)
- ✅ Aguardar 2 segundos entre requests
- ✅ Verificar logs do Render para confirmar cache ativo

### "Rate limiter não bloqueia"
- ✅ Testar de IPs diferentes
- ✅ Aguardar 15 minutos para resetar contador
- ✅ Verificar se endpoint é `/chat-public`

### "Warm-up sempre ativo"
- ✅ Normal se sistema está sendo usado
- ✅ Testar após 15 minutos de inatividade

### "Erro de Prisma continua"
- ✅ Verificar se deploy foi feito no Render
- ✅ Confirmar que commit `fccf00b` está em produção
- ✅ Verificar logs: `npx prisma generate` executado no build

---

## ✅ **CHECKLIST FINAL DE VALIDAÇÃO**

```
[ ] Deploy feito no Render
[ ] Cache funcionando (resposta instantânea na 2ª vez)
[ ] Warm-up inteligente ativo (logs mostram economia)
[ ] Validação de mensagens funcionando (erro 400)
[ ] Rate limiter bloqueando após 20 requests
[ ] Classifier não detecta "meu carro" como CONSULTA_OS
[ ] Sem erros de Prisma em CONSULTA_OS
[ ] Logs sanitizados (sem CPF/telefone completo)
```

---

## 🎉 **RESULTADO ESPERADO**

Após todos os testes:
- ✅ Sistema 60% mais eficiente (cache)
- ✅ 50% menos gastos com warm-up
- ✅ Segurança melhorada (validação + rate limit)
- ✅ Sem erros de Prisma
- ✅ Compliance LGPD (logs sanitizados)

**Qualquer falha? Veja seção "Problemas Comuns" acima!**
