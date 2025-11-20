import prisma from "../config/database.js";

class ClientesController {
  async createCliente(req, res, next) {
    try {
      if (req.user?.isGuest) {
        return res.status(403).json({ error: 'Acesso negado. Convidados não podem criar clientes.' });
      }

      const { nomeCompleto, cpfCnpj, telefone, email, endereco } = req.body;
      const oficinaId = req.user?.oficinaId;

      if (!oficinaId) {
        return res
          .status(401)
          .json({ error: "Oficina não identificada. Acesso não autorizado." });
      }

      if (!nomeCompleto || !telefone) {
        return res
          .status(400)
          .json({ error: "Nome completo e telefone são obrigatórios." });
      }

      const novoCliente = await prisma.cliente.create({
        data: {
          nomeCompleto,
          cpfCnpj,
          telefone,
          email,
          endereco,
          oficina: { connect: { id: oficinaId } },
        },
      });
      res.status(201).json(novoCliente);
    } catch (error) {
      if (error.code === "P2002" && error.meta?.target?.includes("cpfCnpj")) {
        return res.status(409).json({ error: "CPF/CNPJ já cadastrado." });
      }
      if (error.code === "P2002" && error.meta?.target?.includes("email")) {
        return res.status(409).json({ error: "Email já cadastrado." });
      }
      next(error);
    }
  }

  async getAllClientes(req, res, next) {
    try {
      const oficinaId = req.user?.oficinaId;
      if (!oficinaId) {
        return res.status(401).json({ error: "Oficina não identificada." });
      }

      const clientes = await prisma.cliente.findMany({
        where: { oficinaId },
        include: { veiculos: true }, // Inclui os veículos relacionados
        orderBy: { nomeCompleto: "asc" },
      });

      if (req.user?.isGuest) {
        const maskedClientes = clientes.map(cliente => ({
          ...cliente,
          cpfCnpj: cliente.cpfCnpj ? '***.***.***-**' : null,
          telefone: cliente.telefone ? '(**) *****-****' : null,
          email: cliente.email ? '***@***.***' : null,
          endereco: cliente.endereco ? 'Endereço Oculto' : null,
        }));
        return res.json(maskedClientes);
      }

      res.json(clientes);
    } catch (error) {
      next(error);
    }
  }

  async getClienteById(req, res, next) {
    try {
      const { id } = req.params;
      const oficinaId = req.user?.oficinaId;

      if (!oficinaId) {
        return res.status(401).json({ error: "Oficina não identificada." });
      }

      const cliente = await prisma.cliente.findUnique({
        where: { id, oficinaId },
      });

      if (!cliente) {
        return res.status(404).json({ error: "Cliente não encontrado." });
      }

      if (req.user?.isGuest) {
        return res.json({
          ...cliente,
          cpfCnpj: cliente.cpfCnpj ? '***.***.***-**' : null,
          telefone: cliente.telefone ? '(**) *****-****' : null,
          email: cliente.email ? '***@***.***' : null,
          endereco: cliente.endereco ? 'Endereço Oculto' : null,
        });
      }

      res.json(cliente);
    } catch (error) {
      next(error);
    }
  }

  async updateCliente(req, res, next) {
    try {
      if (req.user?.isGuest) {
        return res.status(403).json({ error: 'Acesso negado. Convidados não podem editar clientes.' });
      }

      const { id } = req.params;
      const oficinaId = req.user?.oficinaId;

      if (!oficinaId) {
        return res.status(401).json({ error: "Oficina não identificada." });
      }

      const clienteExistente = await prisma.cliente.findUnique({
        where: { id, oficinaId },
      });

      if (!clienteExistente) {
        return res
          .status(404)
          .json({ error: "Cliente não encontrado para atualização." });
      }

      // Filtrar apenas os campos válidos do schema
      const { nomeCompleto, cpfCnpj, telefone, email, endereco } = req.body;
      const updateData = {};

      if (nomeCompleto !== undefined) updateData.nomeCompleto = nomeCompleto;
      if (cpfCnpj !== undefined) updateData.cpfCnpj = cpfCnpj;
      if (telefone !== undefined) updateData.telefone = telefone;
      if (email !== undefined) updateData.email = email;
      if (endereco !== undefined) updateData.endereco = endereco;

      const clienteAtualizado = await prisma.cliente.update({
        where: { id, oficinaId },
        data: updateData,
      });
      res.json(clienteAtualizado);
    } catch (error) {
      if (error.code === "P2002" && error.meta?.target?.includes("cpfCnpj")) {
        return res.status(409).json({ error: "CPF/CNPJ já cadastrado." });
      }
      if (error.code === "P2002" && error.meta?.target?.includes("email")) {
        return res.status(409).json({ error: "Email já cadastrado." });
      }
      next(error);
    }
  }

