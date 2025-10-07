import { useState, useEffect } from "react";
import {
  createProcedimento,
  updateProcedimento,
} from "../../services/procedimentos.service";
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
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Save, Loader2, AlertCircle, Plus, X } from "lucide-react";

const FormError = ({ message }) => (
  <div className="flex items-center gap-2 text-sm text-red-600 mt-1">
    <AlertCircle className="w-4 h-4" />
    <span>{message}</span>
  </div>
);

export default function ProcedimentoModal({
  isOpen,
  onClose,
  procedimento,
  onSuccess,
}) {
  const [formData, setFormData] = useState({
    nome: "",
    descricao: "",
    checklistJson: "[]", // Inicializa como string JSON vazia
    tempoEstimadoHoras: "",
    categoria: "manutencao_preventiva",
  });
  const [checklistItem, setChecklistItem] = useState("");
  const [errors, setErrors] = useState({});
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (isOpen) {
      let initialChecklistJson = "[]";
      try {
        if (procedimento?.checklistJson) {
          const parsed = JSON.parse(procedimento.checklistJson);
          if (Array.isArray(parsed)) {
            initialChecklistJson = JSON.stringify(parsed);
          } else {
            console.warn(
              "checklistJson from backend is not an array after parsing:",
              parsed
            );
          }
        }
      } catch (e) {
        console.error("Failed to parse checklistJson from backend:", e);
      }

      setFormData({
        nome: procedimento?.nome || "",
        descricao: procedimento?.descricao || "",
        checklistJson: initialChecklistJson,
        tempoEstimadoHoras: procedimento?.tempoEstimadoHoras || "",
        categoria: procedimento?.categoria || "manutencao_preventiva",
      });
      setErrors({});
      setChecklistItem("");
    }
  }, [isOpen, procedimento]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: null }));
  };

  const handleSelectChange = (value) => {
    setFormData((prev) => ({ ...prev, categoria: value }));
  };

  const addChecklistItem = () => {
    if (checklistItem.trim()) {
      try {
        setFormData((prev) => {
          const currentChecklist = prev.checklistJson
            ? JSON.parse(prev.checklistJson)
            : [];
          return {
            ...prev,
            checklistJson: JSON.stringify([
              ...currentChecklist,
              { item: checklistItem.trim() },
            ]),
          };
        });
        setChecklistItem("");
      } catch (error) {
        console.error("Erro ao adicionar item ao checklist:", error);
      }
    }
  };

  const removeChecklistItem = (index) => {
    try {
      setFormData((prev) => {
        const currentChecklist = prev.checklistJson
          ? JSON.parse(prev.checklistJson)
          : [];
        return {
          ...prev,
          checklistJson: JSON.stringify(
            currentChecklist.filter((_, i) => i !== index)
          ),
        };
      });
    } catch (error) {
      console.error("Erro ao remover item do checklist:", error);
    }
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.nome?.trim())
      newErrors.nome = "O nome do procedimento é obrigatório.";
    if (!formData.descricao?.trim())
      newErrors.descricao = "A descrição é obrigatória.";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsSaving(true);
    try {
      console.log("Dados sendo enviados:", formData); // Debug log
      if (procedimento) {
        const result = await updateProcedimento(procedimento.id, formData);
        console.log("Resultado da atualização:", result); // Debug log
      } else {
        const result = await createProcedimento(formData);
        console.log("Resultado da criação:", result); // Debug log
      }
      onSuccess();
      onClose();
    } catch (error) {
      console.error("Erro ao salvar procedimento:", error);
      // Optionally, set an error state to display to the user
    } finally {
      setIsSaving(false);
    }
  };

  const categorias = [
    { value: "motor", label: "Motor" },
    { value: "suspensao", label: "Suspensão" },
    { value: "freios", label: "Freios" },
    { value: "eletrica", label: "Elétrica" },
    { value: "transmissao", label: "Transmissão" },
    { value: "carroceria", label: "Carroceria" },
    { value: "revisao", label: "Revisão" },
    { value: "manutencao_preventiva", label: "Manutenção Preventiva" },
  ];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent
        className="bg-white sm:max-w-2xl"
        aria-describedby="procedimento-modal-description"
      >
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-slate-800">
            {procedimento ? "Editar Procedimento" : "Novo Procedimento Padrão"}
          </DialogTitle>
          <DialogDescription>
            Defina um procedimento padrão para ser reutilizado em ordens de
            serviço.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="grid gap-4 py-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="nome">Nome do Procedimento *</Label>
              <Input
                id="nome"
                name="nome"
                value={formData.nome}
                onChange={handleInputChange}
                placeholder="Ex: Troca de Óleo"
                className={errors.nome ? "border-red-500" : ""}
              />
              {errors.nome && <FormError message={errors.nome} />}
            </div>
            <div className="grid gap-2">
              <Label htmlFor="categoria">Categoria</Label>
              <Select
                value={formData.categoria}
                onValueChange={handleSelectChange}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {categorias.map((cat) => (
                    <SelectItem key={cat.value} value={cat.value}>
                      {cat.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="tempoEstimadoHoras">Tempo Estimado (horas)</Label>
            <Input
              id="tempoEstimadoHoras"
              name="tempoEstimadoHoras"
              type="number"
              step="0.5"
              value={formData.tempoEstimadoHoras}
              onChange={handleInputChange}
              placeholder="Ex: 1.5"
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="descricao">Descrição Padrão *</Label>
            <Textarea
              id="descricao"
              name="descricao"
              value={formData.descricao}
              onChange={handleInputChange}
              placeholder="Descreva o procedimento detalhadamente..."
              className={`h-24 ${errors.descricao ? "border-red-500" : ""}`}
            />
            {errors.descricao && <FormError message={errors.descricao} />}
          </div>

          <div className="grid gap-2">
            <Label htmlFor="checklistItem">Checklist Padrão</Label>
            <div className="flex gap-2">
              <Input
                id="checklistItem"
                value={checklistItem}
                onChange={(e) => setChecklistItem(e.target.value)}
                placeholder="Adicionar item ao checklist..."
                onKeyPress={(e) =>
                  e.key === "Enter" && (e.preventDefault(), addChecklistItem())
                }
              />
              <Button
                type="button"
                onClick={addChecklistItem}
                variant="outline"
                size="icon"
              >
                <Plus className="w-4 h-4" />
              </Button>
            </div>
            {formData.checklistJson &&
              Array.isArray(JSON.parse(formData.checklistJson)) &&
              JSON.parse(formData.checklistJson).length > 0 && (
                <div className="space-y-2 max-h-40 overflow-y-auto border rounded-md p-2 bg-slate-50">
                  {JSON.parse(formData.checklistJson).map((item, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-2 rounded-md bg-white shadow-sm text-sm"
                    >
                      <span>{item.item}</span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeChecklistItem(index)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
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
