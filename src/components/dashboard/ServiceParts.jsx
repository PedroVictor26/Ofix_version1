import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, Plus, Package, AlertCircle, Trash2 } from "lucide-react";
import { createItemServicoPeca } from "../../services/itemServicoPeca.service";
import { updatePeca } from "../../services/pecas.service";
import toast from "react-hot-toast";

export default function ServiceParts({ service, pecas, onUpdate, isGuest }) {
  console.log("ServiceParts - Props recebidas:", { service, pecas });
  console.log("ServiceParts - Primeira peça (estrutura):", pecas?.[0]);

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedQuantities, setSelectedQuantities] = useState({});
  const [isAdding, setIsAdding] = useState(false);

  const filteredPecas =
    pecas?.filter(
      (peca) =>
        peca.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
        peca.codigoInterno?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        peca.codigoFabricante?.toLowerCase().includes(searchTerm.toLowerCase())
    ) || [];

  const handleAddPart = async (peca) => {
    const quantidade = selectedQuantities[peca.id] || 1;

    if (quantidade > peca.estoqueAtual) {
      toast.error("Quantidade insuficiente em estoque!");
      return;
    }

    setIsAdding(true);
    const toastId = toast.loading("Adicionando peça...");

    try {
      // Criar item de serviço
      await createItemServicoPeca({
        servicoId: service.id,
        pecaId: peca.id,
        quantidade: quantidade,
        precoUnitarioCobrado: Number(peca.precoVenda || 0),
        valorTotal: quantidade * Number(peca.precoVenda || 0),
      });

      // Atualizar estoque da peça
      await updatePeca(peca.id, {
        estoqueAtual: peca.estoqueAtual - quantidade,
      });

      // Resetar quantidade selecionada
      setSelectedQuantities({ ...selectedQuantities, [peca.id]: 1 });

      toast.success("Peça adicionada com sucesso!", { id: toastId });
      onUpdate(); // Atualizar o serviço (trigger refresh)
    } catch (error) {
      console.error("Erro ao adicionar peça:", error);
      toast.error(
        `Erro ao adicionar peça: ${error.message || "Erro desconhecido"}`,
        { id: toastId }
      );
    } finally {
      setIsAdding(false);
    }
  };

  const setQuantity = (pecaId, quantity) => {
    setSelectedQuantities({
      ...selectedQuantities,
      [pecaId]: Math.max(1, parseInt(quantity) || 1),
    });
  };

  // Verificação de segurança após os hooks
  if (!service || !service.id) {
    console.error("ServiceParts - Serviço inválido:", service);
    return (
      <div className="text-center py-12 text-slate-400">
        <Package className="w-12 h-12 mx-auto mb-3 opacity-30" />
        <p>Serviço não encontrado</p>
        <p className="text-sm">Recarregue a página e tente novamente</p>
      </div>
    );
  }

  try {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              placeholder="Buscar peças..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        <div className="grid gap-4">
          {filteredPecas.map((peca) => (
            <Card key={peca.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg font-semibold text-slate-900">
                      {peca.nome}
                    </CardTitle>
                    <p className="text-sm text-slate-500">
                      SKU: {peca.codigoInterno || peca.codigoFabricante}
                    </p>
                    <div className="flex items-center gap-2 mt-2">
                      {peca.categoria && (
                        <Badge variant="secondary">
                          {peca.categoria.replace("_", " ")}
                        </Badge>
                      )}
                      <Badge
                        variant={
                          peca.estoqueAtual <= peca.estoqueMinimo
                            ? "destructive"
                            : "outline"
                        }
                        className="flex items-center gap-1"
                      >
                        <Package className="w-3 h-3" />
                        {peca.estoqueAtual} em estoque
                      </Badge>
                      {peca.estoqueAtual <= peca.estoqueMinimo && (
                        <Badge
                          variant="destructive"
                          className="flex items-center gap-1"
                        >
                          <AlertCircle className="w-3 h-3" />
                          Estoque baixo
                        </Badge>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-green-600">
                      R${" "}
                      {peca.precoVenda
                        ? Number(peca.precoVenda).toFixed(2)
                        : "0,00"}
                    </p>
                    <p className="text-sm text-slate-500">
                      Custo: R${" "}
                      {peca.precoCusto
                        ? Number(peca.precoCusto).toFixed(2)
                        : "0,00"}
                    </p>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    <label className="text-sm font-medium">Quantidade:</label>
                    <Input
                      type="number"
                      min="1"
                      max={peca.estoqueAtual}
                      value={selectedQuantities[peca.id] || 1}
                      onChange={(e) => setQuantity(peca.id, e.target.value)}
                      className="w-20"
                      disabled={isGuest}
                    />
                  </div>
                  <div className="text-sm text-slate-600">
                    Subtotal: R${" "}
                    {(
                      (selectedQuantities[peca.id] || 1) *
                      Number(peca.precoVenda || 0)
                    ).toFixed(2)}
                  </div>
                  {!isGuest && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleAddPart(peca)}
                      disabled={isAdding || peca.estoqueAtual === 0}
                      className="ml-auto flex items-center gap-2"
                    >
                      <Plus className="w-4 h-4" />
                      Adicionar
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredPecas.length === 0 && (
          <div className="text-center py-12 text-slate-400">
            <Package className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p>Nenhuma peça encontrada</p>
            <p className="text-sm">Tente ajustar os termos de busca</p>
          </div>
        )}
      </div>
    );
  } catch (error) {
    console.error("ServiceParts - Erro de renderização:", error);
    return (
      <div className="text-center py-12 text-red-400">
        <Package className="w-12 h-12 mx-auto mb-3 opacity-30" />
        <p>Erro ao carregar peças</p>
        <p className="text-sm">{error.message}</p>
      </div>
    );
  }
}
