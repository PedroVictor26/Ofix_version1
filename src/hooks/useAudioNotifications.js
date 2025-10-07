import { useState, useEffect, useRef } from 'react';

/**
 * Hook para notificações sonoras do sistema OFIX
 * Reproduz sons para alertas importantes como:
 * - Estoque baixo
 * - Novas mensagens
 * - Status críticos de serviços
 * - Notificações do sistema
 */
export const useAudioNotifications = () => {
  const [isEnabled, setIsEnabled] = useState(true);
  const [volume, setVolume] = useState(0.7);
  const audioContextRef = useRef(null);

  // Configurações de sons
  const soundConfig = {
    // Alerta de estoque baixo - tom grave e contínuo
    lowStock: {
      frequency: 200,
      duration: 800,
      volume: 0.6,
      type: 'sawtooth'
    },
    // Nova mensagem - tom suave e agradável
    newMessage: {
      frequency: 440,
      duration: 300,
      volume: 0.5,
      type: 'sine'
    },
    // Status crítico - tom urgente
    criticalAlert: {
      frequency: 880,
      duration: 500,
      volume: 0.8,
      type: 'square'
    },
    // Notificação geral - tom neutro
    notification: {
      frequency: 523,
      duration: 250,
      volume: 0.4,
      type: 'triangle'
    },
    // Sucesso - tom ascendente alegre
    success: {
      frequencies: [261, 329, 392],
      duration: 150,
      volume: 0.6,
      type: 'sine'
    },
    // Erro - tom descendente
    error: {
      frequencies: [440, 349, 261],
      duration: 200,
      volume: 0.7,
      type: 'sawtooth'
    }
  };

  // Inicializar contexto de áudio
  useEffect(() => {
    const initAudioContext = async () => {
      try {
        if (!audioContextRef.current) {
          audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
        }
      } catch (error) {
        console.warn('🔊 AudioContext não suportado:', error);
      }
    };

    initAudioContext();
    
    return () => {
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close();
      }
    };
  }, []);

  // Função para criar oscilador
  const createOscillator = (frequency, duration, volume, type = 'sine') => {
    if (!audioContextRef.current || !isEnabled) return;

    try {
      const oscillator = audioContextRef.current.createOscillator();
      const gainNode = audioContextRef.current.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContextRef.current.destination);

      oscillator.frequency.value = frequency;
      oscillator.type = type;

      // Envelope de volume suave para evitar cliques
      const now = audioContextRef.current.currentTime;
      gainNode.gain.setValueAtTime(0, now);
      gainNode.gain.linearRampToValueAtTime(volume * this.volume || volume * 0.7, now + 0.01);
      gainNode.gain.exponentialRampToValueAtTime(0.01, now + duration / 1000);

      oscillator.start(now);
      oscillator.stop(now + duration / 1000);

      return oscillator;
    } catch (error) {
      console.warn('🔊 Erro ao criar oscilador:', error);
    }
  };

  // Função principal para reproduzir sons
  const playSound = (soundType, options = {}) => {
    if (!isEnabled || !audioContextRef.current) return;

    console.log(`🔊 Reproduzindo som: ${soundType}`);

    const config = { ...soundConfig[soundType], ...options };
    
    if (!config) {
      console.warn(`🔊 Tipo de som não encontrado: ${soundType}`);
      return;
    }

    try {
      // Sons com múltiplas frequências (acordes)
      if (config.frequencies) {
        config.frequencies.forEach((freq, index) => {
          setTimeout(() => {
            createOscillator(freq, config.duration, config.volume, config.type);
          }, index * (config.duration / 2));
        });
      } else {
        // Som simples
        createOscillator(config.frequency, config.duration, config.volume, config.type);
      }
    } catch (error) {
      console.error('🔊 Erro ao reproduzir som:', error);
    }
  };

  // Sons específicos para contextos do OFIX
  const playLowStockAlert = () => {
    console.log('🔊 Alerta: Estoque baixo detectado!');
    playSound('lowStock');
    
    // Som duplo para chamar atenção
    setTimeout(() => {
      playSound('lowStock');
    }, 1000);
  };

  const playNewMessageAlert = () => {
    console.log('🔊 Nova mensagem recebida');
    playSound('newMessage');
  };

  const playCriticalAlert = () => {
    console.log('🔊 Alerta crítico!');
    playSound('criticalAlert');
    
    // Repetir 3 vezes para urgência
    setTimeout(() => playSound('criticalAlert'), 600);
    setTimeout(() => playSound('criticalAlert'), 1200);
  };

  const playNotification = () => {
    console.log('🔊 Notificação do sistema');
    playSound('notification');
  };

  const playSuccess = () => {
    console.log('🔊 Operação realizada com sucesso');
    playSound('success');
  };

  const playError = () => {
    console.log('🔊 Erro detectado');
    playSound('error');
  };

  // Função para alertas baseados em status de serviços
  const playServiceStatusAlert = (status) => {
    switch (status) {
      case 'AGUARDANDO_PECAS':
        playLowStockAlert();
        break;
      case 'AGUARDANDO_APROVACAO':
        playNotification();
        break;
      case 'FINALIZADO':
        playSuccess();
        break;
      case 'CANCELADO':
        playError();
        break;
      default:
        playNotification();
    }
  };

  // Função para testar todos os sons
  const testAllSounds = () => {
    console.log('🔊 Testando todos os sons...');
    
    const sounds = ['notification', 'success', 'error', 'newMessage', 'lowStock', 'criticalAlert'];
    
    sounds.forEach((sound, index) => {
      setTimeout(() => {
        console.log(`🔊 Testando: ${sound}`);
        playSound(sound);
      }, index * 1000);
    });
  };

  // Habilitar/desabilitar sons
  const toggleSounds = () => {
    setIsEnabled(!isEnabled);
    console.log(`🔊 Sons ${!isEnabled ? 'habilitados' : 'desabilitados'}`);
    
    if (!isEnabled) {
      playNotification(); // Som de confirmação
    }
  };

  // Ajustar volume geral
  const setGlobalVolume = (newVolume) => {
    const clampedVolume = Math.max(0, Math.min(1, newVolume));
    setVolume(clampedVolume);
    console.log(`🔊 Volume ajustado para: ${Math.round(clampedVolume * 100)}%`);
    
    // Som de teste no novo volume
    playNotification();
  };

  return {
    // Estado
    isEnabled,
    volume,
    
    // Controles principais
    toggleSounds,
    setGlobalVolume,
    testAllSounds,
    
    // Sons específicos
    playLowStockAlert,
    playNewMessageAlert,
    playCriticalAlert,
    playNotification,
    playSuccess,
    playError,
    playServiceStatusAlert,
    
    // Som genérico
    playSound
  };
};

