/**
 * 🎯 MESSAGE CLASSIFIER SERVICE
 * 
 * Classificador Inteligente de Mensagens
 * Decide se processa localmente (Backend) ou envia para Agno AI
 * 
 * Baseado no plano de otimização multi-agente
 */

class MessageClassifier {
  constructor() {
    // ===== PADRÕES PARA AÇÕES ESTRUTURADAS (processar localmente) =====
    this.actionPatterns = {
      AGENDAMENTO: {
        keywords: [
          'agendar', 'marcar', 'reservar', 'agendar',
          'horário', 'horario', 'marcação', 'marcacao',
          'segunda', 'terça', 'terca', 'quarta', 'quinta', 'sexta',
          'sábado', 'sabado', 'domingo',
          'agendar para', 'marcar para', 'quero agendar'
        ],
        confidence: 0.95,
        requiresDB: true,
        description: 'Agendamento de serviços'
      },
      
      CADASTRO_CLIENTE: {
        keywords: [
          'cadastrar cliente', 'novo cliente', 'adicionar cliente',
          'registrar cliente', 'cadastre', 'cadastro de cliente',
          'criar cliente', 'incluir cliente', 'fazer cadastro',
          'quero cadastrar'
        ],
        confidence: 0.95,
        requiresDB: true,
        description: 'Cadastro de novos clientes'
      },
      
      CONSULTA_OS: {
        keywords: [
          'status da os', 'ordem de serviço', 'ordem de servico',
          'os número', 'os numero', 'os #', 'meu carro',
          'status do', 'andamento', 'situação', 'situacao',
          'está pronto', 'esta pronto', 'terminado', 'concluído', 'concluido'
        ],
        confidence: 0.9,
        requiresDB: true,
        description: 'Consulta de Ordens de Serviço'
      },
      
      CONSULTA_ESTOQUE: {
        keywords: [
          'tem peça', 'tem peca', 'disponível', 'disponivel',
          'estoque de', 'tem em estoque', 'peça disponível',
          'peca disponivel', 'tem filtro', 'tem óleo', 'tem oleo',
          'preciso de', 'tem bateria', 'tem pneu'
        ],
        confidence: 0.9,
        requiresDB: true,
        description: 'Consulta de estoque de peças'
      },
      
      CONSULTA_CLIENTE: {
        keywords: [
          'buscar cliente', 'procurar cliente', 'cliente cadastrado',
          'dados do cliente', 'telefone do cliente', 'cpf do cliente',
          'listar clientes', 'ver clientes', 'mostrar clientes'
        ],
        confidence: 0.85,
        requiresDB: true,
        description: 'Consulta de clientes cadastrados'
      },
      
      ESTATISTICAS: {
        keywords: [
          'estatísticas', 'estatisticas', 'quantos', 'total de',
          'relatório', 'relatorio', 'resumo do', 'números', 'numeros',
          'carros atendidos', 'faturamento', 'hoje', 'esta semana',
          'este mês', 'este mes'
        ],
        confidence: 0.85,
        requiresDB: true,
        description: 'Estatísticas e relatórios'
      }
    };

    // ===== PADRÕES PARA CONVERSAS COMPLEXAS (enviar para Agno) =====
    this.conversationPatterns = {
      DIAGNOSTICO: {
        keywords: [
          'barulho', 'problema', 'defeito', 'não funciona', 'nao funciona',
          'falha', 'quebrou', 'parou', 'luz acendeu', 'está fazendo',
          'esta fazendo', 'sintoma', 'estranho', 'errado',
          'trepidação', 'trepidacao', 'vazamento', 'fumaça', 'fumaca'
        ],
        confidence: 0.85,
        description: 'Diagnóstico técnico de problemas'
      },
      
      DUVIDA_TECNICA: {
        keywords: [
          'o que é', 'o que e', 'como funciona', 'para que serve',
          'qual a diferença', 'qual a diferenca', 'explica', 'me explique',
          'não entendo', 'nao entendo', 'o que significa',
          'por que', 'porque', 'como sei se'
        ],
        confidence: 0.9,
        description: 'Dúvidas técnicas sobre mecânica'
      },
      
      ORCAMENTO: {
        keywords: [
          'quanto custa', 'preço', 'preco', 'valor', 'orçamento', 'orcamento',
          'cobram', 'cobrar', 'sai por', 'fica em', 'faixa de preço',
          'faixa de preco', 'mais ou menos quanto'
        ],
        confidence: 0.85,
        description: 'Orçamentos e preços'
      },
      
      RECOMENDACAO: {
        keywords: [
          'recomenda', 'devo fazer', 'preciso trocar', 'quando trocar',
          'intervalo de', 'manutenção preventiva', 'manutencao preventiva',
          'o que fazer', 'qual o ideal', 'melhor opção', 'melhor opcao',
          'vale a pena', 'aconselha'
        ],
        confidence: 0.85,
        description: 'Recomendações técnicas'
      },
      
      CONSULTA_PRECO: {
        keywords: [
          'quanto custa', 'qual o preço', 'qual o preco', 'valor de',
          'cobram por', 'preço de', 'preco de', 'tabela de preços',
          'tabela de precos'
        ],
        confidence: 0.8,
        description: 'Consulta de preços de serviços'
      }
    };
  }

