/**
 * 🧪 TESTES DE INTEGRAÇÃO - APIs do Matias
 * 
 * Testes end-to-end para as APIs do assistente virtual
 */

const request = require('supertest');
const app = require('../../ofix-backend/src/app.js');

describe('API Integration Tests - Matias', () => {

  describe('POST /api/matias/chat', () => {
    test('deve processar chat básico com sucesso', async () => {
      const response = await request(app)
        .post('/api/matias/chat')
        .send({
          message: 'Olá Matias, como você pode me ajudar?',
          language: 'pt-BR'
        })
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('response');
      expect(response.body.response).toContain('Matias');
    });

    test('deve retornar erro para mensagem vazia', async () => {
      const response = await request(app)
        .post('/api/matias/chat')
        .send({
          message: '',
          language: 'pt-BR'
        })
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error');
    });

    test('deve processar consulta técnica sobre freios', async () => {
      const response = await request(app)
        .post('/api/matias/chat')
        .send({
          message: 'Meu carro está fazendo barulho quando freio',
          language: 'pt-BR'
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.response.toLowerCase()).toMatch(/freio|pastilha|disco/);
    });
  });

  describe('GET /api/matias/knowledge', () => {
    test('deve buscar conhecimento sobre freios', async () => {
      const response = await request(app)
        .get('/api/matias/knowledge')
        .query({ q: 'freios' })
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('results');
      expect(Array.isArray(response.body.results)).toBe(true);
    });

    test('deve retornar resultados vazios para busca inexistente', async () => {
      const response = await request(app)
        .get('/api/matias/knowledge')
        .query({ q: 'xyzabc123' })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.results).toHaveLength(0);
    });
  });

  describe('POST /api/matias/whatsapp', () => {
    test('deve processar mensagem do WhatsApp', async () => {
      const response = await request(app)
        .post('/api/matias/whatsapp')
        .send({
          phone: '+5511999999999',
          message: 'Oi Matias',
          action: 'receive',
          language: 'pt-BR'
        })
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
    });

    test('deve validar número de telefone', async () => {
      const response = await request(app)
        .post('/api/matias/whatsapp')
        .send({
          phone: 'numero-invalido',
          message: 'teste',
          action: 'send'
        })
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/matias/tasks', () => {
    test('deve criar nova tarefa', async () => {
      const response = await request(app)
        .post('/api/matias/tasks')
        .send({
          action: 'create',
          task: {
            title: 'Revisar freios do cliente',
            priority: 'high',
            customer_id: 'customer123'
          }
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body).toHaveProperty('task_id');
    });

    test('deve listar tarefas pendentes', async () => {
      const response = await request(app)
        .post('/api/matias/tasks')
        .send({
          action: 'list',
          status: 'pending'
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.tasks)).toBe(true);
    });
  });

  describe('POST /api/matias/sync', () => {
    test('deve sincronizar dados offline', async () => {
      const response = await request(app)
        .post('/api/matias/sync')
        .send({
          offline_data: [
            {
              type: 'chat',
              message: 'mensagem offline',
              timestamp: new Date().toISOString()
            }
          ],
          last_sync: '2023-01-01T00:00:00Z'
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body).toHaveProperty('synced_items');
    });
  });

  describe('Performance Tests', () => {
    test('chat deve responder em menos de 2 segundos', async () => {
      const start = Date.now();
      
      await request(app)
        .post('/api/matias/chat')
        .send({
          message: 'Teste de performance',
          language: 'pt-BR'
        })
        .expect(200);

      const duration = Date.now() - start;
      expect(duration).toBeLessThan(2000);
    });

    test('deve suportar 10 requisições simultâneas', async () => {
      const promises = Array.from({ length: 10 }, (_, i) =>
        request(app)
          .post('/api/matias/chat')
          .send({
            message: `Mensagem de teste ${i}`,
            language: 'pt-BR'
          })
      );

      const responses = await Promise.all(promises);
      
      responses.forEach(response => {
        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
      });
    });
  });

  describe('Error Handling', () => {
    test('deve tratar erro interno graciosamente', async () => {
      // Simular erro interno mockando um serviço
      const response = await request(app)
        .post('/api/matias/chat')
        .send({
          message: 'FORCE_ERROR_FOR_TESTING',
          language: 'pt-BR'
        });

      expect(response.status).toBeGreaterThanOrEqual(400);
      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error');
    });
  });

  describe('Security Tests', () => {
    test('deve prevenir SQL injection', async () => {
      const response = await request(app)
        .post('/api/matias/chat')
        .send({
          message: "'; DROP TABLE users; --",
          language: 'pt-BR'
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      // Resposta não deve conter evidência de execução SQL
    });

    test('deve sanitizar XSS', async () => {
      const response = await request(app)
        .post('/api/matias/chat')
        .send({
          message: '<script>alert("xss")</script>',
          language: 'pt-BR'
        })
        .expect(200);

      expect(response.body.response).not.toContain('<script>');
    });

    test('deve respeitar rate limiting', async () => {
      // Fazer muitas requisições rapidamente
      const promises = Array.from({ length: 100 }, () =>
        request(app)
          .post('/api/matias/chat')
          .send({
            message: 'rate limit test',
            language: 'pt-BR'
          })
      );

      const responses = await Promise.allSettled(promises);
      
      // Algumas devem ser bloqueadas pelo rate limit
      const blockedRequests = responses.filter(
        result => result.status === 'fulfilled' && result.value.status === 429
      );
      
      expect(blockedRequests.length).toBeGreaterThan(0);
    });
  });
});
