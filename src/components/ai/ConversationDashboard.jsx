import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Input } from '../ui/input';
import {
  MessageSquare,
  Users,
  Clock,
  TrendingUp,
  Download,
  RefreshCw
} from 'lucide-react';

/**
 * Dashboard de Conversas do Assistente Virtual
 * Visualiza métricas, histórico e análises das interações
 */
const ConversationDashboard = ({ className = '' }) => {
  const [metrics, setMetrics] = useState(null);
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterPeriod, setFilterPeriod] = useState('7d');
  const [filterUserType, setFilterUserType] = useState('all');

  // Carregar métricas do backend
  useEffect(() => {
    loadMetrics();
    loadConversations();
  }, [filterPeriod, filterUserType]);

  const loadMetrics = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/ai/analytics/metrics', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setMetrics(data);
      }
    } catch (error) {
      // console.error('Erro ao carregar métricas:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadConversations = async () => {
    try {
      const response = await fetch('/api/ai/conversations', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setConversations(data);
      }
    } catch (error) {
      // console.error('Erro ao carregar conversas:', error);
    }
  };

  // Dados mockados para demonstração
  const mockStats = {
    conversasSemana: 203,
    resolucaoMedia: 87,
    usuariosAtivos: 89,
    tempoMedio: '2.4min'
  };

  const filteredConversations = conversations.filter(conv =>
    conv.id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    conv.userId?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const exportData = () => {
    const dataStr = JSON.stringify(filteredConversations, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `conversas-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Dashboard do Assistente</h2>
          <p className="text-gray-600">Análise de conversas e métricas de performance</p>
        </div>
        
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => window.location.reload()}
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>
          <Button variant="outline" size="sm" onClick={exportData}>
            <Download className="h-4 w-4 mr-2" />
            Exportar
          </Button>
        </div>
      </div>

      {/* Métricas Principais */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <MessageSquare className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total de Conversas</p>
                <p className="text-2xl font-bold text-gray-900">
                  {metrics?.totalConversations || 156}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Users className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Usuários Ativos</p>
                <p className="text-2xl font-bold text-gray-900">89</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Clock className="h-8 w-8 text-orange-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Tempo Médio</p>
                <p className="text-2xl font-bold text-gray-900">2.4min</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <TrendingUp className="h-8 w-8 text-purple-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Taxa de Sucesso</p>
                <p className="text-2xl font-bold text-gray-900">87%</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Filtros e Pesquisa</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 flex-wrap">
            <div className="flex-1 min-w-64">
              <Input
                placeholder="Pesquisar conversas..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full"
              />
            </div>
            
            <select
              value={filterPeriod}
              onChange={(e) => setFilterPeriod(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md"
            >
              <option value="1d">Últimas 24h</option>
              <option value="7d">Últimos 7 dias</option>
              <option value="30d">Últimos 30 dias</option>
              <option value="90d">Últimos 90 dias</option>
            </select>

            <select
              value={filterUserType}
              onChange={(e) => setFilterUserType(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md"
            >
              <option value="all">Todos os tipos</option>
              <option value="cliente">Clientes</option>
              <option value="mecanico">Mecânicos</option>
              <option value="admin">Gestores</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Gráficos Simplificados */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Estatísticas da Semana</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between">
                <span>Total de Conversas:</span>
                <span className="font-bold">{mockStats.conversasSemana}</span>
              </div>
              <div className="flex justify-between">
                <span>Taxa de Resolução:</span>
                <span className="font-bold text-green-600">{mockStats.resolucaoMedia}%</span>
              </div>
              <div className="flex justify-between">
                <span>Usuários Únicos:</span>
                <span className="font-bold">{mockStats.usuariosAtivos}</span>
              </div>
              <div className="flex justify-between">
                <span>Tempo Médio:</span>
                <span className="font-bold">{mockStats.tempoMedio}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Distribuição por Tipo</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="w-4 h-4 bg-blue-500 rounded mr-2"></div>
                  <span>Clientes</span>
                </div>
                <span className="font-bold">65%</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="w-4 h-4 bg-green-500 rounded mr-2"></div>
                  <span>Mecânicos</span>
                </div>
                <span className="font-bold">25%</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="w-4 h-4 bg-yellow-500 rounded mr-2"></div>
                  <span>Gestores</span>
                </div>
                <span className="font-bold">10%</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Lista de Conversas */}
      <Card>
        <CardHeader>
          <CardTitle>Conversas Recentes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredConversations.length > 0 ? (
              filteredConversations.slice(0, 10).map((conv, index) => (
                <div key={conv.id || index} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                  <div className="flex items-center space-x-4">
                    <div className="w-2 h-2 bg-green-500 rounded-full" />
                    <div>
                      <p className="font-medium text-gray-900">
                        Conversa #{conv.id || `demo-${index + 1}`}
                      </p>
                      <p className="text-sm text-gray-600">
                        {conv.messageCount || (3 + index)} mensagens
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Badge variant="outline">
                      {conv.userType || 'cliente'}
                    </Badge>
                    <span className="text-sm text-gray-500">
                      {conv.createdAt ? new Date(conv.createdAt).toLocaleDateString() : 'Hoje'}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8">
                <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Nenhuma conversa encontrada
                </h3>
                <p className="text-gray-600">
                  {searchTerm ? 'Tente ajustar os filtros de pesquisa.' : 'As conversas aparecerão aqui conforme os usuários interagirem com o assistente.'}
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ConversationDashboard;
