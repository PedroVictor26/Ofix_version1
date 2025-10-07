import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
    Calendar, DollarSign, FileText,
    CheckCircle, AlertCircle, Edit3, Save, X
} from "lucide-react";
// import { useAutoSave } from '../../hooks/useAutoSave.js';
import toast from 'react-hot-toast';

const statusOptions = [
    { value: 'AGUARDANDO', label: 'Aguardando', color: 'bg-yellow-100 text-yellow-800 border-yellow-200' },
    { value: 'EM_ANDAMENTO', label: 'Em Andamento', color: 'bg-blue-100 text-blue-800 border-blue-200' },
    { value: 'AGUARDANDO_PECAS', label: 'Aguardando Peças', color: 'bg-orange-100 text-orange-800 border-orange-200' },
    { value: 'AGUARDANDO_APROVACAO', label: 'Aguardando Aprovação', color: 'bg-purple-100 text-purple-800 border-purple-200' },
    { value: 'FINALIZADO', label: 'Finalizado', color: 'bg-green-100 text-green-800 border-green-200' },
    { value: 'CANCELADO', label: 'Cancelado', color: 'bg-red-100 text-red-800 border-red-200' }
];

export default function ServiceDetailsSimple({ service, onUpdate }) {
    const [isEditing, setIsEditing] = useState(false);
    const [formData, setFormData] = useState({
        descricaoProblema: '',
        descricaoSolucao: '',
        status: 'AGUARDANDO',
        valorTotalEstimado: '',
        valorTotalServicos: '',
        valorTotalFinal: '',
        dataPrevisaoEntrega: '',
        observacoes: '',
        kmEntrada: ''
    });

    // Estado para controle de salvamento
    const [saveStatus, setSaveStatus] = useState('idle');
    const [hasChanges, setHasChanges] = useState(false);

    useEffect(() => {
        if (service && !isEditing) {
            const newFormData = {
                descricaoProblema: service.descricaoProblema || '',
                descricaoSolucao: service.descricaoSolucao || '',
                status: service.status || 'AGUARDANDO',
                valorTotalEstimado: service.valorTotalEstimado || '',
                valorTotalServicos: service.valorTotalServicos || '',
                valorTotalFinal: service.valorTotalFinal || '',
                dataPrevisaoEntrega: service.dataPrevisaoEntrega ?
                    new Date(service.dataPrevisaoEntrega).toISOString().split('T')[0] : '',
                observacoes: service.observacoes || '',
                kmEntrada: service.kmEntrada || ''
            };

            // Só atualiza se realmente mudou
            const currentDataString = JSON.stringify(formData);
            const newDataString = JSON.stringify(newFormData);

            if (currentDataString !== newDataString) {
                setFormData(newFormData);
            }
        }
    }, [service, isEditing]);

    const handleInputChange = (field, value) => {
        if (isEditing) {
            setFormData(prev => ({
                ...prev,
                [field]: value
            }));
            setHasChanges(true);
        }
    };

    const handleCancelEdit = () => {
        // Resetar formData para os valores originais do service
        if (service) {
            setFormData({
                descricaoProblema: service.descricaoProblema || '',
                descricaoSolucao: service.descricaoSolucao || '',
                status: service.status || 'AGUARDANDO',
                valorTotalEstimado: service.valorTotalEstimado || '',
                valorTotalServicos: service.valorTotalServicos || '',
                valorTotalFinal: service.valorTotalFinal || '',
                dataPrevisaoEntrega: service.dataPrevisaoEntrega ?
                    new Date(service.dataPrevisaoEntrega).toISOString().split('T')[0] : '',
                observacoes: service.observacoes || '',
                kmEntrada: service.kmEntrada || ''
            });
        }
        setIsEditing(false);
        setHasChanges(false);
    };

    const handleSave = async () => {
        try {
            setSaveStatus('saving');
            if (onUpdate) {
                await onUpdate(formData);
            }
            setSaveStatus('saved');
            setHasChanges(false);
            toast.success('Dados salvos com sucesso!');
            setIsEditing(false);

            // Limpar status após 2 segundos
            setTimeout(() => setSaveStatus('idle'), 2000);
        } catch (error) {
            console.error('Erro ao salvar:', error);
            setSaveStatus('error');
            toast.error('Erro ao salvar dados');

            // Limpar status de erro após 3 segundos
            setTimeout(() => setSaveStatus('idle'), 3000);
        }
    };

    const formatCurrency = (value) => {
        if (!value) return 'R$ 0,00';
        const numValue = typeof value === 'string' ? parseFloat(value) : value;
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL'
        }).format(numValue);
    };

    const formatDate = (dateString) => {
        if (!dateString) return 'Não definida';
        return new Date(dateString).toLocaleDateString('pt-BR');
    };

    const getStatusConfig = (status) => {
        return statusOptions.find(opt => opt.value === status) || statusOptions[0];
    };

    if (!service) {
        return (
            <div className="flex items-center justify-center p-8">
                <div className="text-center">
                    <AlertCircle className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                    <p className="text-slate-600">Nenhum serviço selecionado</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header com Status e Ações */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500/20 to-blue-600/20 flex items-center justify-center">
                        <FileText className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                        <h3 className="text-lg font-semibold text-slate-900">
                            Detalhes do Serviço
                        </h3>
                        <p className="text-sm text-slate-600">
                            OS #{service.numeroOs}
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    {/* Status do Salvamento */}
                    {saveStatus !== 'idle' && (
                        <div className="flex items-center gap-2 text-sm">
                            {saveStatus === 'saving' && (
                                <>
                                    <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                                    <span className="text-blue-600">Salvando...</span>
                                </>
                            )}
                            {saveStatus === 'saved' && (
                                <>
                                    <CheckCircle className="w-4 h-4 text-green-600" />
                                    <span className="text-green-600">Salvo com sucesso!</span>
                                </>
                            )}
                            {saveStatus === 'error' && (
                                <>
                                    <AlertCircle className="w-4 h-4 text-red-600" />
                                    <span className="text-red-600">Erro ao salvar</span>
                                </>
                            )}
                        </div>
                    )}

                    <Button
                        variant={isEditing ? "default" : "outline"}
                        size="sm"
                        onClick={isEditing ? handleCancelEdit : () => setIsEditing(true)}
                        className="flex items-center gap-2"
                    >
                        {isEditing ? (
                            <>
                                <X className="w-4 h-4" />
                                Cancelar
                            </>
                        ) : (
                            <>
                                <Edit3 className="w-4 h-4" />
                                Editar
                            </>
                        )}
                    </Button>
                </div>
            </div>

            {/* Informações Básicas */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Coluna Esquerda */}
                <div className="space-y-4">
                    <Card className="border-0 shadow-md bg-white/90 backdrop-blur-sm">
                        <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-blue-600/5 rounded-lg" />
                        <CardHeader className="relative pb-3">
                            <CardTitle className="text-base font-semibold text-slate-900 flex items-center gap-2">
                                <FileText className="w-4 h-4 text-blue-600" />
                                Descrição do Problema
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="relative">
                            {isEditing ? (
                                <Textarea
                                    value={formData.descricaoProblema}
                                    onChange={(e) => handleInputChange('descricaoProblema', e.target.value)}
                                    placeholder="Descreva o problema relatado pelo cliente..."
                                    className="min-h-[100px] border-slate-200 focus:border-blue-500"
                                />
                            ) : (
                                <p className="text-slate-700 leading-relaxed">
                                    {service.descricaoProblema || 'Nenhuma descrição fornecida'}
                                </p>
                            )}
                        </CardContent>
                    </Card>

                    <Card className="border-0 shadow-md bg-white/90 backdrop-blur-sm">
                        <div className="absolute inset-0 bg-gradient-to-r from-green-500/5 to-green-600/5 rounded-lg" />
                        <CardHeader className="relative pb-3">
                            <CardTitle className="text-base font-semibold text-slate-900 flex items-center gap-2">
                                <CheckCircle className="w-4 h-4 text-green-600" />
                                Solução Aplicada
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="relative">
                            {isEditing ? (
                                <Textarea
                                    value={formData.descricaoSolucao}
                                    onChange={(e) => handleInputChange('descricaoSolucao', e.target.value)}
                                    placeholder="Descreva a solução aplicada..."
                                    className="min-h-[100px] border-slate-200 focus:border-green-500"
                                />
                            ) : (
                                <p className="text-slate-700 leading-relaxed">
                                    {service.descricaoSolucao || 'Solução ainda não definida'}
                                </p>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* Coluna Direita */}
                <div className="space-y-4">
                    <Card className="border-0 shadow-md bg-white/90 backdrop-blur-sm">
                        <div className="absolute inset-0 bg-gradient-to-r from-purple-500/5 to-purple-600/5 rounded-lg" />
                        <CardHeader className="relative pb-3">
                            <CardTitle className="text-base font-semibold text-slate-900 flex items-center gap-2">
                                <AlertCircle className="w-4 h-4 text-purple-600" />
                                Status e Datas
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="relative space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">
                                    Status do Serviço
                                </label>
                                {isEditing ? (
                                    <Select
                                        value={formData.status}
                                        onValueChange={(value) => handleInputChange('status', value)}
                                    >
                                        <SelectTrigger className="border-slate-200 focus:border-purple-500">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {statusOptions.map((option) => (
                                                <SelectItem key={option.value} value={option.value}>
                                                    {option.label}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                ) : (
                                    <Badge className={getStatusConfig(service.status).color}>
                                        {getStatusConfig(service.status).label}
                                    </Badge>
                                )}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">
                                    Data de Previsão de Entrega
                                </label>
                                {isEditing ? (
                                    <Input
                                        type="date"
                                        value={formData.dataPrevisaoEntrega}
                                        onChange={(e) => handleInputChange('dataPrevisaoEntrega', e.target.value)}
                                        className="border-slate-200 focus:border-purple-500"
                                    />
                                ) : (
                                    <p className="text-slate-700 flex items-center gap-2">
                                        <Calendar className="w-4 h-4 text-slate-500" />
                                        {formatDate(service.dataPrevisaoEntrega)}
                                    </p>
                                )}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">
                                    KM de Entrada
                                </label>
                                {isEditing ? (
                                    <Input
                                        type="number"
                                        value={formData.kmEntrada}
                                        onChange={(e) => handleInputChange('kmEntrada', e.target.value)}
                                        placeholder="Ex: 50000"
                                        className="border-slate-200 focus:border-purple-500"
                                    />
                                ) : (
                                    <p className="text-slate-700">
                                        {service.kmEntrada ? `${service.kmEntrada.toLocaleString('pt-BR')} km` : 'Não informado'}
                                    </p>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-0 shadow-md bg-white/90 backdrop-blur-sm">
                        <div className="absolute inset-0 bg-gradient-to-r from-green-500/5 to-green-600/5 rounded-lg" />
                        <CardHeader className="relative pb-3">
                            <CardTitle className="text-base font-semibold text-slate-900 flex items-center gap-2">
                                <DollarSign className="w-4 h-4 text-green-600" />
                                Valores Financeiros
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="relative space-y-3">
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-medium text-slate-600 mb-1">
                                        Valor Estimado
                                    </label>
                                    {isEditing ? (
                                        <Input
                                            type="number"
                                            step="0.01"
                                            value={formData.valorTotalEstimado}
                                            onChange={(e) => handleInputChange('valorTotalEstimado', e.target.value)}
                                            className="text-sm border-slate-200 focus:border-green-500"
                                        />
                                    ) : (
                                        <p className="text-sm font-medium text-slate-700">
                                            {formatCurrency(service.valorTotalEstimado)}
                                        </p>
                                    )}
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-slate-600 mb-1">
                                        Valor Serviços
                                    </label>
                                    {isEditing ? (
                                        <Input
                                            type="number"
                                            step="0.01"
                                            value={formData.valorTotalServicos}
                                            onChange={(e) => handleInputChange('valorTotalServicos', e.target.value)}
                                            className="text-sm border-slate-200 focus:border-green-500"
                                        />
                                    ) : (
                                        <p className="text-sm font-medium text-slate-700">
                                            {formatCurrency(service.valorTotalServicos)}
                                        </p>
                                    )}
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-slate-600 mb-1">
                                    Valor Total Final
                                </label>
                                <p className="text-lg font-bold text-green-600">
                                    {formatCurrency(service.valorTotalFinal)}
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>

            {/* Observações */}
            <Card className="border-0 shadow-md bg-white/90 backdrop-blur-sm">
                <div className="absolute inset-0 bg-gradient-to-r from-amber-500/5 to-amber-600/5 rounded-lg" />
                <CardHeader className="relative pb-3">
                    <CardTitle className="text-base font-semibold text-slate-900 flex items-center gap-2">
                        <FileText className="w-4 h-4 text-amber-600" />
                        Observações Gerais
                    </CardTitle>
                </CardHeader>
                <CardContent className="relative">
                    {isEditing ? (
                        <Textarea
                            value={formData.observacoes}
                            onChange={(e) => handleInputChange('observacoes', e.target.value)}
                            placeholder="Adicione observações gerais sobre o serviço..."
                            className="min-h-[80px] border-slate-200 focus:border-amber-500"
                        />
                    ) : (
                        <p className="text-slate-700 leading-relaxed">
                            {service.observacoes || 'Nenhuma observação adicional'}
                        </p>
                    )}
                </CardContent>
            </Card>

            {/* Botão de Salvar (apenas quando editando e há mudanças) */}
            {isEditing && hasChanges && (
                <div className="flex justify-end">
                    <Button
                        onClick={handleSave}
                        disabled={saveStatus === 'saving'}
                        className="bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-2 disabled:opacity-50"
                    >
                        {saveStatus === 'saving' ? (
                            <>
                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                Salvando...
                            </>
                        ) : (
                            <>
                                <Save className="w-4 h-4" />
                                Salvar Alterações
                            </>
                        )}
                    </Button>
                </div>
            )}
        </div>
    );
}