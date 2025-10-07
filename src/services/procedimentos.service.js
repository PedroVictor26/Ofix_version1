import apiClient from './api';

export const getAllProcedimentos = async () => {
  try {
    const response = await apiClient.get('/procedimentos');
    return response.data;
  } catch (error) {
    console.error("Erro ao buscar procedimentos:", error.response?.data?.error || error.message);
    throw error.response?.data || { message: error.message || "Erro desconhecido ao buscar procedimentos." };
  }
};

export const getProcedimentoById = async (id) => {
  if (!id) throw new Error("ID do procedimento é obrigatório.");
  try {
    const response = await apiClient.get(`/procedimentos/${id}`);
    return response.data;
  } catch (error) {
    console.error(`Erro ao buscar procedimento com ID ${id}:`, error.response?.data?.error || error.message);
    throw error.response?.data || { message: error.message || `Erro ao buscar procedimento ${id}.` };
  }
};

export const createProcedimento = async (procedimentoData) => {
  if (!procedimentoData) throw new Error("Dados do procedimento são obrigatórios.");
  try {
    const response = await apiClient.post('/procedimentos', procedimentoData);
    return response.data;
  } catch (error) {
    console.error("Erro ao criar procedimento:", error.response?.data?.error || error.message);
    throw error.response?.data || { message: error.message || "Erro desconhecido ao criar procedimento." };
  }
};

export const updateProcedimento = async (id, updateData) => {
  if (!id || !updateData) throw new Error("ID e dados de atualização são obrigatórios.");
  try {
    const response = await apiClient.put(`/procedimentos/${id}`, updateData);
    return response.data;
  } catch (error) {
    console.error(`Erro ao atualizar procedimento com ID ${id}:`, error.response?.data?.error || error.message);
    throw error.response?.data || { message: error.message || `Erro ao atualizar procedimento ${id}.` };
  }
};

export const deleteProcedimento = async (id) => {
  if (!id) throw new Error("ID do procedimento é obrigatório.");
  try {
    const response = await apiClient.delete(`/procedimentos/${id}`);
    return response.data;
  } catch (error) {
    console.error(`Erro ao deletar procedimento com ID ${id}:`, error.response?.data?.error || error.message);
    throw error.response?.data || { message: error.message || `Erro ao deletar procedimento ${id}.` };
  }
};