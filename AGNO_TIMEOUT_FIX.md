# 🔧 Correção de Timeout do Agno AI

## Problema Identificado

O serviço Agno AI hospedado no Render estava apresentando **timeouts** devido ao "cold start" - quando o serviço fica inativo por um tempo, o Render o desliga e leva até 50 segundos para reativá-lo no próximo acesso.

### Erros Anteriores:
```
⚠️ Agno falhou, usando fallback: network timeout at: https://matias-agno-assistant.onrender.com/chat
```

## Soluções Implementadas

### 1. ⏱️ **Timeout Ajustado**
- **Antes:** 15 segundos (insuficiente para cold start)
- **Depois:** 
  - Primeira tentativa: **45 segundos**
  - Segunda tentativa: **30 segundos**
  - Warming endpoint: **60 segundos**

### 2. 🔄 **Sistema de Retry**
- Implementado retry automático (2 tentativas)
- Intervalo de 2 segundos entre tentativas
- Log detalhado de cada tentativa

### 3. 🔥 **Warming System**
- Função `warmAgnoService()` para "acordar" o serviço
- Chamada automática antes da primeira requisição
- Endpoint dedicado: `POST /agno/warm`
- Cache de status (evita múltiplas tentativas simultâneas)

### 4. 💬 **Mensagens Melhoradas**
- Fallback com explicação sobre cold start
- Mensagens diferentes para timeout vs erro real
- Informação ao usuário sobre tempo de espera

## Como Usar

### Aquecer Manualmente o Serviço

Para evitar timeout na primeira requisição, você pode aquecer o serviço:

```bash
# Via curl
curl -X POST https://ofix-backend-prod.onrender.com/agno/warm

# Via Postman/Insomnia
POST https://ofix-backend-prod.onrender.com/agno/warm
```

**Resposta esperada:**
```json
{
  "success": true,
  "warmed": true,
  "agno_url": "https://matias-agno-assistant.onrender.com",
  "message": "Serviço Agno aquecido com sucesso",
  "timestamp": "2025-11-06T19:00:00.000Z"
}
```

### Verificar Status do Agno

```bash
GET https://ofix-backend-prod.onrender.com/agno/config
```

**Resposta:**
```json
{
  "configured": true,
  "agno_url": "https://matias-agno-assistant.onrender.com",
  "has_token": false,
  "agent_id": "oficinaia",
  "warmed": true,
  "last_warming": "2025-11-06T19:00:00.000Z",
  "timestamp": "2025-11-06T19:05:00.000Z",
  "status": "production"
}
```

## Configuração no Render

Para que o Agno funcione corretamente, certifique-se de ter as seguintes variáveis de ambiente configuradas no Render:

```bash
# Obrigatório
AGNO_API_URL=https://matias-agno-assistant.onrender.com

# Opcional (se o Agno exigir autenticação)
AGNO_API_TOKEN=seu_token_aqui

# Recomendado
AGNO_DEFAULT_AGENT_ID=oficinaia
```

## Melhorias de Performance

### Manter o Serviço Warm (Recomendado)

Para evitar cold starts, você pode:

1. **Usar um Cron Job Externo** (ex: cron-job.org, EasyCron):
   - Configurar chamada a cada 10 minutos:
   ```
   */10 * * * * curl -X POST https://ofix-backend-prod.onrender.com/agno/warm
   ```

2. **Usar UptimeRobot ou Similar**:
   - Monitorar: `https://matias-agno-assistant.onrender.com/health`
   - Intervalo: 5-10 minutos
   - Isso mantém o serviço sempre ativo

3. **Upgrade do Plano Render** (se disponível):
   - Planos pagos do Render não dormem automaticamente

## Comportamento Atual

### Fluxo de Chamada ao Agno:

1. **Usuário envia mensagem** → Backend detecta intenção
2. **Verifica se Agno está warm** → Se não, tenta aquecer
3. **Primeira tentativa** (45s timeout):
   - ✅ Sucesso → Resposta do Agno
   - ❌ Timeout/Erro → Aguarda 2s e tenta novamente
4. **Segunda tentativa** (30s timeout):
   - ✅ Sucesso → Resposta do Agno
   - ❌ Timeout/Erro → Usa fallback local
5. **Fallback local** → Resposta genérica + aviso sobre cold start

### Mensagens ao Usuário:

**Timeout (Cold Start):**
```
💰 Consulta de Preço - troca de óleo

⚠️ O assistente avançado está iniciando (pode levar até 50 segundos no primeiro acesso). 
Você receberá uma resposta mais detalhada em breve.

Por enquanto:
Para fornecer um orçamento preciso, preciso de algumas informações:
• Qual é o modelo do veículo?
• Qual ano?

Os valores variam dependendo do veículo. Entre em contato para um orçamento personalizado!
```

## Logs Detalhados

Os logs agora mostram claramente cada etapa:

```
🎯 Chat Inteligente - Mensagem: Quanto custa a troca de oleo?
🎯 Usuario ID: 27ff6aaf-9c92-4110-accd-9ac320a598e7
   ✅ Usando NLP do frontend: consulta_preco (19.2%)
   Intenção final: CONSULTA_PRECO
   🎯 Intenção detectada: CONSULTA_PRECO
   🤖 Chamando Agno AI para CONSULTA_PRECO
   🔌 Conectando com Agno AI...
   ⏳ Agno não está aquecido, tentando warming...
   🔥 Aquecendo serviço Agno...
   ✅ Serviço Agno aquecido e pronto!
   ✅ Resposta do Agno recebida
```

## Teste Local

Para testar localmente sem o Agno configurado:

```bash
# No .env local, deixe comentado ou remova:
# AGNO_API_URL=...

# O sistema usará fallback automático
```

## Próximos Passos Recomendados

1. ✅ **Configurar Cron Job** para manter o Agno warm
2. ✅ **Monitorar logs** para verificar taxa de sucesso
3. ⚠️ **Considerar cache de respostas** para perguntas frequentes
4. ⚠️ **Implementar métricas** (tempo de resposta, taxa de timeout, etc.)

## Suporte

Se o timeout persistir mesmo após as melhorias:

1. Verifique se o serviço Agno está online: `https://matias-agno-assistant.onrender.com/health`
2. Verifique os logs do Render (tanto backend quanto Agno)
3. Considere aumentar o plano do Render para evitar cold starts
4. Entre em contato com o suporte do Render se o problema persistir

---

**Data da Implementação:** 06/11/2025  
**Versão:** 1.0  
**Status:** ✅ Implementado e Testado
