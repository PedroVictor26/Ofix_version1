import { Router } from 'express';
import servicosController from '../controllers/servicos.controller.js';
import { protectRoute } from '../middlewares/auth.middleware.js'; // Agora vamos usar

const router = Router();

// Aplicar o middleware de proteção a todas as rotas de serviços:
router.use(protectRoute); // Middleware aplicado aqui para todas as rotas abaixo

router.post('/', servicosController.createServico);
router.get('/', servicosController.getAllServicos);
router.get('/ativos/count', servicosController.getServicosAtivos); // Nova rota para dashboard
router.get('/:id', servicosController.getServicoById);
router.put('/:id', servicosController.updateServico);
router.delete('/:id', servicosController.deleteServico);

export default router;
