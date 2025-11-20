import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, Plus, Clock, Wrench } from "lucide-react";

export default function ServiceProcedures({
  service,
  procedimentos,
  onUpdate,
  isGuest,
}) {
  console.log("ServiceProcedures - Props recebidas:", {
    service,
    procedimentos,
  });

  const [searchTerm, setSearchTerm] = useState("");
  const [isApplying, setIsApplying] = useState(false);

  const filteredProcedimentos =
    procedimentos?.filter(
      (proc) =>
        proc.nome_procedimento
          ?.toLowerCase()
          .includes(searchTerm.toLowerCase()) ||
        proc.descricao_padrao?.toLowerCase().includes(searchTerm.toLowerCase())
    ) || [];

  const handleApplyProcedure = async (procedimento) => {
    setIsApplying(true);

    try {
      // Aplica o procedimento ao serviço
      const updatedData = {
        descricao_problema:
          service.descricao_problema || procedimento.descricao_padrao,
        diagnostico_tecnico: procedimento.descricao_padrao,
        checklist_servico: [
          ...(service.checklist_servico || []),
          ...procedimento.checklist_padrao.map((item) => ({
            item: item.item,
            concluido: false,
            observacao: "",
          })),
        ],
      };

      await onUpdate(updatedData);
    } catch (error) {
      console.error("Erro ao aplicar procedimento:", error);
    }

    setIsApplying(false);
  };

  // Verificação de segurança após os hooks
  if (!service || !service.id) {
    console.error("ServiceProcedures - Serviço inválido:", service);
    return (
      <div className="text-center py-12 text-slate-400">
        <Wrench className="w-12 h-12 mx-auto mb-3 opacity-30" />
        <p>Serviço não encontrado</p>
        <p className="text-sm">Recarregue a página e tente novamente</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            placeholder="Buscar procedimentos..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      <div className="grid gap-4">
        {filteredProcedimentos.map((procedimento) => (
          <Card
            key={procedimento.id}
            className="hover:shadow-md transition-shadow"
          >
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-lg font-semibold text-slate-900">
                    {procedimento.nome_procedimento}
                  </CardTitle>
                  <div className="flex items-center gap-2 mt-2">
                    {procedimento.categoria && (
                      <Badge variant="secondary">
                        {procedimento.categoria.replace("_", " ")}
                      </Badge>
                    )}
                    {procedimento.tempo_estimado && (
                      <Badge
                        variant="outline"
                        className="flex items-center gap-1"
                      >
                        <Clock className="w-3 h-3" />
                        {procedimento.tempo_estimado}h
                      </Badge>
                    )}
                  </div>
                </div>
                {!isGuest && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleApplyProcedure(procedimento)}
                    disabled={isApplying}
                    className="flex items-center gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    Aplicar
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-slate-600 mb-4">
                {procedimento.descricao_padrao}
              </p>

              {procedimento.checklist_padrao &&
                procedimento.checklist_padrao.length > 0 && (
                  <div>
                    <h4 className="font-medium text-slate-900 mb-2 flex items-center gap-2">
                      <Wrench className="w-4 h-4" />
                      Checklist ({procedimento.checklist_padrao.length} itens)
                    </h4>
                    <ul className="text-sm text-slate-600 space-y-1">
                      {procedimento.checklist_padrao
                        .slice(0, 3)
                        .map((item, index) => (
                          <li key={index} className="flex items-center gap-2">
                            <div className="w-1.5 h-1.5 bg-blue-500 rounded-full" />
                            {item.item}
                          </li>
                        ))}
                      {procedimento.checklist_padrao.length > 3 && (
                        <li className="text-slate-400 italic">
                          +{procedimento.checklist_padrao.length - 3} itens
                          adicionais
                        </li>
                      )}
                    </ul>
                  </div>
                )}
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredProcedimentos.length === 0 && (
        <div className="text-center py-12 text-slate-400">
          <Wrench className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p>Nenhum procedimento encontrado</p>
          <p className="text-sm">Tente ajustar os termos de busca</p>
        </div>
      )}
    </div>
  );
}
