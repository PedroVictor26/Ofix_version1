/**
 * Middleware de segurança para adicionar headers de proteção
 */
export function securityHeaders(req, res, next) {
  // Previne ataques de clickjacking
  res.setHeader('X-Frame-Options', 'DENY');
  
  // Previne MIME type sniffing
  res.setHeader('X-Content-Type-Options', 'nosniff');
  
  // Habilita proteção XSS no navegador
  res.setHeader('X-XSS-Protection', '1; mode=block');
  
  // Força HTTPS em produção
  if (process.env.NODE_ENV === 'production') {
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
  }
  
  // Remove header que expõe tecnologia do servidor
  res.removeHeader('X-Powered-By');
  
  // Content Security Policy básico
  res.setHeader('Content-Security-Policy', "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:;");
  
  // Referrer Policy
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  
  next();
}

/**
 * Middleware para rate limiting básico
 */
const requestCounts = new Map();
const RATE_LIMIT_WINDOW = 15 * 60 * 1000; // 15 minutos
const MAX_REQUESTS = 100; // máximo de requests por IP por janela

export function rateLimit(req, res, next) {
  const clientIP = req.ip || req.connection.remoteAddress;
  const now = Date.now();
  
  // Limpa entradas antigas
  for (const [ip, data] of requestCounts.entries()) {
    if (now - data.firstRequest > RATE_LIMIT_WINDOW) {
      requestCounts.delete(ip);
    }
  }
  
  // Verifica rate limit para o IP atual
  const clientData = requestCounts.get(clientIP);
  
  if (!clientData) {
    requestCounts.set(clientIP, {
      count: 1,
      firstRequest: now
    });
  } else {
    clientData.count++;
    
    if (clientData.count > MAX_REQUESTS) {
      return res.status(429).json({
        error: 'Muitas requisições. Tente novamente em 15 minutos.',
        retryAfter: Math.ceil((clientData.firstRequest + RATE_LIMIT_WINDOW - now) / 1000)
      });
    }
  }
  
  // Adiciona headers informativos
  res.setHeader('X-RateLimit-Limit', MAX_REQUESTS);
  res.setHeader('X-RateLimit-Remaining', Math.max(0, MAX_REQUESTS - (clientData?.count || 1)));
  res.setHeader('X-RateLimit-Reset', Math.ceil((clientData?.firstRequest + RATE_LIMIT_WINDOW) / 1000));
  
  next();
}