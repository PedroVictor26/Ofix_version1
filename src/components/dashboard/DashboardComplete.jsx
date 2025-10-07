import { useState, useMemo, useEffect, useCallback, memo } from "react";
import { Plus, Wrench, AlertCircle, RefreshCw, TrendingUp, Users, Car, Clock, CheckCircle, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

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
import QuickActionsBar from './QuickActionsBar';

// Componente de Status do Sistema Integrado
const SystemStatusBar = memo(({ lastUpdate, isCacheValid, onRefresh, isLoading, stats }) => {
    const [isOnline, setIsOnline] = useState(navigator.onLine);
    
    useEffect(() => {
        const handleOnline = () => setIsOnline(true);
        const handleOffline = () => setIsOnline(false);
        
        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);
        
        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, []);

    const formatLastUpdate = () => {
        if (!lastUpdate) return 'Nunca';
        const now = new Date();
        const diff = now - lastUpdate;
        const minutes = Math.floor(diff / (1000 * 60));
        
        if (minutes < 1) return 'Agora mesmo';
        if (minutes === 1) return '1 minuto atrás';
        if (minutes < 60) return `${minutes} minutos atrás`;
        return lastUpdate.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    };

    return (
        <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-md mb-6">
            <CardContent className="p-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-6">
                        {/* Status de Conectividade */}
                        <div className="flex items-center gap-2">
                            <div className={`w-2 h-2 rounded-full ${isOnline ? 'bg-green-500' : 'bg-red-500'}`} />
                            <span className="text-sm font-medium text-slate-700">
                                {isOnline ? 'Online' : 'Offline'}
                            </span>
                        </div>

                        {/* Status do Cache */}
                        <div className="flex items-center gap-2">
                            <div className={`w-2 h-2 rounded-full ${isCacheValid ? 'bg-green-500' : 'bg-amber-500'}`} />
                            <span className="text-sm text-slate-600">
                                Cache: {isCacheValid ? 'Válido' : 'Expirado'}
                            </span>
                        </div>

                        {/* Última Atualização */}
                        <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4 text-slate-500" />
                            <span className="text-sm text-slate-600">
                                Atualizado: {formatLastUpdate()}
                            </span>
                        </div>

                        {/* Stats Rápidas */}
                        <div className="flex items-center gap-4 ml-4 pl-4 border-l border-slate-200">
                            <div className="text-center">
                                <div className="text-lg font-bold text-blue-600">{stats?.EM_ANDAMENTO || 0}</div>
                                <div className="text-xs text-slate-500">Em Andamento</div>
                            </div>
                            <div className="text-center">
                                <div className="text-lg font-bold text-amber-600">{stats?.AGUARDANDO_APROVACAO || 0}</div>
                                <div className="text-xs text-slate-500">Urgentes</div>
                            </div>
                            <div className="text-center">
                                <div className="text-lg font-bold text-green-600">{stats?.FINALIZADO || 0}</div>
                                <div className="text-xs text-slate-500">Finalizados</div>
                            </div>
                        </div>
                    </div>

                    {/* Botão de Refresh */}
                    <Button
                        onClick={onRefresh}
                        disabled={isLoading}
                        variant="outline"
                        size="sm"
                        className="h-8 px-3 text-xs border-slate-200 hover:bg-slate-50"
                    >
                        <RefreshCw className={`w-3 h-3 mr-1 ${isLoading ? 'animate-spin' : ''}`} />
                        Atualizar
                    </Button>
                </div>

                {/* Alertas se necessário */}
                {!isOnline && (
                    <div className="mt-3 p-2 bg-amber-50 border border-amber-200 rounded-lg">
                        <div className="flex items-center gap-2 text-amber-700 text-sm">
                            <Info className="w-4 h-4" />
                            <span>Modo offline - usando dados em cache</span>
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    );
});

// Componente de Métricas Avançadas Integrado
const AdvancedStatsSection = memo(({ servicos, clientes, veiculos }) => {
    const metrics = useMemo(() => {
        const hoje = new Date();
        const inicioMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
        const mesPassado = new Date(hoje.getFullYear(), hoje.getMonth() - 1, 1);
        const fimMesPassado = new Date(hoje.getFullYear(), hoje.getMonth(), 0);
        
        const servicosDoMes = servicos.filter(s => new Date(s.dataEntrada) >= inicioMes);
        const servicosMesPassado = servicos.filter(s => {
            const data = new Date(s.dataEntrada);
            return data >= mesPassado && data <= fimMesPassado;
        });
        
        const servicosFinalizados = servicos.filter(s => s.status === 'FINALIZADO');
        const faturamentoTotal = servicosFinalizados.reduce((acc, s) => acc + (Number(s.valorTotalFinal) || 0), 0);
        
        const crescimento = servicosMesPassado.length > 0 ? 
            ((servicosDoMes.length - servicosMesPassado.length) / servicosMesPassado.length) * 100 : 0;
        
        const taxaConclusao = servicos.length > 0 ? (servicosFinalizados.length / servicos.length) * 100 : 0;
        
        return {
            servicosDoMes: servicosDoMes.length,
            crescimento: Math.round(crescimento),
            faturamentoTotal,
            taxaConclusao: Math.round(taxaConclusao),
            totalClientes: Object.keys(clientes).length,
            totalVeiculos: veiculos.length
        };
    }, [servicos, clientes, veiculos]);

    const formatCurrency = (value) => {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL',
            minimumFractionDigits: 0
        }).format(value);
    };

    return (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-0 shadow-md hover:shadow-lg transition-all duration-200">
                <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-500 rounded-lg">
                            <TrendingUp className="w-4 h-4 text-white" />
                        </div>
                        <div>
                            <p className="text-xs text-blue-600 font-medium">Este Mês</p>
                            <p className="text-lg font-bold text-blue-800">{metrics.servicosDoMes}</p>
                            <p className="text-xs text-blue-600">
                                {metrics.crescimento >= 0 ? '+' : ''}{metrics.crescimento}% vs anterior
                            </p>
                        </div>
                    </div>
                </CardContent>
            </Card>
            
            <Card className="bg-gradient-to-br from-green-50 to-green-100 border-0 shadow-md hover:shadow-lg transition-all duration-200">
                <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-green-500 rounded-lg">
                            <Users className="w-4 h-4 text-white" />
                        </div>
                        <div>
                            <p className="text-xs text-green-600 font-medium">Clientes</p>
                            <p className="text-lg font-bold text-green-800">{metrics.totalClientes}</p>
                            <p className="text-xs text-green-600">{metrics.totalVeiculos} veículos</p>
                        </div>
                    </div>
                </CardContent>
            </Card>
            
            <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-0 shadow-md hover:shadow-lg transition-all duration-200">
                <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-purple-500 rounded-lg">
                            <CheckCircle className="w-4 h-4 text-white" />
                        </div>
                        <div>
                            <p className="text-xs text-purple-600 font-medium">Taxa Conclusão</p>
                            <p className="text-lg font-bold text-purple-800">{metrics.taxaConclusao}%</p>
                            <div className="w-full bg-purple-200 rounded-full h-1 mt-1">
                                <div 
                                    className="bg-purple-500 h-1 rounded-full transition-all duration-500"
                                    style={{ width: `${Math.min(metrics.taxaConclusao, 100)}%` }}
                                />
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>
            
            <Card className="bg-gradient-to-br from-amber-50 to-amber-100 border-0 shadow-md hover:shadow-lg transition-all duration-200">
                <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-amber-500 rounded-lg">
                            <TrendingUp className="w-4 h-4 text-white" />
                        </div>
                        <div>
                            <p className="text-xs text-amber-600 font-medium">Faturamento</p>
                            <p className="text-lg font-bold text-amber-800">
                                {formatCurrency(metrics.faturamentoTotal).replace('R$', '').trim()}
                            </p>
                            <p className="text-xs text-amber-600">Total acumulado</p>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
});

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
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg p-6 border-0">
                <div className="flex justify-between items-start">
                    <div className="space-y-3">
                        <div className="h-8 w-64 bg-gradient-to-r from-slate-200 to-slate-300 rounded-lg animate-pulse" />
                        <div className="h-4 w-96 bg-gradient-to-r from-slate-200 to-slate-300 rounded-lg animate-pulse" />
                    </div>
                    <div className="h-12 w-36 bg-gradient-to-r from-slate-200 to-slate-300 rounded-xl animate-pulse" />
                </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {Array(4).fill(0).map((_, i) => (
                    <div key={i} className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg p-6 border-0">
                        <div className="space-y-3">
                            <div className="h-6 w-20 bg-gradient-to-r from-slate-200 to-slate-300 rounded-lg animate-pulse" />
                            <div className="h-8 w-16 bg-gradient-to-r from-slate-200 to-slate-300 rounded-lg animate-pulse" />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    </div>
));

// Componente principal completo
export default function DashboardComplete() {
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
                        {/* Header Completo */}
                        <header className="mb-8">
                            <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg p-6 border-0">
                                <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-purple-500/5 rounded-2xl" />
                                <div className="relative flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                                    <div className="space-y-2">
                                        <h1 className="text-3xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent">
                                            Dashboard Operacional
                                        </h1>
                                        <p className="text-slate-600">
                                            Gerencie sua oficina com eficiência e controle total
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



                        {/* Status do Sistema */}
                        <SystemStatusBar 
                            lastUpdate={lastUpdate}
                            isCacheValid={isCacheValid}
                            onRefresh={reload}
                            isLoading={isLoading}
                            stats={stats}
                        />

                        {/* Barra de Ações Rápidas */}
                        <QuickActionsBar 
                            stats={stats}
                            onSearch={(term) => console.log('Buscar:', term)}
                            onFilter={(filters) => console.log('Filtrar:', filters)}
                            onExport={() => console.log('Exportar dados')}
                        />

                        {/* Métricas Avançadas */}
                        <AdvancedStatsSection 
                            servicos={localServicos} 
                            clientes={clientes} 
                            veiculos={veiculos} 
                        />

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