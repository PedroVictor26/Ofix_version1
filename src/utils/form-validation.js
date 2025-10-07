import { useState } from 'react';

// Utilitário para validação de formulários modernos
export const validationRules = {
    required: (value, fieldName = 'Campo') => {
        if (!value || (typeof value === 'string' && !value.trim())) {
            return `${fieldName} é obrigatório`;
        }
        return null;
    },

    email: (value) => {
        if (!value) return null;
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(value) ? null : 'Email inválido';
    },

    phone: (value) => {
        if (!value) return null;
        const phoneRegex = /^\(\d{2}\)\s\d{4,5}-\d{4}$/;
        return phoneRegex.test(value) ? null : 'Telefone inválido. Use o formato: (xx) xxxxx-xxxx';
    },

    cpf: (value) => {
        if (!value) return null;
        const cpfRegex = /^\d{3}\.\d{3}\.\d{3}-\d{2}$/;
        if (!cpfRegex.test(value)) {
            return 'CPF inválido. Use o formato: xxx.xxx.xxx-xx';
        }
        
        // Validação algoritmo CPF
        const cleanCpf = value.replace(/\D/g, '');
        if (cleanCpf.length !== 11 || /^(\d)\1{10}$/.test(cleanCpf)) {
            return 'CPF inválido';
        }
        
        let sum = 0;
        for (let i = 0; i < 9; i++) {
            sum += parseInt(cleanCpf.charAt(i)) * (10 - i);
        }
        let remainder = 11 - (sum % 11);
        if (remainder === 10 || remainder === 11) remainder = 0;
        if (remainder !== parseInt(cleanCpf.charAt(9))) return 'CPF inválido';
        
        sum = 0;
        for (let i = 0; i < 10; i++) {
            sum += parseInt(cleanCpf.charAt(i)) * (11 - i);
        }
        remainder = 11 - (sum % 11);
        if (remainder === 10 || remainder === 11) remainder = 0;
        if (remainder !== parseInt(cleanCpf.charAt(10))) return 'CPF inválido';
        
        return null;
    },

    cnpj: (value) => {
        if (!value) return null;
        const cnpjRegex = /^\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}$/;
        return cnpjRegex.test(value) ? null : 'CNPJ inválido. Use o formato: xx.xxx.xxx/xxxx-xx';
    },

    cep: (value) => {
        if (!value) return null;
        const cepRegex = /^\d{5}-\d{3}$/;
        return cepRegex.test(value) ? null : 'CEP inválido. Use o formato: xxxxx-xxx';
    },

    minLength: (min) => (value, fieldName = 'Campo') => {
        if (!value) return null;
        return value.length >= min ? null : `${fieldName} deve ter pelo menos ${min} caracteres`;
    },

    maxLength: (max) => (value, fieldName = 'Campo') => {
        if (!value) return null;
        return value.length <= max ? null : `${fieldName} deve ter no máximo ${max} caracteres`;
    },

    numeric: (value, fieldName = 'Campo') => {
        if (!value) return null;
        const numericRegex = /^\d+(\.\d+)?$/;
        return numericRegex.test(value) ? null : `${fieldName} deve ser um número válido`;
    },

    positiveNumber: (value, fieldName = 'Valor') => {
        if (!value) return null;
        const num = parseFloat(value);
        return !isNaN(num) && num > 0 ? null : `${fieldName} deve ser um número positivo`;
    },

    vehiclePlate: (value) => {
        if (!value) return null;
        const plateRegex = /^[A-Z]{3}-\d{4}$|^[A-Z]{3}\d[A-Z]\d{2}$/;
        return plateRegex.test(value.toUpperCase()) ? null : 'Placa inválida. Use formato ABC-1234 ou ABC1D23';
    }
};

// Função para aplicar múltiplas validações
export const validateField = (value, rules = [], fieldName = 'Campo') => {
    for (const rule of rules) {
        const error = typeof rule === 'function' ? rule(value, fieldName) : rule;
        if (error) return error;
    }
    return null;
};

