# 🧪 COMO TESTAR A CORREÇÃO DO AGNO AI

## ✅ O Que Foi Corrigido

O endpoint do Agno AI foi corrigido de `/agents/oficinaia/runs` para `/chat`, e o formato da requisição foi mudado de FormData para JSON.

## 🚀 Passo a Passo para Testar

### 1. Verificar se o Backend Está Rodando

```bash
cd ofix-backend
npm run dev
```

O backend deve iniciar na porta 3001.

### 2. Executar o Teste Automatizado

Em outro terminal:

```bash
node teste-backend-agno.js
```

Este script vai testar:
- ✅ Configuração do Agno
- ✅ Conexão direta com o Agno AI
- ✅ Endpoint `/api/agno/chat-public`
- ✅ Endpoint `/api/agno/chat-inteligente`

### 3. Testes Manuais com cURL

#### Teste 1: Verificar Configuração
```bash
curl http://localhost:3001/api/agno/config
```

**Resposta esperada:**
```json
{
  "configured": true,
  "agno_url": "https://matias-agno-assistant.onrender.com",
  "has_token": false,
  "agent_id": "oficinaia",
  "status": "production"
}
```

#### Teste 2: Chat Público
```bash
curl -X POST http://localhost:3001/api/agno/chat-public \
  -H "Content-Type: application/json" \
  -d "{\"message\":\"Olá, preciso de ajuda com meu carro\"}"
```

**Resposta esperada:**
```json
{
  "success": true,
  "response": "**Bem-vindo à nossa oficina automotiva!**\n\n...",
  "mode": "production",
  "agno_configured": true
}
```

#### Teste 3: Chat Inteligente
```bash
curl -X POST http://localhost:3001/api/agno/chat-inteligente \
  -H "Content-Type: application/json" \
  -d "{\"message\":\"Quanto custa uma revisão?\",\"usuario_id\":\"123\",\"nlp\":{\"intencao\":\"consulta_preco\",\"confianca\":0.95}}"
```

### 4. Testar no Frontend

1. Inicie o frontend:
```bash
npm run dev
```

2. Acesse a página de IA: `http://localhost:5173/ai`

3. Envie mensagens como:
   - "Olá, preciso de ajuda"
   - "Quanto custa uma troca de óleo?"
   - "Quero agendar uma revisão"

## 📊 Resultados Esperados

### ✅ Sucesso
- O Agno AI responde com mensagens contextualizadas
- As respostas são formatadas em Markdown
- O modo aparece como "production" (não "fallback")
- Não há erros no console

### ❌ Falha
Se você ver:
- `mode: "fallback"` - O Agno não está respondendo
- `mode: "demo"` - O Agno não está configurado
- Erros 404 - O endpoint ainda está incorreto
- Erros 500 - Problema no backend

## 🔧 Troubleshooting

### Problema: "Agno não configurado"
**Solução:** Configure as variáveis de ambiente:
```bash
# No arquivo .env do backend
AGNO_API_URL=https://matias-agno-assistant.onrender.com
AGNO_DEFAULT_AGENT_ID=oficinaia
```

### Problema: "404 Not Found"
**Solução:** Verifique se as correções foram aplicadas corretamente:
```bash
grep -n "/chat" ofix-backend/src/routes/agno.routes.js
```

Deve mostrar várias linhas com `${AGNO_API_URL}/chat`

### Problema: "Timeout"
**Solução:** O Agno pode estar em cold start (Render). Aguarde 30-60 segundos e tente novamente.

### Problema: "FormData is not defined"
**Solução:** Certifique-se de que a importação do FormData foi removida:
```bash
grep "import FormData" ofix-backend/src/routes/agno.routes.js
```

Não deve retornar nada.

## 📝 Checklist de Validação

- [ ] Backend iniciado sem erros
- [ ] Teste automatizado passou (4/4 testes)
- [ ] Chat público retorna resposta do Agno
- [ ] Chat inteligente processa NLP corretamente
- [ ] Frontend consegue enviar mensagens
- [ ] Respostas aparecem formatadas
- [ ] Não há erros no console do navegador
- [ ] Não há erros no console do backend

## 🎯 Próximos Passos

Após validar localmente:

1. **Commit das mudanças:**
```bash
git add ofix-backend/src/routes/agno.routes.js
git commit -m "fix: corrigir endpoint do Agno AI de /agents/oficinaia/runs para /chat"
```

2. **Deploy no Render:**
   - Faça push para o repositório
   - O Render vai fazer deploy automaticamente
   - Configure as variáveis de ambiente no painel do Render

3. **Testar em produção:**
```bash
curl https://seu-backend.onrender.com/api/agno/config
```

## 💡 Dicas

- O Agno AI pode demorar ~30s para responder na primeira requisição (cold start)
- Use `session_id` para manter contexto entre mensagens
- O `user_id` ajuda o Agno a personalizar respostas
- Monitore os logs do backend para debug: `console.log` mostra detalhes das requisições
