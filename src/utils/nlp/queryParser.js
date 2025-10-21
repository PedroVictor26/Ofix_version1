/**
 * 🎯 Query Parser (NLP)
 * 
 * Combina classificação de intenção e extração de entidades
 * para processar consultas do usuário
 */

import { classifyIntent } from './intentClassifier.js';
import { extractEntities, extractPeriodo, normalizeEntities } from './entityExtractor.js';
import logger from '../logger.js';

/**
 * Processa uma query completa do usuário
 * @param {string} mensagem - Mensagem do usuário
 * @returns {Object} - Query processada
 */
export const parseQuery = (mensagem) => {
  if (!mensagem || typeof mensagem !== 'string') {
    logger.warn('Mensagem inválida para parsing');
    return {
      intencao: 'desconhecida',
      confianca: 0,
      entidades: {},
      periodo: null,
      mensagemOriginal: mensagem
    };
  }

  // Classificar intenção
  const { intencao, confianca, alternativas } = classifyIntent(mensagem);

  // Extrair entidades
  const entidadesBrutas = extractEntities(mensagem);
  const entidades = normalizeEntities(entidadesBrutas);

  // Extrair período se relevante
  const periodo = extractPeriodo(mensagem);

  const resultado = {
    intencao,
    confianca,
    alternativas,
    entidades,
    periodo,
    mensagemOriginal: mensagem,
    timestamp: new Date().toISOString()
  };

  logger.info('Query processada', {
    intencao,
    confianca,
    entidadesCount: Object.keys(entidades).length,
    temPeriodo: !!periodo
  });

  return resultado;
};

/**
 * Gera uma resposta contextual baseada na query
 * @param {Object} query - Query processada
 * @returns {Object} - { tipo, mensagem, sugestoes }
 */
export const generateContextualResponse = (query) => {
  const { intencao, entidades, confianca } = query;

  // Baixa confiança - pedir esclarecimento
  if (confianca < 0.3) {
    return {
      tipo: 'esclarecimento',
      mensagem: 'Desculpe, não entendi bem. Você pode reformular sua pergunta?',
      sugestoes: [
        'Consultar agendamentos',
        'Buscar cliente',
        'Verificar estoque',
        'Status de OS'
      ]
    };
  }

  // Processar por intenção
  switch (intencao) {
    case 'consulta_preco':
      if (entidades.servico) {
        return {
          tipo: 'consulta_preco',
          mensagem: `Você quer saber o preço de: ${entidades.servico}`,
          entidades,
          acao: 'buscar_preco'
        };
      } else {
        return {
          tipo: 'pergunta',
          mensagem: 'Qual serviço você gostaria de saber o preço?',
          sugestoes: [
            'Troca de óleo',
            'Revisão',
            'Alinhamento e balanceamento',
            'Troca de pastilhas de freio'
          ]
        };
      }

    case 'agendamento':
      const dadosFaltantes = [];
      if (!entidades.servico) dadosFaltantes.push('serviço');
      if (!entidades.dataRelativa && !query.periodo) dadosFaltantes.push('data');
      if (!entidades.horario) dadosFaltantes.push('horário');

      if (dadosFaltantes.length > 0) {
        return {
          tipo: 'cadastro',
          mensagem: `Para agendar, preciso saber: ${dadosFaltantes.join(', ')}`,
          entidades,
          dadosFaltantes
        };
      }

      return {
        tipo: 'agendamento',
        mensagem: 'Vou processar seu agendamento',
        entidades,
        acao: 'criar_agendamento'
      };

    case 'consulta_cliente':
      if (entidades.nome || entidades.cpf || entidades.telefone) {
        return {
          tipo: 'consulta_cliente',
          mensagem: 'Buscando informações do cliente...',
          entidades,
          acao: 'buscar_cliente'
        };
      } else {
        return {
          tipo: 'pergunta',
          mensagem: 'Qual cliente você quer buscar? Informe nome, CPF ou telefone.',
          entidades
        };
      }

    case 'consulta_estoque':
      if (entidades.servico) {
        return {
          tipo: 'consulta_estoque',
          mensagem: `Verificando estoque de: ${entidades.servico}`,
          entidades,
          acao: 'buscar_estoque'
        };
      } else {
        return {
          tipo: 'pergunta',
          mensagem: 'Qual peça ou produto você quer consultar no estoque?',
          entidades
        };
      }

    case 'consulta_os':
      if (entidades.numeroOS) {
        return {
          tipo: 'consulta_os',
          mensagem: `Buscando OS #${entidades.numeroOS}`,
          entidades,
          acao: 'buscar_os'
        };
      } else {
        return {
          tipo: 'pergunta',
          mensagem: 'Qual o número da Ordem de Serviço?',
          entidades
        };
      }

    case 'saudacao':
      return {
        tipo: 'saudacao',
        mensagem: 'Olá! Como posso ajudá-lo hoje?',
        sugestoes: [
          'Consultar agendamentos',
          'Buscar cliente',
          'Verificar estoque',
          'Status de OS'
        ]
      };

    case 'ajuda':
      return {
        tipo: 'ajuda',
        mensagem: 'Posso ajudá-lo com:\n• Consultar preços\n• Agendar serviços\n• Buscar clientes\n• Verificar estoque\n• Status de OS',
        sugestoes: [
          'Quanto custa uma troca de óleo?',
          'Agendar revisão',
          'Buscar cliente João',
          'Tem filtro em estoque?'
        ]
      };

    default:
      return {
        tipo: 'desconhecido',
        mensagem: 'Não entendi. Como posso ajudá-lo?',
        sugestoes: [
          'Consultar preços',
          'Agendar serviço',
          'Buscar cliente',
          'Verificar estoque'
        ]
      };
  }
};

/**
 * Enriquece a mensagem com contexto NLP antes de enviar ao backend
 * @param {string} mensagem - Mensagem original
 * @returns {Object} - Mensagem enriquecida
 */
export const enrichMessage = (mensagem) => {
  const query = parseQuery(mensagem);
  const contexto = generateContextualResponse(query);

  return {
    mensagemOriginal: mensagem,
    nlp: {
      intencao: query.intencao,
      confianca: query.confianca,
      entidades: query.entidades,
      periodo: query.periodo
    },
    contexto: {
      tipo: contexto.tipo,
      acao: contexto.acao,
      dadosFaltantes: contexto.dadosFaltantes
    }
  };
};

export default {
  parseQuery,
  generateContextualResponse,
  enrichMessage
};
