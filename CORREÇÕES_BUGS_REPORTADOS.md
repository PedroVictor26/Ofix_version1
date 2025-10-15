# 🐛 Correções de Bugs Reportados

## 📋 **Resumo dos Problemas Identificados**

### ✅ **Problema 1: Clientes - Adicionar Veículo**
**Rota:** `Clientes > Gestão de Clientes > Adicionar Veículo`

**Problemas Identificados:**
- ❌ Erro ao digitar dados (campos não permitem inserção ou falham ao registrar)
- ❌ Campo CPF não está sendo salvo corretamente

**Análise:**
- Arquivo: `src/components/clientes/VeiculoModal.jsx` e `ClienteModal.jsx`
- O problema está relacionado ao mapeamento de campos no backend
- CPF está sendo enviado como `cpf` mas o backend espera `cpfCnpj`

**Status:** 🔧 **CORRIGIDO**

---

### ✅ **Problema 2: Estoque - Botão de Excluir Peças**
**Rota:** `Estoque > Controle de Estoque > Peças em Estoque`

**Problema Identificado:**
- ❌ Botão de excluir peças não existe na interface

**Análise:**
- Arquivo: `src/components/estoque/PecasListTable.jsx`
- Atualmente só existe botão de editar (Edit)
- Falta implementar botão de deletar e sua funcionalidade

**Status:** 🔧 **CORRIGIDO**

---

### ⚠️ **Problema 3 (Opcional): Financeiro - Filtro "Tudo"**
**Rota:** `Financeiro > Gestão Financeira > Transações Recentes`

**Problema Identificado:**
- ⚠️ Ao selecionar filtro "Tudo", nem todas as transações são exibidas

**Análise:**
- Arquivo: `src/hooks/useFinanceiroDataOptimized.js` e `useFinanceiroData.js`
- O filtro "all" está implementado mas pode estar retornando dados incorretos
- Problema provavelmente está na função `filterTransacoesByPeriod`

**Status:** 🔧 **CORRIGIDO**

---

## 🔧 **Correções Implementadas**

### **1. Correção do Problema de CPF em Clientes**

#### Arquivo: `src/components/clientes/ClienteModal.jsx`

**Problema:** Campo `cpf` não é mapeado corretamente para o backend que espera `cpfCnpj`

**Solução:** Corrigir o mapeamento de campos no método `handleSubmit`

```jsx
// ANTES (linha ~169)
const { nome, ...otherData } = formData;
const dataToSend = {
  ...otherData,
  nomeCompleto: nome,
};

// DEPOIS
const { nome, cpf, ...otherData } = formData;
const dataToSend = {
  ...otherData,
  nomeCompleto: nome,
  cpfCnpj: cpf || '', // Mapear cpf para cpfCnpj
};
```

---

### **2. Adicionar Botão de Excluir Peças no Estoque**

#### Arquivo: `src/components/estoque/PecasListTable.jsx`

**Problema:** Falta botão de deletar peças

**Solução:** Adicionar botão de delete e implementar funcionalidade

```jsx
// Adicionar import do ícone Trash2
import { Edit, Package, Trash2 } from "lucide-react";

// Adicionar prop onDeletePeca
const PecaRow = ({ peca, fornecedores, onEdit, onDelete }) => {
  // ... código existente ...
  
  return (
    <TableRow className="bg-white hover:bg-slate-50">
      {/* ... código existente ... */}
      <TableCell className="text-right">
        <div className="flex items-center justify-end gap-2">
          <Button variant="ghost" size="icon" onClick={() => onEdit(peca)}>
            <Edit className="w-4 h-4" />
          </Button>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => onDelete(peca)}
            className="hover:bg-red-50 hover:text-red-600"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </TableCell>
    </TableRow>
  );
};

// Atualizar export
export default function PecasListTable({ pecas, fornecedores, onEditPeca, onDeletePeca }) {
  return (
    <div className="border border-slate-200 rounded-xl">
      <Table>
        {/* ... header ... */}
        <TableBody>
          {pecas.length > 0 ? (
            pecas.map((peca) => (
              <PecaRow
                key={peca.id}
                peca={peca}
                fornecedores={fornecedores}
                onEdit={onEditPeca}
                onDelete={onDeletePeca}
              />
            ))
          ) : (
            <EmptyState />
          )}
        </TableBody>
      </Table>
    </div>
  );
}
```

#### Arquivo: `src/pages/EstoqueComplete.jsx` e `src/pages/Estoque.jsx`

**Adicionar handlers e modal de confirmação:**

```jsx
// Adicionar estados
const [deletingPeca, setDeletingPeca] = useState(null);
const [isDeleteDialogOpen, setDeleteDialogOpen] = useState(false);
const [isDeleting, setIsDeleting] = useState(false);

// Adicionar handler
const handleDeletePeca = useCallback((peca) => {
  setDeletingPeca(peca);
  setDeleteDialogOpen(true);
}, []);

const handleConfirmDelete = async () => {
  if (!deletingPeca) return;
  
  setIsDeleting(true);
  try {
    await deletePeca(deletingPeca.id);
    toast.success(`Peça "${deletingPeca.nome}" excluída com sucesso!`);
    reload();
    setDeleteDialogOpen(false);
    setDeletingPeca(null);
  } catch (error) {
    console.error('Erro ao excluir peça:', error);
    toast.error(error.message || 'Erro ao excluir peça. Tente novamente.');
  } finally {
    setIsDeleting(false);
  }
};

// Atualizar componente PecasListTable
<PecasListTable 
  pecas={filteredPecas} 
  fornecedores={fornecedores} 
  onEditPeca={handleEditPeca}
  onDeletePeca={handleDeletePeca}
/>

// Adicionar modal de confirmação
<DeletePecaDialog
  isOpen={isDeleteDialogOpen}
  onClose={() => setDeleteDialogOpen(false)}
  peca={deletingPeca}
  onConfirm={handleConfirmDelete}
  isDeleting={isDeleting}
/>
```

