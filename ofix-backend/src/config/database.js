import { PrismaClient } from '@prisma/client';

// Instancia o Prisma Client
const prisma = new PrismaClient({
  // Opções de log (opcional, útil para desenvolvimento)
  log: process.env.NODE_ENV === 'development' ? ['query', 'info', 'warn', 'error'] : ['error'],
});

// Middleware para reconectar em caso de erro
prisma.$use(async (params, next) => {
  try {
    return await next(params)
  } catch (error) {
    if (error.code === 'P2024' || error.code === 'P2021') { // Timeout or table does not exist
      await prisma.$disconnect()
      await prisma.$connect()
      return await next(params)
    }
    throw error
  }
})

// Hook para fechar a conexão Prisma quando a aplicação encerrar (opcional, mas boa prática)
async function gracefulShutdown(signal) {
  console.log(`*${signal} recebido, fechando conexão Prisma...`);
  await prisma.$disconnect();
  console.log('Conexão Prisma fechada.');
  process.exit(0);
}

// Ouve por sinais de término para fechar a conexão Prisma
// process.on('SIGINT', () => gracefulShutdown('SIGINT')); // Ctrl+C
// process.on('SIGTERM', () => gracefulShutdown('SIGTERM')); // `kill` command

export default prisma;
