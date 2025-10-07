import prisma from "../config/database.js";

export const getAllProcedimentos = async (req, res) => {
  try {
    console.log("req.user in getAllProcedimentos:", req.user); // Debug log
    const oficinaId = req.user?.oficinaId;

    if (!oficinaId) {
      console.log("No oficinaId found for user:", req.user); // Debug log
      return res
        .status(400)
        .json({ error: "Usuário não está associado a uma oficina." });
    }

    const procedimentos = await prisma.procedimentoPadrao.findMany({
      where: {
        oficinaId: oficinaId,
      },
    });
    console.log(
      `Found ${procedimentos.length} procedimentos for oficina ${oficinaId}`
    ); // Debug log
    res.json(procedimentos);
  } catch (error) {
    console.error("Erro ao buscar procedimentos:", error);
    res.status(500).json({ error: "Erro interno do servidor." });
  }
};

export const getProcedimentoById = async (req, res) => {
  const { id } = req.params;
  try {
    const procedimento = await prisma.procedimentoPadrao.findUnique({
      where: { id },
    });
    if (!procedimento) {
      return res.status(404).json({ error: "Procedimento não encontrado." });
    }
    res.json(procedimento);
  } catch (error) {
    console.error("Erro ao buscar procedimento por ID:", error);
    res.status(500).json({ error: "Erro interno do servidor." });
  }
};

export const createProcedimento = async (req, res) => {
  const { nome, descricao, tempoEstimadoHoras, checklistJson, categoria } =
    req.body;
  const oficinaId = req.user?.oficinaId; // Obter oficinaId do usuário autenticado

  if (!oficinaId) {
    return res
      .status(400)
      .json({ error: "Usuário não está associado a uma oficina." });
  }

  try {
    const newProcedimento = await prisma.procedimentoPadrao.create({
      data: {
        nome,
        descricao,
        tempoEstimadoHoras,
        checklistJson,
        categoria: categoria || "manutencao_preventiva", // Incluir categoria
        oficina: {
          connect: { id: oficinaId }, // Conectar ao ID da oficina
        },
      },
    });
    res.status(201).json(newProcedimento);
  } catch (error) {
    console.error("Erro ao criar procedimento:", error);
    res.status(500).json({ error: "Erro interno do servidor." });
  }
};

export const updateProcedimento = async (req, res) => {
  const { id } = req.params;
  const { nome, descricao, tempoEstimadoHoras, checklistJson, categoria } =
    req.body;
  const oficinaId = req.user?.oficinaId; // Obter oficinaId do usuário autenticado

  console.log("Dados recebidos para atualização:", {
    nome,
    descricao,
    tempoEstimadoHoras,
    checklistJson,
    categoria,
  }); // Debug log

  if (!oficinaId) {
    return res
      .status(400)
      .json({ error: "Usuário não está associado a uma oficina." });
  }

  try {
    const updatedProcedimento = await prisma.procedimentoPadrao.update({
      where: { id },
      data: {
        nome,
        descricao,
        tempoEstimadoHoras,
        checklistJson,
        categoria, // Incluir categoria na atualização
        oficina: {
          connect: { id: oficinaId }, // Conectar ao ID da oficina
        },
      },
    });
    console.log("Procedimento atualizado:", updatedProcedimento); // Debug log
    res.json(updatedProcedimento);
  } catch (error) {
    console.error("Erro ao atualizar procedimento:", error);
    res.status(500).json({ error: "Erro interno do servidor." });
  }
};

export const deleteProcedimento = async (req, res) => {
  const { id } = req.params;
  try {
    await prisma.procedimentoPadrao.delete({
      where: { id },
    });
    res.status(204).send();
  } catch (error) {
    console.error("Erro ao deletar procedimento:", error);
    res.status(500).json({ error: "Erro interno do servidor." });
  }
};
