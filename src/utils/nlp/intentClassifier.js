/**
 * 🧠 Classificador de Intenções (NLP)
 * 
 * Identifica a intenção do usuário baseado em padrões de texto
 */

import logger from '../logger.js';

// Padrões para cada tipo de intenção
const INTENT_PATTERNS = {
  consulta_preco: {
    keywords: [
      'quanto custa', 'qual o valor', 'qual valor', 'preço', 'valor de', 'valor da',
      'quanto é', 'quanto fica', 'quanto sai', 'custo', 'cobram', 'cobra',
      'preço de', 'preço da', 'quanto pago', 'quanto vou pagar', 'valor do serviço',
      'quanto custa a', 'quanto custa o', 'quanto custa uma', 'quanto custa um',
      'qual é o preço', 'qual é o valor', 'me diz o preço', 'me diz o valor'
    ],
    weight: 1.2
  },
  agendamento: {
    keywords: [
      'agendar', 'marcar', 'reservar', 'agendar para', 'marcar para', 
      'quero agendar', 'gostaria de agendar', 'preciso agendar',
      'fazer agendamento', 'criar agendamento', 'novo agendamento',
      'marcar horário', 'reservar horário', 'disponibilidade para'
    ],
    weight: 1.0
  },
  consulta_cliente: {
    keywords: [
      'buscar cliente', 'dados do cliente', 'informações do cliente', 
      'cliente', 'cadastro', 'procurar cliente', 'encontrar cliente',
      'ver cliente', 'consultar cliente', 'informações de', 'dados de'
    ],
    weight: 0.8
  },
  consulta_estoque: {
    keywords: [
      'tem em estoque', 'disponibilidade', 'tem', 'estoque', 'peça disponível',
      'tem peça', 'tem produto', 'disponível', 'em estoque', 'verificar estoque',
      'consultar estoque', 'checar estoque', 'ver estoque'
    ],
    weight: 0.9
  },
  consulta_os: {
    keywords: [
      'status da os', 'andamento', 'ordem de serviço', 'os número', 'como está',
      'status do serviço', 'situação da os', 'acompanhar os', 'ver os',
      'consultar os', 'número da os', 'os', 'ordem'
    ],
    weight: 0.9
  },
  saudacao: {
    keywords: [
      'oi', 'olá', 'ola', 'bom dia', 'boa tarde', 'boa noite', 'hey', 'ola',
      'e aí', 'e ai', 'opa', 'salve', 'fala'
    ],
    weight: 0.7
  },
  ajuda: {
    keywords: [
      'ajuda', 'help', 'o que você faz', 'como funciona', 'comandos',
      'o que pode fazer', 'quais comandos', 'me ajuda', 'preciso de ajuda',
      'não sei', 'nao sei', 'como usar'
    ],
    weight: 0.8
  }
};

/**
 * Classifica a intenção de uma mensagem
 * @param {string} mensagem - Mensagem do usuário
 * @returns {Object} - { intencao, confianca, alternativas }
 */
export const classifyIntent = (mensagem) => {
  if (!mensagem || typeof mensagem !== 'string') {
    logger.warn('Mensagem inválida para classificação de intenção');
    return {
      intencao: 'desconhecida',
      confianca: 0,
      alternativas: []
    };
  }

  const mensagemLower = mensagem.toLowerCase().trim();
  const scores = {};

  // Calcular score para cada intenção
  Object.entries(INTENT_PATTERNS).forEach(([intencao, config]) => {
    let score = 0;
    let matchCount = 0;

    config.keywords.forEach(keyword => {
      if (mensagemLower.includes(keyword.toLowerCase())) {
        score += config.weight;
        matchCount++;
      }
    });

    // Normalizar score baseado no número de matches
    if (matchCount > 0) {
      scores[intencao] = {
        score: score / config.keywords.length,
        matchCount
      };
    }
  });

  // Ordenar por score
  const sortedIntents = Object.entries(scores)
    .sort((a, b) => b[1].score - a[1].score)
    .map(([intencao, data]) => ({
      intencao,
      confianca: Math.min(data.score * data.matchCount, 1.0)
    }));

  // Resultado principal
  const resultado = sortedIntents.length > 0
    ? sortedIntents[0]
    : { intencao: 'desconhecida', confianca: 0 };

  // Alternativas (outras intenções possíveis)
  const alternativas = sortedIntents.slice(1, 3);

  logger.debug('Intenção classificada', {
    mensagem: mensagem.substring(0, 50),
    intencao: resultado.intencao,
    confianca: resultado.confianca,
    alternativasCount: alternativas.length
  });

  return {
    ...resultado,
    alternativas
  };
};

/**
 * Verifica se a mensagem tem múltiplas intenções
 * @param {string} mensagem - Mensagem do usuário
 * @returns {Array} - Lista de intenções detectadas
 */
export const detectMultipleIntents = (mensagem) => {
  const classification = classifyIntent(mensagem);
  
  const intencoes = [
    {
      intencao: classification.intencao,
      confianca: classification.confianca
    },
    ...classification.alternativas
  ].filter(i => i.confianca > 0.3); // Apenas intenções com confiança > 30%

  return intencoes;
};

/**
 * Adiciona novos padrões para uma intenção
 * @param {string} intencao - Nome da intenção
 * @param {Array<string>} keywords - Novas palavras-chave
 */
export const addIntentPatterns = (intencao, keywords) => {
  if (!INTENT_PATTERNS[intencao]) {
    INTENT_PATTERNS[intencao] = {
      keywords: [],
      weight: 1.0
    };
  }

  INTENT_PATTERNS[intencao].keywords.push(...keywords);
  
  logger.info('Novos padrões adicionados', {
    intencao,
    keywordsCount: keywords.length
  });
};

export default {
  classifyIntent,
  detectMultipleIntents,
  addIntentPatterns
};
