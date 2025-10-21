/**
 * Testes para classificador de intenções
 */

import { describe, it, expect, vi } from 'vitest';
import { classifyIntent, detectMultipleIntents } from '../intentClassifier';

// Mock logger
vi.mock('../../logger', () => ({
  default: {
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn()
  }
}));

describe('intentClassifier', () => {
  describe('classifyIntent', () => {
    it('deve identificar consulta de preço', () => {
      const result = classifyIntent('quanto custa a troca de óleo?');
      
      expect(result.intencao).toBe('consulta_preco');
      expect(result.confianca).toBeGreaterThan(0);
    });

    it('deve identificar agendamento', () => {
      const result = classifyIntent('quero agendar uma revisão');
      
      expect(result.intencao).toBe('agendamento');
      expect(result.confianca).toBeGreaterThan(0);
    });

    it('deve identificar consulta de cliente', () => {
      const result = classifyIntent('buscar cliente João Silva');
      
      expect(result.intencao).toBe('consulta_cliente');
      expect(result.confianca).toBeGreaterThan(0);
    });

    it('deve identificar consulta de estoque', () => {
      const result = classifyIntent('tem filtro de óleo em estoque?');
      
      expect(result.intencao).toBe('consulta_estoque');
      expect(result.confianca).toBeGreaterThan(0);
    });

    it('deve identificar consulta de OS', () => {
      const result = classifyIntent('qual o status da OS 123?');
      
      expect(result.intencao).toBe('consulta_os');
      expect(result.confianca).toBeGreaterThan(0);
    });

    it('deve identificar saudação', () => {
      const result = classifyIntent('Olá');
      
      expect(result.intencao).toBe('saudacao');
      expect(result.confianca).toBeGreaterThan(0);
    });

    it('deve identificar pedido de ajuda', () => {
      const result = classifyIntent('preciso de ajuda');
      
      expect(result.intencao).toBe('ajuda');
      expect(result.confianca).toBeGreaterThan(0);
    });

    it('deve retornar desconhecida para mensagem sem padrão', () => {
      const result = classifyIntent('xpto abc 123');
      
      expect(result.intencao).toBe('desconhecida');
      expect(result.confianca).toBe(0);
    });

    it('deve ser case-insensitive', () => {
      const result1 = classifyIntent('QUANTO CUSTA');
      const result2 = classifyIntent('quanto custa');
      
      expect(result1.intencao).toBe(result2.intencao);
    });

    it('deve retornar alternativas', () => {
      const result = classifyIntent('quanto custa agendar uma revisão?');
      
      expect(result.alternativas).toBeDefined();
      expect(Array.isArray(result.alternativas)).toBe(true);
    });

    it('deve tratar mensagem vazia', () => {
      const result = classifyIntent('');
      
      expect(result.intencao).toBe('desconhecida');
      expect(result.confianca).toBe(0);
    });

    it('deve tratar mensagem null', () => {
      const result = classifyIntent(null);
      
      expect(result.intencao).toBe('desconhecida');
      expect(result.confianca).toBe(0);
    });
  });

  describe('detectMultipleIntents', () => {
    it('deve detectar múltiplas intenções', () => {
      const result = detectMultipleIntents('quanto custa e quero agendar');
      
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThan(0);
    });

    it('deve filtrar intenções com baixa confiança', () => {
      const result = detectMultipleIntents('olá');
      
      // Deve ter apenas intenções com confiança > 0.3
      result.forEach(intent => {
        expect(intent.confianca).toBeGreaterThan(0.3);
      });
    });
  });
});
