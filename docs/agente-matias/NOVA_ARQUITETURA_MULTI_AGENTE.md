# 🚀 Nova Arquitetura Multi-Agente - OFIX

## 📊 Resumo da Otimização

**Data de Implementação:** Novembro 2025  
**Status:** ✅ Pronto para integração  
**Impacto Esperado:** 10x mais rápido em agendamentos

---

## 🎯 Problema Resolvido

### Antes (Problemático)
```
Todas mensagens → Agno AI (LLM) → Parse JSON → Validação → Ação
├─ Lento: 4-6s por agendamento
├─ Propenso a erros de parsing
└─ Difícil de debugar
```

### Depois (Otimizado)
```
Mensagem → Classifier inteligente
           ├─ Ação estruturada → Backend Local (500ms) ✅
           └─ Conversa complexa → Agno AI (4s) ✅
```

---

## 🏗️ Arquitetura

### 1. **Message Classifier** (`message-classifier.service.js`)
**Responsabilidade:** Decidir quem processa a mensagem

```javascript
classify("Agendar segunda 14h") 
// → { processor: 'BACKEND_LOCAL', subtype: 'AGENDAMENTO' }

classify("Meu carro está fazendo barulho") 
// → { processor: 'AGNO_AI', subtype: 'DIAGNOSTICO' }
```

**Padrões Detectados:**

**Backend Local (Rápido):**
- ✅ AGENDAMENTO - "agendar", "marcar", "segunda", "horário"
- ✅ CADASTRO_CLIENTE - "cadastrar cliente", "novo cliente"
- ✅ CONSULTA_OS - "status da os", "ordem 1234", "meu carro"
- ✅ CONSULTA_ESTOQUE - "tem peça", "disponível", "estoque"
- ✅ ESTATISTICAS - "quantos", "total", "relatório"

**Agno AI (Inteligente):**
- ✅ DIAGNOSTICO - "barulho", "problema", "defeito", "luz acendeu"
- ✅ DUVIDA_TECNICA - "o que é", "como funciona", "explica"
- ✅ ORCAMENTO - "quanto custa", "preço", "valor"
- ✅ RECOMENDACAO - "devo fazer", "quando trocar", "recomenda"

---

### 2. **Agendamento Local** (`agendamento-local.service.js`)
**Responsabilidade:** Criar agendamentos SEM usar AI

**Fluxo:**
```
1. Extrai entidades (NLP local com regex)
2. Valida dados (cliente, data, hora, serviço)
3. Se falta algo → Pergunta ao usuário
4. Se tudo OK → Cria no banco
5. Confirma com detalhes
```

**Exemplo de Uso:**
```javascript
// Mensagem completa
"Agendar revisão para João segunda 14h"
→ Entidades: { cliente: 'João', data: '11/11', hora: '14:00', servico: 'revisão' }
→ Cria agendamento
→ Tempo: ~500ms ✅

// Mensagem incompleta
"Quero agendar"
→ Entidades: { }
→ Pergunta: "Para qual cliente? Que dia? Que hora?"
→ Aguarda resposta
→ Mantém contexto
```

**Features:**
- ✅ Multi-step (guia usuário)
- ✅ Busca/cria cliente automaticamente
- ✅ Busca/cria veículo automaticamente
- ✅ Gera número de OS
- ✅ Contexto temporário (15min)
- ✅ Mensagens amigáveis

---

### 3. **Local Response** (`local-response.service.js`)
**Responsabilidade:** Respostas instantâneas sem AI

**Funcionalidades:**
- 👋 Saudações contextuais (bom dia/tarde/noite)
- ❓ Menu de ajuda completo
- ✅ Confirmações
- ❌ Erros amigáveis
- 💡 Dicas do dia
- 🎯 Sugestões contextuais

**Exemplo:**
```javascript
LocalResponse.gerarSaudacao()
// → "Boa tarde! 👋 Sou o Matias, assistente da oficina..."

LocalResponse.gerarMenuAjuda()
// → Menu completo com exemplos e comandos
```

---

## 🔌 Integração no Backend

### Passo 1: Importar Serviços
```javascript
// ofix-backend/src/routes/agno.routes.js
import MessageClassifier from '../services/message-classifier.service.js';
import AgendamentoLocal from '../services/agendamento-local.service.js';
import LocalResponse from '../services/local-response.service.js';
```

### Passo 2: Adicionar Roteamento
```javascript
router.post('/chat', async (req, res) => {
  const { message, usuario_id } = req.body;

  // 1. CLASSIFICA
  const classification = MessageClassifier.classify(message);
  console.log('📊 Classificação:', classification);

  // 2. ROTEIA
  let response;
  
  if (classification.processor === 'BACKEND_LOCAL') {
    // Processa localmente (rápido)
    response = await processarLocal(message, classification, usuario_id);
  } else {
    // Envia para Agno AI (inteligente)
    response = await chamarAgnoAI(message, usuario_id);
  }

  // 3. RETORNA
  res.json({ success: true, ...response });
});

async function processarLocal(message, classification, userId) {
  switch (classification.type) {
    case 'GREETING':
      return LocalResponse.formatarResposta(
        LocalResponse.gerarSaudacao()
      );
    
    case 'HELP':
      return LocalResponse.formatarResposta(
        LocalResponse.gerarMenuAjuda()
      );
    
    case 'ACTION':
      if (classification.subtype === 'AGENDAMENTO') {
        return await AgendamentoLocal.processar(message, userId);
      }
      // ... outros tipos de ação
      break;
  }
}
```

