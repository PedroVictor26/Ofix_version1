import apiClient from './api';

export const getAllTransacoes = async () => {
  try {
    const response = await apiClient.get('/financeiro');
    return response.data;
  } catch (error) {
    console.error("Erro ao buscar transações financeiras:", error.response?.data?.error || error.message);
    throw error.response?.data || { message: error.message || "Erro desconhecido ao buscar transações financeiras." };
  }
};

export const getTransacaoById = async (id) => {
  if (!id) throw new Error("ID da transação é obrigatório.");
  try {
    const response = await apiClient.get(`/financeiro/${id}`);
    return response.data;
  } catch (error) {
    console.error(`Erro ao buscar transação com ID ${id}:`, error.response?.data?.error || error.message);
    throw error.response?.data || { message: error.message || `Erro ao buscar transação ${id}.` };
  }
};

export const createTransacao = async (transacaoData) => {
  if (!transacaoData) throw new Error("Dados da transação são obrigatórios.");
  try {
    const response = await apiClient.post('/financeiro', transacaoData);
    return response.data;
  } catch (error) {
    console.error("Erro ao criar transação:", error.response?.data?.error || error.message);
    throw error.response?.data || { message: error.message || "Erro desconhecido ao criar transação." };
  }
};

export const updateTransacao = async (id, updateData) => {
  if (!id || !updateData) throw new Error("ID e dados de atualização são obrigatórios.");
  try {
    const response = await apiClient.put(`/financeiro/${id}`, updateData);
    return response.data;
  } catch (error) {
    console.error(`Erro ao atualizar transação com ID ${id}:`, error.response?.data?.error || error.message);
    throw error.response?.data || { message: error.message || `Erro ao atualizar transação ${id}.` };
  }
};

export const deleteTransacao = async (id) => {
  if (!id) throw new Error("ID da transação é obrigatório.");
  try {
    const response = await apiClient.delete(`/financeiro/${id}`);
    return response.data;
  } catch (error) {
    console.error(`Erro ao deletar transação com ID ${id}:`, error.response?.data?.error || error.message);
    throw error.response?.data || { message: error.message || `Erro ao deletar transação ${id}.` };
  }
};