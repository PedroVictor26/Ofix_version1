import prisma from '../config/database.js';

export const getAllFornecedores = async (req, res) => {
  try {
    const fornecedores = await prisma.fornecedor.findMany();
    res.json(fornecedores);
  } catch (error) {
    console.error("Erro ao buscar fornecedores:", error);
    res.status(500).json({ error: "Erro interno do servidor." });
  }
};

export const getFornecedorById = async (req, res) => {
  const { id } = req.params;
  try {
    const fornecedor = await prisma.fornecedor.findUnique({
      where: { id },
    });
    if (!fornecedor) {
      return res.status(404).json({ error: "Fornecedor não encontrado." });
    }
    res.json(fornecedor);
  } catch (error) {
    console.error("Erro ao buscar fornecedor por ID:", error);
    res.status(500).json({ error: "Erro interno do servidor." });
  }
};

export const createFornecedor = async (req, res) => {
  const { nome, contato, email } = req.body;
  const oficinaId = req.user?.oficinaId; // Pega o ID da oficina do usuário autenticado

  if (!nome) {
    return res.status(400).json({ error: 'O campo nome é obrigatório.' });
  }

  if (!oficinaId) {
    return res.status(400).json({ error: 'Usuário não está associado a uma oficina.' });
  }

  try {
    const newFornecedor = await prisma.fornecedor.create({
      data: {
        nome,
        telefone: contato,
        email,
        oficina: {
          connect: { id: oficinaId }, // Conecta o fornecedor à oficina do usuário
        },
      },
    });
    res.status(201).json(newFornecedor);
  } catch (error) {
    console.error("Erro ao criar fornecedor:", error);
    res.status(500).json({ error: "Erro interno do servidor." });
  }
};

export const updateFornecedor = async (req, res) => {
  const { id } = req.params;
  const { nome, cnpjCpf, telefone, email, endereco } = req.body;
  try {
    const updatedFornecedor = await prisma.fornecedor.update({
      where: { id },
      data: {
        nome,
        cnpjCpf,
        telefone,
        email,
        endereco,
      },
    });
    res.json(updatedFornecedor);
  } catch (error) {
    console.error("Erro ao atualizar fornecedor:", error);
    res.status(500).json({ error: "Erro interno do servidor." });
  }
};

export const deleteFornecedor = async (req, res) => {
  const { id } = req.params;
  try {
    await prisma.fornecedor.delete({
      where: { id },
    });
    res.status(204).send();
  } catch (error) {
    console.error("Erro ao deletar fornecedor:", error);
    res.status(500).json({ error: "Erro interno do servidor." });
  }
};