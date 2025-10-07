import { useState } from 'react';
import { Clock, CheckCircle, AlertCircle, PlayCircle, PauseCircle, User } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';

export default function ServiceTimeline({ service, onStatusChange }) {
    const [isExpanded, setIsExpanded] = useState(false);

    // Calcular progresso baseado nos procedimentos
    const calculateProgress = () => {
        if (!service.procedimentos || service.procedimentos.length === 0) return 0;
        
        const concluidos = service.procedimentos.filter(p => p.concluido).length;
        return Math.round((concluidos / service.procedimentos.length) * 100);
    };

    // Definir próximos passos baseado no status atual
    const getNextSteps = () => {
        const progress = calculateProgress();
        const steps = [];

        switch (service.status) {
            case 'AGUARDANDO_APROVACAO':
                steps.push({
                    icon: PlayCircle,
                    title: 'Aguardando aprovação do cliente',
                    description: 'Orçamento enviado, aguardando retorno',
                    priority: 'high',
                    action: () => onStatusChange?.('EM_ANDAMENTO')
                });
                break;
                
            case 'EM_ANDAMENTO':
                if (progress < 100) {
                    steps.push({
                        icon: AlertCircle,
                        title: `${service.procedimentos?.length - service.procedimentos?.filter(p => p.concluido).length} procedimentos pendentes`,
                        description: 'Continue executando os procedimentos',
                        priority: 'medium'
                    });
                } else {
                    steps.push({
                        icon: CheckCircle,
                        title: 'Pronto para finalização',
                        description: 'Todos os procedimentos concluídos',
                        priority: 'high',
                        action: () => onStatusChange?.('FINALIZADO')
                    });
                }
                break;
                
            case 'PAUSADO':
                steps.push({
                    icon: PlayCircle,
                    title: 'Serviço pausado',
                    description: 'Clique para retomar o atendimento',
                    priority: 'medium',
                    action: () => onStatusChange?.('EM_ANDAMENTO')
                });
                break;
                
            case 'FINALIZADO':
                steps.push({
                    icon: CheckCircle,
                    title: 'Serviço concluído',
                    description: 'Todas as etapas foram finalizadas',
                    priority: 'low'
                });
                break;
                
            default:
                steps.push({
                    icon: AlertCircle,
                    title: 'Status indefinido',
                    description: 'Defina o status do serviço',
                    priority: 'high'
                });
        }

        return steps;
    };

    // Simular histórico de mudanças (seria vindo do backend)
    const getStatusHistory = () => {
        return [
            {
                id: 1,
                status: 'CRIADO',
                timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
                user: 'Sistema',
                description: 'Serviço criado'
            },
            {
                id: 2,
                status: 'AGUARDANDO_APROVACAO',
                timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
                user: 'João Silva',
                description: 'Orçamento enviado para aprovação'
            },
            {
                id: 3,
                status: 'EM_ANDAMENTO',
                timestamp: new Date(Date.now() - 8 * 60 * 60 * 1000),
                user: 'Maria Santos',
                description: 'Cliente aprovou o orçamento'
            }
        ];
    };

    const progress = calculateProgress();
    const nextSteps = getNextSteps();
    const statusHistory = getStatusHistory();

    const getStatusColor = (status) => {
        const colors = {
            'CRIADO': 'bg-gray-500',
            'AGUARDANDO_APROVACAO': 'bg-yellow-500',
            'EM_ANDAMENTO': 'bg-blue-500',
            'PAUSADO': 'bg-orange-500',
            'FINALIZADO': 'bg-green-500'
        };
        return colors[status] || 'bg-gray-500';
    };

    const getPriorityColor = (priority) => {
        const colors = {
            'high': 'border-red-200 bg-red-50',
            'medium': 'border-yellow-200 bg-yellow-50',
            'low': 'border-green-200 bg-green-50'
        };
        return colors[priority] || 'border-gray-200 bg-gray-50';
    };

    return (
        <div className="space-y-4">
            {/* Status Atual e Progresso */}
            <Card className="border-0 shadow-lg bg-gradient-to-br from-white to-slate-50">
                <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                            <div className={`w-3 h-3 rounded-full ${getStatusColor(service.status)}`} />
                            <Badge variant="outline" className="text-sm">
                                {service.status?.replace('_', ' ')}
                            </Badge>
                        </div>
                        <span className="text-sm text-slate-600">
                            {progress}% concluído
                        </span>
                    </div>

                    {/* Barra de Progresso */}
                    <div className="relative w-full bg-slate-200 rounded-full h-2 mb-4">
                        <div 
                            className="absolute top-0 left-0 h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full transition-all duration-500"
                            style={{ width: `${progress}%` }}
                        />
                    </div>

                    {/* Próximos Passos */}
                    <div className="space-y-3">
                        <h4 className="font-medium text-slate-900 mb-2">Próximos passos:</h4>
                        {nextSteps.map((step, index) => {
                            const IconComponent = step.icon;
                            return (
                                <div 
                                    key={index}
                                    className={`p-3 rounded-lg border-l-4 ${getPriorityColor(step.priority)} ${step.action ? 'cursor-pointer hover:shadow-md transition-shadow' : ''}`}
                                    onClick={step.action}
                                >
                                    <div className="flex items-start gap-3">
                                        <IconComponent className="w-5 h-5 mt-0.5 text-slate-600" />
                                        <div className="flex-1">
                                            <p className="font-medium text-slate-900 text-sm">
                                                {step.title}
                                            </p>
                                            <p className="text-xs text-slate-600 mt-1">
                                                {step.description}
                                            </p>
                                        </div>
                                        {step.action && (
                                            <button className="text-xs bg-blue-600 text-white px-2 py-1 rounded hover:bg-blue-700 transition-colors">
                                                Executar
                                            </button>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </CardContent>
            </Card>

            {/* Timeline do Histórico */}
            <Card className="border-0 shadow-lg bg-gradient-to-br from-white to-slate-50">
                <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-4">
                        <h4 className="font-medium text-slate-900">Histórico do serviço</h4>
                        <button
                            onClick={() => setIsExpanded(!isExpanded)}
                            className="text-sm text-blue-600 hover:text-blue-800 transition-colors"
                        >
                            {isExpanded ? 'Ocultar' : 'Ver todos'}
                        </button>
                    </div>

                    <div className="space-y-4">
                        {statusHistory
                            .slice(0, isExpanded ? statusHistory.length : 3)
                            .map((item, index) => (
                            <div key={item.id} className="flex items-start gap-4">
                                <div className="flex flex-col items-center">
                                    <div className={`w-3 h-3 rounded-full ${getStatusColor(item.status)}`} />
                                    {index < statusHistory.length - 1 && (
                                        <div className="w-px h-8 bg-slate-200 mt-2" />
                                    )}
                                </div>
                                <div className="flex-1 pb-4">
                                    <div className="flex items-center gap-2 mb-1">
                                        <User className="w-4 h-4 text-slate-500" />
                                        <span className="text-sm font-medium text-slate-900">
                                            {item.user}
                                        </span>
                                        <Clock className="w-3 h-3 text-slate-400" />
                                        <span className="text-xs text-slate-500">
                                            {item.timestamp.toLocaleDateString('pt-BR', {
                                                day: '2-digit',
                                                month: '2-digit',
                                                hour: '2-digit',
                                                minute: '2-digit'
                                            })}
                                        </span>
                                    </div>
                                    <p className="text-sm text-slate-600">
                                        {item.description}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
