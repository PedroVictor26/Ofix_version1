import { useState, useEffect } from 'react';
import { 
  Activity, 
  Clock, 
  TrendingUp, 
  AlertCircle,
  RefreshCw,
  Brain,
  MessageSquare
} from 'lucide-react';

/**
 * Dashboard de Telemetria de IA (Versão Simplificada)
 * Visualiza métricas básicas de performance do sistema de IA
 */
const TelemetriaDashboard = () => {
  const [dadosIA, setDadosIA] = useState(null);
  const [dadosAutomacao, setDadosAutomacao] = useState(null);
  const [alertas, setAlertas] = useState([]);
  const [periodo, setPeriodo] = useState('7d');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    carregarDados();
  }, [periodo]);

  const carregarDados = async () => {
    setLoading(true);
    
    try {
      const [iaResponse, automacaoResponse, alertasResponse] = await Promise.all([
        fetch(`/api/telemetria/ia/dashboard?periodo=${periodo}`, {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        }),
        fetch(`/api/telemetria/automacao/dashboard?periodo=${periodo}`, {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        }),
        fetch('/api/telemetria/alertas', {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        })
      ]);

      const [iaData, automacaoData, alertasData] = await Promise.all([
        iaResponse.json(),
        automacaoResponse.json(),
        alertasResponse.json()
      ]);

      if (iaData.success) setDadosIA(iaData.data);
      if (automacaoData.success) setDadosAutomacao(automacaoData.data);
      if (alertasData.success) setAlertas(alertasData.data);

    } catch (error) {
      console.error('Erro ao carregar dados de telemetria:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <RefreshCw className="h-8 w-8 animate-spin" />
        <span className="ml-2">Carregando telemetria...</span>
      </div>
    );
  }

  const totalOperacoes = dadosIA?.estatisticas?.reduce((sum, e) => sum + parseInt(e.total_operacoes || 0), 0) || 0;
  const taxaSuccessoMedia = dadosIA?.estatisticas?.length > 0 
    ? (dadosIA.estatisticas.reduce((sum, e) => sum + parseFloat(e.taxa_sucesso_pct || 0), 0) / dadosIA.estatisticas.length).toFixed(1)
    : 0;
  const tempoMedio = dadosIA?.estatisticas?.length > 0
    ? (dadosIA.estatisticas.reduce((sum, e) => sum + parseFloat(e.tempo_medio_ms || 0), 0) / dadosIA.estatisticas.length / 1000).toFixed(1)
    : 0;
  const totalTokens = dadosIA?.estatisticas?.reduce((sum, e) => sum + parseInt(e.total_tokens || 0), 0) || 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Telemetria de IA</h2>
        <div className="flex space-x-2">
          <select 
            value={periodo}
            onChange={(e) => setPeriodo(e.target.value)}
            className="px-3 py-2 border rounded-md"
          >
            <option value="1d">Último dia</option>
            <option value="7d">Últimos 7 dias</option>
            <option value="30d">Últimos 30 dias</option>
            <option value="90d">Últimos 90 dias</option>
          </select>
          <button 
            onClick={carregarDados}
            className="px-3 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 flex items-center"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Atualizar
          </button>
        </div>
      </div>

      {/* Alertas de Sistema */}
      {alertas.length > 0 && (
        <div className="border border-orange-200 bg-orange-50 p-4 rounded-lg">
          <h3 className="flex items-center text-orange-800 font-semibold mb-3">
            <AlertCircle className="h-5 w-5 mr-2" />
            Alertas de Sistema ({alertas.length})
          </h3>
          <div className="space-y-2">
            {alertas.slice(0, 3).map((alerta, index) => (
              <div key={index} className="p-2 bg-white rounded border-l-4 border-orange-400">
                <p className="text-sm font-medium text-orange-900">{alerta.mensagem}</p>
              </div>
            ))}
            {alertas.length > 3 && (
              <p className="text-sm text-orange-700">
                E mais {alertas.length - 3} alertas...
              </p>
            )}
          </div>
        </div>
      )}

      {/* Métricas Gerais de IA */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Operações</p>
              <p className="text-2xl font-bold">{totalOperacoes}</p>
            </div>
            <Brain className="h-8 w-8 text-blue-600" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Taxa de Sucesso</p>
              <p className="text-2xl font-bold text-green-600">{taxaSuccessoMedia}%</p>
            </div>
            <TrendingUp className="h-8 w-8 text-green-600" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Tempo Médio</p>
              <p className="text-2xl font-bold text-orange-600">{tempoMedio}s</p>
            </div>
            <Clock className="h-8 w-8 text-orange-600" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Tokens Usados</p>
              <p className="text-2xl font-bold text-purple-600">{totalTokens.toLocaleString()}</p>
            </div>
            <Activity className="h-8 w-8 text-purple-600" />
          </div>
        </div>
      </div>

      {/* Estatísticas de Automação */}
      {dadosAutomacao?.estatisticas && dadosAutomacao.estatisticas.length > 0 && (
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="flex items-center font-semibold text-lg mb-4">
            <MessageSquare className="h-5 w-5 mr-2" />
            Automações WhatsApp
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {dadosAutomacao.estatisticas.map((item, index) => (
              <div key={index} className="p-4 border rounded-lg">
                <h4 className="font-medium text-gray-900">{item.status_novo}</h4>
                <p className="text-2xl font-bold text-blue-600">{item.total_automacoes}</p>
                <p className="text-sm text-gray-500">{parseFloat(item.taxa_sucesso_pct).toFixed(1)}% sucesso</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Detalhes por Operação */}
      {dadosIA?.estatisticas && dadosIA.estatisticas.length > 0 && (
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="font-semibold text-lg mb-4">Detalhes por Operação</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Operação
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Provedor
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Sucesso
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tempo Médio
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tokens
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {dadosIA.estatisticas.map((item, index) => (
                  <tr key={index}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {item.operacao}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <span className="px-2 py-1 text-xs font-semibold bg-gray-100 text-gray-800 rounded-full">
                        {item.tipo_ia}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {item.total_operacoes}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                        parseFloat(item.taxa_sucesso_pct) > 90 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-orange-100 text-orange-800'
                      }`}>
                        {parseFloat(item.taxa_sucesso_pct).toFixed(1)}%
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {(parseFloat(item.tempo_medio_ms) / 1000).toFixed(1)}s
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {parseInt(item.total_tokens || 0).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Sem dados */}
      {(!dadosIA?.estatisticas || dadosIA.estatisticas.length === 0) && (
        <div className="bg-white p-8 rounded-lg shadow text-center">
          <Brain className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhum dado disponível</h3>
          <p className="text-gray-500">
            Não há dados de telemetria para o período selecionado.
          </p>
        </div>
      )}
    </div>
  );
};

export default TelemetriaDashboard;
