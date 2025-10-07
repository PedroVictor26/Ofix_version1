import prisma from '../config/database.js';

class VeiculosController {
  async getAllVeiculos(req, res, next) {
    try {
      const oficinaId = req.user?.oficinaId;
      if (!oficinaId) {
        return res.status(401).json({ error: 'Oficina não identificada.' });
      }

      const veiculos = await prisma.veiculo.findMany({
        where: { oficinaId },
        orderBy: { placa: 'asc' },
      });
      res.json(veiculos);
    } catch (error) {
      next(error);
    }
  }
}

export default new VeiculosController();