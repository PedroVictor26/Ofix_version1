import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
    TrendingUp, TrendingDown, DollarSign, Clock, 
    Users, Car, Calendar, Target, BarChart3
} from "lucide-react";

export default function AdvancedMetrics({ servicos, clientes, veiculos }) {
    const metrics = useMemo(() => {
        const hoje = new Date();
        const inicioMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
        const mesPassado = new Date(hoje.getFullYear(), hoje.getMonth() - 1, 1);
        const fimMesPassado = new Date(hoje.getFullYear(), hoje.getMonth(), 0);
        
        // Serviços do mês atual
        const servicosDoMes = servicos.filter(s => 
            new Date(s.dataEntrada) >= inicioMes
        );
        
        // Serviços do mês passado
        const servicosMesPassado = servicos.filter(s => {
            const data = new Date(s.dataEntrada);
            return data >= mesPassado && data <= fimMesPassado;
        });
        
        // Serviços finalizados
        const servicosFinalizados = servicos.filter(s => s.status === 'FINALIZADO');
        const servicosFinalizadosMes = servicosFinalizados.filter(s => 
            new Date(s.dataEntrada) >= inicioMes
        );
        
        // Faturamento
        const faturamentoTotal = servicosFinalizados.reduce((acc, s) => 
            acc + (Number(s.valorTotalFinal) || 0), 0
        );
        
        const faturamentoMes = servicosFinalizadosMes.reduce((acc, s) => 
            acc + (Number(s.valorTotalFinal) || 0), 0
        );
        
        // Tempo médio de conclusão
        const servicosComTempo = servicosFinalizados.filter(s => 
            s.dataEntrada && s.dataConclusao
        );
        
        const tempoMedio = servicosComTempo.length > 0 ? 
            servicosComTempo.reduce((acc, s) => {
                const inicio = new Date(s.dataEntrada);
                const fim = new Date(s.dataConclusao);
                return acc + (fim - inicio) / (1000 * 60 * 60 * 24); // dias
            }, 0) / servicosComTempo.length : 0;
        
        // Taxa de crescimento
        const crescimento = servicosMesPassado.length > 0 ? 
            ((servicosDoMes.length - servicosMesPassado.length) / servicosMesPassado.length) * 100 : 0;
        
        // Taxa de conclusão
        const taxaConclusao = servicos.length > 0 ? 
            (servicosFinalizados.length / servicos.length) * 100 : 0;
        
        return {
            servicosDoMes: servicosDoMes.length,
            servicosMesPassado: servicosMesPassado.length,
            crescimento: Math.round(crescimento),
            faturamentoTotal,
            faturamentoMes,
            tempoMedio: Math.round(tempoMedio * 10) / 10,
            taxaConclusao: Math.round(taxaConclusao),
            totalClientes: Object.keys(clientes).length,
            totalVeiculos: veiculos.length,
            servicosAtivos: servicos.filter(s => 
                ['EM_ANDAMENTO', 'AGUARDANDO_PECAS', 'AGUARDANDO_APROVACAO'].includes(s.status)
            ).length
        };
    }, [servicos, clientes, veiculos]);

    const formatCurrency = (value) => {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL',
            minimumFractionDigits: 0
        }).format(value);
    };

    const metricsData = [
        {
            title: "Serviços Este Mês",
            value: metrics.servicosDoMes,
            subtitle: `${metrics.crescimento >= 0 ? '+' : ''}${metrics.crescimento}% vs mês anterior`,
            icon: Calendar,
            trend: metrics.crescimento >= 0 ? 'up' : 'down',
            color: metrics.crescimento >= 0 ? 'text-green-600' : 'text-red-600',
            bgColor: metrics.crescimento >= 0 ? 'bg-green-50' : 'bg-red-50',
            borderColor: metrics.crescimento >= 0 ? 'border-green-200' : 'border-red-200'
        },
        {
            title: "Faturamento Mensal",
            value: formatCurrency(metrics.faturamentoMes),
            subtitle: `Total: ${formatCurrency(metrics.faturamentoTotal)}`,
            icon: DollarSign,
            trend: 'up',
            color: 'text-green-600',
            bgColor: 'bg-green-50',
            borderColor: 'border-green-200'
        },
        {
            title: "Tempo Médio",
            value: `${metrics.tempoMedio} dias`,
            subtitle: "Para conclusão dos serviços",
            icon: Clock,
            trend: 'neutral',
            color: 'text-blue-600',
            bgColor: 'bg-blue-50',
            borderColor: 'border-blue-200'
        },
        {
            title: "Taxa de Conclusão",
            value: `${metrics.taxaConclusao}%`,
            subtitle: `${metrics.servicosAtivos} serviços ativos`,
            icon: Target,
            trend: metrics.taxaConclusao >= 80 ? 'up' : 'down',
            color: metrics.taxaConclusao >= 80 ? 'text-green-600' : 'text-amber-600',
            bgColor: metrics.taxaConclusao >= 80 ? 'bg-green-50' : 'bg-amber-50',
            borderColor: metrics.taxaConclusao >= 80 ? 'border-green-200' : 'border-amber-200'
        },
        {
            title: "Base de Clientes",
            value: metrics.totalClientes,
            subtitle: `${metrics.totalVeiculos} veículos cadastrados`,
            icon: Users,
            trend: 'up',
            color: 'text-purple-600',
            bgColor: 'bg-purple-50',
            borderColor: 'border-purple-200'
        },
        {
            title: "Eficiência Operacional",
            value: `${Math.round((metrics.servicosDoMes / 30) * 10) / 10}`,
            subtitle: "Serviços por dia (média)",
            icon: BarChart3,
            trend: 'neutral',
            color: 'text-indigo-600',
            bgColor: 'bg-indigo-50',
            borderColor: 'border-indigo-200'
        }
    ];

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-slate-800">Métricas Avançadas</h2>
                <Badge variant="outline" className="text-xs">
                    Atualizado em tempo real
                </Badge>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {metricsData.map((metric, index) => (
                    <Card key={index} className={`${metric.bgColor} ${metric.borderColor} border-2 shadow-md hover:shadow-lg transition-all duration-300 hover:-translate-y-1`}>
                        <CardContent className="p-6">
                            <div className="flex items-start justify-between mb-4">
                                <div className="flex-1">
                                    <p className="text-sm font-medium text-slate-600 mb-1">
                                        {metric.title}
                                    </p>
                                    <p className={`text-2xl font-bold ${metric.color} mb-2`}>
                                        {metric.value}
                                    </p>
                                    <p className="text-xs text-slate-500">
                                        {metric.subtitle}
                                    </p>
                                </div>
                                <div className="flex flex-col items-end gap-2">
                                    <div className={`p-3 ${metric.bgColor} rounded-full border ${metric.borderColor}`}>
                                        <metric.icon className={`w-5 h-5 ${metric.color}`} />
                                    </div>
                                    {metric.trend !== 'neutral' && (
                                        <div className="flex items-center gap-1">
                                            {metric.trend === 'up' ? (
                                                <TrendingUp className="w-3 h-3 text-green-500" />
                                            ) : (
                                                <TrendingDown className="w-3 h-3 text-red-500" />
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                            
                            {/* Barra de progresso para taxa de conclusão */}
                            {metric.title === "Taxa de Conclusão" && (
                                <div className="mt-4">
                                    <div className="w-full bg-slate-200 rounded-full h-2">
                                        <div 
                                            className={`h-2 rounded-full transition-all duration-500 ${
                                                metrics.taxaConclusao >= 80 ? 'bg-green-500' : 
                                                metrics.taxaConclusao >= 60 ? 'bg-amber-500' : 'bg-red-500'
                                            }`}
                                            style={{ width: `${Math.min(metrics.taxaConclusao, 100)}%` }}
                                        />
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    );
}