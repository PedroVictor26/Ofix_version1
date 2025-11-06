# Stack Tecnológico OFIX

## Linguagens de Programação

### JavaScript (ES6+)
- **Versão**: ES2020+ com módulos ESM
- **Uso**: Frontend e Backend
- **Type**: `"type": "module"` em ambos package.json

### TypeScript (Parcial)
- **Arquivos**: Configurações Vite e alguns utilitários
- **Configs**: tsconfig.json, tsconfig.node.json
- **Uso**: Tipagem opcional em arquivos .ts

## Frontend

### Core Framework
- **React 18.2.0** - Biblioteca UI com Concurrent Features
- **React DOM 18.2.0** - Renderização DOM
- **React Router DOM 6.23.1** - Roteamento SPA

### Build Tool
- **Vite 7.1.4** - Build tool ultrarrápido
  - Hot Module Replacement (HMR)
  - Build otimizado para produção
  - Plugin React oficial (@vitejs/plugin-react 4.3.0)

### Estilização
- **Tailwind CSS 3.4.4** - Utility-first CSS framework
- **PostCSS 8.4.38** - Processador CSS
- **Autoprefixer 10.4.19** - Prefixos CSS automáticos
- **tailwindcss-animate 1.0.7** - Animações Tailwind
- **Framer Motion 12.19.2** - Animações avançadas

### UI Components
- **Radix UI** - Componentes acessíveis headless
  - @radix-ui/react-dialog 1.1.14
  - @radix-ui/react-select 2.2.5
  - @radix-ui/react-tabs 1.1.12
  - @radix-ui/react-tooltip 1.2.7
  - @radix-ui/react-checkbox 1.3.2
  - @radix-ui/react-alert-dialog 1.1.15
  - @radix-ui/react-scroll-area 1.2.9
  - @radix-ui/react-separator 1.1.7
  - @radix-ui/react-label 2.1.7
  - @radix-ui/react-slot 1.2.3
- **Lucide React 0.525.0** - Ícones modernos
- **Recharts 2.12.7** - Gráficos e visualizações

### Drag and Drop
- **@dnd-kit/core 6.3.1** - Core DnD
- **@dnd-kit/sortable 10.0.0** - Listas ordenáveis (Kanban)

### Formulários e Validação
- **React Hook Form 7.64.0** - Gerenciamento de formulários
- **@hookform/resolvers 5.2.2** - Resolvers de validação
- **Yup 1.7.1** - Schema validation
- **react-input-mask 2.0.4** - Máscaras de input

### HTTP Client
- **Axios 1.10.0** - Cliente HTTP com interceptors

### Utilitários
- **date-fns 4.1.0** - Manipulação de datas
- **lodash 4.17.21** - Utilitários JavaScript
- **clsx 2.1.1** - Construção de classNames
- **class-variance-authority 0.7.1** - Variantes de componentes
- **tailwind-merge 2.3.0** - Merge de classes Tailwind
- **dompurify 3.3.0** - Sanitização HTML
- **react-hot-toast 2.5.2** - Notificações toast

### Testing
- **Vitest 3.2.4** - Test runner (compatível com Vite)
- **@vitest/ui 3.2.4** - UI para testes
- **@testing-library/react 16.3.0** - Testing utilities
- **@testing-library/jest-dom 6.9.1** - Matchers customizados
- **jsdom 27.0.1** - DOM implementation para testes

### Linting
- **ESLint 9.30.0** - Linter JavaScript
- **@eslint/js 9.30.0** - Configuração base
- **eslint-plugin-react 7.37.5** - Regras React
- **eslint-plugin-react-hooks 5.2.0** - Regras Hooks
- **eslint-plugin-react-refresh 0.4.20** - Regras HMR
- **globals 16.3.0** - Variáveis globais

## Backend

### Runtime e Framework
- **Node.js** - Runtime JavaScript (requer 18+)
- **Express 4.18.2** - Framework web minimalista

### Database
- **PostgreSQL** - Banco de dados relacional
- **Prisma 5.0.0** - ORM moderno
  - @prisma/client 5.0.0 - Cliente Prisma
  - Migrations automáticas
  - Type-safe queries

### Autenticação
- **jsonwebtoken 9.0.0** - JWT tokens
- **bcryptjs 2.4.3** - Hash de senhas

### IA e Machine Learning
- **openai 5.19.1** - SDK OpenAI oficial
- **@huggingface/inference 4.7.1** - Hugging Face API
- **node-fetch 2.7.0** - HTTP client para IA APIs

