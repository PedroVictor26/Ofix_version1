// src/App.jsx
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';

import { AuthProvider } from './context/AuthContext.jsx';
import ProtectedRoute from './components/auth/ProtectedRoute.jsx';

import Layout from './Layout';
import Dashboard from './pages/Dashboard.jsx';
import Clientes from './pages/Clientes.jsx';
import Estoque from './pages/Estoque.jsx';
import Financeiro from './pages/Financeiro.jsx';
import Configuracoes from './pages/Configuracoes.jsx';
import AIPage from './pages/AIPage.jsx';
import LoginPage from './pages/LoginPage.jsx';
import RegisterPage from './pages/RegisterPage.jsx';

export default function App() {
  // Debug: Verificar variáveis de ambiente
  const apiUrl = import.meta.env.VITE_API_BASE_URL;
  const mode = import.meta.env.MODE;
  
  // Mostrar informações no título da página para debug
  if (typeof document !== 'undefined') {
    document.title = `OFIX ${mode} - API: ${apiUrl ? 'OK' : 'MISSING'}`;
  }
  
  return (
    <BrowserRouter future={{ v7_relativeSplatPath: true, v7_startTransition: true }}>
      <AuthProvider>
        {/* O Toaster para notificações globais */}
        <Toaster position="top-right" />
        
        <Routes>
          {/* Rotas Públicas */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          {/* Rota "Mãe" Protegida que renderiza o Layout */}
          {/* Todas as rotas dentro dela exigirão autenticação */}
          <Route 
            path="/" 
            element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }
          >
            {/* Rotas "Filhas" - Serão renderizadas no <Outlet> do Layout */}
            
            {/* Redireciona a rota raiz "/" para "/dashboard" */}
            <Route index element={<Navigate to="/dashboard" replace />} />
            
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="clientes" element={<Clientes />} />
            <Route path="estoque" element={<Estoque />} />
            <Route path="financeiro" element={<Financeiro />} />
            <Route path="configuracoes" element={<Configuracoes />} />
            <Route path="assistente-ia" element={<AIPage />} />
            {/* Você pode ter uma página específica para procedimentos se quiser */}
            <Route path="configuracoes/procedimentos" element={<Configuracoes />} /> 
            
            {/* Rota "Curinga" para caminhos não encontrados DENTRO do layout */}
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Route>

          {/* Você poderia ter uma rota 404 geral aqui, se quisesse */}

        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}