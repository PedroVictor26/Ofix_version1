import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { useDroppable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import DraggableServiceCard from './DraggableServiceCard';

export default function KanbanColumn({ status, config, servicos, serviceIds, clientes, veiculos, onServiceClick }) {
    const { setNodeRef, isOver } = useDroppable({
        id: status,
        data: {
            type: 'column',
        }
    });

    return (
        <div className="flex-shrink-0 w-80">
            <div className="bg-gradient-to-b from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 rounded-xl p-5 shadow-sm border border-slate-200 dark:border-slate-700">
                {/* Cabeçalho da Coluna - Redesign */}
                <div className="flex items-center justify-between mb-5">
                    <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${config.color} shadow-sm`}>
                            <config.icon className="w-5 h-5" />
                        </div>
                        <div>
                            <h3 className="font-bold text-slate-800 dark:text-slate-100 text-base">{config.title}</h3>
                            <p className="text-xs text-slate-500 dark:text-slate-400">
                                {servicos?.length || 0} {(servicos?.length || 0) === 1 ? 'serviço' : 'serviços'}
                            </p>
                        </div>
                    </div>
                    <Badge
                        variant="secondary"
                        className="text-sm font-bold px-3 py-1 bg-white/80 dark:bg-slate-800/80 text-slate-700 dark:text-slate-200 shadow-sm"
                    >
                        {servicos?.length || 0}
                    </Badge>
                </div>

                {/* Área dos Cards */}
                <ScrollArea
                    ref={setNodeRef}
                    className={`h-[calc(100vh-320px)] rounded-lg transition-all duration-200 ${isOver ? 'bg-blue-50 dark:bg-blue-900/20 border-2 border-dashed border-blue-300 dark:border-blue-700' : 'bg-transparent'
                        }`}
                >
                    <SortableContext items={serviceIds || []} strategy={verticalListSortingStrategy}>
                        <div className="space-y-4 p-2">
                            {servicos && servicos.length > 0 ? (
                                servicos.map((servico) => {
                                    const cliente = clientes[servico.clienteId];
                                    const veiculo = veiculos.find(v =>
                                        v.id === servico.veiculoId ||
                                        v.id === servico.veiculo?.id
                                    );
                                    return (
                                        <DraggableServiceCard
                                            key={servico.id}
                                            id={servico.id.toString()}
                                            servico={servico}
                                            cliente={cliente}
                                            veiculo={veiculo}
                                            onClick={() => {
                                                console.log("Service passed to onClick in KanbanColumn:", servico); // Adicionado para depuração
                                                onServiceClick(servico);
                                            }}
                                        />
                                    );
                                })
                            ) : (
                                <div className="text-center py-12 min-h-[200px] flex flex-col items-center justify-center">
                                    <div className="w-16 h-16 bg-slate-200 dark:bg-slate-800 rounded-full flex items-center justify-center mb-4">
                                        <config.icon className="w-8 h-8 text-slate-400" />
                                    </div>
                                    <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">Nenhum serviço aqui</p>
                                    <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">Arraste os cards para esta coluna</p>
                                </div>
                            )}
                        </div>
                    </SortableContext>
                </ScrollArea>
            </div>
        </div>
    );
}
