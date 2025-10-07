import { useState, useEffect, useRef } from 'react';
import { toast } from 'react-hot-toast';
import { Save, AlertTriangle, CheckCircle } from 'lucide-react';

export function useAutoSave(
    data, 
    saveFunction, 
    options = {
        delay: 2000,
        enabled: true,
        validationFunction: null
    }
) {
    const [saveStatus, setSaveStatus] = useState('idle'); // idle, saving, saved, error
    const [validationErrors, setValidationErrors] = useState([]);
    const timeoutRef = useRef(null);
    const previousDataRef = useRef(data);

    useEffect(() => {
        if (!options.enabled) return;

        // Verifica se os dados mudaram
        const hasChanged = JSON.stringify(data) !== JSON.stringify(previousDataRef.current);
        
        if (hasChanged && data) {
            // Cancela save anterior se existir
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }

            // Executa validação se fornecida
            if (options.validationFunction) {
                const errors = options.validationFunction(data);
                setValidationErrors(errors);
                
                // Não salva se houver erros críticos
                if (errors.some(error => error.critical)) {
                    setSaveStatus('error');
                    return;
                }
            }

            setSaveStatus('pending');

            // Agenda o save
            timeoutRef.current = setTimeout(async () => {
                try {
                    setSaveStatus('saving');
                    await saveFunction(data);
                    setSaveStatus('saved');
                    previousDataRef.current = data;
                    
                    // Limpa o status após um tempo
                    setTimeout(() => setSaveStatus('idle'), 2000);
                } catch (error) {
                    setSaveStatus('error');
                    console.error('Erro no auto-save:', error);
                    toast.error('Erro ao salvar automaticamente');
                }
            }, options.delay);
        }

        return () => {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }
        };
    }, [data, saveFunction, options]);

    // Força um save imediato
    const forceSave = async () => {
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
        }

        try {
            setSaveStatus('saving');
            await saveFunction(data);
            setSaveStatus('saved');
            previousDataRef.current = data;
            setTimeout(() => setSaveStatus('idle'), 2000);
        } catch (error) {
            setSaveStatus('error');
            throw error;
        }
    };

    return {
        saveStatus,
        validationErrors,
        forceSave
    };
}

