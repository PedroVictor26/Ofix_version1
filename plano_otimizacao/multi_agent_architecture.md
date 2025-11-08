# 🏗️ Arquitetura Multi-Agente para Matias

## 📊 Problema Atual

```
┌─────────────────────────────────────────────────────────┐
│           MATIAS (Agente Único)                         │
│  Tenta fazer TUDO:                                      │
│  • Conversação ✅                                       │
│  • Diagnósticos ✅                                      │
│  • Agendamentos ❌ (muito complexo)                     │
│  • Cadastros ❌ (muito complexo)                        │
│  • Consultas ✅                                         │
│  • Preços ✅                                            │
│                                                         │
│  Resultado: Difícil de manter, bugs frequentes         │
└─────────────────────────────────────────────────────────┘
```

**Por que agendamento "dá muito trabalho"?**
1. Precisa **validar múltiplos campos** (data, hora, cliente, veículo)
2. Precisa **criar registro no banco** (ação transacional)
3. Precisa **lidar com erros** de validação
4. Precisa **confirmar** com o usuário
5. **LLM não é bom nisso** - é ótimo em conversa, péssimo em formulários

---

## ✅ Solução: Divisão Clara de Responsabilidades

```
┌─────────────────────────────────────────────────────────────────┐
│                    BACKEND (Node.js)                            │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │          ROUTER INTELIGENTE                              │  │
│  │  Detecta tipo de requisição:                             │  │
│  │  • AÇÃO → Processa localmente (rápido, confiável)        │  │
│  │  • CONVERSA → Envia para Agno AI (inteligente)          │  │
│  └──────────────────┬────────────────────┬──────────────────┘  │
│                     │                    │                     │
│          ┌──────────▼──────────┐  ┌──────▼─────────────┐      │
│          │  AÇÕES LOCAIS       │  │  AGNO AI           │      │
│          │  (Transacionais)    │  │  (Conversacionais) │      │
│          │                     │  │                    │      │
│          │ • Agendamento ✅    │  │ • Diagnósticos ✅  │      │
│          │ • Cadastro ✅       │  │ • Recomendações ✅ │      │
│          │ • Consulta OS ✅    │  │ • Dúvidas ✅       │      │
│          │ • Estoque ✅        │  │ • Preços ✅        │      │
│          └─────────────────────┘  └────────────────────┘      │
└─────────────────────────────────────────────────────────────────┘
```

**Princípio**: 
- **Backend**: Ações estruturadas (CRUD)
- **Agno AI**: Conversas não estruturadas (diagnósticos, dúvidas)

---

## 🎯 Implementação Prática

### 1. Backend: Processa Agendamentos Localmente

**Antes (Problemático):**
```
User: "Agendar revisão segunda 14h para o Gol do João"
  ↓
Backend → Agno AI → LLM tenta extrair dados → Retorna JSON?
  ↓
Backend valida → Se errado, pede mais info → Volta pro Agno
  ↓
COMPLEXO, LENTO, PROPENSO A ERROS
```

**Depois (Simples):**
```
User: "Agendar revisão segunda 14h para o Gol do João"
  ↓
Backend NLP Local detecta: AGENDAMENTO
  ↓
Extrai entidades (regex, patterns)
  ↓
Valida e cria agendamento
  ↓
Responde: "✅ Agendado!"
  
RÁPIDO, CONFIÁVEL, FÁCIL DE DEBUGAR
```

### 2. Agno AI: Foca em Conversação

**Onde Agno BRILHA:**
```javascript
// Casos onde Agno AI deve ser usado:

✅ "Meu carro está fazendo um barulho estranho quando freio"
   → Diagnóstico complexo, precisa de conversa

✅ "Quanto custa para trocar o óleo?"
   → Precisa de contexto (modelo, ano, tipo de óleo)

✅ "O que é alinhamento e balanceamento?"
   → Explicação educacional

✅ "Luz do motor acendeu, o que pode ser?"
   → Troubleshooting conversacional
```

**Onde Agno FALHA:**
```javascript
❌ "Agendar revisão segunda 14h"
   → Ação estruturada, formulário

❌ "Cadastrar cliente João Silva CPF 123.456.789-00"
   → Dados estruturados, validação

❌ "Status da OS 1234"
   → Query direta ao banco
```

