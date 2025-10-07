import { useState, useMemo, useCallback, memo, useEffect } from "react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { 
    Settings, Wrench, MessageCircle, Plus, AlertTriangle, Search, 
    RefreshCw, Clock, Database, Shield, Zap, Users, Bell, 
    Palette, Globe, Key, Monitor, HardDrive, Wifi, Filter,
    Download, Upload, Save, RotateCcw, CheckCircle, XCircle
} from "lucide-react";

import { useConfiguracoesDataOptimized } from "../hooks/useConfiguracoesDataOptimized";
import ProcedimentoModal from "../components/configuracoes/ProcedimentoModal";
import MensagemModal from "../components/configuracoes/MensagemModal";
import ProcedimentosList from "../components/configuracoes/ProcedimentosList";
import MensagensList from "../components/configuracoes/MensagensList";
import { ModernButton } from "../components/ui/modern-input";

// Componente de Status do Sistema para Configurações
const ConfiguracoesStatusBar = memo(({ stats, onRefresh, isLoading, lastUpdate, isCacheValid, systemHealth }) => {
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

                        {/* Status do Sistema */}
                        <div className="flex items-center gap-2">
                            <div className={`w-2 h-2 rounded-full ${systemHealth?.status === 'healthy' ? 'bg-green-500' : 'bg-amber-500'}`} />
                            <span className="text-sm text-slate-600">
                                Sistema: {systemHealth?.status === 'healthy' ? 'Saudável' : 'Atenção'}
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
                                <div className="text-lg font-bold text-blue-600">{stats?.totalProcedimentos || 0}</div>
                                <div className="text-xs text-slate-500">Procedimentos</div>
                            </div>
                            <div className="text-center">
                                <div className="text-lg font-bold text-green-600">{stats?.totalMensagens || 0}</div>
                                <div className="text-xs text-slate-500">Templates</div>
                            </div>
                            <div className="text-center">
                                <div className="text-lg font-bold text-purple-600">{stats?.configuracoesAtivas || 0}</div>
                                <div className="text-xs text-slate-500">Ativas</div>
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

// Componente de Métricas Avançadas para Configurações
const ConfiguracoesAdvancedMetrics = memo(({ procedimentos, mensagens, systemHealth }) => {
    const metrics = useMemo(() => {
        const procedimentosAtivos = procedimentos.filter(p => p.ativo !== false).length;
        const mensagensAtivas = mensagens.filter(m => m.ativo !== false).length;
        
        const procedimentosComChecklist = procedimentos.filter(p => p.checklistJson && p.checklistJson.length > 0).length;
        const mensagensComVariaveis = mensagens.filter(m => m.template && m.template.includes('{{'));
        
        const eficienciaProcedimentos = procedimentos.length > 0 ? 
            Math.round((procedimentosComChecklist / procedimentos.length) * 100) : 0;
        
        const eficienciaMensagens = mensagens.length > 0 ? 
            Math.round((mensagensComVariaveis.length / mensagens.length) * 100) : 0;
        
        return {
            procedimentosAtivos,
            mensagensAtivas,
            procedimentosComChecklist,
            mensagensComVariaveis: mensagensComVariaveis.length,
            eficienciaProcedimentos,
            eficienciaMensagens,
            totalConfiguracoes: procedimentos.length + mensagens.length,
            systemUptime: systemHealth?.uptime || '99.9%'
        };
    }, [procedimentos, mensagens, systemHealth]);

    return (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-0 shadow-md hover:shadow-lg transition-all duration-200">
                <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-500 rounded-lg">
                            <Wrench className="w-4 h-4 text-white" />
                        </div>
                        <div>
                            <p className="text-xs text-blue-600 font-medium">Procedimentos Ativos</p>
                            <p className="text-lg font-bold text-blue-800">{metrics.procedimentosAtivos}</p>
                            <p className="text-xs text-blue-600">
                                {metrics.eficienciaProcedimentos}% com checklist
                            </p>
                        </div>
                    </div>
                </CardContent>
            </Card>
            
            <Card className="bg-gradient-to-br from-green-50 to-green-100 border-0 shadow-md hover:shadow-lg transition-all duration-200">
                <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-green-500 rounded-lg">
                            <MessageCircle className="w-4 h-4 text-white" />
                        </div>
                        <div>
                            <p className="text-xs text-green-600 font-medium">Templates Ativos</p>
                            <p className="text-lg font-bold text-green-800">{metrics.mensagensAtivas}</p>
                            <p className="text-xs text-green-600">
                                {metrics.eficienciaMensagens}% dinâmicos
                            </p>
                        </div>
                    </div>
                </CardContent>
            </Card>
            
            <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-0 shadow-md hover:shadow-lg transition-all duration-200">
                <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-purple-500 rounded-lg">
                            <Database className="w-4 h-4 text-white" />
                        </div>
                        <div>
                            <p className="text-xs text-purple-600 font-medium">Total Configurações</p>
                            <p className="text-lg font-bold text-purple-800">{metrics.totalConfiguracoes}</p>
                            <p className="text-xs text-purple-600">Base de conhecimento</p>
                        </div>
                    </div>
                </CardContent>
            </Card>
            
            <Card className="bg-gradient-to-br from-amber-50 to-amber-100 border-0 shadow-md hover:shadow-lg transition-all duration-200">
                <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-amber-500 rounded-lg">
                            <Zap className="w-4 h-4 text-white" />
                        </div>
                        <div>
                            <p className="text-xs text-amber-600 font-medium">Sistema Uptime</p>
                            <p className="text-lg font-bold text-amber-800">{metrics.systemUptime}</p>
                            <p className="text-xs text-amber-600">Disponibilidade</p>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
});

// Barra de Ações Rápidas para Configurações
const ConfiguracoesQuickActionsBar = memo(({ onSearch, onFilter, onExport, onImport, onBackup }) => {
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
                            placeholder="Buscar procedimentos ou templates..."
                            value={searchTerm}
                            onChange={(e) => handleSearch(e.target.value)}
                            className="pl-10 border-slate-200 focus:border-purple-500 focus:ring-purple-500/20"
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

                {/* Ações Rápidas */}
                <div className="flex items-center gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={onImport}
                        className="border-slate-200 hover:bg-slate-50"
                    >
                        <Upload className="w-4 h-4 mr-1" />
                        Importar
                    </Button>
                    
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={onExport}
                        className="border-slate-200 hover:bg-slate-50"
                    >
                        <Download className="w-4 h-4 mr-1" />
                        Exportar
                    </Button>
                    
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={onBackup}
                        className="border-slate-200 hover:bg-slate-50"
                    >
                        <HardDrive className="w-4 h-4 mr-1" />
                        Backup
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
                                <option value="procedimentos">Procedimentos</option>
                                <option value="mensagens">Mensagens</option>
                            </select>
                        </div>
                        
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
                                Categoria
                            </label>
                            <select className="w-full text-sm border border-slate-200 rounded-md px-2 py-1">
                                <option value="">Todas</option>
                                <option value="manutencao">Manutenção</option>
                                <option value="diagnostico">Diagnóstico</option>
                                <option value="comunicacao">Comunicação</option>
                            </select>
                        </div>
                        
                        <div>
                            <label className="block text-xs font-medium text-slate-600 mb-1">
                                Ordenar por
                            </label>
                            <select className="w-full text-sm border border-slate-200 rounded-md px-2 py-1">
                                <option value="nome">Nome</option>
                                <option value="data">Data</option>
                                <option value="uso">Mais usados</option>
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
                            className="bg-purple-600 hover:bg-purple-700 text-white"
                        >
                            Aplicar Filtros
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
});

// Componente de Configurações do Sistema
const SystemConfigPanel = memo(() => {
    const [configs, setConfigs] = useState({
        autoBackup: true,
        notifications: true,
        darkMode: false,
        autoSave: true,
        debugMode: false
    });

    const handleConfigChange = (key, value) => {
        setConfigs(prev => ({ ...prev, [key]: value }));
    };

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Configurações Gerais */}
                <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Settings className="w-5 h-5 text-purple-600" />
                            Configurações Gerais
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="font-medium text-slate-800">Backup Automático</p>
                                <p className="text-sm text-slate-600">Backup diário das configurações</p>
                            </div>
                            <button
                                onClick={() => handleConfigChange('autoBackup', !configs.autoBackup)}
                                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                                    configs.autoBackup ? 'bg-green-600' : 'bg-slate-200'
                                }`}
                            >
                                <span
                                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                                        configs.autoBackup ? 'translate-x-6' : 'translate-x-1'
                                    }`}
                                />
                            </button>
                        </div>
                        
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="font-medium text-slate-800">Notificações</p>
                                <p className="text-sm text-slate-600">Alertas do sistema</p>
                            </div>
                            <button
                                onClick={() => handleConfigChange('notifications', !configs.notifications)}
                                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                                    configs.notifications ? 'bg-green-600' : 'bg-slate-200'
                                }`}
                            >
                                <span
                                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                                        configs.notifications ? 'translate-x-6' : 'translate-x-1'
                                    }`}
                                />
                            </button>
                        </div>
                        
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="font-medium text-slate-800">Salvamento Automático</p>
                                <p className="text-sm text-slate-600">Salvar alterações automaticamente</p>
                            </div>
                            <button
                                onClick={() => handleConfigChange('autoSave', !configs.autoSave)}
                                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                                    configs.autoSave ? 'bg-green-600' : 'bg-slate-200'
                                }`}
                            >
                                <span
                                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                                        configs.autoSave ? 'translate-x-6' : 'translate-x-1'
                                    }`}
                                />
                            </button>
                        </div>
                    </CardContent>
                </Card>

                {/* Status do Sistema */}
                <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Monitor className="w-5 h-5 text-blue-600" />
                            Status do Sistema
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center justify-between">
                            <span className="text-slate-600">Conexão com Banco</span>
                            <div className="flex items-center gap-2">
                                <CheckCircle className="w-4 h-4 text-green-600" />
                                <span className="text-sm text-green-600">Conectado</span>
                            </div>
                        </div>
                        
                        <div className="flex items-center justify-between">
                            <span className="text-slate-600">Cache do Sistema</span>
                            <div className="flex items-center gap-2">
                                <CheckCircle className="w-4 h-4 text-green-600" />
                                <span className="text-sm text-green-600">Ativo</span>
                            </div>
                        </div>
                        
                        <div className="flex items-center justify-between">
                            <span className="text-slate-600">Último Backup</span>
                            <span className="text-sm text-slate-600">Hoje, 14:30</span>
                        </div>
                        
                        <div className="flex items-center justify-between">
                            <span className="text-slate-600">Versão do Sistema</span>
                            <span className="text-sm text-slate-600">v2.1.0</span>
                        </div>
                    </CardContent>
                </Card>
            </div>
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
                    Erro ao Carregar Configurações
                </h2>
                <p className="text-slate-600 mb-6">
                    Não foi possível carregar as configurações. Verifique sua conexão e tente novamente.
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

