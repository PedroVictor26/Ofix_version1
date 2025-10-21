/**
 * Testes unitários para useVoiceRecognition hook
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useVoiceRecognition } from '../useVoiceRecognition';
import logger from '../../utils/logger';

// Mock logger
vi.mock('../../utils/logger', () => ({
  default: {
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn()
  }
}));

describe('useVoiceRecognition', () => {
  let mockRecognition;
  let mockSpeechRecognition;

  beforeEach(() => {
    // Mock SpeechRecognition
    mockRecognition = {
      start: vi.fn(),
      stop: vi.fn(),
      onresult: null,
      onstart: null,
      onend: null,
      onerror: null,
      lang: '',
      continuous: false,
      interimResults: false,
      maxAlternatives: 1
    };

    mockSpeechRecognition = vi.fn(() => mockRecognition);
    global.window.SpeechRecognition = mockSpeechRecognition;
    global.window.webkitSpeechRecognition = mockSpeechRecognition;

    // Limpar mocks
    vi.clearAllMocks();
  });

  afterEach(() => {
    delete global.window.SpeechRecognition;
    delete global.window.webkitSpeechRecognition;
  });

  describe('inicialização', () => {
    it('deve verificar suporte do navegador', () => {
      const { result } = renderHook(() => useVoiceRecognition());

      expect(result.current.suportado).toBe(true);
      expect(mockSpeechRecognition).toHaveBeenCalled();
    });

    it('deve detectar quando não há suporte', () => {
      delete global.window.SpeechRecognition;
      delete global.window.webkitSpeechRecognition;

      const { result } = renderHook(() => useVoiceRecognition());

      expect(result.current.suportado).toBe(false);
      expect(logger.warn).toHaveBeenCalledWith(
        'Reconhecimento de voz não suportado neste navegador'
      );
    });

    it('deve configurar reconhecimento em português', () => {
      renderHook(() => useVoiceRecognition());

      expect(mockRecognition.lang).toBe('pt-BR');
    });

    it('deve configurar modo contínuo quando solicitado', () => {
      renderHook(() => useVoiceRecognition(true));

      expect(mockRecognition.continuous).toBe(true);
    });

    it('deve configurar resultados intermediários', () => {
      renderHook(() => useVoiceRecognition());

      expect(mockRecognition.interimResults).toBe(true);
    });
  });

  describe('iniciarGravacao', () => {
    it('deve iniciar reconhecimento', () => {
      const { result } = renderHook(() => useVoiceRecognition());

      act(() => {
        result.current.iniciarGravacao();
      });

      expect(mockRecognition.start).toHaveBeenCalled();
      expect(logger.info).toHaveBeenCalledWith('Gravação iniciada pelo usuário');
    });

    it('não deve iniciar se não houver suporte', () => {
      delete global.window.SpeechRecognition;
      delete global.window.webkitSpeechRecognition;

      const { result } = renderHook(() => useVoiceRecognition());

      act(() => {
        result.current.iniciarGravacao();
      });

      expect(logger.warn).toHaveBeenCalledWith(
        'Tentativa de iniciar gravação sem suporte'
      );
    });

    it('deve tratar erro se já estiver gravando', () => {
      mockRecognition.start.mockImplementation(() => {
        throw new Error('already started');
      });

      const { result } = renderHook(() => useVoiceRecognition());

      act(() => {
        result.current.iniciarGravacao();
      });

      expect(logger.debug).toHaveBeenCalledWith('Reconhecimento já está ativo');
    });
  });

  describe('pararGravacao', () => {
    it('deve parar reconhecimento', () => {
      const { result } = renderHook(() => useVoiceRecognition());

      act(() => {
        result.current.pararGravacao();
      });

      expect(mockRecognition.stop).toHaveBeenCalled();
      expect(logger.info).toHaveBeenCalledWith('Gravação parada pelo usuário');
    });

    it('deve tratar erro ao parar', () => {
      mockRecognition.stop.mockImplementation(() => {
        throw new Error('Stop error');
      });

      const { result } = renderHook(() => useVoiceRecognition());

      act(() => {
        result.current.pararGravacao();
      });

      expect(logger.error).toHaveBeenCalled();
    });
  });

  describe('toggleGravacao', () => {
    it('deve iniciar gravação se não estiver gravando', () => {
      const { result } = renderHook(() => useVoiceRecognition());

      act(() => {
        result.current.toggleGravacao();
      });

      expect(mockRecognition.start).toHaveBeenCalled();
    });

    it('deve parar gravação se estiver gravando', () => {
      const { result } = renderHook(() => useVoiceRecognition());

      // Simular início
      act(() => {
        mockRecognition.onstart();
      });

      expect(result.current.gravando).toBe(true);

      // Toggle para parar
      act(() => {
        result.current.toggleGravacao();
      });

      expect(mockRecognition.stop).toHaveBeenCalled();
    });
  });

  describe('eventos de reconhecimento', () => {
    it('deve processar resultado final com alta confiança', () => {
      const onResult = vi.fn();
      const { result } = renderHook(() => useVoiceRecognition(false, onResult));

      const mockEvent = {
        results: [
          {
            isFinal: true,
            0: {
              transcript: 'Olá mundo',
              confidence: 0.9
            }
          }
        ]
      };

      act(() => {
        mockRecognition.onresult(mockEvent);
      });

      expect(result.current.transcript).toBe('Olá mundo');
      expect(result.current.confidence).toBe(0.9);
      expect(onResult).toHaveBeenCalledWith('Olá mundo');
    });

    it('deve ignorar resultado com baixa confiança', () => {
      const onResult = vi.fn();
      const { result } = renderHook(() => useVoiceRecognition(false, onResult));

      const mockEvent = {
        results: [
          {
            isFinal: true,
            0: {
              transcript: 'Texto incerto',
              confidence: 0.3
            }
          }
        ]
      };

      act(() => {
        mockRecognition.onresult(mockEvent);
      });

      expect(onResult).not.toHaveBeenCalled();
      expect(logger.warn).toHaveBeenCalledWith(
        'Reconhecimento com baixa confiança',
        expect.any(Object)
      );
    });

    it('deve processar resultados intermediários', () => {
      const { result } = renderHook(() => useVoiceRecognition());

      const mockEvent = {
        results: [
          {
            isFinal: false,
            0: {
              transcript: 'Olá',
              confidence: 0.8
            }
          }
        ]
      };

      act(() => {
        mockRecognition.onresult(mockEvent);
      });

      expect(result.current.transcript).toBe('Olá');
    });

    it('deve atualizar estado ao iniciar', () => {
      const { result } = renderHook(() => useVoiceRecognition());

      act(() => {
        mockRecognition.onstart();
      });

      expect(result.current.gravando).toBe(true);
      expect(logger.info).toHaveBeenCalledWith(
        'Reconhecimento de voz iniciado',
        expect.any(Object)
      );
    });

    it('deve atualizar estado ao finalizar', () => {
      const { result } = renderHook(() => useVoiceRecognition());

      // Iniciar primeiro
      act(() => {
        mockRecognition.onstart();
      });

      expect(result.current.gravando).toBe(true);

      // Finalizar
      act(() => {
        mockRecognition.onend();
      });

      expect(result.current.gravando).toBe(false);
    });

    it('deve logar erros', () => {
      renderHook(() => useVoiceRecognition());

      const mockError = {
        error: 'network',
        message: 'Network error'
      };

      act(() => {
        mockRecognition.onerror(mockError);
      });

      expect(logger.error).toHaveBeenCalledWith(
        'Erro no reconhecimento de voz',
        expect.objectContaining({
          error: 'network'
        })
      );
    });

    it('não deve logar "no-speech" como erro crítico', () => {
      const { result } = renderHook(() => useVoiceRecognition());

      // Iniciar
      act(() => {
        mockRecognition.onstart();
      });

      const mockError = {
        error: 'no-speech',
        message: 'No speech detected'
      };

      act(() => {
        mockRecognition.onerror(mockError);
      });

      // Deve continuar gravando
      expect(result.current.gravando).toBe(true);
    });
  });

  describe('modo contínuo', () => {
    it('deve reiniciar automaticamente após finalizar', () => {
      vi.useFakeTimers();

      renderHook(() => useVoiceRecognition(true));

      // Simular início e fim
      act(() => {
        mockRecognition.onstart();
      });

      act(() => {
        mockRecognition.onend();
      });

      // Limpar chamadas anteriores
      mockRecognition.start.mockClear();

      // Avançar tempo para o restart
      act(() => {
        vi.advanceTimersByTime(300);
      });

      expect(mockRecognition.start).toHaveBeenCalled();

      vi.useRealTimers();
    });

    it('não deve reiniciar se parado manualmente', () => {
      vi.useFakeTimers();

      const { result } = renderHook(() => useVoiceRecognition(true));

      // Parar manualmente
      act(() => {
        result.current.pararGravacao();
      });

      // Simular fim
      act(() => {
        mockRecognition.onend();
      });

      // Limpar chamadas
      mockRecognition.start.mockClear();

      // Avançar tempo
      act(() => {
        vi.advanceTimersByTime(300);
      });

      expect(mockRecognition.start).not.toHaveBeenCalled();

      vi.useRealTimers();
    });
  });

  describe('limparTranscript', () => {
    it('deve limpar transcript e confidence', () => {
      const { result } = renderHook(() => useVoiceRecognition());

      // Adicionar transcript
      const mockEvent = {
        results: [
          {
            isFinal: true,
            0: {
              transcript: 'Teste',
              confidence: 0.9
            }
          }
        ]
      };

      act(() => {
        mockRecognition.onresult(mockEvent);
      });

      expect(result.current.transcript).toBe('Teste');
      expect(result.current.confidence).toBe(0.9);

      // Limpar
      act(() => {
        result.current.limparTranscript();
      });

      expect(result.current.transcript).toBe('');
      expect(result.current.confidence).toBe(0);
    });
  });

  describe('cleanup', () => {
    it('deve parar reconhecimento ao desmontar', () => {
      const { unmount } = renderHook(() => useVoiceRecognition());

      unmount();

      expect(mockRecognition.stop).toHaveBeenCalled();
    });
  });
});
