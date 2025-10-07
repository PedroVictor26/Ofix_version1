/**
 * 🧪 TESTES UNITÁRIOS COMPLETOS - Matias Controller
 * 
 * Suíte abrangente de testes para o controlador principal do Matias
 * Cobertura: Funcionalidade, Performance, Segurança, Integração
 */

const request = require('supertest');
const app = require('../../ofix-backend/src/app');
const MatiasController = require('../../ofix-backend/src/controllers/matias.controller');

// Mock dos serviços
jest.mock('../../ofix-backend/src/services/ai.service.js');
jest.mock('../../ofix-backend/src/services/knowledgeBase.service.js');
jest.mock('../../ofix-backend/src/services/whatsapp.service.js');

describe('MatiasController', () => {
  
  describe('Chat Principal', () => {
    test('deve responder mensagem básica corretamente', async () => {
      const req = {
        body: {
          message: 'Olá Matias',
          language: 'pt-BR'
        },
        user: { id: 'user123' }
      };
      
      const res = {
        json: jest.fn(),
        status: jest.fn().mockReturnThis()
      };

      await MatiasController.chat(req, res);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          response: expect.any(String)
        })
      );
    });

    test('deve validar entrada obrigatória', async () => {
      const req = {
        body: { message: '' },
        user: { id: 'user123' }
      };
      
      const res = {
        json: jest.fn(),
        status: jest.fn().mockReturnThis()
      };

      await MatiasController.chat(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: 'Mensagem é obrigatória'
        })
      );
    });

    test('deve processar mensagem técnica sobre freios', async () => {
      const req = {
        body: {
          message: 'Meu carro está fazendo barulho quando freio',
          language: 'pt-BR'
        },
        user: { id: 'user123' }
      };
      
      const res = {
        json: jest.fn(),
        status: jest.fn().mockReturnThis()
      };

      await MatiasController.chat(req, res);

      const response = res.json.mock.calls[0][0];
      expect(response.success).toBe(true);
      expect(response.response).toContain('freio');
      expect(response.intent?.type).toBe('diagnostic_request');
    });
  });

  describe('Análise de Intenção', () => {
    test('deve identificar pedido de orçamento', async () => {
      const intent = await MatiasController.analyzeIntent(
        'Quanto custa trocar o óleo?',
        { language: 'pt-BR' }
      );

      expect(intent.type).toBe('budget_request');
      expect(intent.confidence).toBeGreaterThan(0.7);
    });

    test('deve identificar problema diagnóstico', async () => {
      const intent = await MatiasController.analyzeIntent(
        'Meu carro está com problema no motor',
        { language: 'pt-BR' }
      );

      expect(intent.type).toBe('diagnostic_request');
      expect(intent.confidence).toBeGreaterThan(0.7);
    });

    test('deve identificar pedido de agendamento', async () => {
      const intent = await MatiasController.analyzeIntent(
        'Quero agendar uma revisão',
        { language: 'pt-BR' }
      );

      expect(intent.type).toBe('schedule_request');
      expect(intent.confidence).toBeGreaterThan(0.7);
    });
  });

  describe('Construção de Prompt', () => {
    test('deve construir prompt em português', async () => {
      const prompt = await MatiasController.buildMatiasPrompt(
        'Como trocar o óleo?',
        { language: 'pt-BR', user_id: 'user123' },
        { type: 'how_to', confidence: 0.8 }
      );

      expect(prompt).toContain('Matias');
      expect(prompt).toContain('mecânico experiente');
      expect(prompt).toContain('Como trocar o óleo?');
    });

    test('deve construir prompt em inglês', async () => {
      const prompt = await MatiasController.buildMatiasPrompt(
        'How to change oil?',
        { language: 'en', user_id: 'user123' },
        { type: 'how_to', confidence: 0.8 }
      );

      expect(prompt).toContain('Matias');
      expect(prompt).toContain('experienced mechanic');
      expect(prompt).toContain('How to change oil?');
    });
  });

  describe('Processamento de Voz', () => {
    test('deve processar áudio válido', async () => {
      const mockFile = {
        buffer: Buffer.from('fake audio data'),
        mimetype: 'audio/wav'
      };

      const req = {
        file: mockFile,
        body: { language: 'pt-BR' },
        user: { id: 'user123' }
      };
      
      const res = {
        json: jest.fn(),
        status: jest.fn().mockReturnThis()
      };

      // Mock do Whisper
      const mockTranscription = { text: 'olá matias' };
      jest.spyOn(require('../../ofix-backend/src/services/ai.service.js'), 'transcribeAudio')
        .mockResolvedValue(mockTranscription);

      await MatiasController.voice(req, res);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          transcription: 'olá matias'
        })
      );
    });

    test('deve rejeitar arquivo inválido', async () => {
      const req = {
        body: { language: 'pt-BR' },
        user: { id: 'user123' }
      };
      
      const res = {
        json: jest.fn(),
        status: jest.fn().mockReturnThis()
      };

      await MatiasController.voice(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });
  });

  describe('Integração WhatsApp', () => {
    test('deve processar mensagem do WhatsApp', async () => {
      const req = {
        body: {
          phone: '+5511999999999',
          message: 'Oi Matias',
          action: 'receive',
          language: 'pt-BR'
        },
        user: { id: 'guest' }
      };
      
      const res = {
        json: jest.fn(),
        status: jest.fn().mockReturnThis()
      };

      await MatiasController.whatsappIntegration(req, res);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true
        })
      );
    });

    test('deve enviar mensagem via WhatsApp', async () => {
      const req = {
        body: {
          phone: '+5511999999999',
          message: 'Como posso ajudar?',
          action: 'send',
          language: 'pt-BR'
        },
        user: { id: 'admin' }
      };
      
      const res = {
        json: jest.fn(),
        status: jest.fn().mockReturnThis()
      };

      await MatiasController.whatsappIntegration(req, res);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          result: expect.objectContaining({
            success: true
          })
        })
      );
    });
  });

  describe('Tratamento de Erros', () => {
    test('deve tratar erro de IA indisponível', async () => {
      // Mock erro na IA
      jest.spyOn(require('../../ofix-backend/src/services/ai.service.js'), 'processWithPersona')
        .mockRejectedValue(new Error('API timeout'));

      const req = {
        body: {
          message: 'teste erro',
          language: 'pt-BR'
        },
        user: { id: 'user123' }
      };
      
      const res = {
        json: jest.fn(),
        status: jest.fn().mockReturnThis()
      };

      await MatiasController.chat(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: expect.stringContaining('Erro')
        })
      );
    });
  });
});

