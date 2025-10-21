/**
 * Testes unitários para useVoiceSynthesis hook
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useVoiceSynthesis } from '../useVoiceSynthesis';
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

describe('useVoiceSynthesis', () => {
  let mockSpeechSynthesis;
  let mockUtterance;

  beforeEach(() => {
    // Mock SpeechSynthesisUtterance
    mockUtterance = {
      text: '',
      voice: null,
      rate: 1,
      pitch: 1,
      volume: 1,
      lang: '',
      onstart: null,
      onend: null,
      onerror: null
    };

    global.SpeechSynthesisUtterance = vi.fn(() => mockUtterance);

    // Mock speechSynthesis
    mockSpeechSynthesis = {
      speak: vi.fn(),
      cancel: vi.fn(),
      pause: vi.fn(),
      resume: vi.fn(),
      getVoices: vi.fn(() => [
        { name: 'Google português do Brasil', lang: 'pt-BR', default: true },
        { name: 'Microsoft Maria', lang: 'pt-PT', default: false },
        { name: 'Google US English', lang: 'en-US', default: false }
      ]),
      onvoiceschanged: null
    };

    global.window.speechSynthesis = mockSpeechSynthesis;

    // Limpar mocks
    vi.clearAllMocks();
  });

  afterEach(() => {
    delete global.window.speechSynthesis;
    delete global.SpeechSynthesisUtterance;
  });

  describe('inicialização', () => {
    it('deve verificar suporte do navegador', () => {
      const { result } = renderHook(() => useVoiceSynthesis());

      expect(result.current.suportado).toBe(true);
    });

    it('deve detectar quando não há suporte', () => {
      delete global.window.speechSynthesis;

      const { result } = renderHook(() => useVoiceSynthesis());

      expect(result.current.suportado).toBe(false);
      expect(logger.warn).toHaveBeenCalledWith(
        'Síntese de voz não suportada neste navegador'
      );
    });

    it('deve carregar vozes disponíveis', () => {
      const { result } = renderHook(() => useVoiceSynthesis());

      expect(result.current.vozesDisponiveis).toHaveLength(3);
    });

    it('deve selecionar voz em português por padrão', () => {
      const { result } = renderHook(() => useVoiceSynthesis());

      expect(result.current.vozSelecionada?.lang).toContain('pt');
    });
  });

  describe('falarTexto', () => {
    it('deve falar texto simples', () => {
      const { result } = renderHook(() => useVoiceSynthesis(true));

      act(() => {
        result.current.falarTexto('Olá mundo');
      });

      expect(mockSpeechSynthesis.speak).toHaveBeenCalled();
      expect(global.SpeechSynthesisUtterance).toHaveBeenCalledWith('Olá mundo');
    });

    it('não deve falar se voz estiver desabilitada', () => {
      const { result } = renderHook(() => useVoiceSynthesis(false));

      act(() => {
        result.current.falarTexto('Teste');
      });

      expect(mockSpeechSynthesis.speak).not.toHaveBeenCalled();
    });

    it('não deve falar texto vazio', () => {
      const { result } = renderHook(() => useVoiceSynthesis(true));

      act(() => {
        result.current.falarTexto('');
      });

      expect(mockSpeechSynthesis.speak).not.toHaveBeenCalled();
      expect(logger.warn).toHaveBeenCalledWith('Tentativa de falar texto vazio');
    });

    it('deve limpar markdown do texto', () => {
      const { result } = renderHook(() => useVoiceSynthesis(true));

      act(() => {
        result.current.falarTexto('**Negrito** e *itálico*');
      });

      expect(global.SpeechSynthesisUtterance).toHaveBeenCalledWith('Negrito e itálico');
    });

    it('deve limitar tamanho do texto', () => {
      const { result } = renderHook(() => useVoiceSynthesis(true));

      const textoLongo = 'a'.repeat(600);

      act(() => {
        result.current.falarTexto(textoLongo);
      });

      const chamada = global.SpeechSynthesisUtterance.mock.calls[0][0];
      expect(chamada.length).toBeLessThanOrEqual(503); // 500 + '...'
    });

    it('deve cancelar fala anterior antes de iniciar nova', () => {
      const { result } = renderHook(() => useVoiceSynthesis(true));

      act(() => {
        result.current.falarTexto('Primeira');
        // Simular que está falando
        mockUtterance.onstart();
      });

      // Limpar chamadas anteriores
      mockSpeechSynthesis.cancel.mockClear();

      act(() => {
        result.current.falarTexto('Segunda');
      });

      expect(mockSpeechSynthesis.cancel).toHaveBeenCalled();
    });

    it('deve configurar parâmetros de voz', () => {
      const { result } = renderHook(() => useVoiceSynthesis(true));

      act(() => {
        result.current.setConfigVoz({
          rate: 1.5,
          pitch: 1.2,
          volume: 0.8
        });
      });

      act(() => {
        result.current.falarTexto('Teste');
      });

      expect(mockUtterance.rate).toBe(1.5);
      expect(mockUtterance.pitch).toBe(1.2);
      expect(mockUtterance.volume).toBe(0.8);
    });

    it('deve usar voz selecionada', () => {
      const { result } = renderHook(() => useVoiceSynthesis(true));

      const vozCustom = { name: 'Custom Voice', lang: 'pt-BR' };

      act(() => {
        result.current.setVozSelecionada(vozCustom);
      });

      act(() => {
        result.current.falarTexto('Teste');
      });

      expect(mockUtterance.voice).toBe(vozCustom);
    });
  });

  describe('eventos de síntese', () => {
    it('deve atualizar estado ao iniciar fala', () => {
      const { result } = renderHook(() => useVoiceSynthesis(true));

      act(() => {
        result.current.falarTexto('Teste');
      });

      act(() => {
        mockUtterance.onstart();
      });

      expect(result.current.falando).toBe(true);
    });

    it('deve atualizar estado ao finalizar fala', () => {
      const { result } = renderHook(() => useVoiceSynthesis(true));

      act(() => {
        result.current.falarTexto('Teste');
        mockUtterance.onstart();
      });

      expect(result.current.falando).toBe(true);

      act(() => {
        mockUtterance.onend();
      });

      expect(result.current.falando).toBe(false);
    });

    it('deve tratar erros comuns como debug', () => {
      const { result } = renderHook(() => useVoiceSynthesis(true));

      act(() => {
        result.current.falarTexto('Teste');
      });

      act(() => {
        mockUtterance.onerror({ error: 'canceled', message: 'Canceled' });
      });

      expect(logger.debug).toHaveBeenCalledWith(
        'Erro na síntese de voz',
        expect.any(Object)
      );
    });

    it('deve tratar erros críticos como error', () => {
      const { result } = renderHook(() => useVoiceSynthesis(true));

      act(() => {
        result.current.falarTexto('Teste');
      });

      act(() => {
        mockUtterance.onerror({ error: 'network', message: 'Network error' });
      });

      expect(logger.error).toHaveBeenCalledWith(
        'Erro na síntese de voz',
        expect.any(Object)
      );
    });
  });

  describe('pararFala', () => {
    it('deve parar fala em andamento', () => {
      const { result } = renderHook(() => useVoiceSynthesis(true));

      act(() => {
        result.current.falarTexto('Teste');
        mockUtterance.onstart();
      });

      expect(result.current.falando).toBe(true);

      act(() => {
        result.current.pararFala();
      });

      expect(mockSpeechSynthesis.cancel).toHaveBeenCalled();
      expect(result.current.falando).toBe(false);
    });

    it('deve tratar erro ao parar', () => {
      mockSpeechSynthesis.cancel.mockImplementation(() => {
        throw new Error('Cancel error');
      });

      const { result } = renderHook(() => useVoiceSynthesis(true));

      act(() => {
        result.current.pararFala();
      });

      expect(logger.error).toHaveBeenCalled();
    });
  });

  describe('pausarFala', () => {
    it('deve pausar fala em andamento', () => {
      const { result } = renderHook(() => useVoiceSynthesis(true));

      act(() => {
        result.current.falarTexto('Teste');
        mockUtterance.onstart();
      });

      act(() => {
        result.current.pausarFala();
      });

      expect(mockSpeechSynthesis.pause).toHaveBeenCalled();
    });

    it('não deve pausar se não estiver falando', () => {
      const { result } = renderHook(() => useVoiceSynthesis(true));

      act(() => {
        result.current.pausarFala();
      });

      expect(mockSpeechSynthesis.pause).not.toHaveBeenCalled();
    });
  });

  describe('retomarFala', () => {
    it('deve retomar fala pausada', () => {
      const { result } = renderHook(() => useVoiceSynthesis(true));

      act(() => {
        result.current.retomarFala();
      });

      expect(mockSpeechSynthesis.resume).toHaveBeenCalled();
    });
  });

  describe('testarVoz', () => {
    it('deve falar texto de teste', () => {
      const { result } = renderHook(() => useVoiceSynthesis(true));

      act(() => {
        result.current.testarVoz();
      });

      expect(mockSpeechSynthesis.speak).toHaveBeenCalled();
      expect(global.SpeechSynthesisUtterance).toHaveBeenCalledWith(
        expect.stringContaining('demonstração')
      );
    });
  });

  describe('limpeza de markdown', () => {
    it('deve remover negrito', () => {
      const { result } = renderHook(() => useVoiceSynthesis(true));

      act(() => {
        result.current.falarTexto('**texto em negrito**');
      });

      expect(global.SpeechSynthesisUtterance).toHaveBeenCalledWith('texto em negrito');
    });

    it('deve remover itálico', () => {
      const { result } = renderHook(() => useVoiceSynthesis(true));

      act(() => {
        result.current.falarTexto('*texto em itálico*');
      });

      expect(global.SpeechSynthesisUtterance).toHaveBeenCalledWith('texto em itálico');
    });

    it('deve remover headers', () => {
      const { result } = renderHook(() => useVoiceSynthesis(true));

      act(() => {
        result.current.falarTexto('# Título');
      });

      expect(global.SpeechSynthesisUtterance).toHaveBeenCalledWith('Título');
    });

    it('deve remover links mantendo texto', () => {
      const { result } = renderHook(() => useVoiceSynthesis(true));

      act(() => {
        result.current.falarTexto('[clique aqui](http://example.com)');
      });

      expect(global.SpeechSynthesisUtterance).toHaveBeenCalledWith('clique aqui');
    });

    it('deve remover código', () => {
      const { result } = renderHook(() => useVoiceSynthesis(true));

      act(() => {
        result.current.falarTexto('Use `console.log()` para debug');
      });

      expect(global.SpeechSynthesisUtterance).toHaveBeenCalledWith('Use  para debug');
    });

    it('deve converter quebras de linha em vírgulas', () => {
      const { result } = renderHook(() => useVoiceSynthesis(true));

      act(() => {
        result.current.falarTexto('Linha 1\nLinha 2');
      });

      expect(global.SpeechSynthesisUtterance).toHaveBeenCalledWith('Linha 1, Linha 2');
    });
  });

  describe('cleanup', () => {
    it('deve cancelar fala ao desmontar', () => {
      const { result, unmount } = renderHook(() => useVoiceSynthesis(true));

      act(() => {
        result.current.falarTexto('Teste');
        mockUtterance.onstart();
      });

      unmount();

      expect(mockSpeechSynthesis.cancel).toHaveBeenCalled();
    });
  });

  describe('sem suporte', () => {
    it('não deve tentar falar sem suporte', () => {
      delete global.window.speechSynthesis;

      const { result } = renderHook(() => useVoiceSynthesis(true));

      act(() => {
        result.current.falarTexto('Teste');
      });

      expect(logger.warn).toHaveBeenCalledWith(
        'Tentativa de falar sem suporte a síntese de voz'
      );
    });
  });
});
