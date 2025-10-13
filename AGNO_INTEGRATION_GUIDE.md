# 🤖 AGNO AI - MATIAS Integration Guide

## 🎯 System Overview
- **System**: OFIX - Automotive Workshop Management
- **Assistant**: Matias (via Agno AI)
- **Backend**: Node.js + Express + PostgreSQL + Prisma
- **Frontend**: React + Vite + Tailwind CSS
- **Integration URL**: `http://localhost:3001/agno` (dev) | `https://ofix-backend.onrender.com/agno` (prod)

## 🚀 AVAILABLE ENDPOINTS FOR AGNO

### 1. 🔍 SERVICE ORDER CONSULTATION
**Endpoint**: `POST /agno/consultar-os`
**Status**: ✅ ACTIVE

**When to use**:
- User asks about service orders
- Mentions vehicle models, license plates
- Asks about service status
- Requests vehicle history

**Examples**:
- "Show me all service orders for the 2020 silver Gol"
- "Which cars are being serviced today?"
- "Service history for client João Silva"
- "Is the Civic with license plate ABC-1234 ready?"

**Request Format**:
```json
{
  "veiculo": "Gol 2020",          // Optional: vehicle model/brand
  "proprietario": "João Silva",    // Optional: owner name
  "status": "ANDAMENTO",          // Optional: PENDENTE, ANDAMENTO, CONCLUIDO
  "periodo": "semana"             // Optional: hoje, semana, mes
}
```

**Response Format**:
```json
{
  "success": true,
  "total": 5,
  "ordens_servico": [
    {
      "id": 123,
      "veiculo": "Honda Civic 2019",
      "cliente": "João Silva",
      "status": "ANDAMENTO",
      "servicos": ["Revisão", "Troca de óleo"],
      "valor_total": 350.00,
      "data_entrada": "2024-01-15"
    }
  ],
  "timestamp": "2024-01-15T10:30:00Z"
}
```

### 2. 📅 SERVICE SCHEDULING
**Endpoint**: `POST /agno/agendar-servico`
**Status**: ✅ ACTIVE

**When to use**:
- User wants to schedule services
- Mentions dates and times
- Requests maintenance appointments
- Books specific services

**Examples**:
- "Schedule a review for João's Civic next Monday at 2pm"
- "Book an oil change for tomorrow morning"
- "Schedule diagnostics for the Corsa that's failing"
- "I need to bring my car in for brake repair on Friday"

**Request Format**:
```json
{
  "cliente": {
    "id": 1,
    "nome": "João Silva"
  },
  "veiculo": {
    "id": 1,
    "modelo": "Honda Civic",
    "placa": "ABC-1234"
  },
  "servico": "revisao",           // revisao, reparo, diagnostico, troca_oleo
  "data_hora": "2024-01-22T14:00:00Z",
  "descricao": "Revisão preventiva"
}
```

**Response Format**:
```json
{
  "success": true,
  "agendamento": {
    "id": 456,
    "cliente": "João Silva",
    "veiculo": "Honda Civic",
    "servico": "revisao",
    "data_hora": "2024-01-22T14:00:00Z",
    "status": "AGENDADO"
  },
  "mensagem": "Serviço revisao agendado para 22/01/2024 às 14:00",
  "timestamp": "2024-01-15T10:30:00Z"
}
```

### 3. 📊 WORKSHOP STATISTICS
**Endpoint**: `GET /agno/estatisticas?periodo=30_dias`
**Status**: ✅ ACTIVE

**When to use**:
- User asks about numbers/metrics
- Requests performance data
- Wants to know workshop statistics
- Asks about productivity

**Examples**:
- "How many cars did we service this month?"
- "What's our revenue this week?"
- "Show me workshop performance"
- "Which services are most popular?"

**Query Parameters**:
- `periodo`: `7_dias`, `30_dias`, `mes_atual`, `ano_atual`

**Response Format**:
```json
{
  "success": true,
  "periodo": "30_dias",
  "estatisticas": {
    "total_os": 45,
    "os_concluidas": 38,
    "receita_total": 15600.00,
    "servicos_populares": [
      { "nome": "Troca de óleo", "quantidade": 12 },
      { "nome": "Revisão", "quantidade": 8 }
    ],
    "produtividade": 84.4
  },
  "timestamp": "2024-01-15T10:30:00Z"
}
```