// Hook para monitorar alertas ativos e reproduzir sons automaticamente
export const useActiveAlertsMonitor = () => {
  const { playLowStockAlert, playCriticalAlert, playNotification } = useAudioNotifications();
  const [lastAlertCheck, setLastAlertCheck] = useState(Date.now());
  
  // Função para verificar alertas ativos no sistema
  const checkActiveAlerts = async () => {
    try {
      // Verificar estoque baixo
      const lowStockItems = await checkLowStockItems();
      if (lowStockItems.length > 0) {
        playLowStockAlert();
      }
      
      // Verificar serviços críticos
      const criticalServices = await checkCriticalServices();
      if (criticalServices.length > 0) {
        playCriticalAlert();
      }
      
      // Verificar notificações pendentes
      const pendingNotifications = await checkPendingNotifications();
      if (pendingNotifications.length > 0) {
        playNotification();
      }
      
      setLastAlertCheck(Date.now());
    } catch (error) {
      console.error('🔊 Erro ao verificar alertas:', error);
    }
  };

  // Funções auxiliares para verificar diferentes tipos de alertas
  const checkLowStockItems = async () => {
    // TODO: Implementar verificação de estoque baixo
    return [];
  };

  const checkCriticalServices = async () => {
    // TODO: Implementar verificação de serviços críticos
    return [];
  };

  const checkPendingNotifications = async () => {
    // TODO: Implementar verificação de notificações pendentes
    return [];
  };

  return {
    checkActiveAlerts,
    lastAlertCheck
  };
};