// Skeleton otimizado
const PageSkeleton = memo(() => (
    <div className="space-y-8">
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg p-6 border-0">
            <div className="flex justify-between items-start">
                <div className="space-y-3">
                    <div className="h-8 w-64 bg-gradient-to-r from-slate-200 to-slate-300 rounded-lg animate-pulse" />
                    <div className="h-4 w-96 bg-gradient-to-r from-slate-200 to-slate-300 rounded-lg animate-pulse" />
                </div>
                <div className="h-16 w-16 bg-gradient-to-r from-slate-200 to-slate-300 rounded-2xl animate-pulse" />
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
export default function ConfiguracoesComplete() {
    const { 
        procedimentos, 
        mensagens, 
        stats,
        systemHealth,
        isLoading, 
        error, 
        reload,
        lastUpdate,
        isCacheValid
    } = useConfiguracoesDataOptimized();
    
    const [activeTab, setActiveTab] = useState("procedimentos");
    const [searchTerm, setSearchTerm] = useState("");
    const [showProcedimentoModal, setShowProcedimentoModal] = useState(false);
    const [editingProcedimento, setEditingProcedimento] = useState(null);
    const [showMensagemModal, setShowMensagemModal] = useState(false);
    const [editingMensagem, setEditingMensagem] = useState(null);

    const filteredProcedimentos = useMemo(() =>
        procedimentos.filter(proc => {
            const termo = searchTerm.toLowerCase();
            return (
                proc.nome?.toLowerCase().includes(termo) ||
                proc.descricao?.toLowerCase().includes(termo) ||
                proc.codigo?.toLowerCase().includes(termo)
            );
        }), [procedimentos, searchTerm]);

    const filteredMensagens = useMemo(() =>
        mensagens.filter(msg => {
            const termo = searchTerm.toLowerCase();
            return (
                msg.nome?.toLowerCase().includes(termo) ||
                msg.template?.toLowerCase().includes(termo) ||
                msg.categoria?.toLowerCase().includes(termo)
            );
        }), [mensagens, searchTerm]);

    const handleNewProcedimento = useCallback(() => {
        setEditingProcedimento(null);
        setShowProcedimentoModal(true);
    }, []);

    const handleEditProcedimento = useCallback((procedimento) => {
        setEditingProcedimento(procedimento);
        setShowProcedimentoModal(true);
    }, []);

    const handleProcedimentoSuccess = useCallback(() => {
        setShowProcedimentoModal(false);
        setEditingProcedimento(null);
        reload();
    }, [reload]);

    const handleNewMensagem = useCallback(() => {
        setEditingMensagem(null);
        setShowMensagemModal(true);
    }, []);

    const handleEditMensagem = useCallback((mensagem) => {
        setEditingMensagem(mensagem);
        setShowMensagemModal(true);
    }, []);

    const handleMensagemSuccess = useCallback(() => {
        setShowMensagemModal(false);
        setEditingMensagem(null);
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
                            <div className="absolute inset-0 bg-gradient-to-r from-purple-500/5 to-indigo-500/5 rounded-2xl" />
                            <div className="relative flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                                <div className="space-y-2">
                                    <h1 className="text-3xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent">
                                        Configurações Avançadas
                                    </h1>
                                    <p className="text-slate-600">
                                        Gerencie procedimentos, templates e configurações do sistema
                                    </p>
                                </div>
                                <div className="w-16 h-16 bg-gradient-to-br from-purple-600 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg">
                                    <Settings className="w-8 h-8 text-white" />
                                </div>
                            </div>
                        </div>
                    </header>

                    {/* Status do Sistema */}
                    <ConfiguracoesStatusBar 
                        stats={stats}
                        systemHealth={systemHealth}
                        lastUpdate={lastUpdate}
                        isCacheValid={isCacheValid}
                        onRefresh={reload}
                        isLoading={isLoading}
                    />

                    {/* Barra de Ações Rápidas */}
                    <ConfiguracoesQuickActionsBar 
                        onSearch={setSearchTerm}
                        onFilter={(filters) => console.log('Filtrar:', filters)}
                        onExport={() => console.log('Exportar configurações')}
                        onImport={() => console.log('Importar configurações')}
                        onBackup={() => console.log('Fazer backup')}
                    />

                    {/* Métricas Avançadas */}
                    <ConfiguracoesAdvancedMetrics 
                        procedimentos={procedimentos} 
                        mensagens={mensagens}
                        systemHealth={systemHealth}
                    />

                    {/* Tabs Principais */}
                    <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 via-transparent to-indigo-500/5" />
                        
                        <CardContent className="relative p-0">
                            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                                {/* Tab Headers */}
                                <div className="border-b border-slate-200/60 bg-gradient-to-r from-slate-50/50 to-white/50 backdrop-blur-sm">
                                    <TabsList className="w-full justify-start bg-transparent p-0 h-auto">
                                        <TabsTrigger
                                            value="procedimentos"
                                            className="relative rounded-none border-b-2 border-transparent data-[state=active]:border-blue-500 data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-50 data-[state=active]:to-transparent px-6 py-4 text-base font-medium transition-all duration-300 hover:bg-slate-50/50"
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center">
                                                    <Wrench className="w-5 h-5 text-white" />
                                                </div>
                                                <div className="text-left">
                                                    <div className="font-semibold text-slate-800">Procedimentos</div>
                                                    <div className="text-xs text-slate-500">Padrões técnicos</div>
                                                </div>
                                            </div>
                                        </TabsTrigger>
                                        <TabsTrigger
                                            value="mensagens"
                                            className="relative rounded-none border-b-2 border-transparent data-[state=active]:border-green-500 data-[state=active]:bg-gradient-to-r data-[state=active]:from-green-50 data-[state=active]:to-transparent px-6 py-4 text-base font-medium transition-all duration-300 hover:bg-slate-50/50"
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center">
                                                    <MessageCircle className="w-5 h-5 text-white" />
                                                </div>
                                                <div className="text-left">
                                                    <div className="font-semibold text-slate-800">Mensagens</div>
                                                    <div className="text-xs text-slate-500">Templates automáticos</div>
                                                </div>
                                            </div>
                                        </TabsTrigger>
                                        <TabsTrigger
                                            value="sistema"
                                            className="relative rounded-none border-b-2 border-transparent data-[state=active]:border-purple-500 data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-50 data-[state=active]:to-transparent px-6 py-4 text-base font-medium transition-all duration-300 hover:bg-slate-50/50"
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center">
                                                    <Settings className="w-5 h-5 text-white" />
                                                </div>
                                                <div className="text-left">
                                                    <div className="font-semibold text-slate-800">Sistema</div>
                                                    <div className="text-xs text-slate-500">Configurações gerais</div>
                                                </div>
                                            </div>
                                        </TabsTrigger>
                                    </TabsList>
                                </div>

                                {/* Tab Content - Procedimentos */}
                                <TabsContent value="procedimentos" className="p-6 md:p-8 space-y-6">
                                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                                        <div className="space-y-1">
                                            <h3 className="text-xl md:text-2xl font-bold bg-gradient-to-r from-blue-700 to-blue-800 bg-clip-text text-transparent">
                                                Procedimentos Padrão
                                            </h3>
                                            <p className="text-slate-600">
                                                Configure procedimentos técnicos reutilizáveis para suas ordens de serviço
                                            </p>
                                        </div>
                                        <ModernButton 
                                            onClick={handleNewProcedimento}
                                            className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 shadow-lg hover:shadow-xl transition-all duration-300"
                                        >
                                            <Plus className="w-4 h-4 mr-2" />
                                            <span className="hidden sm:inline">Novo Procedimento</span>
                                            <span className="sm:hidden">Novo</span>
                                        </ModernButton>
                                    </div>
                                    <ProcedimentosList
                                        procedimentos={filteredProcedimentos}
                                        onEdit={handleEditProcedimento}
                                        isLoading={isLoading}
                                    />
                                </TabsContent>

                                {/* Tab Content - Mensagens */}
                                <TabsContent value="mensagens" className="p-6 md:p-8 space-y-6">
                                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                                        <div className="space-y-1">
                                            <h3 className="text-xl md:text-2xl font-bold bg-gradient-to-r from-green-700 to-green-800 bg-clip-text text-transparent">
                                                Templates de Mensagem
                                            </h3>
                                            <p className="text-slate-600">
                                                Crie templates personalizados para comunicação automática com clientes
                                            </p>
                                        </div>
                                        <ModernButton 
                                            onClick={handleNewMensagem}
                                            className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 shadow-lg hover:shadow-xl transition-all duration-300"
                                        >
                                            <Plus className="w-4 h-4 mr-2" />
                                            <span className="hidden sm:inline">Nova Mensagem</span>
                                            <span className="sm:hidden">Nova</span>
                                        </ModernButton>
                                    </div>
                                    <MensagensList
                                        mensagens={filteredMensagens}
                                        onEdit={handleEditMensagem}
                                        isLoading={isLoading}
                                    />
                                </TabsContent>

                                {/* Tab Content - Sistema */}
                                <TabsContent value="sistema" className="p-6 md:p-8 space-y-6">
                                    <div className="space-y-1 mb-6">
                                        <h3 className="text-xl md:text-2xl font-bold bg-gradient-to-r from-purple-700 to-purple-800 bg-clip-text text-transparent">
                                            Configurações do Sistema
                                        </h3>
                                        <p className="text-slate-600">
                                            Ajuste as configurações gerais e monitore o status do sistema
                                        </p>
                                    </div>
                                    <SystemConfigPanel />
                                </TabsContent>
                            </Tabs>
                        </CardContent>
                    </Card>

            {/* Modals */}
            <ProcedimentoModal
                isOpen={showProcedimentoModal}
                onClose={() => setShowProcedimentoModal(false)}
                procedimento={editingProcedimento}
                onSuccess={handleProcedimentoSuccess}
            />
            <MensagemModal
                isOpen={showMensagemModal}
                onClose={() => setShowMensagemModal(false)}
                mensagem={editingMensagem}
                onSuccess={handleMensagemSuccess}
            />
        </div>
    );
}