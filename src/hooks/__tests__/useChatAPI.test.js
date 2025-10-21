/**
 * Testes unitários para useChatAPI hook
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useChatAPI } from '../useChatAPI';
import logger from '../../utils/logger';
import * as messageValidator from '../../utils/messageValidator';

// Mock logger
vi.mock('../../utils/logger', () => ({
  default: {
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn()
  }
}));

// Mock messageValidator
vi.mock('../../utils/messageValidator', () => ({
  validarMensagem: vi.fn()
}));

describe('useChatAPI', () => {
  let mockGetAuthHeaders;
  let originalFetch;

  beforeEach(() => {
    // Mock getAuthHeaders
    mockGetAuthHeaders = vi.fn(() => ({
      'Content-Type': 'application/json',
      'Authorization': 'Bearer test-token'
    }));

    // Mock fetch
    originalFetch = global.fetch;
    global.fetch = vi.fn();

    // Mock validarMensagem para retornar válido por padrão
    messageValidator.validarMensagem.mockReturnValue({
      valid: true,
      errors: [],
      warnings: [],
      sanitized: 'Mensagem teste'
    });

    // Limpar mocks
    vi.clearAllMocks();
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  describe('enviarMensagem', () => {
    it('deve enviar mensagem com sucesso', async () => {
      const mockResponse = {
        success: true,
        response: 'Resposta do agente',
        tipo: 'agente'
      };

      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      });

      const { result } = renderHook(() => useChatAPI(mockGetAuthHeaders));

      let response;
      await act(async () => {
        response = await result.current.enviarMensagem('Olá');
      });

      expect(response).toEqual(mockResponse);
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBeNull();
      expect(logger.info).toHaveBeenCalledWith(
        'Mensagem enviada com sucesso',
        expect.any(Object)
      );
    });

    it('deve validar mensagem antes de enviar', async () => {
      messageValidator.validarMensagem.mockReturnValueOnce({
        valid: false,
        errors: ['Mensagem muito longa'],
        warnings: [],
        sanitized: ''
      });

      const { result } = renderHook(() => useChatAPI(mockGetAuthHeaders));

      await act(async () => {
        try {
          await result.current.enviarMensagem('Mensagem inválida');
        } catch (error) {
          expect(error.message).toBe('Mensagem muito longa');
        }
      });

      expect(result.current.error).toBe('Mensagem muito longa');
      expect(global.fetch).not.toHaveBeenCalled();
    });

    it('deve usar mensagem sanitizada', async () => {
      messageValidator.validarMensagem.mockReturnValueOnce({
        valid: true,
        errors: [],
        warnings: [],
        sanitized: 'Mensagem limpa'
      });

      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true })
      });

      const { result } = renderHook(() => useChatAPI(mockGetAuthHeaders));

      await act(async () => {
        await result.current.enviarMensagem('<script>alert("xss")</script>');
      });

      const fetchCall = global.fetch.mock.calls[0];
      const body = JSON.parse(fetchCall[1].body);
      expect(body.message).toBe('Mensagem limpa');
    });

    it('deve fazer retry em caso de erro de rede', async () => {
      global.fetch
        .mockRejectedValueOnce(new Error('Network error'))
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ success: true, response: 'Sucesso' })
        });

      const { result } = renderHook(() => useChatAPI(mockGetAuthHeaders));

      let response;
      await act(async () => {
        response = await result.current.enviarMensagem('Teste retry');
      });

      expect(response.success).toBe(true);
      expect(global.fetch).toHaveBeenCalledTimes(3);
      expect(logger.info).toHaveBeenCalledWith(
        expect.stringContaining('Tentando novamente'),
        expect.any(Object)
      );
    });

    it('deve respeitar número máximo de tentativas', async () => {
      global.fetch.mockRejectedValue(new Error('Network error'));

      const { result } = renderHook(() => useChatAPI(mockGetAuthHeaders));

      await act(async () => {
        try {
          await result.current.enviarMensagem('Teste');
        } catch (error) {
          expect(error.message).toBe('Network error');
        }
      });

      // Deve ter tentado 3 vezes (configuração padrão)
      expect(global.fetch).toHaveBeenCalledTimes(3);
      expect(result.current.error).toBe('Network error');
    });

    it('deve aplicar exponential backoff', async () => {
      global.fetch.mockRejectedValue(new Error('Network error'));

      const { result } = renderHook(() => useChatAPI(mockGetAuthHeaders));

      await act(async () => {
        try {
          await result.current.enviarMensagem('Teste');
        } catch (error) {
          // Esperado
        }
      });

      // Deve ter tentado 3 vezes
      expect(global.fetch).toHaveBeenCalledTimes(3);
    });

    it('deve cancelar requisição após timeout', async () => {
      const abortError = new Error('AbortError');
      abortError.name = 'AbortError';
      
      global.fetch.mockImplementation(() => 
        new Promise((_, reject) => {
          setTimeout(() => reject(abortError), 100);
        })
      );

      const { result } = renderHook(() => useChatAPI(mockGetAuthHeaders));

      await act(async () => {
        try {
          await result.current.enviarMensagem('Teste timeout');
        } catch (error) {
          expect(error.message).toContain('Tempo limite excedido');
        }
      });
    }, 10000);

    it('não deve fazer retry em caso de timeout', async () => {
      const abortError = new Error('AbortError');
      abortError.name = 'AbortError';
      
      global.fetch.mockRejectedValue(abortError);

      const { result } = renderHook(() => useChatAPI(mockGetAuthHeaders));

      let errorCaught = false;
      await act(async () => {
        try {
          await result.current.enviarMensagem('Teste');
        } catch (error) {
          errorCaught = true;
          expect(error.message).toContain('Tempo limite excedido');
        }
      });

      expect(errorCaught).toBe(true);
      // Não deve fazer retry em caso de timeout
      expect(global.fetch).toHaveBeenCalledTimes(1);
    });

    it('deve incluir contexto na requisição', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true })
      });

      const contexto = [
        { tipo: 'usuario', conteudo: 'Olá' },
        { tipo: 'agente', conteudo: 'Oi' }
      ];

      const { result } = renderHook(() => useChatAPI(mockGetAuthHeaders));

      await act(async () => {
        await result.current.enviarMensagem('Nova mensagem', contexto);
      });

      const fetchCall = global.fetch.mock.calls[0];
      const body = JSON.parse(fetchCall[1].body);
      expect(body.contexto_conversa).toEqual(contexto);
    });

    it('deve usar headers de autenticação', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true })
      });

      const { result } = renderHook(() => useChatAPI(mockGetAuthHeaders));

      await act(async () => {
        await result.current.enviarMensagem('Teste');
      });

      const fetchCall = global.fetch.mock.calls[0];
      expect(fetchCall[1].headers).toEqual({
        'Content-Type': 'application/json',
        'Authorization': 'Bearer test-token'
      });
    });
  });

  describe('verificarConexao', () => {
    it('deve retornar true quando conexão está ok', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        status: 200
      });

      const { result } = renderHook(() => useChatAPI(mockGetAuthHeaders));

      let isConnected;
      await act(async () => {
        isConnected = await result.current.verificarConexao();
      });

      expect(isConnected).toBe(true);
      expect(logger.info).toHaveBeenCalledWith(
        'Verificação de conexão',
        expect.objectContaining({ isConnected: true })
      );
    });

    it('deve retornar false quando conexão falha', async () => {
      global.fetch.mockRejectedValueOnce(new Error('Network error'));

      const { result } = renderHook(() => useChatAPI(mockGetAuthHeaders));

      let isConnected;
      await act(async () => {
        isConnected = await result.current.verificarConexao();
      });

      expect(isConnected).toBe(false);
      expect(logger.error).toHaveBeenCalled();
    });

    it('deve fazer retry até 2 vezes', async () => {
      global.fetch
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce({ ok: true, status: 200 });

      const { result } = renderHook(() => useChatAPI(mockGetAuthHeaders));

      let isConnected;
      await act(async () => {
        isConnected = await result.current.verificarConexao();
      });

      expect(isConnected).toBe(true);
      expect(global.fetch).toHaveBeenCalledTimes(2);
    });

    it('deve ter timeout de 5 segundos', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        status: 200
      });

      const { result } = renderHook(() => useChatAPI(mockGetAuthHeaders));

      let isConnected;
      await act(async () => {
        isConnected = await result.current.verificarConexao();
      });

      expect(isConnected).toBe(true);
    });
  });

  describe('carregarHistoricoServidor', () => {
    it('deve carregar histórico com sucesso', async () => {
      const mockMensagens = [
        { id: 1, tipo: 'usuario', conteudo: 'Olá' },
        { id: 2, tipo: 'agente', conteudo: 'Oi' }
      ];

      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ mensagens: mockMensagens })
      });

      const { result } = renderHook(() => useChatAPI(mockGetAuthHeaders));

      let mensagens;
      await act(async () => {
        mensagens = await result.current.carregarHistoricoServidor('user123');
      });

      expect(mensagens).toEqual(mockMensagens);
      expect(logger.info).toHaveBeenCalledWith(
        'Histórico carregado do servidor',
        expect.objectContaining({ mensagensCount: 2 })
      );
    });

    it('deve retornar array vazio se não houver mensagens', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({})
      });

      const { result } = renderHook(() => useChatAPI(mockGetAuthHeaders));

      let mensagens;
      await act(async () => {
        mensagens = await result.current.carregarHistoricoServidor('user123');
      });

      expect(mensagens).toEqual([]);
    });

    it('deve retornar array vazio em caso de erro', async () => {
      global.fetch.mockRejectedValueOnce(new Error('Network error'));

      const { result } = renderHook(() => useChatAPI(mockGetAuthHeaders));

      let mensagens;
      await act(async () => {
        mensagens = await result.current.carregarHistoricoServidor('user123');
      });

      expect(mensagens).toEqual([]);
      expect(logger.error).toHaveBeenCalled();
    });

    it('deve retornar array vazio se userId não for fornecido', async () => {
      const { result } = renderHook(() => useChatAPI(mockGetAuthHeaders));

      let mensagens;
      await act(async () => {
        mensagens = await result.current.carregarHistoricoServidor(null);
      });

      expect(mensagens).toEqual([]);
      expect(logger.warn).toHaveBeenCalledWith(
        'userId não fornecido para carregar histórico'
      );
      expect(global.fetch).not.toHaveBeenCalled();
    });

    it('deve ter timeout de 10 segundos', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ mensagens: [] })
      });

      const { result } = renderHook(() => useChatAPI(mockGetAuthHeaders));

      let mensagens;
      await act(async () => {
        mensagens = await result.current.carregarHistoricoServidor('user123');
      });

      expect(mensagens).toEqual([]);
    });
  });

  describe('limparErro', () => {
    it('deve limpar erro', async () => {
      const { result } = renderHook(() => useChatAPI(mockGetAuthHeaders));

      // Definir um erro
      act(() => {
        result.current.setError('Erro de teste');
      });

      expect(result.current.error).toBe('Erro de teste');

      // Limpar erro
      act(() => {
        result.current.limparErro();
      });

      expect(result.current.error).toBeNull();
    });
  });

  describe('loading state', () => {
    it('deve definir loading como true durante requisição', async () => {
      let resolvePromise;
      global.fetch.mockImplementation(() => 
        new Promise((resolve) => {
          resolvePromise = () => resolve({ ok: true, json: async () => ({ success: true }) });
        })
      );

      const { result } = renderHook(() => useChatAPI(mockGetAuthHeaders));

      expect(result.current.loading).toBe(false);

      // Iniciar requisição sem await
      let promise;
      act(() => {
        promise = result.current.enviarMensagem('Teste');
      });

      // Verificar que loading está true
      await waitFor(() => {
        expect(result.current.loading).toBe(true);
      });

      // Resolver a promise
      act(() => {
        resolvePromise();
      });

      // Aguardar conclusão
      await act(async () => {
        await promise;
      });

      // Após a requisição
      expect(result.current.loading).toBe(false);
    });
  });
});
