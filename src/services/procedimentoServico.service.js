import apiClient from './api';

// Marcar/desmarcar procedimento como concluído
export const toggleProcedimentoConcluido = async (servicoId, procedimentoId, concluido) => {
  try {
    const response = await apiClient.patch(`/servicos/${servicoId}/procedimentos/${procedimentoId}`, {
      concluido,
      dataConclusao: concluido ? new Date().toISOString() : null
    });
    return response.data;
  } catch (error) {
    console.error('Erro ao atualizar status do procedimento:', error.response?.data?.error || error.message);
    throw error.response?.data || { message: error.message || 'Erro ao atualizar status do procedimento.' };
  }
};

// Atualizar observações do procedimento
export const updateProcedimentoObservacoes = async (servicoId, procedimentoId, observacoes) => {
  try {
    const response = await apiClient.patch(`/servicos/${servicoId}/procedimentos/${procedimentoId}`, {
      observacoes
    });
    return response.data;
  } catch (error) {
    console.error('Erro ao atualizar observações do procedimento:', error.response?.data?.error || error.message);
    throw error.response?.data || { message: error.message || 'Erro ao atualizar observações do procedimento.' };
  }
};

// Obter checklist expandido do procedimento com status individual dos itens
export const getProcedimentoChecklist = async (procedimentoId) => {
  try {
    const response = await apiClient.get(`/procedimentos/${procedimentoId}/checklist`);
    return response.data;
  } catch (error) {
    console.error('Erro ao obter checklist do procedimento:', error.response?.data?.error || error.message);
    throw error.response?.data || { message: error.message || 'Erro ao obter checklist do procedimento.' };
  }
};
