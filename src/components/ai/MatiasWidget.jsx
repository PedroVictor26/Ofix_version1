/**
 * 🤖 MATIAS - Assistente Virtual Ofix
 * 
 * O mecânico-chefe digital da Ofix
 * Persona: Experiente, resolutivo, proativo
 * Funcionalidades: Consultoria, gestão de tarefas, suporte omnichannel
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  MessageCircle, 
  X, 
  Send, 
  Mic, 
  MicOff,
  FileText,
  Calendar,
  Wrench,
  User,
  Phone,
  Bot,
  Minimize2,
  Maximize2,
  Settings,
  Languages,
  Download,
  Bell,
  Clock,
  CheckCircle,
  AlertCircle,
  Info,
  Search,
  History,
  Bookmark,
  Globe
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import toast from 'react-hot-toast';

// Hook personalizado para o Matias
const useMatiasAssistant = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [conversationHistory, setConversationHistory] = useState([]);
  const [userContext, setUserContext] = useState(null);
  const [language, setLanguage] = useState('pt-BR');
  const [isTyping, setIsTyping] = useState(false);
  const [offlineData, setOfflineData] = useState(null);

  // Carregar dados offline na inicialização
  useEffect(() => {
    loadOfflineData();
    initializeMatias();
  }, []);

  const loadOfflineData = () => {
    try {
      const cached = localStorage.getItem('matias_offline_data');
      if (cached) {
        setOfflineData(JSON.parse(cached));
      }
    } catch (error) {
      console.warn('Erro ao carregar dados offline:', error);
    }
  };

  const initializeMatias = async () => {
    try {
      // Simular inicialização do Matias
      setIsConnected(true);
      
      // Carregar histórico se disponível
      const history = localStorage.getItem('matias_conversation_history');
      if (history) {
        setConversationHistory(JSON.parse(history));
      } else {
        // Mensagem de boas-vindas inicial
        const welcomeMessage = {
          id: Date.now(),
          type: 'assistant',
          content: getWelcomeMessage(language),
          timestamp: new Date(),
          context: 'welcome'
        };
        setConversationHistory([welcomeMessage]);
      }
    } catch (error) {
      console.error('Erro ao inicializar Matias:', error);
      setIsConnected(false);
    }
  };

  const getWelcomeMessage = (lang) => {
    const messages = {
      'pt-BR': `🔧 **Olá! Eu sou o Matias, o mecânico-chefe digital da Ofix!**

Sou seu braço direito virtual, com conhecimento profundo de:

• **🚗 Diagnósticos técnicos** especializados
• **📅 Gestão de agendamentos** inteligente  
• **📋 Acompanhamento de OS** em tempo real
• **💰 Orçamentos e consultorias** detalhadas
• **🆘 Suporte técnico** 24/7

**Como posso ajudá-lo hoje?** Fale comigo como faria com seu mecânico de confiança!`,
      
      'en': `🔧 **Hello! I'm Matias, Ofix's digital chief mechanic!**

I'm your virtual right-hand, with deep knowledge of:

• **🚗 Specialized technical diagnostics**
• **📅 Intelligent scheduling management**
• **📋 Real-time service order tracking**
• **💰 Detailed budgets and consulting**
• **🆘 24/7 technical support**

**How can I help you today?** Talk to me like you would with your trusted mechanic!`
    };
    
    return messages[lang] || messages['pt-BR'];
  };

  const sendMessage = async (message, type = 'text') => {
    if (!message.trim()) return;

    const userMessage = {
      id: Date.now(),
      type: 'user',
      content: message,
      timestamp: new Date(),
      messageType: type
    };

    setConversationHistory(prev => [...prev, userMessage]);
    setIsTyping(true);

    try {
      // Chamada para API do Matias
      const response = await fetch('/api/matias/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message,
          type,
          language,
          context: userContext,
          history: conversationHistory.slice(-10) // Últimas 10 mensagens para contexto
        })
      });

      if (!response.ok) {
        throw new Error('Falha na comunicação com o Matias');
      }

      const data = await response.json();
      
      const assistantMessage = {
        id: Date.now() + 1,
        type: 'assistant',
        content: data.response,
        timestamp: new Date(),
        context: data.context,
        actions: data.actions || [],
        attachments: data.attachments || []
      };

      setConversationHistory(prev => [...prev, assistantMessage]);
      
      // Salvar histórico localmente
      localStorage.setItem('matias_conversation_history', 
        JSON.stringify([...conversationHistory, userMessage, assistantMessage]));
      
      // Executar ações se houver
      if (data.actions && data.actions.length > 0) {
        executeActions(data.actions);
      }

    } catch (error) {
      console.error('Erro ao enviar mensagem:', error);
      
      // Fallback offline
      const fallbackMessage = {
        id: Date.now() + 1,
        type: 'assistant',
        content: getFallbackResponse(message, language),
        timestamp: new Date(),
        isOffline: true
      };
      
      setConversationHistory(prev => [...prev, fallbackMessage]);
    } finally {
      setIsTyping(false);
    }
  };

  const getFallbackResponse = (message, lang) => {
    const responses = {
      'pt-BR': `🔧 **Matias (Modo Offline)**

Estou temporariamente offline, mas posso ajudar com:

• **📋 Consultar dados já carregados**
• **📅 Acessar agendamentos salvos**
• **🔍 Buscar no histórico local**
• **📖 Consultar base de conhecimento**

**Sua mensagem foi registrada** e será processada quando eu voltar online!`,
      
      'en': `🔧 **Matias (Offline Mode)**

I'm temporarily offline, but I can help with:

• **📋 Consulting already loaded data**
• **📅 Accessing saved schedules**
• **🔍 Searching local history**
• **📖 Consulting knowledge base**

**Your message has been recorded** and will be processed when I'm back online!`
    };
    
    return responses[lang] || responses['pt-BR'];
  };

  const executeActions = (actions) => {
    actions.forEach(action => {
      switch (action.type) {
        case 'notification':
          toast.success(action.message);
          break;
        case 'redirect':
          // Implementar redirecionamento
          break;
        case 'update_context':
          setUserContext(prev => ({ ...prev, ...action.data }));
          break;
        default:
          console.log('Ação não reconhecida:', action);
      }
    });
  };

  return {
    isConnected,
    conversationHistory,
    userContext,
    language,
    isTyping,
    offlineData,
    sendMessage,
    setLanguage,
    clearHistory: () => {
      setConversationHistory([]);
      localStorage.removeItem('matias_conversation_history');
    }
  };
};

// Componente do Matias Widget
const MatiasWidget = ({ 
  position = 'bottom-right',
  compact = false,
  onAction = () => {},
  customStyles = {}
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [currentMessage, setCurrentMessage] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [activeTab, setActiveTab] = useState('chat');
  const [notifications, setNotifications] = useState([]);
  
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const mediaRecorderRef = useRef(null);

  const {
    isConnected,
    conversationHistory,
    userContext,
    language,
    isTyping,
    offlineData,
    sendMessage,
    setLanguage,
    clearHistory
  } = useMatiasAssistant();

  // Auto-scroll para última mensagem
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [conversationHistory, isTyping]);

  // Focar input quando abrir
  useEffect(() => {
    if (isOpen && !isMinimized) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen, isMinimized]);

  const handleSendMessage = async () => {
    if (!currentMessage.trim()) return;
    
    await sendMessage(currentMessage);
    setCurrentMessage('');
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const toggleRecording = async () => {
    if (isRecording) {
      // Parar gravação
      if (mediaRecorderRef.current) {
        mediaRecorderRef.current.stop();
      }
      setIsRecording(false);
    } else {
      // Iniciar gravação
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const mediaRecorder = new MediaRecorder(stream);
        
        mediaRecorder.ondataavailable = (event) => {
          if (event.data.size > 0) {
            // Processar áudio
            processAudioRecording(event.data);
          }
        };
        
        mediaRecorder.start();
        mediaRecorderRef.current = mediaRecorder;
        setIsRecording(true);
      } catch (error) {
        console.error('Erro ao acessar microfone:', error);
        toast.error('Erro ao acessar microfone');
      }
    }
  };

  const processAudioRecording = async (audioBlob) => {
    try {
      const formData = new FormData();
      formData.append('audio', audioBlob);
      formData.append('language', language);

      const response = await fetch('/api/matias/voice', {
        method: 'POST',
        body: formData
      });

      if (response.ok) {
        const data = await response.json();
        await sendMessage(data.transcription, 'voice');
      }
    } catch (error) {
      console.error('Erro ao processar áudio:', error);
      toast.error('Erro ao processar áudio');
    }
  };

  const exportConversation = () => {
    const data = {
      timestamp: new Date().toISOString(),
      language,
      conversation: conversationHistory,
      context: userContext
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `matias-conversation-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const getPositionClasses = () => {
    const positions = {
      'bottom-right': 'bottom-4 right-4',
      'bottom-left': 'bottom-4 left-4',
      'top-right': 'top-4 right-4',
      'top-left': 'top-4 left-4'
    };
    return positions[position] || positions['bottom-right'];
  };

  const renderMessage = (message) => {
    const isUser = message.type === 'user';
    
    return (
      <motion.div
        key={message.id}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-4`}
      >
        <div className={`max-w-[80%] ${isUser ? 'order-2' : 'order-1'}`}>
          {!isUser && (
            <div className="flex items-center gap-2 mb-1">
              <div className="w-6 h-6 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center">
                <Bot className="w-3 h-3 text-white" />
              </div>
              <span className="text-xs text-slate-500 font-medium">Matias</span>
              {message.isOffline && (
                <span className="text-xs bg-gray-200 px-2 py-1 rounded">Offline</span>
              )}
            </div>
          )}
          
          <div className={`
            p-3 rounded-lg shadow-sm
            ${isUser 
              ? 'bg-blue-500 text-white' 
              : 'bg-white border border-slate-200 text-slate-700'
            }
          `}>
            <div className="text-sm whitespace-pre-wrap">
              {message.content}
            </div>
            
            {message.attachments && message.attachments.length > 0 && (
              <div className="mt-2 space-y-1">
                {message.attachments.map((attachment, index) => (
                  <div key={index} className="flex items-center gap-2 text-xs text-slate-500">
                    <FileText className="w-3 h-3" />
                    {attachment.name}
                  </div>
                ))}
              </div>
            )}
            
            <div className="text-xs text-slate-400 mt-1">
              {message.timestamp.toLocaleTimeString()}
            </div>
          </div>
          
          {message.actions && message.actions.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1">
              {message.actions.map((action, index) => (
                <Button
                  key={index}
                  variant="outline"
                  size="sm"
                  className="text-xs"
                  onClick={() => onAction(action)}
                >
                  {action.label}
                </Button>
              ))}
            </div>
          )}
        </div>
      </motion.div>
    );
  };

  if (compact) {
    return (
      <Button
        onClick={() => setIsOpen(true)}
        className={`fixed ${getPositionClasses()} z-50 w-12 h-12 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 shadow-lg hover:shadow-xl transition-all duration-300`}
        style={customStyles}
      >
        <Bot className="w-5 h-5 text-white" />
      </Button>
    );
  }

  return (
    <>
      {/* Floating Button */}
      <AnimatePresence>
        {!isOpen && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0 }}
            className={`fixed ${getPositionClasses()} z-50`}
          >
            <Button
              onClick={() => setIsOpen(true)}
              className="w-14 h-14 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-110"
              style={customStyles}
            >
              <div className="relative">
                <Bot className="w-6 h-6 text-white" />
                {notifications.length > 0 && (
                  <div className="absolute -top-2 -right-2 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center">
                    <span className="text-xs text-white font-bold">
                      {notifications.length > 9 ? '9+' : notifications.length}
                    </span>
                  </div>
                )}
                <div className={`absolute -top-1 -right-1 w-3 h-3 rounded-full ${isConnected ? 'bg-green-400' : 'bg-red-400'} border-2 border-white`} />
              </div>
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 20 }}
            className={`fixed ${getPositionClasses()} z-50 w-96 h-[500px] bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden`}
            style={customStyles}
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-4 text-white">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                      <Bot className="w-5 h-5" />
                    </div>
                    <div className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full ${isConnected ? 'bg-green-400' : 'bg-red-400'} border-2 border-white`} />
                  </div>
                  <div>
                    <h3 className="font-semibold">Matias</h3>
                    <p className="text-xs text-white/80">
                      {isConnected ? 'Mecânico-chefe online' : 'Offline'}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsMinimized(!isMinimized)}
                    className="text-white hover:bg-white/20 w-8 h-8 p-0"
                  >
                    {isMinimized ? <Maximize2 className="w-4 h-4" /> : <Minimize2 className="w-4 h-4" />}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsOpen(false)}
                    className="text-white hover:bg-white/20 w-8 h-8 p-0"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>

            {/* Content */}
            <AnimatePresence>
              {!isMinimized && (
                <motion.div
                  initial={{ height: 0 }}
                  animate={{ height: 'auto' }}
                  exit={{ height: 0 }}
                  className="flex-1 flex flex-col h-[436px]"
                >
                  {/* Tabs */}
                  <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
                    <TabsList className="grid w-full grid-cols-3 m-2">
                      <TabsTrigger value="chat" className="text-xs">
                        <MessageCircle className="w-3 h-3 mr-1" />
                        Chat
                      </TabsTrigger>
                      <TabsTrigger value="history" className="text-xs">
                        <History className="w-3 h-3 mr-1" />
                        Histórico
                      </TabsTrigger>
                      <TabsTrigger value="settings" className="text-xs">
                        <Settings className="w-3 h-3 mr-1" />
                        Config
                      </TabsTrigger>
                    </TabsList>

                    {/* Chat Tab */}
                    <TabsContent value="chat" className="flex-1 flex flex-col m-0">
                      <ScrollArea className="flex-1 p-4">
                        {conversationHistory.map(renderMessage)}
                        
                        {isTyping && (
                          <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="flex justify-start mb-4"
                          >
                            <div className="flex items-center gap-2 text-slate-500">
                              <div className="w-6 h-6 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center">
                                <Bot className="w-3 h-3 text-white" />
                              </div>
                              <div className="flex space-x-1">
                                <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" />
                                <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                                <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                              </div>
                            </div>
                          </motion.div>
                        )}
                        
                        <div ref={messagesEndRef} />
                      </ScrollArea>

                      {/* Input */}
                      <div className="p-4 border-t border-slate-200">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 relative">
                            <Input
                              ref={inputRef}
                              value={currentMessage}
                              onChange={(e) => setCurrentMessage(e.target.value)}
                              onKeyPress={handleKeyPress}
                              placeholder="Digite sua mensagem..."
                              className="pr-12"
                            />
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={toggleRecording}
                              className={`absolute right-1 top-1 w-8 h-8 p-0 ${isRecording ? 'text-red-500' : 'text-slate-400'}`}
                            >
                              {isRecording ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                            </Button>
                          </div>
                          <Button
                            onClick={handleSendMessage}
                            disabled={!currentMessage.trim()}
                            className="w-10 h-10 p-0 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
                          >
                            <Send className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </TabsContent>

                    {/* History Tab */}
                    <TabsContent value="history" className="flex-1 p-4">
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <h4 className="font-semibold text-sm">Conversas Anteriores</h4>
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={exportConversation}
                              className="text-xs"
                            >
                              <Download className="w-3 h-3 mr-1" />
                              Exportar
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={clearHistory}
                              className="text-xs text-red-600 hover:text-red-700"
                            >
                              Limpar
                            </Button>
                          </div>
                        </div>
                        
                        <ScrollArea className="h-72">
                          {conversationHistory.length > 0 ? (
                            <div className="space-y-2">
                              {conversationHistory.map((msg, index) => (
                                <Card key={index} className="p-3">
                                  <div className="flex items-start gap-2">
                                    <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                                      msg.type === 'user' ? 'bg-blue-100' : 'bg-purple-100'
                                    }`}>
                                      {msg.type === 'user' ? (
                                        <User className="w-3 h-3 text-blue-600" />
                                      ) : (
                                        <Bot className="w-3 h-3 text-purple-600" />
                                      )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <p className="text-xs text-slate-600 truncate">
                                        {msg.content}
                                      </p>
                                      <p className="text-xs text-slate-400 mt-1">
                                        {msg.timestamp.toLocaleString()}
                                      </p>
                                    </div>
                                  </div>
                                </Card>
                              ))}
                            </div>
                          ) : (
                            <div className="text-center text-slate-500 text-sm mt-8">
                              Nenhuma conversa anterior
                            </div>
                          )}
                        </ScrollArea>
                      </div>
                    </TabsContent>

                    {/* Settings Tab */}
                    <TabsContent value="settings" className="flex-1 p-4">
                      <div className="space-y-4">
                        <h4 className="font-semibold text-sm">Configurações do Matias</h4>
                        
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm font-medium">Idioma</p>
                              <p className="text-xs text-slate-500">Idioma das conversas</p>
                            </div>
                            <select
                              value={language}
                              onChange={(e) => setLanguage(e.target.value)}
                              className="text-sm border border-slate-200 rounded px-2 py-1"
                            >
                              <option value="pt-BR">Português (BR)</option>
                              <option value="en">English</option>
                            </select>
                          </div>
                          
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm font-medium">Notificações</p>
                              <p className="text-xs text-slate-500">Alertas do sistema</p>
                            </div>
                            <input type="checkbox" className="mr-2" />
                          </div>
                          
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm font-medium">Modo Offline</p>
                              <p className="text-xs text-slate-500">Cache local de dados</p>
                            </div>
                            <input type="checkbox" defaultChecked className="mr-2" />
                          </div>
                          
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm font-medium">Voz</p>
                              <p className="text-xs text-slate-500">Comando por voz</p>
                            </div>
                            <input type="checkbox" defaultChecked className="mr-2" />
                          </div>
                        </div>
                        
                        <div className="pt-4 border-t border-slate-200">
                          <div className="space-y-2 text-xs text-slate-500">
                            <div className="flex justify-between">
                              <span>Status:</span>
                              <span className={`text-xs px-2 py-1 rounded ${isConnected ? 'bg-green-200 text-green-800' : 'bg-red-200 text-red-800'}`}>
                                {isConnected ? 'Online' : 'Offline'}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span>Versão:</span>
                              <span>v2.0.0</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Mensagens:</span>
                              <span>{conversationHistory.length}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </TabsContent>
                  </Tabs>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default MatiasWidget;
