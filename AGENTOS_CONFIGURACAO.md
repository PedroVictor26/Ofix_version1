# 🤖 CONFIGURAÇÃO AGNO + AGENTOS

## 📡 URLs Típicas do AgentOS:

```bash
# Formato 1: API padrão
AGNO_API_URL=https://api.agentos.ai/v1

# Formato 2: Com workspace
AGNO_API_URL=https://SEU-WORKSPACE.agentos.ai/api

# Formato 3: Endpoint direto do agente  
AGNO_API_URL=https://api.agentos.ai/v1/agents/SEU-AGENT-ID

# Formato 4: Subdomínio personalizado
AGNO_API_URL=https://agents.agentos.ai/SEU-ID
```

## 🔍 Como Encontrar no Dashboard AgentOS:

### Passo 1: Login
- Acesse: https://app.agentos.ai
- Faça login com suas credenciais

### Passo 2: Localizar Agente
- Vá para "My Agents" ou "Meus Agentes"
- Encontre seu agente "oficinaia"
- Clique para abrir detalhes

### Passo 3: Encontrar API Info
Procure por essas seções:
- ✅ **"API Endpoint"**
- ✅ **"Webhook URL"** 
- ✅ **"Integration Settings"**
- ✅ **"API Access"**
- ✅ **"Developer Tools"**

### Passo 4: Copiar Credenciais
Você vai encontrar:
```
Base URL: https://api.agentos.ai/v1
Agent ID: abc123def456  
API Key: sk-xxxxxxxxxxxxx
```

## ⚙️ Configuração no OFIX (.env):

```bash
# URL base do AgentOS
AGNO_API_URL=https://api.agentos.ai/v1

# Seu token/API key
AGNO_API_TOKEN=sk-xxxxxxxxxxxxx

# ID do seu agente
AGNO_DEFAULT_AGENT_ID=abc123def456

# Remover modo fallback
# AGNO_FALLBACK_MODE=true
```

## 🧪 Teste Rápido:

Depois de configurar, teste se está funcionando:

```bash
# Teste 1: Health check
curl -H "Authorization: Bearer SEU-TOKEN" \
  https://api.agentos.ai/v1/health

# Teste 2: Listar agentes  
curl -H "Authorization: Bearer SEU-TOKEN" \
  https://api.agentos.ai/v1/agents

# Teste 3: Seu agente específico
curl -H "Authorization: Bearer SEU-TOKEN" \
  https://api.agentos.ai/v1/agents/SEU-AGENT-ID
```

## 📱 Se Não Encontrar no Dashboard:

### Alternativa 1: Suporte AgentOS
- Entre em contato com suporte do AgentOS
- Peça as informações da API

### Alternativa 2: Documentação
- Verifique docs.agentos.ai
- Procure por "API Integration"

### Alternativa 3: CLI
```bash
# Se instalou o CLI do AgentOS
agentos auth status
agentos agents list
agentos agent info oficinaia
```

---

## 🎯 Próximo Passo:

1. **Acesse seu dashboard AgentOS**
2. **Encontre as informações da API**
3. **Me informe:**
   - URL base
   - API Key/Token  
   - Agent ID

Com essas informações, configuro tudo para você! 🚀