### 4. 💾 CONVERSATION STORAGE
**Endpoint**: `POST /agno/salvar-conversa`
**Status**: ✅ ACTIVE

**Purpose**: Save user conversations for persistent memory

**Request Format**:
```json
{
  "usuario_id": "user_123",
  "mensagem": "User's message",
  "resposta": "Matias' response",
  "contexto": {
    "acao_realizada": "consulta_os",
    "resultado": "success"
  }
}
```

### 5. 📚 CONVERSATION HISTORY
**Endpoint**: `GET /agno/historico-conversas/{usuario_id}?limite=10`
**Status**: ✅ ACTIVE

**Purpose**: Retrieve user conversation history for context

**Response Format**:
```json
{
  "success": true,
  "usuario_id": "user_123",
  "total": 5,
  "conversas": [
    {
      "id": 1,
      "pergunta": "Como está meu carro?",
      "resposta": "Seu Honda Civic está em revisão...",
      "timestamp": "2024-01-15T09:00:00Z"
    }
  ]
}
```

### 6. 🔧 SYSTEM CONTEXT
**Endpoint**: `GET /agno/contexto-sistema`
**Status**: ✅ ACTIVE

**Purpose**: Get system information and available capabilities

**Response Format**:
```json
{
  "success": true,
  "contexto": {
    "sistema": "OFIX - Sistema de Oficina Automotiva",
    "versao": "2024.1",
    "assistente": "Matias",
    "capacidades": [
      "Consultar ordens de serviço por veículo, proprietário ou status",
      "Agendar novos serviços com data e hora específicas",
      "Calcular orçamentos baseados em peças e mão de obra",
      "Consultar histórico completo de veículos",
      "Gerar relatórios de produtividade da oficina"
    ],
    "funcoes_disponivel": {
      "consultar_os": "/agno/consultar-os",
      "agendar_servico": "/agno/agendar-servico",
      "obter_estatisticas": "/agno/estatisticas"
    }
  }
}
```

## 🎭 CONVERSATION PATTERNS

### Service Order Consultation
```
User: "Como está meu carro?"
Matias Action: POST /agno/consultar-os with user context
Response: "Seu Honda Civic está em revisão. Status: 80% concluído. Previsão de entrega: amanhã às 16h."
```

### Scheduling Request
```
User: "Preciso agendar uma revisão"
Matias Action: POST /agno/agendar-servico
Response: "Perfeito! Temos disponibilidade na segunda-feira às 14h. Confirma para seu Civic?"
```

### Statistics Query
```
User: "Quantos carros vocês atenderam este mês?"
Matias Action: GET /agno/estatisticas?periodo=mes_atual
Response: "Este mês atendemos 45 veículos, com 38 serviços concluídos. Nossa receita foi de R$ 15.600,00."
```

## 🔐 AUTHENTICATION

All endpoints use the existing OFIX authentication system. The Agno integration endpoints are designed to work with service-level authentication.

## 🚨 ERROR HANDLING

All endpoints return consistent error format:
```json
{
  "success": false,
  "error": "Error description",
  "message": "Detailed error message",
  "timestamp": "2024-01-15T10:30:00Z"
}
```

## 🎯 INTEGRATION CHECKLIST

- ✅ Service order consultation endpoint active
- ✅ Service scheduling endpoint active  
- ✅ Statistics endpoint active
- ✅ Conversation storage endpoint active
- ✅ History retrieval endpoint active
- ✅ System context endpoint active
- ✅ Error handling implemented
- ✅ Response formatting standardized
- ✅ Database integration complete

## 📞 CONTACT INFORMATION

For integration issues or questions:
- System: OFIX Automotive Workshop Management
- Assistant: Matias via Agno AI
- Backend Status: All endpoints operational
- Database: PostgreSQL with Prisma ORM
- Real-time: WebSocket support available

**The Agno AI system should now have full access to OFIX functionalities through these endpoints.**