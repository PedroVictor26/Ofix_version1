import { useState, useEffect } from 'react';
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
import { Save, Loader2, AlertCircle } from "lucide-react";

import * as fornecedoresService from "@/services/fornecedores.service.js";

const FormError = ({ message }) => (
    <div className="flex items-center gap-2 text-sm text-red-600 mt-1">
        <AlertCircle className="w-4 h-4" />
        <span>{message}</span>
    </div>
);

const initialFormData = {
    nome: '',
    contato: '',
    email: '',
};

export default function FornecedorModal({ isOpen, onClose, onSuccess }) {
    const [formData, setFormData] = useState(initialFormData);
    const [errors, setErrors] = useState({});
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setFormData(initialFormData); // Reseta o formulário
            setErrors({});
        }
    }, [isOpen]);

    const handleInputChange = (e) => {
        const { id, value } = e.target;
        setFormData(prev => ({ ...prev, [id]: value }));
        if (errors[id]) {
            setErrors(prev => ({ ...prev, [id]: null }));
        }
    };

    const validateForm = () => {
        const newErrors = {};
        if (!formData.nome?.trim()) newErrors.nome = "O nome do fornecedor é obrigatório.";
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validateForm()) return;

        setIsSaving(true);
        try {
            await fornecedoresService.createFornecedor(formData); // Salva no backend
            onSuccess(); // Aqui o pai pode recarregar a lista
            onClose();   // Fecha o modal
        } catch (error) {
            console.error("Erro ao salvar fornecedor:", error);
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="bg-white sm:max-w-lg" aria-describedby="fornecedor-modal-description">
                <DialogHeader>
                    <DialogTitle className="text-2xl font-bold text-slate-800">Novo Fornecedor</DialogTitle>
                    <DialogDescription>
                        Adicione um novo fornecedor para associar às suas peças.
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="grid gap-4 py-4">
                    <div className="grid gap-2">
                        <Label htmlFor="nome">Nome do Fornecedor *</Label>
                        <Input id="nome" value={formData.nome} onChange={handleInputChange} placeholder="Ex: AutoPeças Brasil" className={errors.nome ? "border-red-500" : ""} />
                        {errors.nome && <FormError message={errors.nome} />}
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="contato">Telefone de Contato</Label>
                        <Input id="contato" value={formData.contato} onChange={handleInputChange} placeholder="(11) 99999-8888" />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="email">Email</Label>
                        <Input id="email" type="email" value={formData.email} onChange={handleInputChange} placeholder="contato@autopecas.com" />
                    </div>
                </form>

                <DialogFooter>
                    <Button type="button" variant="outline" onClick={onClose} disabled={isSaving}>Cancelar</Button>
                    <Button type="submit" onClick={handleSubmit} disabled={isSaving}>
                        {isSaving ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Salvando...</> : <><Save className="w-4 h-4 mr-2" /> Salvar</>}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
