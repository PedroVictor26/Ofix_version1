import prisma from '../config/database.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import 'dotenv/config'; // Garante que process.env seja populado

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN;

if (!JWT_SECRET) {
  throw new Error('Variável de ambiente JWT_SECRET não definida.');
}

export async function registerUserAndOficina({ nomeUser, emailUser, passwordUser, nomeOficina, cnpjOficina, telefoneOficina, enderecoOficina, userRole = 'GESTOR_OFICINA' }) {
  const saltRounds = 10;
  const hashedPassword = await bcrypt.hash(passwordUser, saltRounds);

  // Usar transação para garantir atomicidade na criação de oficina e usuário
  return prisma.$transaction(async (tx) => {
    // 1. Criar a Oficina
    const oficina = await tx.oficina.create({
      data: {
        nome: nomeOficina,
        cnpj: cnpjOficina,
        telefone: telefoneOficina,
        endereco: enderecoOficina,
      },
    });

    // 2. Criar o Usuário e associar à Oficina
    const user = await tx.user.create({
      data: {
        nome: nomeUser,
        email: emailUser,
        password: hashedPassword,
        role: userRole, // ou um papel padrão como GESTOR_OFICINA
        oficinaId: oficina.id,
      },
      // Selecionar campos para retornar (excluindo a senha)
      select: {
        id: true,
        nome: true,
        email: true,
        role: true,
        oficinaId: true,
        oficina: {
            select: {
                id: true,
                nome: true
            }
        }
      }
    });

    return user; // Retorna o usuário criado (sem a senha)
  });
}

export async function loginUser({ email, password }) {
  const user = await prisma.user.findUnique({
    where: { email },
    include: { oficina: { select: { id: true, nome: true} } } // Inclui dados da oficina
  });

  if (!user) {
    return null; // Usuário não encontrado
  }

  const passwordMatch = await bcrypt.compare(password, user.password);
  if (!passwordMatch) {
    return null; // Senha incorreta
  }

  // Gerar o token JWT
  const tokenPayload = {
    userId: user.id,
    email: user.email,
    role: user.role,
    oficinaId: user.oficinaId,
    // Adicionar outros campos relevantes ao payload se necessário
  };

  const token = jwt.sign(tokenPayload, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN || '1d', // Default para 1 dia se não especificado
  });

  // Retornar dados do usuário (sem a senha) e o token
  const { password: _, ...userWithoutPassword } = user;
  return { user: userWithoutPassword, token };
}
