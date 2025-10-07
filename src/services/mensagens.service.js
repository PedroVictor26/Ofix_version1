import apiClient from './api';

export const getAllMensagens = async () => {
  try {
    const response = await apiClient.get('/mensagens');
    return response.data;
  } catch (error) {
    console.error("Erro ao buscar mensagens:", error.response?.data?.error || error.message);
    throw error.response?.data || { message: error.message || "Erro desconhecido ao buscar mensagens." };
  }
};

export const getMensagemById = async (id) => {
  if (!id) throw new Error("ID da mensagem é obrigatório.");
  try {
    const response = await apiClient.get(`/mensagens/${id}`);
    return response.data;
  } catch (error) {
    console.error(`Erro ao buscar mensagem com ID ${id}:`, error.response?.data?.error || error.message);
    throw error.response?.data || { message: error.message || `Erro ao buscar mensagem ${id}.` };
  }
};

export const createMensagem = async (mensagemData) => {
  if (!mensagemData) throw new Error("Dados da mensagem são obrigatórios.");
  try {
    const response = await apiClient.post('/mensagens', mensagemData);
    return response.data;
  } catch (error) {
    console.error("Erro ao criar mensagem:", error.response?.data?.error || error.message);
    throw error.response?.data || { message: error.message || "Erro desconhecido ao criar mensagem." };
  }
};

export const updateMensagem = async (id, updateData) => {
  if (!id || !updateData) throw new Error("ID e dados de atualização são obrigatórios.");
  try {
    const response = await apiClient.put(`/mensagens/${id}`, updateData);
    return response.data;
  } catch (error) {
    console.error(`Erro ao atualizar mensagem com ID ${id}:`, error.response?.data?.error || error.message);
    throw error.response?.data || { message: error.message || `Erro ao atualizar mensagem ${id}.` };
  }
};

export const deleteMensagem = async (id) => {
  if (!id) throw new Error("ID da mensagem é obrigatório.");
  try {
    const response = await apiClient.delete(`/mensagens/${id}`);
    return response.data;
  } catch (error) {
    console.error(`Erro ao deletar mensagem com ID ${id}:`, error.response?.data?.error || error.message);
    throw error.response?.data || { message: error.message || `Erro ao deletar mensagem ${id}.` };
  }
};