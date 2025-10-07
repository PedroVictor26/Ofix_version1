import { useState, useMemo, useEffect, useCallback, memo } from "react";
import { Plus, Wrench, AlertCircle, RefreshCw, Sparkles, ExternalLink, TrendingUp, Users, Car } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";
import { DndContext, closestCorners, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable';

import useDashboardDataOptimized from "@/hooks/useDashboardDataOptimized";
import { statusConfig } from "@/constants/statusConfig";
import StatsCards, { StatsCardSkeleton } from "@/components/dashboard/StatsCards";
import TotalStatsCard, { TotalStatsCardSkeleton } from "@/components/dashboard/TotalStatsCard";
import KanbanBoard from "@/components/dashboard/KanbanBoard";
import ServiceModal from "@/components/dashboard/ServiceModal";
import NewServiceModal from "@/components/dashboard/NewServiceModal";
import { ModernButton } from "@/components/ui/modern-input";
import * as servicosService from '../../services/servicos.service.js';
// import QuickActions from './QuickActions';
// import AdvancedMetrics from './AdvancedMetrics';
// import SystemStatus from './SystemStatus';

// Componente de Erro Otimizado
const ErrorState = memo(({ error, onRetry }) => (
    <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center p-8 bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border-0 max-w-md">
            <div className="absolute inset-0 bg-gradient-to-br from-red-500/5 to-orange-500/5 rounded-2xl" />
            <div className="relative">
                <div className="w-20 h-20 bg-gradient-to-br from-red-500 to-red-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg">
                    <AlertCircle className="w-10 h-10 text-white" />
                </div>
                <h2 className="text-xl font-bold bg-gradient-to-r from-red-600 to-red-700 bg-clip-text text-transparent mb-2">
                    Erro ao Carregar Dashboard
                </h2>
                <p className="text-slate-600 mb-6">
                    Não foi possível carregar os dados. Verifique sua conexão e tente novamente.
                </p>
                <ModernButton
                    onClick={onRetry}
                    variant="danger"
                    className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 shadow-lg hover:shadow-xl transition-all duration-300"
                >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Tentar Novamente
                </ModernButton>
            </div>
        </div>
    </div>
));

// Skeleton otimizado
const PageSkeleton = memo(() => (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/20 to-indigo-50/30 p-6">
        <div className="max-w-7xl mx-auto space-y-8">
            {/* Header Skeleton */}
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg p-6 border-0">
                <div className="flex justify-between items-start">
                    <div className="space-y-3">
                        <div className="h-8 w-64 bg-gradient-to-r from-slate-200 to-slate-300 rounded-lg animate-pulse" />
                        <div className="h-4 w-96 bg-gradient-to-r from-slate-200 to-slate-300 rounded-lg animate-pulse" />
                    </div>
                    <div className="h-12 w-36 bg-gradient-to-r from-slate-200 to-slate-300 rounded-xl animate-pulse" />
                </div>
            </div>

            {/* Stats Skeleton */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {Array(4).fill(0).map((_, i) => (
                    <div key={i} className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg p-6 border-0">
                        <div className="space-y-3">
                            <div className="h-6 w-20 bg-gradient-to-r from-slate-200 to-slate-300 rounded-lg animate-pulse" />
                            <div className="h-8 w-16 bg-gradient-to-r from-slate-200 to-slate-300 rounded-lg animate-pulse" />
                            <div className="h-4 w-24 bg-gradient-to-r from-slate-200 to-slate-300 rounded-lg animate-pulse" />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    </div>
));

// Componente de estatísticas avançadas
const AdvancedStats = memo(({ servicos, clientes, veiculos }) => {
    const stats = useMemo(() => {
        const hoje = new Date();
        const inicioMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1);

        const servicosDoMes = servicos.filter(s =>
            new Date(s.dataEntrada) >= inicioMes
        );

        const servicosFinalizados = servicos.filter(s => s.status === 'FINALIZADO');
        const valorTotal = servicosFinalizados.reduce((acc, s) =>
            acc + (Number(s.valorTotalFinal) || 0), 0
        );

        return {
            servicosDoMes: servicosDoMes.length,
            totalClientes: Object.keys(clientes).length,
            totalVeiculos: veiculos.length,
            faturamentoTotal: valorTotal,
            taxaConclusao: servicos.length > 0 ?
                Math.round((servicosFinalizados.length / servicos.length) * 100) : 0
        };
    }, [servicos, clientes, veiculos]);

    return (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-0 shadow-md">
                <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-500 rounded-lg">
                            <TrendingUp className="w-4 h-4 text-white" />
                        </div>
                        <div>
                            <p className="text-xs text-blue-600 font-medium">Este Mês</p>
                            <p className="text-lg font-bold text-blue-800">{stats.servicosDoMes}</p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-green-50 to-green-100 border-0 shadow-md">
                <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-green-500 rounded-lg">
                            <Users className="w-4 h-4 text-white" />
                        </div>
                        <div>
                            <p className="text-xs text-green-600 font-medium">Clientes</p>
                            <p className="text-lg font-bold text-green-800">{stats.totalClientes}</p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-0 shadow-md">
                <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-purple-500 rounded-lg">
                            <Car className="w-4 h-4 text-white" />
                        </div>
                        <div>
                            <p className="text-xs text-purple-600 font-medium">Veículos</p>
                            <p className="text-lg font-bold text-purple-800">{stats.totalVeiculos}</p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-amber-50 to-amber-100 border-0 shadow-md">
                <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-amber-500 rounded-lg">
                            <TrendingUp className="w-4 h-4 text-white" />
                        </div>
                        <div>
                            <p className="text-xs text-amber-600 font-medium">Taxa Conclusão</p>
                            <p className="text-lg font-bold text-amber-800">{stats.taxaConclusao}%</p>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
});

// Componente principal otimizado
export default function DashboardOptimized() {
    const { servicos, clientes, veiculos, isLoading, error, reload, lastUpdate, isCacheValid } = useDashboardDataOptimized();
    const [localServicos, setLocalServicos] = useState([]);
    const [selectedService, setSelectedService] = useState(null);
    const [isServiceModalOpen, setServiceModalOpen] = useState(false);
    const [isNewServiceModalOpen, setNewServiceModalOpen] = useState(false);

    useEffect(() => {
        setLocalServicos(servicos || []);
    }, [servicos]);

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: { distance: 8 },
        }),
        useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
    );

    const handleDragEnd = useCallback(async (event) => {
        const { active, over } = event;

        if (!over || over.data.current?.type !== 'column') {
            return;
        }

        const activeId = active.id.toString();
        const newStatus = over.id.toString();
        const servicoArrastado = localServicos.find(s => s.id.toString() === activeId);

        const statusMap = {
            'AGUARDANDO': 'AGUARDANDO',
            'EM_ANDAMENTO': 'EM_ANDAMENTO',
            'AGUARDANDO_PECAS': 'AGUARDANDO_PECAS',
            'AGUARDANDO_APROVACAO': 'AGUARDANDO_APROVACAO',
            'FINALIZADO': 'FINALIZADO',
            'CANCELADO': 'CANCELADO',
        };

        const newStatusEnum = statusMap[newStatus];

        if (!newStatusEnum || !servicoArrastado || servicoArrastado.status === newStatusEnum) {
            return;
        }

        const originalServicos = [...localServicos];
        setLocalServicos(prev => prev.map(s =>
            s.id.toString() === activeId ? { ...s, status: newStatusEnum } : s
        ));

        try {
            await servicosService.updateServico(activeId, { status: newStatusEnum });
        } catch (err) {
            console.error("Falha ao atualizar status:", err);
            setLocalServicos(originalServicos);
        }
    }, [localServicos]);

    const stats = useMemo(() => ({
        total: localServicos.length,
        ...Object.keys(statusConfig).reduce((acc, key) => {
            acc[key] = localServicos.filter(s => s.status === key).length;
            return acc;
        }, {}),
    }), [localServicos]);

    const handleServiceClick = useCallback((service) => {
        setSelectedService(service);
        setServiceModalOpen(true);
    }, []);

    const handleNewService = useCallback(() => {
        setNewServiceModalOpen(true);
    }, []);

    if (error) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/20 to-indigo-50/30">
                <div className="absolute inset-0 bg-grid-pattern opacity-30" />
                <div className="relative z-10 p-6 lg:p-8">
                    <ErrorState error={error} onRetry={reload} />
                </div>
            </div>
        );
    }

    if (isLoading) {
        return <PageSkeleton />;
    }

    return (
        <DndContext sensors={sensors} collisionDetection={closestCorners} onDragEnd={handleDragEnd}>
            <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/20 to-indigo-50/30">
                <div className="absolute inset-0 bg-grid-pattern opacity-30" />

                <div className="relative z-10 p-6 lg:p-8">
                    <div className="max-w-full mx-auto">
                        {/* Header Otimizado */}
                        <header className="mb-8">
                            <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg p-6 border-0">
                                <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-purple-500/5 rounded-2xl" />
                                <div className="relative flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                                    <div className="space-y-2">
                                        <h1 className="text-3xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent">
                                            Dashboard Operacional
                                        </h1>
                                        <div className="flex items-center gap-4">
                                            <p className="text-slate-600">
                                                Gerencie sua oficina com eficiência e controle total
                                            </p>
                                            {lastUpdate && (
                                                <div className="flex items-center gap-2 text-xs text-slate-500">
                                                    <div className={`w-2 h-2 rounded-full ${isCacheValid ? 'bg-green-500' : 'bg-amber-500'}`} />
                                                    <span>
                                                        Atualizado: {lastUpdate.toLocaleTimeString('pt-BR', { 
                                                            hour: '2-digit', 
                                                            minute: '2-digit' 
                                                        })}
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    <ModernButton
                                        onClick={handleNewService}
                                        size="lg"
                                        className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
                                    >
                                        <Plus className="w-5 h-5 mr-2" />
                                        <span className="font-medium">Nova OS</span>
                                    </ModernButton>
                                </div>
                            </div>
                        </header>

                        {/* Componentes temporariamente desabilitados para debug */}
                        <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
                            <p className="text-green-800 text-sm">
                                ✅ Dashboard Otimizado carregado com sucesso! 
                                Novos componentes temporariamente desabilitados para debug.
                            </p>
                        </div>

                        {/* Stats Principais */}
                        <section className="space-y-6 mb-8">
                            <div className="grid grid-cols-1 gap-6">
                                <TotalStatsCard
                                    title="Total de Serviços"
                                    value={stats.total}
                                    subtitle="Ordens de serviço ativas"
                                    icon={Wrench}
                                />
                            </div>

                            <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
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
                            </div>
                        </section>

                        {/* Kanban Board */}
                        <main>
                            <KanbanBoard
                                servicos={localServicos}
                                clientes={clientes}
                                veiculos={veiculos}
                                onServiceClick={handleServiceClick}
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
            </div>
        </DndContext>
    );
}