import { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined || context === null) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState({ nome: 'Usuário Teste' });
  const [token, setToken] = useState('fake-token');
  const [isAuthenticated, setIsAuthenticated] = useState(true);
  const [isLoadingAuth, setIsLoadingAuth] = useState(false);

  const login = async (credentials) => {
    setUser({ nome: 'Usuário Logado' });
    setToken('fake-token');
    setIsAuthenticated(true);
    return { user: { nome: 'Usuário Logado' }, token: 'fake-token' };
  };

  const register = async (userData) => {
    return { message: 'Usuário registrado' };
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    setIsAuthenticated(false);
  };

  const value = {
    user,
    token,
    isAuthenticated,
    isLoadingAuth,
    login,
    register,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};