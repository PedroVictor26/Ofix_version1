/**
 * Rotas para gerenciar conversas com IA
 */

import express from 'express';
import conversasIAService from '../services/conversasIA.service.js';
import { protectRoute } from '../middlewares/auth.middleware.js';

const router = express.Router();

/**
 * POST /api/conversas/salvar - Salvar nova conversa
 */
router.post('/salvar', protectRoute, async (req, res) => {
  try {
    const { tipo, conteudo, metadata } = req.body;
    const usuarioId = req.user.id;
    
    if (!tipo || !conteudo) {
      return res.status(400).json({
        error: 'Tipo e conteúdo são obrigatórios'
      });
    }
    
    if (!['usuario', 'agente', 'sistema', 'erro'].includes(tipo)) {
      return res.status(400).json({
        error: 'Tipo deve ser: usuario, agente, sistema ou erro'
      });
    }
    
    const conversa = await conversasIAService.salvarConversa(
      usuarioId, 
      tipo, 
      conteudo, 
      metadata
    );
    
    res.json({
      success: true,
      conversa,
      message: 'Conversa salva com sucesso'
    });
  } catch (error) {
    console.error('Erro ao salvar conversa:', error);
    res.status(500).json({
      error: 'Erro interno do servidor',
      details: error.message
    });
  }
});

/**
 * POST /api/conversas/salvar-sessao - Salvar sessão completa de conversas
 */
router.post('/salvar-sessao', protectRoute, async (req, res) => {
  try {
    const { conversas, sessaoId } = req.body;
    const usuarioId = req.user.id;
    
    if (!Array.isArray(conversas) || conversas.length === 0) {
      return res.status(400).json({
        error: 'Lista de conversas é obrigatória'
      });
    }
    
    // Validar estrutura das conversas
    for (const conversa of conversas) {
      if (!conversa.tipo || !conversa.conteudo) {
        return res.status(400).json({
          error: 'Cada conversa deve ter tipo e conteúdo'
        });
      }
      
      if (!['usuario', 'agente', 'sistema', 'erro'].includes(conversa.tipo)) {
        return res.status(400).json({
          error: 'Tipo de conversa inválido: ' + conversa.tipo
        });
      }
    }
    
    const resultado = await conversasIAService.salvarSessaoCompleta(
      usuarioId,
      conversas,
      sessaoId
    );
    
    res.json({
      success: true,
      ...resultado,
      message: 'Sessão de conversas salva com sucesso'
    });
  } catch (error) {
    console.error('Erro ao salvar sessão:', error);
    res.status(500).json({
      error: 'Erro interno do servidor',
      details: error.message
    });
  }
});

/**
 * GET /api/conversas/historico - Buscar histórico do usuário
 */
router.get('/historico', protectRoute, async (req, res) => {
  try {
    const usuarioId = req.user.id;
    const limite = parseInt(req.query.limite) || 50;
    const offset = parseInt(req.query.offset) || 0;
    
    if (limite > 100) {
      return res.status(400).json({
        error: 'Limite máximo é 100 conversas por requisição'
      });
    }
    
    const conversas = await conversasIAService.buscarHistoricoUsuario(
      usuarioId,
      limite,
      offset
    );
    
    res.json({
      success: true,
      conversas,
      total: conversas.length,
      limite,
      offset
    });
  } catch (error) {
    console.error('Erro ao buscar histórico:', error);
    res.status(500).json({
      error: 'Erro interno do servidor',
      details: error.message
    });
  }
});

/**
 * GET /api/conversas/sessao/:sessaoId - Buscar conversas de uma sessão
 */
router.get('/sessao/:sessaoId', protectRoute, async (req, res) => {
  try {
    const { sessaoId } = req.params;
    const usuarioId = req.user.id;
    
    const conversas = await conversasIAService.buscarConversasSessao(
      usuarioId,
      sessaoId
    );
    
    res.json({
      success: true,
      sessaoId,
      conversas,
      total: conversas.length
    });
  } catch (error) {
    console.error('Erro ao buscar sessão:', error);
    res.status(500).json({
      error: 'Erro interno do servidor',
      details: error.message
    });
  }
});

/**
 * GET /api/conversas/estatisticas - Obter estatísticas de uso
 */
router.get('/estatisticas', protectRoute, async (req, res) => {
  try {
    const usuarioId = req.user.id;
    
    const estatisticas = await conversasIAService.obterEstatisticasUso(usuarioId);
    
    res.json({
      success: true,
      estatisticas,
      periodo: '30 dias'
    });
  } catch (error) {
    console.error('Erro ao obter estatísticas:', error);
    res.status(500).json({
      error: 'Erro interno do servidor',
      details: error.message
    });
  }
});

/**
 * POST /api/conversas/limpar-historico-antigo - Limpar histórico antigo (admin)
 */
router.post('/limpar-historico-antigo', protectRoute, async (req, res) => {
  try {
    // Verificar se é admin (ajustar conforme sua lógica de autorização)
    if (!req.user.isAdmin) {
      return res.status(403).json({
        error: 'Acesso negado. Apenas administradores podem executar esta ação.'
      });
    }
    
    const { diasParaManter } = req.body;
    const dias = diasParaManter || 30;
    
    const resultado = await conversasIAService.limparHistoricoAntigo(dias);
    
    res.json({
      success: true,
      ...resultado,
      message: `Histórico anterior a ${dias} dias foi removido`
    });
  } catch (error) {
    console.error('Erro ao limpar histórico:', error);
    res.status(500).json({
      error: 'Erro interno do servidor',
      details: error.message
    });
  }
});

/**
 * POST /api/conversas/setup - Criar estrutura da tabela (setup inicial)
 */
router.post('/setup', async (req, res) => {
  try {
    const resultado = await conversasIAService.criarTabelaSeNaoExistir();
    
    res.json({
      success: true,
      ...resultado,
      message: 'Estrutura de conversas configurada com sucesso'
    });
  } catch (error) {
    console.error('Erro no setup:', error);
    res.status(500).json({
      error: 'Erro interno do servidor',
      details: error.message
    });
  }
});

export default router;