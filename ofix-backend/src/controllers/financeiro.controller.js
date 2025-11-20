import prisma from '../config/database.js';

export const getAllTransacoes = async (req, res) => {
  const oficinaId = req.user?.oficinaId;

  if (!oficinaId) {
    return res.status(400).json({ error: 'Usuário não está associado a uma oficina.' });
  }

  try {
    console.log('Verificando prisma.financeiro:', prisma.financeiro); // Adicionado para depuração
    const transacoes = await prisma.financeiro.findMany({
      where: { oficinaId },
    });
    res.json(transacoes);
  } catch (error) {
    console.error("Erro ao buscar transações financeiras:", error);
    res.status(500).json({ error: "Erro interno do servidor." });
  }
};

export const getTransacaoById = async (req, res) => {
  const { id } = req.params;
  try {
    const transacao = await prisma.financeiro.findUnique({
      where: { id },
    });
    if (!transacao) {
      return res.status(404).json({ error: "Transação não encontrada." });
    }
    res.json(transacao);
  } catch (error) {
    console.error("Erro ao buscar transação por ID:", error);
    res.status(500).json({ error: "Erro interno do servidor." });
  }
};

export const createTransacao = async (req, res) => {
  if (req.user?.isGuest) {
    return res.status(403).json({ error: 'Acesso negado. Convidados não podem criar transações.' });
  }

  const { descricao, valor, tipo, categoria, data, servicoId } = req.body;
  const oficinaId = req.user?.oficinaId;

  if (!oficinaId) {
    return res.status(400).json({ error: 'Usuário não está associado a uma oficina.' });
  }

  try {
    const newTransacao = await prisma.financeiro.create({
      data: {
        descricao,
        valor,
        tipo,
        categoria,
        data: new Date(data),
        servicoId,
        oficinaId, // Adicionado oficinaId
      },
    });
    res.status(201).json(newTransacao);
  } catch (error) {
    console.error("Erro ao criar transação:", error);
    res.status(500).json({ error: "Erro interno do servidor." });
  }
};

export const updateTransacao = async (req, res) => {
  if (req.user?.isGuest) {
    return res.status(403).json({ error: 'Acesso negado. Convidados não podem editar transações.' });
  }

  const { id } = req.params;
  const { descricao, valor, tipo, categoria, data, servicoId } = req.body;
  const oficinaId = req.user?.oficinaId;

  if (!oficinaId) {
    return res.status(400).json({ error: 'Usuário não está associado a uma oficina.' });
  }

  try {
    const updatedTransacao = await prisma.financeiro.update({
      where: { id, oficinaId }, // Adicionado oficinaId ao where
      data: {
        descricao,
        valor,
        tipo,
        categoria,
        data: new Date(data),
        servicoId,
      },
    });
    res.json(updatedTransacao);
  } catch (error) {
    console.error("Erro ao atualizar transação:", error);
    res.status(500).json({ error: "Erro interno do servidor." });
  }
};

export const deleteTransacao = async (req, res) => {
  if (req.user?.isGuest) {
    return res.status(403).json({ error: 'Acesso negado. Convidados não podem excluir transações.' });
  }

  const { id } = req.params;
  try {
    await prisma.financeiro.delete({
      where: { id },
    });
    res.status(204).send();
  } catch (error) {
    console.error("Erro ao deletar transação:", error);
    res.status(500).json({ error: "Erro interno do servidor." });
  }
};