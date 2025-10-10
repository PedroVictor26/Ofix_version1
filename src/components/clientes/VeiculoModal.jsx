import { useState, useEffect, useRef, useMemo } from "react";
import toast from "react-hot-toast";
import InputMask from "react-input-mask";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { StandardButton, StandardInput } from "@/components/ui";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { createVeiculo } from "../../services/clientes.service";
import { Save, Car } from "lucide-react";
import { isValidPlaca } from "../../utils/validation";
import { useModalNavigation } from "../../hooks/useModalNavigation";

export default function VeiculoModal({
  isOpen,
  onClose,
  clienteId,
  onSuccess,
}) {
  const [formData, setFormData] = useState({
    placa: "",
    marca: "",
    modelo: "",
    anoFabricacao: new Date().getFullYear(),
    cor: "",
  });

  const [isSaving, setIsSaving] = useState(false);
  const [errors, setErrors] = useState({});
  const placaInputRef = useRef(null);

  // Verifica se há mudanças não salvas
  const hasUnsavedChanges = useMemo(() => {
    return Object.values(formData).some(value => 
      value && value.toString().trim() && value !== new Date().getFullYear()
    );
  }, [formData]);

  // Hook de navegação por teclado
  const { focusFirst } = useModalNavigation({
    isOpen,
    onClose,
    hasUnsavedChanges,
    confirmMessage: "Tem certeza que deseja fechar? Os dados do veículo serão perdidos."
  });

  // Auto-focus e reset do formulário
  useEffect(() => {
    if (isOpen) {
      setFormData({
        placa: "",
        marca: "",
        modelo: "",
        anoFabricacao: new Date().getFullYear(),
        cor: "",
      });
      setErrors({});
      
      // Auto-focus usando o hook
      focusFirst();
    }
  }, [isOpen, clienteId, focusFirst]);

  // Validação de placa em tempo real
  const handlePlacaChange = (e) => {
    const value = e.target.value.toUpperCase();
    setFormData({ ...formData, placa: value });
    
    // Limpa erro se começou a digitar
    if (errors.placa) {
      setErrors({ ...errors, placa: null });
    }
    
    // Valida formato se o campo estiver preenchido
    if (value && !isValidPlaca(value)) {
      setErrors({ ...errors, placa: 'Placa inválida (use ABC-1234 ou ABC1D23)' });
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.placa?.trim()) {
      newErrors.placa = 'Placa é obrigatória';
    } else if (!isValidPlaca(formData.placa)) {
      newErrors.placa = 'Placa inválida (use ABC-1234 ou ABC1D23)';
    }
    
    if (!formData.marca?.trim()) {
      newErrors.marca = 'Marca é obrigatória';
    }
    
    if (!formData.modelo?.trim()) {
      newErrors.modelo = 'Modelo é obrigatório';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!clienteId) {
      toast.error(
        "ID do cliente não encontrado. Feche o modal e selecione um cliente."
      );
      return;
    }

    if (!validateForm()) {
      toast.error("Por favor, corrija os erros no formulário.");
      return;
    }

    setIsSaving(true);
    const toastId = toast.loading("Salvando veículo...");

    try {
      await createVeiculo(clienteId, formData);

      setFormData({
        placa: "",
        marca: "",
        modelo: "",
        anoFabricacao: new Date().getFullYear(),
        cor: "",
      });
      toast.success("Veículo salvo com sucesso! 🎉", { id: toastId });
      onSuccess();
    } catch (error) {
      console.error("Erro ao salvar veículo:", error);
      console.error("Detalhes do erro:", error.response?.data);

      let errorMessage = "Falha ao salvar o veículo.";

      if (error.response?.data?.details) {
        errorMessage = error.response.data.details.join(", ");
      } else if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
      } else if (error.message) {
        errorMessage = error.message;
      }

      toast.error(errorMessage, { id: toastId });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent
        className="bg-white text-black dark:bg-white dark:text-black p-6 rounded-xl shadow-xl max-w-3xl"
        aria-describedby="veiculo-modal-description"
        data-modal-content
      >
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Car className="w-6 h-6" />
            Novo Veículo
          </DialogTitle>
          <p id="veiculo-modal-description" className="sr-only">
            Preencha as informações do novo veículo.
          </p>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="placa">Placa *</Label>
              <InputMask
                ref={placaInputRef}
                mask="AAA-9999"
                value={formData.placa}
                onChange={handlePlacaChange}
                className={`flex h-10 w-full rounded-md border px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${
                  errors.placa 
                    ? 'border-red-500 focus-visible:ring-red-500' 
                    : 'border-input'
                }`}
                placeholder="ABC-1234"
              />
              {errors.placa && (
                <p className="mt-1 text-sm text-red-600">{errors.placa}</p>
              )}
            </div>

            <div>
              <Label htmlFor="anoFabricacao">Ano</Label>
              <Input
                id="anoFabricacao"
                type="number"
                min="1900"
                max={new Date().getFullYear() + 1}
                value={formData.anoFabricacao}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    anoFabricacao: parseInt(e.target.value),
                  })
                }
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="marca">Marca *</Label>
              <Input
                id="marca"
                value={formData.marca}
                onChange={(e) => {
                  setFormData({ ...formData, marca: e.target.value });
                  if (errors.marca) {
                    setErrors({ ...errors, marca: null });
                  }
                }}
                className={errors.marca ? 'border-red-500 focus-visible:ring-red-500' : ''}
                placeholder="Toyota, Honda, Ford..."
                required
              />
              {errors.marca && (
                <p className="mt-1 text-sm text-red-600">{errors.marca}</p>
              )}
            </div>

            <div>
              <Label htmlFor="modelo">Modelo *</Label>
              <Input
                id="modelo"
                value={formData.modelo}
                onChange={(e) => {
                  setFormData({ ...formData, modelo: e.target.value });
                  if (errors.modelo) {
                    setErrors({ ...errors, modelo: null });
                  }
                }}
                className={errors.modelo ? 'border-red-500 focus-visible:ring-red-500' : ''}
                placeholder="Corolla, Civic, Focus..."
                required
              />
              {errors.modelo && (
                <p className="mt-1 text-sm text-red-600">{errors.modelo}</p>
              )}
            </div>
          </div>

          <div>
            <Label htmlFor="cor">Cor</Label>
            <Input
              id="cor"
              value={formData.cor}
              onChange={(e) =>
                setFormData({ ...formData, cor: e.target.value })
              }
              placeholder="Branco, Prata, Preto..."
            />
          </div>

          <div className="flex justify-end gap-3">
            <StandardButton variant="secondary" onClick={onClose}>
              Cancelar
            </StandardButton>
            <StandardButton
              type="submit"
              variant="success"
              disabled={isSaving}
              loading={isSaving}
              icon={Save}
            >
              {isSaving ? "Salvando..." : "Adicionar Veículo"}
            </StandardButton>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
