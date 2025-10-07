import { Router } from 'express';
import multer from 'multer';
import * as aiController from '../controllers/ai.controller.js';
import { protectRoute } from '../middlewares/auth.middleware.js';
import { rateLimit } from '../middlewares/security.middleware.js';

// Router para endpoints do Assistente Virtual (AI)
const router = Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

// Saúde do serviço (público)
router.get('/health', aiController.health);

// Rotas públicas de teste/demonstração (sem auth)
router.post('/test/checkin', aiController.testCheckin);
router.post('/test/resumo-whatsapp', aiController.testResumoWhatsapp);
router.post('/test/upsell', aiController.testUpsell);

// Sugestões contextuais (protegido)
router.get('/suggestions', rateLimit, protectRoute, aiController.getSuggestions);

// Chat (protegido)
router.post('/chat', rateLimit, protectRoute, aiController.chat);

// Diagnóstico (protegido)
router.post('/diagnosis', rateLimit, protectRoute, aiController.diagnosis);

// Ações rápidas (protegido)
router.post('/quick-action', rateLimit, protectRoute, aiController.quickAction);

// Feedback (protegido)
router.post('/feedback', rateLimit, protectRoute, aiController.feedback);

// Conversas (protegido)
router.get('/conversations', rateLimit, protectRoute, aiController.listConversations);
router.get('/conversations/:id', rateLimit, protectRoute, aiController.getConversationById);
router.put('/conversations/:id/end', rateLimit, protectRoute, aiController.endConversation);

// Funcionalidades específicas para clientes (protegido)
router.get('/os/status', rateLimit, protectRoute, aiController.statusOS); // ?os=123 ou ?placa=ABC1234
router.get('/vehicle/:plate/history', rateLimit, protectRoute, aiController.vehicleHistory);
router.post('/agendamentos', rateLimit, protectRoute, aiController.createAgendamento);

// Fluxos guiados/upsell/whatsapp (protegido)
router.post('/checkin/conduzir', rateLimit, protectRoute, aiController.checkinConduzir);
router.post('/os/:id/resumo-whatsapp', rateLimit, protectRoute, aiController.resumoWhatsapp);
router.post('/os/:id/analise-upsell', rateLimit, protectRoute, aiController.analiseUpsell);
router.post('/triagem-voz', rateLimit, protectRoute, upload.single('audio'), aiController.triagemVoz);

// Funcionalidades para mecânicos (protegido)
router.get('/mechanic/solutions-history', rateLimit, protectRoute, aiController.solutionsHistory);

// Analytics e Dashboard (protegido)
router.get('/analytics/metrics', rateLimit, protectRoute, aiController.analyticsMetrics);
router.get('/analytics/conversations', rateLimit, protectRoute, aiController.getConversationAnalytics);

// Gestão de Base de Conhecimento (protegido)
router.get('/knowledge', rateLimit, protectRoute, aiController.listKnowledge);
router.post('/knowledge', rateLimit, protectRoute, aiController.createKnowledge);
router.put('/knowledge/:id', rateLimit, protectRoute, aiController.updateKnowledge);
router.delete('/knowledge/:id', rateLimit, protectRoute, aiController.deleteKnowledge);
router.get('/knowledge/categories', rateLimit, protectRoute, aiController.getKnowledgeCategories);

// Configurações do Usuário (protegido)
router.get('/user/settings', rateLimit, protectRoute, aiController.getUserSettings);
router.put('/user/settings', rateLimit, protectRoute, aiController.updateUserSettings);

// Feedback e Avaliações (protegido)
router.get('/feedback/list', rateLimit, protectRoute, aiController.listFeedback);
router.post('/feedback/create', rateLimit, protectRoute, aiController.createFeedback);

// Gestão de Provedores de IA (protegido)
router.get('/providers/status', rateLimit, protectRoute, aiController.getProvidersStatus);
router.post('/providers/test', rateLimit, protectRoute, aiController.testProvider);
router.post('/providers/compare', rateLimit, protectRoute, aiController.compareProviders);
router.get('/models/ollama/list', rateLimit, protectRoute, aiController.listOllamaModels);
router.post('/models/ollama/install', rateLimit, protectRoute, aiController.installOllamaModel);

// Treinamento de Modelos Customizados (protegido)
router.post('/training/start', rateLimit, protectRoute, aiController.startTraining);
router.get('/training/status', rateLimit, protectRoute, aiController.getTrainingStatus);

export default router;

