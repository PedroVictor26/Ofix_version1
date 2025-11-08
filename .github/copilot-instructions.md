# OFIX Codebase Instructions for AI Agents

## Architecture Overview

OFIX is a **monorepo** with two main applications:
- **Frontend (React + Vite)**: Root directory (`src/`, `package.json`)
- **Backend (Node.js + Express)**: `ofix-backend/` subdirectory
- **AI Agent (Agno)**: External service at `matias-agno-assistant.onrender.com`

### Key Data Flow
```
User → AIPage.jsx → api.js → ofix-backend/agno.routes.js → 
  ├─ Local NLP (nlp.service.js) → Database (Prisma)
  └─ Agno AI (external) → LLaMA 3.1 70B + Knowledge Base
```

## Critical Development Patterns

### 1. **Multi-Agent Architecture (NEW - Nov 2025)** 🚀
**Philosophy:** Separate responsibilities between Backend (structured actions) and Agno AI (complex conversations)

**Flow:**
```
User Message → Classifier → Backend Local (fast CRUD) 
                         → Agno AI (intelligent conversation)
```

**Key Files:**
- `ofix-backend/src/services/message-classifier.service.js` - Decides routing
- `ofix-backend/src/services/agendamento-local.service.js` - Local scheduling
- `ofix-backend/src/services/local-response.service.js` - Quick responses

**When to use Backend Local:**
- ✅ Structured actions (scheduling, CRUD, queries)
- ✅ Form-like interactions
- ✅ Direct database queries
- ✅ Speed is critical (<1s)

**When to use Agno AI:**
- ✅ Complex diagnostics
- ✅ Technical explanations
- ✅ Personalized recommendations
- ✅ Open-ended conversations

### 2. **API Communication (Frontend ↔ Backend)**
**File:** `src/utils/api.js`
- **Never hardcode URLs** - Use `getApiBaseUrl()` which auto-detects environment
- Production: `https://ofix-backend-prod.onrender.com`
- Development: Empty string (uses Vite proxy)
- All API calls go through `/api/*` prefix
- Authentication uses JWT in `Authorization: Bearer <token>` header

```javascript
// ✅ CORRECT
import { apiCall } from '@/utils/api';
const response = await apiCall('agno/chat', { method: 'POST', body: JSON.stringify(data) });

// ❌ WRONG - Never fetch directly
fetch('https://ofix-backend-prod.onrender.com/api/...')
```

### 2. **Agno AI Integration (Matias Assistant)**
**File:** `ofix-backend/src/routes/agno.routes.js` (2100+ lines - READ THIS FIRST)

**Retry Logic Pattern:**
- First attempt: 45s timeout (covers Render cold start)
- Second attempt: 30s timeout (service already warm)
- Fallback: Local response if both fail

```javascript
// Intent detection is HYBRID:
// 1. Frontend sends `nlp.intencao` (optional)
// 2. Backend validates with NLPService.detectarIntencao()
// 3. Context-aware routing (processarAgendamento, processarConsultaOS, etc)
```

**9 Intent Types:** `AGENDAMENTO`, `CONSULTA_OS`, `CONSULTA_ESTOQUE`, `CONSULTA_CLIENTE`, `CADASTRAR_CLIENTE`, `CONSULTA_PRECO`, `ESTATISTICAS`, `AJUDA`, `CONVERSA_GERAL`

### 3. **Database Access (Prisma ORM)**
**Schema:** `ofix-backend/prisma/schema.prisma`

**CRITICAL FIELD NAMING:**
- ✅ Use: `userId`, `createdAt`, `tipo` (camelCase as in schema)
- ❌ Never: `usuarioId`, `criadoEm`, `tipoRemetente` (old naming)

```javascript
// ✅ CORRECT
const conversas = await prisma.conversaMatias.findMany({
  where: { userId: parseInt(userId) },
  orderBy: { createdAt: 'desc' }
});

// Backend uses Int for userId (hashed from UUID)
const userIdInt = parseInt(usuarioId.replace(/-/g, '').substring(0, 9), 16) % 2147483647;
```

### 4. **NLP Entity Extraction**
**File:** `ofix-backend/src/services/nlp.service.js`

Extracts: `cliente`, `veiculo`, `placa`, `diaSemana`, `hora`, `servico`, `dataEspecifica`, `urgente`

**Pattern:** Uses regex + dictionaries, NOT ML. Example:
```javascript
// Extracts "João" from "Agendar para o João na segunda"
const padraoNome = /(?:do|da|para o|para a)\s+([A-ZÀ-Üa-zà-ü]+)/i;
```

## Developer Workflows

### Running Locally
```bash
# Frontend (root)
npm install
npm run dev              # http://localhost:5173

# Backend (ofix-backend/)
cd ofix-backend
npm install
npx prisma generate      # ALWAYS after schema changes
npm run dev              # http://localhost:3001
```