  async deleteCliente(req, res, next) {
    try {
      if (req.user?.isGuest) {
        return res.status(403).json({ error: 'Acesso negado. Convidados não podem excluir clientes.' });
      }

      const { id } = req.params;
      const oficinaId = req.user?.oficinaId;

      if (!oficinaId) {
        return res.status(401).json({ error: "Oficina não identificada." });
      }

      const clienteExistente = await prisma.cliente.findUnique({
        where: { id, oficinaId },
        include: {
          veiculos: true,
          servicos: true,
        },
      });

      if (!clienteExistente) {
        return res
          .status(404)
          .json({ error: "Cliente não encontrado para exclusão." });
      }

      // Usar transação para garantir que tudo seja excluído ou nada seja excluído
      await prisma.$transaction(async (tx) => {
        // Primeiro, excluir todos os serviços relacionados
        if (clienteExistente.servicos.length > 0) {
          await tx.servico.deleteMany({
            where: { clienteId: id },
          });
        }

        // Depois, excluir todos os veículos relacionados
        if (clienteExistente.veiculos.length > 0) {
          await tx.veiculo.deleteMany({
            where: { clienteId: id },
          });
        }

        // Por fim, excluir o cliente
        await tx.cliente.delete({
          where: { id, oficinaId },
        });
      });

      res.status(204).send();
    } catch (error) {
      console.error("Erro ao excluir cliente:", error);
      next(error);
    }
  }

  async createVeiculo(req, res, next) {
    try {
      if (req.user?.isGuest) {
        return res.status(403).json({ error: 'Acesso negado. Convidados não podem criar veículos.' });
      }

      const { clienteId } = req.params;
      const {
        placa,
        marca,
        modelo,
        anoFabricacao,
        anoModelo,
        cor,
        chassi,
        kmAtual,
      } = req.body;
      const oficinaId = req.user?.oficinaId;

      console.log("Dados recebidos para criar veículo:", {
        clienteId,
        placa,
        marca,
        modelo,
        anoFabricacao,
        cor,
        oficinaId,
      }); // Debug log

      if (!oficinaId) {
        return res
          .status(401)
          .json({ error: "Oficina não identificada. Acesso não autorizado." });
      }

      if (!placa || !marca || !modelo || !clienteId) {
        return res.status(400).json({
          error: "Placa, marca, modelo e ID do cliente são obrigatórios.",
        });
      }

      const clienteExists = await prisma.cliente.findUnique({
        where: { id: clienteId, oficinaId },
      });

      if (!clienteExists) {
        return res.status(404).json({ error: "Cliente não encontrado." });
      }

      const novoVeiculo = await prisma.veiculo.create({
        data: {
          placa,
          marca,
          modelo,
          anoFabricacao: anoFabricacao || new Date().getFullYear(),
          cor,
          cliente: {
            connect: { id: clienteId },
          },
          oficina: {
            connect: { id: oficinaId },
          },
        },
      });
      res.status(201).json(novoVeiculo);
    } catch (error) {
      if (error.code === "P2002" && error.meta?.target?.includes("placa")) {
        return res.status(409).json({ error: "Placa já cadastrada." });
      }
      if (error.code === "P2002" && error.meta?.target?.includes("chassi")) {
        return res.status(409).json({ error: "Chassi já cadastrado." });
      }
      next(error);
    }
  }
}

export default new ClientesController();
