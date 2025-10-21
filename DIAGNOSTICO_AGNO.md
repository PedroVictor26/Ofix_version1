# 🔍 Diagnóstico da Conexão com Agno AI

## ✅ Configuração Encontrada

### Backend (.env)
```
AGNO_API_URL=https://matias-agno-assistant.onrender.com
AGNO_API_TOKEN=
AGNO_DEFAULT_AGENT_ID=oficinaia
```

### Status
- ✅ URL do Agno configurada
- ⚠️ Token vazio (pode ser opcional)
- ✅ Agent ID configurado: `oficinaia`

---

## 🎯 Problema Identificado

O Agno ESTÁ configurado, mas há 2 possíveis problemas:

### 1. Agno Pode Estar Offline
A URL `https://matias-agno-assistant.onrender.com` pode estar:
- Dormindo (Render free tier dorme após inatividade)
- Offline
- Com erro

### 2. Agno Não Está Usando os Dados NLP
Mesmo se estiver online, o Agno pode não estar configurado para usar os dados NLP que o frontend envia.

---

## 🧪 Testes para Fazer

### Teste 1: Verificar se o Agno Está Online

Execute este comando no terminal:

```bash
curl https://matias-agno-assistant.onrender.com/health
```

**Resultado esperado:**
- ✅ Status 200 = Agno está online
- ❌ Timeout/Erro = Agno está offline

### Teste 2: Testar Endpoint de Chat

```bash
curl -X POST https://matias-agno-assistant.onrender.com/agents/oficinaia/runs \
  -H "Content-Type: multipart/form-data" \
  -F "message=teste" \
  -F "stream=false" \
  -F "user_id=test"
```

**Resultado esperado:**
- ✅ Resposta JSON = Agno funcionando
- ❌ Erro = Agno com problema

### Teste 3: Verificar Configuração do Backend

Acesse no navegador:
```
https://ofix-backend-prod.onrender.com/agno/config
```

**Resultado esperado:**
```json
{
  "configured": true,
  "agno_url": "https://matias-agno-assistant.onrender.com",
  "has_token": false,
  "agent_id": "oficinaia",
  "status": "production"
}
```

---

## 🔧 Soluções

### Solução 1: Acordar o Agno (Se Estiver Dormindo)

O Render free tier coloca serviços para dormir após 15 minutos de inatividade.

**Como acordar:**
1. Acesse: https://matias-agno-assistant.onrender.com
2. Aguarde 30-60 segundos
3. Tente usar o chat novamente

**Ou via código:**
```javascript
// Adicionar no backend antes de chamar o Agno
async function wakeUpAgno() {
  try {
    await fetch('https://matias-agno-assistant.onrender.com/health', {
      method: 'GET',
      timeout: 30000 // 30 segundos
    });
    console.log('✅ Agno acordado');
  } catch (error) {
    console.log('⚠️ Agno pode estar dormindo, aguardando...');
  }
}
```

### Solução 2: Adicionar Token (Se Necessário)

Se o Agno exigir autenticação, adicione o token no `.env`:

```bash
AGNO_API_TOKEN=seu_token_aqui
```

### Solução 3: Configurar o Agno para Usar NLP

O Agno precisa ser configurado para ler os dados NLP. Adicione no prompt do sistema do Agno:

```
INSTRUÇÕES CRÍTICAS:

Você receberá dados NLP estruturados em cada mensagem.
SEMPRE verifique o campo "nlp.intencao" antes de responder.

REGRAS:
- SE intencao == "consulta_preco": Responda APENAS sobre preços
- SE intencao == "agendamento": Responda APENAS sobre agendamento
- NUNCA misture preço com agendamento
```

### Solução 4: Implementar Fallback Inteligente

Se o Agno estiver offline, o backend já tem um fallback, mas podemos melhorá-lo para usar os dados NLP:

