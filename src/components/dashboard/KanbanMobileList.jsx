import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { statusConfig } from "@/constants/statusConfig";

export default function KanbanMobileList({ servicos, clientes, veiculos, onServiceClick }) {
    const getServicesByStatus = (statusKey) => {
        if (!servicos) return [];
        return servicos.filter(servico => servico.status === statusKey);
    };

    return (
        <div className="space-y-6">
            {Object.entries(statusConfig).map(([status, config]) => {
                const servicosStatus = getServicesByStatus(status);
                
                return (
                    <div key={status} className="space-y-3">
                        {/* Header da seção */}
                        <div className="flex items-center justify-between px-2">
                            <div className="flex items-center gap-2">
                                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${config.color}`}>
                                    <config.icon className="w-4 h-4" />
                                </div>
                                <h3 className="font-bold text-slate-800">{config.title}</h3>
                            </div>
                            <Badge variant="secondary" className="font-bold">
                                {servicosStatus.length}
                            </Badge>
                        </div>

                        {/* Lista de serviços */}
                        {servicosStatus.length > 0 ? (
                            <div className="space-y-2">
                                {servicosStatus.map((servico) => {
                                    const cliente = clientes[servico.clienteId];
                                    const veiculo = veiculos.find(v =>
                                        v.id === servico.veiculoId ||
                                        v.id === servico.veiculo?.id
                                    );

                                    return (
                                        <Card
                                            key={servico.id}
                                            onClick={() => onServiceClick(servico)}
                                            className="p-4 cursor-pointer hover:shadow-md transition-shadow"
                                        >
                                            <div className="flex items-start justify-between mb-2">
                                                <div className="flex-1">
                                                    <p className="font-semibold text-slate-900">
                                                        OS #{servico.numeroOs || servico.id}
                                                    </p>
                                                    <p className="text-sm text-slate-600">
                                                        {cliente?.nomeCompleto || 'Cliente não identificado'}
                                                    </p>
                                                </div>
                                                <Badge className={config.color}>
                                                    {config.title}
                                                </Badge>
                                            </div>
                                            {veiculo && (
                                                <p className="text-xs text-slate-500">
                                                    {veiculo.marca} {veiculo.modelo} - {veiculo.placa}
                                                </p>
                                            )}
                                        </Card>
                                    );
                                })}
                            </div>
                        ) : (
                            <Card className="p-6 text-center">
                                <config.icon className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                                <p className="text-sm text-slate-500">Nenhum serviço {config.title.toLowerCase()}</p>
                            </Card>
                        )}
                    </div>
                );
            })}
        </div>
    );
}
