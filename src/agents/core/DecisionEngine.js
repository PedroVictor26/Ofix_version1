/**
 * 🧠 DECISION ENGINE
 * 
 * Motor de tomada de decisões do agente
 * Analisa mensagens, extrai intenções e decide quais ações executar
 */

class DecisionEngine {
  constructor(actionRegistry) {
    this.actionRegistry = actionRegistry;
    this.isInitialized = false;
    
    // Padrões de intenção para análise de linguagem natural
    this.intentPatterns = {
      // Criação/Cadastro
      create: {
        keywords: ['criar', 'cadastrar', 'novo', 'registrar', 'adicionar', 'abrir', 'ordem', 'os'],
        entities: ['cliente', 'serviço', 'ordem', 'os', 'agendamento'],
        confidence: 0.8
      },
      
      // Busca/Consulta
      search: {
        keywords: ['buscar', 'encontrar', 'procurar', 'consultar', 'ver', 'mostrar'],
        entities: ['cliente', 'serviço', 'ordem', 'histórico', 'dados'],
        confidence: 0.7
      },
      
      // Atualização
      update: {
        keywords: ['atualizar', 'modificar', 'alterar', 'editar', 'mudar'],
        entities: ['status', 'dados', 'informação', 'cliente', 'serviço'],
        confidence: 0.8
      },
      
      // Agendamento
      schedule: {
        keywords: ['agendar', 'marcar', 'reservar', 'horário'],
        entities: ['consulta', 'serviço', 'revisão', 'manutenção'],
        confidence: 0.9
      },
      
      // Notificação
      notify: {
        keywords: ['avisar', 'notificar', 'comunicar', 'informar', 'mandar'],
        entities: ['cliente', 'mensagem', 'whatsapp', 'email'],
        confidence: 0.7
      },
      
      // Diagnóstico
      diagnose: {
        keywords: ['problema', 'defeito', 'barulho', 'diagnóstico', 'análise'],
        entities: ['carro', 'veículo', 'motor', 'freio', 'transmissão'],
        confidence: 0.8
      }
    };
  }

  /**
   * Inicializar motor de decisões
   */
  async initialize() {
    console.log('🧠 Inicializando Decision Engine...');
    
    try {
      // TODO: Carregar modelos de ML se necessário
      // TODO: Inicializar processamento de NLP
      
      this.isInitialized = true;
      console.log('✅ Decision Engine inicializado');
      
    } catch (error) {
      console.error('❌ Erro ao inicializar Decision Engine:', error);
      throw error;
    }
  }

  /**
   * Processar intenção de uma mensagem e decidir ações
   */
  async processIntent(message, context = {}) {
    console.log('🧠 Analisando intenção da mensagem...');
    
    try {
      // 1. Limpar e normalizar mensagem
      const normalizedMessage = this.normalizeMessage(message);
      
      // 2. Extrair intenção principal
      const intent = this.extractIntent(normalizedMessage);
      
      // 3. Extrair entidades e parâmetros
      const entities = this.extractEntities(normalizedMessage, intent);
      
      // 4. Determinar ações necessárias
      const actions = await this.determineActions(intent, entities, context);
      
      // 5. Gerar resposta textual
      const response = this.generateResponse(intent, entities, actions, context);
      
      const decision = {
        intent: intent.type,
        confidence: intent.confidence,
        entities,
        actions,
        response,
        suggestions: this.generateSuggestions(intent, entities),
        requiresConfirmation: this.requiresConfirmation(actions)
      };
      
      console.log(`✅ Intenção processada: ${intent.type} (confiança: ${intent.confidence})`);
      console.log(`⚡ ${actions.length} ações determinadas`);
      
      return decision;
      
    } catch (error) {
      console.error('❌ Erro ao processar intenção:', error);
      
      return {
        intent: 'unknown',
        confidence: 0,
        entities: {},
        actions: [],
        response: 'Desculpe, não consegui entender sua solicitação. Pode reformular?',
        suggestions: ['Tente ser mais específico', 'Use palavras-chave como "criar", "buscar", "agendar"'],
        requiresConfirmation: false
      };
    }
  }

  /**
   * Normalizar mensagem para processamento
   */
  normalizeMessage(message) {
    return message
      .toLowerCase()
      .trim()
      .replace(/[^\w\s]/g, ' ') // Remove pontuação
      .replace(/\s+/g, ' '); // Múltiplos espaços viram um
  }

