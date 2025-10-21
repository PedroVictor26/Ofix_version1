/**
 * Testes unitários para useChatHistory hook
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useChatHistory } from '../useChatHistory';
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

// Mock lodash debounce
vi.mock('lodash', () => ({
  debounce: (fn) => {
    const debounced = (...args) => fn(...args);
    debounced.cancel = vi.fn();
    return debounced;
  }
}));

describe('useChatHistory', () => {
  let mockLocalStorage;

  beforeEach(() => {
    // Mock localStorage
    mockLocalStorage = {
      getItem: vi.fn(),
      setItem: vi.fn(),
      removeItem: vi.fn()
    };
    global.localStorage = mockLocalStorage;

    // Limpar mocks
    vi.clearAllMocks();
  });

  describe('adicionarMensagem', () => {
    it('deve adicionar mensagem ao histórico', () => {
      const { result } = renderHook(() => useChatHistory('user123'));

      act(() => {
        result.current.adicionarMensagem({
          id: 1,
          tipo: 'usuario',
          conteudo: 'Olá',
          timestamp: new Date().toISOString()
        });
      });

      expect(result.current.conversas).toHaveLength(1);
      expect(result.current.conversas[0].conteudo).toBe('Olá');
    });

    it('deve salvar no localStorage após adicionar', () => {
      const { result } = renderHook(() => useChatHistory('user123'));

      act(() => {
        result.current.adicionarMensagem({
          id: 1,
          tipo: 'usuario',
          conteudo: 'Teste',
          timestamp: new Date().toISOString()
        });
      });

      expect(mockLocalStorage.setItem).toHaveBeenCalled();
    });

    it('deve limitar histórico a 100 mensagens', () => {
      const { result } = renderHook(() => useChatHistory('user123'));

      act(() => {
        for (let i = 0; i < 150; i++) {
          result.current.adicionarMensagem({
            id: i,
            tipo: 'usuario',
            conteudo: `Mensagem ${i}`,
            timestamp: new Date().toISOString()
          });
        }
      });

      expect(result.current.conversas).toHaveLength(100);
      // Deve manter as últimas 100 mensagens
      expect(result.current.conversas[0].id).toBe(50);
      expect(result.current.conversas[99].id).toBe(149);
    });
  });

  describe('adicionarMensagens', () => {
    it('deve adicionar múltiplas mensagens', () => {
      const { result } = renderHook(() => useChatHistory('user123'));

      const mensagens = [
        { id: 1, tipo: 'usuario', conteudo: 'Msg 1', timestamp: '' },
        { id: 2, tipo: 'agente', conteudo: 'Msg 2', timestamp: '' },
        { id: 3, tipo: 'usuario', conteudo: 'Msg 3', timestamp: '' }
      ];

      act(() => {
        result.current.adicionarMensagens(mensagens);
      });

      expect(result.current.conversas).toHaveLength(3);
    });

    it('deve aplicar limite ao adicionar múltiplas mensagens', () => {
      const { result } = renderHook(() => useChatHistory('user123'));

      const mensagens = Array.from({ length: 120 }, (_, i) => ({
        id: i,
        tipo: 'usuario',
        conteudo: `Msg ${i}`,
        timestamp: ''
      }));

      act(() => {
        result.current.adicionarMensagens(mensagens);
      });

      expect(result.current.conversas).toHaveLength(100);
    });
  });

  describe('limparHistorico', () => {
    it('deve limpar histórico', () => {
      const { result } = renderHook(() => useChatHistory('user123'));

      act(() => {
        result.current.adicionarMensagem({
          id: 1,
          tipo: 'usuario',
          conteudo: 'Teste',
          timestamp: ''
        });
      });

      expect(result.current.conversas).toHaveLength(1);

      act(() => {
        result.current.limparHistorico();
      });

      expect(result.current.conversas).toHaveLength(0);
      expect(mockLocalStorage.removeItem).toHaveBeenCalled();
    });

    it('deve logar ao limpar histórico', () => {
      const { result } = renderHook(() => useChatHistory('user123'));

      act(() => {
        result.current.limparHistorico();
      });

      expect(logger.info).toHaveBeenCalledWith(
        'Histórico limpo',
        expect.any(Object)
      );
    });
  });

  describe('carregarHistorico', () => {
    it('deve carregar histórico do localStorage', async () => {
      const savedData = {
        conversas: [
          { id: 1, tipo: 'usuario', conteudo: 'Olá', timestamp: '' },
          { id: 2, tipo: 'agente', conteudo: 'Oi', timestamp: '' }
        ],
        timestamp: new Date().toISOString(),
        userId: 'user123',
        version: '1.0'
      };

      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(savedData));

      const { result } = renderHook(() => useChatHistory('user123'));

      await act(async () => {
        await result.current.carregarHistorico();
      });

      expect(result.current.conversas).toHaveLength(2);
      expect(result.current.conversas[0].conteudo).toBe('Olá');
    });

    it('deve retornar array vazio se não houver histórico', async () => {
      mockLocalStorage.getItem.mockReturnValue(null);

      const { result } = renderHook(() => useChatHistory('user123'));

      await act(async () => {
        await result.current.carregarHistorico();
      });

      expect(result.current.conversas).toHaveLength(0);
    });

    it('deve tratar erro ao carregar histórico', async () => {
      mockLocalStorage.getItem.mockReturnValue('invalid json');

      const { result } = renderHook(() => useChatHistory('user123'));

      await act(async () => {
        await result.current.carregarHistorico();
      });

      expect(logger.error).toHaveBeenCalled();
      expect(result.current.conversas).toHaveLength(0);
    });

    it('deve validar estrutura do histórico', async () => {
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify({
        invalid: 'structure'
      }));

      const { result } = renderHook(() => useChatHistory('user123'));

      await act(async () => {
        await result.current.carregarHistorico();
      });

      expect(logger.warn).toHaveBeenCalledWith(
        'Histórico com estrutura inválida',
        expect.any(Object)
      );
    });
  });

  describe('obterContexto', () => {
    it('deve retornar últimas mensagens como contexto', () => {
      const { result } = renderHook(() => useChatHistory('user123'));

      act(() => {
        result.current.adicionarMensagens([
          { id: 1, tipo: 'usuario', conteudo: 'Msg 1', timestamp: '' },
          { id: 2, tipo: 'agente', conteudo: 'Msg 2', timestamp: '' },
          { id: 3, tipo: 'usuario', conteudo: 'Msg 3', timestamp: '' },
          { id: 4, tipo: 'agente', conteudo: 'Msg 4', timestamp: '' }
        ]);
      });

      const contexto = result.current.obterContexto(2);

      expect(contexto).toHaveLength(2);
      expect(contexto[0].conteudo).toBe('Msg 3');
      expect(contexto[1].conteudo).toBe('Msg 4');
    });

    it('deve usar quantidade padrão de 5 mensagens', () => {
      const { result } = renderHook(() => useChatHistory('user123'));

      act(() => {
        const mensagens = Array.from({ length: 15 }, (_, i) => ({
          id: i,
          tipo: 'usuario',
          conteudo: `Msg ${i}`,
          timestamp: ''
        }));
        result.current.adicionarMensagens(mensagens);
      });

      const contexto = result.current.obterContexto();

      expect(contexto).toHaveLength(5);
      // Deve retornar as últimas 5 mensagens
      expect(contexto[0].conteudo).toBe('Msg 10');
      expect(contexto[4].conteudo).toBe('Msg 14');
    });
  });

  describe('buscarPorTipo', () => {
    it('deve buscar mensagens por tipo', () => {
      const { result } = renderHook(() => useChatHistory('user123'));

      act(() => {
        result.current.adicionarMensagens([
          { id: 1, tipo: 'usuario', conteudo: 'Msg 1', timestamp: '' },
          { id: 2, tipo: 'agente', conteudo: 'Msg 2', timestamp: '' },
          { id: 3, tipo: 'usuario', conteudo: 'Msg 3', timestamp: '' },
          { id: 4, tipo: 'sistema', conteudo: 'Msg 4', timestamp: '' }
        ]);
      });

      const mensagensUsuario = result.current.buscarPorTipo('usuario');
      const mensagensAgente = result.current.buscarPorTipo('agente');

      expect(mensagensUsuario).toHaveLength(2);
      expect(mensagensAgente).toHaveLength(1);
    });

    it('deve retornar array vazio se não encontrar tipo', () => {
      const { result } = renderHook(() => useChatHistory('user123'));

      const mensagens = result.current.buscarPorTipo('inexistente');

      expect(mensagens).toHaveLength(0);
    });
  });

  describe('obterEstatisticas', () => {
    it('deve retornar estatísticas do histórico', () => {
      const { result } = renderHook(() => useChatHistory('user123'));

      act(() => {
        result.current.adicionarMensagens([
          { id: 1, tipo: 'usuario', conteudo: 'Msg 1', timestamp: '2024-01-01' },
          { id: 2, tipo: 'agente', conteudo: 'Msg 2', timestamp: '2024-01-02' },
          { id: 3, tipo: 'usuario', conteudo: 'Msg 3', timestamp: '2024-01-03' }
        ]);
      });

      const stats = result.current.obterEstatisticas();

      expect(stats.total).toBe(3);
      expect(stats.porTipo.usuario).toBe(2);
      expect(stats.porTipo.agente).toBe(1);
      expect(stats.primeira).toBe('2024-01-01');
      expect(stats.ultima).toBe('2024-01-03');
    });

    it('deve retornar estatísticas vazias para histórico vazio', () => {
      const { result } = renderHook(() => useChatHistory('user123'));

      const stats = result.current.obterEstatisticas();

      expect(stats.total).toBe(0);
      expect(stats.porTipo).toEqual({});
      expect(stats.primeira).toBeUndefined();
      expect(stats.ultima).toBeUndefined();
    });
  });

  describe('setConversasCompleto', () => {
    it('deve substituir todas as conversas', () => {
      const { result } = renderHook(() => useChatHistory('user123'));

      act(() => {
        result.current.adicionarMensagem({
          id: 1,
          tipo: 'usuario',
          conteudo: 'Antiga',
          timestamp: ''
        });
      });

      expect(result.current.conversas).toHaveLength(1);

      act(() => {
        result.current.setConversasCompleto([
          { id: 2, tipo: 'agente', conteudo: 'Nova 1', timestamp: '' },
          { id: 3, tipo: 'agente', conteudo: 'Nova 2', timestamp: '' }
        ]);
      });

      expect(result.current.conversas).toHaveLength(2);
      expect(result.current.conversas[0].conteudo).toBe('Nova 1');
    });

    it('deve aplicar limite ao substituir conversas', () => {
      const { result } = renderHook(() => useChatHistory('user123'));

      const novasConversas = Array.from({ length: 120 }, (_, i) => ({
        id: i,
        tipo: 'usuario',
        conteudo: `Msg ${i}`,
        timestamp: ''
      }));

      act(() => {
        result.current.setConversasCompleto(novasConversas);
      });

      expect(result.current.conversas).toHaveLength(100);
    });
  });

  describe('removerMensagem', () => {
    it('deve remover mensagem por ID', () => {
      const { result } = renderHook(() => useChatHistory('user123'));

      act(() => {
        result.current.adicionarMensagens([
          { id: 1, tipo: 'usuario', conteudo: 'Msg 1', timestamp: '' },
          { id: 2, tipo: 'agente', conteudo: 'Msg 2', timestamp: '' },
          { id: 3, tipo: 'usuario', conteudo: 'Msg 3', timestamp: '' }
        ]);
      });

      expect(result.current.conversas).toHaveLength(3);

      act(() => {
        result.current.removerMensagem(2);
      });

      expect(result.current.conversas).toHaveLength(2);
      expect(result.current.conversas.find(c => c.id === 2)).toBeUndefined();
    });

    it('deve salvar após remover mensagem', () => {
      const { result } = renderHook(() => useChatHistory('user123'));

      act(() => {
        result.current.adicionarMensagem({
          id: 1,
          tipo: 'usuario',
          conteudo: 'Teste',
          timestamp: ''
        });
      });

      vi.clearAllMocks();

      act(() => {
        result.current.removerMensagem(1);
      });

      expect(mockLocalStorage.setItem).toHaveBeenCalled();
    });
  });

  describe('loading state', () => {
    it('deve definir loading durante carregamento', async () => {
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify({
        conversas: [],
        timestamp: new Date().toISOString()
      }));

      const { result } = renderHook(() => useChatHistory('user123'));

      expect(result.current.loading).toBe(false);

      const promise = act(async () => {
        await result.current.carregarHistorico();
      });

      await promise;

      expect(result.current.loading).toBe(false);
    });
  });

  describe('storageKey', () => {
    it('deve usar userId na chave de storage', () => {
      const { result } = renderHook(() => useChatHistory('user123'));

      act(() => {
        result.current.adicionarMensagem({
          id: 1,
          tipo: 'usuario',
          conteudo: 'Teste',
          timestamp: ''
        });
      });

      const storageKey = mockLocalStorage.setItem.mock.calls[0][0];
      expect(storageKey).toContain('user123');
    });

    it('deve usar "anonymous" se userId não for fornecido', () => {
      const { result } = renderHook(() => useChatHistory());

      act(() => {
        result.current.adicionarMensagem({
          id: 1,
          tipo: 'usuario',
          conteudo: 'Teste',
          timestamp: ''
        });
      });

      const storageKey = mockLocalStorage.setItem.mock.calls[0][0];
      expect(storageKey).toContain('anonymous');
    });
  });
});
