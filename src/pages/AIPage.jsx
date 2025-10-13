import React, { useState, useRef, useEffect } from 'react';
import { 
  Brain, 
  Send, 
  User, 
  Bot, 
  Loader2, 
  Settings, 
  MessageCircle,
  Zap,
  AlertCircle,
  CheckCircle,
  Wrench
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '../context/AuthContext.jsx';

/**
 * Página dedicada para interação com o Assistente de IA (Agno Agent)
 * Interface principal para comunicação com o agente inteligente
 */
const AIPage = () => {
  const { user } = useAuth();
  const [mensagem, setMensagem] = useState('');
  const [conversas, setConversas] = useState([]);
  const [carregando, setCarregando] = useState(false);
  const [statusConexao, setStatusConexao] = useState('desconectado'); // conectado, conectando, desconectado, erro
  // Removidas configurações antigas do Agno - agora usamos Matias diretamente
  
  const chatContainerRef = useRef(null);
  const inputRef = useRef(null);

  // Mensagem inicial do Matias
  useEffect(() => {
    if (conversas.length === 0) {
      const mensagemInicial = {
        id: Date.now(),
        tipo: 'sistema',
        conteudo: `Olá ${user?.nome || 'usuário'}! 👋\n\nEu sou o **Matias**, seu assistente especializado em oficina automotiva! Estou aqui para ajudar com:\n\n🔧 **Diagnósticos técnicos** - Identifique problemas no seu veículo\n� **Orçamentos e preços** - Consulte valores de serviços e peças\n🛠️ **Manutenção preventiva** - Saiba quando fazer revisões\n� **Problemas específicos** - Barulhos, sintomas e soluções\n⚙️ **Especificações técnicas** - Dados de alinhamento, pneus e mais\n\n**Exemplos do que posso responder:**\n• "Quanto custa uma troca de óleo?"\n• "Meu carro está fazendo barulho no motor"\n• "Preciso agendar uma revisão"\n• "Quanto custa pastilhas de freio?"\n\nComo posso ajudá-lo hoje?`,
        timestamp: new Date().toISOString()
      };
      setConversas([mensagemInicial]);
    }
  }, [user?.nome]);

  // Auto-scroll para última mensagem
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [conversas]);

  // Verificar status da conexão com Matias Agent
  const verificarConexao = async () => {
    try {
      setStatusConexao('conectando');
      
      // Testar conexão com Matias via endpoint OFIX
      const response = await fetch('/api/agno/chat-matias', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          message: 'teste de conexão',
          user_id: `connection_test_${user?.id || 'anonymous'}`
        })
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setStatusConexao('conectado');
          return true;
        } else {
          setStatusConexao('erro');
          return false;
        }
      } else {
        setStatusConexao('erro');
        return false;
      }
    } catch (error) {
      console.error('Erro ao verificar conexão com Matias:', error);
      setStatusConexao('erro');
      return false;
    }
  };

  // Enviar mensagem para o Matias Agent
  const enviarMensagem = async () => {
    if (!mensagem.trim() || carregando) {
      console.log('⏸️ Envio bloqueado:', { 
        hasMessage: !!mensagem.trim(), 
        isLoading: carregando 
      });
      return;
    }

    const novaMensagem = {
      id: Date.now(),
      tipo: 'usuario',
      conteudo: mensagem,
      timestamp: new Date().toISOString()
    };

    setConversas(prev => [...prev, novaMensagem]);
    const mensagemTexto = mensagem;
    setMensagem('');
    setCarregando(true);

    try {
      // Logs para debug
      console.log('🚀 Enviando para Matias:', {
        url: '/api/agno/chat-matias',
        method: 'POST',
        message: mensagemTexto.substring(0, 50),
        user_id: user?.id || `user_${Date.now()}`
      });

      // Usar nossa integração com Matias Agent
      const response = await fetch('/api/agno/chat-matias', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: mensagemTexto,
          user_id: user?.id || `user_${Date.now()}`
        })
      });

      console.log('📡 Response recebida:', {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok,
        headers: Object.fromEntries(response.headers.entries())
      });

      if (response.ok) {
        const data = await response.json();
        
        if (data.success) {
          const respostaAgente = {
            id: Date.now() + 1,
            tipo: 'agente',
            conteudo: data.response,
            timestamp: new Date().toISOString(),
            metadata: {
              agent: data.agent,
              model: data.model,
              status: data.status
            }
          };

          setConversas(prev => [...prev, respostaAgente]);
        } else {
          throw new Error(data.error || 'Erro na resposta do agente');
        }
      } else {
        const errorText = await response.text();
        throw new Error(`Erro HTTP ${response.status}: ${errorText}`);
      }
    } catch (error) {
      console.error('Erro ao enviar mensagem para Matias:', error);
      
      const mensagemErro = {
        id: Date.now() + 1,
        tipo: 'erro',
        conteudo: `Desculpe, ocorreu um problema ao processar sua mensagem.\n\n**Erro:** ${error.message}\n\n**Dica:** Verifique sua conexão e tente novamente.`,
        timestamp: new Date().toISOString()
      };

      setConversas(prev => [...prev, mensagemErro]);
    } finally {
      setCarregando(false);
    }
  };

  // Handler para Enter
  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      enviarMensagem();
    }
  };

  // Inicializar conexão
  useEffect(() => {
    verificarConexao();
  }, []);

  const getStatusIcon = () => {
    switch (statusConexao) {
      case 'conectado':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'conectando':
        return <Loader2 className="w-4 h-4 text-yellow-500 animate-spin" />;
      case 'erro':
        return <AlertCircle className="w-4 h-4 text-red-500" />;
      default:
        return <AlertCircle className="w-4 h-4 text-gray-400" />;
    }
  };

  const getStatusText = () => {
    switch (statusConexao) {
      case 'conectado':
        return 'Matias Online';
      case 'conectando':
        return 'Conectando ao Matias...';
      case 'erro':
        return 'Matias Indisponível';
      default:
        return 'Desconectado';
    }
  };

  return (
    <div className="h-full flex flex-col bg-gradient-to-br from-slate-50 to-blue-50 p-2">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200/60 p-4 mb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
              <Brain className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900">Matias - Assistente IA</h1>
              <p className="text-sm text-slate-600">Especialista em Oficina Automotiva • Powered by Groq + LanceDB</p>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            {/* Status da Conexão */}
            <div className="flex items-center gap-2 px-3 py-2 bg-slate-50 rounded-lg">
              {getStatusIcon()}
              <span className="text-sm font-medium text-slate-700">
                {getStatusText()}
              </span>
            </div>
            
            {/* Botão de Configurações */}
            <Button
              variant="outline"
              size="sm"
              onClick={verificarConexao}
              disabled={statusConexao === 'conectando'}
              className="flex items-center gap-2"
            >
              <Settings className="w-4 h-4" />
              Reconectar
            </Button>
          </div>
        </div>
      </div>

      {/* Área de Chat */}
      <div className="flex-1 bg-white rounded-xl shadow-sm border border-slate-200/60 flex flex-col overflow-hidden">
        {/* Container de Mensagens */}
        <div 
          ref={chatContainerRef}
          className="flex-1 overflow-y-auto p-4 space-y-4"
        >
          {conversas.map((conversa) => (
            <div
              key={conversa.id}
              className={`flex gap-3 ${
                conversa.tipo === 'usuario' ? 'justify-end' : 'justify-start'
              }`}
            >
              {/* Avatar */}
              {conversa.tipo !== 'usuario' && (
                <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                  conversa.tipo === 'agente' 
                    ? 'bg-gradient-to-br from-blue-500 to-purple-500'
                    : conversa.tipo === 'sistema'
                    ? 'bg-gradient-to-br from-green-500 to-emerald-500'
                    : 'bg-gradient-to-br from-red-500 to-orange-500'
                }`}>
                  {conversa.tipo === 'agente' ? (
                    <Bot className="w-4 h-4 text-white" />
                  ) : conversa.tipo === 'sistema' ? (
                    <Wrench className="w-4 h-4 text-white" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-white" />
                  )}
                </div>
              )}

              {/* Mensagem */}
              <div
                className={`max-w-2xl rounded-2xl px-4 py-3 ${
                  conversa.tipo === 'usuario'
                    ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white'
                    : conversa.tipo === 'agente'
                    ? 'bg-slate-100 text-slate-900 border border-slate-200'
                    : conversa.tipo === 'sistema'
                    ? 'bg-gradient-to-r from-green-50 to-emerald-50 text-green-800 border border-green-200'
                    : 'bg-gradient-to-r from-red-50 to-orange-50 text-red-800 border border-red-200'
                }`}
              >
                <div className="whitespace-pre-wrap text-sm leading-relaxed">
                  {conversa.conteudo}
                </div>
                <div className={`text-xs mt-2 opacity-60 ${
                  conversa.tipo === 'usuario' ? 'text-white' : 'text-slate-500'
                }`}>
                  {new Date(conversa.timestamp).toLocaleTimeString('pt-BR', {
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </div>
              </div>

              {/* Avatar do Usuário */}
              {conversa.tipo === 'usuario' && (
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-slate-600 to-slate-700 flex items-center justify-center flex-shrink-0">
                  <User className="w-4 h-4 text-white" />
                </div>
              )}
            </div>
          ))}

          {/* Indicador de carregamento */}
          {carregando && (
            <div className="flex gap-3 justify-start">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center">
                <Bot className="w-4 h-4 text-white" />
              </div>
              <div className="bg-slate-100 border border-slate-200 rounded-2xl px-4 py-3">
                <div className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin text-slate-600" />
                  <span className="text-sm text-slate-600">Processando...</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Input de Mensagem */}
        <div className="border-t border-slate-200 p-4 bg-slate-50/50">
          <div className="flex gap-3 items-end">
            <div className="flex-1">
              <Input
                ref={inputRef}
                value={mensagem}
                onChange={(e) => setMensagem(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Pergunte sobre problemas automotivos, preços, diagnósticos..."
                disabled={carregando || statusConexao !== 'conectado'}
                className="resize-none border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 rounded-xl"
              />
            </div>
            <Button
              onClick={enviarMensagem}
              disabled={!mensagem.trim() || carregando || statusConexao !== 'conectado'}
              className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 rounded-xl px-6"
            >
              {carregando ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </Button>
          </div>
          
          {statusConexao !== 'conectado' && (
            <div className="mt-2 text-xs text-amber-600 flex items-center gap-1">
              <AlertCircle className="w-3 h-3" />
              Aguardando conexão com Matias Agent...
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AIPage;
