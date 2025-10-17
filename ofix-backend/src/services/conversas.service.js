import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

class ConversasService {
    
    // Salvar nova conversa (cria ou reutiliza conversa ativa e adiciona mensagens)
    static async salvarConversa({ usuarioId, pergunta, resposta, contexto, timestamp }) {
        try {
            // NOTA: usuarioId vem como UUID string, mas o schema espera Int
            // Vamos usar uma solução temporária: hash do UUID para Int
            // TODO: Migrar schema para usar UUID em vez de Int
            const userIdInt = parseInt(usuarioId.replace(/-/g, '').substring(0, 9), 16) % 2147483647;
            
            // 1. Buscar ou criar conversa ativa para este usuário
            let conversa = await prisma.conversaMatias.findFirst({
                where: {
                    userId: userIdInt,
                    ativa: true
                },
                orderBy: {
                    createdAt: 'desc'
                }
            });
            
            // Se não existe conversa ativa, criar uma nova
            if (!conversa) {
                conversa = await prisma.conversaMatias.create({
                    data: {
                        userId: userIdInt,
                        titulo: `Conversa - ${new Date().toLocaleDateString('pt-BR')}`,
                        ativa: true
                    }
                });
                console.log('🆕 Nova conversa criada:', conversa.id);
            }
            
            // 2. Salvar mensagem do usuário
            await prisma.mensagemMatias.create({
                data: {
                    conversaId: conversa.id,
                    tipo: 'user',
                    conteudo: pergunta,
                    metadata: {
                        timestamp: timestamp || new Date(),
                        contexto: contexto || {}
                    }
                }
            });
            
            // 3. Salvar resposta do Matias
            const mensagemResposta = await prisma.mensagemMatias.create({
                data: {
                    conversaId: conversa.id,
                    tipo: 'matias',
                    conteudo: resposta,
                    metadata: {
                        timestamp: timestamp || new Date(),
                        contexto: contexto || {}
                    }
                }
            });
            
            console.log('✅ Mensagens salvas na conversa:', conversa.id);
            return {
                conversaId: conversa.id,
                mensagemId: mensagemResposta.id
            };
            
        } catch (error) {
            console.error('❌ Erro ao salvar conversa:', error);
            throw new Error(`Erro ao salvar conversa: ${error.message}`);
        }
    }
    
    // Obter histórico de conversas de um usuário
    static async obterHistorico(usuarioId, limite = 10) {
        try {
            // Converter UUID para Int (mesmo método usado em salvarConversa)
            const userIdInt = parseInt(usuarioId.replace(/-/g, '').substring(0, 9), 16) % 2147483647;
            
            const conversas = await prisma.conversaMatias.findMany({
                where: {
                    userId: userIdInt
                },
                include: {
                    mensagens: {
                        orderBy: {
                            createdAt: 'asc'
                        }
                    }
                },
                orderBy: {
                    createdAt: 'desc'
                },
                take: limite
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
            const userIdInt = parseInt(usuarioId.replace(/-/g, '').substring(0, 9), 16) % 2147483647;
            
            const conversas = await prisma.conversaMatias.findMany({
                where: {
                    userId: userIdInt,
                    mensagens: {
                        some: {
                            conteudo: {
                                contains: palavraChave,
                                mode: 'insensitive'
                            }
                        }
                    }
                },
                include: {
                    mensagens: {
                        where: {
                            conteudo: {
                                contains: palavraChave,
                                mode: 'insensitive'
                            }
                        },
                        orderBy: {
                            createdAt: 'asc'
                        }
                    }
                },
                orderBy: {
                    createdAt: 'desc'
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
            const userIdInt = parseInt(usuarioId.replace(/-/g, '').substring(0, 9), 16) % 2147483647;
            
            const total = await prisma.conversaMatias.count({
                where: {
                    userId: userIdInt
                }
            });
            
            const hoje = new Date();
            hoje.setHours(0, 0, 0, 0);
            
            const conversasHoje = await prisma.conversaMatias.count({
                where: {
                    userId: userIdInt,
                    createdAt: {
                        gte: hoje
                    }
                }
            });
            
            const totalMensagens = await prisma.mensagemMatias.count({
                where: {
                    conversa: {
                        userId: userIdInt
                    }
                }
            });
            
            const ultimaConversa = await prisma.conversaMatias.findFirst({
                where: {
                    userId: userIdInt
                },
                orderBy: {
                    updatedAt: 'desc'
                },
                select: {
                    updatedAt: true,
                    titulo: true
                }
            });
            
            return {
                total_conversas: total,
                conversas_hoje: conversasHoje,
                total_mensagens: totalMensagens,
                ultima_conversa: ultimaConversa?.updatedAt,
                ultima_conversa_titulo: ultimaConversa?.titulo,
                usuario_id: usuarioId
            };
            
        } catch (error) {
            console.error('❌ Erro nas estatísticas:', error);
            throw new Error(`Erro nas estatísticas: ${error.message}`);
        }
    }
}

export default ConversasService;