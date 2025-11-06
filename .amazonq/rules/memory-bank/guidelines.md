# Diretrizes de Desenvolvimento OFIX

## Padrões de Código e Qualidade

### Estrutura de Arquivos

**Naming Conventions:**
- Componentes React: PascalCase com extensão .jsx (Dashboard.jsx, KanbanBoard.jsx)
- Hooks customizados: camelCase com prefixo "use" (useDashboardData.js, useClientesData.js)
- Services: camelCase com sufixo ".service" (clientes.service.js, servicos.service.js)
- Controllers: camelCase com sufixo ".controller" (clientes.controller.js)
- Routes: camelCase com sufixo ".routes" (clientes.routes.js)
- Utils: camelCase (dateUtils.js, validation.js)
- Constants: camelCase ou UPPER_SNAKE_CASE para valores (statusConfig.js)

**Extensões de Arquivo:**
- .jsx para componentes React com JSX
- .js para JavaScript puro, hooks, services, controllers
- .ts para arquivos TypeScript (configs)

### Formatação e Estilo

**Imports:**
Ordem padrão de imports:
```javascript
// 1. React e bibliotecas externas
import { useState, useEffect, useMemo } from "react";
import { Plus, Search, X } from "lucide-react";

// 2. Componentes UI e internos
import { Button } from "@/components/ui/button";
import KanbanBoard from "@/components/dashboard/KanbanBoard";

// 3. Hooks customizados
import useDashboardData from "@/hooks/useDashboardData";

// 4. Services e utils
import * as servicosService from "../services/servicos.service.js";
import { statusConfig } from "@/constants/statusConfig";
```

**Alias de Path:**
- Use `@/` para imports do diretório src/
- Exemplo: `import { Button } from "@/components/ui/button"`

**Aspas:**
- Use aspas duplas para strings: `"texto"`
- Consistente em todo o projeto

**Ponto e vírgula:**
- Use ponto e vírgula ao final de statements
- Exemplo: `const data = await api.get("/clientes");`

### Comentários e Documentação

**JSDoc para Funções:**
```javascript
/**
 * Detecta a intenção principal da mensagem do usuário
 * @param {string} mensagem - Mensagem do usuário
 * @returns {string} - Tipo de intenção detectada
 */
static detectarIntencao(mensagem) {
    // implementação
}
```

**Comentários Inline:**
- Use comentários descritivos para lógica complexa
- Emojis são aceitos para categorização visual:
```javascript
// 1. EXTRAIR DIA DA SEMANA
// 2. EXTRAIR HORA
// 🔍 DEBUG CADASTRO:
// ✅ DETECTADO COMO CADASTRAR_CLIENTE
```

**Comentários de Seção:**
```javascript
// ============================================
// INTENÇÃO: AGENDAMENTO
// ============================================
```

## Padrões Arquiteturais

### Frontend - React

**1. Custom Hooks Pattern**

Separe lógica de negócio da UI usando hooks customizados:

```javascript
// hooks/useDashboardData.js
export default function useDashboardData() {
    const [servicos, setServicos] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    const loadData = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const result = await servicosService.getAllServicos();
            setServicos(result || []);
        } catch (err) {
            setError(err.message);
            toast.error(err.message);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        loadData();
    }, [loadData]);

    return { servicos, isLoading, error, reload: loadData };
}
```

**Características:**
- Estado local encapsulado
- Função reload exposta para recarregar dados
- Tratamento de erro integrado
- Loading state gerenciado
- useCallback para evitar re-renders desnecessários

**2. Service Layer Pattern**

Centralize chamadas de API em services:

```javascript
// services/clientes.service.js
import apiClient from "./api";

export const getAllClientes = async (retryCount = 0) => {
  try {
    const response = await apiClient.get("/clientes");
    return response.data;
  } catch (error) {
    console.log("Erro ao buscar clientes:", error.response?.data || error.message);
    
    // Retry logic para erros 500
    if (retryCount < MAX_RETRIES && error.response?.status === 500) {
      await sleep(RETRY_DELAY);
      return getAllClientes(retryCount + 1);
    }
    
    throw error;
  }
};
```

**Características:**
- Funções exportadas nomeadas (não default export)
- Retry logic para falhas temporárias
- Logging consistente de erros
- Retorna response.data diretamente
- Validação de parâmetros obrigatórios

**3. Component Composition**

Componentes pequenos e focados:

