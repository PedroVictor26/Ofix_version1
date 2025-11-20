// src/App.jsx
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { Suspense, lazy } from 'react';

import { AuthProvider } from './context/AuthContext.jsx';
import ProtectedRoute from './components/auth/ProtectedRoute.jsx';
import LoadingSpinner from './components/ui/LoadingSpinner.jsx';
import ErrorBoundary from './components/ErrorBoundary.jsx';

import Layout from './Layout';
import LoginPage from './pages/LoginPage.jsx';
import RegisterPage from './pages/RegisterPage.jsx';
import InvitePage from './pages/InvitePage.jsx';

// Lazy loading das páginas principais
const Dashboard = lazy(() => import('./pages/Dashboard.jsx'));
const Clientes = lazy(() => import('./pages/Clientes.jsx'));
const Estoque = lazy(() => import('./pages/Estoque.jsx'));
const Financeiro = lazy(() => import('./pages/Financeiro.jsx'));
const Configuracoes = lazy(() => import('./pages/Configuracoes.jsx'));
const AIPage = lazy(() => import('./pages/AIPage.jsx'));

export default function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter future={{ v7_relativeSplatPath: true, v7_startTransition: true }}>
        <AuthProvider>
          {/* O Toaster para notificações globais */}
          <Toaster position="top-right" />

          <Routes>
            {/* Rotas Públicas */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/invite" element={<InvitePage />} />

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

              {/* Rotas com Lazy Loading e Suspense */}
              <Route path="dashboard" element={
                <Suspense fallback={<LoadingSpinner />}>
                  <Dashboard />
                </Suspense>
              } />
              <Route path="clientes" element={
                <Suspense fallback={<LoadingSpinner />}>
                  <Clientes />
                </Suspense>
              } />
              <Route path="estoque" element={
                <Suspense fallback={<LoadingSpinner />}>
                  <Estoque />
                </Suspense>
              } />
              <Route path="financeiro" element={
                <Suspense fallback={<LoadingSpinner />}>
                  <Financeiro />
                </Suspense>
              } />
              <Route path="configuracoes" element={
                <Suspense fallback={<LoadingSpinner />}>
                  <Configuracoes />
                </Suspense>
              } />
              <Route path="assistente-ia" element={
                <Suspense fallback={<LoadingSpinner />}>
                  <AIPage />
                </Suspense>
              } />
              {/* Você pode ter uma página específica para procedimentos se quiser */}
              <Route path="configuracoes/procedimentos" element={
                <Suspense fallback={<LoadingSpinner />}>
                  <Configuracoes />
                </Suspense>
              } />

              {/* Rota "Curinga" para caminhos não encontrados DENTRO do layout */}
              <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Route>

            {/* Você poderia ter uma rota 404 geral aqui, se quisesse */}

          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </ErrorBoundary>
  );
}