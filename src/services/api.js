// src/services/api.js

import axios from "axios";

// CORREÇÃO: Configuração simplificada e mais robusta
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://ofix-backend-prod.onrender.com';

const apiClient = axios.create({
  baseURL: `${API_BASE_URL}/api`,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 10000, // 10 segundos de timeout
});

// Interceptor de Requisição: Adiciona o token JWT a cada requisição
apiClient.interceptors.request.use(
  (config) => {
    const tokenDataString = localStorage.getItem("authToken"); // Pega a string JSON

    if (tokenDataString) {
      try {
        const tokenData = JSON.parse(tokenDataString);
        if (tokenData && tokenData.token) {
          // Se o token existir dentro do objeto, adiciona no cabeçalho de autorização
          config.headers.Authorization = `Bearer ${tokenData.token}`;
        }
      } catch (e) {
        console.error(
          "Erro ao parsear token do localStorage no interceptor:",
          e
        );
        // Opcional: Limpar localStorage se o token estiver corrompido
        localStorage.removeItem("authToken");
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor de Resposta (Tratamento de Erros)
apiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response) {
      const { status } = error.response;
      if (status === 401) {
        console.warn(
          "Erro 401: Não autorizado. Limpando token e redirecionando para login."
        );
        localStorage.removeItem("authToken");
        // Redireciona para a página de login para forçar um novo login
        window.location.href = "/login";
      }
    } else if (error.request) {
      console.error("Erro de rede ou servidor não respondeu:", error.message);
    } else {
      console.error("Erro ao configurar requisição:", error.message);
    }
    return Promise.reject(error);
  }
);

export default apiClient;
