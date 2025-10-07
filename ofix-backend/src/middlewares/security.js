/**
 * 🔐 CONFIGURAÇÕES DE SEGURANÇA - Sistema Matias
 * 
 * Implementação completa de segurança para o assistente virtual
 */

const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss');
const validator = require('validator');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

// Configurações de segurança principais
const securityConfig = {
  // Rate Limiting
  rateLimiting: {
    windowMs: 15 * 60 * 1000, // 15 minutos
    max: 100, // máximo de 100 requests por IP
    message: {
      error: 'Muitas solicitações detectadas. Tente novamente em 15 minutos.',
      code: 'RATE_LIMIT_EXCEEDED'
    },
    standardHeaders: true,
    legacyHeaders: false,
    // Rate limit específico para chat
    chatLimit: {
      windowMs: 1 * 60 * 1000, // 1 minuto
      max: 20, // 20 mensagens por minuto
      message: {
        error: 'Limite de mensagens excedido. Aguarde um momento.',
        code: 'CHAT_RATE_LIMIT'
      }
    },
    // Rate limit para voz
    voiceLimit: {
      windowMs: 5 * 60 * 1000, // 5 minutos
      max: 10, // 10 uploads de áudio por 5 minutos
      message: {
        error: 'Limite de comandos de voz excedido.',
        code: 'VOICE_RATE_LIMIT'
      }
    }
  },

  // Configurações JWT
  jwt: {
    secret: process.env.JWT_SECRET || crypto.randomBytes(64).toString('hex'),
    expiresIn: '24h',
    refreshTokenExpiry: '7d',
    algorithm: 'HS256',
    issuer: 'ofix-matias',
    audience: 'ofix-users'
  },

  // Configurações de criptografia
  encryption: {
    algorithm: 'aes-256-gcm',
    keyLength: 32,
    ivLength: 16,
    tagLength: 16
  },

  // Configurações de hash de senha
  password: {
    saltRounds: 12,
    minLength: 8,
    requireUppercase: true,
    requireLowercase: true,
    requireNumbers: true,
    requireSpecialChars: true
  },

  // Headers de segurança
  securityHeaders: {
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
        fontSrc: ["'self'", "https://fonts.gstatic.com"],
        imgSrc: ["'self'", "data:", "https:"],
        scriptSrc: ["'self'", "'wasm-unsafe-eval'"],
        connectSrc: ["'self'", "https://api.openai.com", "wss://"],
        mediaSrc: ["'self'", "blob:"],
        frameSrc: ["'none'"],
        objectSrc: ["'none'"],
        baseUri: ["'self'"],
        formAction: ["'self'"]
      }
    },
    crossOriginEmbedderPolicy: false,
    crossOriginOpenerPolicy: { policy: 'cross-origin' },
    crossOriginResourcePolicy: { policy: 'cross-origin' },
    dnsPrefetchControl: { allow: false },
    frameguard: { action: 'deny' },
    hidePoweredBy: true,
    hsts: {
      maxAge: 31536000,
      includeSubDomains: true,
      preload: true
    },
    ieNoOpen: true,
    noSniff: true,
    originAgentCluster: true,
    permittedCrossDomainPolicies: false,
    referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
    xssFilter: true
  }
};

// Middleware de Rate Limiting
const createRateLimiter = (config) => {
  return rateLimit({
    windowMs: config.windowMs,
    max: config.max,
    message: config.message,
    standardHeaders: config.standardHeaders || true,
    legacyHeaders: config.legacyHeaders || false,
    keyGenerator: (req) => {
      // Usar IP + User ID se autenticado
      const baseKey = req.ip;
      const userKey = req.user ? `_${req.user.id}` : '';
      return `${baseKey}${userKey}`;
    },
    handler: (req, res) => {
      res.status(429).json(config.message);
    }
  });
};

// Rate limiters específicos
const generalLimiter = createRateLimiter(securityConfig.rateLimiting);
const chatLimiter = createRateLimiter(securityConfig.rateLimiting.chatLimit);
const voiceLimiter = createRateLimiter(securityConfig.rateLimiting.voiceLimit);

// Middleware de sanitização de input
const sanitizeInput = (req, res, next) => {
  try {
    // Sanitizar strings recursivamente
    const sanitizeObject = (obj) => {
      for (const key in obj) {
        if (typeof obj[key] === 'string') {
          // XSS protection
          obj[key] = xss(obj[key], {
            whiteList: {}, // Não permitir HTML
            stripIgnoreTag: true,
            stripIgnoreTagBody: ['script']
          });
          
          // Remover caracteres de controle
          obj[key] = obj[key].replace(/[\x00-\x1f\x7f-\x9f]/g, '');
          
          // Limitar tamanho
          if (obj[key].length > 10000) {
            obj[key] = obj[key].substring(0, 10000);
          }
        } else if (typeof obj[key] === 'object' && obj[key] !== null) {
          sanitizeObject(obj[key]);
        }
      }
    };

    if (req.body) {
      sanitizeObject(req.body);
    }
    
    if (req.query) {
      sanitizeObject(req.query);
    }
    
    if (req.params) {
      sanitizeObject(req.params);
    }

    next();
  } catch (error) {
    res.status(400).json({
      success: false,
      error: 'Dados de entrada inválidos',
      code: 'INVALID_INPUT'
    });
  }
};

