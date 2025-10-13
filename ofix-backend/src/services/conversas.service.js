import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

class ConversasService {
    
    // Salvar nova conversa
    static async salvarConversa({ usuarioId, pergunta, resposta, contexto, timestamp }) {
        try {
            const conversa = await prisma.conversaMatias.create({
                data: {
                    usuarioId: usuarioId.toString(),
                    pergunta,
                    resposta,
                    contexto: contexto || '{}',
                    timestamp: timestamp || new Date()
                }
            });
            
            console.log('✅ Conversa salva:', conversa.id);
            return conversa;
            
        } catch (error) {
            console.error('❌ Erro ao salvar conversa:', error);
            throw new Error(`Erro ao salvar conversa: ${error.message}`);
        }
    }
    
    // Obter histórico de conversas de um usuário
    static async obterHistorico(usuarioId, limite = 10) {
        try {
            const conversas = await prisma.conversaMatias.findMany({
                where: {
                    usuarioId: usuarioId.toString()
                },
                orderBy: {
                    timestamp: 'desc'
                },
                take: limite,
                select: {
                    id: true,
                    pergunta: true,
                    resposta: true,
                    timestamp: true,
                    contexto: true
                }
            });
            
            console.log(`📚 Histórico recuperado: ${conversas.length} conversas para usuário ${usuarioId}`);
            return conversas;
            
        } catch (error) {
            console.error('❌ Erro ao obter histórico:', error);
            throw new Error(`Erro ao obter histórico: ${error.message}`);
        }
    }
    
    // Buscar conversas por palavra-chave
    static async buscarConversas(usuarioId, palavraChave) {
        try {
            const conversas = await prisma.conversaMatias.findMany({
                where: {
                    usuarioId: usuarioId.toString(),
                    OR: [
                        {
                            pergunta: {
                                contains: palavraChave,
                                mode: 'insensitive'
                            }
                        },
                        {
                            resposta: {
                                contains: palavraChave,
                                mode: 'insensitive'
                            }
                        }
                    ]
                },
                orderBy: {
                    timestamp: 'desc'
                },
                take: 20
            });
            
            console.log(`🔍 Busca realizada: ${conversas.length} conversas encontradas para "${palavraChave}"`);
            return conversas;
            
        } catch (error) {
            console.error('❌ Erro na busca:', error);
            throw new Error(`Erro na busca: ${error.message}`);
        }
    }
    
    // Estatísticas de conversas
    static async obterEstatisticasConversas(usuarioId) {
        try {
            const total = await prisma.conversaMatias.count({
                where: {
                    usuarioId: usuarioId.toString()
                }
            });
            
            const hoje = new Date();
            hoje.setHours(0, 0, 0, 0);
            
            const conversasHoje = await prisma.conversaMatias.count({
                where: {
                    usuarioId: usuarioId.toString(),
                    timestamp: {
                        gte: hoje
                    }
                }
            });
            
            const ultimaConversa = await prisma.conversaMatias.findFirst({
                where: {
                    usuarioId: usuarioId.toString()
                },
                orderBy: {
                    timestamp: 'desc'
                },
                select: {
                    timestamp: true
                }
            });
            
            return {
                total_conversas: total,
                conversas_hoje: conversasHoje,
                ultima_conversa: ultimaConversa?.timestamp,
                usuario_id: usuarioId
            };
            
        } catch (error) {
            console.error('❌ Erro nas estatísticas:', error);
            throw new Error(`Erro nas estatísticas: ${error.message}`);
        }
    }
}

export default ConversasService;