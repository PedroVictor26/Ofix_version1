import { useState, useEffect } from 'react';
import { RefreshCw, Activity, AlertTriangle, DollarSign, TrendingUp } from 'lucide-react';
import { useSystemStatus } from '@/hooks/useSystemStatus';
import { ModernSpinner } from '@/components/ui/modern-skeleton';

const StatusCard = ({ 
    icon: Icon, 
    title, 
    value, 
    subtitle, 
    bgClass, 
    textClass, 
    badgeClass,
    isLoading = false 
}) => (
    <div className={`p-3 rounded-lg border transition-all duration-300 hover:shadow-md ${bgClass}`}>
        <div className="flex items-center justify-between">
            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                    <Icon className={`w-4 h-4 ${textClass}`} />
                    <span className="text-sm font-medium text-slate-700 truncate">{title}</span>
                </div>
                <div className="text-xs text-slate-500 mb-2">{subtitle}</div>
                {isLoading ? (
                    <ModernSpinner size="sm" className="mt-1" />
                ) : (
                    <div className={`font-bold text-sm px-2 py-1 rounded-full inline-block ${badgeClass}`}>
                        {value}
                    </div>
                )}
            </div>
        </div>
    </div>
);

const SystemStatusWidget = ({ compact = false }) => {
    const { 
        servicosAtivos, 
        estoqueBaixo, 
        faturamentoHojeFormatted, 
        isLoading, 
        error,
        refresh 
    } = useSystemStatus();
    
    const [isRefreshing, setIsRefreshing] = useState(false);

    const handleRefresh = async () => {
        setIsRefreshing(true);
        await refresh();
        setIsRefreshing(false);
    };

    const statusData = [
        {
            icon: Activity,
            title: "Serviços Ativos",
            value: servicosAtivos,
            subtitle: "Em andamento",
            bgClass: "bg-gradient-to-r from-blue-50 to-blue-100 border-blue-200",
            textClass: "text-blue-600",
            badgeClass: "bg-blue-200 text-blue-700"
        },
        {
            icon: AlertTriangle,
            title: "Estoque Baixo",
            value: estoqueBaixo,
            subtitle: "Requer atenção",
            bgClass: "bg-gradient-to-r from-orange-50 to-orange-100 border-orange-200",
            textClass: "text-orange-600",
            badgeClass: "bg-orange-200 text-orange-700"
        },
        {
            icon: DollarSign,
            title: "Faturamento Hoje",
            value: faturamentoHojeFormatted,
            subtitle: "Receita atual",
            bgClass: "bg-gradient-to-r from-green-50 to-green-100 border-green-200",
            textClass: "text-green-600",
            badgeClass: "bg-green-200 text-green-700"
        }
    ];

    if (error && !isLoading) {
        return (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                    <AlertTriangle className="w-4 h-4 text-red-500" />
                    <span className="text-sm font-medium text-red-700">Erro no Status</span>
                </div>
                <p className="text-xs text-red-600 mb-2">{error}</p>
                <button
                    onClick={handleRefresh}
                    disabled={isRefreshing}
                    className="text-xs text-red-600 hover:text-red-700 underline disabled:opacity-50"
                >
                    {isRefreshing ? 'Tentando...' : 'Tentar novamente'}
                </button>
            </div>
        );
    }

    return (
        <div className="space-y-3">
            {/* Header com botão de refresh */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${isLoading ? 'bg-yellow-500 animate-pulse' : 'bg-green-500'}`}></div>
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                        Status do Sistema
                    </span>
                </div>
                <button
                    onClick={handleRefresh}
                    disabled={isRefreshing || isLoading}
                    className="p-1 rounded hover:bg-slate-100 transition-colors disabled:opacity-50"
                    title="Atualizar status"
                >
                    <RefreshCw className={`w-3 h-3 text-slate-400 ${isRefreshing ? 'animate-spin' : ''}`} />
                </button>
            </div>

            {/* Cards de status */}
            <div className="space-y-3">
                {statusData.map((item, index) => (
                    <StatusCard
                        key={index}
                        icon={item.icon}
                        title={item.title}
                        value={item.value}
                        subtitle={item.subtitle}
                        bgClass={item.bgClass}
                        textClass={item.textClass}
                        badgeClass={item.badgeClass}
                        isLoading={isLoading}
                    />
                ))}
            </div>

            {/* Última atualização */}
            {!isLoading && !error && (
                <div className="text-xs text-slate-400 text-center mt-3">
                    <TrendingUp className="w-3 h-3 inline mr-1" />
                    Atualizado {new Date().toLocaleTimeString('pt-BR', { 
                        hour: '2-digit', 
                        minute: '2-digit' 
                    })}
                </div>
            )}
        </div>
    );
};

export default SystemStatusWidget;
