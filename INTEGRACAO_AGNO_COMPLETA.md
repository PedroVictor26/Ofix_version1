# 🤖 Integração Completa com Agno AI

## 🎯 Nova Abordagem

Você tem razão! Se o Agno tem um banco de dados com informações sobre preços, serviços, etc., faz muito mais sentido **chamar o Agno de verdade**.

### O Que Foi Implementado

1. ✅ Backend tenta chamar o Agno AI primeiro
2. ✅ Passa os dados NLP do frontend para o Agno
3. ✅ Se Agno falhar, usa fallback local
4. ✅ Retorna metadados indicando se usou Agno ou fallback

---

## 🔄 Fluxo Completo

```
1. Usuário: "quanto custa a troca de óleo?"
   ↓
2. Frontend: Detecta "consulta_preco" + entidade "troca de óleo"
   ↓
3. Backend: Recebe NLP do frontend
   ↓
4. Backend: Tenta chamar Agno AI
   ├─ ✅ Agno online → Usa resposta do Agno
   └─ ❌ Agno offline → Usa fallback local
   ↓
5. Usuário: Recebe resposta (do Agno ou fallback)
```

---

## 💻 Implementação

### 1. Função para Chamar Agno

```javascript
async function chamarAgnoAI(message, usuario_id, intencao, nlp) {
    // Preparar contexto rico para o Agno
    const contexto = {
        intencao: intencao,
        entidades: nlp?.entidades || {},
        confianca: nlp?.confianca || 0,
        periodo: nlp?.periodo || null
    };
    
    const formData = new FormData();
    formData.append('message', message);
    formData.append('stream', 'false');
    formData.append('user_id', usuario_id || 'anonymous');
    formData.append('context', JSON.stringify(contexto));
    
    const agnoResponse = await fetch(`${AGNO_API_URL}/agents/oficinaia/runs`, {
        method: 'POST',
        headers: {
            ...formData.getHeaders(),
            ...(AGNO_API_TOKEN && { 'Authorization': `Bearer ${AGNO_API_TOKEN}` })
        },
        body: formData,
        timeout: 15000
    });
    
    if (!agnoResponse.ok) {
        throw new Error(`Agno retornou status ${agnoResponse.status}`);
    }
    
    const agnoData = await agnoResponse.json();
    
    return {
        success: true,
        response: agnoData.content || agnoData.response,
        tipo: intencao.toLowerCase(),
        mode: 'production',
        agno_configured: true,
        metadata: {
            intencao_detectada: intencao,
            agno_response: true,
            entidades: nlp?.entidades
        }
    };
}
```

### 2. Lógica de Roteamento

```javascript
// Para consultas de preço e ajuda, tentar chamar Agno primeiro
if ((intencao === 'CONSULTA_PRECO' || intencao === 'AJUDA') && AGNO_API_URL) {
    try {
        console.log('🤖 Chamando Agno AI para', intencao);
        response = await chamarAgnoAI(message, usuario_id, intencao, nlp);
    } catch (agnoError) {
        console.error('⚠️ Agno falhou, usando fallback');
        // Fallback para resposta local
        response = gerarRespostaLocal(intencao, nlp);
        response.mode = 'fallback';
        response.agno_error = agnoError.message;
    }
} else {
    // Processar localmente para outras intenções
    response = processarLocalmente(intencao, message, nlp, usuario_id);
}
```

---

## 📊 Metadados Retornados

### Quando Agno Responde
```json
{
  "success": true,
  "response": "Resposta do Agno sobre preços...",
  "tipo": "consulta_preco",
  "mode": "production",
  "agno_configured": true,
  "metadata": {
    "intencao_detectada": "CONSULTA_PRECO",
    "agno_response": true,
    "entidades": {
      "servico": "troca de óleo"
    }
  }
}
```

