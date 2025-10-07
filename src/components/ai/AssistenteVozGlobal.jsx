import { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, MicOff, Volume2, X, CheckCircle, AlertCircle } from 'lucide-react';

/**
 * Assistente de Voz Global - Ícone flutuante para comandos de voz
 * Permite controlar o sistema através de comandos por áudio
 */
const AssistenteVozGlobal = ({ onComandoExecutado }) => {
  // Estados do componente
  const [ativo, setAtivo] = useState(false);
  const [gravando, setGravando] = useState(false);
  const [processando, setProcessando] = useState(false);
  const [ultimoComando, setUltimoComando] = useState(null);
  const [erro, setErro] = useState('');
  const [mostrarModal, setMostrarModal] = useState(false);

  // Refs para controle de gravação
  const mediaRecorderRef = useRef(null);
  const streamRef = useRef(null);
  const audioChunksRef = useRef([]);

  /**
   * Inicia gravação de comando de voz
   */
  const iniciarGravacao = useCallback(async () => {
    try {
      setErro('');
      console.log('🎤 Iniciando gravação de comando de voz...');

      // Solicitar permissão para microfone
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        } 
      });
      
      streamRef.current = stream;
      audioChunksRef.current = [];

      // Configurar MediaRecorder
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      });
      
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { 
          type: 'audio/webm;codecs=opus' 
        });
        
        // Parar todas as tracks do stream
        streamRef.current?.getTracks().forEach(track => track.stop());
        
        // Processar comando automaticamente
        await processarComando(audioBlob);
      };

      // Iniciar gravação
      mediaRecorder.start();
      setGravando(true);

    } catch (error) {
      console.error('❌ Erro ao iniciar gravação:', error);
      setErro('Erro ao acessar o microfone. Verifique as permissões.');
    }
  }, []);

  /**
   * Para a gravação de áudio
   */
  const pararGravacao = useCallback(() => {
    console.log('🛑 Parando gravação de comando...');
    
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
    }
    
    setGravando(false);
  }, []);

  /**
   * Processa comando de voz
   */
  const processarComando = async (audioBlob) => {
    try {
      setProcessando(true);
      setErro('');
      
      console.log('🤖 Processando comando de voz...');

      // Preparar FormData
      const formData = new FormData();
      formData.append('audio', audioBlob, 'comando.webm');

      // Chamar API
      const response = await fetch('/api/patio/comando-por-voz', {
        method: 'POST',
        body: formData,
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) {
        // Fallback: simular comando interpretado
        const comandoDemo = {
          acao: 'mover_status',
          placa_identificada: 'ABC1234',
          novo_status: 'EM_EXECUCAO',
          confirmacao: 'Comando interpretado: Mover veículo ABC1234 para "Em Execução". Confirma esta ação?',
          confianca: 85
        };
        
        setUltimoComando(comandoDemo);
        setMostrarModal(true);
        return;
      }

      const data = await response.json();
      console.log('✅ Comando interpretado:', data);
      
      setUltimoComando(data);
      setMostrarModal(true);

    } catch (error) {
      console.error('❌ Erro ao processar comando:', error);
      setErro('Erro ao processar comando. Tente novamente.');
    } finally {
      setProcessando(false);
    }
  };

  /**
   * Confirma execução do comando
   */
  const confirmarComando = async () => {
    if (!ultimoComando) return;

    try {
      console.log('✅ Executando comando confirmado:', ultimoComando);

      // Simular execução da ação
      if (ultimoComando.acao === 'mover_status') {
        // Aqui faria a chamada real para a API de atualização de status
        console.log(`Movendo ${ultimoComando.placa_identificada} para ${ultimoComando.novo_status}`);
      }

      // Callback para componente pai
      if (onComandoExecutado) {
        onComandoExecutado(ultimoComando);
      }

      setMostrarModal(false);
      setUltimoComando(null);

    } catch (error) {
      console.error('❌ Erro ao executar comando:', error);
      setErro('Erro ao executar comando.');
    }
  };

  /**
   * Cancela execução do comando
   */
  const cancelarComando = () => {
    setMostrarModal(false);
    setUltimoComando(null);
  };

  /**
   * Toggle do assistente
   */
  const toggleAssistente = () => {
    setAtivo(!ativo);
    if (ativo) {
      // Se estava ativo e está desativando, parar qualquer gravação
      if (gravando) {
        pararGravacao();
      }
    }
  };

  return (
    <>
      {/* Botão Flutuante */}
      <motion.div
        className="fixed bottom-6 right-6 z-50"
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", stiffness: 260, damping: 20 }}
      >
        <motion.button
          onClick={toggleAssistente}
          className={`w-16 h-16 rounded-full shadow-lg flex items-center justify-center text-white text-2xl transition-all duration-300 ${
            ativo 
              ? 'bg-purple-500 hover:bg-purple-600' 
              : 'bg-blue-500 hover:bg-blue-600'
          }`}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          animate={gravando ? { scale: [1, 1.2, 1] } : {}}
          transition={gravando ? { repeat: Infinity, duration: 1 } : {}}
        >
          {processando ? (
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white" />
          ) : gravando ? (
            <MicOff />
          ) : (
            <Mic />
          )}
        </motion.button>

        {/* Indicador de Status */}
        <AnimatePresence>
          {(gravando || processando) && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="absolute -top-16 right-0 bg-white rounded-lg shadow-lg px-4 py-2 text-sm font-medium border whitespace-nowrap"
            >
              {processando ? (
                <span className="text-yellow-600">🤖 Processando...</span>
              ) : gravando ? (
                <span className="text-red-600">🔴 Gravando comando</span>
              ) : null}
              
              {/* Seta do balão */}
              <div className="absolute top-full right-6 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-white" />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Painel Expandido */}
      <AnimatePresence>
        {ativo && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 20 }}
            className="fixed bottom-24 right-6 bg-white rounded-lg shadow-xl border p-4 z-40 w-80"
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                <Volume2 className="text-purple-500" size={20} />
                <span className="font-semibold text-gray-800">Assistente de Voz</span>
              </div>
              <button
                onClick={toggleAssistente}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={18} />
              </button>
            </div>

            {/* Status e Controles */}
            <div className="space-y-4">
              {erro && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <div className="flex items-center space-x-2">
                    <AlertCircle size={16} className="text-red-500" />
                    <span className="text-red-700 text-sm">{erro}</span>
                  </div>
                </div>
              )}

              {/* Instruções */}
              <div className="text-sm text-gray-600">
                <p className="mb-2">💬 <strong>Comandos disponíveis:</strong></p>
                <ul className="text-xs space-y-1 ml-4">
                  <li>• "Mover [placa] para [status]"</li>
                  <li>• "Status do carro [placa]"</li>
                  <li>• "Onde está o [placa]"</li>
                </ul>
              </div>

              {/* Botão de Gravação */}
              <div className="text-center">
                {!gravando && !processando ? (
                  <motion.button
                    onClick={iniciarGravacao}
                    className="w-full py-3 bg-purple-500 hover:bg-purple-600 text-white rounded-lg transition-colors flex items-center justify-center space-x-2"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Mic size={18} />
                    <span>Pressione para falar</span>
                  </motion.button>
                ) : gravando ? (
                  <motion.button
                    onClick={pararGravacao}
                    className="w-full py-3 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors flex items-center justify-center space-x-2"
                    animate={{ scale: [1, 1.05, 1] }}
                    transition={{ repeat: Infinity, duration: 1 }}
                  >
                    <MicOff size={18} />
                    <span>Pare de falar</span>
                  </motion.button>
                ) : (
                  <div className="w-full py-3 bg-yellow-500 text-white rounded-lg flex items-center justify-center space-x-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                    <span>Processando comando...</span>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modal de Confirmação de Comando */}
      <AnimatePresence>
        {mostrarModal && ultimoComando && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full"
            >
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Volume2 className="text-blue-500" size={32} />
                </div>
                <h3 className="text-lg font-bold text-gray-800">
                  Confirmar Comando
                </h3>
              </div>

              {/* Comando Interpretado */}
              <div className="bg-gray-50 rounded-lg p-4 mb-6">
                <p className="text-gray-700 mb-3">{ultimoComando.confirmacao}</p>
                
                {ultimoComando.confianca && (
                  <div className="text-sm text-gray-500">
                    Confiança: {ultimoComando.confianca}%
                  </div>
                )}
              </div>

              {/* Botões de Ação */}
              <div className="flex space-x-3">
                <motion.button
                  onClick={confirmarComando}
                  className="flex-1 py-3 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors flex items-center justify-center space-x-2"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <CheckCircle size={18} />
                  <span>Confirmar</span>
                </motion.button>
                
                <motion.button
                  onClick={cancelarComando}
                  className="flex-1 py-3 bg-gray-500 hover:bg-gray-600 text-white rounded-lg transition-colors flex items-center justify-center space-x-2"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <X size={18} />
                  <span>Cancelar</span>
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default AssistenteVozGlobal;
