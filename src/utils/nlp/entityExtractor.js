/**
 * 🔍 Extrator de Entidades (NLP)
 * 
 * Extrai informações estruturadas de mensagens de texto
 */

import logger from '../logger.js';

// Padrões regex para extração
const PATTERNS = {
  // Serviços automotivos comuns
  servico: [
    /troca de (?:óleo|oleo|filtro|pastilha|disco|correia|vela|bateria|pneu)/i,
    /revis[ãa]o(?: completa| preventiva| de \d+\.?\d* mil)?/i,
    /alinhamento(?: e balanceamento)?/i,
    /balanceamento(?: e alinhamento)?/i,
    /(?:troca|reparo|manutenção) (?:de |do |da )?freio/i,
    /(?:troca|reparo|manutenção) (?:de |da )?suspens[ãa]o/i,
    /(?:troca|reparo|manutenção) (?:de |da )?embreagem/i,
    /(?:troca|reparo|manutenção) (?:de |da )?bateria/i,
    /(?:troca|reparo|manutenção) (?:de )?pneu/i,
    /(?:troca|limpeza) (?:de |do )?filtro/i,
    /diagn[óo]stico/i,
    /scanner/i,
    /geometria/i,
    /cambagem/i,
    /caster/i,
    /ar condicionado/i,
    /higieniza[çc][ãa]o/i,
    /polimento/i,
    /cristaliza[çc][ãa]o/i
  ],

  // Placas de veículos (formato antigo e Mercosul)
  placa: [
    /\b[A-Z]{3}-?\d{4}\b/i,
    /\b[A-Z]{3}\d[A-Z]\d{2}\b/i
  ],

  // CPF
  cpf: [
    /\b\d{3}\.?\d{3}\.?\d{3}-?\d{2}\b/
  ],

  // Telefone
  telefone: [
    /\(?\d{2}\)?\s?9?\d{4}-?\d{4}/,
    /\b\d{10,11}\b/
  ],

  // Número de OS
  numeroOS: [
    /\bOS\s*#?\s*(\d+)\b/i,
    /\bordem\s+(?:de\s+)?servi[çc]o\s+#?\s*(\d+)\b/i,
    /\bn[úu]mero\s+(\d+)\b/i
  ],

  // Datas relativas
  dataRelativa: [
    /\b(hoje|amanhã|amanh[ãa])\b/i,
    /\b(segunda|terça|terca|quarta|quinta|sexta|s[áa]bado|sabado|domingo)(?:-feira)?\b/i,
    /\b(próxima|proxima)\s+(segunda|terça|terca|quarta|quinta|sexta)\b/i
  ],

  // Horários
  horario: [
    /\b(\d{1,2}):?(\d{2})?\s*(h|hs|horas?)?\b/i,
    /\b(\d{1,2})\s*(?:da\s+)?(manh[ãa]|tarde|noite)\b/i
  ],

  // Nomes de pessoas (padrão simples)
  nome: [
    /\b([A-ZÀÁÂÃÄÅÇÈÉÊËÌÍÎÏÑÒÓÔÕÖÙÚÛÜ][a-zàáâãäåçèéêëìíîïñòóôõöùúûü]+(?:\s+[A-ZÀÁÂÃÄÅÇÈÉÊËÌÍÎÏÑÒÓÔÕÖÙÚÛÜ][a-zàáâãäåçèéêëìíîïñòóôõöùúûü]+)+)\b/
  ],

  // Modelos de veículos comuns
  veiculo: [
    /\b(gol|palio|uno|corsa|celta|fox|ka|fiesta|civic|corolla|onix|hb20|kwid|mobi|sandero|logan|duster|kicks|compass|renegade|toro|hilux|ranger|s10|amarok)\b/i
  ]
};

/**
 * Extrai entidades de uma mensagem
 * @param {string} mensagem - Mensagem do usuário
 * @returns {Object} - Entidades extraídas
 */
export const extractEntities = (mensagem) => {
  if (!mensagem || typeof mensagem !== 'string') {
    logger.warn('Mensagem inválida para extração de entidades');
    return {};
  }

  const entidades = {};

  // Extrair cada tipo de entidade
  Object.entries(PATTERNS).forEach(([tipo, patterns]) => {
    const matches = [];

    patterns.forEach(pattern => {
      const match = mensagem.match(pattern);
      if (match) {
        // Pegar o grupo capturado ou o match completo
        const valor = match[1] || match[0];
        if (valor && !matches.includes(valor.trim())) {
          matches.push(valor.trim());
        }
      }
    });

    if (matches.length > 0) {
      entidades[tipo] = matches.length === 1 ? matches[0] : matches;
    }
  });

  logger.debug('Entidades extraídas', {
    mensagem: mensagem.substring(0, 50),
    entidadesCount: Object.keys(entidades).length,
    tipos: Object.keys(entidades)
  });

  return entidades;
};