  /**
   * Extrair intenção principal da mensagem
   */
  extractIntent(normalizedMessage) {
    const words = normalizedMessage.split(' ');
    let bestIntent = { type: 'unknown', confidence: 0 };
    
    // Verificar saudações primeiro (alta prioridade)
    const greetings = ['oi', 'olá', 'ola', 'bom dia', 'boa tarde', 'boa noite', 'e aí', 'tudo bem'];
    if (greetings.some(greeting => normalizedMessage.includes(greeting))) {
      return { type: 'greeting', confidence: 0.9 };
    }
    
    // Verificar perguntas informativas (segunda prioridade)
    const infoQuestions = [
      'principais serviços', 'serviços', 'o que vocês fazem', 'que serviços', 
      'como funciona', 'preços', 'valores', 'horário', 'horarios', 
      'funcionamento', 'endereço', 'onde fica', 'telefone', 'contato',
      'especialidades', 'tipos de serviço', 'quais serviços'
    ];
    if (infoQuestions.some(question => normalizedMessage.includes(question))) {
      return { type: 'info_request', confidence: 0.85 };
    }
    
    // Padrões mais específicos para melhor detecção
    const specificPatterns = {
      // Busca tem palavras muito específicas
      search: {
        keywords: ['buscar', 'encontrar', 'procurar', 'consultar', 'verificar', 'mostrar'],
        triggers: ['buscar cliente', 'encontrar cliente', 'procurar por'],
        boost: normalizedMessage.includes('buscar') || normalizedMessage.includes('encontrar') ? 2 : 1
      },
      
      // Schedule deve ter palavras de tempo
      schedule: {
        keywords: ['agendar', 'marcar', 'reservar'],
        triggers: ['agendar', 'marcar horário', 'para amanhã', 'às '],
        timeWords: ['amanhã', 'hoje', 'segunda', 'terça', 'h', ':'],
        boost: (normalizedMessage.includes('agendar') || 
                normalizedMessage.match(/\d+h|\d+:\d+|amanhã|hoje/)) ? 3 : 1
      },
      
      // Create deve ter contexto de criação MUITO específico
      create: {
        keywords: ['criar', 'novo', 'registrar', 'cadastrar', 'abrir', 'adicionar'],
        triggers: ['criar os', 'nova ordem', 'abrir ordem', 'registrar cliente', 'nova os', 'criar ordem'],
        mustHave: ['os', 'ordem', 'cliente', 'cadastrar'], // Deve ter pelo menos uma dessas
        boost: (normalizedMessage.includes('criar') && 
                (normalizedMessage.includes('os') || normalizedMessage.includes('ordem'))) ? 3 : 0.5
      }
    };
    
    // Verificar padrões específicos primeiro
    for (const [intentType, specific] of Object.entries(specificPatterns)) {
      let score = 0;
      let matches = 0;
      
      // Verificar triggers (padrões mais específicos)
      for (const trigger of specific.triggers) {
        if (normalizedMessage.includes(trigger)) {
          score += 3 * specific.boost;
          matches += 2;
        }
      }
      
      // Verificar palavras-chave
      for (const keyword of specific.keywords) {
        if (normalizedMessage.includes(keyword)) {
          score += 1 * specific.boost;
          matches++;
        }
      }
      
      // Para 'create', verificar se tem contexto obrigatório
      if (intentType === 'create' && specific.mustHave) {
        const hasRequiredContext = specific.mustHave.some(required => 
          normalizedMessage.includes(required)
        );
        if (!hasRequiredContext) {
          score = 0; // Zerar score se não tem contexto obrigatório
          matches = 0;
        }
      }
      
      // Verificar palavras de tempo para schedule
      if (intentType === 'schedule' && specific.timeWords) {
        for (const timeWord of specific.timeWords) {
          if (normalizedMessage.includes(timeWord)) {
            score += 2;
            matches++;
          }
        }
      }
      
      // Calcular confiança com boost
      const confidence = matches > 0 ? 
        (score / (words.length + specific.keywords.length)) * specific.boost : 0;
      
      if (confidence > bestIntent.confidence) {
        bestIntent = { type: intentType, confidence, matches, score };
      }
    }
    
    // Se não encontrou padrão específico, usar padrões originais
    if (bestIntent.confidence < 0.3) {
      for (const [intentType, pattern] of Object.entries(this.intentPatterns)) {
        let score = 0;
        let matches = 0;
        
        // Verificar palavras-chave
        for (const keyword of pattern.keywords) {
          for (const word of words) {
            if (word.includes(keyword) || keyword.includes(word)) {
              score += 1;
              matches++;
            }
          }
        }
        
        // Verificar entidades
        for (const entity of pattern.entities) {
          for (const word of words) {
            if (word.includes(entity) || entity.includes(word)) {
              score += 0.5;
              matches++;
            }
          }
        }
        
        // Calcular confiança
        const confidence = matches > 0 ? 
          (score / words.length) * pattern.confidence : 0;
        
        if (confidence > bestIntent.confidence) {
          bestIntent = { type: intentType, confidence, matches, score };
        }
      }
    }
    
    return bestIntent;
  }

