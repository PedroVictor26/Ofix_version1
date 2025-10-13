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
  Wrench,
  Trash2,
  Mic,
  MicOff,
  Volume2,
  VolumeX
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '../context/AuthContext.jsx';
import { chatWithMatias, testMatiasConnection } from '@/utils/api.js';

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
  
  // Estados para funcionalidades de voz
  const [gravando, setGravando] = useState(false);
  const [vozHabilitada, setVozHabilitada] = useState(true);
  const [falando, setFalando] = useState(false);
  
  const chatContainerRef = useRef(null);
  const inputRef = useRef(null);
  const recognitionRef = useRef(null);
  const synthesisRef = useRef(null);

  // Chave para localStorage baseada no usuário
  const getStorageKey = () => `matias_conversas_${user?.id || 'anonymous'}`;

  // Salvar conversas no localStorage
  const salvarConversas = (novasConversas) => {
    try {
      const storageKey = getStorageKey();
      const dataToSave = {
        conversas: novasConversas,
        timestamp: new Date().toISOString(),
        userId: user?.id || 'anonymous'
      };
      localStorage.setItem(storageKey, JSON.stringify(dataToSave));
    } catch (error) {
      console.error('Erro ao salvar conversas:', error);
    }
  };

  // Carregar conversas do localStorage
  const carregarConversas = () => {
    try {
      const storageKey = getStorageKey();
      const savedData = localStorage.getItem(storageKey);
      
      if (savedData) {
        const parsedData = JSON.parse(savedData);
        const savedConversas = parsedData.conversas || [];
        
        // Verificar se as conversas não são muito antigas (opcional - 7 dias)
        const savedTimestamp = new Date(parsedData.timestamp);
        const ageDays = (new Date() - savedTimestamp) / (1000 * 60 * 60 * 24);
        
        if (ageDays < 7 && savedConversas.length > 0) {
          return savedConversas;
        }
      }
    } catch (error) {
      console.error('Erro ao carregar conversas:', error);
    }
    return null;
  };

  // Limpar histórico de conversas
  const limparHistorico = () => {
    try {
      const storageKey = getStorageKey();
      localStorage.removeItem(storageKey);
      
      // Recarregar mensagem inicial
      const mensagemInicial = criarMensagemInicial();
      setConversas([mensagemInicial]);
      salvarConversas([mensagemInicial]);
    } catch (error) {
      console.error('Erro ao limpar histórico:', error);
    }
  };

  // Criar mensagem inicial
  const criarMensagemInicial = () => ({
    id: Date.now(),
    tipo: 'sistema',
    conteudo: `Olá ${user?.nome || 'usuário'}! 👋\n\nEu sou o **Matias**, seu assistente especializado em oficina automotiva! Estou aqui para ajudar com:\n\n🔧 **Diagnósticos técnicos** - Identifique problemas no seu veículo\n💰 **Orçamentos e preços** - Consulte valores de serviços e peças\n🛠️ **Manutenção preventiva** - Saiba quando fazer revisões\n🔍 **Problemas específicos** - Barulhos, sintomas e soluções\n⚙️ **Especificações técnicas** - Dados de alinhamento, pneus e mais\n\n**Exemplos do que posso responder:**\n• "Quanto custa uma troca de óleo?"\n• "Meu carro está fazendo barulho no motor"\n• "Preciso agendar uma revisão"\n• "Quanto custa pastilhas de freio?"\n\nComo posso ajudá-lo hoje?`,
    timestamp: new Date().toISOString()
  });

  // Funções de reconhecimento de voz
  const iniciarGravacao = () => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      alert('Reconhecimento de voz não é suportado neste navegador.');
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();

    recognition.lang = 'pt-BR';
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onstart = () => {
      setGravando(true);
    };

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      setMensagem(transcript);
    };

    recognition.onerror = (event) => {
      console.error('Erro no reconhecimento de voz:', event.error);
      setGravando(false);
    };

    recognition.onend = () => {
      setGravando(false);
    };

    recognitionRef.current = recognition;
    recognition.start();
  };

  const pararGravacao = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
  };

  // Função para síntese de fala
  const falarTexto = (texto) => {
    if (!vozHabilitada || !('speechSynthesis' in window)) {
      return;
    }

    // Para qualquer fala em andamento
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(texto);
    utterance.lang = 'pt-BR';
    utterance.rate = 0.9;
    utterance.pitch = 1;

    utterance.onstart = () => {
      setFalando(true);
    };

    utterance.onend = () => {
      setFalando(false);
    };

    utterance.onerror = (event) => {
      console.error('Erro na síntese de voz:', event.error);
      setFalando(false);
    };

    synthesisRef.current = utterance;
    window.speechSynthesis.speak(utterance);
  };

  const pararFala = () => {
    window.speechSynthesis.cancel();
    setFalando(false);
  };

  const alternarVoz = () => {
    setVozHabilitada(!vozHabilitada);
    if (falando) {
      pararFala();
    }
  };

  // Função helper para adicionar mensagem e salvar automaticamente
  const adicionarMensagem = (novaMensagem) => {
    setConversas(prev => {
      const novasConversas = [...prev, novaMensagem];
      salvarConversas(novasConversas);
      return novasConversas;
    });
  };

  // Mensagem inicial do Matias
  useEffect(() => {
    if (user && conversas.length === 0) {
      const conversasSalvas = carregarConversas();
      
      if (conversasSalvas && conversasSalvas.length > 0) {
        // Carregar conversas salvas
        setConversas(conversasSalvas);
      } else {
        // Criar mensagem inicial
        const mensagemInicial = criarMensagemInicial();
        setConversas([mensagemInicial]);
        salvarConversas([mensagemInicial]);
      }
    } else if (false) {
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
      
      // Testar conexão com Matias via utilitário API
      const isConnected = await testMatiasConnection(`connection_test_${user?.id || 'anonymous'}`);
      
      if (isConnected) {
        setStatusConexao('conectado');
        return true;
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
      // Debug: Envio bloqueado
      return;
    }

    const novaMensagem = {
      id: Date.now(),
      tipo: 'usuario',
      conteudo: mensagem,
      timestamp: new Date().toISOString()
    };

    adicionarMensagem(novaMensagem);
    const mensagemTexto = mensagem;
    setMensagem('');
    setCarregando(true);

    try {
      // Usar nossa integração com Matias Agent via utilitário API
      const data = await chatWithMatias(
        mensagemTexto,
        user?.id || `user_${Date.now()}`
      );
      
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

      adicionarMensagem(respostaAgente);
      
      // Falar resposta automaticamente se voz estiver habilitada
      if (vozHabilitada && data.response) {
        // Remover markdown básico para melhor síntese de voz
        const textoLimpo = data.response
          .replace(/\*\*(.*?)\*\*/g, '$1') // Remove **bold**
          .replace(/\*(.*?)\*/g, '$1') // Remove *italic*
          .replace(/#{1,6}\s/g, '') // Remove headers #
          .replace(/```[\s\S]*?```/g, '') // Remove code blocks
          .replace(/`([^`]+)`/g, '$1') // Remove inline code
          .replace(/\n{2,}/g, '. ') // Converte quebras duplas em pausa
          .replace(/\n/g, ' ') // Converte quebras simples em espaço
          .trim();
          
        if (textoLimpo.length > 0) {
          falarTexto(textoLimpo);
        }
      }
    } catch (error) {
      // Erro ao enviar mensagem para Matias
      
      const mensagemErro = {
        id: Date.now() + 1,
        tipo: 'erro',
        conteudo: `Desculpe, ocorreu um problema ao processar sua mensagem.\n\n**Erro:** ${error.message}\n\n**Dica:** Verifique sua conexão e tente novamente.`,
        timestamp: new Date().toISOString()
      };

      adicionarMensagem(mensagemErro);
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Limpeza ao desmontar componente
  useEffect(() => {
    return () => {
      // Parar reconhecimento de voz
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      
      // Parar síntese de voz
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
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
            
            {/* Botões de Ação */}
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={limparHistorico}
                className="flex items-center gap-2 text-red-600 hover:bg-red-50"
                title="Limpar histórico de conversas"
              >
                <Trash2 className="w-4 h-4" />
                Limpar
              </Button>
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
                {/* Indicador de fala para mensagens do agente */}
                {conversa.tipo === 'agente' && falando && (
                  <div className="flex items-center gap-2 mb-2 text-blue-600">
                    <Volume2 className="w-3 h-3 animate-pulse" />
                    <span className="text-xs">Falando...</span>
                  </div>
                )}
                
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
            
            {/* Botões de controle de voz */}
            <div className="flex gap-2">
              {/* Botão para ativar/desativar voz */}
              <Button
                onClick={alternarVoz}
                variant="outline"
                size="sm"
                className={`rounded-xl ${vozHabilitada ? 'bg-green-50 border-green-300 text-green-700 hover:bg-green-100' : 'bg-gray-50 border-gray-300 text-gray-500 hover:bg-gray-100'}`}
                title={vozHabilitada ? 'Desativar voz' : 'Ativar voz'}
              >
                {vozHabilitada ? (
                  <Volume2 className="w-4 h-4" />
                ) : (
                  <VolumeX className="w-4 h-4" />
                )}
              </Button>

              {/* Botão para parar fala atual */}
              {falando && (
                <Button
                  onClick={pararFala}
                  variant="outline"
                  size="sm"
                  className="rounded-xl bg-red-50 border-red-300 text-red-700 hover:bg-red-100"
                  title="Parar fala"
                >
                  <VolumeX className="w-4 h-4" />
                </Button>
              )}

              {/* Botão de gravação */}
              <Button
                onClick={gravando ? pararGravacao : iniciarGravacao}
                variant="outline"
                size="sm"
                disabled={carregando}
                className={`rounded-xl ${gravando ? 'bg-red-50 border-red-300 text-red-700 hover:bg-red-100 animate-pulse' : 'bg-gray-50 border-gray-300 text-gray-700 hover:bg-gray-100'}`}
                title={gravando ? 'Parar gravação' : 'Iniciar gravação de voz'}
              >
                {gravando ? (
                  <MicOff className="w-4 h-4" />
                ) : (
                  <Mic className="w-4 h-4" />
                )}
              </Button>
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
          
          <div className="mt-2 flex items-center justify-between">
            {statusConexao !== 'conectado' && (
              <div className="text-xs text-amber-600 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                Aguardando conexão com Matias Agent...
              </div>
            )}
            <div className="text-xs text-slate-500 flex items-center gap-1">
              💾 Conversas salvas automaticamente
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AIPage;
