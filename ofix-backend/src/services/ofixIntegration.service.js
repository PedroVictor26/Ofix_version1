// Minimal integration stubs for OfixNovo data with simple in-memory cache
const cache = new Map();

function cacheKey(prefix, params) {
  return `${prefix}:${JSON.stringify(params)}`;
}

class OfixIntegrationService {
  async getOSStatus({ os, placa, userId }) {
    const key = cacheKey('osStatus', { os, placa });
    if (cache.has(key)) return cache.get(key);

    // Simulated data
    const status = {
      os: os || 'N/D',
      placa: placa || 'N/D',
      status: 'EM_EXECUCAO',
      etapas: [
        { nome: 'Check-in', concluido: true, horario: new Date(Date.now() - 3600000).toISOString() },
        { nome: 'Diagnóstico', concluido: true, horario: new Date(Date.now() - 1800000).toISOString() },
        { nome: 'Execução', concluido: false, previsao: new Date(Date.now() + 3600000).toISOString() },
      ],
      atualizadoEm: new Date().toISOString(),
      userId
    };
    cache.set(key, status);
    return status;
  }

  async getVehicleHistory({ plate, from, to, type, userId }) {
    const key = cacheKey('vehHist', { plate, from, to, type });
    if (cache.has(key)) return cache.get(key);

    const history = {
      plate,
      period: { from: from || '2024-01-01', to: to || '2025-01-01' },
      items: [
        { data: '2024-02-10', servico: 'Troca de óleo', km: 20000 },
        { data: '2024-06-15', servico: 'Troca de pastilhas de freio', km: 38000 },
        { data: '2024-11-20', servico: 'Alinhamento e balanceamento', km: 52000 },
      ],
      userId
    };
    cache.set(key, history);
    return history;
  }

  async createAgendamento({ nome, telefone, placa, preferenciaData, preferenciaHorario, servicos, userId }) {
    // Simulate id
    const id = `ag_${Date.now()}`;
    return {
      id,
      nome,
      telefone,
      placa,
      preferenciaData: preferenciaData || null,
      preferenciaHorario: preferenciaHorario || null,
      servicos,
      status: 'PENDENTE_CONFIRMACAO',
      criadoEm: new Date().toISOString(),
      userId
    };
  }

  async buildWhatsappSummary({ osId, dadosOS, userId }) {
    const nome = dadosOS?.cliente || 'Cliente';
    const status = dadosOS?.status || 'EM_EXECUCAO';
    const hora = new Date(Date.now() + 2 * 3600000).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    const mensagemWhatsapp = `Olá ${nome}! Sua OS #${osId} está ${status.replace('_', ' ').toLowerCase()}. Previsão de conclusão até ${hora}. Qualquer novidade avisamos. Obrigado! — OFIX`;
    return {
      mensagemWhatsapp,
      cliente: nome,
      os: String(osId),
      status
    };
  }

  async analyzeUpsell({ osId, laudoTecnico, historicoCliente, userId }) {
    // naive rules
    let sugestao = 'nenhum_upsell';
    let justificativa_tecnica = '';
    let mensagem_cliente = '';

    if (/pastilha/i.test(laudoTecnico) || /freio/i.test(laudoTecnico)) {
      sugestao = 'troca_pastilhas_freio';
      justificativa_tecnica = 'Pastilhas com desgaste indicado em laudo. Substituição aumenta segurança e reduz ruídos.';
      mensagem_cliente = 'Notamos desgaste nas pastilhas de freio. Recomendamos a troca para sua segurança. Posso incluir no orçamento?';
    } else if (/óleo|oleo/i.test(laudoTecnico)) {
      sugestao = 'troca_de_oleo';
      justificativa_tecnica = 'Período de troca próximo no histórico. Trocar óleo mantém a lubrificação e saúde do motor.';
      mensagem_cliente = 'Seu veículo está próximo do prazo de troca de óleo. Recomenda-se realizar a troca para manter o motor protegido.';
    }

    return { sugestao, justificativa_tecnica, mensagem_cliente };
  }
}

const ofixIntegration = new OfixIntegrationService();
export default ofixIntegration;
