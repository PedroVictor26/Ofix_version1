# 🤖 Instruções para o Agno AI - Como Usar os Dados NLP

## 📋 Contexto

O frontend agora envia análise NLP estruturada junto com cada mensagem. O Agno AI deve usar essa análise para gerar respostas mais precisas.

---

## 📨 Dados Recebidos

Quando o usuário envia uma mensagem, o Agno AI recebe:

```json
{
  "message": "quanto custa a troca de óleo?",
  "usuario_id": "123",
  "contexto_conversa": [...],
  "nlp": {
    "intencao": "consulta_preco",
    "confianca": 0.85,
    "entidades": {
      "servico": "troca de óleo"
    },
    "periodo": null,
    "alternativas": []
  },
  "contextoNLP": {
    "tipo": "consulta_preco",
    "acao": "buscar_preco"
  }
}
```

---

## 🎯 Como Interpretar

### Campo `nlp.intencao`

Este campo indica O QUE o usuário quer fazer:

| Intenção | Significado | Exemplo |
|----------|-------------|---------|
| `consulta_preco` | Usuário quer saber PREÇO | "quanto custa?" |
| `agendamento` | Usuário quer AGENDAR | "quero agendar" |
| `consulta_estoque` | Usuário quer saber DISPONIBILIDADE | "tem em estoque?" |
| `consulta_cliente` | Usuário quer DADOS DE CLIENTE | "buscar cliente" |
| `consulta_os` | Usuário quer STATUS DE OS | "status da OS" |
| `saudacao` | Usuário está CUMPRIMENTANDO | "oi", "olá" |
| `ajuda` | Usuário precisa de AJUDA | "me ajuda" |

### Campo `nlp.entidades`

Este campo contém informações extraídas da mensagem:

```json
{
  "servico": "troca de óleo",      // Serviço mencionado
  "placa": "ABC-1234",              // Placa do veículo
  "cpf": "12345678900",             // CPF do cliente
  "telefone": "11987654321",        // Telefone
  "numeroOS": "123",                // Número da OS
  "dataRelativa": "amanhã",         // Data mencionada
  "horario": "14:00",               // Horário
  "nome": "João Silva",             // Nome de pessoa
  "veiculo": "Gol"                  // Modelo do veículo
}
```

### Campo `nlp.confianca`

Indica a certeza da classificação (0 a 1):
- `> 0.7` = Alta confiança
- `0.3 - 0.7` = Média confiança
- `< 0.3` = Baixa confiança (pode estar errado)

---

## ✅ Regras de Resposta

### Regra 1: SEMPRE Verificar a Intenção Primeiro

```
SE nlp.intencao == "consulta_preco":
  → Responder sobre PREÇO
  → NÃO falar sobre agendamento
  
SE nlp.intencao == "agendamento":
  → Responder sobre AGENDAMENTO
  → NÃO falar sobre preço
```

### Regra 2: Usar as Entidades Extraídas

```
SE nlp.intencao == "consulta_preco" E nlp.entidades.servico existe:
  → Mencionar o serviço específico na resposta
  → Exemplo: "Para saber o valor da troca de óleo..."
```

### Regra 3: Considerar a Confiança

```
SE nlp.confianca < 0.3:
  → Pedir esclarecimento ao usuário
  → Exemplo: "Não entendi bem. Você quer saber o preço ou agendar?"
```

---

## 📝 Exemplos de Respostas Corretas

### Exemplo 1: Consulta de Preço

**Input:**
```json
{
  "message": "quanto custa a troca de óleo?",
  "nlp": {
    "intencao": "consulta_preco",
    "confianca": 0.85,
    "entidades": {
      "servico": "troca de óleo"
    }
  }
}
```

**Resposta CORRETA:**
```
💰 **Consulta de Preço - Troca de Óleo**

Para fornecer um orçamento preciso, preciso de algumas informações:

• Qual é o modelo do veículo?
• Qual tipo de óleo prefere? (mineral, sintético, semi-sintético)

Os valores variam entre R$ 80 a R$ 250 dependendo do veículo e tipo de óleo.
```

**Resposta INCORRETA (NÃO FAZER):**
```
📋 Vamos fazer seu agendamento!  ❌
```

### Exemplo 2: Agendamento

**Input:**
```json
{
  "message": "quero agendar uma revisão",
  "nlp": {
    "intencao": "agendamento",
    "confianca": 0.92,
    "entidades": {
      "servico": "revisão"
    }
  }
}
```

**Resposta CORRETA:**
```
📅 **Agendamento de Revisão**

Ótimo! Para agendar sua revisão, preciso de:

• Nome do cliente
• Modelo do veículo ou placa
• Dia preferido (segunda, terça, etc)
• Horário preferido

Qual dia e horário prefere?
```

### Exemplo 3: Consulta de Estoque

**Input:**
```json
{
  "message": "tem filtro de óleo em estoque?",
  "nlp": {
    "intencao": "consulta_estoque",
    "confianca": 0.78,
    "entidades": {
      "servico": "filtro"
    }
  }
}
```

