/**
 * ⚙️ Configurações da AIPage
 * 
 * Centraliza todas as constantes e magic numbers
 */

export const AI_CONFIG = {
  // Configurações de Voz
  VOICE: {
    MIN_CONFIDENCE: 0.5,
    MAX_TEXT_LENGTH_FOR_SPEECH: 500,
    RESTART_DELAY_MS: 300,
    ECHO_PREVENTION_DELAY_MS: 500,
    SPEAK_DELAY_MS: 200,
    DEFAULT_RATE: 1.0,
    DEFAULT_PITCH: 1.0,
    DEFAULT_VOLUME: 1.0,
    RATE_MIN: 0.5,
    RATE_MAX: 2.0,
    PITCH_MIN: 0.5,
    PITCH_MAX: 2.0,
    VOLUME_MIN: 0,
    VOLUME_MAX: 1.0
  },

  // Configurações de Chat
  CHAT: {
    MAX_MESSAGE_LENGTH: 1000,
    MAX_HISTORY_MESSAGES: 100,
    CONTEXT_MESSAGES_COUNT: 5,
    AUTO_SAVE_DEBOUNCE_MS: 1000,
    REQUEST_TIMEOUT_MS: 30000,
    SCROLL_BEHAVIOR: 'smooth'
  },

  // Configurações de Retry
  RETRY: {
    MAX_ATTEMPTS: 3,
    BASE_DELAY_MS: 1000,
    EXPONENTIAL_BACKOFF: true
  },

  // Status de Conexão
  CONNECTION_STATUS: {
    CONNECTED: 'conectado',
    CONNECTING: 'conectando',
    DISCONNECTED: 'desconectado',
    ERROR: 'erro'
  },

  // Tipos de Mensagem
  MESSAGE_TYPES: {
    USER: 'usuario',
    AGENT: 'agente',
    SYSTEM: 'sistema',
    ERROR: 'erro',
    CONFIRMATION: 'confirmacao',
    QUESTION: 'pergunta',
    REGISTER: 'cadastro',
    ALERT: 'alerta',
    CLIENT_QUERY: 'consulta_cliente',
    SUCCESS: 'sucesso'
  },

  // Configurações de Storage
  STORAGE: {
    KEY_PREFIX: 'matias_conversas_',
    MAX_SIZE_MB: 5
  },

  // Sugestões Rápidas
  QUICK_SUGGESTIONS: [
    'Consultar cliente',
    'Agendar serviço',
    'Ver OS',
    'Consultar estoque'
  ],

  // Regex Patterns
  PATTERNS: {
    PLACA: /^[A-Z]{3}-?\d{4}$/i,
    TELEFONE: /^\(?[1-9]{2}\)?\s?9?\d{4}-?\d{4}$/,
    CPF: /^\d{3}\.?\d{3}\.?\d{3}-?\d{2}$/,
    CNPJ: /^\d{2}\.?\d{3}\.?\d{3}\/?\d{4}-?\d{2}$/,
    EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  }
};

export default AI_CONFIG;
