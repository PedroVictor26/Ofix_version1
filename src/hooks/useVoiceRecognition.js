/**
 * 🎤 Hook useVoiceRecognition
 * 
 * Gerencia reconhecimento de voz com modo contínuo e filtro de confiança
 */

import { useState, useCallback, useEffect, useRef } from 'react';
import { AI_CONFIG } from '../constants/aiPageConfig';
import logger from '../utils/logger';

export const useVoiceRecognition = (modoContinuo = false, onResult = null) => {
  const [gravando, setGravando] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [confidence, setConfidence] = useState(0);
  const [suportado, setSuportado] = useState(false);
  
  const recognitionRef = useRef(null);
  const isStoppedManually = useRef(false);

  /**
   * Inicializa reconhecimento de voz
   */
  useEffect(() => {
    // Verificar suporte do navegador
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    
    if (!SpeechRecognition) {
      logger.warn('Reconhecimento de voz não suportado neste navegador');
      setSuportado(false);
      return;
    }

    setSuportado(true);

    // Criar instância
    const recognition = new SpeechRecognition();
    recognition.lang = 'pt-BR';
    recognition.continuous = modoContinuo;
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;

    // Evento: resultado
    recognition.onresult = (event) => {
      const results = event.results;
      const lastResult = results[results.length - 1];
      
      if (lastResult.isFinal) {
        const transcriptText = lastResult[0].transcript;
        const confidenceValue = lastResult[0].confidence;

        logger.debug('Reconhecimento de voz - resultado final', {
          transcript: transcriptText.substring(0, 50),
          confidence: confidenceValue,
          modoContinuo
        });

        // Filtrar por confiança mínima
        if (confidenceValue >= AI_CONFIG.VOICE.MIN_CONFIDENCE) {
          setTranscript(transcriptText);
          setConfidence(confidenceValue);

          // Callback com resultado
          if (onResult) {
            onResult(transcriptText);
          }
        } else {
          logger.warn('Reconhecimento com baixa confiança', {
            confidence: confidenceValue,
            minConfidence: AI_CONFIG.VOICE.MIN_CONFIDENCE
          });
        }
      } else {
        // Resultado intermediário
        const interimTranscript = lastResult[0].transcript;
        setTranscript(interimTranscript);
      }
    };

    // Evento: início
    recognition.onstart = () => {
      setGravando(true);
      logger.info('Reconhecimento de voz iniciado', { modoContinuo });
    };

    // Evento: fim
    recognition.onend = () => {
      setGravando(false);
      logger.info('Reconhecimento de voz finalizado', { modoContinuo });

      // Reiniciar automaticamente no modo contínuo
      if (modoContinuo && !isStoppedManually.current) {
        setTimeout(() => {
          try {
            recognition.start();
          } catch (error) {
            logger.error('Erro ao reiniciar reconhecimento', {
              error: error.message
            });
          }
        }, AI_CONFIG.VOICE.RESTART_DELAY_MS);
      }
    };

    // Evento: erro
    recognition.onerror = (event) => {
      logger.error('Erro no reconhecimento de voz', {
        error: event.error,
        message: event.message
      });

      // Não logar erro de "no-speech" como crítico
      if (event.error !== 'no-speech') {
        setGravando(false);
      }
    };

    recognitionRef.current = recognition;

    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (error) {
          // Ignorar erro ao parar
        }
      }
    };
  }, [modoContinuo, onResult]);

  /**
   * Inicia gravação
   */
  const iniciarGravacao = useCallback(() => {
    if (!suportado) {
      logger.warn('Tentativa de iniciar gravação sem suporte');
      return;
    }

    if (!recognitionRef.current) {
      logger.error('Recognition não inicializado');
      return;
    }

    try {
      isStoppedManually.current = false;
      recognitionRef.current.start();
      
      logger.info('Gravação iniciada pelo usuário');
    } catch (error) {
      // Ignorar erro se já estiver gravando
      if (error.message.includes('already started')) {
        logger.debug('Reconhecimento já está ativo');
      } else {
        logger.error('Erro ao iniciar gravação', {
          error: error.message,
          stack: error.stack
        });
      }
    }
  }, [suportado]);

  /**
   * Para gravação
   */
  const pararGravacao = useCallback(() => {
    if (!recognitionRef.current) {
      return;
    }

    try {
      isStoppedManually.current = true;
      recognitionRef.current.stop();
      
      logger.info('Gravação parada pelo usuário');
    } catch (error) {
      logger.error('Erro ao parar gravação', {
        error: error.message
      });
    }
  }, []);

  /**
   * Limpa transcript
   */
  const limparTranscript = useCallback(() => {
    setTranscript('');
    setConfidence(0);
  }, []);

  /**
   * Alterna gravação
   */
  const toggleGravacao = useCallback(() => {
    if (gravando) {
      pararGravacao();
    } else {
      iniciarGravacao();
    }
  }, [gravando, iniciarGravacao, pararGravacao]);

  return {
    gravando,
    transcript,
    confidence,
    suportado,
    iniciarGravacao,
    pararGravacao,
    limparTranscript,
    toggleGravacao
  };
};

export default useVoiceRecognition;
