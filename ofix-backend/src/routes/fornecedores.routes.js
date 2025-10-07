import { Router } from 'express';
import * as fornecedoresController from '../controllers/fornecedores.controller.js';

const router = Router();

router.post('/', fornecedoresController.createFornecedor);
router.get('/', fornecedoresController.getAllFornecedores);
router.get('/:id', fornecedoresController.getFornecedorById);
router.put('/:id', fornecedoresController.updateFornecedor);
router.delete('/:id', fornecedoresController.deleteFornecedor);

export default router;