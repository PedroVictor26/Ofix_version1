import { useState, useMemo, useEffect, useCallback } from "react";
import { Plus, Wrench, AlertCircle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { DndContext, closestCorners, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable';

import useDashboardData from "@/hooks/useDashboardData";
import { statusConfig } from "@/constants/statusConfig";
import StatsCards from "@/components/dashboard/StatsCards";
import TotalStatsCard from "@/components/dashboard/TotalStatsCard";
import KanbanBoard from "@/components/dashboard/KanbanBoard";
import ServiceModal from "@/components/dashboard/ServiceModal";
import NewServiceModal from "@/components/dashboard/NewServiceModal";
import { ModernButton } from "@/components/ui/modern-input";
import * as servicosService from '../../services/servicos.service.js';

export default function DashboardTest() {
    const { servicos, clientes, veiculos, isLoading, error, reload } = useDashboardData();
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
                                    onClick={reload}
                                    variant="danger"
                                    className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 shadow-lg hover:shadow-xl transition-all duration-300"
                                >
                                    <RefreshCw className="w-4 h-4 mr-2" />
                                    Tentar Novamente
                                </ModernButton>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (isLoading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/20 to-indigo-50/30 p-6">
                <div className="max-w-7xl mx-auto space-y-8">
                    <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg p-6 border-0">
                        <div className="flex justify-between items-start">
                            <div className="space-y-3">
                                <div className="h-8 w-64 bg-gradient-to-r from-slate-200 to-slate-300 rounded-lg animate-pulse" />
                                <div className="h-4 w-96 bg-gradient-to-r from-slate-200 to-slate-300 rounded-lg animate-pulse" />
                            </div>
                            <div className="h-12 w-36 bg-gradient-to-r from-slate-200 to-slate-300 rounded-xl animate-pulse" />
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <DndContext sensors={sensors} collisionDetection={closestCorners} onDragEnd={handleDragEnd}>
            <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/20 to-indigo-50/30">
                <div className="absolute inset-0 bg-grid-pattern opacity-30" />

                <div className="relative z-10 p-6 lg:p-8">
                    <div className="max-w-full mx-auto">
                        {/* Header Simples */}
                        <header className="mb-8">
                            <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg p-6 border-0">
                                <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-purple-500/5 rounded-2xl" />
                                <div className="relative flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                                    <div className="space-y-2">
                                        <h1 className="text-3xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent">
                                            Dashboard Otimizado - Teste
                                        </h1>
                                        <p className="text-slate-600">
                                            Versão de teste funcionando corretamente
                                        </p>
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

                        {/* Status Simples */}
                        <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-md mb-6">
                            <CardContent className="p-4">
                                <div className="flex items-center justify-between">
                                    <div className="text-sm text-slate-600">
                                        ✅ Dashboard otimizado carregado com sucesso!
                                    </div>
                                    <Button
                                        onClick={reload}
                                        variant="outline"
                                        size="sm"
                                        className="h-8 px-3 text-xs"
                                    >
                                        <RefreshCw className="w-3 h-3 mr-1" />
                                        Atualizar
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>

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