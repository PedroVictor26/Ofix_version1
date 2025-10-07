/**
 * 🔧 SERVICE ACTIONS
 * 
 * Ações relacionadas a ordens de serviço
 * Primeira implementação do sistema de ações do agente
 */

// TODO: Importar serviços reais quando disponíveis
// import { servicosService } from '../../services/servicos.service.js';

class ServiceActions {
  constructor() {
    this.name = 'ServiceActions';
    this.version = '1.0.0';
  }

  /**
   * Criar nova ordem de serviço
   */
  async createOrder(parameters, context) {
    console.log('🔧 Executando: Criar ordem de serviço');
    console.log('📋 Parâmetros:', parameters);
    
    try {
      // Validar parâmetros obrigatórios
      const { descricaoProblema } = parameters;
      
      if (!descricaoProblema) {
        throw new Error('Descrição do problema é obrigatória');
      }
      
      // Preparar dados da ordem de serviço
      const orderData = {
        numeroOs: this.generateOrderNumber(),
        status: 'ABERTO',
        descricaoProblema,
        dataEntrada: new Date(),
        valorTotalEstimado: parameters.valorTotalEstimado || 0,
        observacoes: `Criado automaticamente pelo Matias em ${new Date().toLocaleString()}`,
        
        // Dados do contexto se disponíveis
        clienteId: parameters.clienteId || context.clienteId || 'CLIENTE_PENDENTE',
        veiculoId: parameters.veiculoId || context.veiculoId || 'VEICULO_PENDENTE',
        responsavelId: context.user?.id,
        oficinaId: context.user?.oficinaId,
        
        // Informações adicionais para OS sem cliente definido
        clienteNome: parameters.clienteNome || 'A definir',
        clienteTelefone: parameters.clienteTelefone || 'A definir',
        veiculoDescricao: parameters.veiculoDescricao || 'A definir'
      };
      
      // TODO: Chamar serviço real quando disponível
      // const result = await servicosService.createServico(orderData);
      
      // Simulação por enquanto
      const result = {
        id: `OS-${Date.now()}`,
        numeroOs: orderData.numeroOs,
        status: orderData.status,
        descricaoProblema: orderData.descricaoProblema,
        dataEntrada: orderData.dataEntrada,
        valorTotalEstimado: orderData.valorTotalEstimado
      };
      
      console.log('✅ Ordem de serviço criada:', result.numeroOs);
      
      return {
        success: true,
        message: `Ordem de serviço ${result.numeroOs} criada com sucesso`,
        data: result,
        actions_suggested: [
          {
            type: 'notification.send',
            description: 'Notificar cliente sobre abertura da OS',
            auto_execute: false
          },
          {
            type: 'schedule.book',
            description: 'Agendar diagnóstico inicial',
            auto_execute: false
          }
        ]
      };
      
    } catch (error) {
      console.error('❌ Erro ao criar ordem de serviço:', error);
      
      return {
        success: false,
        message: `Erro ao criar ordem de serviço: ${error.message}`,
        error: error.message,
        suggestions: [
          'Verifique se todos os dados obrigatórios foram fornecidos',
          'Confirme se o cliente está cadastrado no sistema'
        ]
      };
    }
  }

  /**
   * Atualizar status de ordem de serviço
   */
  async updateStatus(parameters, context) {
    console.log('🔧 Executando: Atualizar status da OS');
    console.log('📋 Parâmetros:', parameters);
    
    try {
      const { servicoId, novoStatus } = parameters;
      
      if (!servicoId || !novoStatus) {
        throw new Error('ID do serviço e novo status são obrigatórios');
      }
      
      // Validar status
      const validStatuses = ['ABERTO', 'EM_ANDAMENTO', 'AGUARDANDO_PECA', 'CONCLUIDO', 'ENTREGUE', 'CANCELADO'];
      if (!validStatuses.includes(novoStatus)) {
        throw new Error(`Status inválido. Valores aceitos: ${validStatuses.join(', ')}`);
      }
      
      // TODO: Chamar serviço real
      // const result = await servicosService.updateServico(servicoId, { status: novoStatus });
      
      // Simulação
      const result = {
        id: servicoId,
        status: novoStatus,
        dataAtualizacao: new Date(),
        responsavelAtualizacao: context.user?.id
      };
      
      console.log(`✅ Status atualizado para: ${novoStatus}`);
      
      return {
        success: true,
        message: `Status da ordem de serviço atualizado para ${novoStatus}`,
        data: result,
        actions_suggested: this.getStatusChangeActions(novoStatus)
      };
      
    } catch (error) {
      console.error('❌ Erro ao atualizar status:', error);
      
      return {
        success: false,
        message: `Erro ao atualizar status: ${error.message}`,
        error: error.message
      };
    }
  }

