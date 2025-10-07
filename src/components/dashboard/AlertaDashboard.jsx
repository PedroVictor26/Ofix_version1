import { useState, useEffect } from 'react';
import { 
  AlertTriangle, 
  Clock, 
  CheckCircle, 
  RefreshCw, 
  TrendingUp,
  Users,
  XCircle
} from 'lucide-react';

/**
 * Dashboard de Alertas Automatizados - Versão Simplificada
 * Visualiza alertas gerados pelo sistema de IA e automação
 */
const AlertaDashboard = () => {
  const [alertas, setAlertas] = useState([]);
  const [resumo, setResumo] = useState({});
  const [loading, setLoading] = useState(true);
  const [atualizando, setAtualizando] = useState(false);

  // Dados mock para demonstração
  const alertasMock = [
    {
      id: 1,
      tipo: 'servico_atrasado',
      severidade: 'alta',
      titulo: 'Serviço com prazo vencido',
      descricao: 'OS #1234 está 2 dias em atraso. Cliente: João Silva',
      numero_os: '1234',
      sugestao: 'Entrar em contato com o cliente para reagendar',
      acao_sugerida: 'enviar_whatsapp',
      created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)
    },
    {
      id: 2,
      tipo: 'aprovacao_pendente',
      severidade: 'media',
      titulo: 'Orçamento aguardando aprovação',
      descricao: 'Orçamento de R$ 850,00 pendente há 3 dias',
      numero_os: '1235',
      sugestao: 'Enviar lembrete sobre o orçamento',
      created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000)
    },
    {
      id: 3,
      tipo: 'comunicacao_cliente',
      severidade: 'baixa',
      titulo: 'Cliente sem comunicação',
      descricao: 'Última comunicação há 5 dias',
      sugestao: 'Enviar atualização sobre o status do serviço',
      created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000)
    }
  ];

  const resumoMock = {
    criticos: 0,
    altos: 1,
    medios: 1,
    baixos: 1,
    total: 3
  };

  // Carregar alertas ao montar o componente
  useEffect(() => {
    carregarAlertas();
  }, []);

  const carregarAlertas = async () => {
    setLoading(true);
    // Simular carregamento
    setTimeout(() => {
      setAlertas(alertasMock);
      setResumo(resumoMock);
      setLoading(false);
    }, 1000);
  };

  const forcarVerificacao = async (tipo) => {
    setAtualizando(true);
    console.log('Forçando verificação:', tipo);
    
    // Simular verificação
    setTimeout(() => {
      setAtualizando(false);
      alert(`Verificação ${tipo} executada com sucesso!`);
    }, 2000);
  };

  const resolverAlerta = async (alertaId) => {
    console.log('Resolvendo alerta:', alertaId);
    // Remover o alerta da lista
    setAlertas(prev => prev.filter(a => a.id !== alertaId));
    alert('Alerta resolvido com sucesso!');
  };

  const executarAcao = async (alertaId) => {
    console.log('Executando ação para alerta:', alertaId);
    alert('Ação executada com sucesso!');
  };

  const getSeveridadeColor = (severidade) => {
    const colors = {
      critica: 'bg-red-100 text-red-800 border-red-200',
      alta: 'bg-orange-100 text-orange-800 border-orange-200',
      media: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      baixa: 'bg-blue-100 text-blue-800 border-blue-200'
    };
    return colors[severidade] || colors.media;
  };

  const getSeveridadeIcon = (severidade) => {
    const icons = {
      critica: <XCircle className="h-4 w-4 text-red-600" />,
      alta: <AlertTriangle className="h-4 w-4 text-orange-600" />,
      media: <Clock className="h-4 w-4 text-yellow-600" />,
      baixa: <TrendingUp className="h-4 w-4 text-blue-600" />
    };
    return icons[severidade] || icons.media;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <RefreshCw className="h-8 w-8 animate-spin" />
        <span className="ml-2">Carregando alertas...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header com Resumo */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Sistema de Alertas</h2>
        <button
          className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
          onClick={() => forcarVerificacao('geral')}
          disabled={atualizando}
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${atualizando ? 'animate-spin' : ''}`} />
          Atualizar
        </button>
      </div>

      {/* Cards de Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg border shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Críticos</p>
              <p className="text-2xl font-bold text-red-600">{resumo.criticos || 0}</p>
            </div>
            <XCircle className="h-8 w-8 text-red-600" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg border shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Alta Prioridade</p>
              <p className="text-2xl font-bold text-orange-600">{resumo.altos || 0}</p>
            </div>
            <AlertTriangle className="h-8 w-8 text-orange-600" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg border shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Média Prioridade</p>
              <p className="text-2xl font-bold text-yellow-600">{resumo.medios || 0}</p>
            </div>
            <Clock className="h-8 w-8 text-yellow-600" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg border shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Ativo</p>
              <p className="text-2xl font-bold text-blue-600">{resumo.total || 0}</p>
            </div>
            <Users className="h-8 w-8 text-blue-600" />
          </div>
        </div>
      </div>

      {/* Lista de Alertas */}
      <div className="bg-white rounded-lg border shadow-sm">
        <div className="px-6 py-4 border-b">
          <h3 className="text-lg font-medium text-gray-900">Alertas Ativos</h3>
        </div>
        <div className="p-6">
          {alertas.length === 0 ? (
            <div className="text-center py-8">
              <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
              <p className="text-lg font-medium text-gray-900">Nenhum alerta ativo!</p>
              <p className="text-gray-500">Sistema funcionando perfeitamente.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {alertas.map((alerta) => (
                <div key={alerta.id} className="border rounded-lg p-4 border-l-4 border-l-orange-400">
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0 pt-1">
                      {getSeveridadeIcon(alerta.severidade)}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="text-base font-semibold text-gray-900">
                          {alerta.titulo}
                        </h4>
                        <div className="flex items-center space-x-2">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getSeveridadeColor(alerta.severidade)}`}>
                            {alerta.severidade.toUpperCase()}
                          </span>
                          {alerta.numero_os && (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                              OS {alerta.numero_os}
                            </span>
                          )}
                        </div>
                      </div>
                      
                      <p className="text-sm text-gray-600 mb-3">
                        {alerta.descricao}
                      </p>
                      
                      {alerta.sugestao && (
                        <div className="bg-blue-50 p-3 rounded-md mb-3">
                          <p className="text-sm text-blue-800">
                            <strong>Sugestão:</strong> {alerta.sugestao}
                          </p>
                        </div>
                      )}
                      
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-500">
                          {new Date(alerta.created_at).toLocaleString('pt-BR')}
                        </span>
                        
                        <div className="flex space-x-2">
                          {alerta.acao_sugerida && (
                            <button
                              className="inline-flex items-center px-3 py-1 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                              onClick={() => executarAcao(alerta.id)}
                            >
                              Executar Ação
                            </button>
                          )}
                          <button
                            className="inline-flex items-center px-3 py-1 border border-transparent rounded-md text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
                            onClick={() => resolverAlerta(alerta.id)}
                          >
                            Resolver
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Botões de Verificação Manual */}
      <div className="bg-white rounded-lg border shadow-sm">
        <div className="px-6 py-4 border-b">
          <h3 className="text-lg font-medium text-gray-900">Verificações Manuais</h3>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button
              className="p-4 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
              onClick={() => forcarVerificacao('urgente')}
              disabled={atualizando}
            >
              <div className="text-center">
                <AlertTriangle className="h-6 w-6 mx-auto mb-2 text-red-600" />
                <div className="font-medium">Alertas Urgentes</div>
                <div className="text-sm text-gray-500">
                  Serviços atrasados, aprovações pendentes
                </div>
              </div>
            </button>

            <button
              className="p-4 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
              onClick={() => forcarVerificacao('prazos')}
              disabled={atualizando}
            >
              <div className="text-center">
                <Clock className="h-6 w-6 mx-auto mb-2 text-orange-600" />
                <div className="font-medium">Verificar Prazos</div>
                <div className="text-sm text-gray-500">
                  Comunicação, orçamentos vencendo
                </div>
              </div>
            </button>

            <button
              className="p-4 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
              onClick={() => forcarVerificacao('proativo')}
              disabled={atualizando}
            >
              <div className="text-center">
                <TrendingUp className="h-6 w-6 mx-auto mb-2 text-blue-600" />
                <div className="font-medium">Análise Proativa</div>
                <div className="text-sm text-gray-500">
                  Padrões, sugestões de melhoria
                </div>
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AlertaDashboard;
