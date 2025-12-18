import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Wrench, Edit, Clock, CheckSquare, Trash2 } from "lucide-react";

// Skeleton para o item da lista
export const ProcedimentoCardSkeleton = () => (
  <Card className="animate-pulse border-slate-200 dark:border-slate-800 shadow-sm bg-white dark:bg-slate-900">
    <CardContent className="p-6">
      <div className="flex items-center gap-4">
        <Skeleton className="w-12 h-12 rounded-lg" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-5 w-3/4" />
          <Skeleton className="h-3 w-full" />
          <Skeleton className="h-3 w-1/2" />
        </div>
      </div>
    </CardContent>
  </Card>
);

export default function ProcedimentosList({
  procedimentos,
  onEdit,
  onDelete,
  isLoading,
}) {
  const getCategoriaColor = (categoria) => {
    const colors = {
      motor: "bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300",
      suspensao: "bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300",
      freios: "bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-300",
      eletrica: "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300",
      transmissao: "bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300",
      carroceria: "bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300",
      revisao: "bg-indigo-100 dark:bg-indigo-900/30 text-indigo-800 dark:text-indigo-300",
      manutencao_preventiva: "bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-300",
    };
    return colors[categoria] || "bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-300";
  };

  if (isLoading) {
    return (
      <div className="grid gap-4">
        {Array(3)
          .fill(0)
          .map((_, i) => (
            <ProcedimentoCardSkeleton key={i} />
          ))}
      </div>
    );
  }

  if (procedimentos.length === 0) {
    return (
      <Card className="text-center py-12 bg-white dark:bg-slate-900 shadow-sm border-slate-200 dark:border-slate-800">
        <CardContent>
          <Wrench className="w-16 h-16 mx-auto mb-4 text-slate-400" />
          <h3 className="text-xl font-semibold text-slate-700 dark:text-slate-200 mb-2">
            Nenhum procedimento encontrado
          </h3>
          <p className="text-slate-500 dark:text-slate-400">
            Comece criando seu primeiro procedimento padrão.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid gap-4">
      {procedimentos.map((procedimento) => (
        <Card
          key={procedimento.id}
          className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm rounded-xl cursor-pointer transition-all duration-300 hover:shadow-md hover:-translate-y-0.5 group"
        >
          <CardContent className="p-6">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-4 flex-1">
                <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/20 rounded-lg flex items-center justify-center transition-transform duration-300 group-hover:scale-105">
                  <Wrench className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors duration-300">
                    {procedimento.nome}
                  </h3>
                  <p className="text-sm text-slate-600 dark:text-slate-400 mt-1 line-clamp-2">
                    {procedimento.descricao}
                  </p>
                  <div className="flex items-center gap-4 text-xs text-slate-500 dark:text-slate-400 mt-2">
                    {procedimento.tempoEstimadoHoras &&
                      parseFloat(procedimento.tempoEstimadoHoras) > 0 && (
                        <div className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          <span>
                            {parseFloat(procedimento.tempoEstimadoHoras)}h
                          </span>
                        </div>
                      )}
                    {procedimento.checklistJson &&
                      JSON.parse(procedimento.checklistJson).length > 0 && (
                        <div className="flex items-center gap-1">
                          <CheckSquare className="w-3 h-3" />
                          <span>
                            {JSON.parse(procedimento.checklistJson).length}{" "}
                            itens
                          </span>
                        </div>
                      )}
                  </div>
                </div>
              </div>
              <div className="flex flex-col items-end gap-2">
                <Badge className={getCategoriaColor(procedimento.categoria)}>
                  {procedimento.categoria?.replace("_", " ")}
                </Badge>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onEdit(procedimento)}
                    className="h-9 w-9 rounded-full hover:bg-blue-100 dark:hover:bg-blue-900/30 hover:text-blue-600 dark:hover:text-blue-400"
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onDelete(procedimento)}
                    className="h-9 w-9 rounded-full hover:bg-red-100 dark:hover:bg-red-900/30 hover:text-red-600 dark:hover:text-red-400"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
