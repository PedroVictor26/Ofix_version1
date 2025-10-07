import { useState, useEffect } from 'react';
import { TrendingUp, Clock, CheckCircle2, AlertCircle, DollarSign, Wrench } from 'lucide-react';

export default function ServiceStatistics({ service }) {
    const [stats, setStats] = useState({
        efficiency: 0,
        timeSpent: 0,
        estimatedCompletion: null,
        costEfficiency: 0,
        qualityScore: 0
    });

    useEffect(() => {
        if (service) {
            calculateStatistics();
        }
    }, [service]);

    const calculateStatistics = () => {
        const procedimentos = service.procedimentos || [];
        const startDate = new Date(service.dataInicio);
        const now = new Date();
        
        // Calcular eficiência baseada nos procedimentos concluídos
        const totalProcedimentos = procedimentos.length;
        const procedimentosConcluidos = procedimentos.filter(p => p.concluido).length;
        const efficiency = totalProcedimentos > 0 ? (procedimentosConcluidos / totalProcedimentos) * 100 : 0;

        // Calcular tempo gasto
        const timeSpentHours = Math.abs(now - startDate) / (1000 * 60 * 60);
        
        // Estimar tempo para conclusão baseado na velocidade atual
        let estimatedCompletion = null;
        if (procedimentosConcluidos > 0 && efficiency < 100) {
            const avgTimePerProcedure = timeSpentHours / procedimentosConcluidos;
            const remainingProcedures = totalProcedimentos - procedimentosConcluidos;
            const remainingHours = remainingProcedures * avgTimePerProcedure;
            estimatedCompletion = new Date(now.getTime() + (remainingHours * 60 * 60 * 1000));
        }

        // Calcular eficiência de custo (comparar valor estimado vs real)
        const valorEstimado = Number(service.valorTotalEstimado) || 0;
        const valorReal = Number(service.valorTotalFinal) || 0;
        const costEfficiency = valorEstimado > 0 ? ((valorEstimado - Math.abs(valorReal - valorEstimado)) / valorEstimado) * 100 : 100;

        // Calcular score de qualidade baseado em vários fatores
        let qualityScore = 100;
        
        // Penalizar por valores inconsistentes
        const valorCalculado = (Number(service.valorTotalServicos) || 0) + (Number(service.valorTotalPecas) || 0);
        if (Math.abs(valorCalculado - valorReal) > 0.01) {
            qualityScore -= 10;
        }
        
        // Penalizar por procedimentos pendentes em serviços finalizados
        if (service.status === 'FINALIZADO' && efficiency < 100) {
            qualityScore -= 20;
        }
        
        // Penalizar por descrição vazia
        if (!service.descricaoProblema?.trim()) {
            qualityScore -= 15;
        }
        
        // Bonus por boa documentação
        if (service.observacoes?.trim() && service.observacoes.length > 50) {
            qualityScore += 5;
        }

        setStats({
            efficiency: Math.round(efficiency),
            timeSpent: Math.round(timeSpentHours * 10) / 10,
            estimatedCompletion,
            costEfficiency: Math.max(0, Math.min(100, Math.round(costEfficiency))),
            qualityScore: Math.max(0, Math.min(100, qualityScore))
        });
    };

    const getEfficiencyColor = (value) => {
        if (value >= 80) return 'text-green-600 bg-green-100';
        if (value >= 60) return 'text-yellow-600 bg-yellow-100';
        return 'text-red-600 bg-red-100';
    };

    const getQualityColor = (value) => {
        if (value >= 90) return 'text-green-600';
        if (value >= 70) return 'text-yellow-600';
        return 'text-red-600';
    };

    const StatCard = ({ icon: Icon, title, value, suffix = '', color = 'text-blue-600', bgColor = 'bg-blue-100' }) => (
        <div className="p-4 rounded-lg border border-slate-200 bg-white">
            <div className="flex items-center justify-between mb-2">
                <Icon className="w-5 h-5 text-slate-500" />
                <span className={`text-2xl font-bold ${color}`}>
                    {value}{suffix}
                </span>
            </div>
            <h3 className="text-sm font-medium text-slate-700">{title}</h3>
            <div className={`mt-2 h-1 rounded-full ${bgColor}`}>
                <div 
                    className={`h-full rounded-full bg-current ${color}`}
                    style={{ width: `${Math.min(100, value)}%` }}
                />
            </div>
        </div>
    );

    const formatDuration = (hours) => {
        if (hours < 1) {
            return `${Math.round(hours * 60)}min`;
        }
        if (hours < 24) {
            return `${Math.floor(hours)}h ${Math.round((hours % 1) * 60)}min`;
        }
        const days = Math.floor(hours / 24);
        const remainingHours = Math.floor(hours % 24);
        return `${days}d ${remainingHours}h`;
    };

    const getRecommendations = () => {
        const recommendations = [];

        if (stats.efficiency < 50) {
            recommendations.push({
                type: 'warning',
                icon: AlertCircle,
                message: 'Eficiência baixa - considere revisar o cronograma dos procedimentos'
            });
        }

        if (stats.qualityScore < 70) {
            recommendations.push({
                type: 'error',
                icon: AlertCircle,
                message: 'Score de qualidade baixo - verifique dados obrigatórios e consistência'
            });
        }

        if (stats.costEfficiency < 80) {
            recommendations.push({
                type: 'info',
                icon: DollarSign,
                message: 'Valores divergentes do estimado - considere revisar o orçamento'
            });
        }

        if (stats.timeSpent > 48 && service.status !== 'FINALIZADO') {
            recommendations.push({
                type: 'warning',
                icon: Clock,
                message: 'Serviço em andamento há mais de 2 dias - verifique possíveis bloqueios'
            });
        }

        return recommendations;
    };

    const recommendations = getRecommendations();

    return (
        <div className="space-y-6">
            {/* Grid de Estatísticas */}
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                <StatCard
                    icon={TrendingUp}
                    title="Eficiência"
                    value={stats.efficiency}
                    suffix="%"
                    color={getEfficiencyColor(stats.efficiency).split(' ')[0]}
                    bgColor={getEfficiencyColor(stats.efficiency).split(' ')[1]}
                />
                
                <StatCard
                    icon={Clock}
                    title="Tempo Gasto"
                    value={formatDuration(stats.timeSpent)}
                    suffix=""
                    color="text-blue-600"
                    bgColor="bg-blue-100"
                />
                
                <StatCard
                    icon={DollarSign}
                    title="Eficiência de Custo"
                    value={stats.costEfficiency}
                    suffix="%"
                    color={getEfficiencyColor(stats.costEfficiency).split(' ')[0]}
                    bgColor={getEfficiencyColor(stats.costEfficiency).split(' ')[1]}
                />
                
                <StatCard
                    icon={CheckCircle2}
                    title="Score de Qualidade"
                    value={stats.qualityScore}
                    suffix="%"
                    color={getQualityColor(stats.qualityScore)}
                    bgColor="bg-slate-100"
                />
                
                <StatCard
                    icon={Wrench}
                    title="Procedimentos"
                    value={`${service.procedimentos?.filter(p => p.concluido).length || 0}/${service.procedimentos?.length || 0}`}
                    suffix=""
                    color="text-purple-600"
                    bgColor="bg-purple-100"
                />

                {stats.estimatedCompletion && (
                    <div className="p-4 rounded-lg border border-slate-200 bg-white">
                        <div className="flex items-center justify-between mb-2">
                            <Clock className="w-5 h-5 text-slate-500" />
                            <span className="text-sm text-slate-600">
                                {stats.estimatedCompletion.toLocaleDateString('pt-BR', {
                                    day: '2-digit',
                                    month: '2-digit',
                                    hour: '2-digit',
                                    minute: '2-digit'
                                })}
                            </span>
                        </div>
                        <h3 className="text-sm font-medium text-slate-700">Previsão de Conclusão</h3>
                    </div>
                )}
            </div>

            {/* Recomendações */}
            {recommendations.length > 0 && (
                <div className="space-y-3">
                    <h4 className="font-medium text-slate-900">Recomendações:</h4>
                    {recommendations.map((rec, index) => {
                        const IconComponent = rec.icon;
                        const colorClasses = {
                            error: 'border-red-200 bg-red-50 text-red-800',
                            warning: 'border-yellow-200 bg-yellow-50 text-yellow-800',
                            info: 'border-blue-200 bg-blue-50 text-blue-800'
                        };
                        
                        return (
                            <div 
                                key={index}
                                className={`p-3 rounded-lg border ${colorClasses[rec.type]}`}
                            >
                                <div className="flex items-start gap-3">
                                    <IconComponent className="w-5 h-5 mt-0.5 flex-shrink-0" />
                                    <p className="text-sm font-medium">
                                        {rec.message}
                                    </p>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Resumo Rápido */}
            <div className="p-4 rounded-lg bg-gradient-to-br from-slate-50 to-white border border-slate-200">
                <h4 className="font-medium text-slate-900 mb-2">Resumo do Desempenho</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                        <span className="text-slate-600">Status:</span>
                        <span className="ml-2 font-medium text-slate-900">
                            {service.status?.replace('_', ' ')}
                        </span>
                    </div>
                    <div>
                        <span className="text-slate-600">Progresso:</span>
                        <span className="ml-2 font-medium text-slate-900">
                            {stats.efficiency}% concluído
                        </span>
                    </div>
                    <div>
                        <span className="text-slate-600">Valor Total:</span>
                        <span className="ml-2 font-medium text-slate-900">
                            R$ {Number(service.valorTotalFinal || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </span>
                    </div>
                    <div>
                        <span className="text-slate-600">Peças:</span>
                        <span className="ml-2 font-medium text-slate-900">
                            {service.itensPeca?.length || 0} item(s)
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
}
