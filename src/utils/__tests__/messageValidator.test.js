/**
 * Testes unitários para validação de mensagens
 */

import { describe, it, expect } from 'vitest';
import {
  validarMensagem,
  validarCPF,
  validarCNPJ,
  validarTelefone,
  validarEmail,
  validarPlaca,
  validarArquivo,
  escaparCaracteresEspeciais,
  MESSAGE_CONFIG
} from '../messageValidator';

describe('messageValidator', () => {
  describe('validarMensagem', () => {
    it('deve validar mensagem válida', () => {
      const result = validarMensagem('Olá, como vai?');
      
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.sanitized).toBe('Olá, como vai?');
    });

    it('deve rejeitar mensagem vazia', () => {
      const result = validarMensagem('');
      
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Mensagem não pode estar vazia');
    });

    it('deve rejeitar mensagem apenas com espaços', () => {
      const result = validarMensagem('   ');
      
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Mensagem não pode estar vazia');
    });

    it('deve rejeitar mensagem muito longa', () => {
      const longMessage = 'a'.repeat(MESSAGE_CONFIG.MAX_LENGTH + 1);
      const result = validarMensagem(longMessage);
      
      expect(result.valid).toBe(false);
      expect(result.errors[0]).toContain('muito longa');
    });

    it('deve avisar quando mensagem está próxima do limite', () => {
      const nearLimitMessage = 'a'.repeat(Math.floor(MESSAGE_CONFIG.MAX_LENGTH * 0.95));
      const result = validarMensagem(nearLimitMessage);
      
      expect(result.warnings.length).toBeGreaterThan(0);
      expect(result.warnings[0]).toContain('próxima do limite');
    });

    it('deve sanitizar HTML', () => {
      const result = validarMensagem('<script>alert("xss")</script>Olá');
      
      expect(result.sanitized).not.toContain('<script>');
      expect(result.sanitized).toContain('Olá');
      expect(result.warnings.length).toBeGreaterThan(0);
    });

    it('deve detectar tentativas de SQL injection', () => {
      const result = validarMensagem('SELECT * FROM users WHERE id=1');
      
      expect(result.warnings).toContain('Mensagem contém padrões suspeitos');
    });

    it('deve detectar URLs suspeitas', () => {
      const result = validarMensagem('Clique aqui: javascript:alert(1)');
      
      expect(result.warnings).toContain('Mensagem contém URLs potencialmente perigosas');
    });

    it('deve remover espaços extras', () => {
      const result = validarMensagem('  Olá  ');
      
      expect(result.sanitized).toBe('Olá');
    });
  });

  describe('validarCPF', () => {
    it('deve validar CPF válido', () => {
      const result = validarCPF('123.456.789-09');
      
      expect(result.valid).toBe(true);
      expect(result.formatted).toBe('123.456.789-09');
    });

    it('deve validar CPF sem formatação', () => {
      const result = validarCPF('12345678909');
      
      expect(result.valid).toBe(true);
      expect(result.formatted).toBe('123.456.789-09');
    });

    it('deve rejeitar CPF com todos dígitos iguais', () => {
      const result = validarCPF('111.111.111-11');
      
      expect(result.valid).toBe(false);
      expect(result.error).toBe('CPF inválido');
    });

    it('deve rejeitar CPF com tamanho incorreto', () => {
      const result = validarCPF('123.456.789');
      
      expect(result.valid).toBe(false);
      expect(result.error).toContain('11 dígitos');
    });

    it('deve rejeitar CPF com dígito verificador inválido', () => {
      const result = validarCPF('123.456.789-00');
      
      expect(result.valid).toBe(false);
      expect(result.error).toBe('CPF inválido');
    });
  });

  describe('validarCNPJ', () => {
    it('deve validar CNPJ válido', () => {
      const result = validarCNPJ('11.222.333/0001-81');
      
      expect(result.valid).toBe(true);
      expect(result.formatted).toBe('11.222.333/0001-81');
    });

    it('deve validar CNPJ sem formatação', () => {
      const result = validarCNPJ('11222333000181');
      
      expect(result.valid).toBe(true);
      expect(result.formatted).toBe('11.222.333/0001-81');
    });

    it('deve rejeitar CNPJ com todos dígitos iguais', () => {
      const result = validarCNPJ('11.111.111/1111-11');
      
      expect(result.valid).toBe(false);
      expect(result.error).toBe('CNPJ inválido');
    });

    it('deve rejeitar CNPJ com tamanho incorreto', () => {
      const result = validarCNPJ('11.222.333');
      
      expect(result.valid).toBe(false);
      expect(result.error).toContain('14 dígitos');
    });
  });

  describe('validarTelefone', () => {
    it('deve validar telefone celular com 11 dígitos', () => {
      const result = validarTelefone('(11) 99999-9999');
      
      expect(result.valid).toBe(true);
      expect(result.formatted).toBe('(11) 99999-9999');
    });

    it('deve validar telefone fixo com 10 dígitos', () => {
      const result = validarTelefone('(11) 3333-4444');
      
      expect(result.valid).toBe(true);
      expect(result.formatted).toBe('(11) 3333-4444');
    });

    it('deve validar telefone sem formatação', () => {
      const result = validarTelefone('11999999999');
      
      expect(result.valid).toBe(true);
      expect(result.formatted).toBe('(11) 99999-9999');
    });

    it('deve rejeitar telefone com DDD inválido', () => {
      const result = validarTelefone('(09) 99999-9999');
      
      expect(result.valid).toBe(false);
      expect(result.error).toContain('DDD inválido');
    });

    it('deve rejeitar telefone com tamanho incorreto', () => {
      const result = validarTelefone('999999999');
      
      expect(result.valid).toBe(false);
      expect(result.error).toContain('10 ou 11 dígitos');
    });
  });

  describe('validarEmail', () => {
    it('deve validar email válido', () => {
      const result = validarEmail('teste@example.com');
      
      expect(result.valid).toBe(true);
      expect(result.email).toBe('teste@example.com');
    });

    it('deve converter email para minúsculas', () => {
      const result = validarEmail('TESTE@EXAMPLE.COM');
      
      expect(result.valid).toBe(true);
      expect(result.email).toBe('teste@example.com');
    });

    it('deve rejeitar email sem @', () => {
      const result = validarEmail('testeexample.com');
      
      expect(result.valid).toBe(false);
      expect(result.error).toBe('Email inválido');
    });

    it('deve rejeitar email sem domínio', () => {
      const result = validarEmail('teste@');
      
      expect(result.valid).toBe(false);
      expect(result.error).toBe('Email inválido');
    });

    it('deve avisar sobre email temporário', () => {
      const result = validarEmail('teste@tempmail.com');
      
      expect(result.valid).toBe(true);
      expect(result.warning).toContain('temporário');
    });
  });

  describe('validarPlaca', () => {
    it('deve validar placa formato antigo', () => {
      const result = validarPlaca('ABC-1234');
      
      expect(result.valid).toBe(true);
      expect(result.formatted).toBe('ABC-1234');
      expect(result.tipo).toBe('antiga');
    });

    it('deve validar placa formato Mercosul', () => {
      const result = validarPlaca('ABC1D23');
      
      expect(result.valid).toBe(true);
      expect(result.formatted).toBe('ABC-1D23');
      expect(result.tipo).toBe('mercosul');
    });

    it('deve validar placa sem formatação', () => {
      const result = validarPlaca('ABC1234');
      
      expect(result.valid).toBe(true);
      expect(result.formatted).toBe('ABC-1234');
    });

    it('deve converter placa para maiúsculas', () => {
      const result = validarPlaca('abc-1234');
      
      expect(result.valid).toBe(true);
      expect(result.formatted).toBe('ABC-1234');
    });

    it('deve rejeitar placa com formato inválido', () => {
      const result = validarPlaca('AB-1234');
      
      expect(result.valid).toBe(false);
      expect(result.error).toBe('Placa inválida');
    });
  });

  describe('validarArquivo', () => {
    it('deve validar arquivo dentro do limite', () => {
      const file = { size: 1024 * 1024 }; // 1MB
      const result = validarArquivo(file, 5);
      
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('deve rejeitar arquivo muito grande', () => {
      const file = { size: 10 * 1024 * 1024 }; // 10MB
      const result = validarArquivo(file, 5);
      
      expect(result.valid).toBe(false);
      expect(result.errors[0]).toContain('muito grande');
    });

    it('deve rejeitar quando nenhum arquivo é fornecido', () => {
      const result = validarArquivo(null);
      
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Nenhum arquivo selecionado');
    });
  });

  describe('escaparCaracteresEspeciais', () => {
    it('deve escapar caracteres HTML', () => {
      const result = escaparCaracteresEspeciais('<script>alert("xss")</script>');
      
      expect(result).not.toContain('<');
      expect(result).not.toContain('>');
      expect(result).toContain('&lt;');
      expect(result).toContain('&gt;');
    });

    it('deve escapar aspas', () => {
      const result = escaparCaracteresEspeciais('"teste" e \'teste\'');
      
      expect(result).toContain('&quot;');
      expect(result).toContain('&#x27;');
    });

    it('deve escapar ampersand', () => {
      const result = escaparCaracteresEspeciais('A & B');
      
      expect(result).toContain('&amp;');
    });

    it('deve escapar barra', () => {
      const result = escaparCaracteresEspeciais('http://example.com');
      
      expect(result).toContain('&#x2F;');
    });
  });
});
