/**
 * Utilitário para retry com backoff exponencial
 * Implementa retry inteligente para chamadas de API que falham
 */

/**
 * Configuração padrão de retry
 */
const DEFAULT_RETRY_CONFIG = {
  maxRetries: 3,
  baseDelay: 1000,
  maxDelay: 10000,
  backoffFactor: 2,
  retryCondition: (error) => {
    // Retry apenas para erros de rede (5xx) ou timeouts
    return error.status >= 500 || error.name === 'AbortError' || error.code === 'NETWORK_ERROR';
  }
};

/**
 * Função utilitária para sleep
 */
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Calcula delay com backoff exponencial
 */
const calculateDelay = (attempt, baseDelay, backoffFactor, maxDelay) => {
  const delay = baseDelay * Math.pow(backoffFactor, attempt);
  return Math.min(delay, maxDelay);
};

/**
 * Wrapper para fetch com retry e timeout
 */
export const fetchWithRetry = async (url, options = {}, retryConfig = {}) => {
  const config = { ...DEFAULT_RETRY_CONFIG, ...retryConfig };
  const { maxRetries, baseDelay, maxDelay, backoffFactor, retryCondition } = config;
  
  // Timeout padrão de 5 segundos
  const timeout = options.timeout || 5000;
  
  let lastError;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      console.log(`🔄 Tentativa ${attempt + 1}/${maxRetries + 1} para ${url}`);
      
      // Criar AbortController para timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);
      
      // Fazer a requisição
      const response = await fetch(url, {
        ...options,
        signal: controller.signal
      });
      
      // Limpar timeout se sucesso
      clearTimeout(timeoutId);
      
      // Se resposta não for ok, lançar erro
      if (!response.ok) {
        const error = new Error(`HTTP ${response.status}: ${response.statusText}`);
        error.status = response.status;
        error.response = response;
        throw error;
      }
      
      console.log(`✅ Sucesso na tentativa ${attempt + 1} para ${url}`);
      return response;
      
    } catch (error) {
      lastError = error;
      
      // Se é timeout do AbortController
      if (error.name === 'AbortError') {
        console.log(`⏱️ Timeout na tentativa ${attempt + 1} para ${url}`);
        error.code = 'TIMEOUT';
      }
      
      // Se é erro de rede
      if (error instanceof TypeError && error.message === 'Failed to fetch') {
        console.log(`🌐 Erro de rede na tentativa ${attempt + 1} para ${url}`);
        error.code = 'NETWORK_ERROR';
      }
      
      console.log(`❌ Erro na tentativa ${attempt + 1}:`, error.message);
      
      // Verificar se deve fazer retry
      if (attempt === maxRetries || !retryCondition(error)) {
        console.log(`🛑 Não fazendo retry para ${url}. Razão: ${attempt === maxRetries ? 'máximo de tentativas atingido' : 'erro não retryável'}`);
        break;
      }
      
      // Calcular delay e aguardar
      const delay = calculateDelay(attempt, baseDelay, backoffFactor, maxDelay);
      console.log(`⏳ Aguardando ${delay}ms antes da próxima tentativa...`);
      await sleep(delay);
    }
  }
  
  // Se chegou aqui, todas as tentativas falharam
  console.log(`💥 Todas as tentativas falharam para ${url}`);
  throw lastError;
};

/**
 * Wrapper para APIs de IA com retry específico
 */
export const aiApiCall = async (url, data, options = {}) => {
  const aiRetryConfig = {
    maxRetries: 3,
    baseDelay: 1000,
    maxDelay: 8000,
    backoffFactor: 2,
    retryCondition: (error) => {
      // Retry para erros de servidor, timeout ou rate limit
      return error.status >= 500 || 
             error.status === 429 || 
             error.code === 'TIMEOUT' || 
             error.code === 'NETWORK_ERROR';
    }
  };
  
  return fetchWithRetry(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${localStorage.getItem('token')}`,
      ...options.headers
    },
    body: JSON.stringify(data),
    timeout: 10000, // 10 segundos para APIs de IA
    ...options
  }, aiRetryConfig);
};

/**
 * Wrapper para upload de arquivos com retry
 */
export const uploadWithRetry = async (url, formData, options = {}) => {
  const uploadRetryConfig = {
    maxRetries: 2, // Menos retries para uploads
    baseDelay: 2000,
    maxDelay: 10000,
    backoffFactor: 2,
    retryCondition: (error) => {
      // Só retry para erros de servidor ou rede
      return error.status >= 500 || error.code === 'NETWORK_ERROR';
    }
  };
  
  return fetchWithRetry(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('token')}`,
      ...options.headers
    },
    body: formData,
    timeout: 30000, // 30 segundos para uploads
    ...options
  }, uploadRetryConfig);
};

/**
 * Classe para gerenciar circuit breaker
 */
export class CircuitBreaker {
  constructor(options = {}) {
    this.failureThreshold = options.failureThreshold || 5;
    this.resetTimeout = options.resetTimeout || 30000;
    this.state = 'CLOSED'; // CLOSED, OPEN, HALF_OPEN
    this.failureCount = 0;
    this.lastFailureTime = null;
  }
  
  async execute(fn) {
    if (this.state === 'OPEN') {
      if (Date.now() - this.lastFailureTime > this.resetTimeout) {
        this.state = 'HALF_OPEN';
        console.log('🔄 Circuit breaker mudou para HALF_OPEN');
      } else {
        throw new Error('Circuit breaker está OPEN');
      }
    }
    
    try {
      const result = await fn();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }
  
  onSuccess() {
    this.failureCount = 0;
    this.state = 'CLOSED';
    console.log('✅ Circuit breaker mudou para CLOSED');
  }
  
  onFailure() {
    this.failureCount++;
    this.lastFailureTime = Date.now();
    
    if (this.failureCount >= this.failureThreshold) {
      this.state = 'OPEN';
      console.log('🚨 Circuit breaker mudou para OPEN');
    }
  }
}

/**
 * Instância global do circuit breaker para APIs de IA
 */
export const aiCircuitBreaker = new CircuitBreaker({
  failureThreshold: 5,
  resetTimeout: 60000 // 1 minuto
});

/**
 * Função helper para chamadas de IA com circuit breaker
 */
export const callAIWithCircuitBreaker = async (url, data, options = {}) => {
  return aiCircuitBreaker.execute(async () => {
    return aiApiCall(url, data, options);
  });
};
