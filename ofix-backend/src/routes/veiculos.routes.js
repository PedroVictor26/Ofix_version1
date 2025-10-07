import { Router } from 'express';
import veiculosController from '../controllers/veiculos.controller.js';

const router = Router();

router.get('/', veiculosController.getAllVeiculos);

export default router;