  /**
   * Extrair entidades da mensagem
   */
  extractEntities(normalizedMessage, intent) {
    const entities = {};
    
    // Padrões de extração de entidades
    const entityPatterns = {
      // Nomes de pessoas (simplificado)
      clientName: /\b([A-Z][a-z]+\s[A-Z][a-z]+)\b/g,
      
      // Telefones
      phone: /\b(\d{2}\s?\d{4,5}-?\d{4})\b/g,
      
      // Datas
      date: /\b(hoje|amanhã|segunda|terça|quarta|quinta|sexta|sábado|domingo|\d{1,2}\/\d{1,2})\b/g,
      
      // Horários
      time: /\b(\d{1,2}h\d{0,2}|\d{1,2}:\d{2})\b/g,
      
      // Placas de veículos (formato brasileiro)
      plate: /\b([A-Z]{3}-?\d{4}|[A-Z]{3}\d[A-Z]\d{2})\b/g,
      
      // Valores monetários
      money: /\bR?\$?\s?(\d+(?:\.\d{3})*(?:,\d{2})?)\b/g
    };
    
    // Extrair entidades usando regex
    for (const [entityType, pattern] of Object.entries(entityPatterns)) {
      const matches = normalizedMessage.match(pattern);
      if (matches) {
        entities[entityType] = matches[0];
      }
    }
    
    // Entidades específicas por intenção
    if (intent.type === 'create') {
      // Para criar OS, procurar por tipos de serviço específicos
      const services = ['troca de óleo', 'óleo', 'revisão', 'manutenção', 'filtro', 'reparo', 'diagnóstico'];
      entities.serviceType = services.find(s => normalizedMessage.includes(s));
      
      // Se menciona OS ou ordem, é definitivamente criação de ordem de serviço
      if (normalizedMessage.includes('os') || normalizedMessage.includes('ordem')) {
        entities.isServiceOrder = true;
      }
      
      // Detecção específica para troca de óleo
      if (normalizedMessage.includes('troca') && normalizedMessage.includes('óleo')) {
        entities.serviceType = 'troca de óleo';
        entities.isServiceOrder = true;
      }
    }
    
    if (intent.type === 'diagnose') {
      // Procurar por problemas específicos
      const problems = ['barulho', 'ruído', 'vibração', 'fumaça', 'vazamento'];
      const parts = ['motor', 'freio', 'transmissão', 'suspensão', 'ar condicionado'];
      const services = ['troca de óleo', 'óleo', 'revisão', 'manutenção', 'filtro'];
      
      entities.problem = problems.find(p => normalizedMessage.includes(p));
      entities.part = parts.find(p => normalizedMessage.includes(p));
      entities.serviceType = services.find(s => normalizedMessage.includes(s));
    }
    
    if (intent.type === 'schedule') {
      // Procurar por tipos de serviço específicos para agendamento
      const serviceTypes = ['revisão', 'manutenção', 'reparo', 'diagnóstico', 'troca', 'troca de óleo', 'óleo'];
      entities.serviceType = serviceTypes.find(s => normalizedMessage.includes(s)) || 'Revisão geral';
    }
    
    // Para qualquer intenção, tentar identificar tipos de serviço
    const allServiceTypes = ['troca de óleo', 'óleo', 'revisão', 'manutenção', 'reparo', 'diagnóstico'];
    if (!entities.serviceType) {
      entities.serviceType = allServiceTypes.find(s => normalizedMessage.includes(s));
    }
    
    return entities;
  }

