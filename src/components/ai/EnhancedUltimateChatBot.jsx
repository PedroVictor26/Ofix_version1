import { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Send, Bot, MessageCircle, Minimize2, Maximize2, X, 
  Download, Mic, MicOff, Wrench, Calendar, MapPin, 
  AlertTriangle, CheckCircle, TrendingUp, User, Shield, 
  Zap, Activity, BarChart3, Camera, Paperclip, ThumbsUp, 
  ThumbsDown, Sparkles, Volume2, VolumeX, Moon, Sun, 
  Maximize, Copy
} from 'lucide-react';

const UltimateChatBot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [currentSession, setCurrentSession] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [theme, setTheme] = useState('light');
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [isTyping, setIsTyping] = useState(false);
  
  const [userProfile] = useState({
    id: 'user_' + Date.now(),
    name: 'Cliente OFIX',
    type: 'cliente'
  });

  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [quickActions, setQuickActions] = useState([]);
  
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

  const messagesEndRef = useRef(null);
  const recognitionRef = useRef(null);
  const sessionStartTime = useRef(new Date());

  // Som de notificação
  const playNotificationSound = useCallback((type = 'message') => {
    if (!soundEnabled) return;
    
    try {
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      if (type === 'message') {
        oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
        oscillator.frequency.setValueAtTime(600, audioContext.currentTime + 0.1);
      } else if (type === 'error') {
        oscillator.frequency.setValueAtTime(300, audioContext.currentTime);
      } else if (type === 'success') {
        oscillator.frequency.setValueAtTime(600, audioContext.currentTime);
        oscillator.frequency.setValueAtTime(800, audioContext.currentTime + 0.1);
        oscillator.frequency.setValueAtTime(1000, audioContext.currentTime + 0.2);
      }
      
      gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
      
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.3);
    } catch (error) {
      console.log('Audio not supported');
    }
  }, [soundEnabled]);

  // Análise contextual melhorada
  const analyzeMessageAdvanced = (message) => {
    const text = message.toLowerCase();
    const context = { ...conversationContext };
    let confidence = 0;
    
    const entities = [];
    
    // Reconhecimento de veículos
    const vehiclePatterns = {
      brands: ['volkswagen', 'vw', 'ford', 'chevrolet', 'gm', 'fiat', 'toyota', 'honda', 'nissan', 'hyundai'],
      models: ['gol', 'onix', 'corolla', 'civic', 'fit', 'ka', 'uno', 'palio', 'hb20', 'focus'],
      plates: text.match(/[a-z]{3}[-\s]?\d{4}|[a-z]{3}[-\s]?\d[a-z]\d{2}/gi) || []
    };

    Object.keys(vehiclePatterns).forEach(type => {
      if (type === 'plates') {
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

    // Análise de intenções
    const intentions = {
      scheduling: ['agendar', 'marcar', 'horário'],
      diagnostic: ['problema', 'diagnóstico', 'verificar'],
      pricing: ['preço', 'valor', 'quanto custa'],
      status: ['status', 'andamento', 'ordem'],
      emergency: ['urgente', 'emergência', 'parou'],
      warranty: ['garantia', 'cobertura'],
      location: ['endereço', 'onde fica']
    };

    Object.keys(intentions).forEach(intent => {
      const matches = intentions[intent].filter(keyword => text.includes(keyword)).length;
      if (matches > 0) {
        context.topic = intent;
        confidence += matches * 0.15;
      }
    });

    // Análise de sentimento
    const sentimentWords = {
      positive: ['ótimo', 'excelente', 'perfeito', 'bom', 'obrigado'],
      negative: ['ruim', 'péssimo', 'problema', 'demora'],
      neutral: ['ok', 'normal', 'entendo']
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
    const urgencyIndicators = ['urgente', 'emergência', 'parou', 'quebrou'];
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

  // Gerador de respostas inteligente
  const generateIntelligentResponse = (userMessage, context) => {
    switch (context.topic) {
      case 'status':
        return {
          text: `🔍 **Consulta de Status de OS**\n\nPara consultar o status do seu veículo, informe:\n\n• **Número da OS** (ex: 12345)\n• **Placa do veículo** (ex: ABC-1234)\n\nTambém posso:\n• 📱 Enviar notificações por WhatsApp\n• 📧 Relatórios por email`,
          type: 'status',
          actions: ['Buscar por placa', 'Buscar por OS', 'Ativar notificações']
        };
      
      case 'diagnostic':
        return {
          text: `🔧 **Sistema de Diagnóstico Inteligente**\n\n❓ Para um diagnóstico preciso, informe:\n\n• O que está acontecendo?\n• Quando começou?\n• Marca e modelo do veículo\n\n💡 **Diagnóstico computadorizado:** R$ 50\n⏱️ **Tempo estimado:** 1-2 horas`,
          type: 'diagnostic',
          actions: ['Agendar diagnóstico', 'Descrever sintomas', 'Ver preços', 'Emergência']
        };
      
      case 'scheduling':
        return {
          text: `📅 **Sistema de Agendamento**\n\n⏰ **Horários disponíveis:**\n• Hoje às 14:00 ✅\n• Amanhã às 08:00 ✅\n• Amanhã às 10:30 ✅\n\n📋 **Serviços:**\n• Diagnóstico (1h)\n• Revisão (3h)\n• Troca de óleo (30min)`,
          type: 'scheduling',
          actions: ['Agendar hoje', 'Agendar amanhã', 'Ver mais horários', 'Emergência']
        };
      
      case 'pricing':
        return {
          text: `💰 **Tabela de Preços**\n\n**Serviços populares:**\n• Diagnóstico: R$ 50*\n• Troca de óleo: R$ 120-180\n• Revisão 10.000km: R$ 250-400\n• Alinhamento: R$ 80-120\n\n**Formas de pagamento:**\n• PIX: 5% desconto\n• Cartão: até 6x sem juros\n\n*Grátis se executar serviço`,
          type: 'pricing',
          actions: ['Orçamento personalizado', 'Ver promoções', 'Agendar avaliação']
        };
      
      case 'emergency':
        return {
          text: `🚨 **EMERGÊNCIA 24H**\n\n📞 **Atendimento:** (11) 99999-9999\n\n🚗 **Serviços:**\n• Guincho (30-45 min)\n• Mecânico móvel\n• Chaveiro automotivo\n• Diagnóstico em domicílio`,
          type: 'emergency',
          actions: ['🚨 CHAMAR GUINCHO', '🔧 Mecânico móvel', '📞 Ligar agora']
        };
      
      default:
        return {
          text: `🤖 **OFIX Ultra AI Assistant**\n\nOlá! Sou seu assistente virtual especializado em serviços automotivos.\n\n🛠️ **Posso ajudar com:**\n• Consulta de OS\n• Diagnósticos\n• Agendamentos\n• Orçamentos\n• Emergências 24h\n\n**Como posso ajudar você hoje?**`,
          type: 'welcome',
          actions: ['🔍 Status OS', '🔧 Diagnóstico', '📅 Agendar', '💰 Preços']
        };
    }
  };

  // Ações rápidas contextuais
  const generateQuickActions = useCallback((context) => {
    const actions = [];
    
    if (context.urgency === 'critical') {
      actions.push({ id: 'emergency', label: '🚨 EMERGÊNCIA', category: 'emergency' });
    }
    
    actions.push(
      { id: 'status', label: '📋 Status OS', category: 'status' },
      { id: 'diagnostic', label: '🔧 Diagnóstico', category: 'diagnostic' },
      { id: 'scheduling', label: '📅 Agendar', category: 'scheduling' },
      { id: 'pricing', label: '💰 Preços', category: 'pricing' }
    );

    setQuickActions(actions);
  }, []);

  // Sugestões inteligentes
  const generateSmartSuggestions = useCallback((context) => {
    let suggestions = [];

    if (context.topic === 'diagnostic') {
      suggestions = ['Descrever sintomas', 'Enviar foto', 'Agendar diagnóstico'];
    } else if (context.topic === 'scheduling') {
      suggestions = ['Horários hoje', 'Próxima semana', 'Cancelar agendamento'];
    } else {
      suggestions = ['Horários funcionamento', 'Como chegar', 'Falar com atendente'];
    }

    setSuggestions(suggestions);
  }, []);

  // Inicialização
  const initializeAdvancedSession = useCallback(() => {
    const sessionId = `session_${Date.now()}`;
    setCurrentSession(sessionId);
    sessionStartTime.current = new Date();
    
    const welcomeMessage = {
      id: 1,
      text: `🚗 **Bem-vindo ao OFIX Ultra AI!**\n\n🤖 **Sistema Ativo:**\n• Diagnósticos especializados\n• Agendamentos inteligentes\n• Suporte 24/7\n• Consulta de OS\n\n**Como posso ajudar você hoje?**`,
      isBot: true,
      timestamp: new Date(),
      type: 'welcome',
      actions: ['🔍 Status OS', '🔧 Diagnóstico', '📅 Agendar', '🚨 Emergência']
    };

    setMessages([welcomeMessage]);
    generateSmartSuggestions(conversationContext);
    generateQuickActions(conversationContext);
    playNotificationSound('success');
  }, [conversationContext, generateSmartSuggestions, generateQuickActions, playNotificationSound]);

  useEffect(() => {
    if (isOpen && messages.length === 0) {
      initializeAdvancedSession();
    }
  }, [isOpen, messages.length, initializeAdvancedSession]);

  useEffect(() => {
    generateSmartSuggestions(conversationContext);
    generateQuickActions(conversationContext);
  }, [conversationContext, generateSmartSuggestions, generateQuickActions]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Enviar mensagem
  const handleSendMessage = async (messageText = inputValue) => {
    if (!messageText.trim()) return;

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

    setTimeout(() => {
      const context = analyzeMessageAdvanced(messageText);
      
      setTimeout(() => {
        const response = generateIntelligentResponse(messageText, context);
        
        const botMessage = {
          id: Date.now() + 1,
          text: response.text,
          isBot: true,
          timestamp: new Date(),
          type: response.type,
          actions: response.actions || []
        };
        
        setMessages(prev => [...prev, botMessage]);
        setIsTyping(false);
        setIsAnalyzing(false);
        playNotificationSound('message');
      }, 1000 + Math.random() * 1000);
    }, 300);
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

  // Feedback de mensagem
  const handleMessageFeedback = (messageId, rating) => {
    setMessages(prev => prev.map(msg => 
      msg.id === messageId 
        ? { ...msg, userRating: rating, feedback: true }
        : msg
    ));
    playNotificationSound(rating === 'positive' ? 'success' : 'error');
  };

  // Controles de voz
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
        playNotificationSound('success');
      };
      recognition.onerror = () => {
        setIsListening(false);
        playNotificationSound('error');
      };
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

  // Export conversa
  const exportConversation = () => {
    const sessionData = {
      sessionId: currentSession,
      startTime: sessionStartTime.current,
      endTime: new Date(),
      messages: messages.map(msg => ({
        timestamp: msg.timestamp,
        sender: msg.isBot ? 'OFIX AI' : 'Cliente',
        message: msg.text,
        type: msg.type
      }))
    };
    
    const blob = new Blob([JSON.stringify(sessionData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ofix-conversa-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    playNotificationSound('success');
  };

  // Copiar mensagem
  const copyMessage = (text) => {
    navigator.clipboard.writeText(text);
    playNotificationSound('success');
  };

  // Ícones por tipo
  const getMessageIcon = (type) => {
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

  // Toggle tema
  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  // Toggle som
  const toggleSound = () => {
    setSoundEnabled(prev => !prev);
    playNotificationSound('success');
  };

  // Classes de tema
  const themeClasses = {
    light: {
      container: 'bg-white text-gray-800',
      header: 'bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600',
      messageArea: 'bg-gradient-to-b from-gray-50 to-white',
      userMessage: 'bg-gradient-to-r from-blue-600 to-purple-600 text-white',
      botMessage: 'bg-gradient-to-r from-gray-50 to-white text-gray-800 border border-gray-200',
      input: 'bg-gray-50 border-gray-200 text-gray-800'
    },
    dark: {
      container: 'bg-gray-900 text-gray-100',
      header: 'bg-gradient-to-r from-purple-800 via-blue-800 to-indigo-800',
      messageArea: 'bg-gradient-to-b from-gray-800 to-gray-900',
      userMessage: 'bg-gradient-to-r from-purple-600 to-blue-600 text-white',
      botMessage: 'bg-gradient-to-r from-gray-800 to-gray-700 text-gray-100 border border-gray-600',
      input: 'bg-gray-800 border-gray-600 text-gray-100'
    }
  };

  const currentTheme = themeClasses[theme];

  // Botão flutuante
  if (!isOpen) {
    return (
      <div className="fixed bottom-6 right-6 z-50 group">
        <button
          onClick={() => setIsOpen(true)}
          className="relative bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 text-white p-4 rounded-full shadow-2xl hover:shadow-3xl transform hover:scale-110 transition-all duration-300 animate-pulse group-hover:animate-none"
          aria-label="Abrir OFIX Ultra AI"
        >
          <MessageCircle className="w-6 h-6" />
          
          <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full flex items-center justify-center animate-ping">
            <Zap className="w-2 h-2 text-white" />
          </div>
          
          <div className="absolute -top-2 -left-2 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center">
            <Sparkles className="w-3 h-3 text-white" />
          </div>
        </button>
        
        <div className="absolute bottom-full right-0 mb-2 px-3 py-1 bg-black text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap">
          OFIX Ultra AI Assistant
        </div>
      </div>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <div className={`${currentTheme.container} rounded-3xl shadow-2xl border overflow-hidden transition-all duration-500 ${
        isFullscreen 
          ? 'w-screen h-screen fixed inset-0 rounded-none' 
          : isMinimized 
            ? 'w-80 h-16' 
            : 'w-[480px] h-[750px]'
      }`}>
        
        {/* Header moderno */}
        <div className={`${currentTheme.header} text-white p-4 relative overflow-hidden`}>
          <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 via-purple-600/20 to-indigo-600/20 animate-pulse"></div>
          
          <div className="relative flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="relative bg-white bg-opacity-20 rounded-full p-2 backdrop-blur-sm">
                <Bot className="w-5 h-5" />
                <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-400 rounded-full border-2 border-white animate-pulse"></div>
              </div>
              <div>
                <h3 className="font-bold text-sm flex items-center gap-2">
                  OFIX Ultra AI
                  <Sparkles className="w-4 h-4 text-yellow-300" />
                </h3>
                <div className="flex items-center gap-2 text-xs opacity-90">
                  <Activity className="w-3 h-3 animate-pulse" />
                  <span>
                    {isAnalyzing ? 'Analisando...' : 
                     isTyping ? 'Processando...' : 
                     'Sistema Online'}
                  </span>
                  {conversationContext.confidenceLevel > 0 && (
                    <span className="bg-white bg-opacity-20 px-2 py-0.5 rounded text-xs">
                      {Math.round(conversationContext.confidenceLevel * 100)}%
                    </span>
                  )}
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-1">
              <button
                onClick={toggleTheme}
                className="p-1.5 hover:bg-white hover:bg-opacity-20 rounded-lg transition-colors"
                title={`Tema ${theme === 'light' ? 'escuro' : 'claro'}`}
              >
                {theme === 'light' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
              </button>
              
              <button
                onClick={toggleSound}
                className="p-1.5 hover:bg-white hover:bg-opacity-20 rounded-lg transition-colors"
                title={soundEnabled ? 'Desativar som' : 'Ativar som'}
              >
                {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
              </button>
              
              <button
                onClick={exportConversation}
                className="p-1.5 hover:bg-white hover:bg-opacity-20 rounded-lg transition-colors"
                title="Exportar conversa"
              >
                <Download className="w-4 h-4" />
              </button>
              
              <button
                onClick={() => setIsFullscreen(!isFullscreen)}
                className="p-1.5 hover:bg-white hover:bg-opacity-20 rounded-lg transition-colors"
                title={isFullscreen ? 'Sair da tela cheia' : 'Tela cheia'}
              >
                {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
              </button>
              
              {!isFullscreen && (
                <button
                  onClick={() => setIsMinimized(!isMinimized)}
                  className="p-1.5 hover:bg-white hover:bg-opacity-20 rounded-lg transition-colors"
                >
                  {isMinimized ? <Maximize2 className="w-4 h-4" /> : <Minimize2 className="w-4 h-4" />}
                </button>
              )}
              
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 hover:bg-white hover:bg-opacity-20 rounded-lg transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
          
          {/* Barra de progresso */}
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-white bg-opacity-20">
            <div 
              className="h-full bg-gradient-to-r from-green-400 to-blue-400 transition-all duration-1000"
              style={{ width: `${Math.min((conversationContext.sessionMetrics.messagesCount / 20) * 100, 100)}%` }}
            ></div>
          </div>
        </div>

        {!isMinimized && (
          <>
            {/* Área de mensagens */}
            <div className={`flex-1 overflow-y-auto p-4 space-y-4 ${
              isFullscreen ? 'h-[calc(100vh-200px)]' : 'h-[520px]'
            } ${currentTheme.messageArea} custom-scrollbar`}>
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.isBot ? 'justify-start' : 'justify-end'} group`}
                >
                  <div className={`max-w-sm ${message.isBot ? 'mr-12' : 'ml-12'} relative`}>
                    <div
                      className={`px-4 py-3 rounded-2xl shadow-lg transition-all hover:shadow-xl transform hover:scale-[1.02] ${
                        message.isBot ? currentTheme.botMessage : currentTheme.userMessage
                      }`}
                    >
                      {message.isBot && (
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2 text-xs font-medium opacity-80">
                            {getMessageIcon(message.type)}
                            <span className="capitalize">{message.type || 'assistente'}</span>
                          </div>
                          <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={() => copyMessage(message.text)}
                              className="p-1 hover:bg-gray-200 rounded text-gray-500"
                              title="Copiar"
                            >
                              <Copy className="w-3 h-3" />
                            </button>
                          </div>
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
                            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button
                                onClick={() => handleMessageFeedback(message.id, 'positive')}
                                className="hover:bg-gray-200 rounded p-0.5"
                                title="Útil"
                              >
                                <ThumbsUp className="w-3 h-3" />
                              </button>
                              <button
                                onClick={() => handleMessageFeedback(message.id, 'negative')}
                                className="hover:bg-gray-200 rounded p-0.5"
                                title="Não útil"
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
                  <div className={`${currentTheme.botMessage} px-4 py-3 rounded-2xl shadow-md max-w-sm`}>
                    <div className="flex items-center gap-2">
                      <Bot className="w-4 h-4 text-blue-600" />
                      <div className="flex space-x-1">
                        <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce"></div>
                        <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                        <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                      </div>
                      <span className="text-xs text-gray-500">
                        {isAnalyzing ? 'Analisando...' : 'Processando...'}
                      </span>
                    </div>
                  </div>
                </div>
              )}
              
              <div ref={messagesEndRef} />
            </div>

            {/* Ações rápidas */}
            {quickActions.length > 0 && (
              <div className="px-4 py-2 border-t border-gray-100 bg-gradient-to-r from-blue-50 to-purple-50">
                <div className="flex flex-wrap gap-2">
                  <span className="text-xs text-gray-600 font-medium">Ações:</span>
                  {quickActions.slice(0, 4).map((action, index) => (
                    <button
                      key={index}
                      onClick={() => handleActionClick(action.label)}
                      className={`px-2 py-1 text-xs rounded-full transition-all duration-200 ${
                        action.category === 'emergency' 
                          ? 'bg-red-100 text-red-700 hover:bg-red-200 animate-pulse'
                          : 'bg-white text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      {action.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Sugestões */}
            {suggestions.length > 0 && (
              <div className="px-4 py-2 border-t border-gray-100 bg-gray-50">
                <div className="flex flex-wrap gap-2">
                  <span className="text-xs text-gray-600 font-medium">Sugestões:</span>
                  {suggestions.slice(0, 3).map((suggestion, index) => (
                    <button
                      key={index}
                      onClick={() => handleSendMessage(suggestion)}
                      className="px-3 py-1 text-xs bg-gradient-to-r from-blue-50 to-purple-50 text-blue-700 rounded-full hover:from-blue-100 hover:to-purple-100 transition-all duration-200 border border-blue-200"
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Área de input */}
            <div className={`p-4 border-t border-gray-200 ${currentTheme.container}`}>
              <div className="flex items-end gap-2">
                <div className="flex-1 relative">
                  <textarea
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder={
                      isListening ? "🎤 Escutando..." : 
                      isAnalyzing ? "⚡ Analisando..." :
                      "Digite sua mensagem..."
                    }
                    disabled={isTyping || isListening || isAnalyzing}
                    className={`w-full px-4 py-3 pr-32 ${currentTheme.input} border rounded-2xl resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200 max-h-24`}
                    rows="1"
                  />
                  
                  <div className="absolute right-2 bottom-2 flex gap-1">
                    <button
                      className="p-2 bg-gray-200 text-gray-600 hover:bg-gray-300 rounded-lg transition-all"
                      title="Anexar"
                    >
                      <Paperclip className="w-4 h-4" />
                    </button>
                    
                    <button
                      className="p-2 bg-gray-200 text-gray-600 hover:bg-gray-300 rounded-lg transition-all"
                      title="Foto"
                    >
                      <Camera className="w-4 h-4" />
                    </button>
                    
                    <button
                      onClick={isListening ? stopVoiceRecognition : startVoiceRecognition}
                      className={`p-2 rounded-lg transition-all ${
                        isListening 
                          ? 'bg-red-600 text-white animate-pulse' 
                          : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                      }`}
                      title="Voz"
                    >
                      {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                    </button>
                    
                    <button
                      onClick={() => handleSendMessage()}
                      disabled={!inputValue.trim() || isTyping}
                      className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-2 rounded-lg hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 transition-all transform hover:scale-105"
                    >
                      <Send className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
              
              {/* Status bar */}
              <div className="flex items-center justify-between mt-2 text-xs text-gray-500">
                <div className="flex items-center gap-2">
                  <User className="w-3 h-3" />
                  <span>{userProfile.name}</span>
                  <span>•</span>
                  <span>{conversationContext.sessionMetrics.messagesCount} msgs</span>
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
                  
                  {conversationContext.urgency === 'critical' && (
                    <span className="px-2 py-0.5 bg-red-100 text-red-600 rounded text-xs animate-pulse">
                      🚨 Crítica
                    </span>
                  )}
                  
                  <span className="px-2 py-0.5 bg-blue-100 text-blue-600 rounded text-xs">
                    ID: {currentSession?.slice(-4)}
                  </span>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
      
      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #f1f1f1;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: linear-gradient(to bottom, #6366f1, #8b5cf6);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: linear-gradient(to bottom, #4f46e5, #7c3aed);
        }
      `}</style>
    </div>
  );
};

export default UltimateChatBot;