### Database Migrations
```bash
cd ofix-backend
npx prisma migrate dev --name description_here   # Creates migration
npx prisma studio                                  # GUI to inspect DB
```

### Testing
```bash
# Frontend tests
npm run test              # Vitest watch mode
npm run test:coverage     # With coverage report

# Backend - NO test suite yet (uses manual testing)
```

### Debugging Agno AI Issues
1. Check config: `GET /api/agno/config` (no auth required)
2. Warm service: `POST /api/agno/warm` (bypasses cold start)
3. Read logs in: `ofix-backend/src/routes/agno.routes.js` (has extensive console.log)

## Project-Specific Conventions

### 1. **Message Type Mapping** (Frontend ↔ Backend)
Backend returns `tipo: 'user' | 'matias'`
Frontend uses `tipo: 'usuario' | 'agente'` internally

**AIPage.jsx mapping:**
```javascript
const mensagensFormatadas = conversas.map(msg => ({
  tipo: msg.tipo_remetente === 'user' ? 'usuario' : 'agente',
  conteudo: msg.conteudo
}));
```

### 2. **Context-Aware Conversations**
**File:** `ofix-backend/src/routes/agno.routes.js` (lines 200-400)

Multi-step flows use `contexto_ativo`:
- `'buscar_cliente'` - Client selection in progress
- `'agendamento_pendente'` - Waiting for missing data
- Stored in `contextoSelecaoClientes` Map (in-memory, 10min TTL)

### 3. **Component Structure**
```
src/
├── pages/           # Route-level components (e.g., AIPage.jsx)
├── components/      # Reusable UI (Button, Modal, etc from ShadCN)
├── services/        # API clients (no business logic)
├── utils/           # Pure functions (api.js, retryUtils.js)
├── context/         # React Context (AuthContext)
└── hooks/           # Custom hooks
```

**Import pattern:** Use `@/` alias (configured in `vite.config.ts`)
```javascript
import { Button } from '@/components/ui/button';
import { apiCall } from '@/utils/api';
```

## External Dependencies & Integration Points

### Production Services
- **Frontend:** Vercel (`ofix.vercel.app`)
- **Backend:** Render (`ofix-backend-prod.onrender.com`)
- **Database:** Railway/Supabase (PostgreSQL)
- **Agno AI:** Render (`matias-agno-assistant.onrender.com`)

### Environment Variables
```bash
# Frontend (.env)
VITE_API_BASE_URL=https://ofix-backend-prod.onrender.com

# Backend (.env)
DATABASE_URL=postgresql://...
AGNO_API_URL=https://matias-agno-assistant.onrender.com
AGNO_DEFAULT_AGENT_ID=oficinaia
JWT_SECRET=...
```

### Known Limitations
1. **Agno Cold Start:** 45-50s on Render free tier (first request after 15min idle)
2. **No WebSocket:** Chat uses polling, not real-time
3. **In-Memory Cache:** `contextoSelecaoClientes` lost on server restart

## Key Files to Understand

| File | Purpose | Lines | Why Critical |
|------|---------|-------|--------------|
| `ofix-backend/src/routes/agno.routes.js` | Main AI router | 2100+ | All Matias logic, retry, NLP routing |
| `ofix-backend/src/services/message-classifier.service.js` | ⭐ **NEW** Classifier | 300+ | Routes messages to correct processor |
| `ofix-backend/src/services/agendamento-local.service.js` | ⭐ **NEW** Local scheduling | 500+ | Handles scheduling without AI (10x faster) |
| `ofix-backend/src/services/local-response.service.js` | ⭐ **NEW** Quick responses | 200+ | Greetings, help menu (instant) |
| `ofix-backend/src/services/nlp.service.js` | NLP engine | 400+ | Entity extraction patterns |
| `src/pages/AIPage.jsx` | Chat UI | 1500+ | Message rendering, history loading |
| `src/utils/api.js` | API client | 130 | Environment detection, fetch wrapper |
| `ofix-backend/prisma/schema.prisma` | Database schema | 300+ | Field names (userId NOT usuarioId) |
| `docs/agente-matias/DOCUMENTACAO_COMPLETA_AGENTE_MATIAS.md` | Full docs | 1100+ | Complete Matias architecture |
| `plano_otimizacao/` | ⭐ **NEW** Optimization plan | 4 files | Architecture, checklist, implementation |

## Common Pitfalls to Avoid

1. ❌ Using old field names (`usuarioId` → ✅ `userId`)
2. ❌ Hardcoding backend URL → ✅ Use `getApiBaseUrl()`
3. ❌ Forgetting `npx prisma generate` after schema changes
4. ❌ Not handling Agno timeout → ✅ Always provide fallback
5. ❌ Mixing message types → ✅ Map backend `'user'` to frontend `'usuario'`

