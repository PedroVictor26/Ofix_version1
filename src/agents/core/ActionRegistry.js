/**
 * 🗂️ ACTION REGISTRY
 * 
 * Registro central de todas as ações que o agente pode executar
 * Gerencia capacidades, permissões e execução de ações
 */

import { ServiceActions } from '../actions/ServiceActions.js';
import { ClientActions } from '../actions/ClientActions.js';
import { ScheduleActions } from '../actions/ScheduleActions.js';
import { NotificationActions } from '../actions/NotificationActions.js';

class ActionRegistry {
  constructor() {
    this.actions = new Map();
    this.skills = new Map();
    this.integrations = new Map();
    this.isInitialized = false;
  }

  /**
   * Inicializar registro com todas as ações disponíveis
   */
  async initialize() {
    console.log('🗂️ Inicializando Action Registry...');
    
    try {
      // Registrar ações de serviços
      await this.registerServiceActions();
      
      // Registrar ações de clientes
      await this.registerClientActions();
      
      // Registrar ações de agendamento
      await this.registerScheduleActions();
      
      // Registrar ações de notificação
      await this.registerNotificationActions();
      
      // Registrar skills especializadas
      await this.registerSkills();
      
      this.isInitialized = true;
      console.log(`✅ Action Registry inicializado com ${this.actions.size} ações`);
      
    } catch (error) {
      console.error('❌ Erro ao inicializar Action Registry:', error);
      throw error;
    }
  }

  /**
   * Registrar uma ação no sistema
   */
  registerAction(actionType, actionConfig) {
    console.log(`📝 Registrando ação: ${actionType}`);
    
    // Validar configuração da ação
    if (!actionConfig.execute || typeof actionConfig.execute !== 'function') {
      throw new Error(`Ação ${actionType} deve ter um método execute`);
    }
    
    const action = {
      type: actionType,
      description: actionConfig.description || actionType,
      category: actionConfig.category || 'general',
      requiredParams: actionConfig.requiredParams || [],
      optionalParams: actionConfig.optionalParams || [],
      requiresAuth: actionConfig.requiresAuth || false,
      permissions: actionConfig.permissions || [],
      execute: actionConfig.execute,
      examples: actionConfig.examples || [],
      keywords: actionConfig.keywords || [],
      confidence: actionConfig.confidence || 1.0
    };
    
    this.actions.set(actionType, action);
  }

  /**
   * Obter uma ação específica
   */
  getAction(actionType) {
    return this.actions.get(actionType);
  }

  /**
   * Buscar ações por palavras-chave
   */
  findActionsByKeywords(keywords) {
    const results = [];
    
    for (const [actionType, action] of this.actions) {
      const score = this.calculateKeywordMatch(keywords, action.keywords);
      if (score > 0) {
        results.push({
          action: actionType,
          config: action,
          score
        });
      }
    }
    
    // Ordenar por relevância
    results.sort((a, b) => b.score - a.score);
    
    return results;
  }

  /**
   * Calcular correspondência de palavras-chave
   */
  calculateKeywordMatch(inputKeywords, actionKeywords) {
    if (!inputKeywords || !actionKeywords) return 0;
    
    let matches = 0;
    const normalizedInput = inputKeywords.map(k => k.toLowerCase());
    const normalizedAction = actionKeywords.map(k => k.toLowerCase());
    
    for (const keyword of normalizedInput) {
      for (const actionKeyword of normalizedAction) {
        if (keyword.includes(actionKeyword) || actionKeyword.includes(keyword)) {
          matches++;
        }
      }
    }
    
    return matches / Math.max(normalizedInput.length, normalizedAction.length);
  }

  /**
   * Registrar ações de serviços
   */
  async registerServiceActions() {
    const serviceActions = new ServiceActions();
    
    // Criar ordem de serviço
    this.registerAction('service.create', {
      description: 'Criar nova ordem de serviço',
      category: 'service',
      requiredParams: ['descricaoProblema'],
      optionalParams: ['clienteId', 'veiculoId', 'dataPrevisaoEntrega', 'valorTotalEstimado', 'clienteNome', 'clienteTelefone', 'veiculoDescricao'],
      requiresAuth: true,
      permissions: ['service.create'],
      keywords: ['criar', 'ordem', 'serviço', 'os', 'abertura'],
      execute: serviceActions.createOrder.bind(serviceActions),
      examples: [
        'Criar ordem de serviço para problema no motor',
        'Abrir OS para manutenção preventiva'
      ]
    });
    
    // Atualizar status do serviço
    this.registerAction('service.updateStatus', {
      description: 'Atualizar status de uma ordem de serviço',
      category: 'service',
      requiredParams: ['servicoId', 'novoStatus'],
      requiresAuth: true,
      permissions: ['service.update'],
      keywords: ['atualizar', 'status', 'ordem', 'serviço'],
      execute: serviceActions.updateStatus.bind(serviceActions),
      examples: [
        'Marcar serviço como em andamento',
        'Finalizar ordem de serviço'
      ]
    });
    
    // Buscar serviços
    this.registerAction('service.search', {
      description: 'Buscar ordens de serviço',
      category: 'service',
      requiredParams: ['query'],
      optionalParams: ['status', 'clienteId', 'dataInicio', 'dataFim'],
      requiresAuth: true,
      permissions: ['service.read'],
      keywords: ['buscar', 'encontrar', 'serviço', 'ordem', 'consultar'],
      execute: serviceActions.search.bind(serviceActions),
      examples: [
        'Buscar serviços do cliente João',
        'Encontrar OS em andamento'
      ]
    });
  }

