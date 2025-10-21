/**
 * 🔧 EXEMPLOS DE CÓDIGO CORRIGIDO - AIPage.jsx
 * 
 * Este arquivo contém exemplos práticos de como corrigir
 * os problemas identificados na análise profunda.
 */

// ============================================
// 1. SISTEMA DE LOGGING
// ============================================

// utils/logger.js
class Logger {
  constructor() {
    this.isDev = import.meta.env.DEV;
  }
  
  error(message, context = {}) {
    const logData = {
      timestamp: new Date().toISOString(),
      level: 'error',
      message,
      ...context
    };
    
    if (this.isDev) {
      console.error(`[ERROR] ${message}`, context);
    }
    
    // Enviar para serviço de logging em produção
    if (!this.isDev) {
      this.sendToServer(logData);
    }
  }
  
  warn(message, context = {}) {
    if (this.isDev) {
      console.warn(`[WARN] ${message}`, context);
    }
  }
  
  async sendToServer(logData) {
    try {
      await fetch('/api/logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(logData)
      });
    } catch (error) {
      // Falha silenciosa
    }
  }
}

export default new Logger();

// ============================================
// 2. HOOK useAuthHeaders (Elimina duplicação)
// ============================================

// hooks/useAuthHeaders.js
import { useCallback } from 'react';
import logger from '../utils/logger';

export const useAuthHeaders = () => {
  const getAuthHeaders = useCallback(() => {
    const headers = { 'Content-Type': 'application/json' };
    
    try {
      const tokenData = JSON.parse(localStorage.getItem('authToken'));
      if (tokenData?.token) {
        headers['Authorization'] = `Bearer ${tokenData.token}`;
      }
    } catch (error) {
      logger.warn('Token inválido', { error: error.message });
    }
    
    return headers;
  }, []);
  
  return { getAuthHeaders };
};

// USO NO COMPONENTE:
// const { getAuthHeaders } = useAuthHeaders();
// const response = await fetch(url, { headers: getAuthHeaders() });


// ============================================
// 3. VALIDAÇÃO E SANITIZAÇÃO DE MENSAGENS
// ============================================

// utils/messageValidator.js
import DOMPurify from 'dompurify';

const CONFIG = {
  MAX_LENGTH: 1000,
  MIN_LENGTH: 1
};

export const validarMensagem = (mensagem) => {
  const errors = [];
  
  if (!mensagem || !mensagem.trim()) {
    errors.push('Mensagem não pode estar vazia');
  }
  
  if (mensagem.length > CONFIG.MAX_LENGTH) {
    errors.push(`Máximo ${CONFIG.MAX_LENGTH} caracteres`);
  }
  
  // Sanitizar HTML/XSS
  const sanitized = DOMPurify.sanitize(mensagem, {
    ALLOWED_TAGS: [],
    ALLOWED_ATTR: []
  });
  
  return {
    valid: errors.length === 0,
    errors,
    sanitized
  };
};

// USO NO COMPONENTE:
const enviarMensagem = async () => {
  const validacao = validarMensagem(mensagem);
  
  if (!validacao.valid) {
    showToast(validacao.errors[0], 'error');
    return;
  }
  
  // Usar mensagem sanitizada
  const novaMensagem = {
    conteudo: validacao.sanitized,
    // ...
  };
};

// ============================================
// 4. TRY-CATCH COM TRATAMENTO ADEQUADO
// ============================================

// ANTES (ERRADO):
try {
  const data = await fetch(url);
} catch {
  // console.error('Erro:', error);
}

// DEPOIS (CORRETO):
try {
  const data = await fetch(url);
} catch (error) {
  logger.error('Erro ao buscar dados', {
    error: error.message,
    stack: error.stack,
    url,
    userId: user?.id
  });
  
  // Mostrar feedback ao usuário
  showToast('Erro ao carregar dados. Tente novamente.', 'error');
  
  // Atualizar estado de erro
  setError(error.message);
}


// ============================================
// 5. DEBOUNCE NO AUTO-SAVE
// ============================================

import { useMemo } from 'react';
import { debounce } from 'lodash';

// Dentro do componente:
const salvarConversasLocalDebounced = useMemo(
  () => debounce((conversas) => {
    try {
      const storageKey = `matias_conversas_${user?.id || 'anonymous'}`;
      localStorage.setItem(storageKey, JSON.stringify({
        conversas,
        timestamp: new Date().toISOString(),
        userId: user?.id
      }));
    } catch (error) {
      logger.error('Erro ao salvar conversas', { 
        error: error.message,
        conversasCount: conversas.length 
      });
    }
  }, 1000), // Salva apenas 1 segundo após última mudança
  [user?.id]
);

// Cleanup
useEffect(() => {
  return () => {
    salvarConversasLocalDebounced.cancel();
  };
}, [salvarConversasLocalDebounced]);

