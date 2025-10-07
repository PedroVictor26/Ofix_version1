import { useState, useMemo, useEffect } from "react";
import { Plus, BarChart3, AlertCircle, RefreshCw, Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DndContext,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { sortableKeyboardCoordinates } from "@dnd-kit/sortable";

import useDashboardData from "@/hooks/useDashboardData";
import { statusConfig } from "@/constants/statusConfig";
import StatsCards, {
  StatsCardSkeleton,
} from "@/components/dashboard/StatsCards";
import KanbanBoard from "@/components/dashboard/KanbanBoard";
import ServiceModal from "@/components/dashboard/ServiceModal";
import NewServiceModal from "@/components/dashboard/NewServiceModal";
import * as servicosService from "../services/servicos.service.js";

// Componente de Erro Refinado
const ErrorState = ({ error, onRetry }) => (
  <div className="flex items-center justify-center min-h-[60vh]">
    <div className="text-center p-8">
      <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
      <h2 className="text-xl font-semibold text-slate-700 mb-2">
        Oops! Algo deu errado.
      </h2>
      <p className="text-slate-500 mb-6">
        Não foi possível carregar os dados do dashboard.
      </p>
      <Button onClick={onRetry} variant="destructive">
        <RefreshCw className="w-4 h-4 mr-2" />
        Tentar Novamente
      </Button>
    </div>
  </div>
);

export default function Dashboard() {
  const { servicos, clientes, veiculos, isLoading, error, reload } =
    useDashboardData();
  const [localServicos, setLocalServicos] = useState([]);
  const [selectedService, setSelectedService] = useState(null);
  const [isServiceModalOpen, setServiceModalOpen] = useState(false);
  const [isNewServiceModalOpen, setNewServiceModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredServicos, setFilteredServicos] = useState([]);

  useEffect(() => {
    setLocalServicos(servicos || []);
  }, [servicos]);

  // Função de busca inteligente
  const performSearch = useMemo(() => {
    if (!searchTerm.trim()) {
      return localServicos;
    }

    const term = searchTerm.toLowerCase().trim();
    
    return localServicos.filter((servico) => {
      // Buscar por número da OS
      if (servico.numeroOs?.toLowerCase().includes(term)) return true;
      
      // Buscar por descrição do problema
      if (servico.descricaoProblema?.toLowerCase().includes(term)) return true;
      
      // Buscar por nome do cliente
      const cliente = clientes[servico.clienteId];
      if (cliente?.nomeCompleto?.toLowerCase().includes(term)) return true;
      
      // Buscar por dados do veículo
      const veiculo = veiculos.find(v => 
        v.id === servico.veiculoId || v.id === servico.veiculo?.id
      );
      if (veiculo) {
        if (veiculo.marca?.toLowerCase().includes(term)) return true;
        if (veiculo.modelo?.toLowerCase().includes(term)) return true;
        if (veiculo.placa?.toLowerCase().includes(term)) return true;
      }
      
      return false;
    });
  }, [localServicos, searchTerm, clientes, veiculos]);

  // Atualizar serviços filtrados
  useEffect(() => {
    setFilteredServicos(performSearch);
  }, [performSearch]);

  // Função para limpar busca
  const clearSearch = () => {
    setSearchTerm("");
  };

  // Atalhos de teclado
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Ctrl/Cmd + K para focar na busca
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        document.querySelector('input[placeholder*="Buscar"]')?.focus();
      }
      // Escape para limpar busca
      if (e.key === 'Escape' && searchTerm) {
        clearSearch();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [searchTerm]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      // Exige que o mouse se mova 8px antes de ativar o arrasto, evitando conflitos com o clique.
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragEnd = async (event) => {
    const { active, over } = event;
    console.log("Drag End Event - active:", active); // Log para depuração
    console.log("Drag End Event - over:", over); // Log para depuração

    if (!over || over.data.current?.type !== "column") {
      console.error(
        "Solto fora de uma coluna válida ou tipo de destino incorreto:",
        over
      );
      return;
    }

    const activeId = active.id.toString();
    const newStatus = over.id.toString(); // over.id deve ser o ID da coluna (status key)
    const servicoArrastado = localServicos.find(
      (s) => s.id.toString() === activeId
    );

    // MAPA DE TRADUÇÃO: Converte o ID da coluna (frontend) para o valor do enum (backend)
    const statusMap = {
      AGUARDANDO: "AGUARDANDO",
      EM_ANDAMENTO: "EM_ANDAMENTO",
      FINALIZADO: "FINALIZADO",
    };

    const newStatusEnum = statusMap[newStatus];

    if (!newStatusEnum) {
      console.error("Status de coluna inválido para tradução:", newStatus);
      return;
    }

    if (servicoArrastado && servicoArrastado.status !== newStatusEnum) {
      const originalServicos = [...localServicos];
      setLocalServicos((prev) =>
        prev.map((s) =>
          s.id.toString() === activeId ? { ...s, status: newStatusEnum } : s
        )
      );

      try {
        await servicosService.updateServico(activeId, {
          status: newStatusEnum,
        });
      } catch (err) {
        console.error("Falha ao atualizar status:", err);
        setLocalServicos(originalServicos);
      }
    }
  };

  const stats = useMemo(
    () => ({
      total: filteredServicos.length,
      totalGeral: localServicos.length, // Total sem filtro
      ...Object.keys(statusConfig).reduce((acc, key) => {
        acc[key] = filteredServicos.filter((s) => s.status === key).length;
        return acc;
      }, {}),
    }),
    [filteredServicos, localServicos]
  );

  if (error) {
    return (
      <div className="p-2">
        <ErrorState error={error} onRetry={reload} />
      </div>
    );
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragEnd={handleDragEnd}
    >
      <div className="p-2">
        <div className="w-full">
          {/* Barra de Busca e Nova OS */}
          <section className="mb-6">
            <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-200">
              <div className="flex items-center gap-4 mb-4">
                <div className="flex-1">
                  <h2 className="text-lg font-semibold text-slate-800 mb-1">Buscar Serviços</h2>
                  <p className="text-sm text-slate-500">
                    {searchTerm 
                      ? `Mostrando ${stats.total} de ${stats.totalGeral} serviços`
                      : "Visualize e gerencie os serviços da sua oficina."
                    }
                  </p>
                </div>
                <Button
                  onClick={() => setNewServiceModalOpen(true)}
                  size="lg"
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <Plus className="w-5 h-5 mr-2" />
                  Nova Ordem de Serviço
                </Button>
              </div>
              <div className="flex items-center gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <Input
                    type="text"
                    placeholder="🔍 Buscar por cliente, veículo, placa ou OS # (Ctrl+K)"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 pr-10 py-3 text-sm border-slate-200 focus:border-blue-400 focus:ring-blue-400 rounded-lg"
                  />
                  {searchTerm && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={clearSearch}
                      className="absolute right-2 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0 hover:bg-slate-100 rounded-full"
                    >
                      <X className="w-3 h-3" />
                    </Button>
                  )}
                </div>
                {searchTerm && (
                  <div className="text-sm text-slate-600 whitespace-nowrap">
                    <span className="font-medium">{stats.total}</span> de{" "}
                    <span className="font-medium">{stats.totalGeral}</span> serviços
                  </div>
                )}
              </div>
              
              {searchTerm && stats.total === 0 && (
                <div className="mt-4 p-4 bg-slate-50 rounded-lg border border-slate-200">
                  <div className="flex items-center gap-3">
                    <AlertCircle className="w-5 h-5 text-slate-400" />
                    <div>
                      <p className="text-sm font-medium text-slate-700">
                        Nenhum serviço encontrado
                      </p>
                      <p className="text-xs text-slate-500 mt-1">
                        Tente buscar por: nome do cliente, marca/modelo do veículo, placa ou número da OS
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </section>

          {/* Stats */}
          <section className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-2">
            {isLoading ? (
              Array(4)
                .fill(0)
                .map((_, i) => <StatsCardSkeleton key={i} />)
            ) : ( 
              <>
                <StatsCards title="Total" value={stats.total} icon={BarChart3} />
                {Object.entries(statusConfig).map(([status, cfg]) => (
                  <StatsCards
                    key={status}
                    title={cfg.title}
                    value={stats[status]}
                    icon={cfg.icon}
                    color={cfg.color}
                    bgColor={cfg.bgColor}
                  />
                ))}
              </>
            )}
          </section>

          {/* Kanban Board */}
          <main>
            <KanbanBoard
              servicos={filteredServicos}
              clientes={clientes}
              veiculos={veiculos}
              onServiceClick={(service) => {
                console.log("Dashboard - Service clicado:", service);
                if (service && service.id) {
                  setSelectedService(service);
                  setServiceModalOpen(true);
                } else {
                  console.error("Dashboard - Service inválido:", service);
                }
              }}
              statusConfig={statusConfig}
              isLoading={isLoading}
            />
          </main>
        </div>
      </div>

      {/* Modals */}
      <NewServiceModal
        isOpen={isNewServiceModalOpen}
        onClose={() => setNewServiceModalOpen(false)}
        onSuccess={reload}
        clientes={clientes}
        veiculos={veiculos}
      />
      <ServiceModal
        isOpen={isServiceModalOpen}
        onClose={() => setServiceModalOpen(false)}
        service={selectedService}
        onUpdate={reload}
        clientes={clientes}
        veiculos={veiculos}
      />
    </DndContext>
  );
}