  /**
   * Determinar ações necessárias baseadas na intenção
   */
  async determineActions(intent, entities, context) {
    const actions = [];
    
    switch (intent.type) {
      case 'greeting':
        actions.push(...await this.handleGreetingIntent(entities, context));
        break;
        
      case 'info_request':
        actions.push(...await this.handleInfoRequestIntent(entities, context));
        break;
        
      case 'create':
        actions.push(...await this.handleCreateIntent(entities, context));
        break;
        
      case 'search':
        actions.push(...await this.handleSearchIntent(entities, context));
        break;
        
      case 'update':
        actions.push(...await this.handleUpdateIntent(entities, context));
        break;
        
      case 'schedule':
        actions.push(...await this.handleScheduleIntent(entities, context));
        break;
        
      case 'notify':
        actions.push(...await this.handleNotifyIntent(entities, context));
        break;
        
      case 'diagnose':
        actions.push(...await this.handleDiagnoseIntent(entities, context));
        break;
        
      default:
        // Intenção não reconhecida - sugerir ações genéricas
        break;
    }
    
    return actions;
  }

  /**
   * Lidar com saudações
   */
  async handleGreetingIntent(_entities, _context) {
    // Saudações não precisam de ações específicas, apenas resposta amigável
    return [];
  }

  /**
   * Lidar com perguntas informativas
   */
  async handleInfoRequestIntent(_entities, _context) {
    // Perguntas sobre serviços e informações não precisam de ações, apenas resposta informativa
    return [];
  }

  /**
   * Lidar com intenção de criação
   */
  async handleCreateIntent(entities, _context) {
    const actions = [];
    
    // Verificar se é criação de ordem de serviço
    const isServiceOrder = entities.isServiceOrder || entities.serviceType || 
                          entities.problem || entities.part;
    
    // Se há informações de cliente, buscar cliente primeiro
    if (entities.clientName || entities.phone) {
      actions.push({
        type: 'client.search',
        parameters: {
          query: entities.clientName || entities.phone
        },
        confidence: 0.9
      });
      
      // Se temos dados completos do cliente, incluir criação como fallback
      if (entities.clientName && entities.phone) {
        actions.push({
          type: 'client.create',
          parameters: {
            nome: entities.clientName,
            contato: entities.phone
          },
          confidence: 0.8,
          fallback: true,
          description: 'Criar cliente se não encontrado na busca'
        });
      }
    }
    
    // Se é ordem de serviço, criar a OS
    if (isServiceOrder) {
      let descricaoProblema = '';
      let tipoServico = 'SERVICO_GERAL';
      
      if (entities.serviceType) {
        if (entities.serviceType.includes('óleo')) {
          tipoServico = 'TROCA_OLEO';
          descricaoProblema = 'Troca de óleo do motor';
        } else {
          descricaoProblema = entities.serviceType;
          // Mapear outros tipos de serviço
          if (entities.serviceType.includes('revisão')) {
            tipoServico = 'REVISAO';
          } else if (entities.serviceType.includes('reparo')) {
            tipoServico = 'REPARO';
          }
        }
      } else {
        descricaoProblema = `${entities.problem || 'Serviço'} ${entities.part ? 'no ' + entities.part : ''}`.trim();
      }
      
      // Preparar parâmetros da OS
      const serviceParams = {
        descricaoProblema,
        tipoServico
      };
      
      // Se temos informações do cliente e veículo, incluir na OS
      if (entities.clientName) {
        serviceParams.clienteNome = entities.clientName;
      }
      if (entities.phone) {
        serviceParams.clienteTelefone = entities.phone;
      }
      if (entities.plate) {
        serviceParams.veiculoPlaca = entities.plate;
      }
      
      actions.push({
        type: 'service.create',
        parameters: serviceParams,
        confidence: 0.8
      });
    }
    
    return actions;
  }

  /**
   * Lidar com intenção de busca
   */
  async handleSearchIntent(entities, _context) {
    const actions = [];
    
    // Buscar cliente primeiro
    if (entities.clientName || entities.phone) {
      actions.push({
        type: 'client.search',
        parameters: {
          query: entities.clientName || entities.phone
        },
        confidence: 0.9
      });
      
      // Se temos dados suficientes para criar cliente, adicionar como fallback
      if (entities.clientName && entities.phone) {
        actions.push({
          type: 'client.create',
          parameters: {
            nome: entities.clientName,
            contato: entities.phone
          },
          confidence: 0.7,
          fallback: true, // Executar apenas se search não encontrar nada
          description: 'Criar cliente se não encontrado'
        });
      }
    }
    
    // Buscar por placa
    if (entities.plate) {
      actions.push({
        type: 'vehicle.search',
        parameters: {
          placa: entities.plate
        },
        confidence: 0.9
      });
    }
    
    return actions;
  }

