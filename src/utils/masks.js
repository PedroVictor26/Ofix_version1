// Máscaras de entrada para inputs brasileiros
// Arquivo: src/utils/masks.js

import { useState } from 'react';

// Máscaras para react-input-mask
export const masks = {
  telefone: "(99) 99999-9999",     // Telefone/celular
  telefoneFixo: "(99) 9999-9999",  // Telefone fixo
  cpf: "999.999.999-99",           // CPF
  cnpj: "99.999.999/9999-99",      // CNPJ
  cep: "99999-999",                // CEP
  placaAntiga: "AAA-9999",         // Placa antiga
  placaMercosul: "AAA9A99",        // Placa Mercosul
  rg: "99.999.999-9",              // RG
  data: "99/99/9999",              // Data brasileira
  hora: "99:99",                   // Hora
  dinheiro: "R$ 999.999,99"        // Valor monetário
};

// Função para aplicar máscara dinamicamente
export const applyMask = (value, maskType) => {
  if (!value) return '';
  
  const cleanValue = value.replace(/[^\d]/g, '');
  
  switch (maskType) {
    case 'telefone':
      if (cleanValue.length <= 10) {
        return cleanValue.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
      }
      return cleanValue.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
      
    case 'cpf':
      return cleanValue.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
      
    case 'cnpj':
      return cleanValue.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
      
    case 'cep':
      return cleanValue.replace(/(\d{5})(\d{3})/, '$1-$2');
      
    case 'placa':
      if (cleanValue.length <= 7) {
        // Formato antigo: ABC1234
        return value.toUpperCase().replace(/([A-Z]{3})(\d{4})/, '$1-$2');
      }
      // Formato Mercosul: ABC1D23
      return value.toUpperCase().replace(/([A-Z]{3})(\d)([A-Z])(\d{2})/, '$1$2$3$4');
      
    case 'dinheiro': {
      const numberValue = parseFloat(cleanValue) / 100;
      return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL'
      }).format(numberValue);
    }
      
    default:
      return value;
  }
};

// Função para remover máscara e obter apenas números
export const removeMask = (value) => {
  if (!value) return '';
  return value.replace(/[^\d]/g, '');
};

// Função para remover máscara mas manter letras (para placas)
export const removeMaskKeepLetters = (value) => {
  if (!value) return '';
  return value.replace(/[^\w]/g, '').toUpperCase();
};

// Validador de formato durante digitação
export const isValidFormat = (value, maskType) => {
  const cleanValue = removeMask(value);
  
  switch (maskType) {
    case 'telefone':
      return cleanValue.length >= 10 && cleanValue.length <= 11;
    case 'cpf':
      return cleanValue.length === 11;
    case 'cnpj':
      return cleanValue.length === 14;
    case 'cep':
      return cleanValue.length === 8;
    case 'placa':
      return value.length >= 7 && value.length <= 8;
    default:
      return true;
  }
};

// Hook para facilitar o uso de máscaras
export const useMask = (initialValue = '', maskType) => {
  const [value, setValue] = useState(applyMask(initialValue, maskType));
  
  const handleChange = (newValue) => {
    const maskedValue = applyMask(newValue, maskType);
    setValue(maskedValue);
    return maskedValue;
  };
  
  const getRawValue = () => {
    if (maskType === 'placa') {
      return removeMaskKeepLetters(value);
    }
    return removeMask(value);
  };
  
  const isValid = () => {
    return isValidFormat(value, maskType);
  };
  
  return {
    value,
    setValue,
    handleChange,
    getRawValue,
    isValid
  };
};