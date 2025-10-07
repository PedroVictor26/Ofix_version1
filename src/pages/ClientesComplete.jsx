import { useState, useMemo, useCallback, memo, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
    Plus, Search, User, AlertCircle, RefreshCw, Users, UserPlus, 
    Phone, Mail, Car, MapPin, Edit, Filter, Download, 
    TrendingUp, Clock, CheckCircle, Calendar, BarChart3
} from "lucide-react";
import toast from 'react-hot-toast';

// Importações atualizadas
import { useClientesDataOptimized } from "../hooks/useClientesDataOptimized";
import { ClienteCard, ClienteCardSkeleton } from "../components/clientes/ClienteCard";
import ClienteModal from "../components/clientes/ClienteModal";
import VeiculoModal from "../components/clientes/VeiculoModal";
import ClienteDetalhes from "../components/clientes/ClienteDetalhes";
import { ModernButton } from "../components/ui/modern-input";

// Componente de Status do Sistema para Clientes
const ClientesStatusBar = memo(({ lastUpdate, isCacheValid, onRefresh, isLoading, stats }) => {
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
                                <div className="text-lg font-bold text-blue-600">{stats?.totalClientes || 0}</div>
                                <div className="text-xs text-slate-500">Clientes</div>
                            </div>
                            <div className="text-center">
                                <div className="text-lg font-bold text-green-600">{stats?.totalVeiculos || 0}</div>
                                <div className="text-xs text-slate-500">Veículos</div>
                            </div>
                            <div className="text-center">
                                <div className="text-lg font-bold text-purple-600">{stats?.clientesAtivos || 0}</div>
                                <div className="text-xs text-slate-500">Ativos</div>
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
            </CardContent>
        </Card>
    );
});

