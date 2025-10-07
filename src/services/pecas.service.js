import apiClient from './api';

export const getAllPecas = async () => {
  try {
    const response = await apiClient.get('/pecas');
    return response.data;
  } catch (error) {
    console.error("Erro ao buscar peças:", error.response?.data?.error || error.message);
    throw error.response?.data || { message: error.message || "Erro desconhecido ao buscar peças." };
  }
};

export const getPecaById = async (id) => {
  if (!id) throw new Error("ID da peça é obrigatório.");
  try {
    const response = await apiClient.get(`/pecas/${id}`);
    return response.data;
  } catch (error) {
    console.error(`Erro ao buscar peça com ID ${id}:`, error.response?.data?.error || error.message);
    throw error.response?.data || { message: error.message || `Erro ao buscar peça ${id}.` };
  }
};

export const createPeca = async (pecaData) => {
  if (!pecaData) throw new Error("Dados da peça são obrigatórios.");
  try {
    const response = await apiClient.post('/pecas', pecaData);
    return response.data;
  } catch (error) {
    console.error("Erro ao criar peça:", error.response?.data?.error || error.message);
    throw error.response?.data || { message: error.message || "Erro desconhecido ao criar peça." };
  }
};

export const updatePeca = async (id, updateData) => {
  if (!id || !updateData) throw new Error("ID e dados de atualização são obrigatórios.");
  try {
    const response = await apiClient.put(`/pecas/${id}`, updateData);
    return response.data;
  } catch (error) {
    console.error(`Erro ao atualizar peça com ID ${id}:`, error.response?.data?.error || error.message);
    throw error.response?.data || { message: error.message || `Erro ao atualizar peça ${id}.` };
  }
};

export const deletePeca = async (id) => {
  if (!id) throw new Error("ID da peça é obrigatório.");
  try {
    const response = await apiClient.delete(`/pecas/${id}`);
    return response.data;
  } catch (error) {
    console.error(`Erro ao deletar peça com ID ${id}:`, error.response?.data?.error || error.message);
    throw error.response?.data || { message: error.message || `Erro ao deletar peça ${id}.` };
  }
};