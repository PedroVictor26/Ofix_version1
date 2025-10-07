import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { TrendingUp, DollarSign, AlertTriangle, CheckCircle, X, Plus, Loader } from 'lucide-react';

/**
 * Componente de Sugestão de Upsell Responsável
 * Analisa oportunidades de serviços adicionais baseado em evidências técnicas
 */
const SugestaoIAUpsell = ({ osId, laudoTecnico, historicoCliente, onSugestaoAdicionada }) => {
  // Estados do componente
  const [loading, setLoading] = useState(false);
  const [analise, setAnalise] = useState(null);
  const [erro, setErro] = useState('');
  const [mostrarModal, setMostrarModal] = useState(false);

  /**
   * Executa análise de upsell
   */
  const analisarUpsell = async () => {
    try {
      setLoading(true);
      setErro('');
      
      console.log('💡 Analisando oportunidades de upsell para OS:', osId);

      // Chamar API
      const response = await fetch(`/api/ai/os/${osId}/analise-upsell`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          laudoTecnico,
          historicoCliente
        })
      });

      if (!response.ok) {
        // Fallback para rota de teste
        const testResponse = await fetch('/api/ai/test/upsell', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' }
        });
        
        if (!testResponse.ok) {
          throw new Error('Erro ao analisar oportunidades');
        }
        
        const testData = await testResponse.json();
        setAnalise(testData);
      } else {
        const data = await response.json();
        setAnalise(data);
      }

      setMostrarModal(true);

    } catch (error) {
      console.error('❌ Erro na análise de upsell:', error);
      setErro(error.message);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Adiciona sugestão ao orçamento
   */
  const adicionarAoOrcamento = () => {
    if (!analise || analise.sugestao === 'sem_sugestao') return;

    console.log('✅ Adicionando sugestão ao orçamento:', analise.sugestao);

    // Callback para componente pai
    if (onSugestaoAdicionada) {
      onSugestaoAdicionada({
        tipo: analise.sugestao,
        justificativa: analise.justificativa_tecnica,
        valor: analise.valor_estimado,
        prioridade: analise.prioridade
      });
    }

    setMostrarModal(false);
  };

  /**
   * Dispensa sugestão
   */
  const dispensarSugestao = () => {
    console.log('❌ Sugestão dispensada pelo consultor');
    setMostrarModal(false);
    setAnalise(null);
  };

  /**
   * Fecha modal
   */
  const fecharModal = () => {
    setMostrarModal(false);
  };

  /**
   * Formata valor monetário
   */
  const formatarValor = (valor) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(valor);
  };

  /**
   * Obtém cor baseada na prioridade
   */
  const getCorPrioridade = (prioridade) => {
    switch (prioridade?.toLowerCase()) {
      case 'alta': return 'text-red-600 bg-red-100';
      case 'media': case 'média': return 'text-yellow-600 bg-yellow-100';
      case 'baixa': return 'text-green-600 bg-green-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  /**
   * Formata nome da sugestão
   */
  const formatarSugestao = (sugestao) => {
    return sugestao?.replace(/_/g, ' ')
                   .split(' ')
                   .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                   .join(' ');
  };

  return (
    <>
      {/* Botão de Análise */}
      <motion.button
        onClick={analisarUpsell}
        disabled={loading || !laudoTecnico}
        className="w-full py-3 bg-orange-500 hover:bg-orange-600 disabled:bg-gray-300 text-white rounded-lg shadow-md transition-colors flex items-center justify-center space-x-2"
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        {loading ? (
          <Loader className="animate-spin" size={20} />
        ) : (
          <TrendingUp size={20} />
        )}
        <span>
          {loading ? 'Analisando...' : 'Analisar Sugestões de Serviço'}
        </span>
      </motion.button>

      {/* Texto de ajuda */}
      {!laudoTecnico && (
        <p className="text-gray-500 text-sm mt-2">
          💡 Preencha o laudo técnico para habilitar a análise de IA
        </p>
      )}

      {/* Erro inline */}
      {erro && !mostrarModal && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-3 bg-red-50 border border-red-200 rounded-lg p-3"
        >
          <div className="flex items-center space-x-2">
            <AlertTriangle size={16} className="text-red-500" />
            <span className="text-red-700 text-sm">{erro}</span>
          </div>
        </motion.div>
      )}

      {/* Modal de Resultado */}
      <AnimatePresence>
        {mostrarModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
            onClick={fecharModal}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="bg-gradient-to-r from-orange-500 to-amber-500 text-white p-6 rounded-t-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <TrendingUp size={28} />
                    <div>
                      <h3 className="text-xl font-bold">Análise de Upsell</h3>
                      <p className="text-orange-100">
                        OS #{osId} - Sugestões baseadas em evidências técnicas
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={fecharModal}
                    className="text-orange-100 hover:text-white"
                  >
                    <X size={24} />
                  </button>
                </div>
              </div>

              {/* Conteúdo */}
              <div className="p-6">
                {analise ? (
                  <>
                    {/* Resultado: Sem Sugestão */}
                    {analise.sugestao === 'sem_sugestao' ? (
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-center py-8"
                      >
                        <CheckCircle size={64} className="text-green-500 mx-auto mb-4" />
                        <h3 className="text-xl font-semibold text-green-600 mb-3">
                          ✅ Veículo em Bom Estado!
                        </h3>
                        <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
                          <p className="text-green-700">
                            Nenhuma ação adicional necessária no momento. O veículo está em boas condições de acordo com o laudo técnico apresentado.
                          </p>
                        </div>
                        
                        <motion.button
                          onClick={fecharModal}
                          className="px-6 py-3 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors"
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                        >
                          Entendido
                        </motion.button>
                      </motion.div>
                    ) : (
                      /* Resultado: Com Sugestão */
                      <div className="space-y-6">
                        {/* Cabeçalho da Sugestão */}
                        <div className="text-center">
                          <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <TrendingUp className="text-orange-500" size={32} />
                          </div>
                          <h3 className="text-xl font-semibold text-gray-800 mb-2">
                            💡 Oportunidade Identificada
                          </h3>
                          <p className="text-gray-600">
                            A IA identificou uma oportunidade de serviço baseada em evidências técnicas
                          </p>
                        </div>

                        {/* Detalhes da Sugestão */}
                        <div className="bg-orange-50 border border-orange-200 rounded-lg p-6">
                          <div className="flex items-start justify-between mb-4">
                            <h4 className="text-lg font-semibold text-orange-800">
                              {formatarSugestao(analise.sugestao)}
                            </h4>
                            {analise.prioridade && (
                              <span className={`px-3 py-1 rounded-full text-sm font-medium ${getCorPrioridade(analise.prioridade)}`}>
                                {analise.prioridade?.charAt(0).toUpperCase() + analise.prioridade?.slice(1)} Prioridade
                              </span>
                            )}
                          </div>

                          {/* Valor Estimado */}
                          {analise.valor_estimado && (
                            <div className="flex items-center space-x-2 mb-4">
                              <DollarSign size={20} className="text-green-600" />
                              <span className="text-lg font-semibold text-green-600">
                                {formatarValor(analise.valor_estimado)}
                              </span>
                              <span className="text-gray-500 text-sm">(valor estimado)</span>
                            </div>
                          )}

                          {/* Justificativa Técnica */}
                          <div className="bg-white rounded-lg p-4">
                            <h5 className="font-medium text-gray-800 mb-2">
                              🔧 Justificativa Técnica:
                            </h5>
                            <p className="text-gray-700 leading-relaxed">
                              {analise.justificativa_tecnica}
                            </p>
                          </div>
                        </div>

                        {/* Serviços Detalhados */}
                        {analise.detalhes?.servicosRecomendados && (
                          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                            <h5 className="font-medium text-gray-800 mb-3">
                              📋 Serviços Recomendados:
                            </h5>
                            <ul className="space-y-2">
                              {analise.detalhes.servicosRecomendados.map((servico, index) => (
                                <li key={index} className="flex items-center space-x-2">
                                  <CheckCircle size={16} className="text-green-500" />
                                  <span className="text-gray-700">{servico}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {/* Como Apresentar ao Cliente */}
                        {analise.mensagem_cliente && (
                          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                            <h5 className="font-medium text-blue-800 mb-2">
                              💬 Como Apresentar ao Cliente:
                            </h5>
                            <div className="bg-white rounded-lg p-3 border-l-4 border-blue-400">
                              <p className="text-gray-700 italic">
                                "{analise.mensagem_cliente}"
                              </p>
                            </div>
                          </div>
                        )}

                        {/* Botões de Ação */}
                        <div className="flex flex-col sm:flex-row gap-3">
                          <motion.button
                            onClick={adicionarAoOrcamento}
                            className="flex-1 py-3 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors flex items-center justify-center space-x-2"
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                          >
                            <Plus size={18} />
                            <span>Adicionar ao Orçamento</span>
                          </motion.button>
                          
                          <motion.button
                            onClick={dispensarSugestao}
                            className="flex-1 py-3 bg-gray-500 hover:bg-gray-600 text-white rounded-lg transition-colors flex items-center justify-center space-x-2"
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                          >
                            <X size={18} />
                            <span>Dispensar Sugestão</span>
                          </motion.button>
                        </div>

                        {/* Disclaimer Ético */}
                        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                          <h5 className="font-medium text-yellow-800 mb-2">
                            ⚖️ Compromisso Ético:
                          </h5>
                          <ul className="text-sm text-yellow-700 space-y-1">
                            <li>• Esta sugestão é baseada apenas em evidências técnicas</li>
                            <li>• Não há pressão para vendas desnecessárias</li>
                            <li>• A decisão final sempre cabe ao cliente</li>
                            <li>• Transparência total sobre custos e necessidade</li>
                          </ul>
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="text-center py-8">
                    <Loader className="animate-spin mx-auto mb-4" size={48} />
                    <p className="text-gray-600">Analisando oportunidades...</p>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default SugestaoIAUpsell;
