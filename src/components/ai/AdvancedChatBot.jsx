import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Send, Bot, MessageCircle, Minimize2, Maximize2, X, 
  Settings, RefreshCw, Download, Mic, MicOff,
  FileText, Calendar, MapPin, Phone, Mail,
  Wrench, Car, AlertTriangle, CheckCircle,
  TrendingUp, Clock, User, Star
} from 'lucide-react';

const AdvancedChatBot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [currentSession, setCurrentSession] = useState(null);
  const [chatMode, setChatMode] = useState('assistant'); // assistant, diagnostic, scheduling
  const [userProfile, setUserProfile] = useState({
    name: 'Cliente',
    type: 'cliente', // cliente, mecanico, admin
    lastVisit: null,
    preferences: []
  });

  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [conversationContext, setConversationContext] = useState({
    topic: null,
    entities: [],
    sentiment: 'neutral',
    urgency: 'low'
  });

  const messagesEndRef = useRef(null);
  const recognitionRef = useRef(null);

  // Sistema avançado de análise de contexto
  const analyzeMessage = (message) => {
    const text = message.toLowerCase();
    const context = { ...conversationContext };
    
    // Análise de entidades
    const entities = [];
    const carBrands = ['volkswagen', 'ford', 'chevrolet', 'fiat', 'toyota', 'honda', 'nissan', 'hyundai'];
    const carModels = ['gol', 'onix', 'corolla', 'civic', 'fit', 'ka', 'uno', 'palio'];
    const carYears = text.match(/\b(19|20)\d{2}\b/g);
    
    carBrands.forEach(brand => {
      if (text.includes(brand)) entities.push({ type: 'brand', value: brand });
    });
    
    carModels.forEach(model => {
      if (text.includes(model)) entities.push({ type: 'model', value: model });
    });
    
    if (carYears) {
      carYears.forEach(year => entities.push({ type: 'year', value: year }));
    }

    // Análise de tópicos
    if (text.includes('agend') || text.includes('marca')) context.topic = 'scheduling';
    else if (text.includes('problema') || text.includes('barulho') || text.includes('não liga')) context.topic = 'diagnostic';
    else if (text.includes('preço') || text.includes('valor') || text.includes('quanto')) context.topic = 'pricing';
    else if (text.includes('horário') || text.includes('funciona')) context.topic = 'hours';

    // Análise de sentimento
    const positiveWords = ['ótimo', 'bom', 'excelente', 'perfeito', 'obrigado'];
    const negativeWords = ['problema', 'ruim', 'péssimo', 'demora', 'caro'];
    
    if (positiveWords.some(word => text.includes(word))) context.sentiment = 'positive';
    else if (negativeWords.some(word => text.includes(word))) context.sentiment = 'negative';

    // Análise de urgência
    const urgentWords = ['urgente', 'emergência', 'quebrou', 'parou', 'não liga'];
    if (urgentWords.some(word => text.includes(word))) context.urgency = 'high';

    context.entities = entities;
    setConversationContext(context);
    
    return context;
  };

  // Sistema avançado de geração de respostas
  const generateAdvancedResponse = (userMessage, context) => {
    const message = userMessage.toLowerCase();
    
    // Respostas baseadas em contexto e entidades
    if (context.topic === 'diagnostic') {
      return generateDiagnosticResponse(message, context);
    } else if (context.topic === 'scheduling') {
      return generateSchedulingResponse(message, context);
    } else if (context.topic === 'pricing') {
      return generatePricingResponse(message, context);
    }

    // Respostas contextuais avançadas
    if (message.includes('mecânico') || message.includes('especialista')) {
      return {
        text: "👨‍🔧 **Nossos Mecânicos Especializados**\n\n• **João Silva** - Especialista em motores\n• **Carlos Santos** - Elétrica automotiva\n• **Pedro Lima** - Suspensão e freios\n• **Ana Costa** - Ar condicionado\n\nTodos certificados com mais de 10 anos de experiência!",
        type: 'info',
        actions: ['Agendar com especialista', 'Ver certificações']
      };
    }

    if (message.includes('garantia') || message.includes('cobertura')) {
      return {
        text: "🛡️ **Nossa Garantia**\n\n• **Serviços**: 90 dias ou 5.000 km\n• **Peças originais**: 1 ano\n• **Peças paralelas**: 6 meses\n• **Diagnóstico**: Gratuito se executar o serviço\n\n*Condições aplicáveis conforme tipo de serviço*",
        type: 'warranty',
        actions: ['Ver termos completos', 'Acionar garantia']
      };
    }

    if (message.includes('emergência') || message.includes('guincho')) {
      return {
        text: "🚨 **Serviço de Emergência 24h**\n\n📞 **Ligue agora**: (11) 99999-9999\n\n• Guincho 24h disponível\n• Atendimento em domicílio\n• Diagnóstico móvel\n• Chaveiro automotivo\n\n*Taxa de deslocamento pode ser aplicada*",
        type: 'emergency',
        actions: ['Chamar guincho', 'Emergência domicílio']
      };
    }

    // Resposta padrão inteligente
    return {
      text: "🤖 Analisei sua mensagem e posso ajudar com informações detalhadas sobre:\n\n• **Diagnósticos técnicos** - Problemas específicos do seu veículo\n• **Agendamentos** - Marcar serviços com hora marcada\n• **Orçamentos** - Preços detalhados por serviço\n• **Emergências** - Atendimento 24h\n\nSobre qual tema você gostaria de conversar?",
      type: 'general',
      actions: ['Diagnóstico', 'Agendamento', 'Orçamento', 'Emergência']
    };
  };

  const generateDiagnosticResponse = (message, context) => {
    const symptoms = [];
    if (message.includes('barulho')) symptoms.push('ruído anormal');
    if (message.includes('não liga')) symptoms.push('falha na partida');
    if (message.includes('fumaça')) symptoms.push('emissão de fumaça');
    if (message.includes('vibra')) symptoms.push('vibração excessiva');

    const carInfo = context.entities.filter(e => ['brand', 'model', 'year'].includes(e.type));
    
    return {
      text: `🔧 **Análise Técnica Preliminar**\n\n${symptoms.length > 0 ? `**Sintomas identificados:**\n${symptoms.map(s => `• ${s}`).join('\n')}\n\n` : ''}${carInfo.length > 0 ? `**Veículo:** ${carInfo.map(e => e.value).join(' ')}\n\n` : ''}**Possíveis causas:**\n• Verificação do sistema elétrico\n• Análise do sistema de combustível\n• Inspeção de componentes mecânicos\n\n**Recomendação:** Traga para diagnóstico computadorizado (R$ 50 - grátis se executar o serviço)`,
      type: 'diagnostic',
      actions: ['Agendar diagnóstico', 'Falar com técnico', 'Ver casos similares']
    };
  };

  const generateSchedulingResponse = (message, context) => {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    return {
      text: `📅 **Agendamento de Serviços**\n\n**Horários disponíveis:**\n• Hoje: 14h, 16h\n• Amanhã: 8h, 10h, 14h, 16h\n• Terça: 8h, 9h, 11h, 15h\n\n**Informações necessárias:**\n• Modelo e ano do veículo\n• Tipo de serviço desejado\n• Sintomas ou problemas\n\n**WhatsApp direto:** (11) 99999-9999`,
      type: 'scheduling',
      actions: ['Agendar agora', 'Ver agenda completa', 'Reagendar existente']
    };
  };

  const generatePricingResponse = (message, context) => {
    return {
      text: `💰 **Tabela de Preços Atualizada**\n\n**Serviços Básicos:**\n• Troca de óleo: R$ 80-150\n• Revisão básica: R$ 150-300\n• Alinhamento: R$ 50-80\n• Balanceamento: R$ 40-60\n\n**Serviços Avançados:**\n• Diagnóstico computadorizado: R$ 50*\n• Reparo de freios: R$ 200-500\n• Suspensão: R$ 300-800\n• Ar condicionado: R$ 150-400\n\n*Grátis se executar o serviço\n\n**Formas de pagamento:** Dinheiro, PIX, cartões`,
      type: 'pricing',
      actions: ['Solicitar orçamento', 'Ver promoções', 'Financiamento']
    };
  };

  // Sugestões inteligentes baseadas no contexto
  const generateSmartSuggestions = useCallback((context) => {
    let newSuggestions = [];

    if (context.topic === 'diagnostic') {
      newSuggestions = [
        'Agendar diagnóstico',
        'Sintomas específicos',
        'Casos similares',
        'Emergência'
      ];
    } else if (context.topic === 'scheduling') {
      newSuggestions = [
        'Horários hoje',
        'Próxima semana',
        'Cancelar agendamento',
        'Reagendar'
      ];
    } else {
      newSuggestions = [
        'Horários funcionamento',
        'Serviços oferecidos',
        'Como chegar',
        'Falar com atendente'
      ];
    }

    setSuggestions(newSuggestions);
  }, []);

  const initializeSession = useCallback(() => {
    const sessionId = `session_${Date.now()}`;
    setCurrentSession(sessionId);
    
    const welcomeMessage = {
      id: 1,
      text: `🚗 **Bem-vindo à OFIX Auto Center!**\n\nSou seu assistente virtual inteligente. Posso ajudar com:\n\n• **Diagnósticos técnicos** completos\n• **Agendamentos** personalizados  \n• **Orçamentos** detalhados\n• **Suporte** especializado\n\nComo posso ajudar você hoje?`,
      isBot: true,
      timestamp: new Date(),
      type: 'welcome',
      actions: ['Diagnóstico', 'Agendamento', 'Orçamento', 'Emergência']
    };

    setMessages([welcomeMessage]);
    generateSmartSuggestions(conversationContext);
  }, [conversationContext, generateSmartSuggestions]);

  useEffect(() => {
    if (isOpen && messages.length === 0) {
      initializeSession();
    }
  }, [isOpen, messages.length, initializeSession]);

  useEffect(() => {
    generateSmartSuggestions(conversationContext);
  }, [conversationContext, generateSmartSuggestions]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

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

    // Análise avançada da mensagem
    const context = analyzeMessage(messageText);

    // Simular processamento inteligente
    setTimeout(() => {
      const response = generateAdvancedResponse(messageText, context);
      
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
    }, 1500 + Math.random() * 1000);
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

  // Funcionalidade de voz
  const startVoiceRecognition = () => {
    if ('webkitSpeechRecognition' in window) {
      const recognition = new window.webkitSpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'pt-BR';

      recognition.onstart = () => {
        setIsListening(true);
      };

      recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        setInputValue(transcript);
        setIsListening(false);
      };

      recognition.onerror = () => {
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

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

  const exportConversation = () => {
    const conversationText = messages.map(msg => 
      `[${msg.timestamp.toLocaleTimeString()}] ${msg.isBot ? 'OFIX Bot' : 'Você'}: ${msg.text}`
    ).join('\n\n');
    
    const blob = new Blob([conversationText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `conversa-ofix-${new Date().toISOString().split('T')[0]}.txt`;
    a.click();
  };

  const getMessageIcon = (type) => {
    switch (type) {
      case 'diagnostic': return <Wrench className="w-4 h-4" />;
      case 'scheduling': return <Calendar className="w-4 h-4" />;
      case 'pricing': return <TrendingUp className="w-4 h-4" />;
      case 'emergency': return <AlertTriangle className="w-4 h-4" />;
      case 'warranty': return <CheckCircle className="w-4 h-4" />;
      default: return <Bot className="w-4 h-4" />;
    }
  };

  if (!isOpen) {
    return (
      <div className="fixed bottom-6 right-6 z-50">
        <button
          onClick={() => setIsOpen(true)}
          className="bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 text-white p-4 rounded-full shadow-2xl hover:shadow-3xl transform hover:scale-110 transition-all duration-300 animate-pulse relative"
          aria-label="Abrir chat avançado"
        >
          <MessageCircle className="w-6 h-6" />
          <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center">
            <span className="text-xs font-bold text-white">!</span>
          </div>
        </button>
      </div>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <div className={`bg-white rounded-3xl shadow-2xl border border-gray-200 overflow-hidden transition-all duration-500 ${
        isMinimized ? 'w-80 h-16' : 'w-[420px] h-[650px]'
      }`}>
        
        {/* Header avançado */}
        <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 text-white p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-white bg-opacity-20 rounded-full p-2 relative">
                <Bot className="w-5 h-5" />
                <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-400 rounded-full border-2 border-white"></div>
              </div>
              <div>
                <h3 className="font-bold text-sm">OFIX AI Assistant</h3>
                <div className="flex items-center gap-2 text-xs opacity-90">
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                    <span>Inteligência Ativa</span>
                  </div>
                  {currentSession && (
                    <span className="bg-white bg-opacity-20 px-2 py-0.5 rounded text-xs">
                      Sessão: {currentSession.slice(-6)}
                    </span>
                  )}
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-1">
              <button
                onClick={exportConversation}
                className="p-1.5 hover:bg-white hover:bg-opacity-20 rounded-lg transition-colors"
                title="Exportar conversa"
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
            {/* Área de mensagens avançada */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 h-[430px] bg-gradient-to-b from-gray-50 to-white">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.isBot ? 'justify-start' : 'justify-end'}`}
                >
                  <div className={`max-w-sm ${message.isBot ? 'mr-12' : 'ml-12'}`}>
                    <div
                      className={`px-4 py-3 rounded-2xl shadow-md ${
                        message.isBot
                          ? 'bg-gradient-to-r from-gray-100 to-gray-50 text-gray-800 border border-gray-200'
                          : 'bg-gradient-to-r from-blue-600 to-purple-600 text-white'
                      }`}
                    >
                      {message.isBot && (
                        <div className="flex items-center gap-2 mb-2 text-xs font-medium text-gray-600">
                          {getMessageIcon(message.type)}
                          <span className="capitalize">{message.type || 'assistente'}</span>
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
                              className="px-3 py-1.5 text-xs bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-colors shadow-sm"
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
                        {!message.isBot && <CheckCircle className="w-3 h-3" />}
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              {isTyping && (
                <div className="flex justify-start">
                  <div className="bg-gradient-to-r from-gray-100 to-gray-50 border border-gray-200 text-gray-800 px-4 py-3 rounded-2xl shadow-md">
                    <div className="flex items-center gap-2">
                      <Bot className="w-4 h-4 text-blue-600" />
                      <div className="flex space-x-1">
                        <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce"></div>
                        <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                        <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                      </div>
                      <span className="text-xs text-gray-500">Analisando...</span>
                    </div>
                  </div>
                </div>
              )}
              
              <div ref={messagesEndRef} />
            </div>

            {/* Sugestões inteligentes */}
            {suggestions.length > 0 && (
              <div className="px-4 py-2 border-t border-gray-100 bg-gray-50">
                <div className="flex flex-wrap gap-2">
                  {suggestions.map((suggestion, index) => (
                    <button
                      key={index}
                      onClick={() => handleSendMessage(suggestion)}
                      className="px-3 py-1.5 text-sm bg-gradient-to-r from-blue-50 to-purple-50 text-blue-700 rounded-full hover:from-blue-100 hover:to-purple-100 transition-all duration-200 border border-blue-200 shadow-sm"
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Área de input avançada */}
            <div className="p-4 border-t border-gray-200 bg-white">
              <div className="flex items-end gap-2">
                <div className="flex-1 relative">
                  <textarea
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder={isListening ? "Escutando..." : "Digite sua mensagem..."}
                    disabled={isTyping || isListening}
                    className="w-full px-4 py-3 pr-20 bg-gray-50 border border-gray-200 rounded-2xl resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 max-h-24"
                    rows="1"
                  />
                  
                  <div className="absolute right-2 bottom-2 flex gap-1">
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
                      disabled={!inputValue.trim() || isTyping || isListening}
                      className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-2 rounded-lg hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-105 shadow-md"
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
                  <span>{messages.length} mensagens</span>
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
                    <span className="px-2 py-0.5 bg-red-100 text-red-600 rounded text-xs">
                      ⚡ Urgente
                    </span>
                  )}
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default AdvancedChatBot;
