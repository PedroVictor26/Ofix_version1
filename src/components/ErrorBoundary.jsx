import React from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import { StandardButton, StandardCard } from '@/components/ui';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    // Atualiza o state para mostrar a UI de erro
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // Log do erro para monitoramento
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    
    this.setState({
      error: error,
      errorInfo: errorInfo
    });

    // Aqui você poderia enviar o erro para um serviço de monitoramento
    // como Sentry, LogRocket, etc.
  }

  handleReload = () => {
    window.location.reload();
  };

  handleGoHome = () => {
    window.location.href = '/dashboard';
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
          <StandardCard variant="bordered" className="max-w-md w-full">
            <StandardCard.Header>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-red-100 rounded-full">
                  <AlertTriangle className="w-6 h-6 text-red-600" />
                </div>
                <div>
                  <h1 className="text-lg font-semibold text-gray-900">
                    Oops! Algo deu errado
                  </h1>
                  <p className="text-sm text-gray-600">
                    Ocorreu um erro inesperado na aplicação
                  </p>
                </div>
              </div>
            </StandardCard.Header>

            <StandardCard.Content>
              <div className="space-y-4">
                <p className="text-sm text-gray-700">
                  Não se preocupe, nossa equipe já foi notificada. Você pode tentar:
                </p>
                
                <div className="bg-gray-100 rounded-lg p-3">
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>• Recarregar a página</li>
                    <li>• Voltar para o início</li>
                    <li>• Tentar novamente em alguns minutos</li>
                  </ul>
                </div>

                {/* Mostrar detalhes do erro apenas em desenvolvimento */}
                {process.env.NODE_ENV === 'development' && this.state.error && (
                  <details className="text-xs bg-red-50 p-3 rounded border">
                    <summary className="cursor-pointer font-medium text-red-800">
                      Detalhes do erro (desenvolvimento)
                    </summary>
                    <div className="mt-2 text-red-700">
                      <strong>Erro:</strong> {this.state.error.toString()}
                    </div>
                    {this.state.errorInfo && (
                      <div className="mt-1 text-red-600">
                        <strong>Stack:</strong>
                        <pre className="whitespace-pre-wrap text-xs mt-1">
                          {this.state.errorInfo.componentStack}
                        </pre>
                      </div>
                    )}
                  </details>
                )}
              </div>
            </StandardCard.Content>

            <StandardCard.Footer>
              <div className="flex gap-3">
                <StandardButton 
                  variant="secondary" 
                  onClick={this.handleGoHome}
                  icon={Home}
                  className="flex-1"
                >
                  Voltar ao Início
                </StandardButton>
                <StandardButton 
                  variant="primary" 
                  onClick={this.handleReload}
                  icon={RefreshCw}
                  className="flex-1"
                >
                  Recarregar
                </StandardButton>
              </div>
            </StandardCard.Footer>
          </StandardCard>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;