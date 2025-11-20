import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Save, Calendar, User, Car, DollarSign, FileText } from "lucide-react";
import { format } from "date-fns";

export default function ServiceDetails({
  service,
  cliente,
  veiculo,
  onUpdate,
  isGuest,
}) {
  console.log("ServiceDetails - Props recebidas:", {
    service,
    cliente,
    veiculo,
  });

  const [formData, setFormData] = useState({
    status: service?.status || "AGUARDANDO", // Usar o valor do enum
    descricaoProblema: service?.descricaoProblema || "",
    descricaoSolucao: service?.descricaoSolucao || "",
    valorTotalServicos: service?.valorTotalServicos || 0,
    dataPrevisaoEntrega: service?.dataPrevisaoEntrega
      ? typeof service.dataPrevisaoEntrega === "string"
        ? service.dataPrevisaoEntrega.split("T")[0]
        : ""
      : "", // Formatar para input type="date"
    checklist: service?.checklist || [],
  });

  const [isUpdating, setIsUpdating] = useState(false);

  const handleSave = async () => {
    if (!service?.id) {
      return;
    }
    setIsUpdating(true);
    await onUpdate(formData);
    setIsUpdating(false);
  };

  const updateChecklistItem = (index, field, value) => {
    const newChecklist = [...formData.checklist];
    newChecklist[index] = { ...newChecklist[index], [field]: value };
    setFormData({ ...formData, checklist: newChecklist });
  };

  const addChecklistItem = () => {
    setFormData({
      ...formData,
      checklist: [
        ...formData.checklist,
        { item: "", concluido: false, observacao: "" },
      ],
    });
  };

  // Verificação de segurança após os hooks
  if (!service || !service.id) {
    console.error("ServiceDetails - Serviço inválido:", service);
    return (
      <div className="text-center py-12 text-slate-400">
        <FileText className="w-12 h-12 mx-auto mb-3 opacity-30" />
        <p>Serviço não encontrado</p>
        <p className="text-sm">Recarregue a página e tente novamente</p>
      </div>
    );
  }

  try {
    return (
      <div className="space-y-6">
        {/* Informações do Serviço */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 text-sm text-slate-600 mb-2">
                <User className="w-4 h-4" />
                Cliente
              </div>
              <p className="font-semibold">{cliente?.nomeCompleto}</p>
              <p className="text-sm text-slate-500">{cliente?.telefone}</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 text-sm text-slate-600 mb-2">
                <Car className="w-4 h-4" />
                Veículo
              </div>
              <p className="font-semibold">
                {veiculo?.marca} {veiculo?.modelo}
              </p>
              <p className="text-sm text-slate-500">
                {veiculo?.placa} - {veiculo?.anoFabricacao}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 text-sm text-slate-600 mb-2">
                <Calendar className="w-4 h-4" />
                Data de Entrada
              </div>
              <p className="font-semibold">
                {service.dataEntrada
                  ? format(new Date(service.dataEntrada), "dd/MM/yyyy")
                  : "Não informado"}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Formulário de Edição */}
        <Card>
          <CardHeader>
            <CardTitle>Detalhes do Serviço</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="status">Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value) =>
                    setFormData({ ...formData, status: value })
                  }
                  disabled={isGuest}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="AGUARDANDO">Aguardando</SelectItem>
                    <SelectItem value="EM_ANDAMENTO">Em Andamento</SelectItem>
                    <SelectItem value="AGUARDANDO_PECAS">
                      Aguardando Peças
                    </SelectItem>
                    <SelectItem value="AGUARDANDO_APROVACAO">
                      Aguardando Aprovação
                    </SelectItem>
                    <SelectItem value="FINALIZADO">Finalizado</SelectItem>
                    <SelectItem value="CANCELADO">Cancelado</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="data_previsao">Data de Previsão</Label>
                <Input
                  id="dataPrevisaoEntrega"
                  type="date"
                  value={formData.dataPrevisaoEntrega}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      dataPrevisaoEntrega: e.target.value,
                    })
                  }
                  disabled={isGuest}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="descricaoProblema">Descrição do Problema</Label>
              <Textarea
                id="descricaoProblema"
                value={formData.descricaoProblema}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    descricaoProblema: e.target.value,
                  })
                }
                placeholder="Descreva o problema relatado pelo cliente..."
                className="h-24"
                disabled={isGuest}
              />
            </div>

            <div>
              <Label htmlFor="descricaoSolucao">Diagnóstico Técnico</Label>
              <Textarea
                id="descricaoSolucao"
                value={formData.descricaoSolucao}
                onChange={(e) =>
                  setFormData({ ...formData, descricaoSolucao: e.target.value })
                }
                placeholder="Diagnóstico técnico detalhado..."
                className="h-24"
                disabled={isGuest}
              />
            </div>

            <div>
              <Label htmlFor="valorTotalServicos">Valor da Mão de Obra</Label>
              <Input
                id="valorTotalServicos"
                type="number"
                step="0.01"
                value={formData.valorTotalServicos}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    valorTotalServicos: parseFloat(e.target.value) || 0,
                  })
                }
                placeholder="0,00"
                disabled={isGuest}
              />
            </div>
          </CardContent>
        </Card>

        {/* Checklist */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Checklist do Serviço</CardTitle>
            {!isGuest && (
              <Button variant="outline" size="sm" onClick={addChecklistItem}>
                Adicionar Item
              </Button>
            )}
          </CardHeader>
          <CardContent>
            {formData.checklist.length === 0 ? (
              <p className="text-slate-500 text-center py-4">
                Nenhum item no checklist
              </p>
            ) : (
              <div className="space-y-3">
                {formData.checklist.map((item, index) => (
                  <div
                    key={index}
                    className="flex items-start gap-3 p-3 border rounded-lg"
                  >
                    <Checkbox
                      checked={item.concluido}
                      onCheckedChange={(checked) =>
                        updateChecklistItem(index, "concluido", checked)
                      }
                      disabled={isGuest}
                    />
                    <div className="flex-1 space-y-2">
                      <Input
                        value={item.item}
                        onChange={(e) =>
                          updateChecklistItem(index, "item", e.target.value)
                        }
                        placeholder="Descrição da tarefa..."
                        disabled={isGuest}
                      />
                      <Input
                        value={item.observacao || ""}
                        onChange={(e) =>
                          updateChecklistItem(
                            index,
                            "observacao",
                            e.target.value
                          )
                        }
                        placeholder="Observações..."
                        className="text-sm"
                        disabled={isGuest}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Botão Salvar */}
        {!isGuest && (
          <div className="flex justify-end">
            <Button
              onClick={handleSave}
              disabled={isUpdating}
              className="bg-green-600 hover:bg-green-700"
            >
              <Save className="w-4 h-4 mr-2" />
              {isUpdating ? "Salvando..." : "Salvar Alterações"}
            </Button>
          </div>
        )}
      </div>
    );
  } catch (error) {
    console.error("ServiceDetails - Erro de renderização:", error);
    return (
      <div className="text-center py-12 text-red-400">
        <FileText className="w-12 h-12 mx-auto mb-3 opacity-30" />
        <p>Erro ao carregar detalhes do serviço</p>
        <p className="text-sm">{error.message}</p>
      </div>
    );
  }
}
