import prisma from '../config/database.js'; // Importa a instância do Prisma Client
import { ServiceStatus } from '@prisma/client'; // Importar o enum ServiceStatus

class ServicosController {
  async createServico(req, res, next) {
    try {
      if (req.user?.isGuest) {
        return res.status(403).json({ error: 'Acesso negado. Convidados não podem criar serviços.' });
      }

      const {
        numeroOs, status, descricaoProblema, descricaoSolucao, dataEntrada,
        dataPrevisaoEntrega, dataConclusao, dataEntregaCliente, valorTotalEstimado,
        valorTotalServicos, valorTotalPecas, valorTotalFinal, kmEntrada, checklist,
        observacoes, clienteId, veiculoId, responsavelId
      } = req.body;

      const oficinaId = req.user?.oficinaId;

      if (!oficinaId) {
        return res.status(401).json({ error: 'Oficina não identificada. Acesso não autorizado.' });
      }

      if (!clienteId || !veiculoId || !numeroOs) {
        return res.status(400).json({ error: 'Campos obrigatórios (numeroOs, clienteId, veiculoId) faltando.' });
      }

      // Validação adicional (exemplos)
      const clienteExists = await prisma.cliente.findUnique({ where: { id: clienteId, oficinaId } });
      if (!clienteExists) {
        return res.status(404).json({ error: 'Cliente não encontrado nesta oficina.' });
      }
      const veiculoExists = await prisma.veiculo.findUnique({ where: { id: veiculoId, clienteId } }); // Garante que o veículo pertence ao cliente
      if (!veiculoExists) {
        return res.status(404).json({ error: 'Veículo não encontrado ou não pertence ao cliente informado.' });
      }
      if (responsavelId) {
        const responsavelExists = await prisma.user.findUnique({ where: { id: responsavelId, oficinaId } });
        if (!responsavelExists) {
          return res.status(404).json({ error: 'Usuário responsável não encontrado nesta oficina.' });
        }
      }


      const novoServico = await prisma.servico.create({
        data: {
          numeroOs,
          status, // Garanta que o status enviado seja um valor válido do Enum StatusServico
          descricaoProblema,
          descricaoSolucao,
          dataEntrada: dataEntrada ? new Date(dataEntrada) : new Date(),
          dataPrevisaoEntrega: dataPrevisaoEntrega ? new Date(dataPrevisaoEntrega) : undefined,
          dataConclusao: dataConclusao ? new Date(dataConclusao) : undefined,
          dataEntregaCliente: dataEntregaCliente ? new Date(dataEntregaCliente) : undefined,
          valorTotalEstimado,
          valorTotalServicos,
          valorTotalPecas,
          valorTotalFinal,
          kmEntrada,
          checklist, // Prisma espera um JsonNull ou um objeto JSON válido
          observacoes,
          cliente: { connect: { id: clienteId } },
          veiculo: { connect: { id: veiculoId } },
          ...(responsavelId && { responsavel: { connect: { id: responsavelId } } }),
          oficina: { connect: { id: oficinaId } },
        },
        select: { // Usar select para incluir apenas os campos necessários
          id: true,
          numeroOs: true,
          status: true,
          descricaoProblema: true,
          dataEntrada: true,
          kmEntrada: true,
          valorTotalEstimado: true,
          clienteId: true, // Incluir clienteId diretamente
          veiculoId: true, // Incluir veiculoId diretamente
          responsavelId: true,
          oficinaId: true,
          cliente: { select: { id: true, nomeCompleto: true } },
          veiculo: { select: { id: true, placa: true, modelo: true } },
          responsavel: { select: { id: true, nome: true } },
        }
      });
      res.status(201).json(novoServico);
    } catch (error) {
      if (error.code === 'P2002' && error.meta?.target?.includes('numeroOs')) {
        return res.status(409).json({ error: 'Número da Ordem de Serviço já existe.' });
      }
      if (error.code === 'P2025') { // Foreign key constraint failed
        return res.status(400).json({ error: 'Erro ao conectar entidades relacionadas (ex: cliente, veículo, responsável ou oficina não encontrados).' });
      }
      next(error);
    }
  }