/**
 * Extrai período temporal de uma mensagem
 * @param {string} mensagem - Mensagem do usuário
 * @returns {Object|null} - { inicio, fim } ou null
 */
export const extractPeriodo = (mensagem) => {
  const hoje = new Date();
  const mensagemLower = mensagem.toLowerCase();

  // Hoje
  if (mensagemLower.includes('hoje')) {
    return {
      inicio: new Date(hoje.setHours(0, 0, 0, 0)),
      fim: new Date(hoje.setHours(23, 59, 59, 999))
    };
  }

  // Amanhã
  if (mensagemLower.includes('amanhã') || mensagemLower.includes('amanha')) {
    const amanha = new Date(hoje);
    amanha.setDate(amanha.getDate() + 1);
    return {
      inicio: new Date(amanha.setHours(0, 0, 0, 0)),
      fim: new Date(amanha.setHours(23, 59, 59, 999))
    };
  }

  // Esta semana
  if (mensagemLower.includes('esta semana') || mensagemLower.includes('essa semana')) {
    const inicioSemana = new Date(hoje);
    inicioSemana.setDate(hoje.getDate() - hoje.getDay());
    const fimSemana = new Date(inicioSemana);
    fimSemana.setDate(inicioSemana.getDate() + 6);
    
    return {
      inicio: new Date(inicioSemana.setHours(0, 0, 0, 0)),
      fim: new Date(fimSemana.setHours(23, 59, 59, 999))
    };
  }

  // Próxima semana
  if (mensagemLower.includes('próxima semana') || mensagemLower.includes('proxima semana')) {
    const proximaSemana = new Date(hoje);
    proximaSemana.setDate(hoje.getDate() + (7 - hoje.getDay()));
    const fimProximaSemana = new Date(proximaSemana);
    fimProximaSemana.setDate(proximaSemana.getDate() + 6);
    
    return {
      inicio: new Date(proximaSemana.setHours(0, 0, 0, 0)),
      fim: new Date(fimProximaSemana.setHours(23, 59, 59, 999))
    };
  }

  return null;
};

/**
 * Normaliza entidades extraídas
 * @param {Object} entidades - Entidades brutas
 * @returns {Object} - Entidades normalizadas
 */
export const normalizeEntities = (entidades) => {
  const normalized = { ...entidades };

  // Normalizar telefone
  if (normalized.telefone) {
    normalized.telefone = normalized.telefone.replace(/\D/g, '');
  }

  // Normalizar CPF
  if (normalized.cpf) {
    normalized.cpf = normalized.cpf.replace(/\D/g, '');
  }

  // Normalizar placa
  if (normalized.placa) {
    normalized.placa = normalized.placa.toUpperCase().replace('-', '');
  }

  // Normalizar serviço
  if (normalized.servico) {
    normalized.servico = normalized.servico.toLowerCase();
  }

  // Normalizar veículo
  if (normalized.veiculo) {
    normalized.veiculo = normalized.veiculo.charAt(0).toUpperCase() + 
                         normalized.veiculo.slice(1).toLowerCase();
  }

  return normalized;
};

/**
 * Valida entidades extraídas
 * @param {Object} entidades - Entidades a validar
 * @returns {Object} - { valid, errors }
 */
export const validateEntities = (entidades) => {
  const errors = [];

  // Validar CPF
  if (entidades.cpf) {
    const cpfLimpo = entidades.cpf.replace(/\D/g, '');
    if (cpfLimpo.length !== 11) {
      errors.push('CPF deve ter 11 dígitos');
    }
  }

  // Validar telefone
  if (entidades.telefone) {
    const telLimpo = entidades.telefone.replace(/\D/g, '');
    if (telLimpo.length < 10 || telLimpo.length > 11) {
      errors.push('Telefone deve ter 10 ou 11 dígitos');
    }
  }

  // Validar placa
  if (entidades.placa) {
    const placaLimpa = entidades.placa.replace(/[^A-Z0-9]/gi, '');
    if (placaLimpa.length !== 7) {
      errors.push('Placa deve ter 7 caracteres');
    }
  }

  return {
    valid: errors.length === 0,
    errors
  };
};

export default {
  extractEntities,
  extractPeriodo,
  normalizeEntities,
  validateEntities
};
