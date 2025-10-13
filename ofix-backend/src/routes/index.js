import { Router } from "express";
import servicosRouter from "./servicos.routes.js";
import authRouter from "./auth.routes.js";
import clientesRouter from "./clientes.routes.js";
import procedimentosRouter from "./procedimentos.routes.js";
import mensagensRouter from "./mensagens.routes.js";
import pecasRouter from "./pecas.routes.js";
import fornecedoresRouter from "./fornecedores.routes.js";
import financeiroRouter from "./financeiro.routes.js";
import veiculosRouter from "./veiculos.routes.js"; // Importar o novo router de veículos
import agnoRouter from "./agno.routes.js"; // Router para integração com Agno AI
import matiasRouter from "./matias.routes.js"; // Router para funcionalidades do Matias
// import aiRouter from './ai.routes.js'; // Comentado - funcionalidade de IA removida
import { protectRoute } from "../middlewares/auth.middleware.js";

const router = Router();

router.get("/", (req, res) => {
  res.json({ message: "API OFIX está no ar! Versão 1.0" });
});

// ENDPOINT TEMPORÁRIO PARA TESTE DE IA
router.post("/agno-test", async (req, res) => {
  try {
    const { message } = req.body;
    if (!message) {
      return res.status(400).json({ error: 'Mensagem é obrigatória' });
    }

    // Resposta de fallback inteligente
    let response;
    const msgLower = message.toLowerCase();
    
    if (msgLower.includes('serviço') || msgLower.includes('problema') || msgLower.includes('carro')) {
      response = `🔧 **Assistente OFIX**\n\nVocê mencionou: "${message}"\n\n**Posso ajudar com:**\n• Diagnóstico de problemas automotivos\n• Informações sobre serviços\n• Consulta de peças\n• Agendamento de manutenção\n\n*✅ Sistema funcionando em modo direto!*`;
    } else if (msgLower.includes('preço') || msgLower.includes('valor') || msgLower.includes('custo')) {
      response = `💰 **Consulta de Preços**\n\nPara "${message}":\n\n**Serviços populares:**\n• Troca de óleo: R$ 80-120\n• Revisão completa: R$ 200-400\n• Diagnóstico: R$ 50-100\n\n*💡 Para valores exatos, consulte nossa equipe.*`;
    } else {
      response = `🤖 **OFIX Assistant**\n\nOlá! Você disse: "${message}"\n\n**Como posso ajudar:**\n• Problemas no veículo\n• Informações sobre serviços\n• Consultas de peças\n• Agendamentos\n\n*✅ Assistente funcionando perfeitamente!*`;
    }
    
    res.json({
      success: true,
      response: response,
      mode: 'direct-fallback',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      error: 'Erro interno',
      message: error.message
    });
  }
});

// Rotas de Autenticação (públicas, exceto /profile que tem seu próprio protectRoute)
router.use("/auth", authRouter);

// Rotas de Serviços (serão protegidas pelo middleware em servicos.routes.js)
router.use("/servicos", servicosRouter);

// Rotas de Clientes (protegidas)
router.use("/clientes", protectRoute, clientesRouter);

// Rotas de Procedimentos (protegidas)
router.use("/procedimentos", protectRoute, procedimentosRouter);

// Rotas de Mensagens (protegidas)
router.use("/mensagens", protectRoute, mensagensRouter);

// Rotas de Peças (protegidas)
router.use("/pecas", protectRoute, pecasRouter);

// Rotas de Fornecedores (protegidas)
router.use("/fornecedores", protectRoute, fornecedoresRouter);

// Rotas de Financeiro (protegidas)
router.use("/financeiro", protectRoute, financeiroRouter);

// Rotas de Veículos (protegidas)
router.use("/veiculos", protectRoute, veiculosRouter);

// Rotas do Agno AI Agent (algumas protegidas, outras públicas)
router.use("/agno", agnoRouter);

// Rotas do Matias (funcionalidades avançadas do assistente)
router.use("/matias", matiasRouter);

// Rotas do Assistente Virtual (AI) - Removidas temporariamente
// router.use("/ai", aiRouter);

// Adicione outras rotas principais aqui conforme necessário

export default router;