  /**
   * Buscar ordens de serviço
   */
  async search(parameters, _context) {
    console.log('🔧 Executando: Buscar ordens de serviço');
    console.log('📋 Parâmetros:', parameters);
    
    try {
      const { query } = parameters;
      
      if (!query) {
        throw new Error('Termo de busca é obrigatório');
      }
      
      // TODO: Implementar busca real
      // const results = await servicosService.searchServicos(query, parameters);
      
      // Simulação
      const results = [
        {
          id: 'OS-001',
          numeroOs: 'OS-2024-001',
          status: 'EM_ANDAMENTO',
          descricaoProblema: 'Barulho no motor',
          cliente: 'João Silva',
          veiculo: 'Honda Civic - ABC-1234',
          dataEntrada: new Date('2024-01-15')
        },
        {
          id: 'OS-002',
          numeroOs: 'OS-2024-002',
          status: 'ABERTO',
          descricaoProblema: 'Problema no freio',
          cliente: 'Maria Santos',
          veiculo: 'Toyota Corolla - XYZ-5678',
          dataEntrada: new Date('2024-01-16')
        }
      ];
      
      // Filtrar resultados baseado na query
      const filteredResults = results.filter(os => 
        os.descricaoProblema.toLowerCase().includes(query.toLowerCase()) ||
        os.cliente.toLowerCase().includes(query.toLowerCase()) ||
        os.numeroOs.toLowerCase().includes(query.toLowerCase())
      );
      
      console.log(`✅ ${filteredResults.length} resultados encontrados`);
      
      return {
        success: true,
        message: `${filteredResults.length} ordem${filteredResults.length !== 1 ? 'ns' : ''} de serviço encontrada${filteredResults.length !== 1 ? 's' : ''}`,
        data: filteredResults,
        query,
        total: filteredResults.length
      };
      
    } catch (error) {
      console.error('❌ Erro ao buscar ordens de serviço:', error);
      
      return {
        success: false,
        message: `Erro na busca: ${error.message}`,
        error: error.message
      };
    }
  }

  /**
   * Gerar número sequencial para ordem de serviço
   */
  generateOrderNumber() {
    const year = new Date().getFullYear();
    const sequence = Math.floor(Math.random() * 9999) + 1;
    return `OS-${year}-${sequence.toString().padStart(4, '0')}`;
  }

  /**
   * Obter ações sugeridas baseadas na mudança de status
   */
  getStatusChangeActions(novoStatus) {
    const actionMap = {
      'EM_ANDAMENTO': [
        {
          type: 'notification.send',
          description: 'Notificar cliente que serviço foi iniciado',
          priority: 'normal'
        }
      ],
      'AGUARDANDO_PECA': [
        {
          type: 'notification.send',
          description: 'Informar cliente sobre demora por falta de peça',
          priority: 'high'
        },
        {
          type: 'stock.order',
          description: 'Solicitar peça em falta',
          priority: 'high'
        }
      ],
      'CONCLUIDO': [
        {
          type: 'notification.send',
          description: 'Avisar cliente que serviço está pronto',
          priority: 'high'
        },
        {
          type: 'invoice.generate',
          description: 'Gerar fatura do serviço',
          priority: 'normal'
        }
      ],
      'ENTREGUE': [
        {
          type: 'feedback.request',
          description: 'Solicitar avaliação do cliente',
          priority: 'low'
        }
      ]
    };
    
    return actionMap[novoStatus] || [];
  }

  /**
   * Obter métricas das ações de serviço
   */
  async getMetrics(timeframe = '7d') {
    // TODO: Implementar coleta de métricas reais
    return {
      orders_created: 0,
      orders_updated: 0,
      search_queries: 0,
      success_rate: 1.0,
      avg_processing_time: 0,
      timeframe
    };
  }

  /**
   * Health check das ações de serviço
   */
  async healthCheck() {
    try {
      // Verificar se consegue gerar número de OS
      const testNumber = this.generateOrderNumber();
      const isValid = testNumber && testNumber.startsWith('OS-');
      
      return isValid;
    } catch (error) {
      console.error('❌ Health check ServiceActions falhou:', error);
      return false;
    }
  }
}

export { ServiceActions };