// Componente de Métricas Avançadas para Clientes
const ClientesAdvancedMetrics = memo(({ clientes, servicos }) => {
    const metrics = useMemo(() => {
        const hoje = new Date();
        const inicioMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
        const mesPassado = new Date(hoje.getFullYear(), hoje.getMonth() - 1, 1);
        const fimMesPassado = new Date(hoje.getFullYear(), hoje.getMonth(), 0);
        
        const clientesDoMes = clientes.filter(c => new Date(c.createdAt) >= inicioMes);
        const clientesMesPassado = clientes.filter(c => {
            const data = new Date(c.createdAt);
            return data >= mesPassado && data <= fimMesPassado;
        });
        
        const totalVeiculos = clientes.reduce((acc, c) => acc + (c.veiculos?.length || 0), 0);
        const clientesComServicos = clientes.filter(c => 
            servicos.some(s => s.clienteId === c.id)
        ).length;
        
        const crescimento = clientesMesPassado.length > 0 ? 
            ((clientesDoMes.length - clientesMesPassado.length) / clientesMesPassado.length) * 100 : 0;
        
        const mediaVeiculosPorCliente = clientes.length > 0 ? 
            (totalVeiculos / clientes.length).toFixed(1) : 0;
        
        return {
            clientesDoMes: clientesDoMes.length,
            crescimento: Math.round(crescimento),
            totalVeiculos,
            clientesAtivos: clientesComServicos,
            mediaVeiculosPorCliente: parseFloat(mediaVeiculosPorCliente),
            taxaAtivacao: clientes.length > 0 ? Math.round((clientesComServicos / clientes.length) * 100) : 0
        };
    }, [clientes, servicos]);

    return (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-0 shadow-md hover:shadow-lg transition-all duration-200">
                <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-500 rounded-lg">
                            <UserPlus className="w-4 h-4 text-white" />
                        </div>
                        <div>
                            <p className="text-xs text-blue-600 font-medium">Novos Este Mês</p>
                            <p className="text-lg font-bold text-blue-800">{metrics.clientesDoMes}</p>
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
                            <Car className="w-4 h-4 text-white" />
                        </div>
                        <div>
                            <p className="text-xs text-green-600 font-medium">Total Veículos</p>
                            <p className="text-lg font-bold text-green-800">{metrics.totalVeiculos}</p>
                            <p className="text-xs text-green-600">{metrics.mediaVeiculosPorCliente} por cliente</p>
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
                            <p className="text-xs text-purple-600 font-medium">Taxa Ativação</p>
                            <p className="text-lg font-bold text-purple-800">{metrics.taxaAtivacao}%</p>
                            <div className="w-full bg-purple-200 rounded-full h-1 mt-1">
                                <div 
                                    className="bg-purple-500 h-1 rounded-full transition-all duration-500"
                                    style={{ width: `${Math.min(metrics.taxaAtivacao, 100)}%` }}
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
                            <p className="text-xs text-amber-600 font-medium">Clientes Ativos</p>
                            <p className="text-lg font-bold text-amber-800">{metrics.clientesAtivos}</p>
                            <p className="text-xs text-amber-600">Com serviços</p>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
});

// Barra de Ações Rápidas para Clientes
const ClientesQuickActionsBar = memo(({ stats, onSearch, onFilter, onExport }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [showFilters, setShowFilters] = useState(false);

    const handleSearch = (value) => {
        setSearchTerm(value);
        if (onSearch) onSearch(value);
    };

    return (
        <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-md border-0 p-4 mb-6">
            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
                {/* Barra de Busca */}
                <div className="flex items-center gap-3 flex-1 max-w-md">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <Input
                            placeholder="Buscar por nome, telefone ou email..."
                            value={searchTerm}
                            onChange={(e) => handleSearch(e.target.value)}
                            className="pl-10 border-slate-200 focus:border-blue-500 focus:ring-blue-500/20"
                        />
                    </div>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowFilters(!showFilters)}
                        className="border-slate-200 hover:bg-slate-50"
                    >
                        <Filter className="w-4 h-4 mr-1" />
                        Filtros
                    </Button>
                </div>

                {/* Indicadores Rápidos */}
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 border border-blue-200 rounded-lg">
                        <Users className="w-4 h-4 text-blue-600" />
                        <span className="text-sm font-medium text-blue-700">
                            {stats?.totalClientes || 0} Cliente{(stats?.totalClientes || 0) !== 1 ? 's' : ''}
                        </span>
                    </div>

                    <div className="flex items-center gap-2 px-3 py-1.5 bg-green-50 border border-green-200 rounded-lg">
                        <Car className="w-4 h-4 text-green-600" />
                        <span className="text-sm font-medium text-green-700">
                            {stats?.totalVeiculos || 0} Veículo{(stats?.totalVeiculos || 0) !== 1 ? 's' : ''}
                        </span>
                    </div>

                    <Button
                        variant="outline"
                        size="sm"
                        onClick={onExport}
                        className="border-slate-200 hover:bg-slate-50"
                    >
                        <Download className="w-4 h-4 mr-1" />
                        Exportar
                    </Button>
                </div>
            </div>

            {/* Filtros Expandidos */}
            {showFilters && (
                <div className="mt-4 pt-4 border-t border-slate-200">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        <div>
                            <label className="block text-xs font-medium text-slate-600 mb-1">
                                Status
                            </label>
                            <select className="w-full text-sm border border-slate-200 rounded-md px-2 py-1">
                                <option value="">Todos</option>
                                <option value="ativo">Ativos</option>
                                <option value="inativo">Inativos</option>
                            </select>
                        </div>
                        
                        <div>
                            <label className="block text-xs font-medium text-slate-600 mb-1">
                                Período Cadastro
                            </label>
                            <select className="w-full text-sm border border-slate-200 rounded-md px-2 py-1">
                                <option value="">Todos</option>
                                <option value="mes">Este Mês</option>
                                <option value="trimestre">Trimestre</option>
                                <option value="ano">Este Ano</option>
                            </select>
                        </div>
                        
                        <div>
                            <label className="block text-xs font-medium text-slate-600 mb-1">
                                Veículos
                            </label>
                            <select className="w-full text-sm border border-slate-200 rounded-md px-2 py-1">
                                <option value="">Todos</option>
                                <option value="0">Sem veículos</option>
                                <option value="1">1 veículo</option>
                                <option value="2+">2+ veículos</option>
                            </select>
                        </div>
                        
                        <div>
                            <label className="block text-xs font-medium text-slate-600 mb-1">
                                Serviços
                            </label>
                            <select className="w-full text-sm border border-slate-200 rounded-md px-2 py-1">
                                <option value="">Todos</option>
                                <option value="com">Com serviços</option>
                                <option value="sem">Sem serviços</option>
                            </select>
                        </div>
                    </div>
                    
                    <div className="flex justify-end gap-2 mt-3">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setShowFilters(false)}
                        >
                            Cancelar
                        </Button>
                        <Button
                            size="sm"
                            className="bg-blue-600 hover:bg-blue-700 text-white"
                        >
                            Aplicar Filtros
                        </Button>
                    </div>
                </div>
            )}
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
                    Erro ao Carregar Clientes
                </h2>
                <p className="text-slate-600 mb-6">
                    Não foi possível carregar os dados dos clientes. Verifique sua conexão e tente novamente.
                </p>
                <ModernButton 
                    onClick={onRetry}
                    variant="danger"
                >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Tentar Novamente
                </ModernButton>
            </div>
        </div>
    </div>
));

