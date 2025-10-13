import express from 'express';
import prisma from '../config/database.js';
import { protectRoute } from '../middlewares/auth.middleware.js';

const router = express.Router();

// 💬 HISTÓRICO DE CONVERSAS COM MATIAS

// Salvar mensagem na conversa
router.post('/conversas/mensagem', protectRoute, async (req, res) => {
  try {
    const { userId, conversaId, tipo, conteudo, metadata = {} } = req.body;
    
    // Verificar se a conversa existe, se não criar uma nova
    let conversa;
    if (conversaId) {
      conversa = await prisma.conversaMatias.findUnique({
        where: { id: conversaId }
      });
    }
    
    if (!conversa) {
      conversa = await prisma.conversaMatias.create({
        data: {
          userId: parseInt(userId),
          titulo: `Conversa ${new Date().toLocaleDateString()}`,
          ativa: true
        }
      });
    }

    // Salvar a mensagem
    const mensagem = await prisma.mensagemMatias.create({
      data: {
        conversaId: conversa.id,
        tipo, // 'user' ou 'matias'  
        conteudo,
        metadata
      }
    });

    res.json({
      success: true,
      mensagem,
      conversaId: conversa.id
    });
  } catch (error) {
    res.status(500).json({
      error: 'Erro ao salvar mensagem',
      details: error.message
    });
  }
});

// Buscar histórico de conversas do usuário
router.get('/conversas/historico/:userId', protectRoute, async (req, res) => {
  try {
    const { userId } = req.params;
    const { limite = 10 } = req.query;

    const conversas = await prisma.conversaMatias.findMany({
      where: {
        userId: parseInt(userId),
        ativa: true
      },
      include: {
        mensagens: {
          orderBy: { createdAt: 'desc' },
          take: 1 // Última mensagem para preview
        },
        _count: {
          select: { mensagens: true }
        }
      },
      orderBy: { updatedAt: 'desc' },
      take: parseInt(limite)
    });

    res.json(conversas);
  } catch (error) {
    res.status(500).json({
      error: 'Erro ao buscar histórico',
      details: error.message
    });
  }
});

// Buscar mensagens de uma conversa específica
router.get('/conversas/:conversaId/mensagens', protectRoute, async (req, res) => {
  try {
    const { conversaId } = req.params;

    const mensagens = await prisma.mensagemMatias.findMany({
      where: {
        conversaId: parseInt(conversaId)
      },
      orderBy: { createdAt: 'asc' }
    });

    res.json(mensagens);
  } catch (error) {
    res.status(500).json({
      error: 'Erro ao buscar mensagens',
      details: error.message
    });
  }
});

// 📅 SISTEMA DE AGENDAMENTOS

// Verificar disponibilidade
router.get('/agendamentos/disponibilidade', protectRoute, async (req, res) => {
  try {
    const { data, tipo = 'normal' } = req.query;
    
    // Buscar agendamentos já marcados para a data
    const agendamentosExistentes = await prisma.agendamento.findMany({
      where: {
        dataHora: {
          gte: new Date(`${data}T00:00:00`),
          lt: new Date(`${data}T23:59:59`)
        },
        status: 'confirmado'
      }
    });

    // Definir horários disponíveis baseado no tipo
    const todosHorarios = tipo === 'urgente' 
      ? ['08:00', '09:00', '10:00', '11:00', '13:00', '14:00', '15:00', '16:00', '17:00']
      : ['08:00', '10:00', '13:00', '15:00'];

    // Filtrar horários já ocupados
    const horariosOcupados = agendamentosExistentes.map(ag => {
      const hora = new Date(ag.dataHora).toTimeString().substring(0, 5);
      return hora;
    });

    const horariosDisponiveis = todosHorarios.filter(h => !horariosOcupados.includes(h));

    res.json({
      disponivel: horariosDisponiveis.length > 0,
      horarios: horariosDisponiveis,
      horariosOcupados,
      proximaDataDisponivel: horariosDisponiveis.length === 0 ? 
        new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0] : null
    });
  } catch (error) {
    res.status(500).json({
      error: 'Erro ao verificar disponibilidade',
      details: error.message
    });
  }
});

// Criar agendamento
router.post('/agendamentos', protectRoute, async (req, res) => {
  try {
    const { servicoId, clienteId, veiculoId, dataHora, tipo, observacoes } = req.body;

    const agendamento = await prisma.agendamento.create({
      data: {
        servicoId: parseInt(servicoId),
        clienteId: parseInt(clienteId),
        veiculoId: veiculoId ? parseInt(veiculoId) : null,
        dataHora: new Date(dataHora),
        tipo,
        status: 'confirmado',
        observacoes,
        criadoPor: 'matias_ia'
      }
    });

    res.json({
      success: true,
      agendamento
    });
  } catch (error) {
    res.status(500).json({
      error: 'Erro ao criar agendamento',
      details: error.message
    });
  }
});

// 📋 CONSULTAS DE OS

// Buscar estatísticas rápidas
router.get('/servicos/count', protectRoute, async (req, res) => {
  try {
    const { status } = req.query;
    
    const count = await prisma.servico.count({
      where: status ? { status } : {}
    });

    res.json({ count });
  } catch (error) {
    res.status(500).json({
      error: 'Erro ao contar serviços',
      details: error.message
    });
  }
});

// Buscar procedimentos de um serviço
router.get('/servicos/:servicoId/procedimentos', protectRoute, async (req, res) => {
  try {
    const { servicoId } = req.params;

    const procedimentos = await prisma.procedimentoServico.findMany({
      where: {
        servicoId: parseInt(servicoId)
      },
      include: {
        procedimento: true
      }
    });

    res.json(procedimentos);
  } catch (error) {
    res.status(500).json({
      error: 'Erro ao buscar procedimentos',
      details: error.message
    });
  }
});

// Buscar veículos por placa
router.get('/veiculos', protectRoute, async (req, res) => {
  try {
    const { placa } = req.query;

    const veiculos = await prisma.veiculo.findMany({
      where: placa ? {
        placa: {
          contains: placa.toUpperCase()
        }
      } : {}
    });

    res.json(veiculos);
  } catch (error) {
    res.status(500).json({
      error: 'Erro ao buscar veículos',
      details: error.message
    });
  }
});

export default router;