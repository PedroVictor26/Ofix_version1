import { Router } from 'express';
import * as financeiroController from '../controllers/financeiro.controller.js';

const router = Router();

router.post('/', financeiroController.createTransacao);
router.get('/', financeiroController.getAllTransacoes);
router.get('/:id', financeiroController.getTransacaoById);
router.put('/:id', financeiroController.updateTransacao);
router.delete('/:id', financeiroController.deleteTransacao);

export default router;