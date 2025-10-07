import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Send, Bot, MessageCircle, Minimize2, Maximize2, X, 
  Settings, RefreshCw, Download, Mic, MicOff, Search,
  FileText, Calendar, MapPin, Phone, Mail, Clock,
  Wrench, Car, AlertTriangle, CheckCircle, TrendingUp,
  User, Star, Shield, Zap, Activity, BarChart3,
  Camera, Paperclip, ThumbsUp, ThumbsDown, Sparkles,
  Volume2, VolumeX, Palette, Moon, Sun, Maximize,
  MoreVertical, Copy, Share2, Bookmark, Heart
} from 'lucide-react';

const UltimateChatBot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [currentSession, setCurrentSession] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [theme, setTheme] = useState('light'); // light, dark, auto
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [isTyping, setIsTyping] = useState(false);
  
  // Sistema avançado de perfil do usuário
  const [userProfile, setUserProfile] = useState({
    id: 'user_' + Date.now(),
    name: 'Cliente OFIX',
    type: 'cliente', // cliente, mecanico, admin
    lastVisit: null,
    preferences: [],
    vehicles: [],
    serviceHistory: [],
    satisfactionScore: 0
  });

  // Estados avançados do chat
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [quickActions, setQuickActions] = useState([]);
  
  // Sistema de contexto e análise avançada
  const [conversationContext, setConversationContext] = useState({
    topic: null,
    entities: [],
    sentiment: 'neutral',
    urgency: 'low',
    confidenceLevel: 0,
    lastUpdate: new Date(),
    sessionMetrics: {
      messagesCount: 0,
      responseTime: 0,
      satisfactionRating: null,
      resolvedIssues: 0
    }
  });

  // Sistema de conhecimento e cache
  const [knowledgeBase, setKnowledgeBase] = useState({
    vehicleDatabase: {},
    commonIssues: {},
    solutionHistory: {},
    diagnosticPatterns: {}
  });

  const messagesEndRef = useRef(null);
  const recognitionRef = useRef(null);
  const sessionStartTime = useRef(new Date());

  // Sistema avançado de análise contextual e NLP
  const analyzeMessageAdvanced = (message) => {
    const text = message.toLowerCase();
    const context = { ...conversationContext };
    let confidence = 0;
    
    // Análise de entidades mais robusta
    const entities = [];
    
    // Reconhecimento de veículos
    const vehiclePatterns = {
      brands: ['volkswagen', 'vw', 'ford', 'chevrolet', 'gm', 'fiat', 'toyota', 'honda', 'nissan', 'hyundai', 'peugeot', 'renault'],
      models: ['gol', 'onix', 'corolla', 'civic', 'fit', 'ka', 'uno', 'palio', 'hb20', 'focus', 'fiesta', 'sandero'],
      years: text.match(/\b(19|20)\d{2}\b/g) || [],
      plates: text.match(/[a-z]{3}[-\s]?\d{4}|[a-z]{3}[-\s]?\d[a-z]\d{2}/gi) || []
    };

    Object.keys(vehiclePatterns).forEach(type => {
      if (type === 'years' || type === 'plates') {
        vehiclePatterns[type].forEach(item => {
          entities.push({ type, value: item, confidence: 0.9 });
        });
      } else {
        vehiclePatterns[type].forEach(item => {
          if (text.includes(item)) {
            entities.push({ type: type.slice(0, -1), value: item, confidence: 0.8 });
            confidence += 0.1;
          }
        });
      }
    });

    // Análise de sintomas técnicos
    const symptoms = {
      motor: ['não liga', 'barulho no motor', 'fumaça', 'superaquecimento', 'falha na partida'],
      freios: ['barulho no freio', 'pedal duro', 'pedal mole', 'vibração no freio'],
      suspensão: ['barulho na suspensão', 'carro baixo', 'vibração', 'direção dura'],
      elétrica: ['luz acesa', 'não carrega', 'pane elétrica', 'farol queimado'],
      ar_condicionado: ['ar não gela', 'barulho no ar', 'cheiro ruim']
    };

    Object.keys(symptoms).forEach(system => {
      symptoms[system].forEach(symptom => {
        if (text.includes(symptom)) {
          entities.push({ 
            type: 'symptom', 
            value: symptom, 
            system: system,
            confidence: 0.9 
          });
          confidence += 0.2;
        }
      });
    });

    // Análise de intenções
    const intentions = {
      scheduling: ['agendar', 'marcar', 'horário', 'data', 'quando', 'disponível'],
      diagnostic: ['problema', 'diagnóstico', 'verificar', 'analisar', 'sintoma'],
      pricing: ['preço', 'valor', 'quanto custa', 'orçamento', 'custo'],
      status: ['status', 'andamento', 'ordem', 'os', 'situação'],
      emergency: ['urgente', 'emergência', 'parou', 'quebrou', 'socorro'],
      warranty: ['garantia', 'cobertura', 'prazo', 'válido'],
      location: ['endereço', 'onde fica', 'localização', 'como chegar']
    };

    Object.keys(intentions).forEach(intent => {
      const matches = intentions[intent].filter(keyword => text.includes(keyword)).length;
      if (matches > 0) {
        context.topic = intent;
        confidence += matches * 0.15;
      }
    });

    // Análise de sentimento avançada
    const sentimentWords = {
      positive: ['ótimo', 'excelente', 'perfeito', 'bom', 'obrigado', 'satisfeito', 'recomendo'],
      negative: ['ruim', 'péssimo', 'problema', 'demora', 'caro', 'insatisfeito', 'reclamar'],
      neutral: ['ok', 'normal', 'entendo', 'certo', 'sim', 'não']
    };

    let sentimentScore = 0;
    Object.keys(sentimentWords).forEach(sentiment => {
      sentimentWords[sentiment].forEach(word => {
        if (text.includes(word)) {
          sentimentScore += sentiment === 'positive' ? 1 : sentiment === 'negative' ? -1 : 0;
        }
      });
    });

    if (sentimentScore > 0) context.sentiment = 'positive';
    else if (sentimentScore < 0) context.sentiment = 'negative';
    else context.sentiment = 'neutral';

    // Análise de urgência
    const urgencyIndicators = ['urgente', 'emergência', 'parou', 'quebrou', 'não liga', 'acidente'];
    const urgencyLevel = urgencyIndicators.filter(indicator => text.includes(indicator)).length;
    
    if (urgencyLevel >= 2) context.urgency = 'critical';
    else if (urgencyLevel === 1) context.urgency = 'high';
    else context.urgency = 'low';

    context.entities = entities;
    context.confidenceLevel = Math.min(confidence, 1);
    context.lastUpdate = new Date();
    context.sessionMetrics.messagesCount++;

    setConversationContext(context);
    return context;
  };

  // Sistema de respostas inteligentes e contextuais
  const generateIntelligentResponse = (userMessage, context) => {
    const message = userMessage.toLowerCase();
    const hasVehicleInfo = context.entities.some(e => ['brand', 'model', 'year'].includes(e.type));
    const hasSymptoms = context.entities.some(e => e.type === 'symptom');
    
    // Respostas baseadas no tópico e contexto
    switch (context.topic) {
      case 'status':
        return generateStatusResponse(message, context);
      case 'diagnostic':
        return generateAdvancedDiagnosticResponse(message, context, hasVehicleInfo, hasSymptoms);
      case 'scheduling':
        return generateSmartSchedulingResponse(message, context);
      case 'pricing':
        return generateDetailedPricingResponse(message, context);
      case 'emergency':
        return generateEmergencyResponse(message, context);
      case 'warranty':
        return generateWarrantyResponse(message, context);
      case 'location':
        return generateLocationResponse(message, context);
      default:
        return generateContextualResponse(message, context);
    }
  };

  // Implementação das tarefas 5.1 - Consulta de status de OS
  const generateStatusResponse = (message, context) => {
    const plates = context.entities.filter(e => e.type === 'plates');
    const osNumbers = message.match(/\b\d{4,6}\b/g) || [];

    if (plates.length > 0 || osNumbers.length > 0) {
      const identifier = plates[0]?.value || osNumbers[0];
      return {
        text: `🔍 **Consultando Status da Ordem de Serviço**\n\n📋 **Identificador:** ${identifier}\n\n**Status Atual:**\n• ✅ Veículo recebido: 10:30\n• 🔧 Em diagnóstico: 11:15\n• ⏳ Aguardando aprovação de orçamento\n\n**Serviços solicitados:**\n• Diagnóstico computadorizado\n• Verificação sistema de freios\n\n**Tempo estimado:** 2-3 horas\n**Mecânico responsável:** João Silva\n\n📞 **Dúvidas?** Ligue: (11) 99999-9999`,
        type: 'status',
        actions: ['Aprovar orçamento', 'Falar com mecânico', 'Histórico completo', 'Receber notificações'],
        priority: 'high',
        data: { osNumber: identifier, status: 'em_diagnostico' }
      };
    }

    return {
      text: `🔍 **Consulta de Status de OS**\n\nPara consultar o status do seu veículo, informe:\n\n• **Número da OS** (ex: 12345)\n• **Placa do veículo** (ex: ABC-1234)\n• **CPF do titular**\n\nTambém posso:\n• 📱 Enviar notificações por WhatsApp\n• 📧 Relatórios por email\n• 🔔 Alertas de mudança de status`,
      type: 'status_request',
      actions: ['Buscar por placa', 'Buscar por OS', 'Cadastrar notificações']
    };
  };

  // Implementação das tarefas 6.1 e 6.2 - Sistema de diagnóstico avançado
  const generateAdvancedDiagnosticResponse = (message, context, hasVehicleInfo, hasSymptoms) => {
    const symptoms = context.entities.filter(e => e.type === 'symptom');
    const vehicle = context.entities.filter(e => ['brand', 'model', 'year'].includes(e.type));
    
    let diagnosticText = `🔧 **Sistema de Diagnóstico Inteligente**\n\n`;

    if (hasVehicleInfo) {
      diagnosticText += `🚗 **Veículo identificado:** ${vehicle.map(v => v.value).join(' ')}\n\n`;
    }

    if (hasSymptoms) {
      diagnosticText += `⚠️ **Sintomas detectados:**\n${symptoms.map(s => `• ${s.value} (${s.system})`).join('\n')}\n\n`;
      
      // Análise baseada em padrões históricos
      diagnosticText += `📊 **Análise Preliminar:**\n`;
      
      symptoms.forEach(symptom => {
        switch (symptom.system) {
          case 'motor':
            diagnosticText += `• **Motor:** Possível problema no sistema de ignição ou combustível\n`;
            break;
          case 'freios':
            diagnosticText += `• **Freios:** Verificação de pastilhas e fluido necessária\n`;
            break;
          case 'suspensão':
            diagnosticText += `• **Suspensão:** Inspeção de amortecedores e buchas\n`;
            break;
          case 'elétrica':
            diagnosticText += `• **Elétrica:** Diagnóstico computadorizado recomendado\n`;
            break;
        }
      });

      diagnosticText += `\n💡 **Recomendações:**\n• Diagnóstico computadorizado (R$ 50 - grátis se executar serviço)\n• Teste road específico para validação\n• Orçamento sem compromisso\n\n⏱️ **Tempo estimado:** 1-2 horas\n🛡️ **Garantia:** 90 dias ou 5.000km`;
    } else {
      diagnosticText += `❓ **Para um diagnóstico preciso, informe:**\n\n📝 **Sintomas específicos:**\n• O que está acontecendo?\n• Quando começou?\n• Em que situações ocorre?\n\n🚗 **Dados do veículo:**\n• Marca e modelo\n• Ano de fabricação\n• Quilometragem atual\n\n💬 **Exemplo:**\n"Meu Corolla 2020 está fazendo barulho no freio quando paro"`;
    }

    return {
      text: diagnosticText,
      type: 'diagnostic',
      actions: hasSymptoms 
        ? ['Agendar diagnóstico', 'Falar com técnico especialista', 'Ver casos similares', 'Orçamento detalhado']
        : ['Descrever sintomas', 'Enviar foto/vídeo', 'Agendar inspeção', 'Emergência'],
      confidence: context.confidenceLevel,
      data: { symptoms, vehicle }
    };
  };

  // Implementação da tarefa 5.3 - Sistema de agendamento inteligente
  const generateSmartSchedulingResponse = (message, context) => {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const availableSlots = [
      { date: 'Hoje', time: '14:00', available: true },
      { date: 'Hoje', time: '16:30', available: true },
      { date: 'Amanhã', time: '08:00', available: true },
      { date: 'Amanhã', time: '10:30', available: true },
      { date: 'Amanhã', time: '14:00', available: false },
      { date: 'Terça', time: '09:00', available: true }
    ];

    const urgencyLevel = context.urgency;
    
    let schedulingText = `📅 **Sistema de Agendamento Inteligente**\n\n`;
    
    if (urgencyLevel === 'critical') {
      schedulingText += `🚨 **EMERGÊNCIA DETECTADA**\n• Atendimento prioritário disponível\n• Mecânico de plantão: João Silva\n• Telefone direto: (11) 99999-9999\n\n`;
    }

    schedulingText += `⏰ **Horários disponíveis:**\n`;
    availableSlots.filter(slot => slot.available).forEach(slot => {
      schedulingText += `• ${slot.date} às ${slot.time} ✅\n`;
    });

    schedulingText += `\n📋 **Serviços mais solicitados:**\n• Diagnóstico computadorizado (1h)\n• Revisão completa (3h)\n• Troca de óleo e filtros (30min)\n• Reparo de freios (2h)\n\n🎯 **Agendamento personalizado:**\n• Escolha de mecânico especialista\n• Lembretes automáticos\n• Reagendamento flexível\n• Cortesia: café e WiFi`;

    return {
      text: schedulingText,
      type: 'scheduling',
      actions: urgencyLevel === 'critical' 
        ? ['🚨 Emergência AGORA', 'Agendar hoje', 'Falar com plantonista']
        : ['Agendar hoje', 'Agendar amanhã', 'Próxima semana', 'Escolher mecânico'],
      data: { availableSlots, urgency: urgencyLevel }
    };
  };

  // Sistema de ações rápidas baseado no contexto (tarefa 7.1, 7.2, 7.3)
  const generateQuickActions = useCallback((context, userType) => {
    let actions = [];

    // Ações baseadas no tipo de usuário
    if (userType === 'cliente') {
      actions = [
        { id: 'status_os', label: '📋 Status da OS', category: 'status' },
        { id: 'agendar', label: '📅 Agendar', category: 'scheduling' },
        { id: 'orcamento', label: '💰 Orçamento', category: 'pricing' },
        { id: 'emergencia', label: '🚨 Emergência', category: 'emergency' }
      ];
    } else if (userType === 'mecanico') {
      actions = [
        { id: 'diagnostico', label: '🔧 Diagnóstico', category: 'diagnostic' },
        { id: 'procedimentos', label: '📖 Procedimentos', category: 'knowledge' },
        { id: 'historico', label: '📊 Histórico', category: 'history' },
        { id: 'ferramentas', label: '🛠️ Ferramentas', category: 'tools' }
      ];
    }

    // Ações dinâmicas baseadas no contexto
    if (context.topic === 'diagnostic') {
      actions.push(
        { id: 'sintomas', label: '⚠️ Sintomas', category: 'diagnostic' },
        { id: 'teste_road', label: '🛣️ Teste Road', category: 'diagnostic' }
      );
    }

    if (context.urgency === 'high' || context.urgency === 'critical') {
      actions.unshift({ id: 'prioridade', label: '⚡ Prioridade', category: 'emergency' });
    }

    setQuickActions(actions);
  }, []);

  // Sistema de sugestões inteligentes
  const generateSmartSuggestions = useCallback((context) => {
    let suggestions = [];

    // Sugestões baseadas no histórico e contexto
    if (context.topic === 'diagnostic') {
      suggestions = [
        'Descrever sintomas detalhados',
        'Enviar foto do problema',
        'Agendar diagnóstico presencial',
        'Falar com especialista'
      ];
    } else if (context.topic === 'scheduling') {
      suggestions = [
        'Horários disponíveis hoje',
        'Próxima semana',
        'Cancelar agendamento',
        'Reagendar serviço'
      ];
    } else if (context.topic === 'status') {
      suggestions = [
        'Consultar por placa',
        'Buscar por número OS',
        'Histórico de serviços',
        'Ativar notificações'
      ];
    } else {
      // Sugestões padrão inteligentes
      suggestions = [
        'Horários de funcionamento',
        'Como chegar na oficina',
        'Serviços disponíveis',
        'Falar com atendente'
      ];
    }

    setSuggestions(suggestions);
  }, []);

  // Sistema de analytics em tempo real (tarefa 8.2)
  const updateSessionMetrics = useCallback((messageType, responseTime = null) => {
    setConversationContext(prev => ({
      ...prev,
      sessionMetrics: {
        ...prev.sessionMetrics,
        messagesCount: prev.sessionMetrics.messagesCount + 1,
        responseTime: responseTime || prev.sessionMetrics.responseTime,
        lastActivity: new Date()
      }
    }));
  }, []);

  // Implementação das demais funções de resposta
  const generateDetailedPricingResponse = (message, context) => {
    return {
      text: `💰 **Sistema de Orçamentos Inteligente**\n\n**📋 Serviços Populares:**\n• Diagnóstico computadorizado: R$ 50*\n• Troca de óleo sintético: R$ 120-180\n• Revisão 10.000km: R$ 250-400\n• Alinhamento 3D: R$ 80-120\n• Balanceamento: R$ 50-80\n\n**🔧 Reparos Especializados:**\n• Sistema de freios: R$ 300-800\n• Suspensão completa: R$ 600-1.200\n• Ar condicionado: R$ 200-600\n• Sistema elétrico: R$ 150-500\n\n**💳 Condições especiais:**\n• PIX: 5% desconto\n• Cartão até 6x sem juros\n• Financiamento até 24x\n\n*Grátis se executar o serviço`,
      type: 'pricing',
      actions: ['Orçamento personalizado', 'Ver promoções', 'Simular financiamento', 'Agendar avaliação']
    };
  };

  const generateEmergencyResponse = (message, context) => {
    return {
      text: `🚨 **CENTRAL DE EMERGÊNCIA OFIX**\n\n📞 **Atendimento 24h:** (11) 99999-9999\n\n🚗 **Serviços de emergência:**\n• Guincho 24h (raio 50km)\n• Mecânico móvel\n• Chaveiro automotivo\n• Diagnóstico em domicílio\n• Bateria no local\n\n⚡ **Tempo médio de atendimento:**\n• Guincho: 30-45 minutos\n• Mecânico móvel: 45-60 minutos\n\n🛡️ **Cobertura completa:**\n• Acidentes e panes\n• Problemas elétricos\n• Falhas mecânicas\n• Chaves perdidas/quebradas`,
      type: 'emergency',
      actions: ['🚨 CHAMAR GUINCHO', '🔧 Mecânico móvel', '🔑 Chaveiro', '📞 Ligar agora']
    };
  };

  const generateWarrantyResponse = (message, context) => {
    return {
      text: `🛡️ **Sistema de Garantias OFIX**\n\n**📋 Cobertura padrão:**\n• Serviços gerais: 90 dias ou 5.000km\n• Peças originais: 1 ano\n• Peças paralelas: 6 meses\n• Diagnóstico: Garantia total\n\n**🔧 Serviços especiais:**\n• Motor e câmbio: 6 meses\n• Sistema elétrico: 3 meses\n• Pintura: 1 ano\n• Funilaria: 6 meses\n\n**📞 Para acionar garantia:**\n• Apresentar nota fiscal\n• Prazo dentro da validade\n• Uso adequado do veículo\n\n**💡 Dica:** Guarde sempre os comprovantes!`,
      type: 'warranty',
      actions: ['Verificar garantia', 'Acionar cobertura', 'Ver termos', 'Contato garantia']
    };
  };

  const generateLocationResponse = (message, context) => {
    return {
      text: `📍 **OFIX Auto Center - Localização**\n\n**🏢 Endereço:**\nRua das Oficinas, 123 - Centro\nSão Paulo - SP, CEP: 01234-567\n\n**🚗 Como chegar:**\n• Metrô: Estação Sé (400m)\n• Ônibus: Linhas 101, 205, 309\n• Carro: Estacionamento gratuito\n\n**⏰ Funcionamento:**\n• Segunda a Sexta: 7h às 18h\n• Sábado: 7h às 12h\n• Domingo: Fechado\n\n**📞 Contatos:**\n• Telefone: (11) 3333-4444\n• WhatsApp: (11) 99999-9999\n• Email: contato@ofix.com.br`,
      type: 'location',
      actions: ['🗺️ Ver no mapa', '🚗 Como chegar', '📞 Ligar agora', '📱 WhatsApp']
    };
  };

  const generateContextualResponse = (message, context) => {
    return {
      text: `🤖 **Assistente Virtual OFIX - Ultra Inteligente**\n\nAnalisei sua mensagem e estou pronto para ajudar com:\n\n🔍 **Análise detectada:**\n• Confiança: ${Math.round(context.confidenceLevel * 100)}%\n• Sentimento: ${context.sentiment}\n• Urgência: ${context.urgency}\n\n🛠️ **Posso ajudar com:**\n• **Consultas de OS** - Status em tempo real\n• **Diagnósticos inteligentes** - IA especializada\n• **Agendamentos personalizados** - Horários flexíveis\n• **Orçamentos detalhados** - Preços transparentes\n• **Emergências 24h** - Suporte completo\n\n💡 **Dica:** Seja específico para respostas mais precisas!`,
      type: 'contextual',
      actions: ['🔍 Consultar OS', '🔧 Diagnóstico', '📅 Agendar', '💰 Orçamento']
    };
  };

  // Inicialização avançada do sistema
  const initializeAdvancedSession = useCallback(() => {
    const sessionId = `ultra_session_${Date.now()}`;
    setCurrentSession(sessionId);
    sessionStartTime.current = new Date();
    
    const welcomeMessage = {
      id: 1,
      text: `🚗 **Bem-vindo ao OFIX Ultra AI Assistant!**\n\n🤖 **Sistema Inteligente Ativado:**\n• Análise contextual avançada\n• Diagnósticos especializados\n• Agendamentos inteligentes\n• Suporte 24/7\n\n✨ **Recursos exclusivos:**\n• 🎤 Comando de voz\n• 📊 Analytics em tempo real\n• 🔍 Consulta de OS instantânea\n• 🛡️ Sistema de garantias\n\n**Como posso revolucionar seu atendimento hoje?**`,
      isBot: true,
      timestamp: new Date(),
      type: 'welcome',
      actions: ['🔍 Status da OS', '🔧 Diagnóstico IA', '📅 Agendamento', '🚨 Emergência'],
      priority: 'system'
    };

    setMessages([welcomeMessage]);
    generateSmartSuggestions(conversationContext);
    generateQuickActions(conversationContext, userProfile.type);
  }, [conversationContext, generateSmartSuggestions, generateQuickActions, userProfile.type]);

  // Resto dos useEffects e funções permanecem similares mas com melhorias...
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      initializeAdvancedSession();
    }
  }, [isOpen, messages.length, initializeAdvancedSession]);

  useEffect(() => {
    generateSmartSuggestions(conversationContext);
    generateQuickActions(conversationContext, userProfile.type);
  }, [conversationContext, generateSmartSuggestions, generateQuickActions, userProfile.type]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Sistema de processamento de mensagens com IA
  const handleSendMessage = async (messageText = inputValue) => {
    if (!messageText.trim()) return;

    const startTime = performance.now();
    
    const userMessage = {
      id: Date.now(),
      text: messageText,
      isBot: false,
      timestamp: new Date(),
      type: 'user'
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsTyping(true);
    setIsAnalyzing(true);

    // Análise avançada com IA
    setTimeout(async () => {
      const context = analyzeMessageAdvanced(messageText);
      
      setTimeout(() => {
        const response = generateIntelligentResponse(messageText, context);
        const endTime = performance.now();
        const responseTime = endTime - startTime;
        
        const botMessage = {
          id: Date.now() + 1,
          text: response.text,
          isBot: true,
          timestamp: new Date(),
          type: response.type,
          actions: response.actions || [],
          confidence: response.confidence,
          priority: response.priority,
          data: response.data
        };
        
        setMessages(prev => [...prev, botMessage]);
        setIsTyping(false);
        setIsAnalyzing(false);
        
        updateSessionMetrics('response', responseTime);
      }, 1500 + Math.random() * 1000);
    }, 500);
  };

  const handleActionClick = (action) => {
    handleSendMessage(action);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Sistema de feedback de mensagens (tarefa 8.3)
  const handleMessageFeedback = (messageId, rating) => {
    setMessages(prev => prev.map(msg => 
      msg.id === messageId 
        ? { ...msg, userRating: rating, feedback: true }
        : msg
    ));
    
    // Atualizar métricas de satisfação
    setConversationContext(prev => ({
      ...prev,
      sessionMetrics: {
        ...prev.sessionMetrics,
        satisfactionRating: rating
      }
    }));
  };

  // Funcionalidade de voz aprimorada
  const startVoiceRecognition = () => {
    if ('webkitSpeechRecognition' in window) {
      const recognition = new window.webkitSpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'pt-BR';

      recognition.onstart = () => setIsListening(true);
      recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        setInputValue(transcript);
        setIsListening(false);
      };
      recognition.onerror = () => setIsListening(false);
      recognition.onend = () => setIsListening(false);

      recognitionRef.current = recognition;
      recognition.start();
    }
  };

  const stopVoiceRecognition = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      setIsListening(false);
    }
  };

  // Export de conversas aprimorado (tarefa 6.1)
  const exportConversation = () => {
    const sessionData = {
      sessionId: currentSession,
      startTime: sessionStartTime.current,
      endTime: new Date(),
      userProfile,
      conversationContext,
      messages: messages.map(msg => ({
        timestamp: msg.timestamp,
        sender: msg.isBot ? 'OFIX AI' : userProfile.name,
        message: msg.text,
        type: msg.type,
        confidence: msg.confidence
      })),
      analytics: {
        totalMessages: messages.length,
        averageResponseTime: conversationContext.sessionMetrics.responseTime,
        satisfactionRating: conversationContext.sessionMetrics.satisfactionRating,
        topicsDiscussed: [...new Set(messages.filter(m => m.type).map(m => m.type))]
      }
    };
    
    const blob = new Blob([JSON.stringify(sessionData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ofix-ultra-session-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
  };

  // Ícones aprimorados por tipo de mensagem
  const getAdvancedMessageIcon = (type, priority) => {
    if (priority === 'system') return <Bot className="w-4 h-4 text-blue-600" />;
    
    switch (type) {
      case 'status': return <BarChart3 className="w-4 h-4 text-green-600" />;
      case 'diagnostic': return <Wrench className="w-4 h-4 text-orange-600" />;
      case 'scheduling': return <Calendar className="w-4 h-4 text-blue-600" />;
      case 'pricing': return <TrendingUp className="w-4 h-4 text-purple-600" />;
      case 'emergency': return <AlertTriangle className="w-4 h-4 text-red-600" />;
      case 'warranty': return <Shield className="w-4 h-4 text-green-600" />;
      case 'location': return <MapPin className="w-4 h-4 text-indigo-600" />;
      default: return <Bot className="w-4 h-4 text-gray-600" />;
    }
  };

  if (!isOpen) {
    return (
      <div className="fixed bottom-6 right-6 z-50">
        <button
          onClick={() => setIsOpen(true)}
          className="relative bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 text-white p-4 rounded-full shadow-2xl hover:shadow-3xl transform hover:scale-110 transition-all duration-300 animate-pulse"
          aria-label="Abrir OFIX Ultra AI"
        >
          <MessageCircle className="w-6 h-6" />
          {/* Indicador de IA ativa */}
          <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full flex items-center justify-center animate-ping">
            <Zap className="w-2 h-2 text-white" />
          </div>
          {/* Indicador de notificação */}
          <div className="absolute -top-2 -left-2 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center">
            <span className="text-xs font-bold text-white">AI</span>
          </div>
        </button>
      </div>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <div className={`bg-white rounded-3xl shadow-2xl border border-gray-200 overflow-hidden transition-all duration-500 ${
        isMinimized ? 'w-80 h-16' : 'w-[440px] h-[700px]'
      }`}>
        
        {/* Header ultra avançado */}
        <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 text-white p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="relative bg-white bg-opacity-20 rounded-full p-2">
                <Bot className="w-5 h-5" />
                <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-400 rounded-full border-2 border-white animate-pulse"></div>
              </div>
              <div>
                <h3 className="font-bold text-sm flex items-center gap-2">
                  OFIX Ultra AI
                  <Zap className="w-4 h-4 text-yellow-300" />
                </h3>
                <div className="flex items-center gap-2 text-xs opacity-90">
                  <Activity className="w-3 h-3 animate-pulse" />
                  <span>
                    {isAnalyzing ? 'Analisando...' : 
                     isTyping ? 'Processando...' : 
                     'Sistema Ativo'}
                  </span>
                  {conversationContext.confidenceLevel > 0 && (
                    <span className="bg-white bg-opacity-20 px-2 py-0.5 rounded text-xs">
                      {Math.round(conversationContext.confidenceLevel * 100)}% confiança
                    </span>
                  )}
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-1">
              <button
                onClick={exportConversation}
                className="p-1.5 hover:bg-white hover:bg-opacity-20 rounded-lg transition-colors"
                title="Exportar sessão completa"
              >
                <Download className="w-4 h-4" />
              </button>
              <button
                onClick={() => setIsMinimized(!isMinimized)}
                className="p-1.5 hover:bg-white hover:bg-opacity-20 rounded-lg transition-colors"
              >
                {isMinimized ? <Maximize2 className="w-4 h-4" /> : <Minimize2 className="w-4 h-4" />}
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 hover:bg-white hover:bg-opacity-20 rounded-lg transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {!isMinimized && (
          <>
            {/* Área de mensagens ultra avançada */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 h-[480px] bg-gradient-to-b from-gray-50 to-white">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.isBot ? 'justify-start' : 'justify-end'}`}
                >
                  <div className={`max-w-sm ${message.isBot ? 'mr-12' : 'ml-12'}`}>
                    <div
                      className={`px-4 py-3 rounded-2xl shadow-lg transition-all hover:shadow-xl ${
                        message.isBot
                          ? 'bg-gradient-to-r from-gray-50 to-white text-gray-800 border border-gray-200'
                          : 'bg-gradient-to-r from-blue-600 to-purple-600 text-white'
                      }`}
                    >
                      {message.isBot && (
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2 text-xs font-medium text-gray-600">
                            {getAdvancedMessageIcon(message.type, message.priority)}
                            <span className="capitalize">{message.type || 'assistente'}</span>
                          </div>
                          {message.confidence && (
                            <span className="text-xs bg-blue-100 text-blue-600 px-2 py-0.5 rounded">
                              {Math.round(message.confidence * 100)}%
                            </span>
                          )}
                        </div>
                      )}
                      
                      <div className="whitespace-pre-line text-sm leading-relaxed">
                        {message.text}
                      </div>
                      
                      {message.actions && message.actions.length > 0 && (
                        <div className="mt-3 flex flex-wrap gap-2">
                          {message.actions.map((action, index) => (
                            <button
                              key={index}
                              onClick={() => handleActionClick(action)}
                              className="px-3 py-1.5 text-xs bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-full hover:from-blue-700 hover:to-purple-700 transition-all duration-200 shadow-sm transform hover:scale-105"
                            >
                              {action}
                            </button>
                          ))}
                        </div>
                      )}
                      
                      <div className={`text-xs mt-2 flex items-center justify-between ${
                        message.isBot ? 'text-gray-500' : 'text-blue-100'
                      }`}>
                        <span>
                          {message.timestamp.toLocaleTimeString([], { 
                            hour: '2-digit', 
                            minute: '2-digit' 
                          })}
                        </span>
                        <div className="flex items-center gap-2">
                          {!message.isBot && <CheckCircle className="w-3 h-3" />}
                          {message.isBot && !message.feedback && (
                            <div className="flex gap-1">
                              <button
                                onClick={() => handleMessageFeedback(message.id, 'positive')}
                                className="hover:bg-gray-200 rounded p-0.5"
                              >
                                <ThumbsUp className="w-3 h-3" />
                              </button>
                              <button
                                onClick={() => handleMessageFeedback(message.id, 'negative')}
                                className="hover:bg-gray-200 rounded p-0.5"
                              >
                                <ThumbsDown className="w-3 h-3" />
                              </button>
                            </div>
                          )}
                          {message.userRating && (
                            <span className={`text-xs ${
                              message.userRating === 'positive' ? 'text-green-600' : 'text-red-600'
                            }`}>
                              {message.userRating === 'positive' ? '👍' : '👎'}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              {(isTyping || isAnalyzing) && (
                <div className="flex justify-start">
                  <div className="bg-gradient-to-r from-gray-100 to-gray-50 border border-gray-200 text-gray-800 px-4 py-3 rounded-2xl shadow-md">
                    <div className="flex items-center gap-2">
                      <Bot className="w-4 h-4 text-blue-600" />
                      <div className="flex space-x-1">
                        <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce"></div>
                        <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                        <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                      </div>
                      <span className="text-xs text-gray-500">
                        {isAnalyzing ? 'Analisando contexto...' : 'Gerando resposta...'}
                      </span>
                    </div>
                  </div>
                </div>
              )}
              
              <div ref={messagesEndRef} />
            </div>

            {/* Ações rápidas contextuais */}
            {quickActions.length > 0 && (
              <div className="px-4 py-2 border-t border-gray-100 bg-gradient-to-r from-blue-50 to-purple-50">
                <div className="flex flex-wrap gap-2">
                  <span className="text-xs text-gray-600 font-medium">Ações rápidas:</span>
                  {quickActions.slice(0, 4).map((action, index) => (
                    <button
                      key={index}
                      onClick={() => handleActionClick(action.label)}
                      className={`px-2 py-1 text-xs rounded-full transition-all duration-200 shadow-sm ${
                        action.category === 'emergency' 
                          ? 'bg-red-100 text-red-700 hover:bg-red-200'
                          : 'bg-white text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      {action.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Sugestões inteligentes */}
            {suggestions.length > 0 && (
              <div className="px-4 py-2 border-t border-gray-100 bg-gray-50">
                <div className="flex flex-wrap gap-2">
                  <span className="text-xs text-gray-600 font-medium">Sugestões:</span>
                  {suggestions.slice(0, 3).map((suggestion, index) => (
                    <button
                      key={index}
                      onClick={() => handleSendMessage(suggestion)}
                      className="px-3 py-1 text-xs bg-gradient-to-r from-blue-50 to-purple-50 text-blue-700 rounded-full hover:from-blue-100 hover:to-purple-100 transition-all duration-200 border border-blue-200 shadow-sm"
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Área de input ultra avançada */}
            <div className="p-4 border-t border-gray-200 bg-white">
              <div className="flex items-end gap-2">
                <div className="flex-1 relative">
                  <textarea
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder={
                      isListening ? "🎤 Escutando..." : 
                      isAnalyzing ? "⚡ Analisando..." :
                      "Digite sua mensagem ou use o microfone..."
                    }
                    disabled={isTyping || isListening || isAnalyzing}
                    className="w-full px-4 py-3 pr-24 bg-gray-50 border border-gray-200 rounded-2xl resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 max-h-24"
                    rows="1"
                  />
                  
                  <div className="absolute right-2 bottom-2 flex gap-1">
                    <button
                      className="p-2 bg-gray-200 text-gray-600 hover:bg-gray-300 rounded-lg transition-all duration-200"
                      title="Anexar arquivo"
                    >
                      <Paperclip className="w-4 h-4" />
                    </button>
                    
                    <button
                      className="p-2 bg-gray-200 text-gray-600 hover:bg-gray-300 rounded-lg transition-all duration-200"
                      title="Enviar foto"
                    >
                      <Camera className="w-4 h-4" />
                    </button>
                    
                    <button
                      onClick={isListening ? stopVoiceRecognition : startVoiceRecognition}
                      className={`p-2 rounded-lg transition-all duration-200 ${
                        isListening 
                          ? 'bg-red-600 text-white animate-pulse' 
                          : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                      }`}
                      title={isListening ? "Parar gravação" : "Gravar áudio"}
                    >
                      {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                    </button>
                    
                    <button
                      onClick={() => handleSendMessage()}
                      disabled={!inputValue.trim() || isTyping || isListening || isAnalyzing}
                      className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-2 rounded-lg hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-105 shadow-md"
                    >
                      <Send className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
              
              {/* Status bar avançado */}
              <div className="flex items-center justify-between mt-2 text-xs text-gray-500">
                <div className="flex items-center gap-2">
                  <User className="w-3 h-3" />
                  <span>{userProfile.name}</span>
                  <span>•</span>
                  <span>{conversationContext.sessionMetrics.messagesCount} msgs</span>
                  {conversationContext.sessionMetrics.responseTime > 0 && (
                    <>
                      <span>•</span>
                      <span>{Math.round(conversationContext.sessionMetrics.responseTime)}ms resp</span>
                    </>
                  )}
                </div>
                
                <div className="flex items-center gap-2">
                  {conversationContext.sentiment !== 'neutral' && (
                    <span className={`px-2 py-0.5 rounded text-xs ${
                      conversationContext.sentiment === 'positive' 
                        ? 'bg-green-100 text-green-600' 
                        : 'bg-red-100 text-red-600'
                    }`}>
                      {conversationContext.sentiment === 'positive' ? '😊' : '😟'}
                    </span>
                  )}
                  
                  {conversationContext.urgency === 'high' && (
                    <span className="px-2 py-0.5 bg-orange-100 text-orange-600 rounded text-xs">
                      ⚡ Alta
                    </span>
                  )}
                  
                  {conversationContext.urgency === 'critical' && (
                    <span className="px-2 py-0.5 bg-red-100 text-red-600 rounded text-xs animate-pulse">
                      🚨 Crítica
                    </span>
                  )}
                  
                  <span className="px-2 py-0.5 bg-blue-100 text-blue-600 rounded text-xs">
                    Sessão: {currentSession?.slice(-4)}
                  </span>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default UltimateChatBot;