// Testes de Performance
describe('Performance do Matias', () => {
  test('deve responder em menos de 3 segundos', async () => {
    const start = Date.now();
    
    const req = {
      body: {
        message: 'Teste de performance',
        language: 'pt-BR'
      },
      user: { id: 'user123' }
    };
    
    const res = {
      json: jest.fn(),
      status: jest.fn().mockReturnThis()
    };

    await MatiasController.chat(req, res);
    
    const duration = Date.now() - start;
    expect(duration).toBeLessThan(3000);
  });
});

// Testes de Segurança
describe('Segurança do Matias', () => {
  test('deve sanitizar input malicioso', async () => {
    const req = {
      body: {
        message: '<script>alert("xss")</script>',
        language: 'pt-BR'
      },
      user: { id: 'user123' }
    };
    
    const res = {
      json: jest.fn(),
      status: jest.fn().mockReturnThis()
    };

    await MatiasController.chat(req, res);
    
    const response = res.json.mock.calls[0][0];
    expect(response.response).not.toContain('<script>');
  });

  test('deve validar permissões de usuário', async () => {
    const req = {
      body: {
        message: 'Mostre todos os dados de clientes',
        language: 'pt-BR'
      },
      user: { id: 'guest', role: 'guest' }
    };
    
    const res = {
      json: jest.fn(),
      status: jest.fn().mockReturnThis()
    };

    await MatiasController.chat(req, res);
    
    const response = res.json.mock.calls[0][0];
    expect(response.response).not.toContain('senha');
    expect(response.response).not.toContain('cpf');
  });
});
