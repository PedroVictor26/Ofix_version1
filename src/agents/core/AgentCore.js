/**
 * 🤖 MATIAS AGENT CORE
 * 
 * Motor principal do agente inteligente Matias
 * Responsável por orquestrar todas as capacidades do agente
 */

import { ActionRegistry } from './ActionRegistry.js';
import { DecisionEngine } from './DecisionEngine.js';
import { ContextManager } from './ContextManager.js';

class AgentCore {
  constructor() {
    this.actionRegistry = new ActionRegistry();
    this.decisionEngine = new DecisionEngine(this.actionRegistry);
    this.contextManager = new ContextManager();
    this.isInitialized = false;
  }

  /**
   * Inicializar o agente e todos os seus componentes
   */
  async initialize() {
    console.log('🤖 Inicializando Matias Agent Core...');
    
    try {
      // Inicializar componentes
      await this.actionRegistry.initialize();
      await this.decisionEngine.initialize();
      await this.contextManager.initialize();
      
      this.isInitialized = true;
      console.log('✅ Matias Agent Core inicializado com sucesso!');
      
      return {
        success: true,
        message: 'Agente inicializado',
        capabilities: this.getCapabilities()
      };
    } catch (error) {
      console.error('❌ Erro ao inicializar Agent Core:', error);
      throw error;
    }
  }

  /**
   * Processar uma mensagem/comando e executar ações apropriadas
   */
  async processMessage(message, context = {}) {
    if (!this.isInitialized) {
      throw new Error('Agente não foi inicializado. Chame initialize() primeiro.');
    }

    console.log('📩 Processando mensagem:', message.substring(0, 100) + '...');
    
    try {
      // 1. Enriquecer contexto com dados persistentes
      const enrichedContext = await this.contextManager.enrichContext(context);
      
      // 2. Analisar intenção e decidir ações
      const decision = await this.decisionEngine.processIntent(message, enrichedContext);
      
      // 3. Executar ações se necessário
      const executionResults = [];
      if (decision.actions && decision.actions.length > 0) {
        // Separar ações primárias de fallbacks
        const primaryActions = decision.actions.filter(action => !action.fallback);
        const fallbackActions = decision.actions.filter(action => action.fallback);
        
        // Executar ações primárias primeiro
        for (const action of primaryActions) {
          console.log(`⚡ Executando ação: ${action.type}`);
          try {
            const result = await this.executeAction(action, enrichedContext);
            executionResults.push(result);
            
            // Se foi uma busca de cliente bem-sucedida, atualizar contexto
            if (action.type === 'client.search' && result.success && result.result) {
              // Verificar se a busca foi bem-sucedida e tem dados
              if (result.result.success && result.result.data && result.result.data.length > 0) {
                const clientData = result.result.data[0]; // Primeiro cliente encontrado
                
                if (clientData) {
                  enrichedContext.lastClientId = clientData.id || clientData.clienteId;
                  enrichedContext.lastVehicleId = clientData.veiculoId;
                  
                  // Atualizar parâmetros das próximas ações se aplicável
                  for (let i = decision.actions.indexOf(action) + 1; i < decision.actions.length; i++) {
                    const nextAction = decision.actions[i];
                    
                    if (nextAction.type === 'service.create' && !nextAction.parameters.clienteId) {
                      nextAction.parameters.clienteId = clientData.id || clientData.clienteId;
                      
                      // Se temos dados do veículo, incluir também
                      if (clientData.veiculoId) {
                        nextAction.parameters.veiculoId = clientData.veiculoId;
                      } else if (clientData.veiculos && clientData.veiculos.length > 0) {
                        // Se não tem veiculoId estruturado, usar o primeiro veículo como referência
                        const veiculo = clientData.veiculos[0];
                        nextAction.parameters.veiculoDescricao = veiculo;
                        
                        // Criar um veiculoId temporário baseado no cliente
                        nextAction.parameters.veiculoId = `VEI-${clientData.id}-001`;
                      }
                    }
                  }
                  
                  // Cliente encontrado - remover fallbacks de criação de cliente
                  fallbackActions.splice(0, fallbackActions.length, 
                    ...fallbackActions.filter(fa => fa.type !== 'client.create'));
                }
              } else {
                // Busca não encontrou cliente - executar fallbacks relevantes
                console.log('⚠️ Cliente não encontrado - executando fallbacks');
              }
            }
          } catch (error) {
            const failedResult = {
              action: action.type,
              success: false,
              error: error.message,
              parameters: action.parameters
            };
            executionResults.push(failedResult);
          }
        }
        
        // Executar ações de fallback se necessário
        for (const fallbackAction of fallbackActions) {
          console.log(`🔄 Executando fallback: ${fallbackAction.type}`);
          try {
            const result = await this.executeAction(fallbackAction, enrichedContext);
            executionResults.push(result);
            
            // Se criou cliente com sucesso, atualizar contexto para próximas ações
            if (fallbackAction.type === 'client.create' && result.success) {
              enrichedContext.lastClientId = result.result?.data?.id;
              
              // Atualizar ações subsequentes com o novo clienteId
              for (const remainingAction of decision.actions) {
                if (remainingAction.type === 'service.create' && !remainingAction.parameters.clienteId) {
                  remainingAction.parameters.clienteId = result.result?.data?.id;
                }
              }
            }
          } catch (error) {
            const failedResult = {
              action: fallbackAction.type,
              success: false,
              error: error.message,
              parameters: fallbackAction.parameters
            };
            executionResults.push(failedResult);
          }
        }
      }
      
      // 4. Salvar contexto atualizado
      await this.contextManager.saveInteraction(message, decision, executionResults, enrichedContext);
      
      // 5. Gerar resposta final
      const response = await this.generateResponse(decision, executionResults, enrichedContext);
      
      console.log('✅ Mensagem processada com sucesso');
      
      return {
        success: true,
        response,
        actions_executed: executionResults,
        decision_confidence: decision.confidence,
        context_used: enrichedContext.sources || []
      };
      
    } catch (error) {
      console.error('❌ Erro ao processar mensagem:', error);
      
      return {
        success: false,
        error: error.message,
        fallback_response: 'Desculpe, tive um problema para processar sua solicitação. Pode tentar novamente?'
      };
    }
  }

