import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

class AgendamentosService {
    
    // Criar novo agendamento
    static async criarAgendamento({ clienteId, veiculoId, tipoServico, dataHora, descricao, status = 'AGENDADO' }) {
        try {
            const agendamento = await prisma.agendamento.create({
                data: {
                    clienteId: parseInt(clienteId),
                    veiculoId: parseInt(veiculoId),
                    tipoServico,
                    dataHora: new Date(dataHora),
                    descricao: descricao || '',
                    status,
                    criadoEm: new Date()
                },
                include: {
                    cliente: {
                        select: {
                            nome: true,
                            telefone: true
                        }
                    },
                    veiculo: {
                        select: {
                            marca: true,
                            modelo: true,
                            ano: true,
                            placa: true
                        }
                    }
                }
            });
            
            console.log('✅ Agendamento criado:', agendamento.id);
            return agendamento;
            
        } catch (error) {
            console.error('❌ Erro ao criar agendamento:', error);
            throw new Error(`Erro ao criar agendamento: ${error.message}`);
        }
    }
    
    // Listar agendamentos por período
    static async listarAgendamentos(periodo = 'semana') {
        try {
            let dataInicio = new Date();
            let dataFim = new Date();
            
            switch (periodo) {
                case 'hoje':
                    dataInicio.setHours(0, 0, 0, 0);
                    dataFim.setHours(23, 59, 59, 999);
                    break;
                case 'semana':
                    dataInicio.setDate(dataInicio.getDate() - dataInicio.getDay());
                    dataInicio.setHours(0, 0, 0, 0);
                    dataFim.setDate(dataInicio.getDate() + 6);
                    dataFim.setHours(23, 59, 59, 999);
                    break;
                case 'mes':
                    dataInicio.setDate(1);
                    dataInicio.setHours(0, 0, 0, 0);
                    dataFim.setMonth(dataFim.getMonth() + 1, 0);
                    dataFim.setHours(23, 59, 59, 999);
                    break;
            }
            
            const agendamentos = await prisma.agendamento.findMany({
                where: {
                    dataHora: {
                        gte: dataInicio,
                        lte: dataFim
                    }
                },
                include: {
                    cliente: {
                        select: {
                            nome: true,
                            telefone: true
                        }
                    },
                    veiculo: {
                        select: {
                            marca: true,
                            modelo: true,
                            ano: true,
                            placa: true
                        }
                    }
                },
                orderBy: {
                    dataHora: 'asc'
                }
            });
            
            console.log(`📅 Agendamentos ${periodo}: ${agendamentos.length} encontrados`);
            return agendamentos;
            
        } catch (error) {
            console.error('❌ Erro ao listar agendamentos:', error);
            throw new Error(`Erro ao listar agendamentos: ${error.message}`);
        }
    }
    
    // Atualizar status do agendamento
    static async atualizarStatus(agendamentoId, novoStatus) {
        try {
            const agendamento = await prisma.agendamento.update({
                where: {
                    id: parseInt(agendamentoId)
                },
                data: {
                    status: novoStatus,
                    atualizadoEm: new Date()
                },
                include: {
                    cliente: {
                        select: {
                            nome: true
                        }
                    },
                    veiculo: {
                        select: {
                            marca: true,
                            modelo: true
                        }
                    }
                }
            });
            
            console.log(`✅ Status atualizado para ${novoStatus}:`, agendamento.id);
            return agendamento;
            
        } catch (error) {
            console.error('❌ Erro ao atualizar status:', error);
            throw new Error(`Erro ao atualizar status: ${error.message}`);
        }
    }
    
    // Buscar agendamentos por cliente
    static async buscarPorCliente(clienteNome) {
        try {
            const agendamentos = await prisma.agendamento.findMany({
                where: {
                    cliente: {
                        nome: {
                            contains: clienteNome,
                            mode: 'insensitive'
                        }
                    }
                },
                include: {
                    cliente: {
                        select: {
                            nome: true,
                            telefone: true
                        }
                    },
                    veiculo: {
                        select: {
                            marca: true,
                            modelo: true,
                            ano: true,
                            placa: true
                        }
                    }
                },
                orderBy: {
                    dataHora: 'desc'
                },
                take: 10
            });
            
            console.log(`🔍 Agendamentos para cliente "${clienteNome}": ${agendamentos.length} encontrados`);
            return agendamentos;
            
        } catch (error) {
            console.error('❌ Erro na busca por cliente:', error);
            throw new Error(`Erro na busca por cliente: ${error.message}`);
        }
    }
    
    // Verificar disponibilidade
    static async verificarDisponibilidade(dataHora) {
        try {
            const data = new Date(dataHora);
            const dataInicio = new Date(data.getTime() - 30 * 60000); // 30 min antes
            const dataFim = new Date(data.getTime() + 30 * 60000);   // 30 min depois
            
            const conflitos = await prisma.agendamento.count({
                where: {
                    dataHora: {
                        gte: dataInicio,
                        lte: dataFim
                    },
                    status: {
                        not: 'CANCELADO'
                    }
                }
            });
            
            const disponivel = conflitos === 0;
            console.log(`📅 Disponibilidade para ${data.toLocaleString('pt-BR')}: ${disponivel ? 'LIVRE' : 'OCUPADO'}`);
            
            return {
                disponivel,
                data_hora: data,
                conflitos
            };
            
        } catch (error) {
            console.error('❌ Erro ao verificar disponibilidade:', error);
            throw new Error(`Erro ao verificar disponibilidade: ${error.message}`);
        }
    }
}

export default AgendamentosService;