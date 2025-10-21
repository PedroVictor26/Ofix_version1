/**
 * 📝 Sistema de Logging Estruturado
 * 
 * Substitui console.log/error comentados por logging profissional
 * com envio para servidor em produção
 * 
 * Features:
 * - Níveis de log (error, warn, info, debug)
 * - Envio automático para servidor em produção
 * - Captura de erros globais
 * - Rate limiting para evitar spam
 * - Contexto enriquecido automaticamente
 */

const LOG_LEVELS = {
  ERROR: 'error',
  WARN: 'warn',
  INFO: 'info',
  DEBUG: 'debug'
};

class Logger {
  constructor() {
    this.isDevelopment = import.meta.env.DEV;
    this.apiUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:1000';
    this.logQueue = [];
    this.maxQueueSize = 50;
    this.flushInterval = 5000; // 5 segundos
    this.lastFlush = Date.now();
    this.rateLimitMap = new Map(); // Para rate limiting
    this.rateLimitWindow = 60000; // 1 minuto
    this.maxLogsPerWindow = 100;
    
    // Iniciar flush automático em produção
    if (!this.isDevelopment) {
      this.startAutoFlush();
    }
  }

  /**
   * Verifica rate limiting
   */
  checkRateLimit(key) {
    const now = Date.now();
    const windowKey = `${key}_${Math.floor(now / this.rateLimitWindow)}`;
    
    const count = this.rateLimitMap.get(windowKey) || 0;
    
    if (count >= this.maxLogsPerWindow) {
      return false; // Rate limit excedido
    }
    
    this.rateLimitMap.set(windowKey, count + 1);
    
    // Limpar entradas antigas
    for (const [k, v] of this.rateLimitMap.entries()) {
      if (!k.startsWith(key)) continue;
      const timestamp = parseInt(k.split('_')[1]);
      if (now - timestamp * this.rateLimitWindow > this.rateLimitWindow * 2) {
        this.rateLimitMap.delete(k);
      }
    }
    
    return true;
  }

  /**
   * Formata dados do log com contexto enriquecido
   */
  formatLogData(level, message, context = {}) {
    // Obter informações do usuário se disponível
    let userId = null;
    try {
      const authToken = localStorage.getItem('authToken');
      if (authToken) {
        const tokenData = JSON.parse(authToken);
        userId = tokenData.userId || tokenData.id;
      }
    } catch (e) {
      // Ignorar erro ao obter userId
    }

    return {
      timestamp: new Date().toISOString(),
      level,
      message,
      environment: this.isDevelopment ? 'development' : 'production',
      userAgent: navigator.userAgent,
      url: window.location.href,
      userId,
      sessionId: this.getSessionId(),
      ...context
    };
  }

  /**
   * Obtém ou cria session ID
   */
  getSessionId() {
    let sessionId = sessionStorage.getItem('logger_session_id');
    if (!sessionId) {
      sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      sessionStorage.setItem('logger_session_id', sessionId);
    }
    return sessionId;
  }

  /**
   * Log de erro
   */
  error(message, context = {}) {
    const logData = this.formatLogData(LOG_LEVELS.ERROR, message, context);
    
    if (this.isDevelopment) {
      console.error(`[ERROR] ${message}`, context);
    }
    
    // Verificar rate limit
    const rateLimitKey = `error_${message.substring(0, 50)}`;
    if (!this.checkRateLimit(rateLimitKey)) {
      if (this.isDevelopment) {
        console.warn('[LOGGER] Rate limit excedido para:', message);
      }
      return logData;
    }
    
    // Adicionar à fila em produção
    if (!this.isDevelopment) {
      this.addToQueue(logData);
    }
    
    return logData;
  }

  /**
   * Log de aviso
   */
  warn(message, context = {}) {
    const logData = this.formatLogData(LOG_LEVELS.WARN, message, context);
    
    if (this.isDevelopment) {
      console.warn(`[WARN] ${message}`, context);
    }
    
    return logData;
  }

  /**
   * Log de informação
   */
  info(message, context = {}) {
    const logData = this.formatLogData(LOG_LEVELS.INFO, message, context);
    
    if (this.isDevelopment) {
      console.info(`[INFO] ${message}`, context);
    }
    
    return logData;
  }

  /**
   * Log de debug (apenas em desenvolvimento)
   */
  debug(message, context = {}) {
    if (this.isDevelopment) {
      console.debug(`[DEBUG] ${message}`, context);
    }
  }

  /**
   * Adiciona log à fila
   */
  addToQueue(logData) {
    this.logQueue.push(logData);
    
    // Se a fila estiver cheia, fazer flush imediato
    if (this.logQueue.length >= this.maxQueueSize) {
      this.flushLogs();
    }
  }

  /**
   * Inicia flush automático
   */
  startAutoFlush() {
    setInterval(() => {
      if (this.logQueue.length > 0) {
        this.flushLogs();
      }
    }, this.flushInterval);
  }

  /**
   * Envia logs em lote para o servidor
   */
  async flushLogs() {
    if (this.logQueue.length === 0) return;
    
    const logsToSend = [...this.logQueue];
    this.logQueue = [];
    this.lastFlush = Date.now();
    
    try {
      await fetch(`${this.apiUrl}/api/logs/batch`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          logs: logsToSend,
          count: logsToSend.length
        })
      });
    } catch (error) {
      // Falha silenciosa para não criar loop de erros
      if (this.isDevelopment) {
        console.error('Falha ao enviar logs para servidor:', error);
      }
      
      // Recolocar na fila se falhou (máximo 1 tentativa)
      if (logsToSend.length < this.maxQueueSize / 2) {
        this.logQueue.unshift(...logsToSend);
      }
    }
  }

  /**
   * Envia log individual para o servidor (fallback)
   */
  async sendToServer(logData) {
    try {
      await fetch(`${this.apiUrl}/api/logs`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(logData)
      });
    } catch (error) {
      // Falha silenciosa para não criar loop de erros
      if (this.isDevelopment) {
        console.error('Falha ao enviar log para servidor:', error);
      }
    }
  }

  /**
   * Captura erros não tratados
   */
  setupGlobalErrorHandler() {
    window.addEventListener('error', (event) => {
      this.error('Erro não tratado', {
        message: event.message,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        error: event.error?.stack,
        type: 'uncaught_error'
      });
    });

    window.addEventListener('unhandledrejection', (event) => {
      this.error('Promise rejeitada não tratada', {
        reason: event.reason?.message || event.reason,
        stack: event.reason?.stack,
        type: 'unhandled_rejection'
      });
    });

    // Flush logs antes de sair da página
    window.addEventListener('beforeunload', () => {
      if (this.logQueue.length > 0) {
        // Usar sendBeacon para envio garantido
        const blob = new Blob(
          [JSON.stringify({ logs: this.logQueue })],
          { type: 'application/json' }
        );
        navigator.sendBeacon(`${this.apiUrl}/api/logs/batch`, blob);
      }
    });
  }

  /**
   * Limpa recursos
   */
  cleanup() {
    this.flushLogs();
  }
}

const logger = new Logger();

// Configurar handler global em produção
if (!logger.isDevelopment) {
  logger.setupGlobalErrorHandler();
}

// Exportar também a classe para testes
export { Logger, LOG_LEVELS };
export default logger;
