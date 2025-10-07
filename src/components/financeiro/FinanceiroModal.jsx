import { createTransacao, updateTransacao } from "@/services/financeiro.service";
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Save, Loader2, AlertCircle, TrendingUp, TrendingDown } from "lucide-react";

const FormError = ({ message }) => (
    <div className="flex items-center gap-2 text-sm text-red-600 mt-1">
        <AlertCircle className="w-4 h-4" />
        <span>{message}</span>
    </div>
);

export default function FinanceiroModal({ isOpen, onClose, transacao, onSuccess }) {
    const [formData, setFormData] = useState({
        descricao: '',
        valor: '',
        tipo: 'Entrada',
        data: new Date().toISOString().split('T')[0],
        categoria: '',
    });
    const [errors, setErrors] = useState({});
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (isOpen && transacao) { // Only update if modal is open and a transaction is provided (for editing)
            setFormData({
                descricao: transacao?.descricao || '',
                valor: transacao?.valor || '',
                tipo: transacao?.tipo || 'Entrada',
                data: transacao?.data ? new Date(transacao.data).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
                categoria: transacao?.categoria || '',
            });
            setErrors({});
        } else if (isOpen && !transacao) { // Reset for new transaction
            setFormData({
                descricao: '',
                valor: '',
                tipo: 'Entrada',
                data: new Date().toISOString().split('T')[0],
                categoria: '',
            });
            setErrors({});
        }
    }, [isOpen, transacao]);

    const handleInputChange = (e) => {
        const { id, value } = e.target;
        setFormData(prev => ({ ...prev, [id]: value }));
        if (errors[id]) setErrors(prev => ({ ...prev, [id]: null }));
    };

    const handleSelectChange = (value) => {
        setFormData(prev => ({ ...prev, tipo: value }));
    };

    const validateForm = () => {
        const newErrors = {};
        if (!formData.descricao?.trim()) newErrors.descricao = "A descrição é obrigatória.";
        if (!formData.valor || parseFloat(formData.valor) <= 0) newErrors.valor = "O valor deve ser um número positivo.";
        if (!formData.data) newErrors.data = "A data é obrigatória.";
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validateForm()) return;

        setIsSaving(true);
        try {
            if (transacao) {
                await updateTransacao(transacao.id, {
                    ...formData,
                    valor: parseFloat(formData.valor),
                    data: formData.data,
                });
            } else {
                await createTransacao({
                    ...formData,
                    valor: parseFloat(formData.valor),
                    data: formData.data,
                });
            }
            onSuccess();
            onClose();
        } catch (error) {
            console.error("Erro ao salvar transação:", error);
            setErrors({ form: error.message || "Erro ao salvar transação." });
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="bg-white sm:max-w-lg" aria-describedby="financeiro-modal-description">
                <DialogHeader>
                    <DialogTitle className="text-2xl font-bold text-slate-800">
                        {transacao ? 'Editar Transação' : 'Nova Transação'}
                    </DialogTitle>
                    <DialogDescription>
                        Preencha os detalhes da transação abaixo.
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="grid gap-4 py-4">
                    <div className="grid gap-2">
                        <Label htmlFor="descricao">Descrição *</Label>
                        <Input id="descricao" value={formData.descricao || ''} onChange={handleInputChange} placeholder="Ex: Venda de peça" className={errors.descricao ? "border-red-500" : ""} />
                        {errors.descricao && <FormError message={errors.descricao} />}
                    </div>

                    <div className="grid sm:grid-cols-3 gap-4">
                        <div className="grid gap-2 sm:col-span-2">
                            <Label htmlFor="valor">Valor (R$) *</Label>
                            <Input id="valor" type="number" value={formData.valor || ''} onChange={handleInputChange} placeholder="0.00" className={errors.valor ? "border-red-500" : ""} />
                            {errors.valor && <FormError message={errors.valor} />}
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="tipo">Tipo *</Label>
                            <Select value={formData.tipo || ''} onValueChange={handleSelectChange}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Entrada"><span className="flex items-center gap-2"><TrendingUp className="w-4 h-4 text-green-600" /> Entrada</span></SelectItem>
                                    <SelectItem value="Saída"><span className="flex items-center gap-2"><TrendingDown className="w-4 h-4 text-red-600" /> Saída</span></SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="grid sm:grid-cols-2 gap-4">
                        <div className="grid gap-2">
                            <Label htmlFor="data">Data *</Label>
                            <Input id="data" type="date" value={formData.data || ''} onChange={handleInputChange} className={errors.data ? "border-red-500" : ""} />
                            {errors.data && <FormError message={errors.data} />}
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="categoria">Categoria</Label>
                            <Input id="categoria" value={formData.categoria || ''} onChange={handleInputChange} placeholder="Ex: Vendas" />
                        </div>
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
