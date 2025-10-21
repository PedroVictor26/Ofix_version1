/**
 * 💬 Hook useChatHistory
 * 
 * Gerencia histórico de conversas com debounce e limite
 */

import { useState, useCallback, useMemo, useEffect } from 'react';
import { debounce } from 'lodash';
import { AI_CONFIG } from '../constants/aiPageConfig';
import logger from '../utils/logger';

export const useChatHistory = (userId) => {
  const [conversas, setConversas] = useState([]);
  const [loading, setLoading] = useState(false);

  // Gerar chave de storage
  const storageKey = useMemo(
    () => `${AI_CONFIG.STORAGE.KEY_PREFIX}${userId || 'anonymous'}`,
    [userId]
  );

  /**
   * Salva no localStorage com debounce
   */
  const salvarLocal = useMemo(
    () => debounce((conversas) => {
      try {
        const dataToSave = {
          conversas,
          timestamp: new Date().toISOString(),
          userId: userId || 'anonymous',
          version: '1.0'
        };
        
        localStorage.setItem(storageKey, JSON.stringify(dataToSave));
        
        logger.debug('Histórico salvo', {
          conversasCount: conversas.length,
          userId
        });
      } catch (error) {
        logger.error('Erro ao salvar histórico local', {
          error: error.message,
          conversasCount: conversas.length,
          storageKey
        });
      }
    }, AI_CONFIG.CHAT.AUTO_SAVE_DEBOUNCE_MS),
    [storageKey, userId]
  );

  /**
   * Adiciona mensagem ao histórico
   */
  const adicionarMensagem = useCallback((mensagem) => {
    setConversas(prev => {
      const novasConversas = [...prev, mensagem];
      
      // Aplicar limite de mensagens
      const conversasLimitadas = novasConversas.slice(
        -AI_CONFIG.CHAT.MAX_HISTORY_MESSAGES
      );
      
      // Salvar com debounce
      salvarLocal(conversasLimitadas);
      
      return conversasLimitadas;
    });
  }, [salvarLocal]);

  /**
   * Adiciona múltiplas mensagens
   */
  const adicionarMensagens = useCallback((mensagens) => {
    setConversas(prev => {
      const novasConversas = [...prev, ...mensagens];
      const conversasLimitadas = novasConversas.slice(
        -AI_CONFIG.CHAT.MAX_HISTORY_MESSAGES
      );
      salvarLocal(conversasLimitadas);
      return conversasLimitadas;
    });
  }, [salvarLocal]);

  /**
   * Limpa histórico
   */
  const limparHistorico = useCallback(() => {
    try {
      localStorage.removeItem(storageKey);
      setConversas([]);
      
      logger.info('Histórico limpo', { userId });
    } catch (error) {
      logger.error('Erro ao limpar histórico', {
        error: error.message,
        storageKey
      });
    }
  }, [storageKey, userId]);

  /**
   * Carrega histórico do localStorage
   */
  const carregarHistorico = useCallback(async () => {
    setLoading(true);
    
    try {
      const saved = localStorage.getItem(storageKey);
      
      if (saved) {
        const data = JSON.parse(saved);
        
        // Validar estrutura
        if (data.conversas && Array.isArray(data.conversas)) {
          setConversas(data.conversas);
          
          logger.info('Histórico carregado', {
            conversasCount: data.conversas.length,
            timestamp: data.timestamp
          });
        } else {
          logger.warn('Histórico com estrutura inválida', { data });
        }
      }
    } catch (error) {
      logger.error('Erro ao carregar histórico', {
        error: error.message,
        stack: error.stack,
        storageKey
      });
    } finally {
      setLoading(false);
    }
  }, [storageKey]);

  /**
   * Obtém contexto das últimas mensagens
   */
  const obterContexto = useCallback((quantidade = AI_CONFIG.CHAT.CONTEXT_MESSAGES_COUNT) => {
    return conversas.slice(-quantidade).map(c => ({
      tipo: c.tipo,
      conteudo: c.conteudo
    }));
  }, [conversas]);

  /**
   * Busca mensagens por tipo
   */
  const buscarPorTipo = useCallback((tipo) => {
    return conversas.filter(c => c.tipo === tipo);
  }, [conversas]);

  /**
   * Obtém estatísticas do histórico
   */
  const obterEstatisticas = useCallback(() => {
    const tipos = conversas.reduce((acc, c) => {
      acc[c.tipo] = (acc[c.tipo] || 0) + 1;
      return acc;
    }, {});

    return {
      total: conversas.length,
      porTipo: tipos,
      primeira: conversas[0]?.timestamp,
      ultima: conversas[conversas.length - 1]?.timestamp
    };
  }, [conversas]);

  // Cleanup do debounce
  useEffect(() => {
    return () => {
      salvarLocal.cancel();
    };
  }, [salvarLocal]);

  /**
   * Substitui todas as conversas
   */
  const setConversasCompleto = useCallback((novasConversas) => {
    const conversasLimitadas = novasConversas.slice(-AI_CONFIG.CHAT.MAX_HISTORY_MESSAGES);
    setConversas(conversasLimitadas);
    salvarLocal(conversasLimitadas);
  }, [salvarLocal]);

  /**
   * Remove mensagem por ID
   */
  const removerMensagem = useCallback((id) => {
    setConversas(prev => {
      const novasConversas = prev.filter(c => c.id !== id);
      salvarLocal(novasConversas);
      return novasConversas;
    });
  }, [salvarLocal]);

  return {
    conversas,
    loading,
    adicionarMensagem,
    adicionarMensagens,
    limparHistorico,
    carregarHistorico,
    obterContexto,
    buscarPorTipo,
    obterEstatisticas,
    setConversasCompleto,
    removerMensagem
  };
};

export default useChatHistory;
