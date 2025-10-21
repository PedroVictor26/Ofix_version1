/**
 * 🌐 Hook useChatAPI
 * 
 * Gerencia comunicação com API com retry logic e timeout
 */

import { useState, useCallback } from 'react';
import { AI_CONFIG } from '../constants/aiPageConfig';
import logger from '../utils/logger';
import { validarMensagem } from '../utils/messageValidator';

export const useChatAPI = (getAuthHeaders) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  /**
   * Calcula delay com exponential backoff
   */
  const calcularDelay = (tentativa) => {
    if (!AI_CONFIG.RETRY.EXPONENTIAL_BACKOFF) {
      return AI_CONFIG.RETRY.BASE_DELAY_MS;
    }
    return AI_CONFIG.RETRY.BASE_DELAY_MS * Math.pow(2, tentativa - 1);
  };

  /**
   * Envia mensagem para API com retry
   */
  const enviarMensagem = useCallback(async (mensagem, contexto = [], tentativa = 1) => {
    // Validar mensagem antes de enviar
    const validacao = validarMensagem(mensagem);
    
    if (!validacao.valid) {
      const errorMsg = validacao.errors[0];
      setError(errorMsg);
      throw new Error(errorMsg);
    }

    setLoading(true);
    setError(null);

    try {
      const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:1000';
      const API_BASE = API_BASE_URL.replace('/api', '');
      
      const controller = new AbortController();
      const timeoutId = setTimeout(
        () => controller.abort(),
        AI_CONFIG.CHAT.REQUEST_TIMEOUT_MS
      );

      logger.debug('Enviando mensagem para API', {
        mensagem: mensagem.substring(0, 50),
        tentativa,
        maxTentativas: AI_CONFIG.RETRY.MAX_ATTEMPTS
      });

      const response = await fetch(`${API_BASE}/agno/chat-inteligente`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          message: validacao.sanitized, // Usar mensagem sanitizada
          contexto_conversa: contexto
        }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      
      logger.info('Mensagem enviada com sucesso', {
        tentativa,
        responseType: data.tipo
      });

      return data;

    } catch (err) {
      const isTimeout = err.name === 'AbortError';
      const errorMessage = isTimeout 
        ? 'Tempo limite excedido. Tente novamente.'
        : err.message;

      logger.error('Erro ao enviar mensagem', {
        error: errorMessage,
        tentativa,
        maxTentativas: AI_CONFIG.RETRY.MAX_ATTEMPTS,
        isTimeout,
        stack: err.stack
      });

      // Retry logic
      if (tentativa < AI_CONFIG.RETRY.MAX_ATTEMPTS && !isTimeout) {
        const delay = calcularDelay(tentativa);
        
        logger.info(`Tentando novamente em ${delay}ms...`, {
          tentativa: tentativa + 1,
          maxTentativas: AI_CONFIG.RETRY.MAX_ATTEMPTS
        });

        await new Promise(resolve => setTimeout(resolve, delay));
        return enviarMensagem(mensagem, contexto, tentativa + 1);
      }

      setError(errorMessage);
      throw new Error(errorMessage);

    } finally {
      setLoading(false);
    }
  }, [getAuthHeaders]);

  /**
   * Verifica status da conexão com retry
   */
  const verificarConexao = useCallback(async (tentativas = 1) => {
    try {
      const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:1000';
      const API_BASE = API_BASE_URL.replace('/api', '');
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      
      const response = await fetch(`${API_BASE}/agno/contexto-sistema`, {
        method: 'GET',
        headers: getAuthHeaders(),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      const isConnected = response.ok;
      
      logger.info('Verificação de conexão', {
        isConnected,
        status: response.status,
        tentativa: tentativas
      });

      return isConnected;

    } catch (err) {
      logger.error('Erro ao verificar conexão', {
        error: err.message,
        tentativa: tentativas
      });
      
      // Retry até 2 vezes
      if (tentativas < 2) {
        await new Promise(resolve => setTimeout(resolve, 1000));
        return verificarConexao(tentativas + 1);
      }
      
      return false;
    }
  }, [getAuthHeaders]);

  /**
   * Carrega histórico do servidor com timeout
   */
  const carregarHistoricoServidor = useCallback(async (userId) => {
    if (!userId) {
      logger.warn('userId não fornecido para carregar histórico');
      return [];
    }

    try {
      const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:1000';
      const API_BASE = API_BASE_URL.replace('/api', '');
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout
      
      const response = await fetch(
        `${API_BASE}/agno/historico-conversa?usuario_id=${userId}`,
        {
          headers: getAuthHeaders(),
          signal: controller.signal
        }
      );

      clearTimeout(timeoutId);

      if (response.ok) {
        const data = await response.json();
        
        const mensagens = data.mensagens || [];
        
        logger.info('Histórico carregado do servidor', {
          mensagensCount: mensagens.length,
          userId
        });

        return mensagens;
      }

      logger.warn('Falha ao carregar histórico', {
        status: response.status,
        userId
      });

      return [];

    } catch (err) {
      const isTimeout = err.name === 'AbortError';
      
      logger.error('Erro ao carregar histórico do servidor', {
        error: err.message,
        isTimeout,
        userId
      });
      
      return [];
    }
  }, [getAuthHeaders]);

  /**
   * Limpa erro
   */
  const limparErro = useCallback(() => {
    setError(null);
  }, []);

  return {
    enviarMensagem,
    verificarConexao,
    carregarHistoricoServidor,
    loading,
    error,
    setError,
    limparErro
  };
};

export default useChatAPI;
