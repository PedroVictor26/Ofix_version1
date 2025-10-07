import prisma from "../config/database.js";

export const getAllPecas = async (req, res) => {
  try {
    const pecas = await prisma.peca.findMany({
      include: {
        fornecedor: true,
      },
    });

    // Mapear os campos para compatibilidade com o frontend
    const pecasFormatted = pecas.map((peca) => ({
      ...peca,
      sku: peca.codigoFabricante,
      quantidade: peca.estoqueAtual,
    }));

    res.json(pecasFormatted);
  } catch (error) {
    console.error("Erro ao buscar peças:", error);
    res.status(500).json({ error: "Erro interno do servidor." });
  }
};

export const getPecaById = async (req, res) => {
  const { id } = req.params;
  try {
    const peca = await prisma.peca.findUnique({
      where: { id },
      include: {
        fornecedor: true,
      },
    });
    if (!peca) {
      return res.status(404).json({ error: "Peça não encontrada." });
    }

    // Mapear os campos para compatibilidade com o frontend
    const pecaFormatted = {
      ...peca,
      sku: peca.codigoFabricante,
      quantidade: peca.estoqueAtual,
    };

    res.json(pecaFormatted);
  } catch (error) {
    console.error("Erro ao buscar peça por ID:", error);
    res.status(500).json({ error: "Erro interno do servidor." });
  }
};

export const createPeca = async (req, res) => {
  const {
    nome,
    sku,
    fabricante,
    fornecedorId,
    precoCusto,
    precoVenda,
    quantidade,
    estoqueMinimo,
  } = req.body;
  const oficinaId = req.user?.oficinaId;

  if (!nome || !sku) {
    return res.status(400).json({ error: "Nome e SKU são obrigatórios." });
  }

  if (!oficinaId) {
    return res
      .status(400)
      .json({ error: "Usuário não está associado a uma oficina." });
  }

  try {
    const newPeca = await prisma.peca.create({
      data: {
        nome,
        codigoFabricante: sku,
        fabricante,
        precoCusto: parseFloat(precoCusto) || 0,
        precoVenda: parseFloat(precoVenda) || 0,
        estoqueAtual: parseInt(quantidade) || 0,
        estoqueMinimo: parseInt(estoqueMinimo) || 0,
        oficina: {
          connect: { id: oficinaId },
        },
        ...(fornecedorId && { fornecedor: { connect: { id: fornecedorId } } }),
      },
      include: {
        fornecedor: true,
      },
    });

    // Mapear os campos para compatibilidade com o frontend
    const pecaFormatted = {
      ...newPeca,
      sku: newPeca.codigoFabricante,
      quantidade: newPeca.estoqueAtual,
    };

    res.status(201).json(pecaFormatted);
  } catch (error) {
    console.error("Erro ao criar peça:", error);
    res.status(500).json({ error: "Erro interno do servidor." });
  }
};

export const updatePeca = async (req, res) => {
  const { id } = req.params;
  const {
    nome,
    sku,
    fabricante,
    fornecedorId,
    precoCusto,
    precoVenda,
    quantidade,
    estoqueMinimo,
  } = req.body;

  try {
    const updateData = {
      nome,
      codigoFabricante: sku,
      fabricante,
      precoCusto: parseFloat(precoCusto) || 0,
      precoVenda: parseFloat(precoVenda) || 0,
      estoqueAtual: parseInt(quantidade) || 0,
      estoqueMinimo: parseInt(estoqueMinimo) || 0,
    };

    // Gerenciar fornecedor separadamente
    if (fornecedorId) {
      updateData.fornecedor = { connect: { id: fornecedorId } };
    } else {
      updateData.fornecedorId = null;
    }

    const updatedPeca = await prisma.peca.update({
      where: { id },
      data: updateData,
      include: {
        fornecedor: true,
      },
    });

    // Mapear os campos para compatibilidade com o frontend
    const pecaFormatted = {
      ...updatedPeca,
      sku: updatedPeca.codigoFabricante,
      quantidade: updatedPeca.estoqueAtual,
    };

    res.json(pecaFormatted);
  } catch (error) {
    console.error("Erro ao atualizar peça:", error);
    res.status(500).json({ error: "Erro interno do servidor." });
  }
};

export const deletePeca = async (req, res) => {
  const { id } = req.params;
  try {
    await prisma.peca.delete({
      where: { id },
    });
    res.status(204).send();
  } catch (error) {
    console.error("Erro ao deletar peça:", error);
    res.status(500).json({ error: "Erro interno do servidor." });
  }
};

// Novo endpoint para dashboard - peças com estoque baixo
export const getEstoqueBaixo = async (req, res) => {
  try {
    const oficinaId = req.user?.oficinaId;
    
    if (!oficinaId) {
      return res.status(400).json({ error: "Usuário não está associado a uma oficina." });
    }

    const pecas = await prisma.peca.findMany({
      where: { oficinaId },
    });

    // Calcular estoque baixo usando a mesma lógica do frontend
    const estoqueBaixo = pecas.filter(peca => {
      const qtd = peca.estoqueAtual || 0;
      const min = peca.estoqueMinimo || 0;
      return qtd <= min;
    }).length;

    res.json({ count: estoqueBaixo });
  } catch (error) {
    console.error("Erro ao buscar estoque baixo:", error);
    res.status(500).json({ error: "Erro interno do servidor." });
  }
};
