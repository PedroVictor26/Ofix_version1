import { useState, useRef, useEffect } from 'react';
import { User, Bot, CheckCircle, Loader2, AlertCircle, Volume2, VolumeX, Trash2, Settings, MessageSquare, Wrench, MicOff, Mic, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '../context/AuthContext.jsx';
import ClienteModal from '../components/clientes/ClienteModal';
import ActionButtons from '../components/chat/ActionButtons';
import SelectionOptions from '../components/chat/SelectionOptions';

// ✅ NOVOS IMPORTS - Melhorias Críticas
import logger from '../utils/logger';
import { validarMensagem } from '../utils/messageValidator';
import { useToast } from '../components/ui/toast';
import { useAuthHeaders } from '../hooks/useAuthHeaders';
import { AI_CONFIG } from '../constants/aiPageConfig';
import { enrichMessage } from '../utils/nlp/queryParser';

/**
 * Página dedicada para interação com o Assistente de IA (Agno Agent)
 * Interface principal para comunicação com o agente inteligente
 */
const AIPage = () => {
  const { user } = useAuth();

  // ✅ NOVOS HOOKS - Melhorias Críticas
  const { showToast } = useToast();
  const { getAuthHeaders } = useAuthHeaders();

  // Adicionar estilos de animação
  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      @keyframes fade-in {
        from { opacity: 0; transform: translateY(10px); }
        to { opacity: 1; transform: translateY(0); }
      }
      .animate-fade-in {
        animation: fade-in 0.3s ease-out;
      }
    `;
    document.head.appendChild(style);
    return () => document.head.removeChild(style);
  }, []);

  const [mensagem, setMensagem] = useState('');
  const [conversas, setConversas] = useState([]);
  const [carregando, setCarregando] = useState(false);
  const [statusConexao, setStatusConexao] = useState('desconectado'); // conectado, conectando, desconectado, erro

  // ✅ NOVOS ESTADOS - Melhorias Críticas para Busca de Clientes
  const [contextoAtivo, setContextoAtivo] = useState(null);
  const [clienteSelecionado, setClienteSelecionado] = useState(null);
  const [inputWarning, setInputWarning] = useState('');
  const [inputHint, setInputHint] = useState('');

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
        // ✅ USAR HOOK useAuthHeaders
        const authHeaders = getAuthHeaders();

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
            logger.info('Histórico carregado', {
              mensagensCount: mensagensFormatadas.length,
              context: 'carregarHistorico'
            });
          }
        }
      } catch (error) {
        // ✅ LOGGING ESTRUTURADO
        logger.error('Erro ao carregar histórico', {
          error: error.message,
          userId: user?.id,
          context: 'carregarHistorico'
        });
        showToast('Erro ao carregar histórico', 'error');
      }
    };

    carregarHistorico();
  }, [user?.id, getAuthHeaders, showToast]);

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

      // ✅ USAR HOOK useAuthHeaders
      const authHeaders = getAuthHeaders();

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
    } catch (error) {
      // ✅ LOGGING ESTRUTURADO
      logger.error('Erro ao verificar conexão', {
        error: error.message,
        apiBase: import.meta.env.VITE_API_BASE_URL,
        context: 'verificarConexao'
      });
      setStatusConexao('erro');
      showToast('Erro ao conectar com o agente', 'error');
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

      // ✅ USAR CONSTANTE
      if (confidence < AI_CONFIG.VOICE.MIN_CONFIDENCE) return;

      if (modoContinuo) {
        setMensagem(prev => prev + (prev ? ' ' : '') + transcript);
      } else {
        setMensagem(transcript);
      }
    };

    recognition.onerror = (event) => {
      // ✅ LOGGING ESTRUTURADO
      logger.error('Erro no reconhecimento de voz', {
        error: event.error,
        message: event.message,
        context: 'iniciarGravacao'
      });
      setGravando(false);

      // Não mostrar erro para aborted (normal quando para manualmente)
      if (event.error !== 'aborted' && event.error !== 'no-speech') {
        showToast(`Erro no reconhecimento de voz: ${event.error}`, 'error');
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
            } catch (error) {
              logger.warn('Erro ao reiniciar reconhecimento', {
                error: error.message,
                context: 'iniciarGravacao-restart'
              });
            }
          }
        }, 300);
      }
    };

    recognitionRef.current = recognition;

    try {
      recognition.start();
    } catch (error) {
      // ✅ LOGGING ESTRUTURADO
      logger.error('Erro ao iniciar reconhecimento', {
        error: error.message,
        context: 'iniciarGravacao'
      });
      setGravando(false);
      showToast('Erro ao iniciar gravação', 'error');
    }
  };

  const pararGravacao = () => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (error) {
        logger.warn('Erro ao parar reconhecimento', {
          error: error.message,
          context: 'pararGravacao'
        });
      }
      recognitionRef.current = null;
    }
    setGravando(false);
  };

  // Função para síntese de fala
  const falarTexto = (texto) => {
    // Verificações de segurança
    if (!vozHabilitada) {
      logger.debug('Voz desabilitada, não falando');
      return;
    }

    if (!('speechSynthesis' in window)) {
      logger.warn('SpeechSynthesis não suportado neste navegador');
      return;
    }

    if (!texto || texto.trim().length === 0) {
      logger.debug('Texto vazio, não falando');
      return;
    }

    // IMPORTANTE: Parar reconhecimento de voz antes de falar
    const estavagravando = gravando;
    if (gravando) {
      pararGravacao();
    }

    // Cancelar qualquer fala anterior
    try {
      window.speechSynthesis.cancel();
    } catch (error) {
      logger.error('Erro ao cancelar fala anterior', { error: error.message });
    }

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
        } catch (error) {
          // Ignorar erro se já estiver parado (esperado)
          logger.debug('Reconhecimento já estava parado', {
            error: error.message,
            context: 'falarTexto-onstart'
          });
        }
      }
    };

    utterance.onend = () => {
      setFalando(false);

      // Reiniciar gravação se estava gravando antes
      if (estavagravando && modoContinuo) {
        setTimeout(() => {
          iniciarGravacao();
        }, AI_CONFIG.VOICE.ECHO_PREVENTION_DELAY_MS);
      }
    };

    utterance.onerror = (event) => {
      setFalando(false);

      // Erros comuns que não são críticos
      const errosComuns = ['canceled', 'interrupted', 'not-allowed'];
      const ehErroComum = errosComuns.includes(event.error);

      // ✅ LOGGING ESTRUTURADO - Nível apropriado
      if (ehErroComum) {
        logger.debug('Síntese de voz interrompida', {
          error: event.error,
          message: event.message,
          context: 'falarTexto'
        });
      } else {
        logger.error('Erro na síntese de voz', {
          error: event.error,
          message: event.message,
          context: 'falarTexto'
        });
        // Só mostrar toast para erros críticos
        showToast('Erro ao falar texto', 'error');
      }

      // Reiniciar gravação se estava gravando
      if (estavagravando && modoContinuo) {
        setTimeout(() => {
          iniciarGravacao();
        }, AI_CONFIG.VOICE.ECHO_PREVENTION_DELAY_MS);
      }
    };

    synthesisRef.current = utterance;

    // Adicionar pequeno delay antes de falar para garantir que microfone parou
    setTimeout(() => {
      window.speechSynthesis.speak(utterance);
    }, AI_CONFIG.VOICE.SPEAK_DELAY_MS);
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
    } catch (error) {
      logger.error('Erro ao salvar conversas', {
        error: error.message,
        conversasCount: novasConversas.length,
        context: 'salvarConversasLocal'
      });
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
    } catch (error) {
      logger.error('Erro ao limpar histórico', {
        error: error.message,
        context: 'limparHistorico'
      });
      showToast('Erro ao limpar histórico', 'error');
    }
  };

  // ============================================
  // VALIDAÇÃO EM TEMPO REAL - Busca de Clientes
  // ============================================
  
  const validarInputBusca = (valor) => {
    if (!valor || contextoAtivo !== 'buscar_cliente') {
      setInputWarning('');
      setInputHint('');
      return true;
    }
    
    // Muito curto
    if (valor.length < 3) {
      setInputWarning('Digite pelo menos 3 caracteres');
      setInputHint('');
      return false;
    }
    
    // Detectar e formatar CPF
    const apenasNumeros = valor.replace(/\D/g, '');
    if (apenasNumeros.length === 11 && !valor.includes('.')) {
      const cpfFormatado = apenasNumeros.replace(
        /(\d{3})(\d{3})(\d{3})(\d{2})/,
        '$1.$2.$3-$4'
      );
      setMensagem(cpfFormatado);
      setInputHint('✅ CPF detectado e formatado');
      setInputWarning('');
      return true;
    }
    
    // Detectar telefone
    if (apenasNumeros.length === 10 || apenasNumeros.length === 11) {
      setInputHint('✅ Telefone detectado');
      setInputWarning('');
      return true;
    }
    
    // Nome válido
    if (valor.length >= 3) {
      setInputHint('✅ Pronto para buscar');
      setInputWarning('');
      return true;
    }
    
    setInputWarning('');
    setInputHint('');
    return true;
  };

  // ============================================
  // HELPER: GERAR AÇÕES INLINE
  // ============================================
  
  const gerarAcoesInline = (tipo, metadata) => {
    const actions = [];
    
    // Consulta de cliente
    if (tipo === 'consulta_cliente' && metadata?.cliente_id) {
      actions.push(
        { type: 'agendar', label: 'Agendar serviço', data: { cliente: metadata.cliente_nome } },
        { type: 'ver_detalhes', label: 'Ver detalhes', data: { cliente_id: metadata.cliente_id } }
      );
      if (metadata.telefone) {
        actions.push({ type: 'ligar', label: 'Ligar', data: { telefone: metadata.telefone } });
      }
    }
    
    // OS encontrada
    if (metadata?.os_id) {
      actions.push(
        { type: 'ver_os', label: 'Ver OS', data: { os_id: metadata.os_id } },
        { type: 'editar', label: 'Editar', data: { os_id: metadata.os_id } }
      );
    }
    
    // Agendamento criado
    if (tipo === 'confirmacao' && metadata?.agendamento_id) {
      actions.push(
        { type: 'ver_detalhes', label: 'Ver agendamento', data: { agendamento_id: metadata.agendamento_id } },
        { type: 'editar', label: 'Reagendar', data: { agendamento_id: metadata.agendamento_id } }
      );
    }
    
    return actions.length > 0 ? actions : null;
  };

  // ============================================
  // ENVIAR MENSAGEM
  // ============================================

  const enviarMensagem = async () => {
    if (!mensagem.trim() || carregando) return;
    
    // Log para debug do estado antes de enviar
    console.log('🔍 DEBUG: Estado antes de enviar mensagem:', {
      contextoAtivo: contextoAtivo,
      clienteSelecionado: clienteSelecionado,
      mensagem: mensagem
    });

    // Verificar se estamos no contexto de busca de cliente e a mensagem é um número
    if (contextoAtivo === 'buscar_cliente' && /^\d+$/.test(mensagem.trim())) {
      const numeroDigitado = parseInt(mensagem.trim());
      
      // Encontrar a última mensagem do assistente com clientes
      const ultimaMensagemAssistente = [...conversas].reverse().find(c => 
        c.tipo !== 'usuario' && (c.metadata?.clientes || c.tipo === 'consulta_cliente')
      );
      
      if (ultimaMensagemAssistente) {
        // Tentar extrair clientes da resposta, mesmo que não estejam no metadata
        const responseContent = ultimaMensagemAssistente.conteudo;
        const linhas = responseContent.split('\n');
        const clientesExtraidos = [];
        
        for (const linha of linhas) {
          const match = linha.match(/^(\d+)\.\s*\*\*(.+?)\*\*/);
          if (match) {
            const numero = parseInt(match[1]);
            const nome = match[2].trim();
            clientesExtraidos.push({
              id: numero,
              label: nome,
              value: numero.toString()
            });
          }
        }
        
        const clientes = clientesExtraidos.length > 0 ? clientesExtraidos : ultimaMensagemAssistente.metadata?.clientes;
        
        if (clientes && numeroDigitado >= 1 && numeroDigitado <= clientes.length) {
          // O usuário digitou um número válido de cliente
          const clienteSelecionado = clientes[numeroDigitado - 1];
          
          // Enviar mensagem como se o usuário tivesse selecionado a opção
          const novaMensagem = {
            id: Date.now(),
            tipo: 'usuario',
            conteudo: `${numeroDigitado}`,
            timestamp: new Date().toISOString(),
            metadata: {
              contexto: contextoAtivo
            }
          };

          setConversas(prev => {
            const novasConversas = [...prev, novaMensagem];
            salvarConversasLocal(novasConversas);
            return novasConversas;
          });
          
          setMensagem('');
          setCarregando(true);
          
          try {
            const authHeaders = getAuthHeaders();

            const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:1000';
            const API_BASE = API_BASE_URL.replace('/api', '');
            
            // Preparar body da requisição
            const requestBody = {
              message: novaMensagem.conteudo,
              usuario_id: user?.id,
              contexto_conversa: conversas.slice(-5).map(c => ({
                tipo: c.tipo,
                conteudo: c.conteudo
              })),
              contexto_ativo: contextoAtivo
            };
            
            logger.info('🚀 Enviando requisição ao backend (seleção de cliente)', {
              endpoint: `${API_BASE}/agno/chat-inteligente`,
              contextoAtivo: contextoAtivo,
              message: novaMensagem.conteudo,
              context: 'enviarMensagem'
            });

            const response = await fetch(`${API_BASE}/agno/chat-inteligente`, {
              method: 'POST',
              headers: authHeaders,
              body: JSON.stringify(requestBody)
            });

            if (response.ok) {
              const data = await response.json();
              
              let responseContent = '';
              let tipoResposta = 'agente';

              if (data.response) {
                if (typeof data.response === 'string') {
                  responseContent = data.response;
                } else if (typeof data.response === 'object') {
                  responseContent = data.response.content ||
                    data.response.message ||
                    data.response.output ||
                    JSON.stringify(data.response, null, 2);
                } else {
                  responseContent = String(data.response);
                }

                if (data.tipo) {
                  tipoResposta = data.tipo;
                }
              } else if (data.message) {
                responseContent = data.message;
                tipoResposta = data.success ? 'agente' : 'erro';
              } else {
                responseContent = 'Resposta recebida do agente.';
                tipoResposta = 'agente';
              }

              // Verificar se a resposta indica que o cliente foi selecionado
              if (responseContent.includes('Cliente selecionado') || responseContent.includes('cliente selecionado')) {
                // Atualizar contexto para refletir que um cliente foi selecionado
                setContextoAtivo('cliente_selecionado');
              }

              const respostaAgente = {
                id: Date.now() + 1,
                tipo: tipoResposta,
                conteudo: responseContent,
                timestamp: new Date().toISOString(),
                metadata: {
                  ...data.metadata,
                  dadosExtraidos: data.dadosExtraidos,
                  actions: data.metadata?.actions
                }
              };

              setConversas(prev => {
                const novasConversas = [...prev, respostaAgente];
                salvarConversasLocal(novasConversas);
                return novasConversas;
              });

              // ✅ LIMPAR CONTEXTO APÓS SUCESSO
              if (data.success && contextoAtivo && !responseContent.includes('Cliente selecionado')) {
                setContextoAtivo(null);
              }

              // Falar resposta se voz habilitada
              if (vozHabilitada && responseContent && 'speechSynthesis' in window) {
                try {
                  const textoLimpo = responseContent
                    .replace(/\*\*(.*?)\*\*/g, '$1')
                    .replace(/\*(.*?)\*/g, '$1')
                    .replace(/#{1,6}\s/g, '')
                    .replace(/```[\s\S]*?```/g, '')
                    .replace(/`([^`]+)`/g, '$1')
                    .replace(/\n{2,}/g, '. ')
                    .replace(/\n/g, ' ')
                    .replace(/[•✅❌📋🔧🚗💼📊🔍🆕👤📅💰📦]/gu, '')
                    .trim();

                  if (textoLimpo.length > 0 && textoLimpo.length < AI_CONFIG.VOICE.MAX_TEXT_LENGTH_FOR_SPEECH) {
                    falarTexto(textoLimpo);
                  }
                } catch (error) {
                  logger.error('Erro ao preparar texto para fala', {
                    error: error.message
                  });
                }
              }
            } else {
              throw new Error(`Erro na API: ${response.status}`);
            }
          } catch (error) {
            logger.error('Erro ao enviar mensagem de seleção de cliente', {
              error: error.message,
              stack: error.stack,
              userId: user?.id,
              messageLength: mensagem.length,
              contextoAtivo: contextoAtivo,
              context: 'enviarMensagem'
            });

            showToast('Erro ao processar seleção de cliente. Tente novamente.', 'error');

            const mensagemErro = {
              id: Date.now() + 1,
              tipo: 'erro',
              conteudo: 'Desculpe, ocorreu um erro ao processar sua seleção de cliente. Tente novamente em instantes.',
              timestamp: new Date().toISOString()
            };

            setConversas(prev => [...prev, mensagemErro]);
          } finally {
            setCarregando(false);
          }
          
          return; // Sair da função para evitar o processamento duplicado
        } else {
          // Número fora do intervalo
          const mensagemErro = {
            id: Date.now(),
            tipo: 'erro',
            conteudo: `❌ Número inválido: ${numeroDigitado}\n\nPor favor, escolha um número entre 1 e ${clientes ? clientes.length : 'N/A'}.`,
            timestamp: new Date().toISOString()
          };

          setConversas(prev => {
            const novasConversas = [...prev, mensagemErro];
            salvarConversasLocal(novasConversas);
            return novasConversas;
          });
          
          setMensagem('');
          return;
        }
      } else {
        // Se não encontrou uma mensagem de consulta de cliente, mas ainda estamos no contexto, 
        // podemos tentar processar normalmente
        logger.warn('Nenhuma mensagem de consulta de cliente encontrada no histórico', {
          contextoAtivo,
          mensagem: mensagem.trim()
        });
      }
    }

    // ✅ VALIDAR MENSAGEM
    const validacao = validarMensagem(mensagem);

    if (!validacao.valid) {
      showToast(validacao.errors[0], 'error');
      logger.warn('Mensagem inválida', {
        errors: validacao.errors,
        messageLength: mensagem.length,
        context: 'enviarMensagem'
      });
      return;
    }

    const novaMensagem = {
      id: Date.now(),
      tipo: 'usuario',
      conteudo: validacao.sanitized,
      timestamp: new Date().toISOString(),
      metadata: {
        contexto: contextoAtivo  // ✅ Adiciona contexto
      }
    };

    setConversas(prev => {
      const novasConversas = [...prev, novaMensagem];
      salvarConversasLocal(novasConversas);
      return novasConversas;
    });
    
    setMensagem('');
    setCarregando(true);
    
    // Limpa hints
    setInputWarning('');
    setInputHint('');

    try {
      const authHeaders = getAuthHeaders();

      // 🧠 ENRIQUECER MENSAGEM COM NLP
      let mensagemEnriquecida = null;
      try {
        mensagemEnriquecida = enrichMessage(novaMensagem.conteudo);
        
        logger.info('Mensagem enriquecida com NLP', {
          intencao: mensagemEnriquecida.nlp.intencao,
          confianca: mensagemEnriquecida.nlp.confianca,
          entidades: Object.keys(mensagemEnriquecida.nlp.entidades),
          context: 'enviarMensagem'
        });
      } catch (nlpError) {
        logger.warn('Erro ao enriquecer mensagem com NLP', {
          error: nlpError.message,
          context: 'enviarMensagem'
        });
      }

      const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:1000';
      const API_BASE = API_BASE_URL.replace('/api', '');
      
      // Preparar body da requisição
      const requestBody = {
        message: novaMensagem.conteudo,
        usuario_id: user?.id,
        contexto_conversa: conversas.slice(-5).map(c => ({
          tipo: c.tipo,
          conteudo: c.conteudo
        })),
        contexto_ativo: contextoAtivo,  // ✅ Envia contexto ativo
        cliente_selecionado: clienteSelecionado  // ✅ Envia cliente selecionado
      };
      
      // Adicionar log para debug
      console.log('🔍 DEBUG: Enviando requisição com cliente selecionado:', clienteSelecionado);
      
      // Adicionar NLP se disponível
      if (mensagemEnriquecida) {
        requestBody.nlp = mensagemEnriquecida.nlp;
        requestBody.contextoNLP = mensagemEnriquecida.contexto;
      }
      
      logger.info('🚀 Enviando requisição ao backend', {
        endpoint: `${API_BASE}/agno/chat-inteligente`,
        hasNLP: !!mensagemEnriquecida,
        contextoAtivo: contextoAtivo,
        message: novaMensagem.conteudo.substring(0, 50),
        context: 'enviarMensagem'
      });

      const response = await fetch(`${API_BASE}/agno/chat-inteligente`, {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify(requestBody)
      });

      logger.info('📥 Resposta recebida do backend', {
        status: response.status,
        ok: response.ok,
        statusText: response.statusText,
        context: 'enviarMensagem'
      });

      if (response.ok) {
        const data = await response.json();
        
        logger.info('📦 Dados da resposta', {
          hasResponse: !!data.response,
          tipo: data.tipo,
          success: data.success,
          context: 'enviarMensagem'
        });

        let responseContent = '';
        let tipoResposta = 'agente';

        if (data.response) {
          if (typeof data.response === 'string') {
            responseContent = data.response;
          } else if (typeof data.response === 'object') {
            responseContent = data.response.content ||
              data.response.message ||
              data.response.output ||
              JSON.stringify(data.response, null, 2);
          } else {
            responseContent = String(data.response);
          }

          if (data.tipo) {
            tipoResposta = data.tipo;
          }
        } else if (data.message) {
          responseContent = data.message;
          tipoResposta = data.success ? 'agente' : 'erro';
        } else {
          responseContent = 'Resposta recebida do agente.';
          tipoResposta = 'agente';
        }

        // ✅ TRATAMENTO ESPECIAL PARA ERRO DE BUSCA
        if (contextoAtivo === 'buscar_cliente' && !data.success && data.tipo === 'erro') {
          // Cliente não encontrado - oferecer cadastro
          responseContent = `🔍 Não encontrei "${novaMensagem.conteudo}" no sistema.\n\n🆕 Quer cadastrar este cliente agora?\n\nVou precisar de:\n• Nome completo\n• Telefone\n• CPF (opcional)\n• Email (opcional)`;
          tipoResposta = 'cadastro';
          
          data.metadata = {
            ...data.metadata,
            dadosExtraidos: {
              nome: novaMensagem.conteudo
            },
            actions: [
              { 
                type: 'cadastrar_cliente', 
                label: 'Sim, cadastrar', 
                data: { nome: novaMensagem.conteudo } 
              },
              { 
                type: 'tentar_novamente', 
                label: 'Não, tentar outro nome', 
                data: {} 
              }
            ]
          };
        }

        const acoesInline = gerarAcoesInline(tipoResposta, data.metadata);
        
        // Processar conteúdo para detectar clientes listados
        let metadataAtualizado = {
          ...data.metadata,
          dadosExtraidos: data.dadosExtraidos,
          actions: acoesInline
        };

        // Se for uma consulta de cliente, extrair informações da resposta
        if (tipoResposta === 'consulta_cliente' || contextoAtivo === 'buscar_cliente') {
          // Processar o conteúdo linha por linha para identificar clientes
          const linhas = responseContent.split('\n');
          const clientesExtraidos = [];
          let ultimoNumero = 0;
          
          for (const linha of linhas) {
            // Padrão para identificar clientes numerados: "1. **Nome do Cliente**"
            const match = linha.match(/^(\d+)\.\s*\*\*(.+?)\*\*/);
            if (match) {
              const numero = parseInt(match[1]);
              const nome = match[2].trim();
              
              clientesExtraidos.push({
                id: numero, // Usando número como ID temporário
                label: nome,
                value: numero.toString()
              });
              
              ultimoNumero = numero;
            }
          }
          
          if (clientesExtraidos.length > 0) {
            metadataAtualizado = {
              ...metadataAtualizado,
              clientes: clientesExtraidos
            };
          }
        }

        const respostaAgente = {
          id: Date.now() + 1,
          tipo: tipoResposta,
          conteudo: responseContent,
          timestamp: new Date().toISOString(),
          metadata: metadataAtualizado
        };

        // Adicionando a renderização da lista de seleção de clientes se necessário
        if (tipoResposta === 'consulta_cliente' && metadataAtualizado.clientes && metadataAtualizado.clientes.length > 0) {
          // Esta renderização já é tratada no JSX do componente
        }
        
        // Manter o contexto de busca de cliente se for uma resposta de consulta
        if (tipoResposta === 'consulta_cliente') {
          setContextoAtivo('buscar_cliente');
        }

        setConversas(prev => {
          const novasConversas = [...prev, respostaAgente];
          salvarConversasLocal(novasConversas);
          return novasConversas;
        });

        // 🎯 ABRIR MODAL DE CADASTRO SE NECESSÁRIO
        if (tipoResposta === 'cadastro' && data.dadosExtraidos) {
          setClientePrePreenchido({
            nomeCompleto: data.dadosExtraidos.nome || novaMensagem.conteudo,
            telefone: data.dadosExtraidos.telefone || '',
            cpfCnpj: data.dadosExtraidos.cpfCnpj || '',
            email: data.dadosExtraidos.email || ''
          });
          // Não abre automaticamente, espera usuário clicar no botão
        }

        // ✅ LIMPAR CONTEXTO APÓS SUCESSO - EXCETO PARA CONSULTA_CLIENTE E CLIENTE_SELECIONADO
        if (data.success && contextoAtivo) {
          // Não limpar o contexto se for uma consulta de cliente ou seleção de cliente
          if (tipoResposta !== 'consulta_cliente' && tipoResposta !== 'cliente_selecionado') {
            setContextoAtivo(null);
          }
        }
        
        // Atualizar cliente selecionado se for uma seleção
        if (tipoResposta === 'cliente_selecionado' && data.cliente) {
          console.log('🔍 DEBUG: Atualizando cliente selecionado:', data.cliente);
          setClienteSelecionado(data.cliente);
          
          // Forçar atualização do contexto também para garantir sincronização
          setContextoAtivo('cliente_selecionado');
          
          // Log imediato para verificar atualização
          console.log('🔍 DEBUG: Cliente selecionado atualizado para:', data.cliente);
        }
        
        // Log para debug do estado atual
        console.log('🔍 DEBUG: Estado após processamento:', {
          contextoAtivo: contextoAtivo,
          clienteSelecionado: clienteSelecionado,
          tipoResposta: tipoResposta
        });
        
        // Verificação especial para cliente selecionado
        if (tipoResposta === 'cliente_selecionado' && data.cliente) {
          setTimeout(() => {
            console.log('🔍 DEBUG: Verificação após timeout - cliente selecionado:', clienteSelecionado);
          }, 100);
        }

        // Falar resposta se voz habilitada
        if (vozHabilitada && responseContent && 'speechSynthesis' in window) {
          try {
            const textoLimpo = responseContent
              .replace(/\*\*(.*?)\*\*/g, '$1')
              .replace(/\*(.*?)\*/g, '$1')
              .replace(/#{1,6}\s/g, '')
              .replace(/```[\s\S]*?```/g, '')
              .replace(/`([^`]+)`/g, '$1')
              .replace(/\n{2,}/g, '. ')
              .replace(/\n/g, ' ')
              .replace(/[•✅❌📋🔧🚗💼📊🔍🆕👤📅💰📦]/gu, '')
              .trim();

            if (textoLimpo.length > 0 && textoLimpo.length < AI_CONFIG.VOICE.MAX_TEXT_LENGTH_FOR_SPEECH) {
              falarTexto(textoLimpo);
            }
          } catch (error) {
            logger.error('Erro ao preparar texto para fala', {
              error: error.message
            });
          }
        }
      } else {
        throw new Error(`Erro na API: ${response.status}`);
      }
    } catch (error) {
      logger.error('Erro ao enviar mensagem', {
        error: error.message,
        stack: error.stack,
        userId: user?.id,
        messageLength: mensagem.length,
        contextoAtivo: contextoAtivo,
        context: 'enviarMensagem'
      });

      showToast('Erro ao enviar mensagem. Tente novamente.', 'error');

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
            {/* Status da Conexão - Melhorado */}
            <div className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-all duration-300 ${
              statusConexao === 'conectado' ? 'bg-green-50 border border-green-200' :
              statusConexao === 'conectando' ? 'bg-yellow-50 border border-yellow-200' :
              statusConexao === 'erro' ? 'bg-red-50 border border-red-200' :
              'bg-slate-50 border border-slate-200'
            }`}>
              <div className="relative">
                {getStatusIcon()}
                {statusConexao === 'conectado' && (
                  <span className="absolute -top-1 -right-1 w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                )}
              </div>
              <span className={`text-sm font-medium ${
                statusConexao === 'conectado' ? 'text-green-700' :
                statusConexao === 'conectando' ? 'text-yellow-700' :
                statusConexao === 'erro' ? 'text-red-700' :
                'text-slate-700'
              }`}>
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
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${modoContinuo ? 'bg-blue-600' : 'bg-gray-300'
                }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${modoContinuo ? 'translate-x-6' : 'translate-x-1'
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
                onChange={(e) => setConfigVoz({ ...configVoz, rate: parseFloat(e.target.value) })}
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
                onChange={(e) => setConfigVoz({ ...configVoz, pitch: parseFloat(e.target.value) })}
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
                onChange={(e) => setConfigVoz({ ...configVoz, volume: parseFloat(e.target.value) })}
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
              className={`flex gap-3 ${conversa.tipo === 'usuario' ? 'justify-end' : 'justify-start'
                }`}
            >
              {/* Avatar */}
              {conversa.tipo !== 'usuario' && (
                <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${conversa.tipo === 'confirmacao' || conversa.tipo === 'sistema'
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
                className={`max-w-2xl rounded-2xl px-4 py-3 ${conversa.tipo === 'usuario'
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
                
                {/* Botões de ação inline */}
                {conversa.tipo !== 'usuario' && conversa.metadata?.actions && (
                  <ActionButtons 
                    actions={conversa.metadata.actions}
                    onAction={(action) => {
                      logger.info('Ação inline executada', { action });
                      
                      // Novo handler para tratar novas ações
                      switch (action.type) {
                        case 'cadastrar_cliente':
                          // Abrir modal com dados pré-preenchidos
                          setClientePrePreenchido({
                            nomeCompleto: action.data.nome || '',
                            telefone: action.data.telefone || '',
                            cpfCnpj: action.data.cpfCnpj || '',
                            email: action.data.email || ''
                          });
                          setModalClienteAberto(true);
                          break;
                          
                        case 'tentar_novamente':
                          // Limpar campo e manter contexto
                          setMensagem('');
                          if (inputRef.current) {
                            inputRef.current.placeholder = 'Digite outro nome, CPF ou telefone...';
                            inputRef.current.focus();
                          }
                          setContextoAtivo('buscar_cliente');
                          break;
                          
                        case 'agendar':
                          setMensagem(`Agendar serviço para ${action.data?.cliente || 'cliente'}`);
                          break;
                          
                        case 'ver_os':
                          // Navegar para OS ou abrir modal
                          showToast(`Abrindo OS #${action.data?.os_id}`, 'info');
                          break;
                          
                        case 'ligar':
                          window.open(`tel:${action.data?.telefone}`, '_self');
                          break;
                          
                        default:
                          showToast(`Ação: ${action.label}`, 'info');
                      }
                    }}
                  />
                )}
                
                {/* Opções de seleção para ambiguidade */}
                {conversa.tipo !== 'usuario' && conversa.metadata?.options && (
                  <SelectionOptions
                    options={conversa.metadata.options}
                    title={conversa.metadata.selectionTitle || "Escolha uma opção:"}
                    onSelect={(option) => {
                      logger.info('Opção selecionada', { option });
                      // Enviar mensagem com a seleção
                      if (option.value) {
                        setMensagem(option.value);
                        setTimeout(() => enviarMensagem(), 100);
                      } else if (option.id) {
                        setMensagem(`Selecionado: ${option.label} (ID: ${option.id})`);
                        setTimeout(() => enviarMensagem(), 100);
                      }
                    }}
                  />
                )}
                
                {/* Adicionando lógica para seleção de cliente por número */}
                {conversa.tipo === 'consulta_cliente' && conversa.metadata?.clientes && (
                  <div className="mt-3 pt-3 border-t border-slate-200">
                    <p className="text-xs font-medium text-slate-600 mb-2">Digite o número do cliente para selecionar:</p>
                    <div className="space-y-2">
                      {conversa.metadata.clientes.map((cliente, index) => (
                        <button
                          key={cliente.id}
                          onClick={() => {
                            logger.info('Cliente selecionado por número', { cliente, index: index + 1 });
                            setMensagem(`${index + 1}`);
                            setTimeout(() => enviarMensagem(), 100);
                          }}
                          className="w-full text-left px-3 py-2 rounded-lg border border-slate-200 hover:border-blue-400 hover:bg-blue-50 transition-all duration-200 group"
                        >
                          <div className="flex items-start gap-2">
                            <div className="flex-shrink-0 w-6 h-6 rounded-full bg-slate-100 group-hover:bg-blue-100 flex items-center justify-center text-xs font-medium text-slate-600 group-hover:text-blue-600">
                              {index + 1}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="text-sm font-medium text-slate-900 group-hover:text-blue-900">
                                {cliente.nomeCompleto}
                              </div>
                              <div className="text-xs text-slate-500 mt-0.5">
                                {cliente.telefone || 'Sem telefone'}
                              </div>
                              {cliente.veiculos && cliente.veiculos.length > 0 && (
                                <div className="text-xs text-slate-400 mt-1">
                                  Veículos: {cliente.veiculos.map(v => `${v.marca} ${v.modelo}`).join(', ')}
                                </div>
                              )}
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                
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
                <div className={`text-xs mt-2 opacity-60 ${conversa.tipo === 'usuario' ? 'text-white' : 'text-slate-500'
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
            {[
              { 
                icon: '🔍',  // Mudou de 👤 para 🔍 (mais intuitivo)
                text: 'Buscar cliente', 
                command: 'buscar_cliente',  // Comando interno, não enviado
                placeholder: 'Digite nome, CPF ou telefone...',
                mensagemGuia: '👤 Claro! Me diga o nome, CPF ou telefone do cliente que você procura.\n\nExemplos:\n• João Silva\n• 123.456.789-00\n• (11) 98765-4321',
                color: 'blue' 
              },
              { 
                icon: '📅', 
                text: 'Agendar serviço', 
                command: 'agendar_servico',
                placeholder: 'Ex: Troca de óleo para amanhã às 14h',
                mensagemGuia: '📅 Vou te ajudar a agendar! Me diga:\n• Qual serviço?\n• Para quando?\n• Qual cliente?',
                color: 'green' 
              },
              { 
                icon: '🔧', 
                text: 'Status da OS', 
                command: 'status_os',
                placeholder: 'Ex: OS 1234 ou cliente João Silva',
                mensagemGuia: '🔧 Vou consultar o status! Me informe:\n• Número da OS, ou\n• Nome do cliente',
                color: 'purple' 
              },
              { 
                icon: '📦', 
                text: 'Consultar peças', 
                command: 'consultar_pecas',
                placeholder: 'Ex: filtro de óleo ou código ABC123',
                mensagemGuia: '📦 Vou buscar as peças! Me diga:\n• Nome da peça, ou\n• Código da peça',
                color: 'orange' 
              },
              { 
                icon: '💰', 
                text: 'Calcular orçamento', 
                command: 'calcular_orcamento',
                placeholder: 'Ex: troca de óleo + filtro',
                mensagemGuia: '💰 Vou calcular o orçamento! Me diga:\n• Quais serviços?\n• Quais peças?',
                color: 'cyan' 
              }
            ].map((sugestao) => (
              <button
                key={sugestao.text}
                onClick={() => {
                  // NÃO envia mensagem automaticamente
                  // Apenas prepara o contexto
                  
                  // Limpa o campo
                  setMensagem("");
                  
                  // Atualiza placeholder
                  if (inputRef.current) {
                    inputRef.current.placeholder = sugestao.placeholder;
                    inputRef.current.focus();
                  }
                  
                  // Define contexto ativo
                  setContextoAtivo(sugestao.command);
                  
                  // Envia mensagem guia do assistente
                  const mensagemGuia = {
                    id: Date.now(),
                    tipo: 'sistema',
                    conteudo: sugestao.mensagemGuia,
                    timestamp: new Date().toISOString()
                  };
                  
                  setConversas(prev => {
                    const novasConversas = [...prev, mensagemGuia];
                    salvarConversasLocal(novasConversas);
                    return novasConversas;
                  });
                  
                  logger.info('Contexto ativado', {
                    contexto: sugestao.command,
                    placeholder: sugestao.placeholder
                  });
                }}
                disabled={carregando}
                className={`px-3 py-1.5 text-sm bg-${sugestao.color}-50 text-${sugestao.color}-700 rounded-full hover:bg-${sugestao.color}-100 transition-all duration-200 border border-${sugestao.color}-200 hover:shadow-md hover:scale-105 active:scale-95 flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100`}
              >
                <span>{sugestao.icon}</span>
                <span>{sugestao.text}</span>
              </button>
            ))}
          </div>

          {/* Indicador de carregamento - Melhorado */}
          {carregando && (
            <div className="flex gap-3 justify-start animate-fade-in">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center shadow-lg">
                <Bot className="w-4 h-4 text-white" />
              </div>
              <div className="bg-gradient-to-r from-slate-50 to-slate-100 border border-slate-200 rounded-2xl px-4 py-3 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="flex gap-1">
                    <span className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{animationDelay: '0ms'}} />
                    <span className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{animationDelay: '150ms'}} />
                    <span className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{animationDelay: '300ms'}} />
                  </div>
                  <span className="text-sm text-slate-700 font-medium">Matias está pensando...</span>
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
                onChange={(e) => {
                  setMensagem(e.target.value);
                  validarInputBusca(e.target.value);
                }}
                onKeyPress={handleKeyPress}
                placeholder={gravando ? "🎤 Gravando..." : falando ? "Matias está falando..." : contextoAtivo ? 
                  (contextoAtivo === 'buscar_cliente' ? 'Digite nome, CPF ou telefone...' : 
                   contextoAtivo === 'agendar_servico' ? 'Ex: Troca de óleo para amanhã às 14h' :
                   contextoAtivo === 'status_os' ? 'Ex: OS 1234 ou cliente João Silva' :
                   contextoAtivo === 'consultar_pecas' ? 'Ex: filtro de óleo ou código ABC123' :
                   contextoAtivo === 'calcular_orcamento' ? 'Ex: troca de óleo + filtro' :
                   "Digite sua mensagem...") : 
                  "Digite sua pergunta ou solicitação..."}
                disabled={carregando || statusConexao !== 'conectado' || gravando}
                className="resize-none border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 rounded-xl"
              />
              {/* ✅ CONTADOR DE CARACTERES */}
              <div className={`text-xs mt-1 ${mensagem.length > AI_CONFIG.CHAT.MAX_MESSAGE_LENGTH ? 'text-red-600' : 'text-slate-500'}`}>
                {mensagem.length}/{AI_CONFIG.CHAT.MAX_MESSAGE_LENGTH} caracteres
              </div>
              
              {/* Adicionar feedback visual abaixo do input */}
              {inputWarning && (
                <div className="px-4 py-1 text-xs text-red-600 bg-red-50 rounded">
                  ⚠️ {inputWarning}
                </div>
              )}
              {inputHint && (
                <div className="px-4 py-1 text-xs text-green-600 bg-green-50 rounded">
                  {inputHint}
                </div>
              )}
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
