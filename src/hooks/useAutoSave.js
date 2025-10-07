import { useState, useEffect, useRef } from 'react';
import { toast } from 'react-hot-toast';

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
    validationRules,
    useActionFeedback
};