  /**
   * Lidar com intenção de agendamento
   */
  async handleScheduleIntent(entities, _context) {
    const actions = [];
    
    // Se tem informações mínimas de agendamento
    if (entities.date || entities.time) {
      
      // Verificar disponibilidade primeiro
      actions.push({
        type: 'schedule.checkAvailability',
        parameters: {
          data: entities.date || 'amanhã',
          hora: entities.time || '14:00'
        },
        confidence: 0.8
      });
      
      // Preparar agendamento
      const scheduleParams = {
        servicoTipo: entities.serviceType || 'Revisão geral', // Usar servicoTipo em vez de serviceType
        data: entities.date || 'amanhã',
        hora: entities.time || '14:00'
      };
      
      // Incluir cliente se disponível
      if (entities.clientName) {
        scheduleParams.clienteNome = entities.clientName;
      }
      if (entities.phone) {
        scheduleParams.clienteTelefone = entities.phone;
      }
      
      actions.push({
        type: 'schedule.book',
        parameters: scheduleParams,
        confidence: 0.8
      });
    }
    
    return actions;
  }

  /**
   * Lidar com intenção de notificação
   */
  async handleNotifyIntent(entities, _context) {
    const actions = [];
    
    if (entities.phone) {
      actions.push({
        type: 'whatsapp.send',
        parameters: {
          telefone: entities.phone,
          mensagem: 'Mensagem da oficina' // Será personalizada
        },
        confidence: 0.7
      });
    }
    
    return actions;
  }

  /**
   * Lidar com intenção de diagnóstico
   */
  async handleDiagnoseIntent(entities, _context) {
    const actions = [];
    
    // Determinar tipo de serviço
    let tipoServico = 'DIAGNOSTICO';
    let descricaoProblema = 'Diagnóstico solicitado';
    
    if (entities.serviceType) {
      if (entities.serviceType.includes('óleo')) {
        tipoServico = 'TROCA_OLEO';
        descricaoProblema = 'Troca de óleo do motor';
      } else if (entities.serviceType.includes('revisão')) {
        tipoServico = 'REVISAO';
        descricaoProblema = 'Revisão preventiva';
      } else {
        descricaoProblema = `Serviço: ${entities.serviceType}`;
      }
    } else if (entities.problem && entities.part) {
      descricaoProblema = `${entities.problem} ${entities.part ? 'no ' + entities.part : ''}`.trim();
    } else if (entities.problem) {
      descricaoProblema = entities.problem;
    } else if (entities.part) {
      descricaoProblema = `Problema no ${entities.part}`;
    }
    
    // Criar ordem de serviço
    actions.push({
      type: 'service.create',
      parameters: {
        descricaoProblema,
        tipoServico
      },
      confidence: 0.8,
      requiresAdditionalInfo: ['clienteId', 'veiculoId']
    });
    
    return actions;
  }

  /**
   * Gerar resposta textual baseada na decisão
   */
  generateResponse(intent, entities, actions, _context) {
    const responses = {
      greeting: this.getGreetingResponse(),
      info_request: this.getInfoResponse(),
      create: 'Entendi que você quer criar algo. ',
      search: 'Vou buscar essas informações para você. ',
      update: 'Vou atualizar esses dados. ',
      schedule: 'Vou verificar a disponibilidade e agendar. ',
      notify: 'Vou enviar a notificação. ',
      diagnose: 'Entendi! Vou criar uma ordem de serviço para diagnóstico. ',
      unknown: 'Não consegui entender completamente sua solicitação. Preciso de mais informações para prosseguir.'
    };
    
    let response = responses[intent.type] || responses.unknown;
    
    // Para saudações e perguntas informativas, retornar apenas a resposta personalizada
    if (intent.type === 'greeting' || intent.type === 'info_request') {
      return response;
    }
    
    // Adicionar informações específicas baseadas nas entidades
    if (entities.clientName) {
      response += `Para o cliente ${entities.clientName}. `;
    }
    
    if (entities.date) {
      response += `Agendado para ${entities.date}. `;
    }
    
    // Melhorar mensagem quando há ações com parâmetros faltantes
    const actionsWithMissingParams = actions.filter(action => action.requiresAdditionalInfo);
    if (actionsWithMissingParams.length > 0) {
      response += 'Para continuar, preciso de algumas informações:\n\n';
      
      actionsWithMissingParams.forEach(action => {
        if (action.requiresAdditionalInfo.includes('clienteId')) {
          response += '• **Nome ou telefone do cliente** - Para identificar quem é o proprietário do veículo\n';
        }
        if (action.requiresAdditionalInfo.includes('veiculoId')) {
          response += '• **Placa ou modelo do veículo** - Para registrar qual carro receberá o serviço\n';
        }
      });
      
      response += '\n💡 **Exemplo:** "Criar OS para troca de óleo do cliente João Silva, Honda Civic placa ABC-1234"';
    } else if (actions.length === 0) {
      response += 'Preciso de mais informações para prosseguir.';
    } else {
      response += `Vou executar ${actions.length} ação${actions.length > 1 ? 'ões' : ''}.`;
    }
    
    return response.trim();
  }

