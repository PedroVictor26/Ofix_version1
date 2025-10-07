import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, Copy, ExternalLink, CheckCircle, AlertCircle, Loader } from 'lucide-react';

/**
 * Botão para Gerar Resumo WhatsApp
 * Componente para ser integrado nas páginas de OS
 */
const BotaoResumoWhatsapp = ({ osId, dadosOS, onResumoGerado }) => {
  // Estados do componente
  const [loading, setLoading] = useState(false);
  const [resumo, setResumo] = useState(null);
  const [erro, setErro] = useState('');
  const [mostrarModal, setMostrarModal] = useState(false);
  const [copiado, setCopiado] = useState(false);

  /**
   * Gera resumo para WhatsApp
   */
  const gerarResumo = async () => {
    try {
      setLoading(true);
      setErro('');
      
      console.log('📱 Gerando resumo WhatsApp para OS:', osId);

      // Chamar API
      const response = await fetch(`/api/ai/os/${osId}/resumo-whatsapp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(dadosOS || {})
      });

      if (!response.ok) {
        // Fallback para rota de teste
        const testResponse = await fetch('/api/ai/test/resumo-whatsapp', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' }
        });
        
        if (!testResponse.ok) {
          throw new Error('Erro ao gerar resumo');
        }
        
        const testData = await testResponse.json();
        setResumo(testData);
      } else {
        const data = await response.json();
        setResumo(data);
      }

      setMostrarModal(true);

      // Callback para componente pai
      if (onResumoGerado) {
        onResumoGerado(resumo);
      }

    } catch (error) {
      console.error('❌ Erro ao gerar resumo:', error);
      setErro(error.message);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Copia texto para clipboard
   */
  const copiarTexto = async (texto) => {
    try {
      await navigator.clipboard.writeText(texto);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2000);
    } catch (error) {
      console.error('Erro ao copiar:', error);
    }
  };

  /**
   * Abre WhatsApp com mensagem
   */
  const abrirWhatsApp = (telefone, mensagem) => {
    const telefoneFormatado = telefone?.replace(/\D/g, '').replace(/^0/, '55');
    const mensagemCodificada = encodeURIComponent(mensagem);
    const linkWa = `https://wa.me/${telefoneFormatado}?text=${mensagemCodificada}`;
    
    window.open(linkWa, '_blank');
  };

  /**
   * Fecha modal
   */
  const fecharModal = () => {
    setMostrarModal(false);
    setResumo(null);
    setErro('');
  };

  return (
    <>
      {/* Botão Principal */}
      <motion.button
        onClick={gerarResumo}
        disabled={loading}
        className="inline-flex items-center space-x-2 px-4 py-2 bg-green-500 hover:bg-green-600 disabled:bg-gray-300 text-white rounded-lg shadow-md transition-colors"
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        {loading ? (
          <Loader className="animate-spin" size={18} />
        ) : (
          <MessageCircle size={18} />
        )}
        <span>
          {loading ? 'Gerando...' : 'Gerar Resumo WhatsApp'}
        </span>
      </motion.button>

      {/* Erro inline */}
      {erro && !mostrarModal && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-2 bg-red-50 border border-red-200 rounded-lg p-3"
        >
          <div className="flex items-center space-x-2">
            <AlertCircle size={16} className="text-red-500" />
            <span className="text-red-700 text-sm">{erro}</span>
          </div>
        </motion.div>
      )}

      {/* Modal com Resumo */}
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
              <div className="bg-gradient-to-r from-green-500 to-emerald-500 text-white p-6 rounded-t-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <MessageCircle size={28} />
                    <div>
                      <h3 className="text-xl font-bold">Mensagem WhatsApp</h3>
                      <p className="text-green-100">
                        OS #{osId} - Resumo gerado por IA
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={fecharModal}
                    className="text-green-100 hover:text-white"
                  >
                    ✕
                  </button>
                </div>
              </div>

              {/* Conteúdo */}
              <div className="p-6 space-y-6">
                {resumo ? (
                  <>
                    {/* Mensagem Gerada */}
                    <div>
                      <h4 className="font-semibold text-gray-800 mb-3">
                        📱 Mensagem para o Cliente:
                      </h4>
                      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 relative">
                        <div className="text-gray-800 whitespace-pre-wrap">
                          {resumo.mensagemWhatsapp}
                        </div>
                        
                        {/* Botão de Copiar */}
                        <motion.button
                          onClick={() => copiarTexto(resumo.mensagemWhatsapp)}
                          className="absolute top-3 right-3 p-2 bg-white hover:bg-gray-100 rounded-lg shadow-sm transition-colors"
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                        >
                          {copiado ? (
                            <CheckCircle size={16} className="text-green-500" />
                          ) : (
                            <Copy size={16} className="text-gray-500" />
                          )}
                        </motion.button>
                      </div>
                      
                      {copiado && (
                        <motion.div
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0 }}
                          className="text-green-600 text-sm mt-2"
                        >
                          ✅ Mensagem copiada para área de transferência!
                        </motion.div>
                      )}
                    </div>

                    {/* Informações Adicionais */}
                    {(resumo.cliente || resumo.os || resumo.status) && (
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <h4 className="font-semibold text-blue-800 mb-2">
                          ℹ️ Informações da OS:
                        </h4>
                        <div className="text-sm space-y-1">
                          {resumo.cliente && (
                            <div>
                              <span className="font-medium">Cliente:</span>
                              <span className="ml-2">{resumo.cliente}</span>
                            </div>
                          )}
                          {resumo.os && (
                            <div>
                              <span className="font-medium">OS:</span>
                              <span className="ml-2">#{resumo.os}</span>
                            </div>
                          )}
                          {resumo.status && (
                            <div>
                              <span className="font-medium">Status:</span>
                              <span className="ml-2 capitalize">{resumo.status?.replace('_', ' ')}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Botões de Ação */}
                    <div className="flex flex-col sm:flex-row gap-3">
                      <motion.button
                        onClick={() => copiarTexto(resumo.mensagemWhatsapp)}
                        className="flex-1 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors flex items-center justify-center space-x-2"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <Copy size={18} />
                        <span>Copiar Mensagem</span>
                      </motion.button>
                      
                      <motion.button
                        onClick={() => abrirWhatsApp(dadosOS?.clienteTelefone || '11999999999', resumo.mensagemWhatsapp)}
                        className="flex-1 py-3 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors flex items-center justify-center space-x-2"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <ExternalLink size={18} />
                        <span>Enviar WhatsApp</span>
                      </motion.button>
                    </div>

                    {/* Dicas */}
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                      <h4 className="font-semibold text-yellow-800 mb-2">
                        💡 Dicas de Uso:
                      </h4>
                      <ul className="text-sm text-yellow-700 space-y-1">
                        <li>• Revise a mensagem antes de enviar</li>
                        <li>• Personalize se necessário para o cliente específico</li>
                        <li>• Use o botão "Enviar WhatsApp" para abertura automática</li>
                        <li>• A mensagem foi gerada com base no status atual da OS</li>
                      </ul>
                    </div>
                  </>
                ) : erro ? (
                  <div className="text-center py-8">
                    <AlertCircle size={48} className="text-red-500 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-red-600 mb-2">
                      Erro ao Gerar Resumo
                    </h3>
                    <p className="text-red-500 mb-4">{erro}</p>
                    <motion.button
                      onClick={gerarResumo}
                      className="px-6 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      Tentar Novamente
                    </motion.button>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Loader className="animate-spin mx-auto mb-4" size={48} />
                    <p className="text-gray-600">Gerando resumo personalizado...</p>
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

export default BotaoResumoWhatsapp;
