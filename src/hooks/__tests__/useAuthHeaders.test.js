/**
 * Testes unitários para useAuthHeaders hook
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useAuthHeaders } from '../useAuthHeaders';
import logger from '../../utils/logger';

// Mock logger
vi.mock('../../utils/logger', () => ({
  default: {
    warn: vi.fn(),
    error: vi.fn(),
    info: vi.fn()
  }
}));

describe('useAuthHeaders', () => {
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

  describe('getAuthHeaders', () => {
    it('deve retornar headers básicos sem token', () => {
      mockLocalStorage.getItem.mockReturnValue(null);

      const { result } = renderHook(() => useAuthHeaders());
      const headers = result.current.getAuthHeaders();

      expect(headers).toEqual({
        'Content-Type': 'application/json'
      });
    });

    it('deve incluir Authorization header quando token existe', () => {
      const tokenData = {
        token: 'abc123',
        expiresAt: new Date(Date.now() + 86400000).toISOString()
      };
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(tokenData));

      const { result } = renderHook(() => useAuthHeaders());
      const headers = result.current.getAuthHeaders();

      expect(headers).toEqual({
        'Content-Type': 'application/json',
        'Authorization': 'Bearer abc123'
      });
    });

    it('deve logar warning quando token é inválido', () => {
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify({ invalid: 'data' }));

      const { result } = renderHook(() => useAuthHeaders());
      result.current.getAuthHeaders();

      expect(logger.warn).toHaveBeenCalledWith(
        'Token encontrado mas inválido',
        expect.any(Object)
      );
    });

    it('deve tratar erro ao parsear JSON', () => {
      mockLocalStorage.getItem.mockReturnValue('invalid json');

      const { result } = renderHook(() => useAuthHeaders());
      const headers = result.current.getAuthHeaders();

      expect(logger.error).toHaveBeenCalledWith(
        'Erro ao processar token de autenticação',
        expect.any(Object)
      );
      expect(headers).toEqual({
        'Content-Type': 'application/json'
      });
    });
  });

  describe('isAuthenticated', () => {
    it('deve retornar false quando não há token', () => {
      mockLocalStorage.getItem.mockReturnValue(null);

      const { result } = renderHook(() => useAuthHeaders());
      const isAuth = result.current.isAuthenticated();

      expect(isAuth).toBe(false);
    });

    it('deve retornar true quando token é válido', () => {
      const tokenData = {
        token: 'abc123',
        expiresAt: new Date(Date.now() + 86400000).toISOString()
      };
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(tokenData));

      const { result } = renderHook(() => useAuthHeaders());
      const isAuth = result.current.isAuthenticated();

      expect(isAuth).toBe(true);
    });

    it('deve retornar false quando token está expirado', () => {
      const tokenData = {
        token: 'abc123',
        expiresAt: new Date(Date.now() - 1000).toISOString() // Expirado
      };
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(tokenData));

      const { result } = renderHook(() => useAuthHeaders());
      const isAuth = result.current.isAuthenticated();

      expect(isAuth).toBe(false);
      expect(logger.warn).toHaveBeenCalledWith(
        'Token expirado',
        expect.any(Object)
      );
    });

    it('deve retornar true quando não há data de expiração', () => {
      const tokenData = {
        token: 'abc123'
      };
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(tokenData));

      const { result } = renderHook(() => useAuthHeaders());
      const isAuth = result.current.isAuthenticated();

      expect(isAuth).toBe(true);
    });
  });

  describe('getTokenData', () => {
    it('deve retornar dados do token', () => {
      const tokenData = {
        token: 'abc123',
        userId: '123',
        expiresAt: new Date().toISOString()
      };
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(tokenData));

      const { result } = renderHook(() => useAuthHeaders());
      const data = result.current.getTokenData();

      expect(data).toEqual(tokenData);
    });

    it('deve retornar null quando não há token', () => {
      mockLocalStorage.getItem.mockReturnValue(null);

      const { result } = renderHook(() => useAuthHeaders());
      const data = result.current.getTokenData();

      expect(data).toBeNull();
    });

    it('deve retornar null em caso de erro', () => {
      mockLocalStorage.getItem.mockReturnValue('invalid json');

      const { result } = renderHook(() => useAuthHeaders());
      const data = result.current.getTokenData();

      expect(data).toBeNull();
      expect(logger.error).toHaveBeenCalled();
    });
  });

  describe('getUserId', () => {
    it('deve retornar userId do token', () => {
      const tokenData = {
        token: 'abc123',
        userId: '123'
      };
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(tokenData));

      const { result } = renderHook(() => useAuthHeaders());
      const userId = result.current.getUserId();

      expect(userId).toBe('123');
    });

    it('deve retornar id se userId não existir', () => {
      const tokenData = {
        token: 'abc123',
        id: '456'
      };
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(tokenData));

      const { result } = renderHook(() => useAuthHeaders());
      const userId = result.current.getUserId();

      expect(userId).toBe('456');
    });

    it('deve retornar null quando não há token', () => {
      mockLocalStorage.getItem.mockReturnValue(null);

      const { result } = renderHook(() => useAuthHeaders());
      const userId = result.current.getUserId();

      expect(userId).toBeNull();
    });
  });

  describe('isTokenExpiringSoon', () => {
    it('deve retornar true quando token expira em menos de 5 minutos', () => {
      const tokenData = {
        token: 'abc123',
        expiresAt: new Date(Date.now() + 2 * 60 * 1000).toISOString() // 2 minutos
      };
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(tokenData));

      const { result } = renderHook(() => useAuthHeaders());
      const expiringSoon = result.current.isTokenExpiringSoon();

      expect(expiringSoon).toBe(true);
    });

    it('deve retornar false quando token expira em mais de 5 minutos', () => {
      const tokenData = {
        token: 'abc123',
        expiresAt: new Date(Date.now() + 10 * 60 * 1000).toISOString() // 10 minutos
      };
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(tokenData));

      const { result } = renderHook(() => useAuthHeaders());
      const expiringSoon = result.current.isTokenExpiringSoon();

      expect(expiringSoon).toBe(false);
    });

    it('deve retornar false quando não há data de expiração', () => {
      const tokenData = {
        token: 'abc123'
      };
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(tokenData));

      const { result } = renderHook(() => useAuthHeaders());
      const expiringSoon = result.current.isTokenExpiringSoon();

      expect(expiringSoon).toBe(false);
    });
  });

  describe('clearAuth', () => {
    it('deve remover token do localStorage', () => {
      const { result } = renderHook(() => useAuthHeaders());
      
      act(() => {
        result.current.clearAuth();
      });

      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('authToken');
      expect(logger.info).toHaveBeenCalledWith('Token de autenticação removido');
    });

    it('deve tratar erro ao limpar token', () => {
      mockLocalStorage.removeItem.mockImplementation(() => {
        throw new Error('Storage error');
      });

      const { result } = renderHook(() => useAuthHeaders());
      
      act(() => {
        result.current.clearAuth();
      });

      expect(logger.error).toHaveBeenCalledWith(
        'Erro ao limpar autenticação',
        expect.any(Object)
      );
    });
  });

  describe('setAuthToken', () => {
    it('deve salvar token no localStorage', () => {
      const { result } = renderHook(() => useAuthHeaders());
      
      act(() => {
        result.current.setAuthToken('new-token-123', 3600);
      });

      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        'authToken',
        expect.stringContaining('new-token-123')
      );
      expect(logger.info).toHaveBeenCalledWith(
        'Token de autenticação salvo',
        expect.any(Object)
      );
    });

    it('deve calcular data de expiração corretamente', () => {
      const { result } = renderHook(() => useAuthHeaders());
      const now = Date.now();
      
      act(() => {
        result.current.setAuthToken('token', 3600); // 1 hora
      });

      const savedData = JSON.parse(mockLocalStorage.setItem.mock.calls[0][1]);
      const expiresAt = new Date(savedData.expiresAt).getTime();
      
      // Deve expirar em aproximadamente 1 hora
      expect(expiresAt).toBeGreaterThan(now + 3500 * 1000);
      expect(expiresAt).toBeLessThan(now + 3700 * 1000);
    });

    it('deve usar expiração padrão de 24h', () => {
      const { result } = renderHook(() => useAuthHeaders());
      
      act(() => {
        result.current.setAuthToken('token');
      });

      const savedData = JSON.parse(mockLocalStorage.setItem.mock.calls[0][1]);
      const expiresAt = new Date(savedData.expiresAt).getTime();
      const now = Date.now();
      
      // Deve expirar em aproximadamente 24 horas
      expect(expiresAt).toBeGreaterThan(now + 86000 * 1000);
      expect(expiresAt).toBeLessThan(now + 87000 * 1000);
    });

    it('deve tratar erro ao salvar token', () => {
      mockLocalStorage.setItem.mockImplementation(() => {
        throw new Error('Storage error');
      });

      const { result } = renderHook(() => useAuthHeaders());
      
      act(() => {
        result.current.setAuthToken('token');
      });

      expect(logger.error).toHaveBeenCalledWith(
        'Erro ao salvar token',
        expect.any(Object)
      );
    });
  });
});
