import apiClient from './api';

const AUTH_TOKEN_KEY = 'authToken'; // Mesma chave usada em api.js

export const login = async (credentials) => {
  try {
    const response = await apiClient.post('/auth/login', credentials);
    if (response.data && response.data.token && response.data.user) {
      // Armazena o token e os dados do usuário no localStorage
      // Em um app maior, você pode querer armazenar apenas o token e buscar os dados do usuário separadamente,
      // ou usar um estado global (Context API, Redux, Zustand) gerenciado pelo AuthContext.
      localStorage.setItem(AUTH_TOKEN_KEY, JSON.stringify({
        token: response.data.token,
        user: response.data.user
      }));
    }
    return response.data; // Retorna { user, token }
  } catch (error) {
    // O interceptor de resposta em api.js já pode ter lidado com alguns erros (ex: log).
    // Aqui, relançamos o erro para que o componente que chamou possa tratá-lo (ex: exibir toast).
    console.error("Erro no serviço de login:", error.response?.data?.error || error.message);
    throw error.response?.data || { message: error.message || "Erro desconhecido no login." };
  }
};

export const register = async (userData) => {
  try {
    const response = await apiClient.post('/auth/register', userData);
    // O backend retorna o usuário criado, mas não o token. O usuário precisa logar após o registro.
    return response.data; // Retorna { message, user }
  } catch (error) {
    console.error("Erro no serviço de registro:", error.response?.data?.error || error.message);
    throw error.response?.data || { message: error.message || "Erro desconhecido no registro." };
  }
};

export const logout = () => {
  // Remove o token do localStorage
  localStorage.removeItem(AUTH_TOKEN_KEY);
  // Adicionalmente, se houver um estado global de autenticação, ele deve ser resetado.
  // O AuthContext cuidará disso.
  // Não há chamada de API para logout no backend JWT stateless, a menos que haja uma blacklist de tokens.
};

export const getCurrentUser = () => {
  // Obtém os dados do usuário e token do localStorage
  const tokenDataString = localStorage.getItem(AUTH_TOKEN_KEY);
  if (tokenDataString) {
    try {
      return JSON.parse(tokenDataString); // Retorna { user, token }
    } catch (e) {
      console.error("Erro ao parsear dados do usuário do localStorage", e);
      localStorage.removeItem(AUTH_TOKEN_KEY); // Limpa dados corrompidos
      return null;
    }
  }
  return null;
};

export const isAuthenticated = () => {
  const currentUser = getCurrentUser();
  // Poderia adicionar uma verificação de expiração do token aqui se o token JWT não fosse opaco
  // ou se o backend fornecesse um endpoint /auth/validate-token.
  // Por simplicidade, consideramos autenticado se o token existir.
  // O interceptor de resposta (401) e as chamadas à API protegidas validarão o token no backend.
  return !!currentUser?.token;
};

// Função para buscar o perfil do usuário (exemplo de chamada protegida)
export const getProfile = async () => {
  try {
    const response = await apiClient.get('/auth/profile');
    return response.data;
  } catch (error) {
    console.error("Erro ao buscar perfil:", error.response?.data?.error || error.message);
    throw error.response?.data || { message: error.message || "Erro ao buscar perfil." };
  }
};

export const getInviteLink = async () => {
  try {
    const response = await apiClient.post('/auth/invite-link');
    const inviteUrl = `${window.location.origin}/invite?token=${response.data.token}`;
    return inviteUrl;
  } catch (error) {
    console.error("Erro ao gerar link de convite:", error.response?.data?.error || error.message);
    throw error.response?.data || { message: error.message || "Erro ao gerar convite." };
  }
};

export const loginWithInvite = async (token) => {
  try {
    const response = await apiClient.post('/auth/guest-login', { token });
    if (response.data && response.data.token && response.data.user) {
      localStorage.setItem(AUTH_TOKEN_KEY, JSON.stringify({
        token: response.data.token,
        user: response.data.user
      }));
    }
    return response.data;
  } catch (error) {
    console.error("Erro no login de convidado:", error.response?.data?.error || error.message);
    throw error.response?.data || { message: error.message || "Erro ao entrar com convite." };
  }
};
