/**
 * Testes unitários para o sistema de logging
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { Logger, LOG_LEVELS } from '../logger';

describe('Logger', () => {
  let logger;
  let originalFetch;
  let originalConsole;

  beforeEach(() => {
    // Mock fetch
    originalFetch = global.fetch;
    global.fetch = vi.fn(() => Promise.resolve({ ok: true }));

    // Mock console
    originalConsole = {
      error: console.error,
      warn: console.warn,
      info: console.info,
      debug: console.debug
    };
    console.error = vi.fn();
    console.warn = vi.fn();
    console.info = vi.fn();
    console.debug = vi.fn();

    // Mock localStorage e sessionStorage
    global.localStorage = {
      getItem: vi.fn(),
      setItem: vi.fn()
    };
    global.sessionStorage = {
      getItem: vi.fn(),
      setItem: vi.fn()
    };

    // Mock navigator
    global.navigator = {
      userAgent: 'Test Browser',
      sendBeacon: vi.fn()
    };

    // Mock window.location
    delete window.location;
    window.location = { href: 'http://localhost:3000/test' };

    logger = new Logger();
  });

  afterEach(() => {
    global.fetch = originalFetch;
    console.error = originalConsole.error;
    console.warn = originalConsole.warn;
    console.info = originalConsole.info;
    console.debug = originalConsole.debug;
  });

  describe('formatLogData', () => {
    it('deve formatar dados do log corretamente', () => {
      const logData = logger.formatLogData(LOG_LEVELS.ERROR, 'Test error', {
        context: 'test'
      });

      expect(logData).toHaveProperty('timestamp');
      expect(logData).toHaveProperty('level', LOG_LEVELS.ERROR);
      expect(logData).toHaveProperty('message', 'Test error');
      expect(logData).toHaveProperty('environment');
      expect(logData).toHaveProperty('userAgent', 'Test Browser');
      expect(logData).toHaveProperty('url', 'http://localhost:3000/test');
      expect(logData).toHaveProperty('sessionId');
      expect(logData).toHaveProperty('context', 'test');
    });

    it('deve incluir userId se disponível', () => {
      global.localStorage.getItem.mockReturnValue(
        JSON.stringify({ userId: '123' })
      );

      const logData = logger.formatLogData(LOG_LEVELS.INFO, 'Test');

      expect(logData).toHaveProperty('userId', '123');
    });

    it('deve criar sessionId se não existir', () => {
      global.sessionStorage.getItem.mockReturnValue(null);

      logger.getSessionId();

      expect(global.sessionStorage.setItem).toHaveBeenCalledWith(
        'logger_session_id',
        expect.stringContaining('session_')
      );
    });
  });

  describe('error', () => {
    it('deve logar erro no console em desenvolvimento', () => {
      logger.isDevelopment = true;

      logger.error('Test error', { detail: 'test' });

      expect(console.error).toHaveBeenCalledWith(
        '[ERROR] Test error',
        { detail: 'test' }
      );
    });

    it('deve adicionar erro à fila em produção', () => {
      logger.isDevelopment = false;

      logger.error('Test error');

      expect(logger.logQueue.length).toBe(1);
      expect(logger.logQueue[0].message).toBe('Test error');
    });

    it('deve respeitar rate limiting', () => {
      logger.isDevelopment = false;
      logger.maxLogsPerWindow = 2;

      logger.error('Same error');
      logger.error('Same error');
      logger.error('Same error'); // Deve ser bloqueado

      expect(logger.logQueue.length).toBe(2);
    });
  });

  describe('warn', () => {
    it('deve logar warning no console em desenvolvimento', () => {
      logger.isDevelopment = true;

      logger.warn('Test warning');

      expect(console.warn).toHaveBeenCalledWith(
        '[WARN] Test warning',
        {}
      );
    });
  });

  describe('info', () => {
    it('deve logar info no console em desenvolvimento', () => {
      logger.isDevelopment = true;

      logger.info('Test info');

      expect(console.info).toHaveBeenCalledWith(
        '[INFO] Test info',
        {}
      );
    });
  });

  describe('debug', () => {
    it('deve logar debug apenas em desenvolvimento', () => {
      logger.isDevelopment = true;

      logger.debug('Test debug');

      expect(console.debug).toHaveBeenCalledWith(
        '[DEBUG] Test debug',
        {}
      );
    });

    it('não deve logar debug em produção', () => {
      logger.isDevelopment = false;

      logger.debug('Test debug');

      expect(console.debug).not.toHaveBeenCalled();
    });
  });

  describe('addToQueue', () => {
    it('deve adicionar log à fila', () => {
      const logData = { message: 'test' };

      logger.addToQueue(logData);

      expect(logger.logQueue).toContain(logData);
    });

    it('deve fazer flush quando fila estiver cheia', () => {
      logger.maxQueueSize = 2;
      logger.flushLogs = vi.fn();

      logger.addToQueue({ message: 'test1' });
      logger.addToQueue({ message: 'test2' });

      expect(logger.flushLogs).toHaveBeenCalled();
    });
  });

  describe('flushLogs', () => {
    it('deve enviar logs em lote para o servidor', async () => {
      logger.logQueue = [
        { message: 'log1' },
        { message: 'log2' }
      ];

      await logger.flushLogs();

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/logs/batch'),
        expect.objectContaining({
          method: 'POST',
          body: expect.stringContaining('log1')
        })
      );

      expect(logger.logQueue.length).toBe(0);
    });

    it('não deve fazer nada se fila estiver vazia', async () => {
      logger.logQueue = [];

      await logger.flushLogs();

      expect(global.fetch).not.toHaveBeenCalled();
    });

    it('deve recolocar logs na fila se falhar', async () => {
      global.fetch = vi.fn(() => Promise.reject(new Error('Network error')));
      logger.logQueue = [{ message: 'test' }];

      await logger.flushLogs();

      expect(logger.logQueue.length).toBe(1);
    });
  });

  describe('checkRateLimit', () => {
    it('deve permitir logs dentro do limite', () => {
      logger.maxLogsPerWindow = 5;

      expect(logger.checkRateLimit('test_key')).toBe(true);
      expect(logger.checkRateLimit('test_key')).toBe(true);
      expect(logger.checkRateLimit('test_key')).toBe(true);
    });

    it('deve bloquear logs acima do limite', () => {
      logger.maxLogsPerWindow = 2;

      expect(logger.checkRateLimit('test_key')).toBe(true);
      expect(logger.checkRateLimit('test_key')).toBe(true);
      expect(logger.checkRateLimit('test_key')).toBe(false);
    });

    it('deve limpar entradas antigas', () => {
      logger.rateLimitWindow = 1000;
      const oldTimestamp = Math.floor((Date.now() - 5000) / 1000); // 5 segundos atrás
      logger.rateLimitMap.set(`old_key_${oldTimestamp}`, 5);

      // Verificar que a entrada antiga existe
      expect(logger.rateLimitMap.has(`old_key_${oldTimestamp}`)).toBe(true);

      // Chamar checkRateLimit que deve limpar entradas antigas
      logger.checkRateLimit('old_key');

      // A entrada antiga deve ter sido removida
      expect(logger.rateLimitMap.has(`old_key_${oldTimestamp}`)).toBe(false);
    });
  });

  describe('setupGlobalErrorHandler', () => {
    it('deve capturar erros não tratados', () => {
      logger.error = vi.fn();
      logger.setupGlobalErrorHandler();

      const errorEvent = new ErrorEvent('error', {
        message: 'Test error',
        filename: 'test.js',
        lineno: 10,
        colno: 5
      });

      window.dispatchEvent(errorEvent);

      expect(logger.error).toHaveBeenCalledWith(
        'Erro não tratado',
        expect.objectContaining({
          message: 'Test error',
          filename: 'test.js',
          lineno: 10,
          colno: 5
        })
      );
    });

    it('deve capturar promises rejeitadas', () => {
      logger.error = vi.fn();
      logger.setupGlobalErrorHandler();

      const rejectionEvent = new PromiseRejectionEvent('unhandledrejection', {
        reason: new Error('Promise rejected'),
        promise: Promise.reject()
      });

      window.dispatchEvent(rejectionEvent);

      expect(logger.error).toHaveBeenCalledWith(
        'Promise rejeitada não tratada',
        expect.objectContaining({
          reason: 'Promise rejected'
        })
      );
    });
  });
});
