import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search, Building2 } from "lucide-react";

import { useEstoqueData } from "@/hooks/useEstoqueData";
import EstoqueStats from "@/components/estoque/EstoqueStats";
import PecasListTable from "@/components/estoque/PecasListTable";
import PecaModal from "@/components/estoque/PecaModal";
import FornecedorModal from "@/components/estoque/FornecedorModal";

export default function Estoque() {
  const { pecas, fornecedores, stats, isLoading, error, reload } =
    useEstoqueData();
  const [searchTerm, setSearchTerm] = useState("");
  const [editingPeca, setEditingPeca] = useState(null);
  const [isPecaModalOpen, setPecaModalOpen] = useState(false);
  const [isFornecedorModalOpen, setFornecedorModalOpen] = useState(false);

  const filteredPecas = useMemo(() => {
    const term = searchTerm.toLowerCase();
    if (!term) return pecas;
    return pecas.filter(
      (p) =>
        p.nome.toLowerCase().includes(term) ||
        p.sku.toLowerCase().includes(term)
    );
  }, [pecas, searchTerm]);

  const handleNewPeca = () => {
    setEditingPeca(null);
    setPecaModalOpen(true);
  };

  const handleEditPeca = (peca) => {
    setEditingPeca(peca);
    setPecaModalOpen(true);
  };

  const handleModalSuccess = () => {
    reload();
    setPecaModalOpen(false);
    setFornecedorModalOpen(false);
  };

  return (
    <div className="p-2">
      <div className="w-full">
        {/* Header */}
        <header className="mb-2">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold text-slate-800 dark:text-slate-100">
                Controle de Estoque
              </h1>
              <p className="text-slate-500 dark:text-slate-400 mt-1">
                Gerencie suas peças e fornecedores.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                onClick={() => setFornecedorModalOpen(true)}
                className="bg-purple-600 hover:bg-purple-700 text-white border-purple-600"
              >
                <Building2 className="w-4 h-4 mr-2" />
                Novo Fornecedor
              </Button>
              <Button
                onClick={handleNewPeca}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <Plus className="w-4 h-4 mr-2" />
                Nova Peça
              </Button>
            </div>
          </div>
        </header>

        {/* Stats */}
        <section className="mb-2">
          <EstoqueStats stats={stats} isLoading={isLoading} />
        </section>

        {/* Tabela e Filtros */}
        <main className="bg-white dark:bg-slate-900 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-slate-800 dark:text-slate-100">
              Peças em Estoque
            </h2>
            <div className="relative w-full max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none" />
              <Input
                placeholder="Buscar por nome ou SKU..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500"
              />
            </div>
          </div>
          <PecasListTable
            pecas={filteredPecas}
            fornecedores={fornecedores}
            onEditPeca={handleEditPeca}
          />
        </main>
      </div>

      {/* Modals */}
      <PecaModal
        isOpen={isPecaModalOpen}
        onClose={() => setPecaModalOpen(false)}
        peca={editingPeca}
        fornecedores={fornecedores}
        onSuccess={handleModalSuccess}
      />
      <FornecedorModal
        isOpen={isFornecedorModalOpen}
        onClose={() => setFornecedorModalOpen(false)}
        onSuccess={handleModalSuccess}
      />
    </div>
  );
}
