/**
 * Utilitário para chamadas de API
 * Centraliza a lógica de comunicação com o backend
 */

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

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
  const url = `${API_BASE_URL}/${cleanEndpoint}`;
  
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

  console.log('🚀 API Call:', {
    url,
    method: requestOptions.method || 'GET',
    endpoint: cleanEndpoint
  });

  try {
    const response = await fetch(url, requestOptions);
    
    console.log('📡 API Response:', {
      status: response.status,
      statusText: response.statusText,
      ok: response.ok,
      url: response.url
    });

    return response;
  } catch (error) {
    console.error('❌ API Error:', {
      url,
      error: error.message,
      endpoint: cleanEndpoint
    });
    throw error;
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
  } catch (error) {
    console.error('Erro ao testar conexão com Matias:', error);
    return false;
  }
};

export default { apiCall, chatWithMatias, testMatiasConnection };