// Estado Vazio Otimizado
const EmptyState = memo(({ onNewCliente, searchTerm }) => (
    <div className="text-center py-16 px-6 bg-gradient-to-br from-white via-slate-50/50 to-blue-50/30 rounded-2xl border border-slate-200/60 shadow-lg backdrop-blur-sm">
        <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-xl">
            <Users className="w-12 h-12 text-white" />
        </div>
        <h3 className="text-2xl font-bold bg-gradient-to-r from-slate-800 to-blue-700 bg-clip-text text-transparent mb-3">
            {searchTerm ? 'Nenhum cliente encontrado' : 'Nenhum cliente cadastrado'}
        </h3>
        <p className="text-slate-600 mb-8 text-lg max-w-md mx-auto">
            {searchTerm 
                ? 'Tente ajustar os termos da sua busca ou cadastre um novo cliente.' 
                : 'Comece cadastrando seu primeiro cliente para gerenciar os serviços da oficina.'
            }
        </p>
        <ModernButton 
            onClick={onNewCliente}
            className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg hover:shadow-xl"
            size="lg"
        >
            <UserPlus className="w-5 h-5 mr-2" />
            Cadastrar Primeiro Cliente
        </ModernButton>
    </div>
));

// Skeleton otimizado
const PageSkeleton = memo(() => (
    <div className="space-y-8">
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg p-6 border-0">
            <div className="flex justify-between items-start">
                <div className="space-y-3">
                    <div className="h-8 w-64 bg-gradient-to-r from-slate-200 to-slate-300 rounded-lg animate-pulse" />
                    <div className="h-4 w-96 bg-gradient-to-r from-slate-200 to-slate-300 rounded-lg animate-pulse" />
                </div>
                <div className="h-12 w-36 bg-gradient-to-r from-slate-200 to-slate-300 rounded-xl animate-pulse" />
            </div>
        </div>
        
        <div className="space-y-6">
            {Array(3).fill(0).map((_, i) => (
                <ClienteCardSkeleton key={i} />
            ))}
        </div>
    </div>
));