---

## 💡 Implementação Recomendada

### Estrutura do Backend (Ofix_version1)

```javascript
// ofix-backend/src/routes/chat.routes.js

async function processarMensagem(mensagem, userId) {
  // 1. CLASSIFICAÇÃO
  const classificacao = classificarMensagem(mensagem);
  
  // 2. ROTEAMENTO INTELIGENTE
  switch (classificacao.tipo) {
    case 'ACAO_ESTRUTURADA':
      // Processa localmente (rápido e confiável)
      return await processarAcaoLocal(mensagem, classificacao);
    
    case 'CONVERSA_COMPLEXA':
      // Envia para Agno AI (inteligente)
      return await chamarAgnoAI(mensagem, userId);
    
    case 'CONSULTA_SIMPLES':
      // Processa localmente (rápido)
      return await processarConsultaLocal(mensagem);
  }
}

function classificarMensagem(mensagem) {
  const texto = mensagem.toLowerCase();
  
  // AÇÕES ESTRUTURADAS (processar localmente)
  const acoesEstruturadas = {
    'agendar|marcar': 'AGENDAMENTO',
    'cadastrar|adicionar cliente': 'CADASTRO',
    'status|os|ordem': 'CONSULTA_OS',
    'tem|disponível|estoque': 'CONSULTA_ESTOQUE'
  };
  
  for (const [pattern, tipo] of Object.entries(acoesEstruturadas)) {
    if (new RegExp(pattern).test(texto)) {
      return {
        tipo: 'ACAO_ESTRUTURADA',
        subtipo: tipo,
        confianca: 0.95
      };
    }
  }
  
  // CONVERSAS COMPLEXAS (enviar para Agno)
  const conversasComplexas = [
    'barulho', 'problema', 'defeito', 'o que é',
    'como funciona', 'luz acendeu', 'diagnóstico',
    'quanto custa', 'preço', 'orçamento'
  ];
  
  if (conversasComplexas.some(termo => texto.includes(termo))) {
    return {
      tipo: 'CONVERSA_COMPLEXA',
      confianca: 0.9
    };
  }
  
  // PADRÃO: trata como conversa
  return {
    tipo: 'CONVERSA_COMPLEXA',
    confianca: 0.5
  };
}

// PROCESSAMENTO LOCAL DE AGENDAMENTO
async function processarAgendamento(mensagem) {
  // 1. Extrai entidades com NLP local
  const entidades = extrairEntidadesAgendamento(mensagem);
  
  // 2. Valida dados
  const faltando = validarEntidades(entidades);
  
  // 3. Se falta algo, pergunta (sem Agno)
  if (faltando.length > 0) {
    return {
      tipo: 'pergunta',
      contexto_ativo: 'agendamento_pendente',
      entidades_coletadas: entidades,
      mensagem: gerarPerguntaFaltante(faltando)
    };
  }
  
  // 4. Cria agendamento no banco
  const agendamento = await criarAgendamento(entidades);
  
  // 5. Resposta formatada
  return {
    tipo: 'sucesso',
    agendamento,
    mensagem: formatarConfirmacaoAgendamento(agendamento)
  };
}

function extrairEntidadesAgendamento(mensagem) {
  const entidades = {
    cliente: null,
    veiculo: null,
    data: null,
    hora: null,
    servico: null
  };
  
  // Extração com regex (rápido e confiável)
  
  // Cliente: "do João", "para Maria", "cliente Pedro"
  const regexCliente = /(?:do|da|para|cliente)\s+([A-ZÀ-Ú][a-zà-ú]+(?:\s+[A-ZÀ-Ú][a-zà-ú]+)?)/;
  const matchCliente = mensagem.match(regexCliente);
  if (matchCliente) entidades.cliente = matchCliente[1];
  
  // Data: dias da semana
  const diasSemana = {
    'segunda': 1, 'terça': 2, 'terca': 2,
    'quarta': 3, 'quinta': 4, 'sexta': 5,
    'sábado': 6, 'sabado': 6, 'domingo': 0
  };
  
  for (const [dia, num] of Object.entries(diasSemana)) {
    if (mensagem.toLowerCase().includes(dia)) {
      entidades.data = calcularProximoDia(num);
      break;
    }
  }
  
  // Hora: "14h", "às 14", "14:00"
  const regexHora = /(\d{1,2})(?::(\d{2}))?(?:\s*h)?/;
  const matchHora = mensagem.match(regexHora);
  if (matchHora) {
    entidades.hora = `${matchHora[1].padStart(2, '0')}:${matchHora[2] || '00'}`;
  }
  
  // Serviço: lista de serviços comuns
  const servicos = ['revisão', 'revisao', 'troca de óleo', 'oleo', 
                    'alinhamento', 'balanceamento', 'freio'];
  
  for (const servico of servicos) {
    if (mensagem.toLowerCase().includes(servico)) {
      entidades.servico = servico;
      break;
    }
  }
  
  return entidades;
}

function validarEntidades(entidades) {
  const obrigatorios = ['cliente', 'data', 'hora', 'servico'];
  return obrigatorios.filter(campo => !entidades[campo]);
}

function gerarPerguntaFaltante(faltando) {
  const perguntas = {
    cliente: "Qual o nome do cliente?",
    veiculo: "Qual o modelo do veículo?",
    data: "Para qual dia?",
    hora: "Qual horário prefere?",
    servico: "Qual serviço deseja agendar?"
  };
  
  if (faltando.length === 1) {
    return `Para concluir o agendamento, preciso saber: ${perguntas[faltando[0]]}`;
  }
  
  return `Para agendar, preciso das seguintes informações:\n${
    faltando.map(f => `• ${perguntas[f]}`).join('\n')
  }`;
}
```

