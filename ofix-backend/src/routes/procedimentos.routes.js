import { Router } from 'express';
import * as procedimentosController from '../controllers/procedimentos.controller.js';

const router = Router();

router.post('/', procedimentosController.createProcedimento);
router.get('/', procedimentosController.getAllProcedimentos);
router.get('/:id', procedimentosController.getProcedimentoById);
router.put('/:id', procedimentosController.updateProcedimento);
router.delete('/:id', procedimentosController.deleteProcedimento);

export default router;