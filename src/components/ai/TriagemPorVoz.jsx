import React, { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, MicOff, Play, Pause, RotateCcw, CheckCircle, AlertCircle, Loader } from 'lucide-react';

/**
 * Componente de Triagem por Voz - Implementação da Tarefa 1
 * Permite gravar áudio do cliente e obter análise automática do problema
 */
const TriagemPorVoz = ({ onAnaliseCompleta, dadosIniciais = {} }) => {
  // Estados do componente
  const [status, setStatus] = useState('idle'); // idle | recording | processing | success | error
  const [audioBlob, setAudioBlob] = useState(null);
  const [analiseResultado, setAnaliseResultado] = useState(null);
  const [erroMensagem, setErroMensagem] = useState('');
  const [tempoGravacao, setTempoGravacao] = useState(0);
  const [clienteTelefone, setClienteTelefone] = useState(dadosIniciais.telefone || '');
  const [veiculoPlaca, setVeiculoPlaca] = useState(dadosIniciais.placa || '');

  // Refs para controle de gravação
  const mediaRecorderRef = useRef(null);
  const streamRef = useRef(null);
  const timerRef = useRef(null);
  const audioChunksRef = useRef([]);

  /**
   * Inicia a gravação de áudio
   */
  const iniciarGravacao = useCallback(async () => {
    try {
      console.log('🎤 Iniciando gravação de áudio...');
      
      // Validar dados antes de gravar
      if (!clienteTelefone || !veiculoPlaca) {
        setErroMensagem('Por favor, preencha o telefone e a placa antes de gravar.');
        return;
      }

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

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { 
          type: 'audio/webm;codecs=opus' 
        });
        setAudioBlob(audioBlob);
        
        // Parar todas as tracks do stream
        streamRef.current?.getTracks().forEach(track => track.stop());
      };

      // Iniciar gravação
      mediaRecorder.start();
      setStatus('recording');
      setTempoGravacao(0);
      setErroMensagem('');

      // Timer para contar tempo de gravação
      timerRef.current = setInterval(() => {
        setTempoGravacao(prev => {
          if (prev >= 120) { // 2 minutos máximo
            pararGravacao();
            return prev;
          }
          return prev + 1;
        });
      }, 1000);

    } catch (error) {
      console.error('❌ Erro ao iniciar gravação:', error);
      setErroMensagem('Erro ao acessar o microfone. Verifique as permissões.');
      setStatus('error');
    }
  }, [clienteTelefone, veiculoPlaca]);

  /**
   * Para a gravação de áudio
   */
  const pararGravacao = useCallback(() => {
    console.log('🛑 Parando gravação...');
    
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
    }
    
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }

    setStatus('idle');
  }, []);

  /**
   * Processa o áudio gravado enviando para a API
   */
  const processarAudio = useCallback(async () => {
    if (!audioBlob) {
      setErroMensagem('Nenhum áudio gravado para processar.');
      return;
    }

    if (tempoGravacao < 5) {
      setErroMensagem('Gravação muito curta. Grave pelo menos 5 segundos descrevendo o problema.');
      return;
    }

    try {
      setStatus('processing');
      setErroMensagem('');
      
      console.log('🤖 Enviando áudio para análise...');

      // Preparar FormData
      const formData = new FormData();
      formData.append('audio', audioBlob, 'triagem.webm');
      formData.append('clienteTelefone', clienteTelefone);
      formData.append('veiculoPlaca', veiculoPlaca.toUpperCase());

      // Chamar API
      const response = await fetch('/api/ai/triagem-voz', {
        method: 'POST',
        body: formData,
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erro no processamento');
      }

      console.log('✅ Análise concluída:', data);
      
      setAnaliseResultado(data);
      setStatus('success');
      
      // Callback para componente pai
      if (onAnaliseCompleta) {
        onAnaliseCompleta(data);
      }

    } catch (error) {
      console.error('❌ Erro no processamento:', error);
      setErroMensagem(error.message);
      setStatus('error');
    }
  }, [audioBlob, tempoGravacao, clienteTelefone, veiculoPlaca, onAnaliseCompleta]);

  /**
   * Reinicia o processo
   */
  const reiniciar = useCallback(() => {
    setStatus('idle');
    setAudioBlob(null);
    setAnaliseResultado(null);
    setErroMensagem('');
    setTempoGravacao(0);
    audioChunksRef.current = [];
  }, []);

  /**
   * Formata tempo em MM:SS
   */
  const formatarTempo = (segundos) => {
    const mins = Math.floor(segundos / 60);
    const secs = segundos % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 max-w-2xl mx-auto">
      {/* Header */}
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">
          🎤 Triagem por Voz com IA
        </h2>
        <p className="text-gray-600">
          Grave o cliente descrevendo o problema e obtenha análise automática
        </p>
      </div>

      {/* Formulário de dados iniciais */}
      {status === 'idle' && !audioBlob && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4 mb-6"
        >
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Telefone do Cliente *
            </label>
            <input
              type="text"
              value={clienteTelefone}
              onChange={(e) => setClienteTelefone(e.target.value)}
              placeholder="(11) 99999-9999"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Placa do Veículo *
            </label>
            <input
              type="text"
              value={veiculoPlaca}
              onChange={(e) => setVeiculoPlaca(e.target.value.toUpperCase())}
              placeholder="ABC1234"
              maxLength={7}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </motion.div>
      )}

      {/* Área principal de gravação */}
      <div className="text-center">
        <AnimatePresence mode="wait">
          {/* Estado: Idle - Pronto para gravar */}
          {status === 'idle' && (
            <motion.div
              key="idle"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="space-y-4"
            >
              {!audioBlob ? (
                <motion.button
                  onClick={iniciarGravacao}
                  disabled={!clienteTelefone || !veiculoPlaca}
                  className="w-32 h-32 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 text-white rounded-full flex items-center justify-center text-6xl shadow-lg transition-all duration-200 transform hover:scale-105 disabled:cursor-not-allowed"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Mic />
                </motion.button>
              ) : (
                <div className="space-y-4">
                  <div className="text-green-600 flex items-center justify-center space-x-2">
                    <CheckCircle size={24} />
                    <span>Áudio gravado ({formatarTempo(tempoGravacao)})</span>
                  </div>
                  
                  <div className="flex justify-center space-x-4">
                    <motion.button
                      onClick={processarAudio}
                      className="px-6 py-3 bg-green-500 hover:bg-green-600 text-white rounded-lg shadow-md transition-colors"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      🤖 Analisar com IA
                    </motion.button>
                    
                    <motion.button
                      onClick={reiniciar}
                      className="px-6 py-3 bg-gray-500 hover:bg-gray-600 text-white rounded-lg shadow-md transition-colors"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <RotateCcw size={20} className="inline mr-2" />
                      Gravar Novamente
                    </motion.button>
                  </div>
                </div>
              )}
              
              {!audioBlob && (
                <p className="text-gray-600 text-sm">
                  {clienteTelefone && veiculoPlaca 
                    ? 'Clique para começar a gravar o problema relatado pelo cliente'
                    : 'Preencha os dados obrigatórios para começar'
                  }
                </p>
              )}
            </motion.div>
          )}

          {/* Estado: Recording - Gravando */}
          {status === 'recording' && (
            <motion.div
              key="recording"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="space-y-4"
            >
              <motion.div
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ repeat: Infinity, duration: 1 }}
                className="w-32 h-32 bg-red-500 text-white rounded-full flex items-center justify-center text-6xl shadow-lg"
              >
                <Mic />
              </motion.div>
              
              <div className="space-y-2">
                <div className="text-red-600 font-semibold text-xl">
                  🔴 Gravando...
                </div>
                <div className="text-2xl font-mono">
                  {formatarTempo(tempoGravacao)}
                </div>
                <div className="text-sm text-gray-600">
                  Máximo: 2 minutos
                </div>
              </div>
              
              <motion.button
                onClick={pararGravacao}
                className="px-6 py-3 bg-red-500 hover:bg-red-600 text-white rounded-lg shadow-md transition-colors"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <MicOff size={20} className="inline mr-2" />
                Parar Gravação
              </motion.button>
            </motion.div>
          )}

          {/* Estado: Processing - Analisando */}
          {status === 'processing' && (
            <motion.div
              key="processing"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="space-y-4"
            >
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
                className="w-32 h-32 bg-yellow-500 text-white rounded-full flex items-center justify-center text-6xl shadow-lg"
              >
                <Loader />
              </motion.div>
              
              <div className="space-y-2">
                <div className="text-yellow-600 font-semibold text-xl">
                  ⏳ Analisando problema...
                </div>
                <div className="text-sm text-gray-600">
                  A IA está processando o áudio e gerando a análise
                </div>
              </div>
            </motion.div>
          )}

          {/* Estado: Success - Análise concluída */}
          {status === 'success' && analiseResultado && (
            <motion.div
              key="success"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <ResultadoAnalise 
                analise={analiseResultado} 
                onNovaAnalise={reiniciar}
              />
            </motion.div>
          )}

          {/* Estado: Error - Erro no processamento */}
          {status === 'error' && (
            <motion.div
              key="error"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="space-y-4"
            >
              <div className="w-32 h-32 bg-red-500 text-white rounded-full flex items-center justify-center text-6xl shadow-lg mx-auto">
                <AlertCircle />
              </div>
              
              <div className="text-red-600 font-semibold">
                ❌ Erro no processamento
              </div>
              
              <div className="text-gray-700 bg-red-50 p-4 rounded-lg">
                {erroMensagem}
              </div>
              
              <motion.button
                onClick={reiniciar}
                className="px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-lg shadow-md transition-colors"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <RotateCcw size={20} className="inline mr-2" />
                Tentar Novamente
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

/**
 * Componente para exibir os resultados da análise
 */
const ResultadoAnalise = ({ analise, onNovaAnalise }) => {
  const getUrgenciaColor = (urgencia) => {
    switch (urgencia?.toLowerCase()) {
      case 'emergência': return 'text-red-600 bg-red-100';
      case 'alta': return 'text-orange-600 bg-orange-100';
      case 'média': return 'text-yellow-600 bg-yellow-100';
      case 'baixa': return 'text-green-600 bg-green-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getComplexidadeColor = (complexidade) => {
    switch (complexidade?.toLowerCase()) {
      case 'alta': return 'text-red-600 bg-red-100';
      case 'média': return 'text-yellow-600 bg-yellow-100';
      case 'baixa': return 'text-green-600 bg-green-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-xl font-bold text-green-600 mb-2">
          ✅ Análise Concluída
        </h3>
        <p className="text-gray-600">
          A IA analisou o problema e gerou as informações abaixo
        </p>
      </div>

      {/* Categoria e Confiança */}
      <div className="bg-blue-50 rounded-lg p-4">
        <h4 className="font-semibold text-blue-800 mb-2">
          🔍 Categoria Identificada
        </h4>
        <div className="flex items-center justify-between">
          <span className="text-lg font-medium capitalize">
            {analise.categoriaPrincipal?.replace('_', ' ')}
          </span>
          <span className="bg-blue-200 text-blue-800 px-3 py-1 rounded-full text-sm">
            {analise.confiancaCategoria}% de confiança
          </span>
        </div>
      </div>

      {/* Informações Técnicas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gray-50 rounded-lg p-4 text-center">
          <div className="text-gray-600 text-sm font-medium">Tempo Estimado</div>
          <div className="text-xl font-bold text-gray-800">
            {analise.tempoEstimadoHoras}h
          </div>
        </div>
        
        <div className="bg-gray-50 rounded-lg p-4 text-center">
          <div className="text-gray-600 text-sm font-medium">Complexidade</div>
          <div className={`text-lg font-semibold px-3 py-1 rounded-full ${getComplexidadeColor(analise.complexidade)}`}>
            {analise.complexidade}
          </div>
        </div>
        
        <div className="bg-gray-50 rounded-lg p-4 text-center">
          <div className="text-gray-600 text-sm font-medium">Urgência</div>
          <div className={`text-lg font-semibold px-3 py-1 rounded-full ${getUrgenciaColor(analise.urgencia)}`}>
            {analise.urgencia}
          </div>
        </div>
      </div>

      {/* Resumo do Cliente */}
      <div className="bg-gray-50 rounded-lg p-4">
        <h4 className="font-semibold text-gray-800 mb-2">
          💬 O que o cliente disse:
        </h4>
        <blockquote className="italic text-gray-700 border-l-4 border-gray-300 pl-4">
          "{analise.resumoCliente}"
        </blockquote>
      </div>

      {/* Sugestões de Verificação */}
      <div className="bg-yellow-50 rounded-lg p-4">
        <h4 className="font-semibold text-yellow-800 mb-3">
          🔧 Sugestões de Verificação da IA:
        </h4>
        <ul className="space-y-2">
          {analise.sugestoesVerificacao?.map((sugestao, index) => (
            <li key={index} className="flex items-start space-x-2">
              <span className="text-yellow-600 font-bold">{index + 1}.</span>
              <span className="text-gray-700">{sugestao}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Botões de Ação */}
      <div className="flex justify-center space-x-4 pt-4">
        <motion.button
          className="px-6 py-3 bg-green-500 hover:bg-green-600 text-white rounded-lg shadow-md transition-colors"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          ✅ Confirmar Agendamento
        </motion.button>
        
        <motion.button
          className="px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-lg shadow-md transition-colors"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          ✏️ Editar Categoria
        </motion.button>
        
        <motion.button
          onClick={onNovaAnalise}
          className="px-6 py-3 bg-gray-500 hover:bg-gray-600 text-white rounded-lg shadow-md transition-colors"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          🎤 Nova Triagem
        </motion.button>
      </div>
    </div>
  );
};

export default TriagemPorVoz;
