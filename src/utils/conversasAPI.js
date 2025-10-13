/**
 * Serviços para gerenciar conversas com IA
 * Integração com backend para persistência de histórico
 */

import { getApiBaseUrl } from './api.js';

/**
 * Salvar uma conversa individual
 */
export const salvarConversa = async (tipo, conteudo, metadata = null) => {
  try {
    const token = localStorage.getItem('token');
    
    if (!token) {
      throw new Error('Token de autenticação não encontrado');
    }
    
    const response = await fetch(`${getApiBaseUrl()}/api/conversas/salvar`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        tipo,
        conteudo,
        metadata
      })
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `Erro HTTP: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Erro ao salvar conversa:', error);
    throw error;
  }
};

/**
 * Salvar sessão completa de conversas
 */
export const salvarSessaoCompleta = async (conversas, sessaoId = null) => {
  try {
    const token = localStorage.getItem('token');
    
    if (!token) {
      throw new Error('Token de autenticação não encontrado');
    }
    
    const response = await fetch(`${getApiBaseUrl()}/api/conversas/salvar-sessao`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        conversas,
        sessaoId
      })
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `Erro HTTP: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Erro ao salvar sessão:', error);
    throw error;
  }
};

/**
 * Buscar histórico de conversas do usuário
 */
export const buscarHistoricoConversas = async (limite = 50, offset = 0) => {
  try {
    const token = localStorage.getItem('token');
    
    if (!token) {
      throw new Error('Token de autenticação não encontrado');
    }
    
    const response = await fetch(
      `${getApiBaseUrl()}/api/conversas/historico?limite=${limite}&offset=${offset}`,
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      }
    );
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `Erro HTTP: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Erro ao buscar histórico:', error);
    throw error;
  }
};

/**
 * Buscar conversas de uma sessão específica
 */
export const buscarConversasSessao = async (sessaoId) => {
  try {
    const token = localStorage.getItem('token');
    
    if (!token) {
      throw new Error('Token de autenticação não encontrado');
    }
    
    const response = await fetch(
      `${getApiBaseUrl()}/api/conversas/sessao/${sessaoId}`,
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      }
    );
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `Erro HTTP: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Erro ao buscar sessão:', error);
    throw error;
  }
};

/**
 * Obter estatísticas de uso
 */
export const obterEstatisticasConversas = async () => {
  try {
    const token = localStorage.getItem('token');
    
    if (!token) {
      throw new Error('Token de autenticação não encontrado');
    }
    
    const response = await fetch(
      `${getApiBaseUrl()}/api/conversas/estatisticas`,
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      }
    );
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `Erro HTTP: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Erro ao buscar estatísticas:', error);
    throw error;
  }
};

/**
 * Configurar estrutura inicial (setup)
 */
export const configurarEstrutura = async () => {
  try {
    const response = await fetch(`${getApiBaseUrl()}/api/conversas/setup`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `Erro HTTP: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Erro no setup:', error);
    throw error;
  }
};

/**
 * Helper: Sincronizar localStorage com banco
 */
export const sincronizarConversas = async () => {
  try {
    // Buscar conversas do localStorage
    const localStorageKey = 'conversas_matias';
    const conversasLocal = JSON.parse(localStorage.getItem(localStorageKey) || '[]');
    
    if (conversasLocal.length === 0) {
      return { message: 'Nenhuma conversa local para sincronizar' };
    }
    
    // Salvar no banco
    const resultado = await salvarSessaoCompleta(
      conversasLocal,
      `sync_${Date.now()}`
    );
    
    return {
      ...resultado,
      message: 'Conversas sincronizadas com sucesso'
    };
  } catch (error) {
    console.error('Erro na sincronização:', error);
    throw error;
  }
};

/**
 * Helper: Migrar conversas do banco para localStorage
 */
export const carregarConversasDoServidor = async (limite = 20) => {
  try {
    const historico = await buscarHistoricoConversas(limite, 0);
    
    if (historico.success && historico.conversas.length > 0) {
      // Converter formato do banco para localStorage
      const conversasFormatadas = historico.conversas.map(conv => ({
        id: conv.id,
        tipo: conv.tipo,
        conteudo: conv.conteudo,
        timestamp: conv.timestamp,
        metadata: conv.metadata
      }));
      
      // Salvar no localStorage
      const localStorageKey = 'conversas_matias';
      localStorage.setItem(localStorageKey, JSON.stringify(conversasFormatadas));
      
      return {
        success: true,
        conversas: conversasFormatadas,
        total: conversasFormatadas.length,
        message: 'Conversas carregadas do servidor'
      };
    }
    
    return {
      success: true,
      conversas: [],
      total: 0,
      message: 'Nenhuma conversa encontrada no servidor'
    };
  } catch (error) {
    console.error('Erro ao carregar do servidor:', error);
    return {
      success: false,
      error: error.message,
      conversas: []
    };
  }
};