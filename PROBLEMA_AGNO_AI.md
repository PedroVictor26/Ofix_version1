# ⚠️ Problema: Agno AI Não Está Usando os Dados NLP

## 🔍 Situação Atual

### O Que Está Acontecendo

1. **Frontend:** ✅ Funcionando perfeitamente
   - Detecta intenção: `consulta_preco`
   - Extrai entidade: `troca de óleo`
   - Envia dados NLP ao backend

2. **Backend:** ✅ Recebendo os dados
   - Endpoint `/agno/chat-inteligente` recebe os dados NLP
   - Passa para o Agno AI

3. **Agno AI:** ❌ Ignorando os dados NLP
   - Recebe `nlp.intencao = "consulta_preco"`
   - Mas responde sobre AGENDAMENTO
   - Está usando lógica antiga

---

## 📊 Evidência do Problema

### Logs do Console

```javascript
[INFO] Mensagem enriquecida com NLP
{
  intencao: "consulta_preco",      // ✅ Correto
  confianca: 0.192,                 // ✅ Correto
  entidades: ['servico']            // ✅ Correto
}
```

### Mensagem do Usuário
```
"quanto custa a troca de oleo?"
```

### Resposta do Agno AI (INCORRETA)
```
📋 **Vamos fazer seu agendamento!**

💡 **Me informe os seguintes dados:**
• Cliente: Nome do cliente
• Veículo: Modelo ou placa
• Serviço: Tipo de manutenção
...
```

### Resposta Esperada (CORRETA)
```
💰 **Consulta de Preço - Troca de Óleo**

Para fornecer um orçamento preciso, preciso de:
• Modelo do veículo
• Tipo de óleo (mineral, sintético, semi-sintético)

Os valores variam entre R$ 80 a R$ 250.
```

---

## 🎯 Causa Raiz

O Agno AI está recebendo os dados NLP, mas **não está configurado para usá-los**.

Possíveis causas:

1. **Prompt do Sistema não atualizado**
   - O Agno AI não tem instruções para usar os dados NLP
   - Está usando lógica antiga de processamento

2. **Agno AI não está lendo o campo `nlp`**
   - Pode estar processando apenas o campo `message`
   - Ignorando `nlp.intencao` e `nlp.entidades`

3. **Configuração do Agno AI**
   - Pode precisar de atualização na configuração
   - Pode precisar de novo treinamento

---

## 🔧 Soluções Possíveis

### Solução 1: Atualizar o Prompt do Sistema do Agno AI

Adicione estas instruções ao prompt do sistema do Agno AI:

```
INSTRUÇÕES CRÍTICAS SOBRE NLP:

Você SEMPRE receberá dados NLP estruturados junto com cada mensagem.
Estes dados contêm a análise da intenção do usuário.

REGRAS OBRIGATÓRIAS:

1. SEMPRE verifique o campo "nlp.intencao" ANTES de responder
2. A intenção indica O QUE o usuário quer:
   - "consulta_preco" = Usuário quer saber PREÇO
   - "agendamento" = Usuário quer AGENDAR
   - "consulta_estoque" = Usuário quer saber DISPONIBILIDADE
   - "consulta_cliente" = Usuário quer DADOS DE CLIENTE

3. NUNCA responda sobre agendamento quando intencao == "consulta_preco"
4. NUNCA responda sobre preço quando intencao == "agendamento"
5. USE as entidades extraídas (nlp.entidades) na sua resposta

EXEMPLO:
Se nlp.intencao == "consulta_preco" e nlp.entidades.servico == "troca de óleo":
→ Responda sobre o PREÇO da troca de óleo
→ NÃO fale sobre agendamento
```

### Solução 2: Adicionar Lógica de Roteamento no Backend

Se o Agno AI não conseguir usar os dados NLP diretamente, adicione lógica de roteamento no backend:

```javascript
app.post('/agno/chat-inteligente', async (req, res) => {
  const { message, nlp, usuario_id } = req.body;
  
  // Se a intenção for clara (confiança > 0.5), rotear diretamente
  if (nlp?.confianca > 0.5) {
    switch (nlp.intencao) {
      case 'consulta_preco':
        // Adicionar contexto ao prompt do Agno
        const promptPreco = `O usuário está perguntando sobre PREÇO de ${nlp.entidades.servico || 'um serviço'}. Responda APENAS sobre valores e orçamento. NÃO fale sobre agendamento.`;
        return await agnoAI.chat(message, promptPreco, usuario_id);
        
      case 'agendamento':
        const promptAgendamento = `O usuário quer AGENDAR ${nlp.entidades.servico || 'um serviço'}. Responda APENAS sobre agendamento. NÃO fale sobre preços.`;
        return await agnoAI.chat(message, promptAgendamento, usuario_id);
        
      // ... outros casos
    }
  }
  
  // Fallback: processar normalmente
  return await agnoAI.chat(message, null, usuario_id);
});
```