  /**
   * Registrar ações de clientes
   */
  async registerClientActions() {
    const clientActions = new ClientActions();
    
    // Criar cliente
    this.registerAction('client.create', {
      description: 'Cadastrar novo cliente',
      category: 'client',
      requiredParams: ['nome', 'contato'],
      optionalParams: ['email', 'endereco', 'cpf'],
      requiresAuth: true,
      permissions: ['client.create'],
      keywords: ['cadastrar', 'cliente', 'novo', 'registrar'],
      execute: clientActions.create.bind(clientActions),
      examples: [
        'Cadastrar novo cliente João Silva',
        'Registrar cliente com telefone 11999999999'
      ]
    });
    
    // Buscar cliente
    this.registerAction('client.search', {
      description: 'Buscar cliente por nome, telefone ou documento',
      category: 'client',
      requiredParams: ['query'],
      requiresAuth: false, // Busca básica pode ser pública
      keywords: ['buscar', 'cliente', 'encontrar', 'procurar'],
      execute: clientActions.search.bind(clientActions),
      examples: [
        'Buscar cliente João',
        'Encontrar cliente pelo telefone 11999999999'
      ]
    });
    
    // Atualizar cliente
    this.registerAction('client.update', {
      description: 'Atualizar dados de um cliente',
      category: 'client',
      requiredParams: ['clienteId'],
      optionalParams: ['nome', 'contato', 'email', 'endereco'],
      requiresAuth: true,
      permissions: ['client.update'],
      keywords: ['atualizar', 'cliente', 'editar', 'modificar'],
      execute: clientActions.update.bind(clientActions),
      examples: [
        'Atualizar telefone do cliente',
        'Modificar endereço do cliente'
      ]
    });
  }

  /**
   * Registrar ações de agendamento
   */
  async registerScheduleActions() {
    const scheduleActions = new ScheduleActions();
    
    // Agendar serviço
    this.registerAction('schedule.book', {
      description: 'Agendar um serviço para data e hora específicas',
      category: 'schedule',
      requiredParams: ['servicoTipo'],
      optionalParams: ['clienteId', 'dataHora', 'data', 'hora', 'observacoes', 'prioridade', 'clienteNome', 'clienteTelefone'],
      requiresAuth: true,
      permissions: ['schedule.create'],
      keywords: ['agendar', 'marcar', 'horário', 'data', 'compromisso'],
      execute: scheduleActions.book.bind(scheduleActions),
      examples: [
        'Agendar revisão para amanhã às 14h',
        'Marcar diagnóstico para sexta-feira'
      ]
    });
    
    // Verificar disponibilidade
    this.registerAction('schedule.checkAvailability', {
      description: 'Verificar horários disponíveis',
      category: 'schedule',
      requiredParams: ['data'],
      optionalParams: ['periodo', 'tipoServico'],
      requiresAuth: false,
      keywords: ['disponibilidade', 'horário', 'livre', 'vago'],
      execute: scheduleActions.checkAvailability.bind(scheduleActions),
      examples: [
        'Verificar disponibilidade para amanhã',
        'Que horários estão livres na sexta?'
      ]
    });
  }

  /**
   * Registrar ações de notificação
   */
  async registerNotificationActions() {
    const notificationActions = new NotificationActions();
    
    // Enviar notificação
    this.registerAction('notification.send', {
      description: 'Enviar notificação para cliente ou funcionário',
      category: 'notification',
      requiredParams: ['destinatario', 'mensagem'],
      optionalParams: ['tipo', 'prioridade', 'canal'],
      requiresAuth: true,
      permissions: ['notification.send'],
      keywords: ['notificar', 'avisar', 'comunicar', 'informar'],
      execute: notificationActions.send.bind(notificationActions),
      examples: [
        'Avisar cliente que serviço está pronto',
        'Notificar equipe sobre urgência'
      ]
    });
    
    // Enviar WhatsApp
    this.registerAction('whatsapp.send', {
      description: 'Enviar mensagem via WhatsApp',
      category: 'notification',
      requiredParams: ['telefone', 'mensagem'],
      requiresAuth: true,
      permissions: ['whatsapp.send'],
      keywords: ['whatsapp', 'wpp', 'zap', 'mensagem'],
      execute: notificationActions.sendWhatsApp.bind(notificationActions),
      examples: [
        'Enviar confirmação por WhatsApp',
        'Mandar lembrete via zap'
      ]
    });
  }

  /**
   * Registrar skills especializadas
   */
  async registerSkills() {
    // TODO: Implementar skills específicas
    console.log('📚 Skills especializadas serão implementadas na Fase 2');
  }

  /**
   * Obter todas as ações disponíveis
   */
  getAvailableActions() {
    return Array.from(this.actions.entries()).map(([type, config]) => ({
      type,
      description: config.description,
      category: config.category,
      requiresAuth: config.requiresAuth,
      keywords: config.keywords
    }));
  }

  /**
   * Obter ações por categoria
   */
  getActionsByCategory(category) {
    const categoryActions = [];
    
    for (const [type, config] of this.actions) {
      if (config.category === category) {
        categoryActions.push({ type, ...config });
      }
    }
    
    return categoryActions;
  }

  /**
   * Verificar se ação existe
   */
  hasAction(actionType) {
    return this.actions.has(actionType);
  }

  /**
   * Obter skills disponíveis
   */
  getAvailableSkills() {
    return Array.from(this.skills.keys());
  }

  /**
   * Obter integrações disponíveis
   */
  getAvailableIntegrations() {
    return Array.from(this.integrations.keys());
  }

  /**
   * Health check do registry
   */
  async healthCheck() {
    return this.isInitialized && this.actions.size > 0;
  }
}

export { ActionRegistry };
