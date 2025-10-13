/**
 * Serviço para gerenciar conversas com IA
 * Permite persistir histórico de conversas no banco de dados
 */

import prisma from '../config/database.js';

class ConversasIAService {
  /**
   * Salvar uma nova conversa
   */
  async salvarConversa(usuarioId, tipo, conteudo, metadata = null) {
    try {
      const query = `
        INSERT INTO conversas_ia (usuario_id, tipo, conteudo, metadata, timestamp)
        VALUES ($1, $2, $3, $4, NOW())
        RETURNING *
      `;
      
      const values = [usuarioId, tipo, conteudo, metadata ? JSON.stringify(metadata) : null];
      const result = await pool.query(query, values);
      
      return result.rows[0];
    } catch (error) {
      console.error('Erro ao salvar conversa:', error);
      throw new Error('Falha ao salvar conversa');
    }
  }

  /**
   * Buscar histórico de conversas de um usuário
   */
  async buscarHistoricoUsuario(usuarioId, limite = 50, offset = 0) {
    try {
      const query = `
        SELECT 
          id,
          tipo,
          conteudo,
          metadata,
          timestamp,
          created_at
        FROM conversas_ia 
        WHERE usuario_id = $1 
        ORDER BY timestamp DESC 
        LIMIT $2 OFFSET $3
      `;
      
      const values = [usuarioId, limite, offset];
      const result = await pool.query(query, values);
      
      return result.rows.map(row => ({
        ...row,
        metadata: row.metadata ? JSON.parse(row.metadata) : null
      }));
    } catch (error) {
      console.error('Erro ao buscar histórico:', error);
      throw new Error('Falha ao buscar histórico de conversas');
    }
  }

  /**
   * Buscar conversas de uma sessão específica
   */
  async buscarConversasSessao(usuarioId, sessaoId) {
    try {
      const query = `
        SELECT 
          id,
          tipo,
          conteudo,
          metadata,
          timestamp
        FROM conversas_ia 
        WHERE usuario_id = $1 AND sessao_id = $2
        ORDER BY timestamp ASC
      `;
      
      const values = [usuarioId, sessaoId];
      const result = await pool.query(query, values);
      
      return result.rows.map(row => ({
        ...row,
        metadata: row.metadata ? JSON.parse(row.metadata) : null
      }));
    } catch (error) {
      console.error('Erro ao buscar conversas da sessão:', error);
      throw new Error('Falha ao buscar conversas da sessão');
    }
  }

  /**
   * Limpar histórico antigo (mais de X dias)
   */
  async limparHistoricoAntigo(diasParaManter = 30) {
    try {
      const query = `
        DELETE FROM conversas_ia 
        WHERE timestamp < NOW() - INTERVAL '${diasParaManter} days'
      `;
      
      const result = await pool.query(query);
      
      return {
        conversasRemovidas: result.rowCount,
        diasManutencao: diasParaManter
      };
    } catch (error) {
      console.error('Erro ao limpar histórico antigo:', error);
      throw new Error('Falha ao limpar histórico antigo');
    }
  }

  /**
   * Obter estatísticas de uso
   */
  async obterEstatisticasUso(usuarioId) {
    try {
      const query = `
        SELECT 
          COUNT(*) as total_conversas,
          COUNT(CASE WHEN tipo = 'usuario' THEN 1 END) as mensagens_usuario,
          COUNT(CASE WHEN tipo = 'agente' THEN 1 END) as respostas_agente,
          DATE(timestamp) as data_conversa
        FROM conversas_ia 
        WHERE usuario_id = $1 
        AND timestamp >= NOW() - INTERVAL '30 days'
        GROUP BY DATE(timestamp)
        ORDER BY data_conversa DESC
      `;
      
      const values = [usuarioId];
      const result = await pool.query(query);
      
      return result.rows;
    } catch (error) {
      console.error('Erro ao obter estatísticas:', error);
      throw new Error('Falha ao obter estatísticas de uso');
    }
  }

  /**
   * Salvar sessão de conversa completa
   */
  async salvarSessaoCompleta(usuarioId, conversas, sessaoId = null) {
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');
      
      const sessaoFinal = sessaoId || `sessao_${Date.now()}_${usuarioId}`;
      const conversasSalvas = [];
      
      for (const conversa of conversas) {
        const query = `
          INSERT INTO conversas_ia (
            usuario_id, 
            sessao_id, 
            tipo, 
            conteudo, 
            metadata, 
            timestamp
          )
          VALUES ($1, $2, $3, $4, $5, $6)
          RETURNING *
        `;
        
        const values = [
          usuarioId,
          sessaoFinal,
          conversa.tipo,
          conversa.conteudo,
          conversa.metadata ? JSON.stringify(conversa.metadata) : null,
          conversa.timestamp || new Date()
        ];
        
        const result = await client.query(query, values);
        conversasSalvas.push(result.rows[0]);
      }
      
      await client.query('COMMIT');
      
      return {
        sessaoId: sessaoFinal,
        conversasSalvas: conversasSalvas.length,
        conversas: conversasSalvas
      };
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Erro ao salvar sessão completa:', error);
      throw new Error('Falha ao salvar sessão de conversas');
    } finally {
      client.release();
    }
  }

  /**
   * Criar tabela de conversas se não existir
   */
  async criarTabelaSeNaoExistir() {
    try {
      const query = `
        CREATE TABLE IF NOT EXISTS conversas_ia (
          id SERIAL PRIMARY KEY,
          usuario_id INTEGER NOT NULL,
          sessao_id VARCHAR(100),
          tipo VARCHAR(20) NOT NULL CHECK (tipo IN ('usuario', 'agente', 'sistema', 'erro')),
          conteudo TEXT NOT NULL,
          metadata JSONB,
          timestamp TIMESTAMP DEFAULT NOW(),
          created_at TIMESTAMP DEFAULT NOW(),
          FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
        );
        
        CREATE INDEX IF NOT EXISTS idx_conversas_usuario_timestamp 
        ON conversas_ia(usuario_id, timestamp DESC);
        
        CREATE INDEX IF NOT EXISTS idx_conversas_sessao 
        ON conversas_ia(sessao_id);
      `;
      
      await pool.query(query);
      
      return { tabela: 'conversas_ia', status: 'criada_ou_atualizada' };
    } catch (error) {
      console.error('Erro ao criar tabela de conversas:', error);
      throw new Error('Falha ao criar estrutura do banco para conversas');
    }
  }
}

export default new ConversasIAService();