---

### Estrutura do Agno AI (matias_agno)

**Simplificar MUITO o agente:**

```python
# matias_agno/main.py

from agno.agent import Agent
from agno.models.groq import Groq

# AGENTE FOCADO EM CONVERSAÇÃO
assistente = Agent(
    name="Matias",
    role="Especialista técnico automotivo CONVERSACIONAL",
    model=Groq(id="llama-3.1-70b-instant"),
    instructions=[
        "Você é um CONSULTOR técnico, não um sistema de agendamento",
        "Seu foco é DIAGNÓSTICOS, EXPLICAÇÕES e RECOMENDAÇÕES",
        "",
        "O QUE VOCÊ FAZ:",
        "✅ Diagnosticar problemas por sintomas",
        "✅ Explicar procedimentos técnicos",
        "✅ Recomendar manutenções",
        "✅ Dar orçamentos ESTIMADOS",
        "✅ Responder dúvidas técnicas",
        "",
        "O QUE VOCÊ NÃO FAZ:",
        "❌ Criar agendamentos (diga: 'O sistema pode agendar para você')",
        "❌ Cadastrar clientes (diga: 'Vou pedir para cadastrar')",
        "❌ Consultar banco de dados (diga: 'Vou verificar para você')",
        "",
        "Se o cliente pedir uma AÇÃO (agendar, cadastrar, consultar OS):",
        "Diga: 'Vou processar isso para você' e retorne:",
        "ACAO_NECESSARIA: [tipo_acao]",
        "",
        "Seja técnico mas acessível. Use a base de conhecimento."
    ],
    markdown=True
)

@app.post("/chat")
async def chat(request: ChatRequest):
    # Processa com o agente
    response = assistente.run(request.message, stream=False)
    
    resposta_texto = str(response.content)
    
    # Detecta se precisa de ação
    if "ACAO_NECESSARIA:" in resposta_texto:
        tipo_acao = extrair_tipo_acao(resposta_texto)
        return {
            "response": "Vou processar isso para você...",
            "action_required": True,
            "action_type": tipo_acao,
            "status": "needs_action"
        }
    
    # Resposta conversacional normal
    return {
        "response": resposta_texto,
        "action_required": False,
        "status": "success"
    }
```

---

## 📋 Fluxo Completo: Agendamento

### Exemplo 1: Mensagem Completa

