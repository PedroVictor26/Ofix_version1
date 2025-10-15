import { useState, useMemo, useCallback, memo, useEffect } from "react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Card, CardContent } from "../components/ui/card";
import { 
    Plus, Search, Building2, AlertTriangle, RefreshCw
} from "lucide-react";

import { useEstoqueDataOptimized } from "../hooks/useEstoqueDataOptimized";
import EstoqueStats from "../components/estoque/EstoqueStats";
import PecasListTable from "../components/estoque/PecasListTable";
import PecaModal from "../components/estoque/PecaModal";
import FornecedorModal from "../components/estoque/FornecedorModal";
import { ModernButton } from "../components/ui/modern-input";

// Componente de Status do Sistema para Estoque
const EstoqueStatusBar = memo(({ stats, onRefresh, isLoading }) => {
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

    return (
        <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-md mb-6">
            <CardContent className="p-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-6">
                        <div className="flex items-center gap-2">
                            <div className={`w-2 h-2 rounded-full ${isOnline ? 'bg-green-500' : 'bg-red-500'}`} />
                            <span className="text-sm font-medium text-slate-700">
                                {isOnline ? 'Online' : 'Offline'}
                            </span>
                        </div>

                        <div className="flex items-center gap-4 ml-4 pl-4 border-l border-slate-200">
                            <div className="text-center">
                                <div className="text-lg font-bold text-blue-600">{stats?.totalPecas || 0}</div>
                                <div className="text-xs text-slate-500">Itens</div>
                            </div>
                            <div className="text-center">
                                <div className="text-lg font-bold text-red-600">{stats?.pecasEstoqueBaixo || 0}</div>
                                <div className="text-xs text-slate-500">Baixo</div>
                            </div>
                            <div className="text-center">
                                <div className="text-lg font-bold text-green-600">{stats?.totalFornecedores || 0}</div>
                                <div className="text-xs text-slate-500">Fornecedores</div>
                            </div>
                        </div>
                    </div>

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

export default function EstoqueComplete() {
    const { pecas, fornecedores, stats, isLoading, error, reload } = useEstoqueDataOptimized();
    const [searchTerm, setSearchTerm] = useState("");
    const [editingPeca, setEditingPeca] = useState(null);
    const [isPecaModalOpen, setPecaModalOpen] = useState(false);
    const [isFornecedorModalOpen, setFornecedorModalOpen] = useState(false);

    const filteredPecas = useMemo(() => {
        const term = searchTerm.toLowerCase();
        if (!term) return pecas;
        return pecas.filter(p => 
            p.nome?.toLowerCase().includes(term) || 
            p.codigoInterno?.toLowerCase().includes(term) ||
            p.codigoFabricante?.toLowerCase().includes(term)
        );
    }, [pecas, searchTerm]);

    const handleNewPeca = useCallback(() => {
        setEditingPeca(null);
        setPecaModalOpen(true);
    }, []);

    const handleEditPeca = useCallback((peca) => {
        setEditingPeca(peca);
        setPecaModalOpen(true);
    }, []);

    const handleNewFornecedor = useCallback(() => {
        setFornecedorModalOpen(true);
    }, []);

    const handleModalSuccess = useCallback(() => {
        reload();
        setPecaModalOpen(false);
        setFornecedorModalOpen(false);
    }, [reload]);

    if (error) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="text-center p-8 bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border-0 max-w-md">
                    <div className="w-20 h-20 bg-gradient-to-br from-red-500 to-red-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg">
                        <AlertTriangle className="w-10 h-10 text-white" />
                    </div>
                    <h2 className="text-xl font-bold text-red-600 mb-2">Erro ao Carregar Estoque</h2>
                    <p className="text-slate-600 mb-6">Não foi possível carregar os dados do estoque.</p>
                    <ModernButton onClick={reload}>
                        <RefreshCw className="w-4 h-4 mr-2" />
                        Tentar Novamente
                    </ModernButton>
                </div>
            </div>
        );
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
                                        Controle de Estoque Otimizado
                                    </h1>
                                    <p className="text-slate-600">
                                        Gerencie suas peças e fornecedores com eficiência total
                                    </p>
                                </div>
                                <div className="flex items-center gap-3">
                                    <ModernButton 
                                        onClick={handleNewFornecedor} 
                                        variant="outline"
                                        className="bg-white/80 backdrop-blur-sm shadow-lg hover:shadow-xl hover:bg-white transition-all duration-300 hover:scale-105"
                                    >
                                        <Building2 className="w-5 h-5 mr-2 text-purple-600" />
                                        <span className="font-medium text-slate-700">Novo Fornecedor</span>
                                    </ModernButton>
                                    <ModernButton 
                                        onClick={handleNewPeca} 
                                        size="lg"
                                        className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
                                    >
                                        <Plus className="w-5 h-5 mr-2" />
                                        <span className="font-medium">Nova Peça</span>
                                    </ModernButton>
                                </div>
                            </div>
                        </div>
                    </header>

                    {/* Status do Sistema */}
                    <EstoqueStatusBar 
                        stats={stats}
                        onRefresh={reload}
                        isLoading={isLoading}
                    />

                    {/* Stats Principais */}
                    <section className="mb-8">
                        <EstoqueStats stats={stats} isLoading={isLoading} />
                    </section>

                    {/* Tabela de Peças */}
                    <main className="bg-white/80 backdrop-blur-sm p-6 rounded-2xl shadow-lg border-0">
                        <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-purple-500/5 rounded-2xl" />
                        <div className="relative">
                            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
                                <h2 className="text-xl font-bold text-slate-800">
                                    Peças em Estoque ({filteredPecas.length})
                                </h2>
                                <div className="relative max-w-sm w-full sm:w-auto">
                                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none" />
                                    <Input
                                        placeholder="Buscar por nome ou SKU..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="pl-11 pr-4 py-3 h-12 rounded-xl border-0 shadow-lg bg-white/80 backdrop-blur-sm focus:bg-white focus:shadow-xl transition-all duration-300 placeholder:text-slate-400"
                                    />
                                </div>
                            </div>
                            
                            {stats?.pecasEstoqueBaixo > 0 && (
                                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                                    <div className="flex items-center gap-2 text-red-700">
                                        <AlertTriangle className="w-4 h-4" />
                                        <span className="text-sm font-medium">
                                            {stats.pecasEstoqueBaixo} peça{stats.pecasEstoqueBaixo > 1 ? 's' : ''} com estoque baixo
                                        </span>
                                    </div>
                                </div>
                            )}
                            
                            <PecasListTable 
                                pecas={filteredPecas} 
                                fornecedores={fornecedores} 
                                onEditPeca={handleEditPeca}
                                onDeletePeca={loadPecas}
                            />
                        </div>
                    </main>

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