### Solução 3: Enriquecer a Mensagem com Contexto

Adicione o contexto NLP diretamente na mensagem enviada ao Agno:

```javascript
app.post('/agno/chat-inteligente', async (req, res) => {
  const { message, nlp, usuario_id } = req.body;
  
  // Criar mensagem enriquecida
  let mensagemEnriquecida = message;
  
  if (nlp?.intencao) {
    mensagemEnriquecida = `[INTENÇÃO: ${nlp.intencao}] ${message}`;
    
    if (nlp.entidades && Object.keys(nlp.entidades).length > 0) {
      mensagemEnriquecida += ` [ENTIDADES: ${JSON.stringify(nlp.entidades)}]`;
    }
  }
  
  return await agnoAI.chat(mensagemEnriquecida, usuario_id);
});
```

---

## 🧪 Como Testar a Solução

### Teste 1: Consulta de Preço
```
1. Digite: "quanto custa a troca de óleo?"
2. Verifique o log: intencao = "consulta_preco"
3. Resposta esperada: Informações sobre PREÇO
4. Resposta incorreta: Instruções de agendamento
```

### Teste 2: Agendamento
```
1. Digite: "quero agendar uma revisão"
2. Verifique o log: intencao = "agendamento"
3. Resposta esperada: Instruções de agendamento
4. Resposta incorreta: Informações sobre preço
```

### Teste 3: Consulta de Estoque
```
1. Digite: "tem filtro em estoque?"
2. Verifique o log: intencao = "consulta_estoque"
3. Resposta esperada: Informações sobre estoque
4. Resposta incorreta: Qualquer outra coisa
```

---

## 📋 Checklist de Diagnóstico

Para identificar onde está o problema:

### Backend
- [ ] O endpoint `/agno/chat-inteligente` está recebendo `req.body.nlp`?
- [ ] Os dados NLP estão sendo passados para o Agno AI?
- [ ] Há logs mostrando os dados NLP recebidos?

### Agno AI
- [ ] O Agno AI tem acesso aos dados NLP?
- [ ] O prompt do sistema menciona os dados NLP?
- [ ] O Agno AI está configurado para usar dados estruturados?

### Teste
- [ ] Execute: `node teste-nlp-simples.js` (deve passar 9/9)
- [ ] Verifique os logs no console do navegador
- [ ] Verifique os logs no backend

---

## 🎯 Próximos Passos

1. **Verificar o Backend**
   - Adicione logs para ver se os dados NLP estão chegando
   - Verifique como o Agno AI está sendo chamado

2. **Atualizar o Prompt do Agno AI**
   - Adicione as instruções sobre NLP
   - Teste com diferentes intenções

3. **Implementar Roteamento (se necessário)**
   - Se o Agno AI não conseguir usar NLP diretamente
   - Adicione lógica de roteamento no backend

4. **Testar Novamente**
   - Teste cada tipo de intenção
   - Verifique se as respostas estão corretas

---

## 📞 Onde Procurar

### Arquivos do Backend
```
backend/
├── routes/
│   └── agno.js              ← Endpoint /agno/chat-inteligente
├── services/
│   └── agnoAI.js            ← Configuração do Agno AI
└── config/
    └── agno-prompt.txt      ← Prompt do sistema
```

### O Que Procurar
1. Como o endpoint `/agno/chat-inteligente` está implementado
2. Como os dados NLP são passados para o Agno AI
3. Qual é o prompt do sistema do Agno AI
4. Se há alguma lógica de roteamento

---

## 💡 Dica Importante

O NLP no frontend está funcionando perfeitamente! O problema é apenas que o Agno AI precisa ser configurado para usar esses dados.

É como se você estivesse enviando um pacote com etiqueta (NLP), mas o destinatário (Agno AI) não está lendo a etiqueta e está tentando adivinhar o conteúdo.

---

## 📚 Documentação de Referência

- **[INSTRUCOES_AGNO_AI.md](INSTRUCOES_AGNO_AI.md)** - Instruções completas para o Agno AI
- **[MELHORIAS_NLP_IMPLEMENTADAS.md](MELHORIAS_NLP_IMPLEMENTADAS.md)** - Documentação técnica do NLP
- **[README_NLP.md](README_NLP.md)** - Visão geral do sistema

---

**Status:** ⚠️ Problema identificado  
**Causa:** Agno AI não está usando os dados NLP  
**Solução:** Atualizar configuração do Agno AI  
**Prioridade:** 🔴 Alta
