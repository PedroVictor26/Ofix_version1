# 🤖 CONFIGURAÇÃO DO AGNO AI - ASSISTENTE MATIAS

## 🎯 **OBJETIVO**
Configurar o Agno AI para funcionar como assistente **Matias** do sistema OFIX, com acesso a funcionalidades reais do backend.

## 🔧 **CONFIGURAÇÃO NO AGNO SYSTEM**

### 1. **Criar Novo Agente**

**Nome do Agente**: `matias-ofix`
**Descrição**: `Assistente virtual para oficina automotiva OFIX`
**Modelo**: `gpt-4` ou `claude-3`

### 2. **Configurar System Prompt**

```
Você é Matias, o assistente virtual especializado da oficina automotiva OFIX.

## SUA PERSONALIDADE:
- Profissional e atencioso
- Especialista em mecânica automotiva
- Conhecimento técnico avançado
- Sempre prestativo e detalhista
- Linguagem clara e acessível

## SUAS CAPACIDADES:
1. Consultar ordens de serviço por veículo, cliente ou status
2. Agendar novos serviços com data e hora específicas
3. Consultar estatísticas e relatórios da oficina
4. Buscar informações de veículos por placa
5. Fornecer diagnósticos e soluções automotivas
6. Manter histórico de conversas persistente

## SISTEMA DISPONÍVEL:
- Nome: OFIX - Sistema de Oficina Automotiva
- Backend: https://ofix-backend-prod.onrender.com
- Endpoints: /agno/contexto-sistema, /agno/consultar-os, /agno/agendar-servico, etc.

## INSTRUÇÕES DE USO:
- Sempre cumprimente o cliente de forma amigável
- Para consultas de OS, pergunte detalhes (placa, modelo, cliente)
- Para agendamentos, confirme data, hora e tipo de serviço
- Use linguagem técnica apenas quando necessário
- Sempre ofereça opções de ajuda adicional

## EXEMPLOS DE INTERAÇÃO:
Cliente: "Como está meu carro?"
Você: "Olá! Para consultar seu veículo, preciso de alguns dados. Pode me informar a placa ou o modelo do carro?"

Cliente: "Quero agendar uma revisão"
Você: "Perfeito! Vou ajudar com o agendamento. Qual é o modelo do seu veículo e quando gostaria de trazer?"

Sempre mantenha o foco em soluções práticas e use as funções disponíveis quando apropriado.
```

### 3. **Configurar Functions/Tools**

#### **Function 1: consultar_os**
```json
{
  "name": "consultar_os",
  "description": "Consulta ordens de serviço por veículo, cliente ou status",
  "parameters": {
    "type": "object",
    "properties": {
      "veiculo": {
        "type": "string",
        "description": "Modelo, marca ou placa do veículo"
      },
      "proprietario": {
        "type": "string", 
        "description": "Nome do proprietário do veículo"
      },
      "status": {
        "type": "string",
        "enum": ["PENDENTE", "ANDAMENTO", "CONCLUIDO"],
        "description": "Status da ordem de serviço"
      },
      "periodo": {
        "type": "string",
        "enum": ["hoje", "semana", "mes"],
        "description": "Período para filtrar as consultas"
      }
    }
  }
}
```

**Implementation:**
```javascript
async function consultar_os(params) {
  const response = await fetch('https://ofix-backend-prod.onrender.com/agno/consultar-os', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params)
  });
  return await response.json();
}
```

#### **Function 2: agendar_servico**
```json
{
  "name": "agendar_servico",
  "description": "Agenda um novo serviço na oficina",
  "parameters": {
    "type": "object",
    "properties": {
      "cliente": {
        "type": "object",
        "properties": {
          "id": {"type": "number"},
          "nome": {"type": "string"}
        },
        "required": ["nome"]
      },
      "veiculo": {
        "type": "object", 
        "properties": {
          "modelo": {"type": "string"},
          "placa": {"type": "string"}
        },
        "required": ["modelo"]
      },
      "servico": {
        "type": "string",
        "enum": ["revisao", "reparo", "diagnostico", "troca_oleo"],
        "description": "Tipo de serviço a ser agendado"
      },
      "data_hora": {
        "type": "string",
        "format": "date-time",
        "description": "Data e hora do agendamento (ISO format)"
      },
      "descricao": {
        "type": "string",
        "description": "Descrição adicional do serviço"
      }
    },
    "required": ["cliente", "veiculo", "servico", "data_hora"]
  }
}
```