// Validação de entrada específica para Matias
const validateMatiasInput = (req, res, next) => {
  const { message, language, phone, action } = req.body;

  // Validar mensagem
  if (message !== undefined) {
    if (!message || typeof message !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Mensagem é obrigatória e deve ser texto',
        code: 'INVALID_MESSAGE'
      });
    }

    if (message.length > 2000) {
      return res.status(400).json({
        success: false,
        error: 'Mensagem muito longa (máximo 2000 caracteres)',
        code: 'MESSAGE_TOO_LONG'
      });
    }

    // Detectar possíveis ataques de prompt injection
    const suspiciousPatterns = [
      /ignore\s+previous\s+instructions/i,
      /system\s*:|admin\s*:|root\s*:/i,
      /\bexec\b|\beval\b|\bshell\b/i,
      /<script|javascript:|data:/i,
      /\$\{.*\}/g, // Template injection
      /\{\{.*\}\}/g // Template injection
    ];

    const isSuspicious = suspiciousPatterns.some(pattern => 
      pattern.test(message)
    );

    if (isSuspicious) {
      return res.status(400).json({
        success: false,
        error: 'Conteúdo não permitido na mensagem',
        code: 'SUSPICIOUS_CONTENT'
      });
    }
  }

  // Validar idioma
  if (language && !['pt-BR', 'en', 'es'].includes(language)) {
    return res.status(400).json({
      success: false,
      error: 'Idioma não suportado',
      code: 'UNSUPPORTED_LANGUAGE'
    });
  }

  // Validar telefone (WhatsApp)
  if (phone && !validator.isMobilePhone(phone)) {
    return res.status(400).json({
      success: false,
      error: 'Número de telefone inválido',
      code: 'INVALID_PHONE'
    });
  }

  // Validar ação
  if (action && !['send', 'receive', 'status'].includes(action)) {
    return res.status(400).json({
      success: false,
      error: 'Ação inválida',
      code: 'INVALID_ACTION'
    });
  }

  next();
};

// Middleware de autenticação JWT
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({
      success: false,
      error: 'Token de acesso requerido',
      code: 'NO_TOKEN'
    });
  }

  jwt.verify(token, securityConfig.jwt.secret, {
    algorithm: securityConfig.jwt.algorithm,
    issuer: securityConfig.jwt.issuer,
    audience: securityConfig.jwt.audience
  }, (err, user) => {
    if (err) {
      return res.status(403).json({
        success: false,
        error: 'Token inválido ou expirado',
        code: 'INVALID_TOKEN'
      });
    }

    req.user = user;
    next();
  });
};

// Middleware opcional de autenticação (para APIs públicas)
const optionalAuth = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (token) {
    jwt.verify(token, securityConfig.jwt.secret, (err, user) => {
      if (!err) {
        req.user = user;
      }
    });
  }

  next();
};

// Geração de tokens JWT
const generateTokens = (user) => {
  const payload = {
    id: user.id,
    email: user.email,
    role: user.role || 'user'
  };

  const accessToken = jwt.sign(payload, securityConfig.jwt.secret, {
    expiresIn: securityConfig.jwt.expiresIn,
    algorithm: securityConfig.jwt.algorithm,
    issuer: securityConfig.jwt.issuer,
    audience: securityConfig.jwt.audience
  });

  const refreshToken = jwt.sign(
    { id: user.id }, 
    securityConfig.jwt.secret, 
    {
      expiresIn: securityConfig.jwt.refreshTokenExpiry,
      algorithm: securityConfig.jwt.algorithm,
      issuer: securityConfig.jwt.issuer,
      audience: securityConfig.jwt.audience
    }
  );

  return { accessToken, refreshToken };
};

// Criptografia de dados sensíveis
const encrypt = (text) => {
  const key = crypto.scryptSync(
    process.env.ENCRYPTION_KEY || 'default-key', 
    'salt', 
    securityConfig.encryption.keyLength
  );
  
  const iv = crypto.randomBytes(securityConfig.encryption.ivLength);
  const cipher = crypto.createCipher(securityConfig.encryption.algorithm, key, iv);
  
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  const tag = cipher.getAuthTag();
  
  return {
    encrypted,
    iv: iv.toString('hex'),
    tag: tag.toString('hex')
  };
};