**Resposta CORRETA:**
```
📦 **Consulta de Estoque - Filtro de Óleo**

Para verificar a disponibilidade, preciso saber:

• Qual é o modelo do veículo?
• Ou qual marca/código do filtro?

Temos diversos filtros em estoque para diferentes modelos.
```

---

## ❌ Erros Comuns a Evitar

### Erro 1: Ignorar a Intenção
```
❌ Usuário pergunta sobre PREÇO
❌ Agno responde sobre AGENDAMENTO
```

**Solução:** Sempre verificar `nlp.intencao` primeiro!

### Erro 2: Não Usar as Entidades
```
❌ Usuário menciona "troca de óleo"
❌ Agno responde genericamente sem mencionar o serviço
```

**Solução:** Usar `nlp.entidades.servico` na resposta!

### Erro 3: Ignorar Baixa Confiança
```
❌ nlp.confianca = 0.15 (muito baixo)
❌ Agno assume que entendeu e responde
```

**Solução:** Pedir esclarecimento quando confiança < 0.3!

---

## 🔄 Fluxo de Decisão

```
1. Receber mensagem com dados NLP
   ↓
2. Verificar nlp.confianca
   ↓
   SE confianca < 0.3:
     → Pedir esclarecimento
     → FIM
   ↓
3. Verificar nlp.intencao
   ↓
   SWITCH (nlp.intencao):
     CASE "consulta_preco":
       → Responder sobre PREÇO
       → Usar nlp.entidades.servico se disponível
       
     CASE "agendamento":
       → Responder sobre AGENDAMENTO
       → Usar nlp.entidades (servico, data, horario)
       
     CASE "consulta_estoque":
       → Responder sobre ESTOQUE
       → Usar nlp.entidades.servico
       
     CASE "consulta_cliente":
       → Responder sobre CLIENTE
       → Usar nlp.entidades (nome, cpf, telefone)
       
     CASE "saudacao":
       → Responder cumprimento
       
     CASE "ajuda":
       → Listar funcionalidades
       
     DEFAULT:
       → Processar normalmente
```

---

## 🎯 Checklist de Validação

Antes de enviar uma resposta, o Agno AI deve verificar:

- [ ] Verifiquei o campo `nlp.intencao`?
- [ ] Minha resposta está alinhada com a intenção?
- [ ] Usei as entidades extraídas (`nlp.entidades`)?
- [ ] Considerei a confiança (`nlp.confianca`)?
- [ ] Se a intenção é "consulta_preco", estou falando sobre PREÇO?
- [ ] Se a intenção é "agendamento", estou falando sobre AGENDAMENTO?

---

## 📊 Prioridade de Informações

Ordem de prioridade ao processar a mensagem:

1. **nlp.intencao** (MAIS IMPORTANTE)
2. **nlp.entidades** (IMPORTANTE)
3. **nlp.confianca** (IMPORTANTE)
4. **message** (texto original)
5. **contexto_conversa** (histórico)

---

## 🚀 Implementação Recomendada

### No Prompt do Agno AI

Adicione estas instruções ao prompt do sistema:

```
Você é o Assistente Matias do OFIX. Ao receber uma mensagem, você SEMPRE receberá dados NLP estruturados.

REGRAS OBRIGATÓRIAS:

1. SEMPRE verifique o campo "nlp.intencao" ANTES de responder
2. SE intencao == "consulta_preco": Responda APENAS sobre preços
3. SE intencao == "agendamento": Responda APENAS sobre agendamento
4. SE intencao == "consulta_estoque": Responda APENAS sobre estoque
5. USE as entidades extraídas (nlp.entidades) na sua resposta
6. SE confianca < 0.3: Peça esclarecimento ao usuário

NUNCA responda sobre agendamento quando a intenção for "consulta_preco".
NUNCA responda sobre preço quando a intenção for "agendamento".
```

---

## 🧪 Casos de Teste

### Teste 1: Consulta de Preço
```
Input: "quanto custa a troca de óleo?"
nlp.intencao: "consulta_preco"
Resposta esperada: Informações sobre PREÇO ✅
Resposta incorreta: Instruções de agendamento ❌
```

### Teste 2: Agendamento
```
Input: "quero agendar uma revisão"
nlp.intencao: "agendamento"
Resposta esperada: Instruções de agendamento ✅
Resposta incorreta: Informações sobre preço ❌
```

### Teste 3: Baixa Confiança
```
Input: "abc xyz 123"
nlp.confianca: 0.05
Resposta esperada: "Não entendi. Pode reformular?" ✅
Resposta incorreta: Assumir uma intenção ❌
```

---

## 📞 Suporte

Se o Agno AI continuar respondendo incorretamente:

1. Verifique se está recebendo os dados NLP
2. Verifique se o prompt do sistema inclui as regras acima
3. Teste com diferentes intenções
4. Consulte os logs do backend

---

**Última atualização:** 21/10/2025
**Versão:** 1.0.0
**Status:** ✅ Instruções completas
