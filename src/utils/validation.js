// Utilitários de validação para padrões brasileiros
// Arquivo: src/utils/validation.js

import { useState } from 'react';

// Regex patterns para validações brasileiras
export const patterns = {
  // Email padrão internacional
  email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  
  // Telefone brasileiro (com ou sem DDD)
  telefone: /^(\(?\d{2}\)?\s?)?\d{4,5}-?\d{4}$/,
  
  // Celular brasileiro (formato: (11) 99999-9999)
  celular: /^\(\d{2}\)\s\d{4,5}-\d{4}$/,
  
  // Placa antiga (ABC-1234)
  placaAntiga: /^[A-Z]{3}-\d{4}$/,
  
  // Placa Mercosul (ABC1D23)
  placaMercosul: /^[A-Z]{3}\d[A-Z]\d{2}$/,
  
  // CEP brasileiro (12345-678)
  cep: /^\d{5}-\d{3}$/,
  
  // CPF (123.456.789-01)
  cpf: /^\d{3}\.\d{3}\.\d{3}-\d{2}$/,
  
  // CNPJ (12.345.678/0001-90)
  cnpj: /^\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}$/
};

// Função para validar CPF
export const isValidCPF = (cpf) => {
  const cleanCPF = cpf.replace(/[^\d]/g, '');
  
  if (cleanCPF.length !== 11) return false;
  
  // Verifica se todos os dígitos são iguais
  if (/^(\d)\1{10}$/.test(cleanCPF)) return false;
  
  // Valida primeiro dígito verificador
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += parseInt(cleanCPF.charAt(i)) * (10 - i);
  }
  let remainder = 11 - (sum % 11);
  if (remainder === 10 || remainder === 11) remainder = 0;
  if (remainder !== parseInt(cleanCPF.charAt(9))) return false;
  
  // Valida segundo dígito verificador
  sum = 0;
  for (let i = 0; i < 10; i++) {
    sum += parseInt(cleanCPF.charAt(i)) * (11 - i);
  }
  remainder = 11 - (sum % 11);
  if (remainder === 10 || remainder === 11) remainder = 0;
  if (remainder !== parseInt(cleanCPF.charAt(10))) return false;
  
  return true;
};

// Função para validar CNPJ
export const isValidCNPJ = (cnpj) => {
  const cleanCNPJ = cnpj.replace(/[^\d]/g, '');
  
  if (cleanCNPJ.length !== 14) return false;
  
  // Verifica se todos os dígitos são iguais
  if (/^(\d)\1{13}$/.test(cleanCNPJ)) return false;
  
  // Valida primeiro dígito verificador
  let sum = 0;
  let weight = 2;
  for (let i = 11; i >= 0; i--) {
    sum += parseInt(cleanCNPJ.charAt(i)) * weight;
    weight = weight === 9 ? 2 : weight + 1;
  }
  let remainder = sum % 11;
  if (remainder < 2) remainder = 0;
  else remainder = 11 - remainder;
  if (remainder !== parseInt(cleanCNPJ.charAt(12))) return false;
  
  // Valida segundo dígito verificador
  sum = 0;
  weight = 2;
  for (let i = 12; i >= 0; i--) {
    sum += parseInt(cleanCNPJ.charAt(i)) * weight;
    weight = weight === 9 ? 2 : weight + 1;
  }
  remainder = sum % 11;
  if (remainder < 2) remainder = 0;
  else remainder = 11 - remainder;
  if (remainder !== parseInt(cleanCNPJ.charAt(13))) return false;
  
  return true;
};

// Função para validar placa (aceita ambos os formatos)
export const isValidPlaca = (placa) => {
  return patterns.placaAntiga.test(placa) || patterns.placaMercosul.test(placa);
};

// Função para validar email
export const isValidEmail = (email) => {
  if (!email) return false;
  return patterns.email.test(email.trim());
};

// Validações para formulários
export const validators = {
  // Nome obrigatório
  nome: (value) => {
    if (!value || value.trim().length < 2) {
      return 'Nome deve ter pelo menos 2 caracteres';
    }
    return null;
  },
  
  // Email obrigatório e válido
  email: (value) => {
    if (!value) return 'Email é obrigatório';
    if (!patterns.email.test(value)) {
      return 'Email inválido';
    }
    return null;
  },
  
  // Email opcional mas válido se preenchido
  emailOptional: (value) => {
    if (value && !patterns.email.test(value)) {
      return 'Email inválido';
    }
    return null;
  },
  
  // Telefone brasileiro
  telefone: (value) => {
    if (!value) return 'Telefone é obrigatório';
    const clean = value.replace(/[^\d]/g, '');
    if (clean.length < 10 || clean.length > 11) {
      return 'Telefone deve ter 10 ou 11 dígitos';
    }
    return null;
  },
  
  // CPF válido
  cpf: (value) => {
    if (!value) return 'CPF é obrigatório';
    if (!isValidCPF(value)) {
      return 'CPF inválido';
    }
    return null;
  },
  
  // CNPJ válido
  cnpj: (value) => {
    if (!value) return 'CNPJ é obrigatório';
    if (!isValidCNPJ(value)) {
      return 'CNPJ inválido';
    }
    return null;
  },
  
  // Placa de veículo
  placa: (value) => {
    if (!value) return 'Placa é obrigatória';
    if (!isValidPlaca(value)) {
      return 'Placa inválida (use ABC-1234 ou ABC1D23)';
    }
    return null;
  },
  
  // CEP brasileiro
  cep: (value) => {
    if (!value) return 'CEP é obrigatório';
    if (!patterns.cep.test(value)) {
      return 'CEP inválido (use 12345-678)';
    }
    return null;
  }
};

// Hook personalizado para validação de formulários
export const useFormValidation = () => {
  const [errors, setErrors] = useState({});
  
  const validateField = (fieldName, value, validator) => {
    const error = validator(value);
    setErrors(prev => ({
      ...prev,
      [fieldName]: error
    }));
    return !error;
  };
  
  const validateForm = (data, validationRules) => {
    const newErrors = {};
    let isValid = true;
    
    Object.keys(validationRules).forEach(field => {
      const error = validationRules[field](data[field]);
      if (error) {
        newErrors[field] = error;
        isValid = false;
      }
    });
    
    setErrors(newErrors);
    return isValid;
  };
  
  const clearErrors = () => setErrors({});
  
  const clearFieldError = (fieldName) => {
    setErrors(prev => ({
      ...prev,
      [fieldName]: null
    }));
  };
  
  return {
    errors,
    validateField,
    validateForm,
    clearErrors,
    clearFieldError
  };
};