## MCP Tools (Model Context Protocol)

### Available MCPs for Enhanced Development

**When to use MCPs:**
- Use MCP tools to augment your capabilities beyond file reading/editing
- MCPs provide specialized integrations (GitHub, Hugging Face, Python analysis, etc)
- Prefer MCP tools over manual API calls when available

### 1. **GitHub MCP** (`mcp_github_*`)
**Use for:** Git operations, PR management, issue tracking, code search

```javascript
// ✅ Search for code patterns across repo
mcp_github_github_search_code({ 
  query: "prisma.conversaMatias language:javascript"
})

// ✅ Create PR after changes
mcp_github_github_create_pull_request({
  owner: "PedroVictor26",
  repo: "Ofix_version1", 
  title: "Fix Agno timeout handling",
  head: "feature-branch",
  base: "main"
})

// ✅ List issues by label
mcp_github_github_search_issues({
  query: "repo:PedroVictor26/Ofix_version1 label:bug is:open"
})
```

### 2. **GitKraken MCP** (`mcp_gitkraken_*`)
**Use for:** Local git operations (status, commit, push, branch)

```javascript
// ✅ Check git status
mcp_gitkraken_git_status({ directory: "c:/path/to/ofix_new" })

// ✅ Commit changes
mcp_gitkraken_git_add_or_commit({
  action: "commit",
  directory: "c:/path/to/ofix_new",
  message: "Fix: correct Prisma field names in conversation history"
})

// ✅ Push to remote
mcp_gitkraken_git_push({ directory: "c:/path/to/ofix_new" })
```

### 3. **Pylance MCP** (`mcp_pylance_*`)
**Use for:** Python code analysis (if you add Python services)

```javascript
// ✅ Check Python syntax
mcp_pylance_mcp_s_pylanceSyntaxErrors({
  code: "def hello():\n  print('world')",
  pythonVersion: "3.11"
})

// ✅ Get workspace Python files
mcp_pylance_mcp_s_pylanceWorkspaceUserFiles({
  workspaceRoot: "file:///c:/path/to/project"
})
```

### 4. **Hugging Face MCP** (`mcp_evalstate_hf-_*`)
**Use for:** AI model search, dataset discovery, ML documentation

```javascript
// ✅ Search for models (useful for Agno alternatives)
mcp_evalstate_hf_model_search({
  query: "llama",
  task: "text-generation",
  sort: "downloads",
  limit: 5
})

// ✅ Get documentation for libraries
mcp_evalstate_hf_hf_doc_search({
  query: "transformers inference",
  product: "transformers"
})
```

### 5. **Context7 MCP** (`mcp_upstash_conte_*`)
**Use for:** Library documentation lookup

```javascript
// ✅ Get up-to-date docs for dependencies
mcp_upstash_conte_resolve_library_id({ libraryName: "prisma" })
mcp_upstash_conte_get_library_docs({ 
  context7CompatibleLibraryID: "/prisma/prisma",
  topic: "migrations"
})
```

### MCP Integration Patterns

**1. Code Search Before Editing:**
```javascript
// Always search before making similar changes
const results = await mcp_github_github_search_code({
  query: "processarAgendamento repo:PedroVictor26/Ofix_version1"
});
// Review patterns, then apply changes consistently
```

**2. Documentation-Driven Development:**
```javascript
// Resolve library documentation before implementing
const libId = await mcp_upstash_conte_resolve_library_id({ 
  libraryName: "express" 
});
const docs = await mcp_upstash_conte_get_library_docs({
  context7CompatibleLibraryID: libId,
  topic: "middleware"
});
// Use official patterns from docs
```

**3. Git Workflow Automation:**
```javascript
// 1. Check status
await mcp_gitkraken_git_status({ directory });

// 2. Stage and commit
await mcp_gitkraken_git_add_or_commit({
  action: "commit",
  directory,
  message: "feat: add retry logic to Agno AI calls"
});

// 3. Push
await mcp_gitkraken_git_push({ directory });

// 4. Create PR
await mcp_github_github_create_pull_request({
  owner: "PedroVictor26",
  repo: "Ofix_version1",
  title: "Add Agno AI retry mechanism",
  head: "feature/agno-retry",
  base: "main",
  body: "Implements 2-attempt retry with 45s/30s timeouts"
});
```

## Documentation References

- **Architecture:** `docs/README.md`
- **Agno Timeout Fix:** `docs/agente-matias/AGNO_TIMEOUT_FIX.md`
- **Deploy Guide:** `docs/deployment/DEPLOY_GUIDE.md`
- **Project History:** `docs/historico/HISTORICO_PROJETO.md`
