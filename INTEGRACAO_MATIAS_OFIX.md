# Integração Completa: OFIX Backend + Agente Matias

## 📋 Resumo da Arquitetura Atual

### Sistema Existente Identificado:
1. **OFIX Backend** (Node.js + Express + PostgreSQL)
   - URL: https://ofix-backend-prod.onrender.com
   - Endpoints de integração já implementados (/agno/*)
   - Status: ✅ Online e funcional

2. **Agente Matias** (Python + FastAPI + agno framework)
   - URL: https://matias-agno-assistant.onrender.com
   - Framework: agno 2.0.11 + Groq LLaMA 3.1 + LanceDB
   - Base de conhecimento: Extensiva documentação automotiva
   - Status: ✅ Online e funcional

## 🔗 Estratégia de Integração

### Cenário 1: OFIX Frontend → Backend → Agente Matias (RECOMENDADO)
```
Cliente Frontend → OFIX Backend → Matias Agent → Resposta
```

**Vantagens:**
- Controle centralizado no backend OFIX
- Logs e auditoria unificados
- Possibilidade de cache e otimizações
- Segurança e autenticação centralizadas

### Cenário 2: OFIX Frontend → Agente Matias Direto
```
Cliente Frontend → Matias Agent → Resposta
```

**Vantagens:**
- Menor latência
- Menos pontos de falha
- Implementação mais simples

## 🛠️ Implementação Recomendada (Cenário 1)

### 1. Atualizar Endpoint no OFIX Backend

```javascript
// Adicionar no OFIX Backend (arquivo de rotas agno)
app.post('/agno/chat-matias', async (req, res) => {
  try {
    const { message, user_id } = req.body;
    
    // Chamar o agente Matias
    const response = await fetch('https://matias-agno-assistant.onrender.com/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ message })
    });
    
    if (!response.ok) {
      throw new Error(`Erro do agente: ${response.status}`);
    }
    
    const agentData = await response.json();
    
    // Salvar conversa no banco OFIX (opcional)
    if (user_id) {
      await pool.query(
        'INSERT INTO conversations (user_id, message, response, agent_type, created_at) VALUES ($1, $2, $3, $4, NOW())',
        [user_id, message, agentData.response, 'matias']
      );
    }
    
    res.json({
      success: true,
      response: agentData.response,
      agent: 'matias',
      model: agentData.model || 'agno-groq-lancedb'
    });
    
  } catch (error) {
    console.error('Erro na integração Matias:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor',
      message: 'Não foi possível processar sua solicitação'
    });
  }
});
```

### 2. Atualizar Frontend OFIX

```javascript
// Função para chat com Matias via backend OFIX
async function chatWithMatias(message, userId = null) {
  try {
    const response = await fetch('/api/agno/chat-matias', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        message, 
        user_id: userId 
      })
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (data.success) {
      return {
        success: true,
        response: data.response,
        agent: data.agent,
        model: data.model
      };
    } else {
      throw new Error(data.message || 'Erro desconhecido');
    }
    
  } catch (error) {
    console.error('Erro no chat:', error);
    return {
      success: false,
      error: error.message,
      response: 'Desculpe, não foi possível processar sua mensagem. Tente novamente.'
    };
  }
}

// Exemplo de uso no componente React
const handleMatiasChat = async (userMessage) => {
  setIsLoading(true);
  
  const result = await chatWithMatias(userMessage, currentUser?.id);
  
  if (result.success) {
    // Adicionar mensagens ao chat
    setMessages(prev => [
      ...prev,
      { type: 'user', content: userMessage },
      { type: 'agent', content: result.response, agent: 'matias' }
    ]);
  } else {
    // Mostrar erro
    setMessages(prev => [
      ...prev,
      { type: 'user', content: userMessage },
      { type: 'error', content: result.response }
    ]);
  }
  
  setIsLoading(false);
};
```

## 🎯 Base de Conhecimento Identificada

O agente Matias já possui uma base de conhecimento extensa:

### Arquivos de Conhecimento Encontrados:
- `sistema_motor.md` - Manutenção preventiva, problemas comuns
- `sistema_eletrico.md` - Diagnósticos elétricos
- `sistema_suspensao.md` - Suspensão e amortecedores
- `servicos.md` - Tabela de preços de serviços
- `precos_servicos.md` - Orçamentos detalhados
- `diagnosticos_barulhos.md` - Diagnóstico de ruídos
- `procedimentos_frenagem.md` - Sistema de freios
- `revisoes_periodicas.md` - Manutenção programada
- `pneus_rodas.md` - Pneus e rodas
- `dados_alinhamento_gol.md` - Especificações técnicas

### Exemplos de Conhecimento:
- **Troca de óleo**: R$ 120,00 (até 4L óleo semi-sintético)
- **Alinhamento**: R$ 80,00
- **Pastilhas de freio**: A partir de R$ 90,00/eixo
- **Diagnósticos**: Barulhos metálicos (crítico), assobios (médio)

## 🚀 Próximos Passos

### Implementação Imediata:
1. ✅ Sistema já implantado (ambos funcionando)
2. 🔄 Adicionar endpoint de integração no backend OFIX
3. 🔄 Atualizar frontend para usar integração
4. 🔄 Testar comunicação completa

### Melhorias Futuras:
1. **Cache de respostas** para otimização
2. **Fallback** para quando Matias estiver indisponível
3. **Análise de sentimento** das conversas
4. **Métricas de satisfação** do cliente
5. **Integração com agenda** para agendamentos automáticos

## 🔧 Configuração de Ambiente

### Variáveis necessárias no OFIX Backend:
```env
MATIAS_AGENT_URL=https://matias-agno-assistant.onrender.com
MATIAS_TIMEOUT=30000
ENABLE_CONVERSATION_LOG=true
```

### Headers recomendados:
```javascript
const headers = {
  'Content-Type': 'application/json',
  'User-Agent': 'OFIX-Backend/1.0',
  'X-Request-Source': 'ofix-integration'
};
```

## 📊 Monitoramento

### Endpoints de Status:
- **OFIX Backend**: `/health` → Status do backend
- **Matias Agent**: `/status` → Status do agente
- **Integração**: `/agno/status` → Status da integração

### Logs importantes:
- Tempo de resposta do agente
- Taxa de sucesso/erro
- Mensagens mais frequentes
- Horários de maior uso

## ✅ Checklist de Implementação

- [ ] Adicionar endpoint `/agno/chat-matias` no backend
- [ ] Configurar variáveis de ambiente
- [ ] Atualizar frontend para usar novo endpoint
- [ ] Implementar tratamento de erros
- [ ] Adicionar logs de auditoria
- [ ] Testar integração completa
- [ ] Documentar APIs
- [ ] Configurar monitoramento
- [ ] Treinar equipe
- [ ] Lançar para produção

---

**Status Atual**: Ambos os sistemas estão funcionando independentemente. A integração é apenas uma questão de conectá-los via API calls.

**Estimativa**: 2-4 horas para implementação completa da integração.