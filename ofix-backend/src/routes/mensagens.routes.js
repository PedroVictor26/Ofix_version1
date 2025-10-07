import { Router } from 'express';
import * as mensagensController from '../controllers/mensagens.controller.js';

const router = Router();

router.post('/', mensagensController.createMensagem);
router.get('/', mensagensController.getAllMensagens);
router.get('/:id', mensagensController.getMensagemById);
router.put('/:id', mensagensController.updateMensagem);
router.delete('/:id', mensagensController.deleteMensagem);

export default router;