---

## 📈 Métricas Esperadas

### Performance
| Ação | Antes | Depois | Melhoria |
|------|-------|--------|----------|
| Agendamento completo | 4-6s | 500ms | **10x mais rápido** |
| Agendamento multi-step | 8-12s | 1.5s | **6x mais rápido** |
| Saudação | 3s | 50ms | **60x mais rápido** |
| Menu ajuda | 3s | 50ms | **60x mais rápido** |

### Confiabilidade
- Taxa de sucesso agendamentos: **70% → 95%** (+25%)
- Erros de parsing: **30% → 5%** (-83%)
- Timeout Agno: Irrelevante (ação local não depende)

### Custo
- Chamadas Agno AI: **-40%** (menos requisições desnecessárias)
- Uso de LLM: **-50%** (só para conversas complexas)

---

## 🧪 Testes Recomendados

### 1. Teste de Classificação
```javascript
// tests/classifier.test.js
const classifier = require('./services/message-classifier.service');

test('Detecta agendamento', () => {
  const result = classifier.classify('Agendar segunda 14h');
  expect(result.processor).toBe('BACKEND_LOCAL');
  expect(result.subtype).toBe('AGENDAMENTO');
});

test('Detecta diagnóstico', () => {
  const result = classifier.classify('Meu carro está com barulho');
  expect(result.processor).toBe('AGNO_AI');
  expect(result.subtype).toBe('DIAGNOSTICO');
});
```

### 2. Teste de Agendamento
```bash
# Via API
curl -X POST http://localhost:3001/api/agno/chat \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"message": "Agendar revisão João segunda 14h"}'

# Deve retornar em < 1s com agendamento criado
```

### 3. Teste Multi-Step
```javascript
// 1ª mensagem
POST /api/agno/chat
{ "message": "Quero agendar" }
// → Deve perguntar dados faltantes

// 2ª mensagem
POST /api/agno/chat
{ "message": "João, segunda 14h, revisão" }
// → Deve completar e criar agendamento
```

---

## 🚦 Checklist de Implementação

### Fase 1: Preparação ✅
- [x] Criar `message-classifier.service.js`
- [x] Criar `agendamento-local.service.js`
- [x] Criar `local-response.service.js`
- [x] Atualizar `copilot-instructions.md`

### Fase 2: Integração (PRÓXIMO PASSO)
- [ ] Importar serviços em `agno.routes.js`
- [ ] Adicionar roteamento no `/chat` endpoint
- [ ] Testar classificador com mensagens reais
- [ ] Ajustar keywords se necessário

### Fase 3: Testes
- [ ] Teste de unidade (classificador)
- [ ] Teste de integração (agendamento local)
- [ ] Teste E2E (fluxo completo)
- [ ] Testar com dados reais de produção

### Fase 4: Deploy
- [ ] Deploy backend com feature flag
- [ ] Monitorar logs em produção
- [ ] Ajustar baseado em uso real
- [ ] Liberar 100%

---

## 🛠️ Comandos Úteis

```bash
# Testar classificador isoladamente
node -e "const c = require('./src/services/message-classifier.service.js'); \
         console.log(c.default.classify('agendar segunda'));"

# Ver estatísticas do classificador
node -e "const c = require('./src/services/message-classifier.service.js'); \
         console.log(c.default.getStats());"

# Rodar testes
npm test -- classifier
npm test -- agendamento-local

# Ver logs em tempo real
tail -f logs/backend.log | grep CLASSIFIER
```

---

## 🆘 Troubleshooting

### Classificador errando muito
**Sintoma:** Mensagens sendo enviadas para processador errado  
**Solução:** 
1. Adicione mais keywords específicas
2. Use logs reais para testar
3. Ajuste confidence scores

### Agendamento falhando
**Sintoma:** Erro ao criar no banco  
**Solução:**
1. Verifique schema Prisma (campos obrigatórios)
2. Confira se `oficinaId` existe
3. Adicione mais validações

### Contexto não mantido
**Sintoma:** Usuário precisa repetir informações  
**Solução:**
1. Verifique se `contextosAtivos` Map está funcionando
2. Aumente `TEMPO_EXPIRACAO` se necessário
3. Considere persistir em Redis para produção

---

## 📚 Referências

- **Plano completo:** `plano_otimizacao/multi_agent_architecture.md`
- **Checklist:** `plano_otimizacao/implementation_checklist.md`
- **Código exemplo:** `plano_otimizacao/practical_implementation.js`
- **Comparativo visual:** `plano_otimizacao/visual_comparison.tsx`
- **Docs Matias:** `docs/agente-matias/DOCUMENTACAO_COMPLETA_AGENTE_MATIAS.md`

---

## 🎉 Próximos Passos

1. **AGORA:** Integrar na rota `/chat` (veja exemplo acima)
2. **DEPOIS:** Testar com mensagens reais
3. **ENTÃO:** Deploy gradual (10% → 50% → 100%)
4. **SEMPRE:** Monitorar métricas e ajustar

**Dúvidas?** Consulte o plano completo ou peça ajuda no desenvolvimento!
