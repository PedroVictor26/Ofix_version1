import apiClient from './api';

// Função para buscar todos os serviços
// params pode ser um objeto com filtros: { status: '...', clienteId: '...' }
export const getAllServicos = async (params = {}) => {
  try {
    const response = await apiClient.get('/servicos', { params });
    return response.data; // Espera-se um array de serviços
  } catch (error) {
    console.error("Erro ao buscar todos os serviços:", error.response?.data?.error || error.message);
    throw error.response?.data || { message: error.message || "Erro desconhecido ao buscar serviços." };
  }
};

// Função para buscar um serviço pelo ID
export const getServicoById = async (id) => {
  if (!id) throw new Error("ID do serviço é obrigatório para getServicoById.");
  try {
    const response = await apiClient.get(`/servicos/${id}`);
    return response.data; // Espera-se um objeto de serviço
  } catch (error) {
    console.error(`Erro ao buscar serviço com ID ${id}:`, error.response?.data?.error || error.message);
    throw error.response?.data || { message: error.message || `Erro ao buscar serviço ${id}.` };
  }
};

// Função para criar um novo serviço
// data é um objeto com os dados do serviço a ser criado
export const createServico = async (servicoData) => {
  if (!servicoData) throw new Error("Dados do serviço são obrigatórios para createServico.");
  try {
    const response = await apiClient.post('/servicos', servicoData);
    return response.data; // Espera-se o serviço criado como resposta
  } catch (error) {
    console.error("Erro ao criar serviço:", error.response?.data?.error || error.message);
    // O erro pode conter mensagens específicas do backend (ex: validação)
    throw error.response?.data || { message: error.message || "Erro desconhecido ao criar serviço." };
  }
};

// Função para atualizar um serviço existente
// id é o ID do serviço a ser atualizado
// updateData é um objeto com os campos a serem atualizados
export const updateServico = async (id, updateData) => {
  if (!id || !updateData) throw new Error("ID e dados de atualização são obrigatórios para updateServico.");
  try {
    const response = await apiClient.put(`/servicos/${id}`, updateData);
    return response.data; // Espera-se o serviço atualizado como resposta
  } catch (error) {
    console.error(`Erro ao atualizar serviço com ID ${id}:`, error.response?.data?.error || error.message);
    throw error.response?.data || { message: error.message || `Erro ao atualizar serviço ${id}.` };
  }
};

// Função para deletar um serviço
// id é o ID do serviço a ser deletado
export const deleteServico = async (id) => {
  if (!id) throw new Error("ID do serviço é obrigatório para deleteServico.");
  try {
    const response = await apiClient.delete(`/servicos/${id}`);
    return response.data; // Geralmente retorna status 204 (No Content) ou uma mensagem de sucesso
  } catch (error) {
    console.error(`Erro ao deletar serviço com ID ${id}:`, error.response?.data?.error || error.message);
    throw error.response?.data || { message: error.message || `Erro ao deletar serviço ${id}.` };
  }
};