// ============================================
// 6. LIMITE DE MENSAGENS NO HISTÓRICO
// ============================================

const MAX_MESSAGES = 100;

const adicionarMensagem = (novaMensagem) => {
  setConversas(prev => {
    const novasConversas = [...prev, novaMensagem];
    
    // Manter apenas as últimas MAX_MESSAGES
    const conversasLimitadas = novasConversas.slice(-MAX_MESSAGES);
    
    salvarConversasLocalDebounced(conversasLimitadas);
    return conversasLimitadas;
  });
};

// ============================================
// 7. RETRY LOGIC COM EXPONENTIAL BACKOFF
// ============================================

const enviarMensagemComRetry = async (mensagem, tentativa = 1) => {
  const MAX_TENTATIVAS = 3;
  const RETRY_DELAY = 1000;
  
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ message: mensagem }),
      signal: AbortSignal.timeout(30000) // 30s timeout
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    
    return await response.json();
    
  } catch (error) {
    logger.error('Erro ao enviar mensagem', {
      error: error.message,
      tentativa,
      maxTentativas: MAX_TENTATIVAS
    });
    
    // Retry com exponential backoff
    if (tentativa < MAX_TENTATIVAS && error.name !== 'AbortError') {
      const delay = RETRY_DELAY * Math.pow(2, tentativa - 1);
      logger.info(`Tentando novamente em ${delay}ms...`);
      
      await new Promise(resolve => setTimeout(resolve, delay));
      return enviarMensagemComRetry(mensagem, tentativa + 1);
    }
    
    throw error;
  }
};


// ============================================
// 8. CONSTANTES (Elimina Magic Numbers)
// ============================================

// constants/aiPageConfig.js
export const AI_CONFIG = {
  VOICE: {
    MIN_CONFIDENCE: 0.5,
    MAX_TEXT_LENGTH_FOR_SPEECH: 500,
    RESTART_DELAY_MS: 300,
    ECHO_PREVENTION_DELAY_MS: 500,
    SPEAK_DELAY_MS: 200,
    DEFAULT_RATE: 1.0,
    DEFAULT_PITCH: 1.0,
    DEFAULT_VOLUME: 1.0
  },
  CHAT: {
    MAX_MESSAGE_LENGTH: 1000,
    MAX_HISTORY_MESSAGES: 100,
    CONTEXT_MESSAGES_COUNT: 5,
    AUTO_SAVE_DEBOUNCE_MS: 1000,
    REQUEST_TIMEOUT_MS: 30000
  },
  RETRY: {
    MAX_ATTEMPTS: 3,
    BASE_DELAY_MS: 1000
  }
};

// USO:
if (confidence < AI_CONFIG.VOICE.MIN_CONFIDENCE) return;
if (textoLimpo.length < AI_CONFIG.VOICE.MAX_TEXT_LENGTH_FOR_SPEECH) {
  falarTexto(textoLimpo);
}

// ============================================
// 9. HOOK useChatHistory (Extrai lógica)
// ============================================

// hooks/useChatHistory.js
import { useState, useCallback, useMemo } from 'react';
import { debounce } from 'lodash';
import { AI_CONFIG } from '../constants/aiPageConfig';
import logger from '../utils/logger';

export const useChatHistory = (userId) => {
  const [conversas, setConversas] = useState([]);
  
  const storageKey = useMemo(
    () => `matias_conversas_${userId || 'anonymous'}`,
    [userId]
  );
  
  const salvarLocal = useMemo(
    () => debounce((conversas) => {
      try {
        localStorage.setItem(storageKey, JSON.stringify({
          conversas,
          timestamp: new Date().toISOString(),
          userId
        }));
      } catch (error) {
        logger.error('Erro ao salvar histórico', { error: error.message });
      }
    }, AI_CONFIG.CHAT.AUTO_SAVE_DEBOUNCE_MS),
    [storageKey, userId]
  );
  
  const adicionarMensagem = useCallback((mensagem) => {
    setConversas(prev => {
      const novas = [...prev, mensagem];
      const limitadas = novas.slice(-AI_CONFIG.CHAT.MAX_HISTORY_MESSAGES);
      salvarLocal(limitadas);
      return limitadas;
    });
  }, [salvarLocal]);
  
  const limparHistorico = useCallback(() => {
    localStorage.removeItem(storageKey);
    setConversas([]);
  }, [storageKey]);
  
  const carregarHistorico = useCallback(async () => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const data = JSON.parse(saved);
        setConversas(data.conversas || []);
      }
    } catch (error) {
      logger.error('Erro ao carregar histórico', { error: error.message });
    }
  }, [storageKey]);
  
  return {
    conversas,
    adicionarMensagem,
    limparHistorico,
    carregarHistorico
  };
};


// ============================================
// 10. COMPONENTE REFATORADO (Exemplo)
// ============================================

