import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx'; // Ajuste o caminho se necessário

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, isLoadingAuth } = useAuth();
  const location = useLocation();

  if (isLoadingAuth) {
    // Idealmente, mostrar um spinner/loader de tela inteira aqui
    // Para simplificar, pode ser apenas null ou uma mensagem simples
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p>Verificando autenticação...</p>
        {/* Adicionar um spinner aqui seria bom */}
      </div>
    );
  }

  if (!isAuthenticated) {
    // Redireciona para a página de login, guardando a localização original
    // para que o usuário possa ser redirecionado de volta após o login.
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Se autenticado, renderiza o conteúdo da rota protegida (Outlet) ou os children diretos
  return children ? children : <Outlet />;
};

export default ProtectedRoute;