// Função para validar formulário completo
export const validateForm = (formData, validationSchema) => {
    const errors = {};
    let isValid = true;

    Object.keys(validationSchema).forEach(fieldName => {
        const { rules, label } = validationSchema[fieldName];
        const value = formData[fieldName];
        const error = validateField(value, rules, label || fieldName);
        
        if (error) {
            errors[fieldName] = error;
            isValid = false;
        }
    });

    return { isValid, errors };
};

// Máscaras de input
export const inputMasks = {
    phone: (value) => {
        return value
            .replace(/\D/g, '')
            .replace(/(\d{2})(\d)/, '($1) $2')
            .replace(/(\d{4})(\d)/, '$1-$2')
            .replace(/(\d{4})-(\d)(\d{4})/, '$1$2-$3')
            .replace(/(-\d{4})\d+?$/, '$1');
    },

    cpf: (value) => {
        return value
            .replace(/\D/g, '')
            .replace(/(\d{3})(\d)/, '$1.$2')
            .replace(/(\d{3})(\d)/, '$1.$2')
            .replace(/(\d{3})(\d{1,2})/, '$1-$2')
            .replace(/(-\d{2})\d+?$/, '$1');
    },

    cnpj: (value) => {
        return value
            .replace(/\D/g, '')
            .replace(/(\d{2})(\d)/, '$1.$2')
            .replace(/(\d{3})(\d)/, '$1.$2')
            .replace(/(\d{3})(\d)/, '$1/$2')
            .replace(/(\d{4})(\d)/, '$1-$2')
            .replace(/(-\d{2})\d+?$/, '$1');
    },

    cep: (value) => {
        return value
            .replace(/\D/g, '')
            .replace(/(\d{5})(\d)/, '$1-$2')
            .replace(/(-\d{3})\d+?$/, '$1');
    },

    currency: (value) => {
        const numericValue = value.replace(/\D/g, '');
        const formattedValue = (parseInt(numericValue || '0') / 100).toFixed(2);
        return formattedValue.replace('.', ',').replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    },

    vehiclePlate: (value) => {
        return value
            .toUpperCase()
            .replace(/[^A-Z0-9]/g, '')
            .replace(/([A-Z]{3})(\d{1})/, '$1-$2')
            .replace(/([A-Z]{3}-\d{4})\w+/, '$1');
    }
};

// Hook personalizado para validação em tempo real
export const useFormValidation = (initialData = {}, validationSchema = {}) => {
    const [formData, setFormData] = useState(initialData);
    const [errors, setErrors] = useState({});
    const [touched, setTouched] = useState({});

    const validateSingleField = (fieldName, value) => {
        if (!validationSchema[fieldName]) return null;
        
        const { rules, label } = validationSchema[fieldName];
        return validateField(value, rules, label || fieldName);
    };

    const handleInputChange = (fieldName, value, mask = null) => {
        const maskedValue = mask ? mask(value) : value;
        
        setFormData(prev => ({
            ...prev,
            [fieldName]: maskedValue
        }));

        // Validação em tempo real apenas para campos já tocados
        if (touched[fieldName]) {
            const error = validateSingleField(fieldName, maskedValue);
            setErrors(prev => ({
                ...prev,
                [fieldName]: error
            }));
        }
    };

    const handleBlur = (fieldName) => {
        setTouched(prev => ({
            ...prev,
            [fieldName]: true
        }));

        const error = validateSingleField(fieldName, formData[fieldName]);
        setErrors(prev => ({
            ...prev,
            [fieldName]: error
        }));
    };

    const validateForm = () => {
        const newErrors = {};
        let isValid = true;

        Object.keys(validationSchema).forEach(fieldName => {
            const error = validateSingleField(fieldName, formData[fieldName]);
            if (error) {
                newErrors[fieldName] = error;
                isValid = false;
            }
        });

        setErrors(newErrors);
        setTouched(Object.keys(validationSchema).reduce((acc, key) => {
            acc[key] = true;
            return acc;
        }, {}));

        return isValid;
    };

    const resetForm = () => {
        setFormData(initialData);
        setErrors({});
        setTouched({});
    };

    return {
        formData,
        errors,
        touched,
        handleInputChange,
        handleBlur,
        validateForm,
        resetForm,
        setFormData
    };
};

export default {
    validationRules,
    validateField,
    validateForm,
    inputMasks,
    useFormValidation
};