  async getAllServicos(req, res, next) {
    try {
      const oficinaId = req.user?.oficinaId;
      if (!oficinaId) {
        return res.status(401).json({ error: 'Oficina não identificada.' });
      }

      // TODO: Adicionar filtros (por status, cliente, data, etc.) e paginação
      const { status, clienteId, veiculoId, dataDe, dataAte } = req.query;
      const whereConditions = { oficinaId };

      if (status) whereConditions.status = status;
      if (clienteId) whereConditions.clienteId = clienteId;
      if (veiculoId) whereConditions.veiculoId = veiculoId;
      if (dataDe) whereConditions.dataEntrada = { ...whereConditions.dataEntrada, gte: new Date(dataDe) };
      if (dataAte) whereConditions.dataEntrada = { ...whereConditions.dataEntrada, lte: new Date(dataAte) };

      const servicos = await prisma.servico.findMany({
        where: whereConditions,
        include: { // Inclui todos os dados do veículo e cliente relacionados
          cliente: true,
          veiculo: true,
          responsavel: { select: { id: true, nome: true } },
        },
        orderBy: {
          dataEntrada: 'desc' // Exemplo de ordenação
        }
      });

      if (req.user?.isGuest) {
        const maskedServicos = servicos.map(servico => ({
          ...servico,
          cliente: servico.cliente ? {
            ...servico.cliente,
            cpfCnpj: servico.cliente.cpfCnpj ? '***.***.***-**' : null,
            telefone: servico.cliente.telefone ? '(**) *****-****' : null,
            email: servico.cliente.email ? '***@***.***' : null,
            endereco: servico.cliente.endereco ? 'Endereço Oculto' : null,
          } : null
        }));
        return res.json(maskedServicos);
      }

      res.json(servicos);
    } catch (error) {
      next(error);
    }
  }

  async getServicoById(req, res, next) {
    try {
      const { id } = req.params;
      // Descomentar
      const oficinaId = req.user?.oficinaId;
      if (!oficinaId) {
        return res.status(401).json({ error: 'Oficina não identificada.' });
      }

      const servico = await prisma.servico.findUnique({
        where: { id, oficinaId }, // Garante que só busca na oficina do usuário
        include: {
          cliente: true, // Exemplo: buscar todos os dados do cliente
          veiculo: true,
          responsavel: { select: { id: true, nome: true, email: true } },
          itensPeca: { include: { peca: true } }, // Exemplo de nested include
          procedimentos: { include: { procedimentoPadrao: true } },
        },
      });

      if (!servico) {
        return res.status(404).json({ error: 'Serviço não encontrado.' });
      }

      if (req.user?.isGuest && servico.cliente) {
        servico.cliente = {
          ...servico.cliente,
          cpfCnpj: servico.cliente.cpfCnpj ? '***.***.***-**' : null,
          telefone: servico.cliente.telefone ? '(**) *****-****' : null,
          email: servico.cliente.email ? '***@***.***' : null,
          endereco: servico.cliente.endereco ? 'Endereço Oculto' : null,
        };
      }

      res.json(servico);
    } catch (error) {
      next(error);
    }
  }

