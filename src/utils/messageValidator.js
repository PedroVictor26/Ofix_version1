/**
 * 🛡️ Validação e Sanitização de Mensagens
 * 
 * Previne XSS, valida tamanho e formato de mensagens
 */

import DOMPurify from 'dompurify';

export const MESSAGE_CONFIG = {
  MAX_LENGTH: 1000,
  MIN_LENGTH: 1,
  ALLOWED_CHARS_REGEX: /^[\p{L}\p{N}\p{P}\p{Z}\p{S}\n\r]+$/u
};

/**
 * Valida e sanitiza uma mensagem
 * @param {string} mensagem - Mensagem a ser validada
 * @returns {Object} - { valid, errors, sanitized, warnings }
 */
export const validarMensagem = (mensagem) => {
  const errors = [];
  const warnings = [];
  
  // Verificar se está vazia
  if (!mensagem || !mensagem.trim()) {
    errors.push('Mensagem não pode estar vazia');
    return { valid: false, errors, warnings, sanitized: '' };
  }
  
  // Verificar tamanho mínimo
  if (mensagem.trim().length < MESSAGE_CONFIG.MIN_LENGTH) {
    errors.push('Mensagem muito curta');
  }
  
  // Verificar tamanho máximo
  if (mensagem.length > MESSAGE_CONFIG.MAX_LENGTH) {
    errors.push(`Mensagem muito longa (máximo ${MESSAGE_CONFIG.MAX_LENGTH} caracteres)`);
  }
  
  // Avisar se mensagem está próxima do limite
  if (mensagem.length > MESSAGE_CONFIG.MAX_LENGTH * 0.9) {
    warnings.push(`Mensagem próxima do limite (${mensagem.length}/${MESSAGE_CONFIG.MAX_LENGTH})`);
  }
  
  // Sanitizar HTML/XSS
  const sanitized = DOMPurify.sanitize(mensagem, {
    ALLOWED_TAGS: [], // Não permitir nenhuma tag HTML
    ALLOWED_ATTR: [], // Não permitir nenhum atributo
    KEEP_CONTENT: true // Manter o conteúdo de texto
  });
  
  // Verificar se houve mudança após sanitização (possível tentativa de XSS)
  if (sanitized !== mensagem && mensagem.includes('<')) {
    warnings.push('Código HTML foi removido da mensagem');
  }
  
  // Detectar possíveis tentativas de SQL injection
  const sqlPatterns = [
    /(\bSELECT\b.*\bFROM\b)/i,
    /(\bINSERT\b.*\bINTO\b)/i,
    /(\bUPDATE\b.*\bSET\b)/i,
    /(\bDELETE\b.*\bFROM\b)/i,
    /(\bDROP\b.*\bTABLE\b)/i,
    /(--|\#|\/\*|\*\/)/
  ];
  
  for (const pattern of sqlPatterns) {
    if (pattern.test(mensagem)) {
      warnings.push('Mensagem contém padrões suspeitos');
      break;
    }
  }
  
  // Detectar URLs suspeitas
  const suspiciousUrlPatterns = [
    /javascript:/i,
    /data:text\/html/i,
    /vbscript:/i
  ];
  
  for (const pattern of suspiciousUrlPatterns) {
    if (pattern.test(mensagem)) {
      warnings.push('Mensagem contém URLs potencialmente perigosas');
      break;
    }
  }
  
  return {
    valid: errors.length === 0,
    errors,
    warnings,
    sanitized: sanitized.trim()
  };
};

/**
 * Valida tamanho de arquivo (para uploads futuros)
 */
export const validarArquivo = (file, maxSizeMB = 5) => {
  const errors = [];
  
  if (!file) {
    errors.push('Nenhum arquivo selecionado');
    return { valid: false, errors };
  }
  
  const maxSizeBytes = maxSizeMB * 1024 * 1024;
  if (file.size > maxSizeBytes) {
    errors.push(`Arquivo muito grande (máximo ${maxSizeMB}MB)`);
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
};

/**
 * Escapa caracteres especiais para prevenir injection
 */
export const escaparCaracteresEspeciais = (texto) => {
  return texto
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
};

export default {
  validarMensagem,
  validarArquivo,
  escaparCaracteresEspeciais,
  MESSAGE_CONFIG
};

/**
 * Valida formato de CPF
 */
export const validarCPF = (cpf) => {
  const cpfLimpo = cpf.replace(/[^\d]/g, '');
  
  if (cpfLimpo.length !== 11) {
    return { valid: false, error: 'CPF deve ter 11 dígitos' };
  }
  
  // Verificar se todos os dígitos são iguais
  if (/^(\d)\1{10}$/.test(cpfLimpo)) {
    return { valid: false, error: 'CPF inválido' };
  }
  
  // Validar dígitos verificadores
  let soma = 0;
  for (let i = 0; i < 9; i++) {
    soma += parseInt(cpfLimpo.charAt(i)) * (10 - i);
  }
  let resto = 11 - (soma % 11);
  let digito1 = resto >= 10 ? 0 : resto;
  
  if (digito1 !== parseInt(cpfLimpo.charAt(9))) {
    return { valid: false, error: 'CPF inválido' };
  }
  
  soma = 0;
  for (let i = 0; i < 10; i++) {
    soma += parseInt(cpfLimpo.charAt(i)) * (11 - i);
  }
  resto = 11 - (soma % 11);
  let digito2 = resto >= 10 ? 0 : resto;
  
  if (digito2 !== parseInt(cpfLimpo.charAt(10))) {
    return { valid: false, error: 'CPF inválido' };
  }
  
  return { valid: true, formatted: cpfLimpo.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4') };
};

/**
 * Valida formato de CNPJ
 */
export const validarCNPJ = (cnpj) => {
  const cnpjLimpo = cnpj.replace(/[^\d]/g, '');
  
  if (cnpjLimpo.length !== 14) {
    return { valid: false, error: 'CNPJ deve ter 14 dígitos' };
  }
  
  // Verificar se todos os dígitos são iguais
  if (/^(\d)\1{13}$/.test(cnpjLimpo)) {
    return { valid: false, error: 'CNPJ inválido' };
  }
  
  // Validar dígitos verificadores
  let tamanho = cnpjLimpo.length - 2;
  let numeros = cnpjLimpo.substring(0, tamanho);
  let digitos = cnpjLimpo.substring(tamanho);
  let soma = 0;
  let pos = tamanho - 7;
  
  for (let i = tamanho; i >= 1; i--) {
    soma += numeros.charAt(tamanho - i) * pos--;
    if (pos < 2) pos = 9;
  }
  
  let resultado = soma % 11 < 2 ? 0 : 11 - (soma % 11);
  if (resultado != digitos.charAt(0)) {
    return { valid: false, error: 'CNPJ inválido' };
  }
  
  tamanho = tamanho + 1;
  numeros = cnpjLimpo.substring(0, tamanho);
  soma = 0;
  pos = tamanho - 7;
  
  for (let i = tamanho; i >= 1; i--) {
    soma += numeros.charAt(tamanho - i) * pos--;
    if (pos < 2) pos = 9;
  }
  
  resultado = soma % 11 < 2 ? 0 : 11 - (soma % 11);
  if (resultado != digitos.charAt(1)) {
    return { valid: false, error: 'CNPJ inválido' };
  }
  
  return { 
    valid: true, 
    formatted: cnpjLimpo.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5') 
  };
};

/**
 * Valida formato de telefone brasileiro
 */
export const validarTelefone = (telefone) => {
  const telefoneLimpo = telefone.replace(/[^\d]/g, '');
  
  // Aceitar 10 ou 11 dígitos (com ou sem 9 no celular)
  if (telefoneLimpo.length < 10 || telefoneLimpo.length > 11) {
    return { valid: false, error: 'Telefone deve ter 10 ou 11 dígitos' };
  }
  
  // Verificar DDD válido (11-99)
  const ddd = parseInt(telefoneLimpo.substring(0, 2));
  if (ddd < 11 || ddd > 99) {
    return { valid: false, error: 'DDD inválido' };
  }
  
  let formatted;
  if (telefoneLimpo.length === 11) {
    formatted = telefoneLimpo.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
  } else {
    formatted = telefoneLimpo.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
  }
  
  return { valid: true, formatted };
};

/**
 * Valida formato de email
 */
export const validarEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  
  if (!emailRegex.test(email)) {
    return { valid: false, error: 'Email inválido' };
  }
  
  // Verificar domínios suspeitos
  const suspiciousDomains = ['tempmail', 'throwaway', 'guerrillamail'];
  const domain = email.split('@')[1]?.toLowerCase();
  
  if (suspiciousDomains.some(sus => domain?.includes(sus))) {
    return { 
      valid: true, 
      warning: 'Email temporário detectado',
      email: email.toLowerCase()
    };
  }
  
  return { valid: true, email: email.toLowerCase() };
};

/**
 * Valida formato de placa de veículo (Mercosul e antiga)
 */
export const validarPlaca = (placa) => {
  const placaLimpa = placa.replace(/[^\dA-Za-z]/g, '').toUpperCase();
  
  // Formato antigo: ABC1234
  const formatoAntigo = /^[A-Z]{3}\d{4}$/;
  // Formato Mercosul: ABC1D23
  const formatoMercosul = /^[A-Z]{3}\d[A-Z]\d{2}$/;
  
  if (!formatoAntigo.test(placaLimpa) && !formatoMercosul.test(placaLimpa)) {
    return { valid: false, error: 'Placa inválida' };
  }
  
  const formatted = placaLimpa.replace(/([A-Z]{3})(\d{1}[A-Z0-9]{3})/, '$1-$2');
  
  return { valid: true, formatted, tipo: formatoMercosul.test(placaLimpa) ? 'mercosul' : 'antiga' };
};
