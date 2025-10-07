import apiClient from './api';

export const createItemServicoPeca = async (itemData) => {
  if (!itemData) throw new Error("Dados do item de serviço são obrigatórios.");
  try {
    const response = await apiClient.post('/item-servico-peca', itemData);
    return response.data;
  } catch (error) {
    console.error("Erro ao criar item de serviço:", error.response?.data?.error || error.message);
    throw error.response?.data || { message: error.message || "Erro desconhecido ao criar item de serviço." };
  }
};

export const updateItemServicoPeca = async (id, updateData) => {
  if (!id || !updateData) throw new Error("ID e dados de atualização são obrigatórios.");
  try {
    const response = await apiClient.put(`/item-servico-peca/${id}`, updateData);
    return response.data;
  } catch (error) {
    console.error(`Erro ao atualizar item de serviço com ID ${id}:`, error.response?.data?.error || error.message);
    throw error.response?.data || { message: error.message || `Erro ao atualizar item de serviço ${id}.` };
  }
};

export const deleteItemServicoPeca = async (id) => {
  if (!id) throw new Error("ID do item de serviço é obrigatório.");
  try {
    const response = await apiClient.delete(`/item-servico-peca/${id}`);
    return response.data;
  } catch (error) {
    console.error(`Erro ao deletar item de serviço com ID ${id}:`, error.response?.data?.error || error.message);
    throw error.response?.data || { message: error.message || `Erro ao deletar item de serviço ${id}.` };
  }
};