// AIPage.jsx (Versão refatorada - 200 linhas)
import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useChatHistory } from '../hooks/useChatHistory';
import { useVoiceRecognition } from '../hooks/useVoiceRecognition';
import { useVoiceSynthesis } from '../hooks/useVoiceSynthesis';
import { useChatAPI } from '../hooks/useChatAPI';
import { useAuthHeaders } from '../hooks/useAuthHeaders';

import ChatHeader from './components/ChatHeader';
import VoiceConfigPanel from './components/VoiceConfigPanel';
import ChatMessages from './components/ChatMessages';
import ChatInput from './components/ChatInput';
import ClienteModal from '../components/clientes/ClienteModal';

const AIPage = () => {
  const { user } = useAuth();
  const { getAuthHeaders } = useAuthHeaders();
  
  // Estados simplificados
  const [statusConexao, setStatusConexao] = useState('desconectado');
  const [mostrarConfig, setMostrarConfig] = useState(false);
  const [modalClienteAberto, setModalClienteAberto] = useState(false);
  const [clientePrePreenchido, setClientePrePreenchido] = useState(null);
  
  // Hooks customizados
  const {
    conversas,
    adicionarMensagem,
    limparHistorico,
    carregarHistorico
  } = useChatHistory(user?.id);
  
  const {
    gravando,
    iniciarGravacao,
    pararGravacao,
    transcript
  } = useVoiceRecognition();
  
  const {
    falando,
    vozHabilitada,
    configVoz,
    vozesDisponiveis,
    vozSelecionada,
    falarTexto,
    pararFala,
    alternarVoz,
    setVozSelecionada,
    setConfigVoz
  } = useVoiceSynthesis();
  
  const {
    enviarMensagem: enviarParaAPI,
    loading: carregando,
    error: erroAPI
  } = useChatAPI(getAuthHeaders);
  
  // Lógica simplificada
  const handleEnviarMensagem = async (mensagem) => {
    try {
      const resposta = await enviarParaAPI(mensagem);
      
      adicionarMensagem({
        id: Date.now(),
        tipo: 'usuario',
        conteudo: mensagem,
        timestamp: new Date().toISOString()
      });
      
      adicionarMensagem({
        id: Date.now() + 1,
        tipo: resposta.tipo || 'agente',
        conteudo: resposta.response,
        timestamp: new Date().toISOString(),
        metadata: resposta.metadata
      });
      
      if (vozHabilitada && resposta.response) {
        falarTexto(resposta.response);
      }
      
    } catch (error) {
      // Erro já tratado no hook useChatAPI
    }
  };
  
  return (
    <div className="h-full flex flex-col bg-gradient-to-br from-slate-50 to-blue-50 p-2">
      <ChatHeader
        statusConexao={statusConexao}
        vozHabilitada={vozHabilitada}
        falando={falando}
        onAlternarVoz={alternarVoz}
        onPararFala={pararFala}
        onLimparHistorico={limparHistorico}
        onToggleConfig={() => setMostrarConfig(!mostrarConfig)}
      />
      
      {mostrarConfig && (
        <VoiceConfigPanel
          vozesDisponiveis={vozesDisponiveis}
          vozSelecionada={vozSelecionada}
          configVoz={configVoz}
          onVozChange={setVozSelecionada}
          onConfigChange={setConfigVoz}
          onTestarVoz={() => falarTexto('Olá! Esta é a voz do Matias.')}
        />
      )}
      
      <div className="flex-1 bg-white rounded-xl shadow-sm border border-slate-200/60 flex flex-col overflow-hidden">
        <ChatMessages
          conversas={conversas}
          carregando={carregando}
          gravando={gravando}
          falando={falando}
        />
        
        <ChatInput
          onEnviar={handleEnviarMensagem}
          gravando={gravando}
          falando={falando}
          carregando={carregando}
          statusConexao={statusConexao}
          onIniciarGravacao={iniciarGravacao}
          onPararGravacao={pararGravacao}
          transcript={transcript}
        />
      </div>
      
      <ClienteModal
        isOpen={modalClienteAberto}
        onClose={() => setModalClienteAberto(false)}
        cliente={clientePrePreenchido}
        onSuccess={(clienteData) => {
          setModalClienteAberto(false);
          adicionarMensagem({
            id: Date.now(),
            tipo: 'sucesso',
            conteudo: `✅ Cliente ${clienteData.nomeCompleto} cadastrado!`,
            timestamp: new Date().toISOString()
          });
        }}
      />
    </div>
  );
};

export default AIPage;

// ============================================
// RESULTADO DA REFATORAÇÃO:
// - De 1.010 linhas para ~200 linhas
// - Lógica separada em hooks reutilizáveis
// - Componentes menores e focados
// - Mais fácil de testar
// - Mais fácil de manter
// ============================================
