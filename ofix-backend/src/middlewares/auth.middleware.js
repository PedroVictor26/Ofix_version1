import jwt from 'jsonwebtoken';
import 'dotenv/config';

const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  console.error('FATAL ERROR: JWT_SECRET não está definido nas variáveis de ambiente.');
  process.exit(1); // Para a aplicação se JWT_SECRET não estiver definido
}

// Validar se JWT_SECRET tem tamanho mínimo seguro
if (JWT_SECRET.length < 32) {
  console.error('FATAL ERROR: JWT_SECRET deve ter pelo menos 32 caracteres para ser seguro.');
  process.exit(1);
}


export function protectRoute(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Acesso não autorizado. Token não fornecido ou mal formatado.' });
  }

  const token = authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Acesso não autorizado. Token ausente após Bearer.' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);

    // Anexa o payload decodificado do token ao objeto req.user
    // Isso normalmente inclui o ID do usuário, ID da oficina, papel, etc.
    req.user = {
      id: decoded.userId, // Renomeado de userId para id para consistência com o modelo User
      email: decoded.email,
      role: decoded.role,
      oficinaId: decoded.oficinaId,
      isGuest: decoded.email && decoded.email.endsWith('@ofix.temp'),
      // ... outros campos do payload que você queira expor
    };
    // Log apenas em desenvolvimento para evitar vazamento de informações em produção
    if (process.env.NODE_ENV === 'development') {
      console.log('req.user no protectRoute:', req.user);
    }
    next(); // Prossegue para a próxima função de middleware ou para o controller da rota
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expirado. Por favor, faça login novamente.' });
    }
    if (error.name === 'JsonWebTokenError') {
      // Isso pode incluir token malformado, assinatura inválida, etc.
      return res.status(401).json({ error: 'Token inválido.' });
    }
    // Para outros erros inesperados durante a verificação do token
    console.error("Erro ao verificar token:", error);
    return res.status(500).json({ error: 'Erro interno ao validar o token de autenticação.' });
  }
}