```javascript
// Skeleton separado do componente principal
const KanbanBoardSkeleton = ({ statusConfig }) => (
    <div className="flex gap-6 overflow-x-auto pb-4">
        {Object.keys(statusConfig).map((status) => (
            <div key={status} className="flex-shrink-0 w-80">
                <Skeleton className="h-32 w-full rounded-xl" />
            </div>
        ))}
    </div>
);

// Componente principal
export default function KanbanBoard({ servicos, clientes, veiculos, onServiceClick, statusConfig, isLoading }) {
    if (isLoading) {
        return <KanbanBoardSkeleton statusConfig={statusConfig} />;
    }
    
    return (
        <div className="flex gap-6 overflow-x-auto pb-4">
            {/* conteúdo */}
        </div>
    );
}
```

**4. Error Handling Pattern**

Estados de erro dedicados:

```javascript
const ErrorState = ({ error, onRetry }) => (
  <div className="flex items-center justify-center min-h-[60vh]">
    <div className="text-center p-8">
      <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
      <h2 className="text-xl font-semibold text-slate-700 mb-2">
        Oops! Algo deu errado.
      </h2>
      <p className="text-slate-500 mb-6">{error}</p>
      <Button onClick={onRetry} variant="destructive">
        <RefreshCw className="w-4 h-4 mr-2" />
        Tentar Novamente
      </Button>
    </div>
  </div>
);
```

**5. Optimistic Updates**

Atualize UI imediatamente, reverta em caso de erro:

```javascript
const handleDragEnd = async (event) => {
    const { active, over } = event;
    const activeId = active.id.toString();
    const newStatus = over.id.toString();
    
    // Backup do estado original
    const originalServicos = [...localServicos];
    
    // Atualização otimista
    setLocalServicos((prev) =>
        prev.map((s) =>
            s.id.toString() === activeId ? { ...s, status: newStatus } : s
        )
    );

    try {
        await servicosService.updateServico(activeId, { status: newStatus });
    } catch (err) {
        console.error("Falha ao atualizar status:", err);
        // Reverte em caso de erro
        setLocalServicos(originalServicos);
    }
};
```

**6. useMemo para Performance**

Use useMemo para cálculos pesados:

```javascript
const stats = useMemo(
    () => ({
        total: filteredServicos.length,
        ...Object.keys(statusConfig).reduce((acc, key) => {
            acc[key] = filteredServicos.filter((s) => s.status === key).length;
            return acc;
        }, {}),
    }),
    [filteredServicos]
);
```

**7. Promise.allSettled Pattern**

Carregue múltiplos recursos em paralelo sem falhar tudo:

```javascript
const [servicosResult, clientesResult, veiculosResult] = await Promise.allSettled([
    servicosService.getAllServicos(),
    getAllClientes(),
    getAllVeiculos()
]);

if (servicosResult.status === 'fulfilled') {
    setServicos(servicosResult.value || []);
} else {
    console.error('Erro ao carregar serviços:', servicosResult.reason);
    toast.error("Falha ao carregar serviços.");
}
```

### Backend - Node.js/Express

**1. Controller Pattern**

Controllers como classes com métodos async:

```javascript
// controllers/clientes.controller.js
import prisma from "../config/database.js";

class ClientesController {
  async createCliente(req, res, next) {
    try {
      const { nomeCompleto, cpfCnpj, telefone, email, endereco } = req.body;
      const oficinaId = req.user?.oficinaId;

      // Validação de autorização
      if (!oficinaId) {
        return res.status(401).json({ 
          error: "Oficina não identificada. Acesso não autorizado." 
        });
      }

      // Validação de dados obrigatórios
      if (!nomeCompleto || !telefone) {
        return res.status(400).json({ 
          error: "Nome completo e telefone são obrigatórios." 
        });
      }

      const novoCliente = await prisma.cliente.create({
        data: {
          nomeCompleto,
          cpfCnpj,
          telefone,
          email,
          endereco,
          oficina: { connect: { id: oficinaId } },
        },
      });
      
      res.status(201).json(novoCliente);
    } catch (error) {
      // Tratamento de erros específicos do Prisma
      if (error.code === "P2002" && error.meta?.target?.includes("cpfCnpj")) {
        return res.status(409).json({ error: "CPF/CNPJ já cadastrado." });
      }
      next(error);
    }
  }

  async getAllClientes(req, res, next) {
    try {
      const oficinaId = req.user?.oficinaId;
      if (!oficinaId) {
        return res.status(401).json({ error: "Oficina não identificada." });
      }

      const clientes = await prisma.cliente.findMany({
        where: { oficinaId },
        include: { veiculos: true },
        orderBy: { nomeCompleto: "asc" },
      });
      
      res.json(clientes);
    } catch (error) {
      next(error);
    }
  }
}

export default new ClientesController();
```