### Quando Agno Falha (Fallback)
```json
{
  "success": true,
  "response": "Resposta local sobre preços...",
  "tipo": "consulta_preco",
  "mode": "fallback",
  "agno_configured": true,
  "agno_error": "Connection timeout",
  "metadata": {
    "intencao_detectada": "CONSULTA_PRECO",
    "servico": "troca de óleo"
  }
}
```

### Quando Agno Não Configurado
```json
{
  "success": true,
  "response": "Resposta local...",
  "tipo": "consulta_preco",
  "mode": "local",
  "agno_configured": false,
  "metadata": {
    "intencao_detectada": "CONSULTA_PRECO"
  }
}
```

---

## 🎯 Vantagens

### 1. Melhor Uso do Agno
- ✅ Agno tem acesso ao banco de dados
- ✅ Agno pode dar respostas mais precisas
- ✅ Agno pode aprender com o tempo

### 2. Resiliência
- ✅ Se Agno falhar, usa fallback
- ✅ Usuário sempre recebe resposta
- ✅ Logs indicam se usou Agno ou fallback

### 3. Contexto Rico
- ✅ Agno recebe a intenção detectada
- ✅ Agno recebe as entidades extraídas
- ✅ Agno recebe a confiança da classificação

---

## 🧪 Como Testar

### Teste 1: Agno Online
1. Certifique-se que Agno está online
2. Digite: "quanto custa a troca de óleo?"
3. Verifique no console do navegador:
   ```
   mode: "production"
   agno_configured: true
   ```

### Teste 2: Agno Offline
1. Desligue o Agno (ou espere ele dormir)
2. Digite: "quanto custa a troca de óleo?"
3. Verifique no console:
   ```
   mode: "fallback"
   agno_error: "Connection timeout"
   ```

### Teste 3: Agno Não Configurado
1. Remova AGNO_API_URL do .env
2. Digite: "quanto custa a troca de óleo?"
3. Verifique no console:
   ```
   mode: "local"
   agno_configured: false
   ```

---

## 📋 Checklist de Implementação

- [x] Função `chamarAgnoAI()` criada
- [x] Lógica de roteamento atualizada
- [x] Fallback implementado
- [x] Metadados adicionados
- [x] Logs informativos
- [ ] Deploy no Render
- [ ] Teste em produção

---

## 🔧 Configuração do Agno

Para o Agno usar os dados NLP corretamente, adicione no prompt do sistema:

```
INSTRUÇÕES CRÍTICAS:

Você receberá um campo "context" com análise NLP:
{
  "intencao": "CONSULTA_PRECO",
  "entidades": {
    "servico": "troca de óleo"
  },
  "confianca": 0.85
}

REGRAS:
- SE intencao == "CONSULTA_PRECO": Consulte preços no banco de dados
- USE as entidades para buscar informações específicas
- Forneça respostas baseadas em dados reais, não genéricas
```

---

## 🎯 Próximos Passos

### 1. Deploy
Fazer commit e push para o Render fazer deploy.

### 2. Testar
Testar com Agno online e offline.

### 3. Configurar Agno
Adicionar instruções no prompt do Agno para usar o contexto NLP.

### 4. Monitorar
Verificar logs para ver quantas vezes usa Agno vs fallback.

---

## 💡 Benefícios Finais

### Para o Usuário
- ✅ Respostas mais precisas (do banco de dados do Agno)
- ✅ Sempre recebe resposta (fallback se Agno falhar)
- ✅ Experiência consistente

### Para o Sistema
- ✅ Usa o melhor de ambos (NLP frontend + Agno backend)
- ✅ Resiliente a falhas
- ✅ Fácil de debugar (metadados claros)

### Para Desenvolvimento
- ✅ Fácil adicionar novas intenções
- ✅ Fácil melhorar fallbacks
- ✅ Fácil monitorar uso do Agno

---

**Status:** ✅ Implementado
**Próximo passo:** Deploy e teste
**Prioridade:** 🔴 Alta