// Componente visual para mostrar o status do auto-save
export function AutoSaveIndicator({ saveStatus, validationErrors, onForceSave }) {
    const getStatusIcon = () => {
        switch (saveStatus) {
            case 'saving':
                return <Save className="w-4 h-4 animate-spin text-blue-500" />;
            case 'saved':
                return <CheckCircle className="w-4 h-4 text-green-500" />;
            case 'error':
                return <AlertTriangle className="w-4 h-4 text-red-500" />;
            default:
                return null;
        }
    };

    const getStatusText = () => {
        switch (saveStatus) {
            case 'pending':
                return 'Pendente...';
            case 'saving':
                return 'Salvando...';
            case 'saved':
                return 'Salvo';
            case 'error':
                return 'Erro ao salvar';
            default:
                return '';
        }
    };

    const getStatusColor = () => {
        switch (saveStatus) {
            case 'saving':
                return 'text-blue-600 bg-blue-50 border-blue-200';
            case 'saved':
                return 'text-green-600 bg-green-50 border-green-200';
            case 'error':
                return 'text-red-600 bg-red-50 border-red-200';
            default:
                return 'text-gray-600 bg-gray-50 border-gray-200';
        }
    };

    if (saveStatus === 'idle') return null;

    return (
        <div className="fixed bottom-4 right-4 z-50">
            <div className={`flex items-center gap-2 px-3 py-2 rounded-lg border shadow-lg backdrop-blur-sm ${getStatusColor()}`}>
                {getStatusIcon()}
                <span className="text-sm font-medium">
                    {getStatusText()}
                </span>
                
                {saveStatus === 'error' && onForceSave && (
                    <button
                        onClick={onForceSave}
                        className="ml-2 text-xs bg-red-600 text-white px-2 py-1 rounded hover:bg-red-700 transition-colors"
                    >
                        Tentar novamente
                    </button>
                )}
            </div>

            {/* Mostrar erros de validação */}
            {validationErrors.length > 0 && (
                <div className="mt-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg shadow-lg">
                    <div className="flex items-center gap-2 mb-2">
                        <AlertTriangle className="w-4 h-4 text-yellow-600" />
                        <span className="text-sm font-medium text-yellow-800">
                            Avisos de Validação
                        </span>
                    </div>
                    <ul className="text-xs text-yellow-700 space-y-1">
                        {validationErrors.map((error, index) => (
                            <li key={index} className="flex items-start gap-1">
                                <span className="w-1 h-1 bg-yellow-600 rounded-full mt-1.5 flex-shrink-0" />
                                {error.message}
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
}

// Funções de validação para diferentes tipos de dados
export const validationRules = {
    service: (service) => {
        const errors = [];

        // Validações críticas (impedem o save)
        if (!service.descricaoProblema?.trim()) {
            errors.push({
                field: 'descricaoProblema',
                message: 'Descrição do problema é obrigatória',
                critical: true
            });
        }

        if (!service.clienteId) {
            errors.push({
                field: 'clienteId',
                message: 'Cliente deve ser selecionado',
                critical: true
            });
        }

        // Validações de aviso (não impedem o save)
        if (service.valorTotalFinal <= 0) {
            errors.push({
                field: 'valorTotalFinal',
                message: 'Valor total deve ser maior que zero',
                critical: false
            });
        }

        // Validar consistência financeira
        const valorCalculado = (Number(service.valorTotalServicos) || 0) + (Number(service.valorTotalPecas) || 0);
        const valorFinal = Number(service.valorTotalFinal) || 0;
        
        if (Math.abs(valorCalculado - valorFinal) > 0.01) {
            errors.push({
                field: 'valores',
                message: 'Valores financeiros inconsistentes - serão recalculados automaticamente',
                critical: false
            });
        }

        // Validar procedimentos concluídos quando status é FINALIZADO
        if (service.status === 'FINALIZADO' && service.procedimentos?.some(proc => !proc.concluido)) {
            errors.push({
                field: 'procedimentos',
                message: 'Existem procedimentos não concluídos para um serviço finalizado',
                critical: false
            });
        }

        return errors;
    },

    procedure: (procedure) => {
        const errors = [];

        if (!procedure.descricao?.trim()) {
            errors.push({
                field: 'descricao',
                message: 'Descrição do procedimento é obrigatória',
                critical: true
            });
        }

        if (procedure.valorCobrado < 0) {
            errors.push({
                field: 'valorCobrado',
                message: 'Valor não pode ser negativo',
                critical: true
            });
        }

        return errors;
    },

    part: (part) => {
        const errors = [];

        if (!part.pecaId) {
            errors.push({
                field: 'pecaId',
                message: 'Peça deve ser selecionada',
                critical: true
            });
        }

        if (part.quantidade <= 0) {
            errors.push({
                field: 'quantidade',
                message: 'Quantidade deve ser maior que zero',
                critical: true
            });
        }

        if (part.precoUnitarioCobrado <= 0) {
            errors.push({
                field: 'precoUnitarioCobrado',
                message: 'Preço unitário deve ser maior que zero',
                critical: false
            });
        }

        // Verificar estoque disponível
        if (part.peca && part.quantidade > part.peca.estoqueAtual) {
            errors.push({
                field: 'estoque',
                message: `Quantidade maior que estoque disponível (${part.peca.estoqueAtual})`,
                critical: false
            });
        }

        return errors;
    }
};

// Hook para feedback visual de ações
export function useActionFeedback() {
    const [feedback, setFeedback] = useState(null);

    const showFeedback = (type, message, duration = 3000) => {
        setFeedback({ type, message });
        setTimeout(() => setFeedback(null), duration);
    };

    const showSuccess = (message) => showFeedback('success', message);
    const showError = (message) => showFeedback('error', message);
    const showWarning = (message) => showFeedback('warning', message);
    const showInfo = (message) => showFeedback('info', message);

    return {
        feedback,
        showSuccess,
        showError,
        showWarning,
        showInfo,
        clearFeedback: () => setFeedback(null)
    };
}

export default {
    useAutoSave,
    AutoSaveIndicator,
    validationRules,
    useActionFeedback
};