### Utilitários Backend
- **cors 2.8.5** - CORS middleware
- **dotenv 16.6.1** - Variáveis de ambiente
- **multer 1.4.5-lts.1** - Upload de arquivos
- **node-cron 4.2.1** - Agendamento de tarefas
- **ws 8.18.3** - WebSocket server
- **form-data 4.0.4** - Multipart form data

### Development
- **nodemon 3.1.10** - Auto-restart em desenvolvimento
- **sucrase 3.29.0** - Transpilador rápido

## Scripts de Desenvolvimento

### Frontend

```bash
# Desenvolvimento
npm run dev              # Inicia Vite dev server (porta 5173)

# Build
npm run build            # Build para produção
npm run build:prod       # Build com modo production explícito
npm run preview          # Preview do build

# Qualidade de Código
npm run lint             # Executa ESLint
npm run lint:fix         # Corrige problemas ESLint
npm run audit:security   # Auditoria de segurança
npm run audit:lint:json  # Relatório ESLint em JSON
npm run audit:all        # Todas as auditorias

# Testes
npm test                 # Executa testes em watch mode
npm run test:ui          # UI interativa de testes
npm run test:run         # Executa testes uma vez
npm run test:coverage    # Cobertura de testes
```

### Backend

```bash
# Desenvolvimento
npm run dev              # Inicia com nodemon (auto-reload)

# Produção
npm start                # Inicia servidor Node.js

# Database
npm run prisma:migrate   # Executa migrations
npm run prisma:studio    # Interface visual do banco
```

## Configurações de Build

### Vite (vite.config.ts)
- Plugin React com Fast Refresh
- Alias de paths (@/ para src/)
- Otimizações de build
- Configuração de proxy para API

### Tailwind (tailwind.config.js)
- Content paths para purge CSS
- Tema customizado
- Plugins: tailwindcss-animate
- Dark mode support

### PostCSS (postcss.config.js)
- Tailwind CSS
- Autoprefixer

### ESLint (eslint.config.js)
- Configuração flat config (ESLint 9)
- Regras React e Hooks
- Globals para browser

## Variáveis de Ambiente

### Frontend (.env)
```
VITE_API_BASE_URL=https://ofix-backend-prod.onrender.com
VITE_ENABLE_VOICE=true
VITE_ENABLE_AI=true
```

### Backend (.env)
```
DATABASE_URL=postgresql://...
JWT_SECRET=...
OPENAI_API_KEY=...
HUGGINGFACE_API_KEY=...
AGNO_API_KEY=...
PORT=3000
NODE_ENV=production
```

## Deploy

### Frontend
- **Plataformas**: Netlify, Vercel
- **Build Command**: `npm run build`
- **Output Directory**: `dist`
- **Configurações**: netlify.toml, vercel.json

### Backend
- **Plataforma**: Render
- **Start Command**: `npm start`
- **Build Command**: `npm install && npx prisma generate`
- **Health Check**: `/api/health`

## Dependências de Sistema

### Requisitos Mínimos
- Node.js 18+ (recomendado 20+)
- npm 9+ ou yarn 1.22+
- PostgreSQL 14+ (produção)
- 2GB RAM mínimo

### Desenvolvimento
- Git 2.30+
- Editor com ESLint support
- Navegador moderno (Chrome/Firefox/Edge)

## Estrutura de Módulos

### Frontend (ESM)
```javascript
// Imports nomeados
import { useState, useEffect } from 'react'
import { api } from '@/services/api'

// Default exports
import Dashboard from '@/pages/Dashboard'
```

### Backend (ESM)
```javascript
// Imports nomeados
import express from 'express'
import { PrismaClient } from '@prisma/client'

// Exports nomeados
export const router = express.Router()
export class AIService { }
```

## Padrões de Código

### Naming Conventions
- **Componentes**: PascalCase (Dashboard.jsx)
- **Hooks**: camelCase com prefixo use (useClientesData.js)
- **Services**: camelCase com sufixo .service (clientes.service.js)
- **Utils**: camelCase (dateUtils.js)
- **Constants**: UPPER_SNAKE_CASE

### File Extensions
- **.jsx** - Componentes React
- **.js** - JavaScript puro, hooks, services
- **.ts** - TypeScript (configs)
- **.css** - Estilos globais

### Import Order
1. React e bibliotecas externas
2. Componentes internos
3. Hooks customizados
4. Services e utils
5. Estilos e assets
