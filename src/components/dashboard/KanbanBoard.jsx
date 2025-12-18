import { Skeleton } from "@/components/ui/skeleton";
import KanbanColumn from './KanbanColumn';

// Skeleton para o KanbanBoard
const KanbanBoardSkeleton = ({ statusConfig }) => (
    <div className="flex gap-6 overflow-x-auto pb-4">
        {Object.keys(statusConfig).map((status) => (
            <div key={status} className="flex-shrink-0 w-80">
                <div className="bg-gradient-to-b from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 rounded-xl p-5 shadow-sm border border-slate-200 dark:border-slate-700">
                    <div className="flex items-center justify-between mb-5">
                        <div className="flex items-center gap-3">
                            <Skeleton className="h-10 w-10 rounded-lg" />
                            <div>
                                <Skeleton className="h-4 w-20 mb-1" />
                                <Skeleton className="h-3 w-16" />
                            </div>
                        </div>
                        <Skeleton className="h-6 w-8 rounded" />
                    </div>
                    <div className="space-y-4">
                        <Skeleton className="h-32 w-full rounded-xl" />
                        <Skeleton className="h-32 w-full rounded-xl" />
                        <Skeleton className="h-32 w-full rounded-xl" />
                    </div>
                </div>
            </div>
        ))}
    </div>
);

export default function KanbanBoard({ servicos, clientes, veiculos, onServiceClick, statusConfig, isLoading }) {
    const getServicesByStatus = (statusKey) => {
        if (!servicos) return [];
        return servicos.filter(servico => servico.status === statusKey);
    };

    if (isLoading) {
        return <KanbanBoardSkeleton statusConfig={statusConfig} />;
    }

    return (
        <div className="flex gap-6 overflow-x-auto pb-4">
            {Object.entries(statusConfig).map(([status, config]) => (
                <KanbanColumn
                    key={status}
                    status={status}
                    config={config}
                    servicos={getServicesByStatus(status)}
                    clientes={clientes}
                    veiculos={veiculos}
                    onServiceClick={onServiceClick}
                    serviceIds={getServicesByStatus(status).map(s => s.id.toString())}
                />
            ))}
        </div>
    );
}
