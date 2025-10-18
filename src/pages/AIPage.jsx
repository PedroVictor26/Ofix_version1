import { useState, useRef, useEffect } from 'react';
// import { User, Bot } from 'lucide-react';
// import { Button } from '@/components/ui/button';
import { useAuth } from '../context/AuthContext.jsx';
// import ClienteModal from '../components/clientes/ClienteModal';

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
  const [mostrarConfig, setMostrarConfig] = useState(false);
  const [modoContinuo, setModoContinuo] = useState(false);
  const [vozesDisponiveis, setVozesDisponiveis] = useState([]);
  const [vozSelecionada, setVozSelecionada] = useState(null);
  const [configVoz, setConfigVoz] = useState({
    rate: 1.0, // Velocidade (0.1 a 10)
    pitch: 1.0, // Tom (0 a 2)
    volume: 1.0 // Volume (0 a 1)
  });
  
  // Estados para modal de cadastro de cliente
  const [modalClienteAberto, setModalClienteAberto] = useState(false);
  const [clientePrePreenchido, setClientePrePreenchido] = useState(null);

  
  const chatContainerRef = useRef(null);
  const inputRef = useRef(null);
  const recognitionRef = useRef(null);
  const synthesisRef = useRef(null);

  // Carregar vozes disponíveis
  useEffect(() => {
    const carregarVozes = () => {
      const vozes = window.speechSynthesis.getVoices();
      const vozesPortugues = vozes.filter(voz => voz.lang.startsWith('pt'));
      setVozesDisponiveis(vozesPortugues.length > 0 ? vozesPortugues : vozes);
      
      // Selecionar primeira voz em português ou primeira voz disponível
      if (vozesPortugues.length > 0) {
        setVozSelecionada(vozesPortugues[0]);
      } else if (vozes.length > 0) {
        setVozSelecionada(vozes[0]);
      }
    };

    carregarVozes();
    
    // Algumas browsers carregam vozes assincronamente
    if (window.speechSynthesis.onvoiceschanged !== undefined) {
      window.speechSynthesis.onvoiceschanged = carregarVozes;
    }
  }, []);

  // Carregar histórico de conversas ao montar o componente
  useEffect(() => {
    const carregarHistorico = async () => {
      if (!user?.id) return;

      try {
        const tokenDataString = localStorage.getItem('authToken');
  const authHeaders = {
          'Content-Type': 'application/json'
        };
        
        if (tokenDataString) {
          const tokenData = JSON.parse(tokenDataString);
          if (tokenData?.token) {
            authHeaders['Authorization'] = `Bearer ${tokenData.token}`;
          }
        }

        const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:1000';
        const API_BASE = API_BASE_URL.replace('/api', '');
        
        const response = await fetch(`${API_BASE}/agno/historico-conversa?usuario_id=${user.id}`, {
          headers: authHeaders
        });

        if (response.ok) {
          const data = await response.json();
          if (data.success && data.mensagens?.length > 0) {
            const mensagensFormatadas = data.mensagens.map(msg => ({
              id: msg.id || Date.now(),
              tipo: msg.tipo_remetente === 'usuario' ? 'usuario' : 'agente',
              conteudo: msg.conteudo,
              timestamp: msg.timestamp
            }));
            setConversas(mensagensFormatadas);
            // console.log('✅ Histórico carregado:', mensagensFormatadas.length, 'mensagens');
          }
        }
  } catch {
  // console.error('❌ Erro ao carregar histórico:', error);
      }
    };

    carregarHistorico();
  }, [user?.id]);

  // Mensagem inicial do sistema (se não houver histórico)
  useEffect(() => {
    if (conversas.length === 0 && user) {
      const mensagemInicial = {
        id: Date.now(),
        tipo: 'sistema',
        conteudo: `Olá ${user?.nome || 'usuário'}! 👋\n\nSou o assistente de IA do OFIX, especializado em:\n\n🔧 Diagnósticos automotivos\n🚗 Gestão de peças e estoque\n💼 Suporte comercial\n📊 Análise de dados operacionais\n\nComo posso ajudá-lo hoje?`,
        timestamp: new Date().toISOString()
      };
      setConversas([mensagemInicial]);
    }
  }, [user, conversas.length]);

  // Auto-scroll para última mensagem
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [conversas]);

  // Verificar status da conexão com Agno
  const verificarConexao = async () => {
    try {
      setStatusConexao('conectando');
      
      // Buscar token do localStorage usando o mesmo padrão do sistema OFIX
      const tokenDataString = localStorage.getItem('authToken');
  const authHeaders = {
        'Content-Type': 'application/json'
      };
      
      if (tokenDataString) {
        try {
          const tokenData = JSON.parse(tokenDataString);
          if (tokenData && tokenData.token) {
            authHeaders['Authorization'] = `Bearer ${tokenData.token}`;
          }
  } catch {
          // console.error('Erro ao processar token:', e);
        }
      }
      
      // Testar o endpoint principal do Agno
      const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:1000';
      const response = await fetch(`${API_BASE}/agno/contexto-sistema`, {
        method: 'GET',
        headers: authHeaders
      });

      if (response.ok) {
        setStatusConexao('conectado');
        return true;
      } else {
        setStatusConexao('erro');
        return false;
      }
  } catch {
  // console.error('Erro ao verificar conexão:', error);
      setStatusConexao('erro');
      return false;
    }
  };

  // ============================================
  // FUNÇÕES DE VOZ
  // ============================================

  // Iniciar gravação de voz
  const iniciarGravacao = () => {
    // Não permitir gravar se estiver falando
    if (falando) {
      alert('Aguarde o assistente terminar de falar antes de gravar.');
      return;
    }

    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      alert('Reconhecimento de voz não é suportado neste navegador.');
      return;
    }

    // Parar qualquer síntese de fala em andamento
    if (window.speechSynthesis.speaking) {
      window.speechSynthesis.cancel();
      setFalando(false);
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();

    recognition.lang = 'pt-BR';
    recognition.continuous = modoContinuo;
    recognition.interimResults = modoContinuo;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      setGravando(true);
    };

    recognition.onresult = (event) => {
      const transcript = event.results[event.results.length - 1][0].transcript;
      const confidence = event.results[event.results.length - 1][0].confidence;
      
      // Só aceitar transcrições com confiança mínima
      if (confidence < 0.5) return;
      
      if (modoContinuo) {
        setMensagem(prev => prev + (prev ? ' ' : '') + transcript);
      } else {
        setMensagem(transcript);
      }
    };

    recognition.onerror = (event) => {
  // console.error('Erro reconhecimento:', event.error);
      setGravando(false);
      
      // Não mostrar erro para aborted (normal quando para manualmente)
      if (event.error !== 'aborted' && event.error !== 'no-speech') {
        alert(`Erro no reconhecimento de voz: ${event.error}`);
      }
    };

    recognition.onend = () => {
      setGravando(false);
      
      // No modo contínuo, reinicia se não estiver falando
      if (modoContinuo && recognitionRef.current && !falando) {
        setTimeout(() => {
          if (recognitionRef.current && !falando) {
            try {
              recognitionRef.current.start();
            } catch {
              // console.error('Erro ao reiniciar reconhecimento:', e);
            }
          }
        }, 300);
      }
    };

    recognitionRef.current = recognition;
    
    try {
      recognition.start();
  } catch {
  // console.error('Erro ao iniciar reconhecimento:', error);
      setGravando(false);
    }
  };

  const pararGravacao = () => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
  } catch {
  // console.error('Erro ao parar reconhecimento:', e);
      }
      recognitionRef.current = null;
    }
    setGravando(false);
  };

  // Função para síntese de fala
  const falarTexto = (texto) => {
    if (!vozHabilitada || !('speechSynthesis' in window)) {
      return;
    }

    // IMPORTANTE: Parar reconhecimento de voz antes de falar
    const estavagravando = gravando;
    if (gravando) {
      pararGravacao();
    }

    // Cancelar qualquer fala anterior
    window.speechSynthesis.cancel();

    // Limpar texto para melhor pronúncia
    const textoLimpo = texto
      .replace(/\*\*(.*?)\*\*/g, '$1') // Remove **bold**
      .replace(/\*(.*?)\*/g, '$1') // Remove *italic*
      .replace(/#{1,6}\s/g, '') // Remove headers #
      .replace(/```[\s\S]*?```/g, '') // Remove code blocks
      .replace(/`([^`]+)`/g, '$1') // Remove inline code
      .replace(/\n{2,}/g, '. ') // Converte quebras duplas em pausa
      .replace(/\n/g, ' ') // Converte quebras simples em espaço
      .replace(/•/g, '') // Remove bullets
      .replace(/💡|🔧|🚗|💼|📊|❌|✅|📋|🏢|🔍|⚠️/g, '') // Remove emojis
      .trim();

    if (!textoLimpo) return;

    const utterance = new SpeechSynthesisUtterance(textoLimpo);
    utterance.lang = 'pt-BR';
    utterance.rate = configVoz.rate;
    utterance.pitch = configVoz.pitch;
    utterance.volume = configVoz.volume;
    
    // Usar voz selecionada se disponível
    if (vozSelecionada) {
      utterance.voice = vozSelecionada;
    }

    utterance.onstart = () => {
      setFalando(true);
      // Garantir que reconhecimento está parado
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
  } catch {
          // Ignorar erro se já estiver parado
        }
      }
    };

    utterance.onend = () => {
      setFalando(false);
      
      // Reiniciar gravação se estava gravando antes
      if (estavagravando && modoContinuo) {
        setTimeout(() => {
          iniciarGravacao();
        }, 500); // Delay de 500ms para evitar captar eco
      }
    };

  utterance.onerror = () => {
  // console.error('Erro na síntese de voz:', event);
      setFalando(false);
      
      // Reiniciar gravação se estava gravando
      if (estavagravando && modoContinuo) {
        setTimeout(() => {
          iniciarGravacao();
        }, 500);
      }
    };

    synthesisRef.current = utterance;
    
    // Adicionar pequeno delay antes de falar para garantir que microfone parou
    setTimeout(() => {
      window.speechSynthesis.speak(utterance);
    }, 200);
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

  // ============================================
  // FUNÇÕES DE LOCALSTORAGE
  // ============================================

  const getStorageKey = () => `matias_conversas_${user?.id || 'anonymous'}`;

  const salvarConversasLocal = (novasConversas) => {
    try {
      const storageKey = getStorageKey();
      const dataToSave = {
        conversas: novasConversas,
        timestamp: new Date().toISOString(),
        userId: user?.id || 'anonymous'
      };
      localStorage.setItem(storageKey, JSON.stringify(dataToSave));
  } catch {
  // console.error('Erro ao salvar conversas:', error);
    }
  };

  const limparHistorico = () => {
    try {
      const storageKey = getStorageKey();
      localStorage.removeItem(storageKey);
      
      const mensagemInicial = {
        id: Date.now(),
        tipo: 'sistema',
        conteudo: `Olá ${user?.nome || 'usuário'}! 👋\n\nSou o assistente de IA do OFIX, especializado em:\n\n🔧 Diagnósticos automotivos\n🚗 Gestão de peças e estoque\n💼 Suporte comercial\n📊 Análise de dados operacionais\n\nComo posso ajudá-lo hoje?`,
        timestamp: new Date().toISOString()
      };
      setConversas([mensagemInicial]);
      salvarConversasLocal([mensagemInicial]);
  } catch {
  // console.error('Erro ao limpar histórico:', error);
    }
  };

  // ============================================
  // ENVIAR MENSAGEM
  // ============================================

  const enviarMensagem = async () => {
    if (!mensagem.trim() || carregando) return;

    const novaMensagem = {
      id: Date.now(),
      tipo: 'usuario',
      conteudo: mensagem,
      timestamp: new Date().toISOString()
    };

    setConversas(prev => {
      const novasConversas = [...prev, novaMensagem];
      salvarConversasLocal(novasConversas);
      return novasConversas;
    });
    setMensagem('');
    setCarregando(true);

    try {
      // Buscar token do localStorage usando o mesmo padrão do sistema OFIX
      const tokenDataString = localStorage.getItem('authToken');
  const authHeaders = {
        'Content-Type': 'application/json'
      };
      
      if (tokenDataString) {
        try {
          const tokenData = JSON.parse(tokenDataString);
          if (tokenData && tokenData.token) {
            authHeaders['Authorization'] = `Bearer ${tokenData.token}`;
          }
  } catch {
          // console.error('Erro ao processar token:', e);
        }
      }
      
      // 🤖 USAR NOVO ENDPOINT INTELIGENTE COM NLP
      // IMPORTANTE: A rota /agno está registrada FORA do prefixo /api no app.js
      const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:1000';
      const API_BASE = API_BASE_URL.replace('/api', ''); // Remove /api se existir
      const response = await fetch(`${API_BASE}/agno/chat-inteligente`, {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({
          message: novaMensagem.conteudo,
          usuario_id: user?.id,
          contexto_conversa: conversas.slice(-5).map(c => ({
            tipo: c.tipo,
            conteudo: c.conteudo
          }))
        })
      });

      if (response.ok) {
        const data = await response.json();
        
        // Extrair o conteúdo da resposta de forma segura
        let responseContent = '';
        let tipoResposta = 'agente'; // tipo padrão
        
        // Verificar se há resposta (independente de success ser true ou false)
        if (data.response) {
          if (typeof data.response === 'string') {
            responseContent = data.response;
          } else if (typeof data.response === 'object') {
            // Se a resposta é um objeto, tentar extrair o conteúdo
            responseContent = data.response.content || 
                             data.response.message || 
                             data.response.output || 
                             JSON.stringify(data.response, null, 2);
          } else {
            responseContent = String(data.response);
          }
          
          // Usar o tipo retornado pelo backend se disponível
          if (data.tipo) {
            tipoResposta = data.tipo; // confirmacao, pergunta, erro, ajuda, lista
          }
        } else if (data.message) {
          // Se não tem response, mas tem message
          responseContent = data.message;
          tipoResposta = data.success ? 'agente' : 'erro';
        } else {
          // Fallback se não tem nem response nem message
          responseContent = 'Resposta recebida do agente.';
          tipoResposta = 'agente';
        }
        
        const respostaAgente = {
          id: Date.now() + 1,
          tipo: tipoResposta, // Usar o tipo retornado pelo backend
          conteudo: responseContent,
          timestamp: new Date().toISOString(),
          metadata: {
            ...data.metadata,
            dadosExtraidos: data.dadosExtraidos // 🎯 Incluir dados extraídos para o botão
          }
        };

        setConversas(prev => {
          const novasConversas = [...prev, respostaAgente];
          salvarConversasLocal(novasConversas); // Salvar no localStorage
          return novasConversas;
        });
        
        // 🎯 DETECTAR INTENÇÃO DE CADASTRO E ABRIR MODAL AUTOMATICAMENTE
        // Abre modal quando: pede mais dados (cadastro) OU cliente já existe (alerta)
        if ((data.tipo === 'cadastro' || data.tipo === 'alerta') && data.dadosExtraidos) {
          // Pré-preencher modal com dados extraídos pelo NLP
          setClientePrePreenchido({
            nomeCompleto: data.dadosExtraidos.nome || '',
            telefone: data.dadosExtraidos.telefone || '',
            cpfCnpj: data.dadosExtraidos.cpfCnpj || '',
            email: data.dadosExtraidos.email || ''
          });
          
          // Abrir modal para revisão/complementação dos dados
          setModalClienteAberto(true);
        }
        
        // Falar resposta automaticamente se voz estiver habilitada
        if (vozHabilitada && responseContent) {
          const textoLimpo = responseContent
            .replace(/\*\*(.*?)\*\*/g, '$1') // Remove **bold**
            .replace(/\*(.*?)\*/g, '$1') // Remove *italic*
            .replace(/#{1,6}\s/g, '') // Remove headers #
            .replace(/```[\s\S]*?```/g, '') // Remove code blocks
            .replace(/`([^`]+)`/g, '$1') // Remove inline code
            .replace(/\n{2,}/g, '. ') // Converte quebras duplas em pausa
            .replace(/\n/g, ' ') // Converte quebras simples em espaço
            .replace(/[•✅❌📋🔧🚗💼📊]/gu, '') // Remove emojis
            .trim();
            
          if (textoLimpo.length > 0 && textoLimpo.length < 500) {
            falarTexto(textoLimpo);
          }
        }
      } else {
        throw new Error(`Erro na API: ${response.status}`);
      }
  } catch {
  // console.error('Erro ao enviar mensagem:', error);
      
      const mensagemErro = {
        id: Date.now() + 1,
        tipo: 'erro',
        conteudo: 'Desculpe, ocorreu um erro ao processar sua mensagem. Tente novamente em instantes.',
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

  // Limpeza ao desmontar componente
  // Atalhos de teclado
  useEffect(() => {
    const handleKeyDown = (e) => {
      // ESC para parar gravação ou fala
      if (e.key === 'Escape') {
        if (gravando) {
          pararGravacao();
        }
        if (falando) {
          pararFala();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, [gravando, falando]);

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
        return 'Agente Online';
      case 'conectando':
        return 'Conectando...';
      case 'erro':
        return 'Erro de Conexão';
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
              <Bot className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900">Assistente IA OFIX</h1>
              <p className="text-sm text-slate-600">Powered by Agno AI Agent</p>
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
                onClick={alternarVoz}
                className={`flex items-center gap-2 ${vozHabilitada ? 'text-green-600 hover:bg-green-50' : 'text-gray-600 hover:bg-gray-50'}`}
                title={vozHabilitada ? 'Desativar voz' : 'Ativar voz'}
              >
                {vozHabilitada ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
              </Button>
              
              {falando && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={pararFala}
                  className="text-red-600 hover:bg-red-50"
                  title="Parar fala"
                >
                  <VolumeX className="w-4 h-4" />
                </Button>
              )}
              
              <Button
                variant="outline"
                size="sm"
                onClick={limparHistorico}
                className="flex items-center gap-2 text-red-600 hover:bg-red-50"
                title="Limpar histórico"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => setMostrarConfig(!mostrarConfig)}
                className="flex items-center gap-2"
                title="Configurações de voz"
              >
                <Settings className="w-4 h-4" />
              </Button>
            </div>
            
            {/* Botão de Reconectar */}
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

      {/* Painel de Configurações de Voz */}
      {mostrarConfig && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200/60 p-4 mb-4">
          <h3 className="text-sm font-semibold text-slate-900 mb-4">⚙️ Configurações de Voz</h3>
          
          {/* Seletor de Voz */}
          <div className="mb-4">
            <label className="text-xs text-slate-600 mb-2 block font-medium">
              🎤 Voz do Assistente
            </label>
            <select
              value={vozSelecionada?.name || ''}
              onChange={(e) => {
                const voz = vozesDisponiveis.find(v => v.name === e.target.value);
                setVozSelecionada(voz);
              }}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              {vozesDisponiveis.map((voz) => (
                <option key={voz.name} value={voz.name}>
                  {voz.name} ({voz.lang})
                </option>
              ))}
            </select>
          </div>

          {/* Modo Contínuo */}
          <div className="mb-4 flex items-center justify-between p-3 bg-slate-50 rounded-lg">
            <div>
              <label className="text-sm font-medium text-slate-700 block">
                🔄 Modo Contínuo
              </label>
              <p className="text-xs text-slate-500 mt-0.5">
                Reconhecimento de voz sem parar
              </p>
            </div>
            <button
              onClick={() => setModoContinuo(!modoContinuo)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                modoContinuo ? 'bg-blue-600' : 'bg-gray-300'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  modoContinuo ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          <div className="grid grid-cols-3 gap-4">
            {/* Velocidade */}
            <div>
              <label className="text-xs text-slate-600 mb-1 block">
                Velocidade: {configVoz.rate.toFixed(1)}x
              </label>
              <input
                type="range"
                min="0.5"
                max="2"
                step="0.1"
                value={configVoz.rate}
                onChange={(e) => setConfigVoz({...configVoz, rate: parseFloat(e.target.value)})}
                className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer"
              />
            </div>
            
            {/* Tom */}
            <div>
              <label className="text-xs text-slate-600 mb-1 block">
                Tom: {configVoz.pitch.toFixed(1)}
              </label>
              <input
                type="range"
                min="0.5"
                max="2"
                step="0.1"
                value={configVoz.pitch}
                onChange={(e) => setConfigVoz({...configVoz, pitch: parseFloat(e.target.value)})}
                className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer"
              />
            </div>
            
            {/* Volume */}
            <div>
              <label className="text-xs text-slate-600 mb-1 block">
                Volume: {Math.round(configVoz.volume * 100)}%
              </label>
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={configVoz.volume}
                onChange={(e) => setConfigVoz({...configVoz, volume: parseFloat(e.target.value)})}
                className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer"
              />
            </div>
          </div>

          {/* Botão de Teste */}
          <div className="mt-4 pt-4 border-t border-slate-200">
            <Button
              onClick={() => falarTexto('Olá! Esta é a voz do Matias. Como posso ajudá-lo hoje?')}
              variant="outline"
              size="sm"
              className="w-full"
            >
              🎵 Testar Voz
            </Button>
          </div>
        </div>
      )}

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
                  conversa.tipo === 'confirmacao' || conversa.tipo === 'sistema'
                    ? 'bg-gradient-to-br from-green-500 to-emerald-500'
                    : conversa.tipo === 'erro'
                    ? 'bg-gradient-to-br from-red-500 to-orange-500'
                    : conversa.tipo === 'pergunta'
                    ? 'bg-gradient-to-br from-yellow-500 to-amber-500'
                    : conversa.tipo === 'cadastro' || conversa.tipo === 'alerta'
                    ? 'bg-gradient-to-br from-purple-500 to-indigo-500'
                    : conversa.tipo === 'consulta_cliente'
                    ? 'bg-gradient-to-br from-cyan-500 to-blue-400'
                    : 'bg-gradient-to-br from-blue-500 to-purple-500'
                }`}>
                  {conversa.tipo === 'confirmacao' ? (
                    <CheckCircle className="w-4 h-4 text-white" />
                  ) : conversa.tipo === 'erro' ? (
                    <AlertCircle className="w-4 h-4 text-white" />
                  ) : conversa.tipo === 'pergunta' ? (
                    <MessageSquare className="w-4 h-4 text-white" />
                  ) : conversa.tipo === 'sistema' ? (
                    <Wrench className="w-4 h-4 text-white" />
                  ) : conversa.tipo === 'consulta_cliente' ? (
                    <User className="w-4 h-4 text-white" />
                  ) : (
                    <Bot className="w-4 h-4 text-white" />
                  )}
                </div>
              )}

              {/* Mensagem */}
              <div
                className={`max-w-2xl rounded-2xl px-4 py-3 ${
                  conversa.tipo === 'usuario'
                    ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white'
                    : conversa.tipo === 'confirmacao' || conversa.tipo === 'sistema'
                    ? 'bg-gradient-to-r from-green-50 to-emerald-50 text-green-800 border border-green-200'
                    : conversa.tipo === 'erro'
                    ? 'bg-gradient-to-r from-red-50 to-orange-50 text-red-800 border border-red-200'
                    : conversa.tipo === 'pergunta'
                    ? 'bg-gradient-to-r from-yellow-50 to-amber-50 text-yellow-800 border border-yellow-200'
                    : conversa.tipo === 'cadastro' || conversa.tipo === 'alerta'
                    ? 'bg-gradient-to-r from-purple-50 to-indigo-50 text-purple-800 border border-purple-200'
                    : conversa.tipo === 'consulta_cliente'
                    ? 'bg-gradient-to-r from-cyan-50 to-blue-50 text-cyan-900 border border-cyan-200'
                    : 'bg-slate-100 text-slate-900 border border-slate-200'
                }`}
              >
                <div className="whitespace-pre-wrap text-sm leading-relaxed">
                  {conversa.conteudo}
                </div>
                {/* Botão para abrir modal em mensagens de cadastro */}
                {(conversa.tipo === 'cadastro' || conversa.tipo === 'alerta') && conversa.metadata?.dadosExtraidos && (
                  <Button
                    onClick={() => {
                      setClientePrePreenchido({
                        nomeCompleto: conversa.metadata.dadosExtraidos.nome || '',
                        telefone: conversa.metadata.dadosExtraidos.telefone || '',
                        cpfCnpj: conversa.metadata.dadosExtraidos.cpfCnpj || '',
                        email: conversa.metadata.dadosExtraidos.email || ''
                      });
                      setModalClienteAberto(true);
                    }}
                    className="mt-3 w-full bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-600 hover:to-indigo-600 text-white rounded-lg py-2 px-4 text-sm font-medium transition-all duration-200 shadow-sm hover:shadow-md"
                  >
                    📝 Abrir Formulário de Cadastro
                  </Button>
                )}
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
        {/* Sugestões rápidas */}
        <div className="flex flex-wrap gap-2 px-4 pb-2">
          {['Consultar cliente', 'Agendar serviço', 'Ver OS', 'Consultar estoque'].map((sugestao) => (
            <button
              key={sugestao}
              onClick={() => {
                setMensagem(sugestao);
                setTimeout(() => enviarMensagem(), 100);
              }}
              className="px-3 py-1.5 text-sm bg-cyan-50 text-cyan-700 rounded-full hover:bg-cyan-100 transition-colors border border-cyan-200"
            >
              {sugestao}
            </button>
          ))}
        </div>

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

        {/* Banner de status de voz */}
        {(gravando || falando) && (
          <div className={`px-4 py-2 border-t ${gravando ? 'bg-red-50 border-red-200' : 'bg-blue-50 border-blue-200'}`}>
            <div className="flex items-center justify-center gap-2">
              {gravando ? (
                <>
                  <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                  <span className="text-sm font-medium text-red-700">
                    🎤 Gravando... Fale agora
                  </span>
                  {modoContinuo && (
                    <span className="text-xs text-red-600">(Modo contínuo)</span>
                  )}
                </>
              ) : (
                <>
                  <Volume2 className="w-4 h-4 text-blue-600 animate-pulse" />
                  <span className="text-sm font-medium text-blue-700">
                    🔊 Matias está falando...
                  </span>
                </>
              )}
            </div>
          </div>
        )}

        {/* Input de Mensagem */}
        <div className="border-t border-slate-200 p-4 bg-slate-50/50">
          <div className="flex gap-3 items-end">
            <div className="flex-1">
              <Input
                ref={inputRef}
                value={mensagem}
                onChange={(e) => setMensagem(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder={gravando ? "🎤 Gravando..." : falando ? "Matias está falando..." : "Digite sua pergunta ou solicitação..."}
                disabled={carregando || statusConexao !== 'conectado' || gravando}
                className="resize-none border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 rounded-xl"
              />
            </div>
            
            {/* Botão de gravação de voz */}
            <Button
              onClick={gravando ? pararGravacao : iniciarGravacao}
              variant="outline"
              size="sm"
              disabled={carregando || falando}
              className={`rounded-xl ${gravando ? 'bg-red-50 border-red-300 text-red-700 hover:bg-red-100 animate-pulse' : falando ? 'bg-blue-50 border-blue-300 text-blue-400 cursor-not-allowed' : 'bg-gray-50 border-gray-300 text-gray-700 hover:bg-gray-100'}`}
              title={gravando ? 'Parar gravação (Clique ou pressione ESC)' : falando ? 'Aguarde o assistente terminar de falar' : 'Gravar mensagem de voz (Clique para começar)'}
            >
              {gravando ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
            </Button>
            
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
              Aguardando conexão com o agente...
            </div>
          )}
        </div>
      </div>

      {/* 📝 MODAL DE CADASTRO DE CLIENTE */}
      <ClienteModal
        isOpen={modalClienteAberto}
        onClose={() => {
          setModalClienteAberto(false);
          // Removido setCadastroPendente
        }}
        cliente={clientePrePreenchido}
        onSuccess={(clienteData) => {
          // Fechar modal e limpar estados
          setModalClienteAberto(false);
          setClientePrePreenchido(null);
          // Removido setCadastroPendente
          
          // Adicionar mensagem de sucesso ao chat
          const mensagemSucesso = {
            id: Date.now(),
            tipo: 'sucesso',
            conteudo: `✅ Cliente **${clienteData.nomeCompleto}** cadastrado com sucesso! Posso ajudar em mais alguma coisa?`,
            timestamp: new Date().toISOString()
          };
          
          setConversas(prev => {
            const novasConversas = [...prev, mensagemSucesso];
            salvarConversasLocal(novasConversas);
            return novasConversas;
          });
          
          // Falar confirmação se voz habilitada
          if (vozHabilitada) {
            falarTexto(`Cliente ${clienteData.nomeCompleto} cadastrado com sucesso!`);
          }
        }}
      />
    </div>
  );
};

export default AIPage;
