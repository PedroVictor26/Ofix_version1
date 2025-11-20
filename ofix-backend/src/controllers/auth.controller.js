import * as authService from '../services/auth.service.js';

class AuthController {
  async register(req, res, next) {
    console.log('Chegou no controlador de registro!');
    try {
      const { nomeUser, emailUser, passwordUser, nomeOficina, cnpjOficina, telefoneOficina, enderecoOficina, userRole } = req.body;

      // Validação básica de entrada
      if (!nomeUser || !emailUser || !passwordUser || !nomeOficina) {
        return res.status(400).json({
          error: 'Campos obrigatórios para registro não fornecidos: nomeUser, emailUser, passwordUser, nomeOficina.'
        });
      }
      if (passwordUser.length < 6) {
        return res.status(400).json({ error: 'A senha deve ter pelo menos 6 caracteres.' });
      }

      const newUser = await authService.registerUserAndOficina({
        nomeUser, emailUser, passwordUser, nomeOficina, cnpjOficina, telefoneOficina, enderecoOficina, userRole
      });

      // Não retornar o token no registro, o usuário deve fazer login separadamente
      res.status(201).json({
        message: "Usuário e oficina registrados com sucesso! Por favor, faça login.",
        user: newUser // Retorna o usuário criado (sem senha)
      });

    } catch (error) {
      if (error.code === 'P2002' && error.meta?.target?.includes('email')) {
        return res.status(409).json({ error: 'Este e-mail já está em uso.' });
      }
      if (error.code === 'P2002' && error.meta?.target?.includes('cnpj')) {
        return res.status(409).json({ error: 'Este CNPJ já está em uso.' });
      }
      // Outros erros do Prisma ou erros gerais
      next(error);
    }
  }

  async login(req, res, next) {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({ error: 'E-mail e senha são obrigatórios.' });
      }

      const loginResult = await authService.loginUser({ email, password });

      if (!loginResult) {
        return res.status(401).json({ error: 'Credenciais inválidas. Verifique e-mail e senha.' });
      }

      // loginResult contém { user, token }
      res.json(loginResult);

    } catch (error) {
      next(error);
    }
  }

  // Exemplo de uma rota protegida para testar o token
  async getProfile(req, res, next) {
    try {
      // req.user é populado pelo middleware protectRoute
      if (!req.user || !req.user.userId) {
        return res.status(401).json({ error: "Não autorizado ou token inválido." });
      }
      // Buscar dados mais completos do usuário se necessário, ou apenas retornar o que está no token
      // const userProfile = await prisma.user.findUnique({ where: { id: req.user.userId }, select: { id:true, nome:true, email:true, role:true, oficinaId:true }});
      res.json({
        message: "Perfil acessado com sucesso (via token)!",
        user: req.user // req.user contém o payload do token
      });
    } catch (error) {
      next(error);
    }
  }

  async generateInviteLink(req, res, next) {
    try {
      const { oficinaId } = req.user; // Obtido do token do usuário logado

      if (!oficinaId) {
        return res.status(400).json({ error: "Usuário não está vinculado a uma oficina." });
      }

      const token = await authService.createInviteToken(oficinaId);

      // Retorna o token. O frontend montará a URL completa.
      res.json({ token });

    } catch (error) {
      next(error);
    }
  }

  async guestLogin(req, res, next) {
    try {
      const { token } = req.body;

      if (!token) {
        return res.status(400).json({ error: "Token de convite é obrigatório." });
      }

      const result = await authService.processGuestLogin(token);

      res.json(result); // { user, token }

    } catch (error) {
      res.status(401).json({ error: error.message });
    }
  }
}

export default new AuthController();
