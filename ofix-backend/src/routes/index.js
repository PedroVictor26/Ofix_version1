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
// import aiRouter from './ai.routes.js'; // Comentado - funcionalidade de IA removida
import { protectRoute } from "../middlewares/auth.middleware.js";

const router = Router();

router.get("/", (req, res) => {
  res.json({ message: "API OFIX está no ar! Versão 1.0" });
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

// Rotas do Agno AI Agent (protegidas)
router.use("/agno", protectRoute, agnoRouter);

// Rotas do Assistente Virtual (AI) - Removidas temporariamente
// router.use("/ai", aiRouter);

// Adicione outras rotas principais aqui conforme necessário

export default router;
