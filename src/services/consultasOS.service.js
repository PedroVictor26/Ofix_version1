/**
 * 📋 Serviço de Consultas Operacionais via Matias
 * Permite ao assistente acessar dados reais do sistema
 */

import apiClient from './api';

// Consultar OS por número
export const consultarOS = async (numeroOS) => {
  try {
    const response = await apiClient.get(`/api/servicos/${numeroOS}`);
    const servico = response.data;
    
    if (!servico) {
      return {
        encontrado: false,
        mensagem: `OS #${numeroOS} não encontrada no sistema.`
      };
    }

    // Buscar dados adicionais
    const [cliente, veiculo, procedimentos] = await Promise.all([
      apiClient.get(`/api/clientes/${servico.clienteId}`).catch(() => null),
      servico.veiculoId ? apiClient.get(`/api/veiculos/${servico.veiculoId}`).catch(() => null) : null,
      apiClient.get(`/api/servicos/${numeroOS}/procedimentos`).catch(() => ({ data: [] }))
    ]);

    return {
      encontrado: true,
      os: {
        numero: servico.id,
        status: servico.status,
        dataAbertura: servico.createdAt,
        dataFechamento: servico.updatedAt,
        cliente: cliente?.data?.nome || 'Não informado',
        telefone: cliente?.data?.telefone || 'Não informado',
        veiculo: veiculo?.data ? `${veiculo.data.marca} ${veiculo.data.modelo} ${veiculo.data.ano}` : 'Não informado',
        placa: veiculo?.data?.placa || 'Não informada',
        descricaoProblema: servico.descricaoProblema || 'Não informada',
        observacoes: servico.observacoes || 'Nenhuma',
        valorTotal: servico.valorTotal || 0,
        procedimentos: procedimentos.data || [],
        prioridade: servico.prioridade || 'normal'
      }
    };
  } catch (error) {
    return {
      encontrado: false,
      erro: error.message,
      mensagem: `Erro ao consultar OS #${numeroOS}. Verifique o número e tente novamente.`
    };
  }
};

// Buscar OS por cliente
export const buscarOSCliente = async (clienteId, limite = 5) => {
  try {
    const response = await apiClient.get(`/api/servicos`, {
      params: {
        clienteId,
        limite,
        ordenacao: 'desc'
      }
    });

    return {
      sucesso: true,
      ordensServico: response.data.map(os => ({
        numero: os.id,
        status: os.status,
        data: os.createdAt,
        valor: os.valorTotal || 0,
        descricao: os.descricaoProblema || 'Não informada'
      }))
    };
  } catch (error) {
    return {
      sucesso: false,
      erro: error.message,
      ordensServico: []
    };
  }
};

// Buscar OS por placa do veículo
export const buscarOSPorPlaca = async (placa) => {
  try {
    // Primeiro buscar o veículo pela placa
    const veiculoResponse = await apiClient.get('/api/veiculos', {
      params: { placa: placa.toUpperCase() }
    });

    if (!veiculoResponse.data || veiculoResponse.data.length === 0) {
      return {
        encontrado: false,
        mensagem: `Veículo com placa ${placa} não encontrado no sistema.`
      };
    }

    const veiculo = veiculoResponse.data[0];

    // Buscar OS do veículo
    const osResponse = await apiClient.get('/api/servicos', {
      params: {
        veiculoId: veiculo.id,
        limite: 10,
        ordenacao: 'desc'
      }
    });

    return {
      encontrado: true,
      veiculo: {
        placa: veiculo.placa,
        marca: veiculo.marca,
        modelo: veiculo.modelo,
        ano: veiculo.ano
      },
      ordensServico: osResponse.data.map(os => ({
        numero: os.id,
        status: os.status,
        data: os.createdAt,
        valor: os.valorTotal || 0,
        descricao: os.descricaoProblema || 'Não informada'
      }))
    };
  } catch (error) {
    return {
      encontrado: false,
      erro: error.message,
      mensagem: `Erro ao buscar histórico do veículo ${placa}.`
    };
  }
};

// Consultar status de múltiplas OS
export const consultarMultiplasOS = async (numerosOS) => {
  try {
    const consultas = numerosOS.map(numero => consultarOS(numero));
    const resultados = await Promise.all(consultas);
    
    return {
      sucesso: true,
      resultados: resultados.filter(r => r.encontrado)
    };
  } catch (error) {
    return {
      sucesso: false,
      erro: error.message,
      resultados: []
    };
  }
};

// Buscar OS em andamento (para dashboard)
export const buscarOSEmAndamento = async () => {
  try {
    const response = await apiClient.get('/api/servicos', {
      params: {
        status: 'em_andamento',
        limite: 20,
        ordenacao: 'desc'
      }
    });

    return {
      sucesso: true,
      total: response.data.length,
      ordensServico: response.data.map(os => ({
        numero: os.id,
        cliente: os.cliente?.nome || 'Cliente não informado',
        veiculo: os.veiculo ? `${os.veiculo.marca} ${os.veiculo.modelo}` : 'Veículo não informado',
        status: os.status,
        dataInicio: os.createdAt,
        prioridade: os.prioridade || 'normal',
        mecanico: os.mecanicoResponsavel || 'Não atribuído'
      }))
    };
  } catch (error) {
    return {
      sucesso: false,
      erro: error.message,
      ordensServico: []
    };
  }
};

// Consultar estatísticas rápidas
export const consultarEstatisticas = async () => {
  try {
    const [osAbertas, osAndamento, osConcluidas] = await Promise.all([
      apiClient.get('/api/servicos/count', { params: { status: 'aberta' } }),
      apiClient.get('/api/servicos/count', { params: { status: 'em_andamento' } }),
      apiClient.get('/api/servicos/count', { params: { status: 'concluida' } })
    ]);

    return {
      sucesso: true,
      estatisticas: {
        osAbertas: osAbertas.data.count || 0,
        osEmAndamento: osAndamento.data.count || 0,
        osConcluidas: osConcluidas.data.count || 0,
        totalAtivo: (osAbertas.data.count || 0) + (osAndamento.data.count || 0)
      }
    };
  } catch (error) {
    return {
      sucesso: false,
      erro: error.message,
      estatisticas: {
        osAbertas: 0,
        osEmAndamento: 0,
        osConcluidas: 0,
        totalAtivo: 0
      }
    };
  }
};