  async updateServico(req, res, next) {
    try {
      if (req.user?.isGuest) {
        return res.status(403).json({ error: 'Acesso negado. Convidados não podem editar serviços.' });
      }

      const { id } = req.params;
      // Descomentar
      const oficinaId = req.user?.oficinaId;
      if (!oficinaId) {
        return res.status(401).json({ error: 'Oficina não identificada.' });
      }

      const { clienteId, veiculoId, responsavelId, status, ...updateData } = req.body;

      // Verificar se o serviço existe e pertence à oficina
      const servicoExistente = await prisma.servico.findUnique({
        where: { id, oficinaId },
      });
      if (!servicoExistente) {
        return res.status(404).json({ error: 'Serviço não encontrado para atualização.' });
      }

      // Validações opcionais para IDs, se forem alterados
      if (clienteId && clienteId !== servicoExistente.clienteId) {
        const clienteExists = await prisma.cliente.findUnique({ where: { id: clienteId, oficinaId } });
        if (!clienteExists) return res.status(404).json({ error: 'Novo cliente não encontrado.' });
        updateData.clienteId = clienteId;
      }
      if (veiculoId && veiculoId !== servicoExistente.veiculoId) {
        const veiculoExists = await prisma.veiculo.findUnique({ where: { id: veiculoId, ...(clienteId ? { clienteId } : { clienteId: servicoExistente.clienteId }) } });
        if (!veiculoExists) return res.status(404).json({ error: 'Novo veículo não encontrado ou não pertence ao cliente.' });
        updateData.veiculoId = veiculoId;
      }
      if (responsavelId && responsavelId !== servicoExistente.responsavelId) {
        const responsavelExists = await prisma.user.findUnique({ where: { id: responsavelId, oficinaId } });
        if (!responsavelExists) return res.status(404).json({ error: 'Novo responsável não encontrado.' });
        updateData.responsavelId = responsavelId;
      } else if (responsavelId === null) { // Permitir desassociar responsável
        updateData.responsavelId = null;
      }

      // Adicionar o status ao updateData se ele for válido
      if (status) {
        // Verifica se o status é um valor válido do enum ServiceStatus
        if (!Object.values(ServiceStatus).includes(status)) {
          return res.status(400).json({ error: 'Status inválido.' });
        }
        updateData.status = status;
      }

      // Converte datas se vierem como string
      if (updateData.dataEntrada) updateData.dataEntrada = new Date(updateData.dataEntrada);
      if (updateData.dataPrevisaoEntrega) updateData.dataPrevisaoEntrega = new Date(updateData.dataPrevisaoEntrega);
      if (updateData.dataConclusao) updateData.dataConclusao = new Date(updateData.dataConclusao);
      if (updateData.dataEntregaCliente) updateData.dataEntregaCliente = new Date(updateData.dataEntregaCliente);


      const servicoAtualizado = await prisma.servico.update({
        where: { id, oficinaId }, // Dupla checagem de segurança
        data: updateData,
        include: {
          cliente: { select: { id: true, nomeCompleto: true } },
          veiculo: { select: { id: true, placa: true, modelo: true } },
          responsavel: { select: { id: true, nome: true } },
        }
      });
      res.json(servicoAtualizado);
    } catch (error) {
      if (error.code === 'P2002' && error.meta?.target?.includes('numeroOs')) {
        return res.status(409).json({ error: 'Número da Ordem de Serviço já existe.' });
      }
      if (error.code === 'P2025') {
        return res.status(404).json({ error: 'Erro ao atualizar: uma ou mais entidades relacionadas não foram encontradas.' });
      }
      next(error);
    }
  }

  async deleteServico(req, res, next) {
    try {
      if (req.user?.isGuest) {
        return res.status(403).json({ error: 'Acesso negado. Convidados não podem excluir serviços.' });
      }

      const { id } = req.params;
      // Descomentar
      const oficinaId = req.user?.oficinaId;
      if (!oficinaId) {
        return res.status(401).json({ error: 'Oficina não identificada.' });
      }

      // Antes de deletar, verificar se o serviço existe e pertence à oficina
      const servicoExistente = await prisma.servico.findUnique({
        where: { id, oficinaId },
      });
      if (!servicoExistente) {
        return res.status(404).json({ error: 'Serviço não encontrado para exclusão.' });
      }

      // Considerar o que fazer com relações (ex: ItemServicoPeca). O Prisma pode lidar com isso via `onDelete` no schema,
      // ou pode ser necessário deletar manualmente entidades relacionadas dependentes se não houver cascade.
      // Por simplicidade, aqui apenas deletamos o serviço.

      await prisma.servico.delete({
        where: { id, oficinaId },
      });
      res.status(204).send(); // Sucesso sem conteúdo
    } catch (error) {
      if (error.code === 'P2025') { // Tentativa de deletar um registro que não existe
        return res.status(404).json({ error: 'Serviço não encontrado para exclusão.' });
      }
      // Tratar erro P2003 (foreign key constraint) se houver dados relacionados que impedem a exclusão
      // e não estiverem configurados para cascade delete.
      if (error.code === 'P2003') {
        return res.status(409).json({ error: 'Não é possível excluir o serviço pois existem dados relacionados (ex: itens de serviço, procedimentos). Remova-os primeiro ou contate o suporte.' });
      }
      next(error);
    }
  }

  // Novo endpoint para dashboard - contar serviços ativos
  async getServicosAtivos(req, res, next) {
    try {
      const { oficinaId } = req.user;

      const count = await prisma.servico.count({
        where: {
          oficinaId,
          status: {
            not: 'FINALIZADO' // Conta todos exceto finalizados
          }
        },
      });

      res.json({ count });
    } catch (error) {
      next(error);
    }
  }
}

export default new ServicosController();