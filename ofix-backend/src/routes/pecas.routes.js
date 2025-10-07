import { Router } from 'express';
import * as pecasController from '../controllers/pecas.controller.js';
import { protectRoute } from '../middlewares/auth.middleware.js';

const router = Router();

// Aplicar o middleware de proteção a todas as rotas de peças:
router.use(protectRoute);

router.post('/', pecasController.createPeca);
router.get('/', pecasController.getAllPecas);
router.get('/estoque-baixo/count', pecasController.getEstoqueBaixo); // Nova rota para dashboard
router.get('/:id', pecasController.getPecaById);
router.put('/:id', pecasController.updatePeca);
router.delete('/:id', pecasController.deletePeca);

export default router;