// Componente principal completo
export default function ClientesComplete() {
    const { clientes, servicos, isLoading, error, reload, lastUpdate, isCacheValid } = useClientesDataOptimized();
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedCliente, setSelectedCliente] = useState(null);
    const [editingCliente, setEditingCliente] = useState(null);
    
    const [isClienteModalOpen, setClienteModalOpen] = useState(false);
    const [isVeiculoModalOpen, setVeiculoModalOpen] = useState(false);
    const [isDetalhesOpen, setDetalhesOpen] = useState(false);

    const filteredClientes = useMemo(() =>
        clientes.filter(cliente => {
            const termo = searchTerm.toLowerCase();
            return (
                cliente.nomeCompleto?.toLowerCase().includes(termo) ||
                cliente.telefone?.includes(termo) ||
                cliente.email?.toLowerCase().includes(termo)
            );
        }), [clientes, searchTerm]);

    const stats = useMemo(() => {
        const totalVeiculos = clientes.reduce((acc, c) => acc + (c.veiculos?.length || 0), 0);
        const clientesAtivos = clientes.filter(c => 
            servicos.some(s => s.clienteId === c.id)
        ).length;
        
        return {
            totalClientes: clientes.length,
            totalVeiculos,
            clientesAtivos
        };
    }, [clientes, servicos]);

    const handleClienteClick = useCallback((cliente) => {
        setSelectedCliente(cliente);
        setDetalhesOpen(true);
    }, []);

    const handleNewCliente = useCallback(() => {
        setEditingCliente(null);
        setClienteModalOpen(true);
    }, []);

    const handleEditCliente = useCallback((cliente) => {
        setEditingCliente(cliente);
        setClienteModalOpen(true);
    }, []);
    
    const handleAddVeiculo = useCallback(() => {
        if (!selectedCliente) {
            toast.error("Selecione um cliente primeiro para adicionar um veículo.");
            return;
        }
        setVeiculoModalOpen(true);
    }, [selectedCliente]);

    const handleClienteSuccess = useCallback(() => {
        setClienteModalOpen(false);
        setEditingCliente(null);
        reload();
    }, [reload]);

    const handleVeiculoSuccess = useCallback(() => {
        setVeiculoModalOpen(false);
        reload();
    }, [reload]);

    const getVeiculosByCliente = useCallback((clienteId) => {
        const cliente = clientes.find(c => c.id === clienteId);
        return cliente ? cliente.veiculos || [] : [];
    }, [clientes]);

    const getServicosByCliente = useCallback((clienteId) => {
        return servicos.filter(s => s.clienteId === clienteId);
    }, [servicos]);

    if (error) {
        return <ErrorState error={error} onRetry={reload} />;
    }

    if (isLoading) {
        return <PageSkeleton />;
    }

    return (
        <div className="space-y-8">
                    {/* Header Completo */}
                    <header className="mb-8">
                        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg p-6 border-0">
                            <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-purple-500/5 rounded-2xl" />
                            <div className="relative flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                                <div className="space-y-2">
                                    <h1 className="text-3xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent">
                                        Gestão de Clientes
                                    </h1>
                                    <p className="text-slate-600">
                                        Gerencie seus clientes e veículos com eficiência total
                                    </p>
                                </div>
                                <ModernButton 
                                    onClick={handleNewCliente} 
                                    size="lg"
                                    className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
                                >
                                    <Plus className="w-5 h-5 mr-2" />
                                    <span className="font-medium">Novo Cliente</span>
                                </ModernButton>
                            </div>
                        </div>
                    </header>

                    {/* Status do Sistema */}
                    <ClientesStatusBar 
                        lastUpdate={lastUpdate}
                        isCacheValid={isCacheValid}
                        onRefresh={reload}
                        isLoading={isLoading}
                        stats={stats}
                    />

                    {/* Barra de Ações Rápidas */}
                    <ClientesQuickActionsBar 
                        stats={stats}
                        onSearch={setSearchTerm}
                        onFilter={(filters) => console.log('Filtrar:', filters)}
                        onExport={() => console.log('Exportar clientes')}
                    />

                    {/* Métricas Avançadas */}
                    <ClientesAdvancedMetrics 
                        clientes={clientes} 
                        servicos={servicos} 
                    />

                    {/* Lista de Clientes */}
                    <main className="grid gap-6">
                        {filteredClientes.length > 0 ? (
                            filteredClientes.map((cliente) => (
                                <ClienteCard
                                    key={cliente.id}
                                    cliente={cliente}
                                    veiculos={getVeiculosByCliente(cliente.id)}
                                    servicos={getServicosByCliente(cliente.id)}
                                    onCardClick={handleClienteClick}
                                    onEditClick={handleEditCliente}
                                />
                            ))
                        ) : (
                            <EmptyState onNewCliente={handleNewCliente} searchTerm={searchTerm} />
                        )}
                </main>
            
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
                veiculos={selectedCliente ? getVeiculosByCliente(selectedCliente.id) : []} 
                servicos={selectedCliente ? getServicosByCliente(selectedCliente.id) : []} 
                onEditCliente={handleEditCliente} 
                onAddVeiculo={handleAddVeiculo} 
            />
        </div>
    );
}