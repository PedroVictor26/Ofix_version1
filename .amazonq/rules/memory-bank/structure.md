# Estrutura do Projeto OFIX

## Arquitetura Geral

O OFIX é um monorepo que contém frontend e backend na mesma estrutura:

```
ofix_new/
├── src/                    # Frontend React
├── ofix-backend/          # Backend Node.js + Express
├── public/                # Assets estáticos
├── scripts/               # Scripts de deploy
└── tests/                 # Testes E2E e integração
```

## Frontend (src/)

### Estrutura de Diretórios

```
src/
├── agents/               # Sistema de agentes IA
│   ├── actions/         # Ações executáveis pelos agentes
│   ├── core/            # Núcleo do sistema de agentes
│   └── skills/          # Habilidades dos agentes
├── components/          # Componentes React reutilizáveis
│   ├── admin/          # Componentes administrativos
│   ├── ai/             # Componentes de IA (chat, voz)
│   ├── auth/           # Autenticação e login
│   ├── chat/           # Interface de chat
│   ├── clientes/       # Gestão de clientes
│   ├── configuracoes/  # Configurações do sistema
│   ├── dashboard/      # Dashboard e Kanban
│   ├── estoque/        # Controle de estoque
│   ├── financeiro/     # Módulo financeiro
│   └── ui/             # Componentes UI base (shadcn/ui)
├── constants/          # Configurações e constantes
├── context/            # React Context (Auth, Dashboard)
├── hooks/              # Custom React Hooks
├── lib/                # Utilitários e helpers
├── pages/              # Páginas principais da aplicação
├── services/           # Camada de serviços/API
├── styles/             # Estilos globais
└── utils/              # Funções utilitárias
```

### Componentes Principais

