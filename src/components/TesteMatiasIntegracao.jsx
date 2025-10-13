import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, AlertCircle, CheckCircle, Loader2 } from 'lucide-react';

const TesteMatiasIntegracao = () => {
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState('unknown');
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Testar conexão com Matias ao carregar
  useEffect(() => {
    testarConexao();
  }, []);

  const testarConexao = async () => {
    try {
      console.log('🔍 Testando conexão com Matias...');
      console.log('🌐 URL completa:', window.location.origin + '/api/agno/chat-matias');
      
      const response = await fetch('/api/agno/chat-matias', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          message: 'teste de conexão',
          user_id: 'test_connection'
        })
      });

      console.log('📡 Response status:', response.status);
      console.log('📡 Response headers:', [...response.headers.entries()]);

      if (response.ok) {
        const data = await response.json();
        console.log('📦 Response data:', data);
        if (data.success) {
          setConnectionStatus('connected');
          console.log('✅ Conexão com Matias estabelecida');
        } else {
          setConnectionStatus('error');
          console.warn('⚠️ Resposta de erro do Matias:', data);
        }
      } else {
        const errorText = await response.text();
        setConnectionStatus('error');
        console.error('❌ Erro na conexão:', response.status, errorText);
      }
    } catch (error) {
      setConnectionStatus('error');
      console.error('💥 Falha na conexão:', error);
    }
  };

  const enviarMensagem = async () => {
    if (!inputMessage.trim() || isLoading) return;

    const userMessage = inputMessage.trim();
    setInputMessage('');
    setIsLoading(true);

    // Adicionar mensagem do usuário
    const newUserMessage = {
      id: Date.now(),
      type: 'user',
      content: userMessage,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, newUserMessage]);

    try {
      console.log('🤖 Enviando para Matias:', userMessage);

      const response = await fetch('/api/agno/chat-matias', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          message: userMessage,
          user_id: `user_${Date.now()}`
        })
      });

      console.log('📊 Response status no envio:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Response não ok:', response.status, errorText);
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      const data = await response.json();
      console.log('📦 Data recebida:', data);

      if (data.success) {
        // Resposta bem-sucedida
        const assistantMessage = {
          id: Date.now() + 1,
          type: 'assistant',
          content: data.response,
          agent: data.agent,
          model: data.model,
          status: data.status,
          timestamp: new Date()
        };

        setMessages(prev => [...prev, assistantMessage]);
        console.log('✅ Resposta recebida:', data.agent, data.model);

      } else {
        // Erro na resposta
        const errorMessage = {
          id: Date.now() + 1,
          type: 'error',
          content: data.response || 'Erro na comunicação com o assistente',
          error: data.error,
          timestamp: new Date()
        };

        setMessages(prev => [...prev, errorMessage]);
        console.error('❌ Erro na resposta:', data);
      }

    } catch (error) {
      // Erro de conexão
      const errorMessage = {
        id: Date.now() + 1,
        type: 'error',
        content: 'Erro de conexão. Verifique sua internet e tente novamente.',
        error: error.message,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, errorMessage]);
      console.error('💥 Erro de conexão:', error);
    }

    setIsLoading(false);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      enviarMensagem();
    }
  };

  const perguntasExemplo = [
    "Quanto custa uma troca de óleo?",
    "Meu carro está fazendo barulho no motor",
    "Preciso agendar uma revisão",
    "Quanto custa pastilhas de freio?",
    "Meu carro não está pegando"
  ];

  const StatusIndicator = () => {
    switch (connectionStatus) {
      case 'connected':
        return (
          <div className="flex items-center gap-2 text-green-600 bg-green-50 px-3 py-2 rounded-lg">
            <CheckCircle size={16} />
            <span className="text-sm font-medium">Matias Online</span>
          </div>
        );
      case 'error':
        return (
          <div className="flex items-center gap-2 text-red-600 bg-red-50 px-3 py-2 rounded-lg">
            <AlertCircle size={16} />
            <span className="text-sm font-medium">Conexão com problemas</span>
          </div>
        );
      default:
        return (
          <div className="flex items-center gap-2 text-gray-600 bg-gray-50 px-3 py-2 rounded-lg">
            <Loader2 size={16} className="animate-spin" />
            <span className="text-sm font-medium">Testando conexão...</span>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                <Bot className="text-blue-600" />
                Teste Integração Matias
              </h1>
              <p className="text-gray-600 mt-1">
                Testando a comunicação OFIX Backend → Matias Agent
              </p>
            </div>
            <StatusIndicator />
          </div>
        </div>

        {/* Chat Container */}
        <div className="bg-white rounded-lg shadow-sm flex flex-col h-[600px]">
          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {messages.length === 0 && (
              <div className="text-center py-12">
                <Bot size={48} className="mx-auto text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Assistente Matias Pronto
                </h3>
                <p className="text-gray-600 mb-6">
                  Faça uma pergunta sobre problemas automotivos, preços ou serviços
                </p>
                
                {/* Perguntas de exemplo */}
                <div className="space-y-2">
                  <p className="text-sm font-medium text-gray-700 mb-3">Exemplos:</p>
                  {perguntasExemplo.map((pergunta, index) => (
                    <button
                      key={index}
                      onClick={() => setInputMessage(pergunta)}
                      className="block w-full text-left px-4 py-2 text-sm text-blue-600 
                               bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
                    >
                      "{pergunta}"
                    </button>
                  ))}
                </div>
              </div>
            )}

            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex gap-3 ${
                  message.type === 'user' ? 'justify-end' : 'justify-start'
                }`}
              >
                {message.type !== 'user' && (
                  <div className={`p-2 rounded-full ${
                    message.type === 'error' ? 'bg-red-100' : 'bg-blue-100'
                  }`}>
                    {message.type === 'error' ? (
                      <AlertCircle size={20} className="text-red-600" />
                    ) : (
                      <Bot size={20} className="text-blue-600" />
                    )}
                  </div>
                )}

                <div
                  className={`max-w-[70%] p-4 rounded-lg ${
                    message.type === 'user'
                      ? 'bg-blue-600 text-white'
                      : message.type === 'error'
                      ? 'bg-red-50 border border-red-200'
                      : 'bg-gray-50 border'
                  }`}
                >
                  <div className="whitespace-pre-wrap">{message.content}</div>
                  
                  {/* Metadata para mensagens do assistente */}
                  {message.type === 'assistant' && (
                    <div className="mt-2 pt-2 border-t border-gray-200 text-xs text-gray-500">
                      <div className="flex gap-4">
                        {message.agent && (
                          <span>Agente: <strong>{message.agent}</strong></span>
                        )}
                        {message.model && (
                          <span>Modelo: <strong>{message.model}</strong></span>
                        )}
                        {message.status && (
                          <span>Status: <strong>{message.status}</strong></span>
                        )}
                      </div>
                    </div>
                  )}

                  <div className="mt-1 text-xs text-gray-400">
                    {message.timestamp.toLocaleTimeString('pt-BR')}
                  </div>
                </div>

                {message.type === 'user' && (
                  <div className="p-2 rounded-full bg-gray-100">
                    <User size={20} className="text-gray-600" />
                  </div>
                )}
              </div>
            ))}

            {/* Loading indicator */}
            {isLoading && (
              <div className="flex gap-3 justify-start">
                <div className="p-2 rounded-full bg-blue-100">
                  <Bot size={20} className="text-blue-600" />
                </div>
                <div className="bg-gray-50 border p-4 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Loader2 size={16} className="animate-spin text-blue-600" />
                    <span className="text-gray-600">Matias está pensando...</span>
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="border-t p-4">
            <div className="flex gap-2">
              <input
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Digite sua pergunta sobre problemas automotivos..."
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg 
                         focus:ring-2 focus:ring-blue-500 focus:border-transparent
                         disabled:bg-gray-100 disabled:cursor-not-allowed"
                disabled={isLoading}
              />
              <button
                onClick={enviarMensagem}
                disabled={!inputMessage.trim() || isLoading}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg 
                         hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed
                         transition-colors flex items-center gap-2"
              >
                {isLoading ? (
                  <Loader2 size={20} className="animate-spin" />
                ) : (
                  <Send size={20} />
                )}
                Enviar
              </button>
            </div>
            
            <div className="mt-2 text-xs text-gray-500 text-center">
              Pressione Enter para enviar • Shift+Enter para nova linha
            </div>
          </div>
        </div>

        {/* Debug Info */}
        <div className="mt-6 bg-white rounded-lg shadow-sm p-4">
          <h3 className="font-medium text-gray-900 mb-2">Informações Técnicas</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div>
              <span className="font-medium">OFIX Backend:</span>
              <div className="text-gray-600">Rodando via /api/agno/chat-matias</div>
            </div>
            <div>
              <span className="font-medium">Matias Agent:</span>
              <div className="text-gray-600">Python + FastAPI + agno + Groq</div>
            </div>
            <div>
              <span className="font-medium">Base de Conhecimento:</span>
              <div className="text-gray-600">LanceDB Remote + Docs Automotivos</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TesteMatiasIntegracao;