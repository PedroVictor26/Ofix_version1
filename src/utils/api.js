/**
 * Utilitário para chamadas de API
 * Centraliza a lógica de comunicação com o backend
 */

// Configuração da URL base da API com fallbacks robustos
export const getApiBaseUrl = () => {
  // Debug: Log das variáveis disponíveis
  console.log('🔍 API Utils - Detectando ambiente:', {
    hasViteEnv: !!import.meta.env,
    hostname: window.location.hostname,
    viteApiUrl: import.meta.env?.VITE_API_BASE_URL
  });
  
  // Primeiro, tenta usar a variável de ambiente
  if (import.meta.env?.VITE_API_BASE_URL) {
    console.log('✅ Usando variável de ambiente:', import.meta.env.VITE_API_BASE_URL);
    return import.meta.env.VITE_API_BASE_URL;
  }
  
  // Em produção no Vercel, usar o backend no Render
  if (window.location.hostname === 'ofix.vercel.app') {
    console.log('✅ Detectado Vercel, usando URL direta');
    return 'https://ofix-backend-prod.onrender.com';
  }
  
  // Em desenvolvimento, usar proxy local
  if (window.location.hostname === 'localhost') {
    console.log('✅ Detectado localhost, usando proxy');
    return ''; // Usar proxy do Vite
  }
  
  // Fallback padrão
  console.log('⚠️ Usando fallback padrão');
  return 'https://ofix-backend-prod.onrender.com';
};

const API_BASE_URL = getApiBaseUrl();

/**
 * Faz uma chamada para a API do backend
 * @param {string} endpoint - Endpoint da API (ex: '/agno/chat-matias')
 * @param {object} options - Opções da requisição (method, body, headers, etc.)
 * @returns {Promise<Response>} - Promise com a resposta da API
 */
export const apiCall = async (endpoint, options = {}) => {
  // Remove barra inicial se presente
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint;
  
  // Monta a URL completa
  let url;
  if (API_BASE_URL) {
    url = `${API_BASE_URL}/api/${cleanEndpoint}`;
  } else {
    // Fallback para proxy local em desenvolvimento
    url = `/api/${cleanEndpoint}`;
  }
  
  // Configurações padrão
  const defaultOptions = {
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'User-Agent': 'OFIX-Frontend/1.0'
    }
  };

  // Merge das opções
  const requestOptions = {
    ...defaultOptions,
    ...options,
    headers: {
      ...defaultOptions.headers,
      ...options.headers
    }
  };

  try {
    const response = await fetch(url, requestOptions);
    return response;
  } catch (error) {
    throw new Error(`API Error: ${error.message} (URL: ${url})`);
  }
};

/**
 * Chamada específica para o chat com Matias
 * @param {string} message - Mensagem do usuário
 * @param {string} user_id - ID do usuário
 * @returns {Promise<object>} - Resposta do agente
 */
export const chatWithMatias = async (message, user_id) => {
  const response = await apiCall('agno/chat-matias', {
    method: 'POST',
    body: JSON.stringify({
      message,
      user_id
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Erro HTTP ${response.status}: ${errorText}`);
  }

  const data = await response.json();
  
  if (!data.success) {
    throw new Error(data.error || 'Erro na resposta do agente');
  }

  return data;
};

/**
 * Testa a conexão com o Matias Agent
 * @param {string} user_id - ID do usuário para teste
 * @returns {Promise<boolean>} - true se conectado, false caso contrário
 */
export const testMatiasConnection = async (user_id = 'connection_test') => {
  try {
    const data = await chatWithMatias('teste de conexão', user_id);
    return data.success === true;
  } catch {
    // Erro ao testar conexão com Matias - silencioso para produção
    return false;
  }
};

export default { apiCall, chatWithMatias, testMatiasConnection, getApiBaseUrl };