  /**
   * Executar uma ação específica
   */
  async executeAction(action, context) {
    console.log(`🔧 Executando ação: ${action.type}`);
    
    try {
      // Buscar a ação no registry
      const actionHandler = this.actionRegistry.getAction(action.type);
      
      if (!actionHandler) {
        throw new Error(`Ação não encontrada: ${action.type}`);
      }
      
      // Validar parâmetros
      if (actionHandler.requiredParams) {
        for (const param of actionHandler.requiredParams) {
          if (!action.parameters || !action.parameters[param]) {
            throw new Error(`Parâmetro obrigatório ausente: ${param}`);
          }
        }
      }
      
      // Verificar permissões
      if (actionHandler.requiresAuth && !context.user) {
        throw new Error('Ação requer autenticação');
      }
      
      // Executar ação
      const startTime = Date.now();
      const result = await actionHandler.execute(action.parameters, context);
      const executionTime = Date.now() - startTime;
      
      // Registrar métricas
      await this.recordMetrics(action.type, executionTime, true, result);
      
      console.log(`✅ Ação ${action.type} executada com sucesso em ${executionTime}ms`);
      
      return {
        action: action.type,
        success: true,
        result,
        executionTime,
        timestamp: new Date()
      };
      
    } catch (error) {
      console.error(`❌ Erro ao executar ação ${action.type}:`, error);
      
      // Registrar métricas de erro
      await this.recordMetrics(action.type, 0, false, { error: error.message });
      
      return {
        action: action.type,
        success: false,
        error: error.message,
        timestamp: new Date()
      };
    }
  }

  /**
   * Gerar resposta baseada na decisão e resultados das ações
   */
  async generateResponse(decision, executionResults, context) {
    // Se há ações executadas, incluir seus resultados na resposta
    let responseText = decision.response || '';
    
    // Adicionar informações sobre ações executadas
    const successfulActions = executionResults.filter(r => r.success);
    const failedActions = executionResults.filter(r => !r.success);
    
    if (successfulActions.length > 0) {
      responseText += '\n\n✅ **Ações realizadas:**\n';
      successfulActions.forEach(action => {
        responseText += `• ${this.getActionDescription(action)}\n`;
      });
    }
    
    if (failedActions.length > 0) {
      responseText += '\n\n📋 **Para completar a ação, preciso de:**\n';
      failedActions.forEach(action => {
        if (action.error && action.error.includes('clienteId')) {
          responseText += `• **Nome do cliente** (ex: João Silva)\n`;
          responseText += `• **Telefone do cliente** (ex: 11999999999)\n`;
        }
        if (action.error && action.error.includes('veiculoId')) {
          responseText += `• **Placa do veículo** (ex: ABC-1234)\n`;
          responseText += `• **Modelo do veículo** (ex: Honda Civic)\n`;
        }
      });
      
      responseText += `\n💬 **Exemplo completo:**\n`;
      responseText += `"Criar OS para troca de óleo do cliente João Silva, telefone 11999999999, Honda Civic placa ABC-1234"`;
    }
    
    return {
      text: responseText.trim(),
      actions: executionResults,
      confidence: decision.confidence,
      suggestions: decision.suggestions || [],
      metadata: {
        processing_time: Date.now() - context.start_time,
        context_sources: context.sources?.length || 0,
        actions_executed: successfulActions.length,
        actions_failed: failedActions.length
      }
    };
  }

  /**
   * Obter descrição amigável de uma ação executada
   */
  getActionDescription(actionResult) {
    const descriptions = {
      'service.create': 'Ordem de serviço criada',
      'client.create': 'Cliente cadastrado',
      'schedule.book': 'Agendamento realizado',
      'notification.send': 'Notificação enviada',
      'diagnostic.analyze': 'Diagnóstico realizado'
    };
    
    return descriptions[actionResult.action] || actionResult.action;
  }

  /**
   * Registrar métricas de execução
   */
  async recordMetrics(actionType, executionTime, success, _result) {
    try {
      // TODO: Implementar persistência de métricas
      console.log(`📊 Métrica registrada: ${actionType} - ${success ? 'sucesso' : 'erro'} - ${executionTime}ms`);
    } catch (error) {
      console.error('Erro ao registrar métricas:', error);
    }
  }

  /**
   * Obter capacidades atuais do agente
   */
  getCapabilities() {
    if (!this.isInitialized) {
      return [];
    }
    
    return {
      actions: this.actionRegistry.getAvailableActions(),
      skills: this.actionRegistry.getAvailableSkills(),
      integrations: this.actionRegistry.getAvailableIntegrations(),
      version: '1.0.0'
    };
  }

  /**
   * Verificar saúde do agente
   */
  async healthCheck() {
    try {
      const checks = {
        core: this.isInitialized,
        actionRegistry: await this.actionRegistry.healthCheck(),
        decisionEngine: await this.decisionEngine.healthCheck(),
        contextManager: await this.contextManager.healthCheck()
      };
      
      const allHealthy = Object.values(checks).every(check => check === true);
      
      return {
        healthy: allHealthy,
        checks,
        timestamp: new Date()
      };
    } catch (error) {
      return {
        healthy: false,
        error: error.message,
        timestamp: new Date()
      };
    }
  }
}

export default AgentCore;