  /**
   * Classifica a mensagem e decide o processador
   * @param {string} message - Mensagem do usuário
   * @returns {Object} - Classificação com tipo, subtipo, confiança e processador
   */
  classify(message) {
    if (!message || typeof message !== 'string') {
      return this.getDefaultClassification();
    }

    const messageLower = message.toLowerCase().trim();

    // 1️⃣ VERIFICA SE É UMA AÇÃO ESTRUTURADA (processar localmente)
    for (const [action, pattern] of Object.entries(this.actionPatterns)) {
      if (this.matchesPattern(messageLower, pattern.keywords)) {
        console.log(`🎯 [CLASSIFIER] Detectado: ${action} (${pattern.description})`);
        return {
          type: 'ACTION',
          subtype: action,
          confidence: pattern.confidence,
          processor: 'BACKEND_LOCAL',
          reason: `Structured action: ${pattern.description}`,
          requiresDB: pattern.requiresDB
        };
      }
    }

    // 2️⃣ VERIFICA SE É UMA CONVERSA COMPLEXA (enviar para Agno AI)
    for (const [conversation, pattern] of Object.entries(this.conversationPatterns)) {
      if (this.matchesPattern(messageLower, pattern.keywords)) {
        console.log(`💬 [CLASSIFIER] Detectado: ${conversation} (${pattern.description})`);
        return {
          type: 'CONVERSATION',
          subtype: conversation,
          confidence: pattern.confidence,
          processor: 'AGNO_AI',
          reason: `Complex conversation: ${pattern.description}`,
          requiresDB: false
        };
      }
    }

    // 3️⃣ VERIFICA SE É SAUDAÇÃO (processar localmente)
    if (this.isGreeting(messageLower)) {
      console.log('👋 [CLASSIFIER] Detectado: GREETING (Saudação)');
      return {
        type: 'GREETING',
        confidence: 0.95,
        processor: 'BACKEND_LOCAL',
        reason: 'Simple greeting',
        requiresDB: false
      };
    }

    // 4️⃣ VERIFICA SE É PEDIDO DE AJUDA (processar localmente)
    if (this.isHelpRequest(messageLower)) {
      console.log('❓ [CLASSIFIER] Detectado: HELP (Pedido de ajuda)');
      return {
        type: 'HELP',
        confidence: 0.95,
        processor: 'BACKEND_LOCAL',
        reason: 'Help menu request',
        requiresDB: false
      };
    }

    // 5️⃣ DEFAULT: Considera conversa complexa (Agno AI)
    console.log('🤔 [CLASSIFIER] Sem padrão claro - enviando para Agno AI');
    return this.getDefaultClassification();
  }

  /**
   * Verifica se a mensagem contém alguma das keywords
   * @param {string} text - Texto a verificar
   * @param {Array} keywords - Lista de palavras-chave
   * @returns {boolean}
   */
  matchesPattern(text, keywords) {
    return keywords.some(keyword => text.includes(keyword.toLowerCase()));
  }

  /**
   * Verifica se é uma saudação
   * @param {string} text - Texto a verificar
   * @returns {boolean}
   */
  isGreeting(text) {
    const greetings = [
      'oi', 'olá', 'ola', 'bom dia', 'boa tarde', 'boa noite',
      'hey', 'opa', 'e aí', 'e ai', 'eae', 'fala', 'salve'
    ];
    
    // Verifica se a mensagem é só a saudação ou começa com ela
    return greetings.some(g => 
      text === g || 
      text.startsWith(g + ' ') || 
      text.startsWith(g + ',') ||
      text.startsWith(g + '!')
    );
  }

  /**
   * Verifica se é um pedido de ajuda
   * @param {string} text - Texto a verificar
   * @returns {boolean}
   */
  isHelpRequest(text) {
    const helpKeywords = [
      'ajuda', 'help', 'socorro', 'não sei', 'nao sei',
      'o que você pode fazer', 'o que voce pode fazer',
      'comandos', 'menu', 'opções', 'opcoes', 'o que pode',
      'como usar', 'como funciona você', 'como funciona voce'
    ];
    
    return helpKeywords.some(h => text.includes(h));
  }

  /**
   * Classificação padrão quando nenhum padrão é detectado
   * @returns {Object}
   */
  getDefaultClassification() {
    return {
      type: 'CONVERSATION',
      subtype: 'GENERAL',
      confidence: 0.5,
      processor: 'AGNO_AI',
      reason: 'Default fallback to AI for unknown patterns',
      requiresDB: false
    };
  }

  /**
   * Retorna estatísticas sobre os padrões configurados
   * @returns {Object}
   */
  getStats() {
    return {
      total_patterns: Object.keys(this.actionPatterns).length + 
                     Object.keys(this.conversationPatterns).length,
      action_patterns: Object.keys(this.actionPatterns).length,
      conversation_patterns: Object.keys(this.conversationPatterns).length,
      patterns: {
        actions: Object.keys(this.actionPatterns),
        conversations: Object.keys(this.conversationPatterns)
      }
    };
  }
}

// Exporta instância singleton
export default new MessageClassifier();
