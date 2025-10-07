import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
    Plus, Search, Filter, Download, RefreshCw, 
    Calendar, TrendingUp, AlertTriangle, CheckCircle2,
    Clock, Users, Car, DollarSign
} from "lucide-react";

export default function QuickActions({ onNewService, onRefresh, stats }) {
    const [isRefreshing, setIsRefreshing] = useState(false);

    const handleRefresh = async () => {
        setIsRefreshing(true);
        await onRefresh();
        setTimeout(() => setIsRefreshing(false), 1000);
    };

    const quickStats = [
        {
            label: "Urgentes",
            value: stats?.AGUARDANDO_APROVACAO || 0,
            icon: AlertTriangle,
            color: "text-red-600",
            bgColor: "bg-red-50",
            borderColor: "border-red-200"
        },
        {
            label: "Em Andamento",
            value: stats?.EM_ANDAMENTO || 0,
            icon: Clock,
            color: "text-blue-600",
            bgColor: "bg-blue-50",
            borderColor: "border-blue-200"
        },
        {
            label: "Finalizados Hoje",
            value: stats?.FINALIZADO || 0,
            icon: CheckCircle2,
            color: "text-green-600",
            bgColor: "bg-green-50",
            borderColor: "border-green-200"
        }
    ];

    return (
        <div className="space-y-6">
            {/* Ações Rápidas */}
            <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-lg">
                <CardHeader className="pb-4">
                    <CardTitle className="text-lg font-semibold text-slate-800 flex items-center gap-2">
                        <TrendingUp className="w-5 h-5 text-blue-600" />
                        Ações Rápidas
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        <Button
                            onClick={onNewService}
                            className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-md hover:shadow-lg transition-all duration-200"
                        >
                            <Plus className="w-4 h-4 mr-2" />
                            Nova OS
                        </Button>
                        
                        <Button
                            variant="outline"
                            className="border-slate-200 hover:bg-slate-50 hover:border-slate-300 transition-all duration-200"
                        >
                            <Search className="w-4 h-4 mr-2" />
                            Buscar
                        </Button>
                        
                        <Button
                            variant="outline"
                            className="border-slate-200 hover:bg-slate-50 hover:border-slate-300 transition-all duration-200"
                        >
                            <Filter className="w-4 h-4 mr-2" />
                            Filtrar
                        </Button>
                        
                        <Button
                            onClick={handleRefresh}
                            disabled={isRefreshing}
                            variant="outline"
                            className="border-slate-200 hover:bg-slate-50 hover:border-slate-300 transition-all duration-200"
                        >
                            <RefreshCw className={`w-4 h-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
                            Atualizar
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* Stats Rápidas */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {quickStats.map((stat, index) => (
                    <Card key={index} className={`${stat.bgColor} ${stat.borderColor} border-2 shadow-md hover:shadow-lg transition-all duration-200`}>
                        <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-slate-600">{stat.label}</p>
                                    <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
                                </div>
                                <div className={`p-3 ${stat.bgColor} rounded-full`}>
                                    <stat.icon className={`w-6 h-6 ${stat.color}`} />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Alertas e Notificações */}
            <Card className="bg-gradient-to-r from-amber-50 to-orange-50 border-amber-200 border-2 shadow-md">
                <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                        <div className="p-2 bg-amber-500 rounded-lg">
                            <AlertTriangle className="w-5 h-5 text-white" />
                        </div>
                        <div className="flex-1">
                            <h4 className="font-semibold text-amber-800 mb-1">Atenção Necessária</h4>
                            <p className="text-sm text-amber-700 mb-3">
                                Existem {stats?.AGUARDANDO_APROVACAO || 0} serviços aguardando aprovação do cliente.
                            </p>
                            <div className="flex gap-2">
                                <Badge variant="outline" className="text-xs border-amber-300 text-amber-700">
                                    Prioridade Alta
                                </Badge>
                                <Badge variant="outline" className="text-xs border-amber-300 text-amber-700">
                                    Ação Requerida
                                </Badge>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}