```javascript
// No arquivo agno.routes.js
router.post('/chat-inteligente', async (req, res) => {
  const { message, nlp, usuario_id } = req.body;
  
  try {
    // Tentar acordar o Agno primeiro
    await wakeUpAgno();
    
    // Tentar conectar com Agno
    const agnoResponse = await callAgno(message, nlp, usuario_id);
    return res.json(agnoResponse);
    
  } catch (error) {
    console.log('⚠️ Agno indisponível, usando fallback com NLP');
    
    // Fallback inteligente usando NLP
    const fallbackResponse = generateFallbackResponse(message, nlp);
    return res.json(fallbackResponse);
  }
});

function generateFallbackResponse(message, nlp) {
  // Usar a intenção do NLP para gerar resposta apropriada
  switch (nlp?.intencao) {
    case 'consulta_preco':
      return {
        success: true,
        response: `💰 **Consulta de Preço**\n\nPara ${nlp.entidades.servico || 'o serviço'}:\n\n**Valores aproximados:**\n• Troca de óleo: R$ 80-120\n• Revisão: R$ 200-400\n• Alinhamento: R$ 60-100\n\n*💡 Para orçamento exato, entre em contato.*`,
        tipo: 'consulta_preco',
        mode: 'fallback'
      };
      
    case 'agendamento':
      return {
        success: true,
        response: `📅 **Agendamento**\n\nPara agendar ${nlp.entidades.servico || 'um serviço'}, preciso de:\n\n• Nome do cliente\n• Modelo do veículo\n• Data e horário preferidos\n\n*📞 Ou ligue: (11) 1234-5678*`,
        tipo: 'agendamento',
        mode: 'fallback'
      };
      
    default:
      return {
        success: true,
        response: `🤖 **Assistente OFIX**\n\nOlá! Como posso ajudar?\n\n**Posso auxiliar com:**\n• Consultas de preço\n• Agendamentos\n• Informações sobre serviços\n• Status de ordens de serviço`,
        tipo: 'ajuda',
        mode: 'fallback'
      };
  }
}
```

---

## 📊 Status Atual

### Frontend
- ✅ NLP funcionando perfeitamente
- ✅ Detectando intenções corretamente
- ✅ Enviando dados NLP ao backend

### Backend
- ✅ Configurado para conectar com Agno
- ✅ URL do Agno configurada
- ⚠️ Agno pode estar dormindo/offline
- ⚠️ Fallback não está usando dados NLP

### Agno AI
- ❓ Status desconhecido (precisa testar)
- ❓ Pode estar dormindo (Render free tier)
- ❓ Pode não estar usando dados NLP

---

## 🎯 Próximos Passos

### Passo 1: Verificar se Agno Está Online
```bash
curl https://matias-agno-assistant.onrender.com/health
```

### Passo 2: Se Estiver Offline
- Acessar o dashboard do Render
- Verificar logs do serviço Agno
- Acordar o serviço manualmente

### Passo 3: Se Estiver Online
- Verificar se está recebendo os dados NLP
- Configurar para usar os dados NLP
- Testar com diferentes intenções

### Passo 4: Melhorar Fallback
- Implementar fallback que usa dados NLP
- Adicionar função para acordar o Agno
- Adicionar retry logic

---

## 🔍 Como Verificar Agora

### No Console do Navegador

Quando você envia uma mensagem, verifique:

1. **Request enviada:**
```javascript
{
  message: "quanto custa a troca de óleo?",
  nlp: {
    intencao: "consulta_preco",
    entidades: { servico: "troca de óleo" }
  }
}
```

2. **Response recebida:**
```javascript
{
  success: true,
  response: "...",
  mode: "production" // ou "fallback" ou "demo"
}
```

3. **Se mode == "fallback":**
   - Agno está offline
   - Backend está usando resposta local

4. **Se mode == "production":**
   - Agno está online
   - Mas pode não estar usando NLP

---

## 💡 Recomendação Imediata

**Implementar fallback inteligente que usa NLP:**

Isso garante que mesmo se o Agno estiver offline, as respostas serão corretas baseadas na intenção detectada pelo NLP do frontend.

**Vantagens:**
- ✅ Respostas sempre corretas (baseadas em NLP)
- ✅ Funciona mesmo com Agno offline
- ✅ Experiência do usuário não é afetada
- ✅ Tempo para acordar o Agno

---

## 📞 Comandos Úteis

### Verificar Status do Agno
```bash
curl https://matias-agno-assistant.onrender.com/health
```

### Testar Chat do Agno
```bash
curl -X POST https://matias-agno-assistant.onrender.com/agents/oficinaia/runs \
  -F "message=teste" \
  -F "stream=false"
```

### Verificar Config do Backend
```bash
curl https://ofix-backend-prod.onrender.com/agno/config
```

### Ver Logs do Backend (se tiver acesso)
```bash
# No Render dashboard
# Services > ofix-backend > Logs
```

---

## ✅ Conclusão

**Problema identificado:**
1. Agno pode estar dormindo (Render free tier)
2. Agno pode não estar usando dados NLP
3. Fallback não está usando dados NLP

**Solução recomendada:**
1. Implementar fallback inteligente com NLP
2. Adicionar função para acordar o Agno
3. Configurar o Agno para usar dados NLP

**Prioridade:**
🔴 Alta - Implementar fallback com NLP (solução imediata)
🟡 Média - Acordar o Agno automaticamente
🟢 Baixa - Configurar o Agno para usar NLP (melhoria futura)

---

**Data:** 21/10/2025
**Status:** ⚠️ Agno pode estar offline
**Ação:** Implementar fallback inteligente com NLP