#### Sistema de Agentes (agents/)
- **actions/** - Ações concretas que agentes podem executar
- **core/** - Motor de agentes e orquestração
- **skills/** - Capacidades específicas dos agentes

#### Componentes UI (components/)
- **ai/** - ChatInterface, VoiceRecognition, AIAssistant
- **dashboard/** - KanbanBoard, MetricsCards, Charts
- **clientes/** - ClientesList, ClienteForm, ClienteDetails
- **estoque/** - EstoqueList, PecaForm, MovimentacaoEstoque
- **financeiro/** - TransacoesList, RelatoriosFinanceiros

#### Páginas (pages/)
- Dashboard.jsx - Página principal com Kanban
- Clientes.jsx - Gestão de clientes
- Estoque.jsx - Controle de estoque
- Financeiro.jsx - Módulo financeiro
- AIPage.jsx - Interface do assistente IA
- LoginPage.jsx - Autenticação

#### Hooks Customizados (hooks/)
- **useDashboardData** - Dados do dashboard
- **useClientesData** - Gestão de clientes
- **useEstoqueData** - Controle de estoque
- **useFinanceiroData** - Dados financeiros
- **useAIAssistant** - Integração com IA
- **useSpeechToText** - Reconhecimento de voz
- **useTextToSpeech** - Síntese de voz
- **useAutoSave** - Salvamento automático

#### Serviços (services/)
- **api.js** - Cliente HTTP base (Axios)
- **auth.service.js** - Autenticação JWT
- **clientes.service.js** - API de clientes
- **ai.service.js** - Integração com IA
- **agendamentos.service.js** - Gestão de agendamentos
- **pecas.service.js** - Controle de peças
- **financeiro.service.js** - Operações financeiras

## Backend (ofix-backend/)

### Estrutura de Diretórios

```
ofix-backend/
├── src/
│   ├── ai/              # Sistema de IA
│   │   ├── core/       # Núcleo da IA
│   │   └── providers/  # Provedores de IA
│   ├── config/         # Configurações
│   ├── controllers/    # Controladores REST
│   ├── middleware/     # Middlewares Express
│   ├── routes/         # Rotas da API
│   ├── services/       # Lógica de negócio
│   ├── app.js          # Configuração Express
│   └── server.js       # Entrada da aplicação
├── prisma/             # ORM e migrations
│   ├── migrations/     # Histórico de migrations
│   └── schema.prisma   # Schema do banco
└── uploads/            # Arquivos enviados
```

### Sistema de IA (ai/)

#### Core (ai/core/)
- **AIOrchestrator.js** - Orquestrador principal de IA
- **IntentClassifier.js** - Classificação de intenções
- **ContextManager.js** - Gerenciamento de contexto
- **ResponseGenerator.js** - Geração de respostas

#### Providers (ai/providers/)
- **ProviderManager.js** - Gerenciador de provedores
- **OpenAIProvider.js** - Integração OpenAI
- **HuggingFaceProvider.js** - Integração Hugging Face
- **AgnoProvider.js** - Integração Agno AI

### Controladores (controllers/)
- **authController.js** - Autenticação e autorização
- **clientesController.js** - CRUD de clientes
- **veiculosController.js** - Gestão de veículos
- **ordensServicoController.js** - Ordens de serviço
- **pecasController.js** - Controle de peças
- **financeiroController.js** - Operações financeiras
- **aiController.js** - Endpoints de IA

### Rotas (routes/)
- **auth.routes.js** - /api/auth/*
- **clientes.routes.js** - /api/clientes/*
- **veiculos.routes.js** - /api/veiculos/*
- **ordens-servico.routes.js** - /api/ordens-servico/*
- **pecas.routes.js** - /api/pecas/*
- **financeiro.routes.js** - /api/financeiro/*
- **ai.routes.js** - /api/ai/*

### Banco de Dados (prisma/)

Modelos principais:
- **User** - Usuários do sistema
- **Cliente** - Clientes da oficina
- **Veiculo** - Veículos dos clientes
- **OrdemServico** - Ordens de serviço
- **Peca** - Peças do estoque
- **Servico** - Serviços oferecidos
- **Transacao** - Transações financeiras
- **Conversa** - Histórico de conversas IA
- **Mensagem** - Mensagens individuais

## Padrões Arquiteturais

### Frontend

1. **Component-Based Architecture**
   - Componentes reutilizáveis e isolados
   - Props drilling evitado com Context API
   - Composição sobre herança

2. **Custom Hooks Pattern**
   - Lógica de negócio separada da UI
   - Hooks especializados por domínio
   - Reutilização de lógica entre componentes

3. **Service Layer**
   - Camada de abstração para APIs
   - Centralização de chamadas HTTP
   - Tratamento consistente de erros

4. **Context + Hooks**
   - AuthContext para autenticação global
   - DashboardContext para estado compartilhado
   - Hooks para consumir contexts

### Backend

1. **MVC Pattern**
   - Models (Prisma schemas)
   - Views (JSON responses)
   - Controllers (lógica de requisição/resposta)

2. **Service Layer**
   - Lógica de negócio isolada
   - Reutilização entre controllers
   - Testabilidade melhorada

3. **Middleware Chain**
   - Autenticação JWT
   - Validação de dados
   - Tratamento de erros
   - Logging

4. **Provider Pattern (IA)**
   - Interface comum para provedores
   - Troca fácil entre provedores
   - Fallback automático

## Fluxo de Dados

### Requisição Típica

```
Frontend Component
    ↓
Custom Hook (useClientesData)
    ↓
Service Layer (clientes.service.js)
    ↓
HTTP Request (Axios)
    ↓
Backend Route (/api/clientes)
    ↓
Middleware (auth, validation)
    ↓
Controller (clientesController)
    ↓
Service (clientesService)
    ↓
Prisma ORM
    ↓
PostgreSQL Database
    ↓
Response (JSON)
    ↓
Frontend State Update
    ↓
UI Re-render
```

### Fluxo de IA

```
User Input (Text/Voice)
    ↓
ChatInterface Component
    ↓
useAIAssistant Hook
    ↓
ai.service.js
    ↓
Backend /api/ai/chat
    ↓
AIOrchestrator
    ↓
IntentClassifier (detecta intenção)
    ↓
ContextManager (carrega contexto)
    ↓
ProviderManager (seleciona provedor)
    ↓
AI Provider (OpenAI/HuggingFace/Agno)
    ↓
ResponseGenerator
    ↓
Action Execution (se necessário)
    ↓
Response to Frontend
    ↓
UI Update + TTS (opcional)
```

## Relacionamentos Entre Módulos

- **Dashboard** ← depende de → Clientes, OS, Financeiro
- **Clientes** ← vinculado a → Veículos, OS
- **Veículos** ← pertence a → Clientes
- **Ordens de Serviço** ← relaciona → Clientes, Veículos, Peças, Serviços
- **Estoque** ← usado por → OS, Financeiro
- **Financeiro** ← registra → OS, Transações
- **IA** ← interage com → Todos os módulos
