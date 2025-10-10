import { Loader2 } from "lucide-react";

/**
 * Componente de loading avançado com diferentes tipos e mensagens
 */
const LoadingSpinner = ({ 
  type = "default", 
  message = "Carregando...", 
  size = "default",
  className = "" 
}) => {
  const sizeClasses = {
    small: "w-4 h-4",
    default: "w-8 h-8",
    large: "w-12 h-12"
  };

  const typeStyles = {
    default: "text-blue-600",
    success: "text-green-600",
    warning: "text-yellow-600",
    danger: "text-red-600"
  };

  return (
    <div className={`flex items-center justify-center space-x-2 ${className}`}>
      <Loader2 
        className={`${sizeClasses[size]} ${typeStyles[type]} animate-spin`} 
      />
      <span className={`text-sm font-medium ${typeStyles[type]}`}>
        {message}
      </span>
    </div>
  );
};

/**
 * Componente de loading para páginas inteiras
 */
export const PageLoading = ({ message = "Carregando dados..." }) => (
  <div className="flex items-center justify-center min-h-[60vh]">
    <div className="text-center space-y-4">
      <LoadingSpinner size="large" message={message} />
      <p className="text-gray-500 text-sm">
        Por favor, aguarde um momento.
      </p>
    </div>
  </div>
);

/**
 * Componente de loading para cards/seções
 */
export const SectionLoading = ({ message = "Carregando..." }) => (
  <div className="flex items-center justify-center p-8">
    <LoadingSpinner message={message} />
  </div>
);

/**
 * Componente de loading inline (para botões, etc.)
 */
export const InlineLoading = ({ message = "Processando..." }) => (
  <LoadingSpinner size="small" message={message} />
);

/**
 * Estados de loading específicos para diferentes operações
 */
export const LoadingStates = {
  saving: (message = "Salvando...") => (
    <LoadingSpinner type="success" size="small" message={message} />
  ),
  deleting: (message = "Excluindo...") => (
    <LoadingSpinner type="danger" size="small" message={message} />
  ),
  searching: (message = "Buscando...") => (
    <LoadingSpinner type="default" size="small" message={message} />
  ),
  updating: (message = "Atualizando...") => (
    <LoadingSpinner type="warning" size="small" message={message} />
  ),
};

export default LoadingSpinner;