import { Router } from 'express';
import clientesController from '../controllers/clientes.controller.js';
import { validateClienteData, validateVeiculoData, validateUUID } from '../middlewares/validation.middleware.js';

const router = Router();

router.post('/', validateClienteData, clientesController.createCliente);
router.get('/', clientesController.getAllClientes);
router.get('/:id', validateUUID('id'), clientesController.getClienteById);
router.put('/:id', validateUUID('id'), validateClienteData, clientesController.updateCliente);
router.delete('/:id', validateUUID('id'), clientesController.deleteCliente);
router.post('/:clienteId/veiculos', validateUUID('clienteId'), validateVeiculoData, clientesController.createVeiculo);

export default router;
