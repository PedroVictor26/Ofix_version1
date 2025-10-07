import prisma from '../config/database.js';

export const getAllMensagens = async (req, res) => {
  try {
    console.log('req.user in getAllMensagens:', req.user); // Debug log
    const oficinaId = req.user?.oficinaId;
    
    if (!oficinaId) {
      console.log('No oficinaId found for user:', req.user); // Debug log
      return res.status(400).json({ error: 'Usuário não está associado a uma oficina.' });
    }

    const mensagens = await prisma.mensagemPadrao.findMany({
      where: {
        oficinaId: oficinaId
      }
    });
    console.log(`Found ${mensagens.length} mensagens for oficina ${oficinaId}`); // Debug log
    res.json(mensagens);
  } catch (error) {
    console.error("Erro ao buscar mensagens:", error);
    res.status(500).json({ error: "Erro interno do servidor." });
  }
};

export const getMensagemById = async (req, res) => {
  const { id } = req.params;
  try {
    const mensagem = await prisma.mensagemPadrao.findUnique({
      where: { id },
    });
    if (!mensagem) {
      return res.status(404).json({ error: "Mensagem não encontrada." });
    }
    res.json(mensagem);
  } catch (error) {
    console.error("Erro ao buscar mensagem por ID:", error);
    res.status(500).json({ error: "Erro interno do servidor." });
  }
};

export const createMensagem = async (req, res) => {
  const { nome, template, categoria } = req.body;
  const oficinaId = req.user?.oficinaId;

  if (!oficinaId) {
    return res.status(400).json({ error: 'Usuário não está associado a uma oficina.' });
  }

  try {
    const newMensagem = await prisma.mensagemPadrao.create({
      data: {
        nome,
        template,
        categoria,
        oficina: {
          connect: { id: oficinaId },
        },
      },
    });
    res.status(201).json(newMensagem);
  } catch (error) {
    console.error("Erro ao criar mensagem:", error);
    res.status(500).json({ error: "Erro interno do servidor." });
  }
};

export const updateMensagem = async (req, res) => {
  const { id } = req.params;
  const { nome, template, categoria } = req.body;
  const oficinaId = req.user?.oficinaId;

  console.log('ID da mensagem a ser atualizada:', id);
  console.log('oficinaId do usuário autenticado:', oficinaId);

  if (!oficinaId) {
    return res.status(400).json({ error: 'Usuário não está associado a uma oficina.' });
  }

  try {
    const existingMensagem = await prisma.mensagemPadrao.findUnique({
      where: { id },
    });

    if (!existingMensagem) {
      return res.status(404).json({ error: "Mensagem não encontrada." });
    }

    if (existingMensagem.oficinaId !== oficinaId) {
      return res.status(403).json({ error: "Você não tem permissão para atualizar esta mensagem." });
    }

    const updatedMensagem = await prisma.mensagemPadrao.update({
      where: { id },
      data: {
        nome,
        template,
        categoria,
      },
    });
    res.json(updatedMensagem);
  } catch (error) {
    console.error("Erro ao atualizar mensagem:", error);
    res.status(500).json({ error: "Erro interno do servidor." });
  }
};

export const deleteMensagem = async (req, res) => {
  const { id } = req.params;
  try {
    await prisma.mensagemPadrao.delete({
      where: { id },
    });
    res.status(204).send();
  } catch (error) {
    console.error("Erro ao deletar mensagem:", error);
    res.status(500).json({ error: "Erro interno do servidor." });
  }
};