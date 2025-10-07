import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Plus, Search, User, AlertCircle, RefreshCw } from "lucide-react";
import toast from "react-hot-toast";

// Importações atualizadas
import { useClientesData } from "../hooks/useClientesData";
import {
  ClienteCard,
  ClienteCardSkeleton,
} from "../components/clientes/ClienteCard";
import ClienteModal from "../components/clientes/ClienteModal";
import VeiculoModal from "../components/clientes/VeiculoModal";
import ClienteDetalhes from "../components/clientes/ClienteDetalhes";
import DeleteClienteDialog from "../components/clientes/DeleteClienteDialog";
import { deleteCliente } from "../services/clientes.service";

// Componente de Erro com design refinado
const ErrorState = ({ error, onRetry }) => (
  <div className="flex items-center justify-center min-h-[60vh]">
    <div className="text-center p-8">
      <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
      <h2 className="text-xl font-semibold text-slate-700 mb-2">
        Oops! Algo deu errado.
      </h2>
      <p className="text-slate-500 mb-6">
        Não foi possível carregar os dados. Tente novamente.
      </p>
      <Button onClick={onRetry} variant="destructive">
        <RefreshCw className="w-4 h-4 mr-2" />
        Tentar Novamente
      </Button>
    </div>
  </div>
);

// Componente de Estado Vazio com design refinado
const EmptyState = ({ onNewCliente, searchTerm }) => (
  <div className="text-center py-16 px-6 bg-white rounded-xl border border-slate-200">
    <User className="w-12 h-12 mx-auto mb-4 text-slate-400" />
    <h3 className="text-xl font-semibold text-slate-700 mb-2">
      Nenhum cliente encontrado
    </h3>
    <p className="text-slate-500 mb-6">
      {searchTerm
        ? "Tente ajustar sua busca."
        : "Clique no botão abaixo para começar."}
    </p>
    <Button onClick={onNewCliente}>
      <Plus className="w-4 h-4 mr-2" />
      Adicionar Novo Cliente
    </Button>
  </div>
);

export default function Clientes() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCliente, setSelectedCliente] = useState(null);
  const [editingCliente, setEditingCliente] = useState(null);
  const [deletingCliente, setDeletingCliente] = useState(null);

  const [isClienteModalOpen, setClienteModalOpen] = useState(false);
  const [isVeiculoModalOpen, setVeiculoModalOpen] = useState(false);
  const [isDetalhesOpen, setDetalhesOpen] = useState(false);
  const [isDeleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const {
    clientes,
    isLoading,
    error,
    loadData,
    getVeiculosByCliente,
    getServicosByCliente,
  } = useClientesData();

  const filteredClientes = useMemo(
    () =>
      clientes.filter((cliente) => {
        const termo = searchTerm.toLowerCase();
        return (
          cliente.nomeCompleto?.toLowerCase().includes(termo) ||
          cliente.telefone?.includes(termo) ||
          cliente.email?.toLowerCase().includes(termo)
        );
      }),
    [clientes, searchTerm]
  );

  const handleClienteClick = (cliente) => {
    setSelectedCliente(cliente);
    setDetalhesOpen(true);
  };

  const handleNewCliente = () => {
    setEditingCliente(null);
    setClienteModalOpen(true);
  };

  const handleEditCliente = (cliente) => {
    setEditingCliente(cliente);
    setClienteModalOpen(true);
  };

  const handleDeleteCliente = (cliente) => {
    setDeletingCliente(cliente);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!deletingCliente) return;

    setIsDeleting(true);
    try {
      console.log("Iniciando exclusão do cliente:", deletingCliente);
      await deleteCliente(deletingCliente.id);
      toast.success(
        `Cliente ${deletingCliente.nomeCompleto} excluído com sucesso!`
      );
      await loadData(); // Recarrega a lista de clientes
      setDeleteDialogOpen(false);
      setDeletingCliente(null);
    } catch (error) {
      console.error("Erro ao excluir cliente:", error);
      toast.error(error.message || "Erro ao excluir cliente. Tente novamente.");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleAddVeiculo = () => {
    console.log("handleAddVeiculo called. selectedCliente:", selectedCliente); // Log para depuração
    if (!selectedCliente) {
      toast.error("Selecione um cliente primeiro para adicionar um veículo.");
      return;
    }
    setVeiculoModalOpen(true);
  };

  const handleClienteSuccess = () => {
    setClienteModalOpen(false);
    setEditingCliente(null);
    loadData();
  };

  const handleVeiculoSuccess = () => {
    setVeiculoModalOpen(false);
    loadData();
  };

  if (error) {
    return (
      <div className="p-2">
        <ErrorState error={error} onRetry={loadData} />
      </div>
    );
  }

  return (
    <div className="p-2">
      <div className="w-full">
        {/* Header */}
        <header className="mb-2">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold text-slate-800">
                Gestão de Clientes
              </h1>
              <p className="text-slate-500 mt-1">
                Visualize, adicione e gerencie seus clientes.
              </p>
            </div>
            <Button
              onClick={handleNewCliente}
              size="lg"
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Plus className="w-5 h-5 mr-2" />
              Novo Cliente
            </Button>
          </div>
        </header>

        {/* Search */}
        <div className="mb-2">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none" />
            <Input
              placeholder="Buscar por nome, telefone ou email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-11 pr-4 py-3 text-base h-12 rounded-lg border-slate-300 focus:border-blue-500 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Lista de Clientes */}
        <main className="grid gap-4">
          {isLoading ? (
            Array(3)
              .fill(0)
              .map((_, i) => <ClienteCardSkeleton key={i} />)
          ) : filteredClientes.length > 0 ? (
            filteredClientes.map((cliente) => (
              <ClienteCard
                key={cliente.id}
                cliente={cliente}
                veiculos={getVeiculosByCliente(cliente.id)}
                servicos={getServicosByCliente(cliente.id)}
                onCardClick={handleClienteClick}
                onEditClick={handleEditCliente}
                onDeleteClick={handleDeleteCliente}
              />
            ))
          ) : (
            <EmptyState
              onNewCliente={handleNewCliente}
              searchTerm={searchTerm}
            />
          )}
        </main>
      </div>

      {/* Modals */}
      <ClienteModal
        isOpen={isClienteModalOpen}
        onClose={() => setClienteModalOpen(false)}
        cliente={editingCliente}
        onSuccess={handleClienteSuccess}
      />
      <VeiculoModal
        isOpen={isVeiculoModalOpen}
        onClose={() => setVeiculoModalOpen(false)}
        clienteId={selectedCliente?.id}
        onSuccess={handleVeiculoSuccess}
      />
      <ClienteDetalhes
        isOpen={isDetalhesOpen}
        onClose={() => setDetalhesOpen(false)}
        cliente={selectedCliente}
        veiculos={
          selectedCliente ? getVeiculosByCliente(selectedCliente.id) : []
        }
        servicos={
          selectedCliente ? getServicosByCliente(selectedCliente.id) : []
        }
        onEditCliente={handleEditCliente}
        onAddVeiculo={handleAddVeiculo}
        onDeleteCliente={handleDeleteCliente}
      />
      <DeleteClienteDialog
        isOpen={isDeleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        cliente={deletingCliente}
        onConfirm={handleConfirmDelete}
        isDeleting={isDeleting}
      />
    </div>
  );
}