**Implementation:**
```javascript  
async function agendar_servico(params) {
  const response = await fetch('https://ofix-backend-prod.onrender.com/agno/agendar-servico', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params)
  });
  return await response.json();
}
```

#### **Function 3: obter_estatisticas**
```json
{
  "name": "obter_estatisticas", 
  "description": "Obtém estatísticas da oficina",
  "parameters": {
    "type": "object",
    "properties": {
      "periodo": {
        "type": "string",
        "enum": ["7_dias", "30_dias", "mes_atual", "ano_atual"],
        "description": "Período para as estatísticas"
      }
    }
  }
}
```

**Implementation:**
```javascript
async function obter_estatisticas(params) {
  const periodo = params.periodo || '30_dias';
  const response = await fetch(`https://ofix-backend-prod.onrender.com/agno/estatisticas?periodo=${periodo}`, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' }
  });
  return await response.json();
}
```

#### **Function 4: salvar_conversa**
```json
{
  "name": "salvar_conversa",
  "description": "Salva a conversa para histórico persistente",
  "parameters": {
    "type": "object", 
    "properties": {
      "usuario_id": {"type": "string"},
      "mensagem": {"type": "string"},
      "resposta": {"type": "string"},
      "contexto": {"type": "object"}
    },
    "required": ["usuario_id", "mensagem", "resposta"]
  }
}
```

**Implementation:**
```javascript
async function salvar_conversa(params) {
  const response = await fetch('https://ofix-backend-prod.onrender.com/agno/salvar-conversa', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params)
  });
  return await response.json();
}
```

## 🚀 **CONFIGURAÇÃO NO AGNO DASHBOARD**

### **Step 1: Login no Agno**
1. Acesse: `https://agno.ai` (ou seu Agno dashboard)
2. Faça login com suas credenciais
3. Clique em "Create New Agent"

### **Step 2: Configurações Básicas**
- **Agent Name**: `matias-ofix`
- **Agent ID**: `oficinaia` 
- **Description**: `Assistente virtual OFIX especializado em mecânica automotiva`
- **Model**: `gpt-4-turbo` (recomendado)
- **Temperature**: `0.7`
- **Max Tokens**: `2000`

### **Step 3: System Prompt**
Cole o system prompt completo fornecido acima na seção "System Instructions"

### **Step 4: Functions**
Adicione as 4 functions com suas implementações:
1. `consultar_os`
2. `agendar_servico` 
3. `obter_estatisticas`
4. `salvar_conversa`

### **Step 5: Testing**
Teste com mensagens como:
- "Olá Matias, como você pode me ajudar?"
- "Quero consultar meu Honda Civic"
- "Preciso agendar uma revisão"

## 🔗 **INTEGRAÇÃO COM OFIX FRONTEND**

### **Variáveis de Ambiente (.env)**
```env
# Agno Configuration
VITE_AGNO_API_URL="https://sua-instancia-agno.com"
VITE_AGNO_AGENT_ID="oficinaia"
VITE_AGNO_API_TOKEN="seu-token-agno"
```

### **Teste de Conexão**
```javascript
// No frontend, teste a conexão:
const response = await fetch('/agno/chat-public', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ message: "Olá Matias!" })
});
```

## ✅ **CHECKLIST DE CONFIGURAÇÃO**

- [ ] Agente Matias criado no Agno
- [ ] System prompt configurado
- [ ] 4 functions implementadas
- [ ] Testado com mensagens básicas
- [ ] Integrado com frontend OFIX
- [ ] Variáveis de ambiente configuradas
- [ ] Conexão com backend validada

## 🎯 **RESULTADO ESPERADO**

Após a configuração, o Matias será capaz de:

✅ **Conversar naturalmente** sobre mecânica automotiva
✅ **Consultar ordens de serviço** em tempo real
✅ **Agendar serviços** com verificação de disponibilidade
✅ **Fornecer estatísticas** da oficina
✅ **Manter histórico** de conversas
✅ **Integrar perfeitamente** com o sistema OFIX

## 📞 **SUPORTE**

Se houver problemas:
1. Verifique se o backend está online: https://ofix-backend-prod.onrender.com/health
2. Teste os endpoints individualmente
3. Valide as variáveis de ambiente
4. Consulte os logs do Agno para erros

**🤖 O Matias estará pronto para atender os clientes da oficina OFIX!** ✨