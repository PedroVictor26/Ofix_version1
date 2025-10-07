import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { 
  Zap, 
  MessageSquare, 
  Wrench, 
  Calendar, 
  DollarSign,
  FileText,
  User,
  Car,
  Settings,
  TrendingUp,
  Clock,
  Search
} from 'lucide-react';

const QuickSuggestions = ({ 
  userType = 'cliente', 
  context = {}, 
  onSuggestionClick,
  className = "" 
}) => {
  const [suggestions, setSuggestions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    loadSuggestions();
  }, [userType, context]);

  const loadSuggestions = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/ai/suggestions?context=${encodeURIComponent(JSON.stringify({ userType, ...context }))}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setSuggestions(data);
      }
    } catch (error) {
      console.error('Erro ao carregar sugestões:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSuggestionClick = async (suggestion) => {
    if (onSuggestionClick) {
      onSuggestionClick(suggestion);
    }

    // Executar ação rápida se aplicável
    if (suggestion.action) {
      try {
        await fetch('/api/ai/quick-action', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          body: JSON.stringify({
            action: suggestion.action,
            context: { userType, ...context },
            data: suggestion.data
          })
        });
      } catch (error) {
        console.error('Erro ao executar ação rápida:', error);
      }
    }
  };

  const getSuggestionIcon = (category) => {
    switch (category) {
      case 'diagnostic': return <Wrench className="h-4 w-4" />;
      case 'maintenance': return <Settings className="h-4 w-4" />;
      case 'scheduling': return <Calendar className="h-4 w-4" />;
      case 'financial': return <DollarSign className="h-4 w-4" />;
      case 'documentation': return <FileText className="h-4 w-4" />;
      case 'customer': return <User className="h-4 w-4" />;
      case 'vehicle': return <Car className="h-4 w-4" />;
      case 'analytics': return <TrendingUp className="h-4 w-4" />;
      case 'search': return <Search className="h-4 w-4" />;
      default: return <MessageSquare className="h-4 w-4" />;
    }
  };

  const getSuggestionColor = (category) => {
    switch (category) {
      case 'diagnostic': return 'bg-blue-500 hover:bg-blue-600';
      case 'maintenance': return 'bg-green-500 hover:bg-green-600';
      case 'scheduling': return 'bg-purple-500 hover:bg-purple-600';
      case 'financial': return 'bg-yellow-500 hover:bg-yellow-600';
      case 'documentation': return 'bg-gray-500 hover:bg-gray-600';
      case 'customer': return 'bg-pink-500 hover:bg-pink-600';
      case 'vehicle': return 'bg-indigo-500 hover:bg-indigo-600';
      case 'analytics': return 'bg-teal-500 hover:bg-teal-600';
      default: return 'bg-blue-500 hover:bg-blue-600';
    }
  };

  // Sugestões predefinidas baseadas no tipo de usuário
  const getDefaultSuggestions = () => {
    if (userType === 'cliente') {
      return [
        {
          id: 'check-status',
          title: 'Verificar Status do Serviço',
          description: 'Consulte o andamento do seu veículo',
          category: 'customer',
          action: 'check_service_status'
        },
        {
          id: 'schedule-maintenance',
          title: 'Agendar Manutenção',
          description: 'Agende uma revisão preventiva',
          category: 'scheduling',
          action: 'schedule_maintenance'
        },
        {
          id: 'diagnostic-help',
          title: 'Ajuda com Problemas',
          description: 'Descreva o problema do seu veículo',
          category: 'diagnostic',
          action: 'start_diagnostic'
        },
        {
          id: 'estimate-cost',
          title: 'Solicitar Orçamento',
          description: 'Obtenha uma estimativa de custo',
          category: 'financial',
          action: 'request_estimate'
        }
      ];
    } else if (userType === 'mecanico') {
      return [
        {
          id: 'quick-diagnostic',
          title: 'Diagnóstico Rápido',
          description: 'Iniciar análise de sintomas',
          category: 'diagnostic',
          action: 'quick_diagnostic'
        },
        {
          id: 'parts-lookup',
          title: 'Consultar Peças',
          description: 'Buscar peças no estoque',
          category: 'search',
          action: 'parts_lookup'
        },
        {
          id: 'procedures',
          title: 'Procedimentos Técnicos',
          description: 'Acessar guias de reparo',
          category: 'documentation',
          action: 'technical_procedures'
        },
        {
          id: 'customer-update',
          title: 'Atualizar Cliente',
          description: 'Enviar status do serviço',
          category: 'customer',
          action: 'customer_update'
        }
      ];
    } else {
      return [
        {
          id: 'general-help',
          title: 'Como posso ajudar?',
          description: 'Pergunte sobre qualquer assunto',
          category: 'general',
          action: 'general_help'
        },
        {
          id: 'system-status',
          title: 'Status do Sistema',
          description: 'Verificar funcionamento',
          category: 'analytics',
          action: 'system_status'
        }
      ];
    }
  };

  const displaySuggestions = suggestions.length > 0 ? suggestions : getDefaultSuggestions();

  if (isLoading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            Sugestões Rápidas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Zap className="h-5 w-5" />
          Sugestões Rápidas
          {userType && (
            <Badge variant="secondary" className="capitalize">
              {userType}
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {displaySuggestions.map((suggestion) => (
            <Button
              key={suggestion.id}
              variant="outline"
              className={`h-auto p-4 flex flex-col items-start gap-2 hover:scale-105 transition-transform ${getSuggestionColor(suggestion.category)} text-white border-0`}
              onClick={() => handleSuggestionClick(suggestion)}
            >
              <div className="flex items-center gap-2 w-full">
                {getSuggestionIcon(suggestion.category)}
                <span className="font-medium text-sm">{suggestion.title}</span>
              </div>
              {suggestion.description && (
                <span className="text-xs opacity-90 text-left">
                  {suggestion.description}
                </span>
              )}
            </Button>
          ))}
        </div>

        {/* Botão para mais sugestões */}
        <div className="mt-4 pt-4 border-t">
          <Button 
            variant="ghost" 
            className="w-full"
            onClick={loadSuggestions}
          >
            <Search className="h-4 w-4 mr-2" />
            Buscar Mais Sugestões
          </Button>
        </div>

        {/* Contexto atual */}
        {Object.keys(context).length > 0 && (
          <div className="mt-4 p-3 bg-gray-50 rounded-lg">
            <p className="text-xs text-gray-600 mb-2">Contexto atual:</p>
            <div className="flex flex-wrap gap-1">
              {context.currentVehicle && (
                <Badge variant="outline" className="text-xs">
                  <Car className="h-3 w-3 mr-1" />
                  {context.currentVehicle.brand} {context.currentVehicle.model}
                </Badge>
              )}
              {context.activeService && (
                <Badge variant="outline" className="text-xs">
                  <Wrench className="h-3 w-3 mr-1" />
                  OS #{context.activeService}
                </Badge>
              )}
              {context.lastAction && (
                <Badge variant="outline" className="text-xs">
                  <Clock className="h-3 w-3 mr-1" />
                  {context.lastAction}
                </Badge>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default QuickSuggestions;
