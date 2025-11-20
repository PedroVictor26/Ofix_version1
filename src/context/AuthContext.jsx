import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import * as authService from '../services/auth.service.js'; // Nossos serviços de autenticação
import { useNavigate } from 'react-router-dom'; // Para redirecionamento programático

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true); // Para verificar o token inicial

  const navigate = useNavigate();

  // Função para carregar o usuário e token do localStorage na inicialização
  const loadUserFromStorage = useCallback(() => {
    setIsLoadingAuth(true);
    try {
      const storedData = authService.getCurrentUser(); // { user, token } ou null
      if (storedData && storedData.token && storedData.user) {
        const isGuest = storedData.user.email?.endsWith('@ofix.temp');
        setUser({ ...storedData.user, isGuest });
        setToken(storedData.token);
        setIsAuthenticated(true);
      } else {
        // Se não há token ou está malformado, garante que o estado esteja limpo
        setUser(null);
        setToken(null);
        setIsAuthenticated(false);
        authService.logout(); // Limpa qualquer resquício no localStorage
      }
    } catch (error) {
      console.error("Erro ao carregar usuário do storage:", error);
      setUser(null);
      setToken(null);
      setIsAuthenticated(false);
      authService.logout();
    } finally {
      setIsLoadingAuth(false);
    }
  }, []);

  useEffect(() => {
    loadUserFromStorage();
  }, [loadUserFromStorage]);

  const login = async (credentials) => {
    setIsLoadingAuth(true);
    try {
      const data = await authService.login(credentials); // authService.login já salva no localStorage
      const isGuest = data.user.email?.endsWith('@ofix.temp');
      setUser({ ...data.user, isGuest });
      setToken(data.token);
      setIsAuthenticated(true);
      navigate('/dashboard'); // Redireciona para o dashboard após login
      return data;
    } catch (error) {
      // Erro já logado pelo authService, aqui podemos apenas garantir estado limpo
      setUser(null);
      setToken(null);
      setIsAuthenticated(false);
      authService.logout(); // Limpa localStorage
      throw error; // Relança para o componente de Login tratar (ex: toast)
    } finally {
      setIsLoadingAuth(false);
    }
  };

  const register = async (userData) => {
    setIsLoadingAuth(true);
    try {
      const data = await authService.register(userData);
      // Após o registro, o usuário normalmente precisa fazer login
      // Pode-se optar por logar automaticamente ou redirecionar para a página de login
      // Aqui, apenas retornamos os dados e o componente de Registro decide o que fazer (ex: mostrar mensagem)
      return data;
    } finally {
      setIsLoadingAuth(false);
    }
  };

  const logout = useCallback(() => {
    authService.logout(); // Limpa o localStorage
    setUser(null);
    setToken(null);
    setIsAuthenticated(false);
    navigate('/login'); // Redireciona para a página de login
  }, [navigate]);

  // Verificar token expirado (exemplo de como o interceptor de API poderia interagir com o AuthContext)
  // Esta função seria chamada pelo interceptor de resposta do apiClient em api.js ao detectar um 401.
  const handleUnauthorized = useCallback(() => {
    console.log("AuthContext: Recebido evento de não autorizado. Fazendo logout.");
    logout();
  }, [logout]);


  // useEffect para adicionar um listener ao evento de logout do interceptor (se implementado via CustomEvent)
  // Ou o interceptor pode chamar diretamente authContext.logout() se tiver acesso a ele.
  // Por simplicidade, o interceptor em api.js já limpa o localStorage e pode redirecionar.
  // Se o redirecionamento for feito aqui, o interceptor em api.js não precisaria redirecionar.
  // Exemplo:
  // useEffect(() => {
  //   const onUnauthorized = () => handleUnauthorized();
  //   window.addEventListener('unauthorized', onUnauthorized);
  //   return () => {
  //     window.removeEventListener('unauthorized', onUnauthorized);
  //   };
  // }, [handleUnauthorized]);


  const value = {
    user,
    token,
    isAuthenticated,
    isLoadingAuth,
    login,
    register,
    logout,
    // handleUnauthorized // Se o interceptor precisar chamar
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
