/**
 * 💬 Serviço de Conversas do Matias
 * Gerencia histórico persistente de conversas com o assistente
 */

import apiClient from './api';

// Salvar mensagem na conversa
export const salvarMensagem = async (userId, conversaId, tipo, conteudo, metadata = {}) => {
  try {
    const response = await apiClient.post('/api/matias/conversas/mensagem', {
      userId,
      conversaId,
      tipo, // 'user' ou 'matias'
      conteudo,
      metadata: {
        timestamp: new Date().toISOString(),
        ...metadata
      }
    });
    return response.data;
  } catch (error) {
    console.error('Erro ao salvar mensagem:', error);
    throw error;
  }
};

// Buscar histórico de conversas do usuário
export const buscarHistoricoConversas = async (userId, limite = 10) => {
  try {
    const response = await apiClient.get(`/api/matias/conversas/historico/${userId}`, {
      params: { limite }
    });
    return response.data;
  } catch (error) {
    console.error('Erro ao buscar histórico:', error);
    return [];
  }
};

// Buscar mensagens de uma conversa específica
export const buscarMensagensConversa = async (conversaId) => {
  try {
    const response = await apiClient.get(`/api/matias/conversas/${conversaId}/mensagens`);
    return response.data;
  } catch (error) {
    console.error('Erro ao buscar mensagens:', error);
    return [];
  }
};

// Criar nova conversa
export const criarNovaConversa = async (userId, titulo = null) => {
  try {
    const response = await apiClient.post('/api/matias/conversas/nova', {
      userId,
      titulo: titulo || `Conversa ${new Date().toLocaleDateString()}`
    });
    return response.data;
  } catch (error) {
    console.error('Erro ao criar conversa:', error);
    throw error;
  }
};

// Arquivar conversa
export const arquivarConversa = async (conversaId) => {
  try {
    const response = await apiClient.patch(`/api/matias/conversas/${conversaId}/arquivar`);
    return response.data;
  } catch (error) {
    console.error('Erro ao arquivar conversa:', error);
    throw error;
  }
};