import { createMensagem, updateMensagem } from "@/services/mensagens.service";
import { useState, useEffect, useRef } from 'react';
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Save, Loader2, AlertCircle } from "lucide-react";

const FormError = ({ message }) => (
    <div className="flex items-center gap-2 text-sm text-red-600 mt-1">
        <AlertCircle className="w-4 h-4" />
        <span>{message}</span>
    </div>
);

export default function MensagemModal({ isOpen, onClose, mensagem, onSuccess }) {
    const [formData, setFormData] = useState({
        nome: '',
        template: '',
        categoria: 'status_update',
    });
    const [errors, setErrors] = useState({});
    const [isSaving, setIsSaving] = useState(false);
    const textareaRef = useRef(null);

    useEffect(() => {
        if (isOpen) {
            setFormData({
                nome: mensagem?.nome || '',
                template: mensagem?.template || '',
                categoria: mensagem?.categoria || 'status_update',
            });
            setErrors({});
        }
    }, [isOpen, mensagem]);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        if (errors[name]) setErrors(prev => ({ ...prev, [name]: null }));
    };

    const handleSelectChange = (value) => {
        setFormData(prev => ({ ...prev, categoria: value }));
    };

    const validateForm = () => {
        const newErrors = {};
        if (!formData.nome?.trim()) newErrors.nome = "O nome da mensagem é obrigatório.";
        if (!formData.template?.trim()) newErrors.template = "O texto da mensagem é obrigatório.";
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validateForm()) return;

        setIsSaving(true);
        try {
            if (mensagem) {
                await updateMensagem(mensagem.id, formData);
            } else {
                await createMensagem(formData);
            }
            onSuccess();
            onClose();
        } catch (error) {
            setErrors({ form: error?.response?.data?.error || error.message || "Erro ao salvar mensagem." });
        } finally {
            setIsSaving(false);
        }
    };

    const categorias = [
        { value: "status_update", label: "Atualização de Status" },
        { value: "orcamento", label: "Orçamento" },
        { value: "aprovacao", label: "Aprovação" },
        { value: "conclusao", label: "Conclusão" },
        { value: "agenda", label: "Agendamento" },
        { value: "cobranca", label: "Cobrança" },
        { value: "promocao", label: "Promoção" }
    ];

    const variaveisComuns = [
        '{cliente_nome}',
        '{veiculo_modelo}',
        '{veiculo_placa}',
        '{numero_os}',
        '{data_previsao}',
        '{valor_total}',
        '{status_servico}'
    ];

    const inserirVariavel = (variavel) => {
        const textarea = textareaRef.current;
        if (!textarea) return;

        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const text = formData.template || '';
        const newText = text.substring(0, start) + variavel + text.substring(end);

        setFormData(prev => ({ ...prev, template: newText }));

        setTimeout(() => {
            textarea.focus();
            textarea.setSelectionRange(start + variavel.length, start + variavel.length);
        }, 0);
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="bg-white sm:max-w-2xl" aria-describedby="mensagem-modal-description">
                <DialogHeader>
                    <DialogTitle className="text-2xl font-bold text-slate-800">
                        {mensagem ? 'Editar Mensagem' : 'Nova Mensagem Padrão'}
                    </DialogTitle>
                    <DialogDescription>
                        Crie ou edite um template de mensagem para comunicação com clientes.
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="grid gap-4 py-4">
                    <div className="grid sm:grid-cols-2 gap-4">
                        <div className="grid gap-2">
                            <Label htmlFor="nome">Nome da Mensagem *</Label>
                            <Input id="nome" name="nome" value={formData.nome} onChange={handleInputChange} placeholder="Ex: Serviço Concluído" className={errors.nome ? "border-red-500" : ""} />
                            {errors.nome && <FormError message={errors.nome} />}
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="categoria">Categoria</Label>
                            <Select value={formData.categoria} onValueChange={handleSelectChange}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Selecione uma categoria..." />
                                </SelectTrigger>
                                <SelectContent>
                                    {categorias.map(cat => <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="template">Texto da Mensagem *</Label>
                        <Textarea
                            id="template"
                            name="template"
                            ref={textareaRef}
                            value={formData.template}
                            onChange={handleInputChange}
                            placeholder="Olá {cliente_nome}, seu veículo {veiculo_modelo} está pronto..."
                            className={`h-32 ${errors.template ? "border-red-500" : ""}`}
                        />
                        {errors.template && <FormError message={errors.template} />}
                    </div>

                    <div className="grid gap-2">
                        <Label>Variáveis Disponíveis</Label>
                        <div className="flex flex-wrap gap-2">
                            {variaveisComuns.map((variavel) => (
                                <Button key={variavel} type="button" variant="outline" size="sm" onClick={() => inserirVariavel(variavel)} className="text-xs">
                                    {variavel}
                                </Button>
                            ))}
                        </div>
                    </div>

                    <div className="bg-blue-50 p-4 rounded-lg text-blue-900">
                        <h4 className="font-semibold mb-2">Preview da Mensagem:</h4>
                        <div className="text-sm whitespace-pre-line">
                            {(formData.template || '')
                                .replace(/{cliente_nome}/g, 'João Silva')
                                .replace(/{veiculo_modelo}/g, 'Honda Civic')
                                .replace(/{veiculo_placa}/g, 'ABC-1234')
                                .replace(/{numero_os}/g, 'OS001')
                                .replace(/{data_previsao}/g, '15/12/2024')
                                .replace(/{valor_total}/g, 'R$ 350,00')
                                .replace(/{status_servico}/g, 'Em Andamento')
                            }
                        </div>
                        {errors.form && <FormError message={errors.form} />}
                    </div>

                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={onClose} disabled={isSaving}>Cancelar</Button>
                        <Button type="submit" disabled={isSaving}>
                            {isSaving ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Salvando...</> : <><Save className="w-4 h-4 mr-2" /> Salvar</>}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
