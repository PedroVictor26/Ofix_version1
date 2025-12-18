import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { User, Car, Calendar, Clock } from "lucide-react";

export default function ServiceCard({ servico, cliente, veiculo, onClick }) {
  // Função para formatar data
  const formatDate = (date) => {
    if (!date) return null;
    return new Date(date).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit'
    });
  };

  // Função para calcular dias desde entrada
  const getDaysFromEntry = (dataEntrada) => {
    if (!dataEntrada) return null;
    const today = new Date();
    const entryDate = new Date(dataEntrada);
    const diffTime = Math.abs(today - entryDate);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const diasNaOficina = getDaysFromEntry(servico.dataEntrada);
  const dataPrevisao = formatDate(servico.dataPrevisaoEntrega);

  return (
    <Card
      onClick={onClick}
      className="group bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 cursor-pointer transition-all duration-200 hover:shadow-lg hover:border-blue-300 dark:hover:border-blue-700 hover:scale-[1.02]"
    >
      <CardContent className="p-5">
        {/* Header com OS e Urgência */}
        <div className="flex justify-between items-start mb-4">
          <Badge variant="outline" className="text-xs font-mono font-semibold px-2 py-1">
            OS #{servico.numeroOs}
          </Badge>
          {diasNaOficina && diasNaOficina > 5 && (
            <Badge className="bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 text-xs">
              {diasNaOficina}d
            </Badge>
          )}
        </div>

        {/* Título do Serviço - MAIOR e mais legível */}
        <div className="mb-4">
          <h3 className="font-bold text-base text-slate-800 dark:text-slate-100 leading-tight line-clamp-2">
            {servico.descricaoProblema || "Serviço sem descrição"}
          </h3>
        </div>

        {/* Informações do Cliente e Veículo - Layout melhorado */}
        <div className="space-y-3 mb-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-50 dark:bg-blue-900/20 rounded-lg flex items-center justify-center">
              <User className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-slate-700 dark:text-slate-300 truncate">
                {cliente?.nomeCompleto || "Cliente não encontrado"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-green-50 dark:bg-green-900/20 rounded-lg flex items-center justify-center">
              <Car className="w-4 h-4 text-green-600 dark:text-green-400" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-slate-700 dark:text-slate-300 truncate">
                {veiculo ? `${veiculo.marca} ${veiculo.modelo}` : "Veículo não encontrado"}
              </p>
              {veiculo?.placa && (
                <p className="text-xs text-slate-500 dark:text-slate-400 font-mono">
                  {veiculo.placa}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Footer com informações de tempo */}
        <div className="flex justify-between items-center pt-3 border-t border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <Clock className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-xs text-slate-500 dark:text-slate-400">
              {diasNaOficina ? `${diasNaOficina} dia${diasNaOficina > 1 ? 's' : ''}` : 'Hoje'}
            </span>
          </div>

          {dataPrevisao && (
            <div className="flex items-center gap-2">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              <span className="text-xs text-slate-500 dark:text-slate-400">
                {dataPrevisao}
              </span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
