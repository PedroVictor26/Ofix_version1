/**
 * 🔊 Hook useVoiceSynthesis
 * 
 * Gerencia síntese de voz com tratamento robusto de erros
 */

import { useState, useCallback, useEffect, useRef } from 'react';
import { AI_CONFIG } from '../constants/aiPageConfig';
import logger from '../utils/logger';

export const useVoiceSynthesis = (vozHabilitada = true) => {
  const [falando, setFalando] = useState(false);
  const [vozesDisponiveis, setVozesDisponiveis] = useState([]);
  const [vozSelecionada, setVozSelecionadaState] = useState(null);
  const [configVoz, setConfigVozState] = useState({
    rate: AI_CONFIG.VOICE.DEFAULT_RATE,
    pitch: AI_CONFIG.VOICE.DEFAULT_PITCH,
    volume: AI_CONFIG.VOICE.DEFAULT_VOLUME
  });
  const [suportado, setSuportado] = useState(false);

  const utteranceRef = useRef(null);
  const isSpeakingRef = useRef(false);

  /**
   * Verifica suporte e carrega vozes
   */
  useEffect(() => {
    if (!('speechSynthesis' in window)) {
      logger.warn('Síntese de voz não suportada neste navegador');
      setSuportado(false);
      return;
    }

    setSuportado(true);

    const carregarVozes = () => {
      const voices = window.speechSynthesis.getVoices();
      
      if (voices.length > 0) {
        setVozesDisponiveis(voices);

        // Selecionar voz em português por padrão
        const vozPt = voices.find(v => v.lang.includes('pt-BR')) || 
                      voices.find(v => v.lang.includes('pt')) ||
                      voices[0];
        
        setVozSelecionadaState(vozPt);

        logger.info('Vozes carregadas', {
          total: voices.length,
          vozSelecionada: vozPt?.name,
          vozesEmPortugues: voices.filter(v => v.lang.includes('pt')).length
        });
      }
    };

    // Carregar vozes
    carregarVozes();

    // Alguns navegadores precisam de evento
    if (window.speechSynthesis.onvoiceschanged !== undefined) {
      window.speechSynthesis.onvoiceschanged = carregarVozes;
    }

    return () => {
      if (window.speechSynthesis && window.speechSynthesis.onvoiceschanged !== undefined) {
        window.speechSynthesis.onvoiceschanged = null;
      }
    };
  }, []);

  /**
   * Limpa markdown do texto para melhor pronúncia
   */
  const limparMarkdown = useCallback((texto) => {
    return texto
      .replace(/\*\*/g, '') // Remove negrito
      .replace(/\*/g, '') // Remove itálico
      .replace(/#{1,6}\s/g, '') // Remove headers
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // Remove links, mantém texto
      .replace(/`{1,3}[^`]+`{1,3}/g, '') // Remove código
      .replace(/^\s*[-*+]\s/gm, '') // Remove bullets
      .replace(/^\s*\d+\.\s/gm, '') // Remove numeração
      .replace(/\n{2,}/g, '. ') // Múltiplas quebras viram ponto
      .replace(/\n/g, ', ') // Quebras simples viram vírgula
      .trim();
  }, []);

  /**
   * Fala um texto
   */
  const falarTexto = useCallback((texto) => {
    if (!suportado) {
      logger.warn('Tentativa de falar sem suporte a síntese de voz');
      return;
    }

    if (!vozHabilitada) {
      logger.debug('Síntese de voz desabilitada');
      return;
    }

    if (!texto || texto.trim().length === 0) {
      logger.warn('Tentativa de falar texto vazio');
      return;
    }

    // Parar fala anterior se houver
    if (isSpeakingRef.current) {
      try {
        window.speechSynthesis.cancel();
      } catch (error) {
        logger.error('Erro ao cancelar fala anterior', {
          error: error.message
        });
      }
    }

    try {
      // Limpar markdown
      const textoLimpo = limparMarkdown(texto);

      // Limitar tamanho do texto
      const textoFinal = textoLimpo.length > AI_CONFIG.VOICE.MAX_TEXT_LENGTH_FOR_SPEECH
        ? textoLimpo.substring(0, AI_CONFIG.VOICE.MAX_TEXT_LENGTH_FOR_SPEECH) + '...'
        : textoLimpo;

      if (textoFinal.trim().length === 0) {
        logger.debug('Texto vazio após limpeza de markdown');
        return;
      }

      const utterance = new SpeechSynthesisUtterance(textoFinal);

      // Configurar voz
      if (vozSelecionada) {
        utterance.voice = vozSelecionada;
      }

      // Configurar parâmetros
      utterance.rate = configVoz.rate;
      utterance.pitch = configVoz.pitch;
      utterance.volume = configVoz.volume;
      utterance.lang = 'pt-BR';

      // Eventos
      utterance.onstart = () => {
        setFalando(true);
        isSpeakingRef.current = true;
        
        logger.debug('Síntese de voz iniciada', {
          textoLength: textoFinal.length,
          voz: vozSelecionada?.name,
          rate: configVoz.rate
        });
      };

      utterance.onend = () => {
        setFalando(false);
        isSpeakingRef.current = false;
        
        logger.debug('Síntese de voz finalizada');
      };

      utterance.onerror = (event) => {
        setFalando(false);
        isSpeakingRef.current = false;

        // Não logar erros comuns como críticos
        const errosComuns = ['canceled', 'interrupted', 'not-allowed'];
        const nivel = errosComuns.includes(event.error) ? 'debug' : 'error';

        logger[nivel]('Erro na síntese de voz', {
          error: event.error,
          message: event.message,
          textoLength: textoFinal.length
        });

        // Limpar utterance
        utteranceRef.current = null;
      };

      utteranceRef.current = utterance;

      // Falar
      window.speechSynthesis.speak(utterance);

      logger.info('Texto enviado para síntese', {
        textoOriginalLength: texto.length,
        textoFinalLength: textoFinal.length,
        vozHabilitada
      });

    } catch (error) {
      logger.error('Erro ao criar síntese de voz', {
        error: error.message,
        stack: error.stack
      });
      setFalando(false);
      isSpeakingRef.current = false;
    }
  }, [suportado, vozHabilitada, vozSelecionada, configVoz, limparMarkdown]);

  /**
   * Para a fala
   */
  const pararFala = useCallback(() => {
    if (!suportado) return;

    try {
      window.speechSynthesis.cancel();
      setFalando(false);
      isSpeakingRef.current = false;
      utteranceRef.current = null;

      logger.info('Fala interrompida pelo usuário');
    } catch (error) {
      logger.error('Erro ao parar fala', {
        error: error.message
      });
    }
  }, [suportado]);

  /**
   * Pausa a fala
   */
  const pausarFala = useCallback(() => {
    if (!suportado || !falando) return;

    try {
      window.speechSynthesis.pause();
      logger.debug('Fala pausada');
    } catch (error) {
      logger.error('Erro ao pausar fala', {
        error: error.message
      });
    }
  }, [suportado, falando]);

  /**
   * Retoma a fala
   */
  const retomarFala = useCallback(() => {
    if (!suportado) return;

    try {
      window.speechSynthesis.resume();
      logger.debug('Fala retomada');
    } catch (error) {
      logger.error('Erro ao retomar fala', {
        error: error.message
      });
    }
  }, [suportado]);

  /**
   * Define voz selecionada
   */
  const setVozSelecionada = useCallback((voz) => {
    setVozSelecionadaState(voz);
    logger.info('Voz alterada', {
      nome: voz?.name,
      lang: voz?.lang
    });
  }, []);

  /**
   * Define configurações de voz
   */
  const setConfigVoz = useCallback((config) => {
    setConfigVozState(config);
    logger.debug('Configurações de voz alteradas', config);
  }, []);

  /**
   * Testa a voz atual
   */
  const testarVoz = useCallback(() => {
    falarTexto('Olá! Esta é uma demonstração da síntese de voz.');
  }, [falarTexto]);

  // Cleanup ao desmontar
  useEffect(() => {
    return () => {
      if (suportado && isSpeakingRef.current) {
        try {
          window.speechSynthesis.cancel();
        } catch (error) {
          // Ignorar erro no cleanup
        }
      }
    };
  }, [suportado]);

  return {
    falando,
    vozesDisponiveis,
    vozSelecionada,
    configVoz,
    suportado,
    falarTexto,
    pararFala,
    pausarFala,
    retomarFala,
    setVozSelecionada,
    setConfigVoz,
    testarVoz
  };
};

export default useVoiceSynthesis;
