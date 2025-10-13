/**
 * 📅 Serviço de Agendamentos via Matias
 * Integra o assistente com o sistema de agendamentos real
 */

import apiClient from './api';
import * as servicosService from './servicos.service';

// Tipos de agendamento
export const TIPOS_AGENDAMENTO = {
  URGENTE: 'urgente',     // mesmo dia
  NORMAL: 'normal',       // até 3 dias
  PROGRAMADO: 'programado', // manutenção preventiva
  ESPECIAL: 'especial'    // serviços complexos
};

// Verificar disponibilidade na agenda
export const verificarDisponibilidade = async (data, tipo = 'normal') => {
  try {
    const response = await apiClient.get('/api/agendamentos/disponibilidade', {
      params: {
        data: data,
        tipo: tipo
      }
    });
    return response.data;
  } catch (error) {
    console.error('Erro ao verificar disponibilidade:', error);
    return {
      disponivel: false,
      horarios: [],
      proximaDataDisponivel: null
    };
  }
};

// Agendar serviço via Matias
export const agendarServico = async (dadosAgendamento) => {
  try {
    const {
      clienteId,
      veiculoId,
      servicoId,
      dataAgendamento,
      horaAgendamento,
      tipo = 'normal',
      observacoes = '',
      prioridade = 'normal'
    } = dadosAgendamento;

    // Criar o serviço primeiro
    const novoServico = await servicosService.createServico({
      clienteId,
      veiculoId,
      servicoId,
      status: 'agendado',
      dataAgendamento: `${dataAgendamento}T${horaAgendamento}:00`,
      observacoes: `[AGENDADO VIA MATIAS] ${observacoes}`,
      prioridade,
      origem: 'matias_ia'
    });

    // Registrar no sistema de agendamentos
    const agendamento = await apiClient.post('/api/agendamentos', {
      servicoId: novoServico.id,
      clienteId,
      veiculoId,
      dataHora: `${dataAgendamento}T${horaAgendamento}:00`,
      tipo,
      status: 'confirmado',
      observacoes,
      criadoPor: 'matias_ia'
    });

    return {
      sucesso: true,
      servicoId: novoServico.id,
      agendamentoId: agendamento.data.id,
      dataHora: `${dataAgendamento}T${horaAgendamento}:00`,
      tipo,
      mensagem: `Agendamento realizado com sucesso! OS #${novoServico.id} criada.`
    };

  } catch (error) {
    console.error('Erro ao agendar serviço:', error);
    return {
      sucesso: false,
      erro: error.message,
      mensagem: 'Não foi possível realizar o agendamento. Tente novamente.'
    };
  }
};

// Buscar agendamentos próximos
export const buscarAgendamentosProximos = async (dias = 7) => {
  try {
    const dataInicio = new Date();
    const dataFim = new Date();
    dataFim.setDate(dataFim.getDate() + dias);

    const response = await apiClient.get('/api/agendamentos', {
      params: {
        dataInicio: dataInicio.toISOString().split('T')[0],
        dataFim: dataFim.toISOString().split('T')[0],
        status: 'confirmado'
      }
    });

    return response.data;
  } catch (error) {
    console.error('Erro ao buscar agendamentos:', error);
    return [];
  }
};

// Cancelar agendamento
export const cancelarAgendamento = async (agendamentoId, motivo = '') => {
  try {
    const response = await apiClient.patch(`/api/agendamentos/${agendamentoId}/cancelar`, {
      motivo: `[CANCELADO VIA MATIAS] ${motivo}`,
      canceladoPor: 'matias_ia'
    });

    return {
      sucesso: true,
      mensagem: 'Agendamento cancelado com sucesso!'
    };
  } catch (error) {
    console.error('Erro ao cancelar agendamento:', error);
    return {
      sucesso: false,
      erro: error.message,
      mensagem: 'Não foi possível cancelar o agendamento.'
    };
  }
};

// Reagendar serviço
export const reagendarServico = async (agendamentoId, novaData, novaHora) => {
  try {
    const response = await apiClient.patch(`/api/agendamentos/${agendamentoId}/reagendar`, {
      novaDataHora: `${novaData}T${novaHora}:00`,
      reagendadoPor: 'matias_ia'
    });

    return {
      sucesso: true,
      mensagem: 'Reagendamento realizado com sucesso!'
    };
  } catch (error) {
    console.error('Erro ao reagendar:', error);
    return {
      sucesso: false,
      erro: error.message,
      mensagem: 'Não foi possível reagendar o serviço.'
    };
  }
};

// Buscar horários disponíveis para hoje
export const buscarHorariosHoje = async () => {
  const hoje = new Date().toISOString().split('T')[0];
  return verificarDisponibilidade(hoje, 'urgente');
};

// Buscar próximos horários livres
export const buscarProximosHorarios = async (tipo = 'normal') => {
  try {
    const response = await apiClient.get('/api/agendamentos/proximos-horarios', {
      params: { tipo }
    });
    return response.data;
  } catch (error) {
    console.error('Erro ao buscar próximos horários:', error);
    return {
      horariosDisponiveis: [],
      proximaDataLivre: null
    };
  }
};