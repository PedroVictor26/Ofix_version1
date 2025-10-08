# 📋 CONFIGURAÇÃO DO SEU AGENTE AGNO

## 🔧 Passo 1: Descobrir a URL do Seu Agente

### Onde você hospedou seu agente Agno?

**[ ] Localhost (desenvolvimento)**
```bash
AGNO_API_URL=http://localhost:8000
```

**[ ] Render**
```bash
AGNO_API_URL=https://seu-agente-name.onrender.com
```

**[ ] Heroku**
```bash
AGNO_API_URL=https://seu-agente-name.herokuapp.com
```

**[ ] VPS/Servidor Próprio**
```bash
AGNO_API_URL=http://SEU-IP:PORTA
# ou
AGNO_API_URL=https://seu-dominio.com
```

**[ ] AgentOS/Outra Plataforma**
```bash
AGNO_API_URL=https://api-do-seu-agente.com
```

## 🧪 Passo 2: Testar a URL

Execute este comando para verificar se seu agente está respondendo:

```bash
# Substitua pela URL do seu agente
curl https://sua-agno-url/health

# Ou teste no navegador:
# https://sua-agno-url/health
```

**Resposta esperada:**
```json
{
  "status": "ok",
  "message": "Agente funcionando"
}
```

## ⚙️ Passo 3: Configurar no OFIX

1. **Edite o arquivo `.env` do backend:**
   ```bash
   AGNO_API_URL=SUA-URL-AQUI
   AGNO_API_TOKEN=seu-token-se-tiver
   AGNO_DEFAULT_AGENT_ID=seu-agent-id
   ```

2. **Remova o modo fallback:**
   ```bash
   # AGNO_FALLBACK_MODE=true  <- comente ou remova esta linha
   ```

## 🔐 Passo 4: Token de Autenticação (Se Necessário)

Se seu agente usa autenticação, você precisará do token:

```bash
AGNO_API_TOKEN=Bearer seu-token-aqui
# ou
AGNO_API_TOKEN=seu-token-aqui
```

## 📍 Onde Encontrar Essas Informações?

### Se hospedou no Render:
1. Acesse https://dashboard.render.com
2. Clique no seu serviço do agente
3. Copie a URL que aparece no topo

### Se hospedou no Heroku:
1. Acesse https://dashboard.heroku.com
2. Clique no seu app
3. Vá em Settings → Domains

### Se está rodando localmente:
1. Verifique o terminal onde iniciou o agente
2. Procure por mensagens como "Server running on port 8000"

## 🚀 Exemplo Completo de Configuração:

```bash
# Exemplo com Render
AGNO_API_URL=https://meu-agente-ofix.onrender.com
AGNO_API_TOKEN=
AGNO_DEFAULT_AGENT_ID=oficinaia

# Exemplo com localhost
AGNO_API_URL=http://localhost:8000
AGNO_API_TOKEN=
AGNO_DEFAULT_AGENT_ID=oficinaia
```

---

**🎯 Próximo Passo:** Depois de configurar, me informe sua URL para testarmos a conexão!