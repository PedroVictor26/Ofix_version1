import { useState, useMemo, useCallback, memo, useEffect } from "react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { 
    Plus, Search, TrendingUp, TrendingDown, DollarSign, Calendar,
    BarChart3, PieChart, RefreshCw, AlertTriangle, Filter, Download,
    CreditCard, Wallet, ArrowUpRight, ArrowDownRight, Clock
} from "lucide-react";

import { useFinanceiroDataOptimized } from "../hooks/useFinanceiroDataOptimized";
import FinanceiroStats from "../components/financeiro/FinanceiroStats";
import FinanceiroChart from "../components/financeiro/FinanceiroChart";
import FinanceiroTable from "../components/financeiro/FinanceiroTable";
import FinanceiroModal from "../components/financeiro/FinanceiroModal";
import { ModernButton } from "../components/ui/modern-input";

// Componente de Status do Sistema para Financeiro
const FinanceiroStatusBar = memo(({ stats, onRefresh, isLoading, lastUpdate, isCacheValid }) => {
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

    const formatCurrency = (value) => {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL'
        }).format(value || 0);
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
                                <div className="text-lg font-bold text-green-600">{formatCurrency(stats?.totalReceitas)}</div>
                                <div className="text-xs text-slate-500">Receitas</div>
                            </div>
                            <div className="text-center">
                                <div className="text-lg font-bold text-red-600">{formatCurrency(stats?.totalDespesas)}</div>
                                <div className="text-xs text-slate-500">Despesas</div>
                            </div>
                            <div className="text-center">
                                <div className={`text-lg font-bold ${(stats?.saldoTotal || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                    {formatCurrency(stats?.saldoTotal)}
                                </div>
                                <div className="text-xs text-slate-500">Saldo</div>
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

// Componente de Métricas Avançadas para Financeiro
const FinanceiroAdvancedMetrics = memo(({ transacoes }) => {
    const metrics = useMemo(() => {
        const hoje = new Date();
        const inicioMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
        const mesPassado = new Date(hoje.getFullYear(), hoje.getMonth() - 1, 1);
        const fimMesPassado = new Date(hoje.getFullYear(), hoje.getMonth(), 0);
        
        const transacoesDoMes = transacoes.filter(t => new Date(t.data) >= inicioMes);
        const transacoesMesPassado = transacoes.filter(t => {
            const data = new Date(t.data);
            return data >= mesPassado && data <= fimMesPassado;
        });
        
        const receitasDoMes = transacoesDoMes
            .filter(t => t.tipo === 'receita')
            .reduce((acc, t) => acc + parseFloat(t.valor || 0), 0);
        
        const despesasDoMes = transacoesDoMes
            .filter(t => t.tipo === 'despesa')
            .reduce((acc, t) => acc + parseFloat(t.valor || 0), 0);
        
        const receitasMesPassado = transacoesMesPassado
            .filter(t => t.tipo === 'receita')
            .reduce((acc, t) => acc + parseFloat(t.valor || 0), 0);
        
        const despesasMesPassado = transacoesMesPassado
            .filter(t => t.tipo === 'despesa')
            .reduce((acc, t) => acc + parseFloat(t.valor || 0), 0);
        
        const crescimentoReceitas = receitasMesPassado > 0 ? 
            ((receitasDoMes - receitasMesPassado) / receitasMesPassado) * 100 : 0;
        
        const crescimentoDespesas = despesasMesPassado > 0 ? 
            ((despesasDoMes - despesasMesPassado) / despesasMesPassado) * 100 : 0;
        
        const saldoDoMes = receitasDoMes - despesasDoMes;
        const margemLucro = receitasDoMes > 0 ? (saldoDoMes / receitasDoMes) * 100 : 0;
        
        return {
            receitasDoMes,
            despesasDoMes,
            saldoDoMes,
            crescimentoReceitas: Math.round(crescimentoReceitas),
            crescimentoDespesas: Math.round(crescimentoDespesas),
            margemLucro: Math.round(margemLucro),
            totalTransacoes: transacoesDoMes.length
        };
    }, [transacoes]);

    const formatCurrency = (value) => {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL'
        }).format(value || 0);
    };

    return (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <Card className="bg-gradient-to-br from-green-50 to-green-100 border-0 shadow-md hover:shadow-lg transition-all duration-200">
                <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-green-500 rounded-lg">
                            <ArrowUpRight className="w-4 h-4 text-white" />
                        </div>
                        <div>
                            <p className="text-xs text-green-600 font-medium">Receitas Este Mês</p>
                            <p className="text-lg font-bold text-green-800">{formatCurrency(metrics.receitasDoMes)}</p>
                            <p className="text-xs text-green-600">
                                {metrics.crescimentoReceitas >= 0 ? '+' : ''}{metrics.crescimentoReceitas}% vs anterior
                            </p>
                        </div>
                    </div>
                </CardContent>
            </Card>
            
            <Card className="bg-gradient-to-br from-red-50 to-red-100 border-0 shadow-md hover:shadow-lg transition-all duration-200">
                <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-red-500 rounded-lg">
                            <ArrowDownRight className="w-4 h-4 text-white" />
                        </div>
                        <div>
                            <p className="text-xs text-red-600 font-medium">Despesas Este Mês</p>
                            <p className="text-lg font-bold text-red-800">{formatCurrency(metrics.despesasDoMes)}</p>
                            <p className="text-xs text-red-600">
                                {metrics.crescimentoDespesas >= 0 ? '+' : ''}{metrics.crescimentoDespesas}% vs anterior
                            </p>
                        </div>
                    </div>
                </CardContent>
            </Card>
            
            <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-0 shadow-md hover:shadow-lg transition-all duration-200">
                <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-500 rounded-lg">
                            <Wallet className="w-4 h-4 text-white" />
                        </div>
                        <div>
                            <p className="text-xs text-blue-600 font-medium">Saldo do Mês</p>
                            <p className={`text-lg font-bold ${metrics.saldoDoMes >= 0 ? 'text-blue-800' : 'text-red-800'}`}>
                                {formatCurrency(metrics.saldoDoMes)}
                            </p>
                            <p className="text-xs text-blue-600">Margem: {metrics.margemLucro}%</p>
                        </div>
                    </div>
                </CardContent>
            </Card>
            
            <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-0 shadow-md hover:shadow-lg transition-all duration-200">
                <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-purple-500 rounded-lg">
                            <CreditCard className="w-4 h-4 text-white" />
                        </div>
                        <div>
                            <p className="text-xs text-purple-600 font-medium">Transações</p>
                            <p className="text-lg font-bold text-purple-800">{metrics.totalTransacoes}</p>
                            <p className="text-xs text-purple-600">Este mês</p>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
});

// Barra de Ações Rápidas para Financeiro
const FinanceiroQuickActionsBar = memo(({ stats, onSearch, onFilter, onExport, filterPeriod, setFilterPeriod }) => {
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
                            placeholder="Buscar por descrição ou categoria..."
                            value={searchTerm}
                            onChange={(e) => handleSearch(e.target.value)}
                            className="pl-10 border-slate-200 focus:border-green-500 focus:ring-green-500/20"
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

                {/* Controles */}
                <div className="flex items-center gap-3">
                    <Select value={filterPeriod} onValueChange={setFilterPeriod}>
                        <SelectTrigger className="w-44 border-slate-200 focus:border-green-500">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="week">Últimos 7 dias</SelectItem>
                            <SelectItem value="month">Este Mês</SelectItem>
                            <SelectItem value="year">Este Ano</SelectItem>
                            <SelectItem value="all">Tudo</SelectItem>
                        </SelectContent>
                    </Select>

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
                                Tipo
                            </label>
                            <select className="w-full text-sm border border-slate-200 rounded-md px-2 py-1">
                                <option value="">Todos</option>
                                <option value="receita">Receitas</option>
                                <option value="despesa">Despesas</option>
                            </select>
                        </div>
                        
                        <div>
                            <label className="block text-xs font-medium text-slate-600 mb-1">
                                Categoria
                            </label>
                            <select className="w-full text-sm border border-slate-200 rounded-md px-2 py-1">
                                <option value="">Todas</option>
                                <option value="servicos">Serviços</option>
                                <option value="pecas">Peças</option>
                                <option value="combustivel">Combustível</option>
                                <option value="aluguel">Aluguel</option>
                            </select>
                        </div>
                        
                        <div>
                            <label className="block text-xs font-medium text-slate-600 mb-1">
                                Valor Mínimo
                            </label>
                            <input 
                                type="number" 
                                className="w-full text-sm border border-slate-200 rounded-md px-2 py-1"
                                placeholder="R$ 0,00"
                            />
                        </div>
                        
                        <div>
                            <label className="block text-xs font-medium text-slate-600 mb-1">
                                Valor Máximo
                            </label>
                            <input 
                                type="number" 
                                className="w-full text-sm border border-slate-200 rounded-md px-2 py-1"
                                placeholder="R$ 999,99"
                            />
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
                            className="bg-green-600 hover:bg-green-700 text-white"
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
                    <AlertTriangle className="w-10 h-10 text-white" />
                </div>
                <h2 className="text-xl font-bold bg-gradient-to-r from-red-600 to-red-700 bg-clip-text text-transparent mb-2">
                    Erro ao Carregar Dados Financeiros
                </h2>
                <p className="text-slate-600 mb-6">
                    Não foi possível carregar os dados financeiros. Verifique sua conexão e tente novamente.
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
const EmptyState = memo(({ onNewTransacao, searchTerm }) => (
    <div className="text-center py-16 px-6 bg-gradient-to-br from-white via-slate-50/50 to-green-50/30 rounded-2xl border border-slate-200/60 shadow-lg backdrop-blur-sm">
        <div className="w-24 h-24 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-xl">
            <DollarSign className="w-12 h-12 text-white" />
        </div>
        <h3 className="text-2xl font-bold bg-gradient-to-r from-slate-800 to-green-700 bg-clip-text text-transparent mb-3">
            {searchTerm ? 'Nenhuma transação encontrada' : 'Nenhuma transação registrada'}
        </h3>
        <p className="text-slate-600 mb-8 text-lg max-w-md mx-auto">
            {searchTerm 
                ? 'Tente ajustar os termos da sua busca ou registre uma nova transação.' 
                : 'Comece registrando sua primeira transação para acompanhar o fluxo financeiro da oficina.'
            }
        </p>
        <ModernButton 
            onClick={onNewTransacao}
            className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 shadow-lg hover:shadow-xl"
            size="lg"
        >
            <Plus className="w-5 h-5 mr-2" />
            Registrar Primeira Transação
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
            
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Array(4).fill(0).map((_, i) => (
                <div key={i} className="h-24 bg-gradient-to-r from-slate-200 to-slate-300 rounded-lg animate-pulse" />
            ))}
        </div>
    </div>
));

// Componente principal completo
export default function FinanceiroComplete() {
    const { 
        transacoes, 
        stats, 
        isLoading, 
        error, 
        reload, 
        lastUpdate, 
        isCacheValid,
        filterPeriod,
        setFilterPeriod
    } = useFinanceiroDataOptimized();
    
    const [searchTerm, setSearchTerm] = useState("");
    const [isModalOpen, setModalOpen] = useState(false);
    const [editingTransacao, setEditingTransacao] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    // Resetar página quando o filtro de período mudar
    useEffect(() => {
        setCurrentPage(1);
    }, [filterPeriod]);

    const filteredTransacoes = useMemo(() =>
        transacoes.filter(transacao => {
            const termo = searchTerm.toLowerCase();
            return (
                transacao.descricao?.toLowerCase().includes(termo) ||
                transacao.categoria?.toLowerCase().includes(termo)
            );
        }), [transacoes, searchTerm]);
    
    // Calcular transações para exibir com paginação
    const displayedTransacoes = useMemo(() => {
        if (filterPeriod === 'all') {
            const startIndex = (currentPage - 1) * itemsPerPage;
            return filteredTransacoes.slice(startIndex, startIndex + itemsPerPage);
        }
        return filteredTransacoes.slice(0, 10);
    }, [filteredTransacoes, filterPeriod, currentPage, itemsPerPage]);
    
    const totalPages = useMemo(() => 
        Math.ceil(filteredTransacoes.length / itemsPerPage), 
        [filteredTransacoes.length, itemsPerPage]
    );

    const handleNewTransacao = useCallback(() => {
        setEditingTransacao(null);
        setModalOpen(true);
    }, []);

    const handleEditTransacao = useCallback((transacao) => {
        setEditingTransacao(transacao);
        setModalOpen(true);
    }, []);

    const handleModalSuccess = useCallback(() => {
        setModalOpen(false);
        setEditingTransacao(null);
        reload();
    }, [reload]);

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
                            <div className="absolute inset-0 bg-gradient-to-r from-green-500/5 to-emerald-500/5 rounded-2xl" />
                            <div className="relative flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                                <div className="space-y-2">
                                    <h1 className="text-3xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent">
                                        Gestão Financeira Avançada
                                    </h1>
                                    <p className="text-slate-600">
                                        Controle completo das finanças da sua oficina com análises inteligentes
                                    </p>
                                </div>
                                <ModernButton 
                                    onClick={handleNewTransacao} 
                                    size="lg"
                                    className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
                                >
                                    <Plus className="w-5 h-5 mr-2" />
                                    <span className="font-medium">Nova Transação</span>
                                </ModernButton>
                            </div>
                        </div>
                    </header>

                    {/* Status do Sistema */}
                    <FinanceiroStatusBar 
                        stats={stats}
                        lastUpdate={lastUpdate}
                        isCacheValid={isCacheValid}
                        onRefresh={reload}
                        isLoading={isLoading}
                    />

                    {/* Barra de Ações Rápidas */}
                    <FinanceiroQuickActionsBar 
                        stats={stats}
                        onSearch={setSearchTerm}
                        onFilter={(filters) => console.log('Filtrar:', filters)}
                        onExport={() => console.log('Exportar transações')}
                        filterPeriod={filterPeriod}
                        setFilterPeriod={setFilterPeriod}
                    />

                    {/* Métricas Avançadas */}
                    <FinanceiroAdvancedMetrics 
                        transacoes={transacoes} 
                    />

                    {/* Conteúdo Principal */}
                    {filteredTransacoes.length > 0 ? (
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
                            {/* Gráfico */}
                            <div className="lg:col-span-2">
                                <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
                                    <div className="absolute inset-0 bg-gradient-to-r from-green-500/5 to-emerald-500/5 rounded-2xl" />
                                    <CardHeader className="relative">
                                        <CardTitle className="flex items-center gap-3 text-xl text-slate-800">
                                            <div className="p-2 rounded-xl bg-gradient-to-r from-green-500 to-emerald-500">
                                                <BarChart3 className="w-5 h-5 text-white" />
                                            </div>
                                            Fluxo de Caixa
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="relative">
                                        <FinanceiroChart transacoes={filteredTransacoes} />
                                    </CardContent>
                                </Card>
                            </div>

                            {/* Tabela de Transações Recentes */}
                            <div className="lg:col-span-1">
                                <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
                                    <div className="absolute inset-0 bg-gradient-to-r from-green-500/5 to-emerald-500/5 rounded-2xl" />
                                    <CardHeader className="relative">
                                        <CardTitle className="flex items-center gap-3 text-xl text-slate-800">
                                            <div className="p-2 rounded-xl bg-gradient-to-r from-green-500 to-emerald-500">
                                                <TrendingUp className="w-5 h-5 text-white" />
                                            </div>
                                            Transações Recentes
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="relative">
                                        <FinanceiroTable 
                                            transacoes={displayedTransacoes} 
                                            onEditTransacao={handleEditTransacao} 
                                        />
                                        
                                        {/* Informação de Paginação */}
                                        <div className="mt-4 flex items-center justify-between text-sm text-slate-600 border-t pt-4">
                                            <div className="flex items-center gap-2">
                                                <Clock className="w-4 h-4" />
                                                <span>
                                                    Mostrando {displayedTransacoes.length} de {filteredTransacoes.length} transações
                                                </span>
                                            </div>
                                            
                                            {filterPeriod === 'all' && totalPages > 1 && (
                                                <div className="flex items-center gap-2">
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                                                        disabled={currentPage === 1}
                                                        className="h-8 px-3"
                                                    >
                                                        Anterior
                                                    </Button>
                                                    
                                                    <span className="px-3 py-1 bg-slate-100 rounded-md font-medium">
                                                        Página {currentPage} de {totalPages}
                                                    </span>
                                                    
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                                                        disabled={currentPage === totalPages}
                                                        className="h-8 px-3"
                                                    >
                                                        Próxima
                                                    </Button>
                                                </div>
                                            )}
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>
                        </div>
                    ) : (
                        <EmptyState onNewTransacao={handleNewTransacao} searchTerm={searchTerm} />
                    )}

            {/* Modal */}
            <FinanceiroModal
                isOpen={isModalOpen}
                onClose={() => setModalOpen(false)}
                transacao={editingTransacao}
                onSuccess={handleModalSuccess}
            />
        </div>
    );
}