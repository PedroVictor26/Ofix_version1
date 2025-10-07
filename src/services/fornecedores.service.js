import apiClient from './api';

export const getAllFornecedores = async () => {
  try {
    const response = await apiClient.get('/fornecedores');
    return response.data;
  } catch (error) {
    console.error("Erro ao buscar fornecedores:", error.response?.data?.error || error.message);
    throw error.response?.data || { message: error.message || "Erro desconhecido ao buscar fornecedores." };
  }
};

export const getFornecedorById = async (id) => {
  if (!id) throw new Error("ID do fornecedor é obrigatório.");
  try {
    const response = await apiClient.get(`/fornecedores/${id}`);
    return response.data;
  } catch (error) {
    console.error(`Erro ao buscar fornecedor com ID ${id}:`, error.response?.data?.error || error.message);
    throw error.response?.data || { message: error.message || `Erro ao buscar fornecedor ${id}.` };
  }
};

export const createFornecedor = async (fornecedorData) => {
  if (!fornecedorData) throw new Error("Dados do fornecedor são obrigatórios.");
  try {
    const response = await apiClient.post('/fornecedores', fornecedorData);
    return response.data;
  } catch (error) {
    console.error("Erro ao criar fornecedor:", error.response?.data?.error || error.message);
    throw error.response?.data || { message: error.message || "Erro desconhecido ao criar fornecedor." };
  }
};

export const updateFornecedor = async (id, updateData) => {
  if (!id || !updateData) throw new Error("ID e dados de atualização são obrigatórios.");
  try {
    const response = await apiClient.put(`/fornecedores/${id}`, updateData);
    return response.data;
  } catch (error) {
    console.error(`Erro ao atualizar fornecedor com ID ${id}:`, error.response?.data?.error || error.message);
    throw error.response?.data || { message: error.message || `Erro ao atualizar fornecedor ${id}.` };
  }
};

export const deleteFornecedor = async (id) => {
  if (!id) throw new Error("ID do fornecedor é obrigatório.");
  try {
    const response = await apiClient.delete(`/fornecedores/${id}`);
    return response.data;
  } catch (error) {
    console.error(`Erro ao deletar fornecedor com ID ${id}:`, error.response?.data?.error || error.message);
    throw error.response?.data || { message: error.message || `Erro ao deletar fornecedor ${id}.` };
  }
};