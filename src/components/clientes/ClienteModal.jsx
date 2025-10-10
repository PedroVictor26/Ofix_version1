import { useState, useEffect, useRef } from "react";
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
import { Save, Loader2, AlertCircle } from "lucide-react";
import { createCliente, updateCliente } from "@/services/clientes.service"; // Importação corrigida
import { toast } from "react-hot-toast";
import { getButtonClass } from "@/lib/buttonThemes";

// Um componente de erro reutilizável para os campos do formulário
const FormError = ({ message }) => (
  <div className="flex items-center gap-2 text-sm text-red-600 mt-1">
    <AlertCircle className="w-4 h-4" />
    <span>{message}</span>
  </div>
);

export default function ClienteModal({ isOpen, onClose, cliente, onSuccess }) {
  const [errors, setErrors] = useState({});
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({});
  const nomeInputRef = useRef(null);

  // Efeito para inicializar ou resetar o formulário quando o cliente ou o estado de abertura mudam
  useEffect(() => {
    if (isOpen) {
      setFormData({
        nome: cliente?.nomeCompleto || "",
        telefone: cliente?.telefone || "",
        email: cliente?.email || "",
        endereco: cliente?.endereco || "",
        // Adicione outros campos que possam existir no objeto cliente
      });
      setErrors({}); // Limpa os erros ao abrir o modal
      
      // Auto-focus no campo nome
      setTimeout(() => {
        if (nomeInputRef.current) {
          nomeInputRef.current.focus();
        }
      }, 100);
    }
  }, [isOpen, cliente]);

  const handleInputChange = (e) => {
    const { id, value } = e.target;
    setFormData((prev) => ({ ...prev, [id]: value }));
    // Limpa o erro do campo quando o usuário começa a digitar
    if (errors[id]) {
      setErrors((prev) => ({ ...prev, [id]: null }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    // Validação nome
    if (!formData.nome?.trim()) {
      newErrors.nome = "O nome do cliente é obrigatório.";
    }
    
    // Validação telefone
    if (!formData.telefone?.trim()) {
      newErrors.telefone = "O telefone é obrigatório.";
    }
    
    // Validação email (se preenchido)
    if (formData.email?.trim()) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email)) {
        newErrors.email = "Email inválido.";
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) {
      return;
    }

    setIsSaving(true);

    try {
      // --- INÍCIO DA LÓGICA REAL ---

      // --- INÍCIO DA LÓGICA REAL ---

      // Preparar dados para envio (remover campo 'nome' e usar apenas 'nomeCompleto')
      const { nome, ...otherData } = formData;
      const dataToSend = {
        ...otherData,
        nomeCompleto: nome,
      };

      if (cliente) {
        // Se o objeto 'cliente' existe, estamos editando
        await updateCliente(cliente.id, dataToSend);
        toast.success("Cliente atualizado com sucesso!");
      } else {
        // Se não, estamos criando um novo
        await createCliente(dataToSend);
        toast.success("Cliente criado com sucesso!");
      }

      // --- FIM DA LÓGICA REAL ---

      onSuccess(); // Chama a função para avisar o componente pai que algo mudou
      onClose(); // Fecha o modal
    } catch (error) {
      console.error("Erro ao salvar cliente:", error);
      // Pega a mensagem de erro da API, se houver, ou uma padrão
      const errorMessage =
        error.response?.data?.error?.message || "Falha ao salvar o cliente.";
      toast.error(errorMessage);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent
        className="bg-white sm:max-w-lg"
        aria-describedby="cliente-modal-description"
      >
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-slate-800">
            {cliente ? "Editar Cliente" : "Novo Cliente"}
          </DialogTitle>
          <p id="cliente-modal-description" className="sr-only">
            Preencha as informações abaixo para{" "}
            {cliente ? "atualizar o" : "criar um novo"} cliente.
          </p>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="grid gap-6 py-4">
          <div className="grid gap-2">
            <Label htmlFor="nome">Nome Completo *</Label>
            <Input
              ref={nomeInputRef}
              id="nome"
              value={formData.nome || ""}
              onChange={handleInputChange}
              placeholder="Ex: João da Silva"
              className={errors.nome ? "border-red-500" : ""}
            />
            {errors.nome && <FormError message={errors.nome} />}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="telefone">Telefone *</Label>
              <Input
                id="telefone"
                value={formData.telefone || ""}
                onChange={handleInputChange}
                placeholder="(11) 99999-9999"
                className={errors.telefone ? "border-red-500" : ""}
              />
              {errors.telefone && <FormError message={errors.telefone} />}
            </div>
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email || ""}
                onChange={handleInputChange}
                placeholder="joao.silva@email.com"
                className={errors.email ? "border-red-500" : ""}
              />
              {errors.email && <FormError message={errors.email} />}
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="endereco">Endereço</Label>
            <Textarea
              id="endereco"
              value={formData.endereco || ""}
              onChange={handleInputChange}
              placeholder="Rua das Flores, 123, São Paulo, SP"
              className="h-24"
            />
          </div>
        </form>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={isSaving}
            className={getButtonClass('secondary', 'outline')}
          >
            Cancelar
          </Button>
          <Button 
            type="submit" 
            onClick={handleSubmit} 
            disabled={isSaving}
            className={getButtonClass('success')}
          >
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
