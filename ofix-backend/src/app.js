import express from 'express';
import cors from 'cors';
import 'dotenv/config';
import routes from './routes/index.js';
import agnoRoutes from './routes/agno.routes.js';
import { securityHeaders, rateLimit } from './middlewares/security.middleware.js';
import { sanitizeInput } from './middlewares/validation.middleware.js';

class Application {
  constructor() {
    this.server = express();
    this.setupMiddlewares();
    this.setupRoutes();
    this.setupErrorHandler();
  }

  setupMiddlewares() {
    // Middlewares de segurança (aplicados primeiro)
    this.server.use(securityHeaders);
    
    // Rate limiting (apenas em produção para não atrapalhar desenvolvimento)
    if (process.env.NODE_ENV === 'production') {
      this.server.use(rateLimit);
    }

    // Trust proxy para obter IP real (necessário para rate limiting)
    this.server.set('trust proxy', 1);

    // --- INÍCIO DA CORREÇÃO DO CORS ---

    // 1. Defina quais "origens" (sites) têm permissão para acessar sua API
    const allowedOrigins = [
      'https://ofix.vercel.app',  // URL de produção do seu frontend
      'http://localhost:5173',   // URL para desenvolvimento local com Vite
      'http://localhost:5174',   // URL para desenvolvimento local com Vite (porta alternativa)
      'http://localhost:3000',   // Outra URL comum para desenvolvimento local
      'http://localhost:4173',   // Vite preview
      'http://localhost:4174'    // Vite preview alternativa
    ];

    // 2. Crie as opções do CORS
    const corsOptions = {
      origin: (origin, callback) => {
        // Em desenvolvimento, permite qualquer localhost
        if (!origin || 
            allowedOrigins.includes(origin) || 
            (process.env.NODE_ENV === 'development' && origin?.includes('localhost'))) {
          callback(null, true);
        } else {
          callback(new Error('Not allowed by CORS'));
        }
      },
      methods: 'GET,HEAD,PUT,PATCH,POST,DELETE', // Métodos permitidos
      credentials: true, // Se precisar enviar cookies ou headers de autorização
    };

    // 3. Use o middleware CORS com as opções configuradas
    // For development, you can use a more permissive CORS setup
    if (process.env.NODE_ENV === 'development') {
      this.server.use(cors({
        origin: true, // Allow all origins in development
        credentials: true
      }));
    } else {
      this.server.use(cors(corsOptions));
    }

    // --- FIM DA CORREÇÃO DO CORS ---

    // Middleware para parsing JSON com limite de tamanho
    this.server.use(express.json({ limit: '10mb' }));
    this.server.use(express.urlencoded({ extended: true, limit: '10mb' }));
    
    // Middleware de sanitização de entrada
    this.server.use(sanitizeInput);

    // Logging de requisições (apenas em desenvolvimento)
    if (process.env.NODE_ENV === 'development') {
      this.server.use((req, res, next) => {
        console.log(`Requisição recebida: ${req.method} ${req.url}`);
        next();
      });
    }
  }

  setupRoutes() {
    // Health check endpoint
    this.server.get('/health', (req, res) => {
      res.json({ 
        status: 'OK', 
        message: 'OFIX Backend funcionando!',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'development'
      });
    });

    this.server.use('/api', routes);
    this.server.use('/agno', agnoRoutes);
    this.server.get('/', (req, res) => {
      res.json({ message: 'Bem-vindo à API OFIX!' });
    });
  }

  setupErrorHandler() {
    this.server.use((err, req, res, next) => {
      console.error(err.stack);
      if (res.headersSent) {
        return next(err);
      }
      res.status(err.status || 500).json({
        error: {
          message: err.message || 'Ocorreu um erro interno no servidor.',
          ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
        },
      });
    });
  }
}

export default new Application().server;