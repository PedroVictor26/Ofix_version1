import { ChevronRight, Home } from "lucide-react";
import { Link, useLocation } from "react-router-dom";

const Breadcrumbs = () => {
  const location = useLocation();
  
  // Mapeamento de rotas para breadcrumbs
  const routeMap = {
    '/': { name: 'Dashboard', icon: Home },
    '/clientes': { name: 'Gestão de Clientes', parent: '/' },
    '/clientes/novo': { name: 'Novo Cliente', parent: '/clientes' },
    '/veiculos': { name: 'Gestão de Veículos', parent: '/' },
    '/ordens': { name: 'Ordens de Serviço', parent: '/' },
    '/estoque': { name: 'Estoque', parent: '/' },
    '/ai-assistant': { name: 'AI Assistant', parent: '/' },
  };

  // Função para gerar o caminho do breadcrumb
  const generateBreadcrumbs = (pathname) => {
    const breadcrumbs = [];
    let currentPath = pathname;
    
    while (currentPath && routeMap[currentPath]) {
      const route = routeMap[currentPath];
      breadcrumbs.unshift({
        path: currentPath,
        name: route.name,
        icon: route.icon,
      });
      currentPath = route.parent;
    }
    
    return breadcrumbs;
  };

  const breadcrumbs = generateBreadcrumbs(location.pathname);

  // Se só tem um item (Dashboard), não mostra breadcrumb
  if (breadcrumbs.length <= 1) {
    return null;
  }

  return (
    <nav aria-label="Breadcrumb" className="mb-6">
      <ol className="flex items-center space-x-2 text-sm text-gray-500">
        {breadcrumbs.map((breadcrumb, index) => {
          const isLast = index === breadcrumbs.length - 1;
          const IconComponent = breadcrumb.icon;
          
          return (
            <li key={breadcrumb.path} className="flex items-center">
              {index > 0 && (
                <ChevronRight className="w-4 h-4 mx-2 text-gray-400" />
              )}
              
              {isLast ? (
                <span className="flex items-center font-medium text-gray-900">
                  {IconComponent && <IconComponent className="w-4 h-4 mr-2" />}
                  {breadcrumb.name}
                </span>
              ) : (
                <Link
                  to={breadcrumb.path}
                  className="flex items-center hover:text-blue-600 transition-colors duration-200"
                >
                  {IconComponent && <IconComponent className="w-4 h-4 mr-2" />}
                  {breadcrumb.name}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
};

export default Breadcrumbs;