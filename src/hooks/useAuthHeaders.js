/**
 * 🔐 Hook useAuthHeaders
 * 
 * Centraliza lógica de autenticação e elimina duplicação de código
 */

import { useCallback } from 'react';
import logger from '../utils/logger';

export const useAuthHeaders = () => {
  /**
   * Obtém headers de autenticação do localStorage
   */
  const getAuthHeaders = useCallback(() => {
    const headers = {
      'Content-Type': 'application/json'
    };
    
    try {
      const tokenDataString = localStorage.getItem('authToken');
      
      if (tokenDataString) {
        const tokenData = JSON.parse(tokenDataString);
        
        if (tokenData?.token) {
          headers['Authorization'] = `Bearer ${tokenData.token}`;
        } else {
          logger.warn('Token encontrado mas inválido', {
            hasToken: !!tokenData,
            tokenKeys: tokenData ? Object.keys(tokenData) : []
          });
        }
      }
    } catch (error) {
      logger.error('Erro ao processar token de autenticação', {
        error: error.message,
        stack: error.stack
      });
    }
    
    return headers;
  }, []);

  /**
   * Verifica se usuário está autenticado
   */
  const isAuthenticated = useCallback(() => {
    try {
      const tokenDataString = localStorage.getItem('authToken');
      if (!tokenDataString) return false;
      
      const tokenData = JSON.parse(tokenDataString);
      
      // Verificar se token existe
      if (!tokenData?.token) return false;
      
      // Verificar expiração se disponível
      if (tokenData.expiresAt) {
        const now = Date.now();
        const expiresAt = new Date(tokenData.expiresAt).getTime();
        
        if (now >= expiresAt) {
          logger.warn('Token expirado', {
            expiresAt: tokenData.expiresAt,
            now: new Date(now).toISOString()
          });
          return false;
        }
      }
      
      return true;
    } catch (error) {
      logger.error('Erro ao verificar autenticação', {
        error: error.message
      });
      return false;
    }
  }, []);

  /**
   * Obtém dados do token
   */
  const getTokenData = useCallback(() => {
    try {
      const tokenDataString = localStorage.getItem('authToken');
      if (!tokenDataString) return null;
      
      const tokenData = JSON.parse(tokenDataString);
      return tokenData;
    } catch (error) {
      logger.error('Erro ao obter dados do token', {
        error: error.message
      });
      return null;
    }
  }, []);

  /**
   * Obtém ID do usuário do token
   */
  const getUserId = useCallback(() => {
    const tokenData = getTokenData();
    return tokenData?.userId || tokenData?.id || null;
  }, [getTokenData]);

  /**
   * Verifica se token está próximo de expirar (menos de 5 minutos)
   */
  const isTokenExpiringSoon = useCallback(() => {
    try {
      const tokenData = getTokenData();
      if (!tokenData?.expiresAt) return false;
      
      const now = Date.now();
      const expiresAt = new Date(tokenData.expiresAt).getTime();
      const fiveMinutes = 5 * 60 * 1000;
      
      return (expiresAt - now) < fiveMinutes;
    } catch (error) {
      logger.error('Erro ao verificar expiração do token', {
        error: error.message
      });
      return false;
    }
  }, [getTokenData]);

  /**
   * Limpa token de autenticação
   */
  const clearAuth = useCallback(() => {
    try {
      localStorage.removeItem('authToken');
      logger.info('Token de autenticação removido');
    } catch (error) {
      logger.error('Erro ao limpar autenticação', {
        error: error.message
      });
    }
  }, []);

  /**
   * Salva novo token
   */
  const setAuthToken = useCallback((token, expiresIn = 86400) => {
    try {
      const expiresAt = new Date(Date.now() + expiresIn * 1000).toISOString();
      const tokenData = {
        token,
        expiresAt,
        createdAt: new Date().toISOString()
      };
      
      localStorage.setItem('authToken', JSON.stringify(tokenData));
      logger.info('Token de autenticação salvo', {
        expiresAt
      });
    } catch (error) {
      logger.error('Erro ao salvar token', {
        error: error.message
      });
    }
  }, []);

  return {
    getAuthHeaders,
    isAuthenticated,
    getTokenData,
    getUserId,
    isTokenExpiringSoon,
    clearAuth,
    setAuthToken
  };
};

export default useAuthHeaders;