const decrypt = (encryptedData) => {
  const key = crypto.scryptSync(
    process.env.ENCRYPTION_KEY || 'default-key', 
    'salt', 
    securityConfig.encryption.keyLength
  );
  
  const decipher = crypto.createDecipher(
    securityConfig.encryption.algorithm, 
    key, 
    Buffer.from(encryptedData.iv, 'hex')
  );
  
  decipher.setAuthTag(Buffer.from(encryptedData.tag, 'hex'));
  
  let decrypted = decipher.update(encryptedData.encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  
  return decrypted;
};

// Hash de senhas
const hashPassword = async (password) => {
  return await bcrypt.hash(password, securityConfig.password.saltRounds);
};

const verifyPassword = async (password, hash) => {
  return await bcrypt.compare(password, hash);
};

// Validação de força de senha
const validatePassword = (password) => {
  const config = securityConfig.password;
  const errors = [];

  if (password.length < config.minLength) {
    errors.push(`Senha deve ter pelo menos ${config.minLength} caracteres`);
  }

  if (config.requireUppercase && !/[A-Z]/.test(password)) {
    errors.push('Senha deve conter pelo menos uma letra maiúscula');
  }

  if (config.requireLowercase && !/[a-z]/.test(password)) {
    errors.push('Senha deve conter pelo menos uma letra minúscula');
  }

  if (config.requireNumbers && !/\d/.test(password)) {
    errors.push('Senha deve conter pelo menos um número');
  }

  if (config.requireSpecialChars && !/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    errors.push('Senha deve conter pelo menos um caractere especial');
  }

  return {
    valid: errors.length === 0,
    errors
  };
};

// Logs de segurança
const securityLogger = (event, details, req) => {
  const logEntry = {
    timestamp: new Date().toISOString(),
    event,
    details,
    ip: req?.ip,
    userAgent: req?.get('User-Agent'),
    userId: req?.user?.id,
    sessionId: req?.sessionID
  };

  console.log('SECURITY_LOG:', JSON.stringify(logEntry));

  // Em produção, enviar para serviço de monitoramento
  if (process.env.NODE_ENV === 'production') {
    // Integrar com Sentry, DataDog, etc.
  }
};

// Middleware de log de segurança
const logSecurityEvent = (eventType) => {
  return (req, res, next) => {
    const originalJson = res.json;
    
    res.json = function(data) {
      if (data && !data.success) {
        securityLogger(eventType, {
          error: data.error,
          code: data.code
        }, req);
      }
      
      return originalJson.call(this, data);
    };
    
    next();
  };
};

// Middleware de detecção de comportamento suspeito
const suspiciousBehaviorDetection = (req, res, next) => {
  const suspiciousPatterns = [
    // SQL Injection
    /(\bUNION\b|\bSELECT\b|\bINSERT\b|\bDELETE\b|\bDROP\b)/i,
    // NoSQL Injection
    /(\$where|\$regex|\$ne|\$gt|\$lt)/i,
    // Path Traversal
    /(\.\.\/|\.\.\\)/,
    // Command Injection
    /(\||&|;|\$\(|\`)/,
    // LDAP Injection
    /(\*|\(|\)|\\|\||&)/
  ];

  const requestData = JSON.stringify({
    body: req.body,
    query: req.query,
    params: req.params
  });

  const isSuspicious = suspiciousPatterns.some(pattern => 
    pattern.test(requestData)
  );

  if (isSuspicious) {
    securityLogger('SUSPICIOUS_REQUEST', {
      patterns: 'Multiple injection patterns detected',
      url: req.url,
      method: req.method
    }, req);

    return res.status(400).json({
      success: false,
      error: 'Solicitação rejeitada por motivos de segurança',
      code: 'SECURITY_VIOLATION'
    });
  }

  next();
};

// Configuração do Helmet
const helmetConfig = helmet(securityConfig.securityHeaders);

// CORS configurado com segurança
const corsConfig = {
  origin: process.env.NODE_ENV === 'production' 
    ? ['https://ofix.com.br', 'https://app.ofix.com.br']
    : ['http://localhost:3000', 'http://localhost:5173'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
  maxAge: 86400 // 24 horas
};

module.exports = {
  securityConfig,
  generalLimiter,
  chatLimiter,
  voiceLimiter,
  sanitizeInput,
  validateMatiasInput,
  authenticateToken,
  optionalAuth,
  generateTokens,
  encrypt,
  decrypt,
  hashPassword,
  verifyPassword,
  validatePassword,
  securityLogger,
  logSecurityEvent,
  suspiciousBehaviorDetection,
  helmetConfig,
  corsConfig,
  mongoSanitize: mongoSanitize()
};
