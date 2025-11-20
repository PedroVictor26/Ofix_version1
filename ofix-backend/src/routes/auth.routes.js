import { Router } from 'express';
import authController from '../controllers/auth.controller.js';

console.log('Auth Router carregado.');
import { protectRoute } from '../middlewares/auth.middleware.js'; // Será implementado a seguir

const router = Router();

router.post('/register', authController.register);
router.post('/login', authController.login);

// Rota de exemplo para testar a proteção de rota e o token
// O middleware protectRoute será aplicado aqui
router.get('/profile', protectRoute, authController.getProfile);

// Rotas para acesso de convidado
router.post('/invite-link', protectRoute, authController.generateInviteLink);
router.post('/guest-login', authController.guestLogin);


export default router;