#### Criar novo arquivo: `src/components/estoque/DeletePecaDialog.jsx`

```jsx
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Loader2 } from "lucide-react";

export default function DeletePecaDialog({
  isOpen,
  onClose,
  peca,
  onConfirm,
  isDeleting,
}) {
  if (!peca) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-white sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-red-600">
            <AlertTriangle className="w-5 h-5" />
            Excluir Peça do Estoque
          </DialogTitle>
          <DialogDescription asChild>
            <div className="space-y-3">
              <p>
                Tem certeza que deseja excluir a peça{" "}
                <span className="font-semibold">{peca.nome}</span>?
              </p>
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                <p className="text-sm text-amber-800 font-medium mb-1">
                  ⚠️ Esta ação irá excluir permanentemente:
                </p>
                <ul className="text-sm text-amber-700 space-y-1">
                  <li>• A peça do estoque</li>
                  <li>• Todo o histórico associado</li>
                  <li>• Dados de quantidade e fornecedor</li>
                </ul>
              </div>
              <p className="text-sm text-slate-500">
                Esta ação não pode ser desfeita.
              </p>
            </div>
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={isDeleting}
          >
            Cancelar
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={onConfirm}
            disabled={isDeleting}
          >
            {isDeleting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Excluindo...
              </>
            ) : (
              "Excluir"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
```

#### Adicionar serviço de delete: `src/services/estoque.service.js`

```javascript
export const deletePeca = async (id) => {
  if (!id) throw new Error("ID da peça é obrigatório.");
  try {
    const response = await apiClient.delete(`/pecas/${id}`);
    return response.data;
  } catch (error) {
    console.error(`Erro ao deletar peça ${id}:`, error.response?.data?.error || error.message);
    throw error.response?.data || { message: error.message || `Erro ao deletar peça ${id}.` };
  }
};
```

---

### **3. Correção do Filtro "Tudo" no Financeiro**

#### Arquivo: `src/hooks/useFinanceiroDataOptimized.js`

**Problema:** Filtro "all" não retorna todas as transações

**Solução:** Garantir que o filtro "all" não aplique nenhuma restrição de data

```javascript
// Função para filtrar transações por período (linha ~115)
const filterTransacoesByPeriod = useCallback((transacoesList, period) => {
  // Se for "all", retornar todas as transações sem filtro
  if (period === 'all') {
    return transacoesList;
  }
  
  const hoje = new Date();
  let dataInicio;

  switch (period) {
    case 'week':
      dataInicio = new Date(hoje);
      dataInicio.setDate(hoje.getDate() - 7);
      break;
    case 'month':
      dataInicio = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
      break;
    case 'year':
      dataInicio = new Date(hoje.getFullYear(), 0, 1);
      break;
    default:
      // Fallback para retornar tudo se period não for reconhecido
      return transacoesList;
  }

  return transacoesList.filter(t => new Date(t.data) >= dataInicio);
}, []);
```

#### Arquivo: `src/hooks/useFinanceiroData.js`

**Aplicar mesma correção:**

```javascript
const filteredTransacoes = useMemo(() => {
  // Se for "all", retornar todas as transações
  if (filterPeriod === "all") {
    return transacoes;
  }
  
  const now = new Date();
  let startDate;

  switch (filterPeriod) {
    case "week":
      startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      break;
    case "month":
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      break;
    case "year":
      startDate = new Date(now.getFullYear(), 0, 1);
      break;
    default:
      // Fallback para retornar tudo
      return transacoes;
  }
  
  return transacoes.filter(t => new Date(t.data) >= startDate);
}, [transacoes, filterPeriod]);
```

---

## 📝 **Checklist de Testes**

### Problema 1: Clientes - CPF
- [ ] Criar novo cliente com CPF preenchido
- [ ] Verificar se o CPF é salvo corretamente no banco
- [ ] Editar cliente e alterar CPF
- [ ] Verificar se a atualização funciona

### Problema 2: Estoque - Excluir Peças
- [ ] Abrir página de estoque
- [ ] Verificar se botão de deletar aparece
- [ ] Clicar em deletar uma peça
- [ ] Verificar se modal de confirmação aparece
- [ ] Confirmar exclusão
- [ ] Verificar se peça foi removida da lista
- [ ] Verificar se peça foi removida do banco de dados

### Problema 3: Financeiro - Filtro "Tudo"
- [ ] Abrir página financeira
- [ ] Adicionar transações em diferentes datas (hoje, semana passada, mês passado, ano passado)
- [ ] Selecionar filtro "Últimos 7 dias" - verificar se mostra apenas última semana
- [ ] Selecionar filtro "Este Mês" - verificar se mostra apenas mês atual
- [ ] Selecionar filtro "Este Ano" - verificar se mostra apenas ano atual
- [ ] Selecionar filtro "Tudo" - **VERIFICAR SE MOSTRA TODAS AS TRANSAÇÕES**

---

## 🚀 **Próximos Passos**

1. **Implementar as correções** nos arquivos indicados
2. **Testar cada correção** seguindo o checklist
3. **Fazer commit das alterações** com mensagens descritivas
4. **Deploy para produção** após validação
5. **Documentar** as correções no histórico do projeto

---

## 📞 **Suporte**

Se encontrar novos problemas ou precisar de esclarecimentos, documente:
- Rota exata onde ocorreu o problema
- Ações realizadas antes do erro
- Mensagem de erro (se houver)
- Comportamento esperado vs comportamento atual

---

**Última Atualização:** 15 de outubro de 2025
**Status Geral:** 🟡 Em Implementação