**Características:**
- Classe com métodos async
- Export de instância única (singleton)
- Validação de oficinaId em todas as operações
- Validação de dados obrigatórios
- Tratamento de erros Prisma específicos (P2002 = unique constraint)
- Status HTTP apropriados (201, 400, 401, 404, 409)
- next(error) para erros não tratados

**2. Routes Pattern**

Rotas declarativas com middlewares:

```javascript
// routes/clientes.routes.js
import { Router } from 'express';
import clientesController from '../controllers/clientes.controller.js';
import { validateClienteData, validateVeiculoData, validateUUID } from '../middlewares/validation.middleware.js';

const router = Router();

router.post('/', validateClienteData, clientesController.createCliente);
router.get('/', clientesController.getAllClientes);
router.get('/:id', validateUUID('id'), clientesController.getClienteById);
router.put('/:id', validateUUID('id'), validateClienteData, clientesController.updateCliente);
router.delete('/:id', validateUUID('id'), clientesController.deleteCliente);
router.post('/:clienteId/veiculos', validateUUID('clienteId'), validateVeiculoData, clientesController.createVeiculo);

export default router;
```

**Características:**
- Middlewares de validação antes dos controllers
- Rotas RESTful (GET, POST, PUT, DELETE)
- Validação de UUID para parâmetros de rota
- Rotas aninhadas para recursos relacionados

**3. Prisma Transactions**

Use transações para operações atômicas:

```javascript
await prisma.$transaction(async (tx) => {
    // Primeiro, excluir todos os serviços relacionados
    if (clienteExistente.servicos.length > 0) {
        await tx.servico.deleteMany({
            where: { clienteId: id },
        });
    }

    // Depois, excluir todos os veículos relacionados
    if (clienteExistente.veiculos.length > 0) {
        await tx.veiculo.deleteMany({
            where: { clienteId: id },
        });
    }

    // Por fim, excluir o cliente
    await tx.cliente.delete({
        where: { id, oficinaId },
    });
});
```

**4. Prisma Include Pattern**

Carregue relações necessárias:

```javascript
const clientes = await prisma.cliente.findMany({
    where: { oficinaId },
    include: { veiculos: true }, // Inclui veículos relacionados
    orderBy: { nomeCompleto: "asc" },
});
```

**5. Conditional Updates**

Filtre campos undefined antes de atualizar:

```javascript
const { nomeCompleto, cpfCnpj, telefone, email, endereco } = req.body;
const updateData = {};

if (nomeCompleto !== undefined) updateData.nomeCompleto = nomeCompleto;
if (cpfCnpj !== undefined) updateData.cpfCnpj = cpfCnpj;
if (telefone !== undefined) updateData.telefone = telefone;
if (email !== undefined) updateData.email = email;
if (endereco !== undefined) updateData.endereco = endereco;

const clienteAtualizado = await prisma.cliente.update({
    where: { id, oficinaId },
    data: updateData,
});
```

## Padrões de UI/UX

### Tailwind CSS

**Classes Utilitárias:**
- Use classes Tailwind diretamente nos componentes
- Agrupe classes relacionadas: `"flex items-center gap-4"`
- Use breakpoints responsivos: `"grid grid-cols-2 md:grid-cols-4"`

**Cores Consistentes:**
- Primary: `blue-600`, `blue-700`
- Success: `green-600`
- Warning: `yellow-600`
- Danger: `red-600`, `red-400`
- Neutral: `slate-50`, `slate-100`, `slate-200`, `slate-500`, `slate-700`, `slate-800`

**Espaçamento:**
- Gaps: `gap-2`, `gap-4`, `gap-6`
- Padding: `p-2`, `p-4`, `p-5`, `p-8`
- Margin: `mb-2`, `mb-4`, `mb-6`

### Skeleton Loading

Sempre forneça skeleton states:

```javascript
if (isLoading) {
    return <KanbanBoardSkeleton statusConfig={statusConfig} />;
}
```

### Toast Notifications

Use react-hot-toast para feedback:

```javascript
import toast from "react-hot-toast";

// Sucesso
toast.success("Cliente criado com sucesso!");

// Erro
toast.error("Falha ao carregar dados.");

// Loading
const toastId = toast.loading("Salvando...");
toast.success("Salvo!", { id: toastId });
```

### Ícones Lucide

Use ícones Lucide React consistentemente:

```javascript
import { Plus, Search, X, AlertCircle, RefreshCw } from "lucide-react";

<Plus className="w-5 h-5 mr-2" />
<Search className="w-4 h-4 text-slate-400" />
```

## Tratamento de Erros

### Frontend

**1. Try-Catch em Async Functions:**
```javascript
try {
    const result = await api.get("/endpoint");
    setData(result);
} catch (error) {
    console.error("Erro:", error);
    toast.error(error.message || "Erro desconhecido");
    setError(error.message);
}
```

**2. Error Boundaries:**
Use ErrorBoundary para capturar erros de renderização

**3. Validação de Dados:**
```javascript
if (!id) throw new Error("ID é obrigatório.");
```

### Backend

**1. Status HTTP Apropriados:**
- 200: OK
- 201: Created
- 204: No Content (delete)
- 400: Bad Request (validação)
- 401: Unauthorized
- 404: Not Found
- 409: Conflict (unique constraint)
- 500: Internal Server Error

**2. Mensagens de Erro Descritivas:**
```javascript
return res.status(400).json({ 
    error: "Nome completo e telefone são obrigatórios." 
});
```

**3. Logging:**
```javascript
console.error("Erro ao excluir cliente:", error);
console.log("Dados recebidos:", data);
```

## Segurança

### Autenticação

**JWT em Todas as Rotas Protegidas:**
```javascript
const oficinaId = req.user?.oficinaId;
if (!oficinaId) {
    return res.status(401).json({ error: "Oficina não identificada." });
}
```

**Validação de Propriedade:**
```javascript
const cliente = await prisma.cliente.findUnique({
    where: { id, oficinaId }, // Garante que o cliente pertence à oficina
});
```

### Validação

**Middlewares de Validação:**
- validateClienteData
- validateVeiculoData
- validateUUID

**Sanitização:**
- Use DOMPurify para conteúdo HTML
- Valide tipos de dados

## Performance

### Frontend

**1. useCallback para Funções:**
```javascript
const loadData = useCallback(async () => {
    // implementação
}, []);
```

**2. useMemo para Cálculos:**
```javascript
const stats = useMemo(() => {
    // cálculo pesado
}, [dependencies]);
```

**3. Lazy Loading:**
- Code splitting com React.lazy
- Carregamento sob demanda

### Backend

**1. Índices no Banco:**
- Prisma cria índices automáticos para unique fields
- Adicione índices customizados para queries frequentes

**2. Select Específico:**
```javascript
const clientes = await prisma.cliente.findMany({
    select: { id: true, nomeCompleto: true, telefone: true }
});
```

**3. Paginação:**
```javascript
const clientes = await prisma.cliente.findMany({
    skip: (page - 1) * limit,
    take: limit,
});
```

## Testes

### Estrutura de Testes

```
tests/
├── unit/           # Testes unitários
├── integration/    # Testes de integração
└── e2e/           # Testes end-to-end
```

### Ferramentas

- **Vitest** - Test runner frontend
- **@testing-library/react** - Testes de componentes
- **jsdom** - DOM para testes

## Convenções Específicas do Projeto

### Status de Serviços

Use enum definido:
```javascript
const statusConfig = {
    AGUARDANDO: { title: "Aguardando", color: "yellow" },
    EM_ANDAMENTO: { title: "Em Andamento", color: "blue" },
    FINALIZADO: { title: "Finalizado", color: "green" },
};
```

### Estrutura de Dados

**Cliente:**
- nomeCompleto (obrigatório)
- telefone (obrigatório)
- cpfCnpj (único)
- email (único)
- endereco

**Veículo:**
- placa (obrigatório, único)
- marca (obrigatório)
- modelo (obrigatório)
- anoFabricacao
- cor

### Debug e Logging

**Console Logs Estruturados:**
```javascript
console.log("🔍 DEBUG CADASTRO:");
console.log("   - Teste comando cadastro:", padraoCadastro.test(msg));
console.log("   ✅ DETECTADO COMO CADASTRAR_CLIENTE");
```

Use emojis para categorização visual em logs de desenvolvimento.