  /**
   * Gerar sugestões para o usuário
   */
  generateSuggestions(intent, entities) {
    const suggestions = [];
    
    if (intent.confidence < 0.5) {
      suggestions.push('Tente ser mais específico sobre o que precisa');
      suggestions.push('Use palavras como "criar", "buscar", "agendar"');
    }
    
    if (!entities.clientName && !entities.phone) {
      suggestions.push('Informe o nome ou telefone do cliente');
    }
    
    if (intent.type === 'schedule' && !entities.date) {
      suggestions.push('Especifique a data desejada');
    }
    
    return suggestions;
  }

  /**
   * Gerar saudação personalizada do Matias
   */
  getGreetingResponse() {
    const greetings = [
      "👋 **Olá! Sou o Matias, seu mecânico especialista!**\n\nCom 15 anos de experiência, estou aqui para resolver qualquer problema do seu veículo. Como posso te ajudar hoje?",
      
      "🔧 **E aí! Matias aqui, pronto para te atender!**\n\nSeja diagnóstico, orçamento, agendamento ou qualquer dúvida técnica - estou à disposição. O que precisa?",
      
      "🚗 **Oi! Matias da Ofix aqui!**\n\nSou especialista em diagnósticos e tenho acesso completo ao sistema da oficina. Qual o problema do seu carro hoje?",
      
      "⚡ **Fala aí! Matias para te ajudar!**\n\nTenho 15 anos de experiência e posso resolver desde um diagnóstico complexo até agendar seu próximo serviço. Me conta o que está acontecendo!"
    ];
    
    // Escolher saudação aleatória
    const randomGreeting = greetings[Math.floor(Math.random() * greetings.length)];
    
    return randomGreeting + "\n\n**🎯 Principais serviços:**\n• 🔍 Diagnósticos detalhados\n• 📅 Agendamentos rápidos\n• 💰 Orçamentos precisos\n• 📋 Acompanhamento de OS\n\n*Fale naturalmente comigo - entendo tudo sobre carros!*";
  }

  /**
   * Gerar resposta informativa sobre serviços da oficina
   */
  getInfoResponse() {
    return "🔧 **Principais Serviços da Ofix:**\n\n" +
           "**🚗 Serviços Técnicos:**\n" +
           "• **Diagnósticos computadorizados** - Análise completa do sistema\n" +
           "• **Manutenção preventiva** - Revisões programadas\n" +
           "• **Reparos especializados** - Motor, transmissão, suspensão\n" +
           "• **Troca de óleo e filtros** - Serviço rápido e confiável\n" +
           "• **Sistema de freios** - Pastilhas, discos e fluidos\n" +
           "• **Ar condicionado** - Manutenção e reparo\n\n" +
           "**📋 Serviços Administrativos:**\n" +
           "• **Orçamentos detalhados** - Preços transparentes\n" +
           "• **Agendamentos flexíveis** - Horários que se adaptam à sua rotina\n" +
           "• **Acompanhamento de OS** - Status em tempo real\n" +
           "• **Histórico do veículo** - Registro completo de serviços\n\n" +
           "**⏰ Funcionamento:**\n" +
           "Segunda a Sexta: 8h às 18h\n" +
           "Sábados: 8h às 12h\n\n" +
           "**💡 Como posso te ajudar?**\n" +
           "• Digite \"agendar\" para marcar um horário\n" +
           "• Digite \"orçamento\" para solicitar um orçamento\n" +
           "• Descreva o problema do seu carro para diagnóstico\n" +
           "• Use o botão do microfone para falar comigo diretamente";
  }

  /**
   * Verificar se ações requerem confirmação
   */
  requiresConfirmation(actions) {
    const sensitiveActions = ['service.create', 'client.create', 'schedule.book'];
    return actions.some(action => sensitiveActions.includes(action.type));
  }

  /**
   * Health check do decision engine
   */
  async healthCheck() {
    return this.isInitialized;
  }
}

export { DecisionEngine };