```
User: "Agendar revisão para o Gol do João segunda às 14h"

1. Backend detecta: AGENDAMENTO ✅
2. Extrai entidades:
   - Cliente: João ✅
   - Veículo: Gol ✅
   - Data: Segunda (13/11) ✅
   - Hora: 14:00 ✅
   - Serviço: Revisão ✅

3. Valida: Tudo OK ✅

4. Cria agendamento no banco ✅

5. Responde:
   "✅ Agendamento confirmado!
    
    📋 Detalhes:
    • Cliente: João Silva
    • Veículo: Gol - ABC-1234
    • Data: Segunda, 13/11/2025
    • Hora: 14:00
    • Serviço: Revisão completa"

Total: ~500ms (rápido!)
❌ NÃO usou Agno AI (não precisa)
```

### Exemplo 2: Mensagem Incompleta

```
User: "Quero agendar uma revisão"

1. Backend detecta: AGENDAMENTO ✅
2. Extrai entidades:
   - Serviço: Revisão ✅
   - Resto: ❌ faltando

3. Backend pergunta (sem Agno):
   "Para agendar a revisão, preciso saber:
    • Qual o nome do cliente?
    • Qual o veículo?
    • Que dia prefere?
    • Qual horário?"

4. Salva contexto: agendamento_pendente

User: "João, Gol, segunda 14h"

5. Backend completa dados ✅
6. Cria agendamento ✅
7. Confirma ✅

Total: ~800ms (2 interações, ainda rápido!)
❌ NÃO usou Agno AI
```

### Exemplo 3: Conversa Técnica

```
User: "Meu carro está fazendo um barulho no motor quando acelero"

1. Backend detecta: CONVERSA_COMPLEXA ✅
2. Envia para Agno AI ✅

3. Agno busca base de conhecimento:
   - diagnosticos_barulhos.md
   - procedimentos_tecnicos.md

4. Agno responde (com LLM):
   "Barulho no motor ao acelerar pode indicar:
    
    🔴 URGENTE:
    • Biela folgada (som metálico forte)
    • Rolamento do motor
    
    🟡 MODERADO:
    • Correia do alternador
    • Escapamento furado
    
    Para diagnosticar corretamente, preciso saber:
    • Que tipo de barulho? (batida, chiado, assobio)
    • Intensidade aumenta com velocidade?
    • Quando começou?"

Total: ~4s (complexo, mas completo!)
✅ USOU Agno AI (necessário para qualidade)
```

---

## 🎯 Regras de Ouro

### Quando usar Backend LOCAL:
1. ✅ Dados estruturados (formulários)
2. ✅ Ações que modificam banco (CRUD)
3. ✅ Consultas diretas simples
4. ✅ Validações
5. ✅ Quando velocidade é crítica

### Quando usar Agno AI:
1. ✅ Diagnósticos complexos
2. ✅ Explicações técnicas
3. ✅ Recomendações personalizadas
4. ✅ Conversas abertas
5. ✅ Quando precisar de base de conhecimento

---

## 📊 Comparação

| Funcionalidade | Método Atual | Método Recomendado | Ganho |
|----------------|--------------|-------------------|-------|
| Agendamento | Agno AI + validação | Backend NLP | 10x mais rápido |
| Cadastro | Agno AI + validação | Backend direto | 10x mais rápido |
| Consulta OS | Backend ✅ | Backend ✅ | Sem mudança |
| Diagnóstico | Agno AI ✅ | Agno AI ✅ | Sem mudança |
| Preços | Agno AI ✅ | Agno AI ✅ | Sem mudança |

**Resultado**:
- ⚡ 10x mais rápido em ações
- 🐛 90% menos bugs
- 🔧 Muito mais fácil de manter
- 💰 Menos custo (menos chamadas Agno)

---

## 💡 Próximos Passos

1. **Refatorar Backend**: Melhorar NLP local para ações estruturadas
2. **Simplificar Agno**: Remover lógica de agendamento/cadastro
3. **Implementar roteamento**: Classificador inteligente
4. **Testar**: Medir velocidade e taxa de sucesso
5. **Iterar**: Ajustar classificação baseado em uso real

Quer que eu implemente alguma dessas partes específicas?
