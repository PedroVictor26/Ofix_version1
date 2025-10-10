import { useState, useEffect, useRef, useMemo } from "react";
import InputMask from "react-input-mask";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { StandardButton, StandardInput } from "@/components/ui";
import { FormError } from "@/components/ui/modern-input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Save } from "lucide-react";
import { createCliente, updateCliente } from "@/services/clientes.service";
import { toast } from "react-hot-toast";
import { isValidCPF, isValidEmail } from "../../utils/validation";
import { useModalNavigation } from "../../hooks/useModalNavigation";

export default function ClienteModal({ isOpen, onClose, cliente, onSuccess }) {
  const [errors, setErrors] = useState({});
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({});
  const nomeInputRef = useRef(null);

  // Verifica se há mudanças não salvas
  const hasUnsavedChanges = useMemo(() => {
    if (!cliente) {
      // Novo cliente: verifica se algum campo foi preenchido
      return Object.values(formData).some(value => value && value.trim());
    } else {
      // Editando cliente: verifica se algum campo foi alterado
      return (
        formData.nome !== (cliente.nomeCompleto || "") ||
        formData.telefone !== (cliente.telefone || "") ||
        formData.email !== (cliente.email || "") ||
        formData.endereco !== (cliente.endereco || "") ||
        formData.cpf !== (cliente.cpf || "")
      );
    }
  }, [formData, cliente]);

  // Hook de navegação por teclado
  const { focusFirst } = useModalNavigation({
    isOpen,
    onClose,
    hasUnsavedChanges,
    confirmMessage: "Tem certeza que deseja fechar? As alterações não salvas serão perdidas."
  });

  // Efeito para inicializar ou resetar o formulário quando o cliente ou o estado de abertura mudam
  useEffect(() => {
    if (isOpen) {
      setFormData({
        nome: cliente?.nomeCompleto || "",
        telefone: cliente?.telefone || "",
        email: cliente?.email || "",
        endereco: cliente?.endereco || "",
        cpf: cliente?.cpf || "",
      });
      setErrors({}); // Limpa os erros ao abrir o modal
      
      // Auto-focus no campo nome usando o hook
      focusFirst();
    }
  }, [isOpen, cliente, focusFirst]);

  // Handlers específicos para cada campo com validação em tempo real
  const handleNomeChange = (e) => {
    const value = e.target.value;
    setFormData(prev => ({ ...prev, nome: value }));
    if (errors.nome) {
      setErrors(prev => ({ ...prev, nome: null }));
    }
  };

  const handleCpfChange = (e) => {
    const value = e.target.value;
    setFormData(prev => ({ ...prev, cpf: value }));
    
    // Limpa erro se começou a digitar
    if (errors.cpf) {
      setErrors(prev => ({ ...prev, cpf: null }));
    }
    
    // Valida CPF em tempo real se preenchido
    if (value && !isValidCPF(value)) {
      setErrors(prev => ({ ...prev, cpf: 'CPF inválido' }));
    }
  };

  const handleTelefoneChange = (e) => {
    const value = e.target.value;
    setFormData(prev => ({ ...prev, telefone: value }));
    if (errors.telefone) {
      setErrors(prev => ({ ...prev, telefone: null }));
    }
  };

  const handleEmailChange = (e) => {
    const value = e.target.value;
    setFormData(prev => ({ ...prev, email: value }));
    
    // Limpa erro se começou a digitar
    if (errors.email) {
      setErrors(prev => ({ ...prev, email: null }));
    }
    
    // Valida email em tempo real se preenchido
    if (value && !isValidEmail(value)) {
      setErrors(prev => ({ ...prev, email: 'Email inválido' }));
    }
  };

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
    } else if (formData.nome.trim().length < 2) {
      newErrors.nome = "O nome deve ter pelo menos 2 caracteres.";
    }
    
    // Validação CPF (se preenchido)
    if (formData.cpf?.trim() && !isValidCPF(formData.cpf)) {
      newErrors.cpf = "CPF inválido.";
    }
    
    // Validação telefone
    if (!formData.telefone?.trim()) {
      newErrors.telefone = "O telefone é obrigatório.";
    } else if (formData.telefone.replace(/\D/g, '').length < 10) {
      newErrors.telefone = "Telefone deve ter pelo menos 10 dígitos.";
    }
    
    // Validação email (se preenchido)
    if (formData.email?.trim() && !isValidEmail(formData.email)) {
      newErrors.email = "Email inválido.";
    }
    
    setErrors(newErrors);
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
        data-modal-content
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
          <StandardInput
            ref={nomeInputRef}
            label="Nome Completo"
            required
            value={formData.nome || ""}
            onChange={handleNomeChange}
            placeholder="Ex: João da Silva"
            error={errors.nome}
          />

          <div className="grid gap-2">
            <Label htmlFor="cpf">CPF</Label>
            <InputMask
              mask="999.999.999-99"
              value={formData.cpf || ""}
              onChange={handleCpfChange}
              className={`flex h-10 w-full rounded-md border px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${
                errors.cpf 
                  ? 'border-red-500 focus-visible:ring-red-500' 
                  : 'border-input'
              }`}
              placeholder="000.000.000-00"
            />
            {errors.cpf && <FormError message={errors.cpf} />}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="telefone">Telefone *</Label>
              <InputMask
                mask="(99) 99999-9999"
                value={formData.telefone || ""}
                onChange={handleTelefoneChange}
                className={`flex h-10 w-full rounded-md border px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${
                  errors.telefone 
                    ? 'border-red-500 focus-visible:ring-red-500' 
                    : 'border-input'
                }`}
                placeholder="(11) 99999-9999"
              />
              {errors.telefone && <FormError message={errors.telefone} />}
            </div>
            <StandardInput
              type="email"
              label="Email"
              value={formData.email || ""}
              onChange={handleEmailChange}
              placeholder="joao.silva@email.com"
              error={errors.email}
            />
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
          <StandardButton
            variant="secondary"
            onClick={onClose}
            disabled={isSaving}
          >
            Cancelar
          </StandardButton>
          <StandardButton 
            variant="success"
            onClick={handleSubmit} 
            disabled={isSaving}
            loading={isSaving}
            icon={Save}
          >
            {isSaving ? 'Salvando...' : 'Salvar'}
          </StandardButton>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
