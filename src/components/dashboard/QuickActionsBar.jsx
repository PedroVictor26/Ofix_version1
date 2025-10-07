import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
    Search, Filter, Download, Calendar, 
    AlertTriangle, Clock, CheckCircle2, Users
} from "lucide-react";

export default function QuickActionsBar({ stats, onSearch, onFilter, onExport }) {
    const [searchTerm, setSearchTerm] = useState('');
    const [showFilters, setShowFilters] = useState(false);

    const handleSearch = (value) => {
        setSearchTerm(value);
        if (onSearch) onSearch(value);
    };

    const urgentCount = stats?.AGUARDANDO_APROVACAO || 0;
    const activeCount = stats?.EM_ANDAMENTO || 0;
    const completedToday = stats?.FINALIZADO || 0;

    return (
        <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-md border-0 p-4 mb-6">
            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
                {/* Barra de Busca */}
                <div className="flex items-center gap-3 flex-1 max-w-md">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <Input
                            placeholder="Buscar por OS, cliente ou veículo..."
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
                    {/* Urgentes */}
                    {urgentCount > 0 && (
                        <div className="flex items-center gap-2 px-3 py-1.5 bg-red-50 border border-red-200 rounded-lg">
                            <AlertTriangle className="w-4 h-4 text-red-600" />
                            <span className="text-sm font-medium text-red-700">
                                {urgentCount} Urgente{urgentCount > 1 ? 's' : ''}
                            </span>
                        </div>
                    )}

                    {/* Em Andamento */}
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 border border-blue-200 rounded-lg">
                        <Clock className="w-4 h-4 text-blue-600" />
                        <span className="text-sm font-medium text-blue-700">
                            {activeCount} Ativo{activeCount !== 1 ? 's' : ''}
                        </span>
                    </div>

                    {/* Finalizados Hoje */}
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-green-50 border border-green-200 rounded-lg">
                        <CheckCircle2 className="w-4 h-4 text-green-600" />
                        <span className="text-sm font-medium text-green-700">
                            {completedToday} Finalizado{completedToday !== 1 ? 's' : ''}
                        </span>
                    </div>

                    {/* Botão de Exportar */}
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
                                <option value="AGUARDANDO">Aguardando</option>
                                <option value="EM_ANDAMENTO">Em Andamento</option>
                                <option value="FINALIZADO">Finalizado</option>
                            </select>
                        </div>
                        
                        <div>
                            <label className="block text-xs font-medium text-slate-600 mb-1">
                                Período
                            </label>
                            <select className="w-full text-sm border border-slate-200 rounded-md px-2 py-1">
                                <option value="">Todos</option>
                                <option value="hoje">Hoje</option>
                                <option value="semana">Esta Semana</option>
                                <option value="mes">Este Mês</option>
                            </select>
                        </div>
                        
                        <div>
                            <label className="block text-xs font-medium text-slate-600 mb-1">
                                Cliente
                            </label>
                            <Input
                                placeholder="Nome do cliente"
                                className="text-sm border-slate-200"
                            />
                        </div>
                        
                        <div>
                            <label className="block text-xs font-medium text-slate-600 mb-1">
                                Valor
                            </label>
                            <select className="w-full text-sm border border-slate-200 rounded-md px-2 py-1">
                                <option value="">Todos</option>
                                <option value="0-500">R$ 0 - 500</option>
                                <option value="500-1000">R$ 500 - 1.000</option>
                                <option value="1000+">R$ 1.000+</option>
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
}