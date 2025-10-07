import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import * as pecasService from "@/services/pecas.service.js";
import { Save, Loader2, AlertCircle } from "lucide-react";

const FormError = ({ message }) => (
  <div className="flex items-center gap-2 text-sm text-red-600 mt-1">
    <AlertCircle className="w-4 h-4" />
    <span>{message}</span>
  </div>
);

const getInitialFormData = (peca) => ({
  nome: peca?.nome || "",
  sku: peca?.sku || "",
  fabricante: peca?.fabricante || "",
  fornecedorId: peca?.fornecedorId || "",
  precoCusto: peca?.precoCusto || 0,
  precoVenda: peca?.precoVenda || 0,
  quantidade: peca?.quantidade || 0,
  estoqueMinimo: peca?.estoqueMinimo || 1,
});

export default function PecaModal({
  isOpen,
  onClose,
  peca,
  fornecedores,
  onSuccess,
}) {
  const [formData, setFormData] = useState(getInitialFormData(peca));
  const [errors, setErrors] = useState({});
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setFormData(getInitialFormData(peca));
      setErrors({});
    }
  }, [isOpen, peca]);

  const handleInputChange = (e) => {
    const { id, value } = e.target;
    setFormData((prev) => ({ ...prev, [id]: value }));
    if (errors[id]) {
      setErrors((prev) => ({ ...prev, [id]: null }));
    }
  };

  const handleSelectChange = (id, value) => {
    setFormData((prev) => ({ ...prev, [id]: value }));
    if (errors[id]) {
      setErrors((prev) => ({ ...prev, [id]: null }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.nome?.trim())
      newErrors.nome = "O nome da peça é obrigatório.";
    if (!formData.sku?.trim()) newErrors.sku = "O SKU é obrigatório.";
    if (formData.precoVenda <= 0)
      newErrors.precoVenda = "O preço de venda deve ser positivo.";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsSaving(true);
    try {
      if (peca) {
        await pecasService.updatePeca(peca.id, formData);
      } else {
        await pecasService.createPeca(formData);
      }
      onSuccess();
      onClose();
    } catch (error) {
      console.error("Erro ao salvar peça:", error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent
        className="bg-white sm:max-w-2xl"
        aria-describedby="peca-modal-description"
      >
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-slate-800">
            {peca ? "Editar Peça" : "Nova Peça no Estoque"}
          </DialogTitle>
          <DialogDescription>
            Preencha os detalhes da peça abaixo.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="grid gap-4 py-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="nome">Nome da Peça *</Label>
              <Input
                id="nome"
                value={formData.nome}
                onChange={handleInputChange}
                placeholder="Ex: Filtro de Óleo"
                className={errors.nome ? "border-red-500" : ""}
              />
              {errors.nome && <FormError message={errors.nome} />}
            </div>
            <div className="grid gap-2">
              <Label htmlFor="sku">SKU (Código) *</Label>
              <Input
                id="sku"
                value={formData.sku}
                onChange={handleInputChange}
                placeholder="Ex: FO-123"
                className={errors.sku ? "border-red-500" : ""}
              />
              {errors.sku && <FormError message={errors.sku} />}
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="fabricante">Fabricante</Label>
              <Input
                id="fabricante"
                value={formData.fabricante}
                onChange={handleInputChange}
                placeholder="Ex: Fram"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="fornecedorId">Fornecedor</Label>
              <Select
                value={formData.fornecedorId}
                onValueChange={(value) =>
                  handleSelectChange("fornecedorId", value)
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um fornecedor" />
                </SelectTrigger>
                <SelectContent>
                  {fornecedores?.map((f) => (
                    <SelectItem key={f.id} value={f.id}>
                      {f.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="precoCusto">Preço de Custo (R$)</Label>
              <Input
                id="precoCusto"
                type="number"
                value={formData.precoCusto}
                onChange={handleInputChange}
                placeholder="0.00"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="precoVenda">Preço de Venda (R$) *</Label>
              <Input
                id="precoVenda"
                type="number"
                value={formData.precoVenda}
                onChange={handleInputChange}
                placeholder="0.00"
                className={errors.precoVenda ? "border-red-500" : ""}
              />
              {errors.precoVenda && <FormError message={errors.precoVenda} />}
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="quantidade">Quantidade em Estoque</Label>
              <Input
                id="quantidade"
                type="number"
                value={formData.quantidade}
                onChange={handleInputChange}
                placeholder="0"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="estoqueMinimo">Estoque Mínimo</Label>
              <Input
                id="estoqueMinimo"
                type="number"
                value={formData.estoqueMinimo}
                onChange={handleInputChange}
                placeholder="0"
              />
            </div>
          </div>
        </form>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={isSaving}
          >
            Cancelar
          </Button>
          <Button type="submit" onClick={handleSubmit} disabled={isSaving}>
            {isSaving ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Salvando...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" /> Salvar
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
