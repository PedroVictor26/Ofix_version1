import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { MessageCircle, Edit, Hash, Trash2 } from "lucide-react";

// Skeleton para o item da lista
export const MensagemCardSkeleton = () => (
  <Card className="animate-pulse border-slate-200 shadow-sm">
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

export default function MensagensList({
  mensagens,
  onEdit,
  onDelete,
  isLoading,
}) {
  const getCategoriaColor = (categoria) => {
    const colors = {
      status_update: "bg-blue-100 text-blue-800",
      orcamento: "bg-green-100 text-green-800",
      aprovacao: "bg-yellow-100 text-yellow-800",
      conclusao: "bg-purple-100 text-purple-800",
      agenda: "bg-indigo-100 text-indigo-800",
      cobranca: "bg-red-100 text-red-800",
      promocao: "bg-pink-100 text-pink-800",
    };
    return colors[categoria] || "bg-slate-100 text-slate-800";
  };

  if (isLoading) {
    return (
      <div className="grid gap-4">
        {Array(3)
          .fill(0)
          .map((_, i) => (
            <MensagemCardSkeleton key={i} />
          ))}
      </div>
    );
  }

  if (mensagens.length === 0) {
    return (
      <Card className="text-center py-12 bg-white shadow-sm border-slate-200">
        <CardContent>
          <MessageCircle className="w-16 h-16 mx-auto mb-4 text-slate-400" />
          <h3 className="text-xl font-semibold text-slate-700 mb-2">
            Nenhum template de mensagem encontrado
          </h3>
          <p className="text-sm text-slate-500">
            Comece criando seu primeiro template de mensagem.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid gap-4">
      {mensagens.map((mensagem) => (
        <Card
          key={mensagem.id}
          className="bg-white border border-slate-200 shadow-sm rounded-xl cursor-pointer transition-all duration-300 hover:shadow-md hover:-translate-y-0.5 group"
        >
          <CardContent className="p-6">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-4 flex-1">
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center transition-transform duration-300 group-hover:scale-105">
                  <MessageCircle className="w-6 h-6 text-green-600" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-slate-800 group-hover:text-green-600 transition-colors duration-300">
                    {mensagem.nome}
                  </h3>
                  <p className="text-sm text-slate-600 mt-1 line-clamp-2">
                    {mensagem.template}
                  </p>
                  {mensagem.variaveis_disponiveis?.length > 0 && (
                    <div className="flex items-center gap-1 text-xs text-slate-500 mt-2">
                      <Hash className="w-3 h-3" />
                      <span>
                        {mensagem.variaveis_disponiveis.length} variáveis
                      </span>
                    </div>
                  )}
                </div>
              </div>
              <div className="flex flex-col items-end gap-2">
                <Badge className={getCategoriaColor(mensagem.categoria)}>
                  {mensagem.categoria?.replace("_", " ")}
                </Badge>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onEdit(mensagem)}
                    className="h-9 w-9 rounded-full hover:bg-green-100 hover:text-green-600"
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onDelete(mensagem)}
                    className="h-9 w-9 rounded-full hover:bg-red-100 hover:text-red-600"
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
