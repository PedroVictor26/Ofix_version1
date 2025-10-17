import express from 'express';
import fetch from 'node-fetch';
import FormData from 'form-data';
import jwt from 'jsonwebtoken';

// Importar serviços do Matias
import ConversasService from '../services/conversas.service.js';
import AgendamentosService from '../services/agendamentos.service.js';
import ConsultasOSService from '../services/consultasOS.service.js';
import NLPService from '../services/nlp.service.js';
import prisma from '../config/database.js';

const router = express.Router();

// Configurações do Agno (pode vir de variáveis de ambiente)
const AGNO_API_URL = process.env.AGNO_API_URL || 'http://localhost:8000';
const AGNO_API_TOKEN = process.env.AGNO_API_TOKEN || '';

// Registro de context e knowledge para o Agno
const AGNO_CONTEXT = {
    name: "OFIX - Sistema de Oficina Automotiva",
    description: "Assistente virtual Matias para oficina automotiva",
    capabilities: [
        "consultar_ordens_servico",
        "agendar_servicos", 
        "consultar_pecas",
        "calcular_orcamentos",
        "listar_clientes",
        "historico_veiculos",
        "estatisticas_oficina"
    ],
    endpoints: {
        base_url: process.env.BACKEND_URL || "http://localhost:3001",
        auth_required: true
    }
};

// Endpoint público para verificar configuração do Agno
router.get('/config', async (req, res) => {
    try {
        console.log('🔧 Verificando configuração do Agno...');
        
        res.json({
            configured: !!AGNO_API_URL && AGNO_API_URL !== 'http://localhost:8000',
            agno_url: AGNO_API_URL,
            has_token: !!AGNO_API_TOKEN,
            agent_id: process.env.AGNO_DEFAULT_AGENT_ID || 'oficinaia',
            timestamp: new Date().toISOString(),
            status: AGNO_API_URL === 'http://localhost:8000' ? 'development' : 'production'
        });
    } catch (error) {
        console.error('❌ Erro ao verificar configuração:', error.message);
        res.status(500).json({
            error: 'Erro ao verificar configuração',
            message: error.message
        });
    }
});

// Endpoint público para testar chat SEM AUTENTICAÇÃO (temporário para debug)
router.post('/chat-public', async (req, res) => {
    try {
        const { message } = req.body;
        
        if (!message) {
            return res.status(400).json({ error: 'Mensagem é obrigatória' });
        }

        console.log('🧪 Teste público do chat - Configuração:', {
            agno_url: AGNO_API_URL,
            configured: AGNO_API_URL !== 'http://localhost:8000',
            message: message.substring(0, 50) + '...'
        });

        // Se não está configurado, retornar resposta de demonstração
        if (AGNO_API_URL === 'http://localhost:8000') {
            return res.json({
                success: true,
                response: `🤖 **Modo Demonstração Ativado**\n\nVocê disse: "${message}"\n\n📋 **Status**: Agente Matias não configurado no ambiente de produção.\n\n⚙️ **Configuração necessária no Render:**\n- AGNO_API_URL=https://matias-agno-assistant.onrender.com\n- AGNO_DEFAULT_AGENT_ID=oficinaia\n\n💡 Após configurar, o assistente conectará com seu agente real!`,
                mode: 'demo',
                agno_configured: false
            });
        }

        // Testar conexão com Agno real
        console.log('🔌 Tentando conectar com Agno:', AGNO_API_URL);
        
        const formData = new FormData();
        formData.append('message', message);
        formData.append('stream', 'false');
        formData.append('user_id', 'test_user');

        try {
            const response = await fetch(`${AGNO_API_URL}/agents/oficinaia/runs`, {
                method: 'POST',
                headers: {
                    ...formData.getHeaders(),
                    ...(AGNO_API_TOKEN && { 'Authorization': `Bearer ${AGNO_API_TOKEN}` })
                },
                body: formData,
                timeout: 15000 // 15 segundos
            });

            if (response.ok) {
                const data = await response.json();
                const responseText = data.content || data.response || data.message || 'Resposta do agente Matias';
                
                console.log('✅ Sucesso na comunicação com Agno');
                res.json({
                    success: true,
                    response: responseText,
                    mode: 'production',
                    agno_configured: true,
                    metadata: data
                });
            } else {
                throw new Error(`Agno retornou status ${response.status}`);
            }
        } catch (agnoError) {
            console.error('❌ Erro ao conectar com Agno:', agnoError.message);
            
            // FALLBACK: Resposta inteligente baseada na mensagem
            let fallbackResponse;
            const msgLower = message.toLowerCase();
            
            if (msgLower.includes('serviço') || msgLower.includes('problema') || msgLower.includes('carro')) {
                fallbackResponse = `🔧 **Assistente OFIX**\n\nVocê mencionou: "${message}"\n\n**Posso ajudar com:**\n• Diagnóstico de problemas automotivos\n• Informações sobre serviços\n• Consulta de peças\n• Agendamento de manutenção\n\n*⚠️ Agente Matias temporariamente indisponível. Respondendo em modo local.*`;
            } else if (msgLower.includes('preço') || msgLower.includes('valor') || msgLower.includes('custo')) {
                fallbackResponse = `💰 **Consulta de Preços**\n\nPara "${message}":\n\n**Serviços populares:**\n• Troca de óleo: R$ 80-120\n• Revisão completa: R$ 200-400\n• Diagnóstico: R$ 50-100\n\n*💡 Para valores exatos, consulte nossa equipe.*`;
            } else {
                fallbackResponse = `🤖 **OFIX Assistant**\n\nOlá! Você disse: "${message}"\n\n**Como posso ajudar:**\n• Problemas no veículo\n• Informações sobre serviços\n• Consultas de peças\n• Agendamentos\n\n*🔄 Tentando reconectar com agente principal...*`;
            }
            
            res.json({
                success: true,
                response: fallbackResponse,
                mode: 'fallback',
                agno_configured: true,
                agno_error: agnoError.message
            });
        }
    } catch (mainError) {
        console.error('❌ Erro geral no teste público:', mainError.message);
        res.status(500).json({
            error: 'Erro interno',
            message: mainError.message,
            agno_url: AGNO_API_URL
        });
    }
});

// ============================================================
// 🤖 CHAT INTELIGENTE - PROCESSAMENTO DE LINGUAGEM NATURAL
// ============================================================

router.post('/chat-inteligente', async (req, res) => {
    try {
        const { message, usuario_id } = req.body;
        
        if (!message) {
            return res.status(400).json({ 
                success: false,
                error: 'Mensagem é obrigatória' 
            });
        }

        console.log('🎯 Chat Inteligente - Mensagem:', message.substring(0, 80) + '...');
        
        // 1. DETECTAR INTENÇÃO
        const intencao = NLPService.detectarIntencao(message);
        console.log('   Intenção detectada:', intencao);
        
        // 2. PROCESSAR BASEADO NA INTENÇÃO
        let response;
        
        switch (intencao) {
            case 'AGENDAMENTO':
                response = await processarAgendamento(message, usuario_id);
                break;
                
            case 'CONSULTA_OS':
                response = await processarConsultaOS(message);
                break;
                
            case 'CONSULTA_ESTOQUE':
                response = await processarConsultaEstoque(message);
                break;
                
            case 'ESTATISTICAS':
                response = await processarEstatisticas(message);
                break;
                
            case 'CONSULTA_CLIENTE':
                response = await processarConsultaCliente(message);
                break;
                
            case 'CADASTRAR_CLIENTE':
                response = await processarCadastroCliente(message, usuario_id);
                break;
                
            case 'AJUDA':
                response = {
                    success: true,
                    response: NLPService.gerarMensagemAjuda(),
                    tipo: 'ajuda'
                };
                break;
                
            default:
                // Conversa geral - pode enviar para Agno Agent se configurado
                response = await processarConversaGeral(message);
                break;
        }
        
        // 3. SALVAR CONVERSA NO HISTÓRICO
        try {
            if (usuario_id) {
                await ConversasService.salvarConversa({
                    usuarioId: usuario_id,
                    pergunta: message,
                    resposta: response.response || 'Sem resposta',
                    contexto: JSON.stringify({ intencao, ...response.metadata }),
                    timestamp: new Date()
                });
            }
        } catch (saveError) {
            console.error('⚠️ Erro ao salvar conversa (não crítico):', saveError.message);
        }
        
        // 4. RETORNAR RESPOSTA
        return res.json(response);
        
    } catch (error) {
        console.error('❌ Erro no chat inteligente:', error);
        return res.status(500).json({
            success: false,
            error: 'Erro ao processar mensagem',
            message: error.message
        });
    }
});

// ============================================================================
// 📅 FUNÇÃO: PROCESSAR AGENDAMENTO
// ============================================================================

async function processarAgendamento(mensagem, usuario_id) {
    try {
        // 0. BUSCAR OFICINA DO USUÁRIO
        let oficinaId = null;
        if (usuario_id) {
            const usuario = await prisma.user.findUnique({
                where: { id: String(usuario_id) }, // USER ID É STRING (UUID)
                select: { oficinaId: true }
            });
            oficinaId = usuario?.oficinaId;
            console.log('   🏢 Oficina ID:', oficinaId);
        }
        
        // 1. EXTRAIR ENTIDADES
        const entidades = NLPService.extrairEntidadesAgendamento(mensagem);
        console.log('   📋 Entidades:', JSON.stringify(entidades, null, 2));
        
        // 2. VALIDAR DADOS NECESSÁRIOS
        const validacao = NLPService.validarDadosAgendamento(entidades);
        
        if (!validacao.valido) {
            // Mensagem personalizada baseada no que está faltando
            let mensagemAjuda = '📋 **Vamos fazer seu agendamento!**\n\n';
            
            if (validacao.faltando.length === 4 || validacao.faltando.length === 5) {
                // Está faltando quase tudo - dar exemplo completo
                mensagemAjuda += '💡 **Me informe os seguintes dados:**\n\n';
                mensagemAjuda += '• **Cliente:** Nome do cliente\n';
                mensagemAjuda += '• **Veículo:** Modelo ou placa\n';
                mensagemAjuda += '• **Serviço:** Tipo de manutenção (revisão, troca de óleo, etc)\n';
                mensagemAjuda += '• **Dia:** Dia da semana ou data (segunda, terça, 20/10)\n';
                mensagemAjuda += '• **Horário:** Hora desejada (14h, 16:00)\n\n';
                mensagemAjuda += '**Exemplo:**\n';
                mensagemAjuda += '"Agendar revisão para o Gol do João na segunda às 14h"';
            } else {
                // Está faltando apenas alguns dados - ser específico
                mensagemAjuda += '**Informações que ainda preciso:**\n\n';
                mensagemAjuda += validacao.faltando.map((item, i) => `${i + 1}. ${item}`).join('\n');
                mensagemAjuda += '\n\n**Exemplo:**\n';
                
                // Gerar exemplo baseado no que já tem
                const partes = [];
                if (entidades.servico) partes.push(entidades.servico);
                else partes.push('revisão');
                
                if (entidades.veiculo) partes.push(`para o ${entidades.veiculo}`);
                else if (entidades.cliente) partes.push(`para o cliente ${entidades.cliente}`);
                else partes.push('para o Gol do João');
                
                if (entidades.diaSemana || entidades.dataEspecifica) {
                    partes.push(entidades.diaTexto || new Date(entidades.dataEspecifica).toLocaleDateString('pt-BR'));
                } else {
                    partes.push('na segunda');
                }
                
                if (entidades.hora) partes.push(`às ${entidades.hora}`);
                else partes.push('às 14h');
                
                mensagemAjuda += `"${partes.join(' ')}"`;
            }
            
            return {
                success: false,
                response: mensagemAjuda,
                tipo: 'pergunta',
                faltando: validacao.faltando,
                entidades_detectadas: entidades
            };
        }
        
        // 3. BUSCAR CLIENTE NO BANCO (com busca inteligente)
        let cliente = null;
        let clientesSugeridos = [];
        
        if (entidades.cliente) {
            // Busca exata primeiro (FILTRADO POR OFICINA)
            const whereClause = {
                nomeCompleto: {
                    contains: entidades.cliente,
                    mode: 'insensitive'
                }
            };
            
            // Adicionar filtro de oficina se disponível
            if (oficinaId) {
                whereClause.oficinaId = oficinaId; // CAMPO É oficinaId (camelCase)
            }
            
            cliente = await prisma.cliente.findFirst({
                where: whereClause,
                include: {
                    veiculos: true
                }
            });
            
            // Se não encontrou, buscar clientes similares para sugestão (FILTRADO POR OFICINA)
            if (!cliente) {
                const palavrasBusca = entidades.cliente.split(' ').filter(p => p.length > 2);
                
                if (palavrasBusca.length > 0) {
                    const whereSugestoes = {
                        OR: palavrasBusca.map(palavra => ({
                            nomeCompleto: {
                                contains: palavra,
                                mode: 'insensitive'
                            }
                        }))
                    };
                    
                    // Adicionar filtro de oficina
                    if (oficinaId) {
                        whereSugestoes.oficinaId = oficinaId; // CAMPO É oficinaId (camelCase)
                    }
                    
                    clientesSugeridos = await prisma.cliente.findMany({
                        where: whereSugestoes,
                        include: {
                            veiculos: true
                        },
                        take: 5
                    });
                }
            }
        } else if (entidades.placa) {
            const veiculo = await prisma.veiculo.findFirst({
                where: {
                    placa: entidades.placa
                },
                include: {
                    cliente: {
                        include: {
                            veiculos: true
                        }
                    }
                }
            });
            cliente = veiculo?.cliente;
        }
        
        // Se não encontrou cliente, mostrar sugestões ou listar todos
        if (!cliente) {
            if (clientesSugeridos.length > 0) {
                return {
                    success: false,
                    response: `🔍 **Cliente "${entidades.cliente}" não encontrado**\n\n**Clientes similares encontrados:**\n${clientesSugeridos.map((c, i) => `${i + 1}. ${c.nomeCompleto}${c.telefone ? ` - ${c.telefone}` : ''}${c.veiculos.length > 0 ? `\n   🚗 ${c.veiculos.map(v => `${v.marca} ${v.modelo}`).join(', ')}` : ''}`).join('\n\n')}\n\n💡 **Digite o número ou nome completo do cliente correto**`,
                    tipo: 'sugestao',
                    sugestoes: clientesSugeridos
                };
            }
            
            // Se não tem sugestões, listar alguns clientes recentes (FILTRADO POR OFICINA)
            const whereClientesRecentes = oficinaId ? { oficinaId } : {};
            
            const clientesRecentes = await prisma.cliente.findMany({
                where: whereClientesRecentes,
                include: {
                    veiculos: true
                },
                orderBy: {
                    createdAt: 'desc'
                },
                take: 5
            });
            
            console.log('   📋 Clientes recentes encontrados:', clientesRecentes.length);
            console.log('   🏢 Filtrado por oficinaId:', oficinaId || 'SEM FILTRO');
            
            if (clientesRecentes.length > 0) {
                return {
                    success: false,
                    response: `❌ **Cliente não encontrado**\n\n${entidades.cliente ? `Não encontrei "${entidades.cliente}" no sistema.` : 'Nenhum cliente especificado.'}\n\n**Clientes recentes cadastrados:**\n${clientesRecentes.map((c, i) => `${i + 1}. ${c.nomeCompleto}${c.veiculos.length > 0 ? `\n   🚗 ${c.veiculos.map(v => `${v.marca} ${v.modelo}`).join(', ')}` : ''}`).join('\n\n')}\n\n💡 **Opções:**\n• Digite o nome completo do cliente\n• Ou cadastre um novo cliente primeiro`,
                    tipo: 'erro',
                    clientes_disponiveis: clientesRecentes
                };
            }
            
            return {
                success: false,
                response: `❌ **Nenhum cliente cadastrado**\n\n${entidades.cliente ? `Não encontrei "${entidades.cliente}".` : ''}\n\n💡 **É necessário cadastrar o cliente primeiro:**\n1. Acesse "Clientes" no menu\n2. Clique em "Novo Cliente"\n3. Preencha os dados\n4. Depois volte aqui para agendar`,
                tipo: 'erro'
            };
        }
        
        // 4. BUSCAR VEÍCULO (com busca inteligente)
        let veiculo = null;
        
        if (entidades.placa) {
            // Busca por placa (mais precisa)
            veiculo = cliente.veiculos.find(v => v.placa === entidades.placa);
        } else if (entidades.veiculo) {
            // Busca por modelo (pode ter múltiplos)
            const veiculosEncontrados = cliente.veiculos.filter(v => 
                v.modelo.toLowerCase().includes(entidades.veiculo.toLowerCase()) ||
                v.marca.toLowerCase().includes(entidades.veiculo.toLowerCase())
            );
            
            if (veiculosEncontrados.length === 1) {
                veiculo = veiculosEncontrados[0];
            } else if (veiculosEncontrados.length > 1) {
                return {
                    success: false,
                    response: `🚗 **Múltiplos veículos "${entidades.veiculo}" encontrados**\n\n**Cliente:** ${cliente.nomeCompleto}\n\n**Escolha o veículo:**\n${veiculosEncontrados.map((v, i) => `${i + 1}. ${v.marca} ${v.modelo} ${v.anoModelo || ''} - ${v.placa}${v.cor ? ` (${v.cor})` : ''}`).join('\n')}\n\n💡 Digite o número ou especifique a placa (ex: "ABC-1234")`,
                    tipo: 'multiplos',
                    opcoes: veiculosEncontrados
                };
            }
        }
        
        // Se não encontrou e o cliente tem veículos, listar para escolha
        if (!veiculo && cliente.veiculos.length > 0) {
            // Se tem apenas 1 veículo, usar automaticamente
            if (cliente.veiculos.length === 1) {
                veiculo = cliente.veiculos[0];
                console.log(`   ✅ Único veículo do cliente selecionado automaticamente: ${veiculo.marca} ${veiculo.modelo}`);
            } else {
                return {
                    success: false,
                    response: `🚗 **${entidades.veiculo ? `Veículo "${entidades.veiculo}" não encontrado` : 'Qual veículo deseja agendar?'}**\n\n**Cliente:** ${cliente.nomeCompleto}\n\n**Veículos disponíveis:**\n${cliente.veiculos.map((v, i) => `${i + 1}. ${v.marca} ${v.modelo}${v.anoModelo ? ` ${v.anoModelo}` : ''} - ${v.placa}${v.cor ? ` (${v.cor})` : ''}`).join('\n')}\n\n💡 Digite o número, modelo ou placa do veículo`,
                    tipo: 'pergunta',
                    opcoes: cliente.veiculos
                };
            }
        }
        
        if (!veiculo) {
            return {
                success: false,
                response: `❌ **Nenhum veículo cadastrado**\n\n**Cliente:** ${cliente.nomeCompleto}\n\n💡 **É necessário cadastrar um veículo primeiro:**\n1. Acesse "Clientes" no menu\n2. Selecione "${cliente.nomeCompleto}"\n3. Adicione um veículo\n4. Depois volte aqui para agendar`,
                tipo: 'erro',
                cliente_id: cliente.id
            };
        }
        
        // 5. CALCULAR DATA E HORA
        let dataAgendamento;
        
        if (entidades.dataEspecifica) {
            dataAgendamento = entidades.dataEspecifica;
        } else if (entidades.diaSemana) {
            dataAgendamento = NLPService.calcularProximaData(entidades.diaSemana);
        } else {
            return {
                success: false,
                response: '📅 **Qual dia deseja agendar?**\n\nExemplos: "segunda", "terça", "20/10"',
                tipo: 'pergunta'
            };
        }
        
        const dataHora = new Date(`${dataAgendamento}T${entidades.hora}:00`);
        
        // Validar se a data não está no passado
        if (dataHora < new Date()) {
            return {
                success: false,
                response: `❌ **Data inválida**\n\nA data ${NLPService.formatarDataAmigavel(dataAgendamento)} às ${entidades.hora} já passou.\n\n💡 Escolha uma data futura.`,
                tipo: 'erro'
            };
        }
        
        // 6. VERIFICAR DISPONIBILIDADE
        const conflito = await prisma.agendamento.findFirst({
            where: {
                dataHora: dataHora,
                status: {
                    not: 'CANCELADO'
                }
            },
            include: {
                cliente: true
            }
        });
        
        if (conflito) {
            return {
                success: false,
                response: `⏰ **Horário ocupado**\n\n${NLPService.formatarDataAmigavel(dataAgendamento)} às ${entidades.hora} já está reservado para ${conflito.cliente.nomeCompleto}.\n\n**Horários disponíveis no mesmo dia:**\n• 08:00\n• 10:00\n• 14:00\n• 16:00\n\n💡 Qual horário prefere?`,
                tipo: 'conflito',
                horarios_disponiveis: ['08:00', '10:00', '14:00', '16:00']
            };
        }
        
        // 7. CRIAR AGENDAMENTO! ✅
        const agendamento = await AgendamentosService.criarAgendamento({
            clienteId: cliente.id,
            veiculoId: veiculo.id,
            tipoServico: entidades.servico || 'Serviço Geral',
            dataHora: dataHora,
            descricao: `Agendamento via IA: ${mensagem}`,
            status: 'AGENDADO'
        });
        
        // 8. CONFIRMAR COM DETALHES
        const dataFormatada = NLPService.formatarDataAmigavel(dataAgendamento);
        
        return {
            success: true,
            response: `✅ **Agendamento Confirmado!**\n\n📋 **Protocolo:** #${agendamento.id}\n\n👤 **Cliente:** ${cliente.nomeCompleto}\n📞 **Telefone:** ${cliente.telefone || 'Não cadastrado'}\n\n🚗 **Veículo:** ${veiculo.marca} ${veiculo.modelo}\n🔖 **Placa:** ${veiculo.placa}${veiculo.cor ? `\n🎨 **Cor:** ${veiculo.cor}` : ''}\n\n📅 **Data:** ${dataFormatada}\n⏰ **Horário:** ${entidades.hora}\n🔧 **Serviço:** ${entidades.servico || 'Serviço Geral'}\n\n${entidades.urgente ? '🚨 **Urgente** - Priorizado\n\n' : ''}💬 ${cliente.nomeCompleto.split(' ')[0]} receberá confirmação por WhatsApp.`,
            tipo: 'confirmacao',
            agendamento_id: agendamento.id,
            metadata: {
                cliente_id: cliente.id,
                veiculo_id: veiculo.id,
                data: dataAgendamento,
                hora: entidades.hora
            }
        };
        
    } catch (error) {
        console.error('❌ Erro em processarAgendamento:', error);
        return {
            success: false,
            response: `❌ **Erro ao processar agendamento**\n\n${error.message}\n\n💡 Por favor, tente novamente ou contate o suporte.`,
            tipo: 'erro'
        };
    }
}

// ============================================================================
// 🔍 FUNÇÃO: PROCESSAR CONSULTA OS
// ============================================================================

async function processarConsultaOS(mensagem) {
    try {
        const dados = NLPService.extrairDadosConsultaOS(mensagem);
        console.log('   🔍 Dados para consulta OS:', dados);
        
        const where = {};
        
        if (dados.numeroOS) {
            where.id = dados.numeroOS;
        }
        
        if (dados.placa) {
            where.veiculo = {
                placa: dados.placa
            };
        }
        
        if (dados.cliente) {
            where.cliente = {
                nomeCompleto: {
                    contains: dados.cliente,
                    mode: 'insensitive'
                }
            };
        }
        
        if (dados.status) {
            where.status = dados.status;
        }
        
        const ordensServico = await prisma.ordemServico.findMany({
            where,
            include: {
                cliente: true,
                veiculo: true
            },
            orderBy: {
                dataAbertura: 'desc'
            },
            take: 10
        });
        
        if (ordensServico.length === 0) {
            return {
                success: false,
                response: '🔍 **Nenhuma ordem de serviço encontrada**\n\n💡 Verifique os dados e tente novamente.',
                tipo: 'vazio'
            };
        }
        
        const lista = ordensServico.map((os, i) => 
            `${i + 1}. **OS #${os.id}** - ${os.cliente.nomeCompleto}\n   🚗 ${os.veiculo.marca} ${os.veiculo.modelo} (${os.veiculo.placa})\n   📊 Status: ${os.status}\n   📅 Abertura: ${new Date(os.dataAbertura).toLocaleDateString('pt-BR')}`
        ).join('\n\n');
        
        return {
            success: true,
            response: `🔍 **Ordens de Serviço Encontradas** (${ordensServico.length})\n\n${lista}`,
            tipo: 'lista',
            total: ordensServico.length,
            ordensServico
        };
        
    } catch (error) {
        console.error('❌ Erro em processarConsultaOS:', error);
        return {
            success: false,
            response: '❌ Erro ao consultar ordens de serviço',
            tipo: 'erro'
        };
    }
}

// ============================================================================
// 📦 FUNÇÃO: PROCESSAR CONSULTA ESTOQUE
// ============================================================================

async function processarConsultaEstoque(mensagem) {
    try {
        // Implementar lógica de consulta de estoque
        return {
            success: true,
            response: '📦 **Consulta de Estoque**\n\nFuncionalidade em desenvolvimento.',
            tipo: 'info'
        };
    } catch (error) {
        return {
            success: false,
            response: '❌ Erro ao consultar estoque',
            tipo: 'erro'
        };
    }
}

// ============================================================================
// 📊 FUNÇÃO: PROCESSAR ESTATÍSTICAS
// ============================================================================

async function processarEstatisticas(mensagem) {
    try {
        const stats = await ConsultasOSService.obterResumoOfficina('hoje');
        
        return {
            success: true,
            response: `📊 **Estatísticas de Hoje**\n\n• **Ordens de Serviço:** ${stats.total_os || 0}\n• **Agendamentos:** ${stats.agendamentos || 0}\n• **Clientes Atendidos:** ${stats.clientes || 0}\n• **Receita:** R$ ${(stats.receita || 0).toFixed(2)}`,
            tipo: 'estatisticas',
            stats
        };
    } catch (error) {
        console.error('❌ Erro em processarEstatisticas:', error);
        return {
            success: false,
            response: '❌ Erro ao buscar estatísticas',
            tipo: 'erro'
        };
    }
}

// ============================================================================
// 👤 FUNÇÃO: PROCESSAR CONSULTA CLIENTE
// ============================================================================

async function processarConsultaCliente(mensagem) {
    try {
        // Implementar lógica de consulta de cliente
        return {
            success: true,
            response: '👤 **Consulta de Clientes**\n\nFuncionalidade em desenvolvimento.',
            tipo: 'info'
        };
    } catch (error) {
        return {
            success: false,
            response: '❌ Erro ao consultar cliente',
            tipo: 'erro'
        };
    }
}

// ============================================================================
// 💬 FUNÇÃO: PROCESSAR CONVERSA GERAL
// ============================================================================

async function processarConversaGeral(mensagem) {
    // Se Agno estiver configurado, enviar para lá
    // Senão, resposta genérica
    return {
        success: true,
        response: '🤖 **Assistente Matias**\n\nComo posso ajudar?\n\n💡 Digite "ajuda" para ver o que posso fazer.',
        tipo: 'conversa'
    };
}

// ============================================================================
// 👤 FUNÇÃO: PROCESSAR CADASTRO DE CLIENTE
// ============================================================================

async function processarCadastroCliente(mensagem, usuario_id) {
    try {
        // Buscar oficinaId do usuário
        let oficinaId = null;
        if (usuario_id) {
            const usuario = await prisma.user.findUnique({
                where: { id: String(usuario_id) },
                select: { oficinaId: true }
            });
            oficinaId = usuario?.oficinaId;
        }
        
        if (!oficinaId) {
            return {
                success: false,
                response: '❌ **Erro:** Não foi possível identificar sua oficina.',
                tipo: 'erro'
            };
        }
        
        // Extrair dados do cliente da mensagem
        const dados = NLPService.extrairDadosCliente(mensagem);
        
        console.log('   📋 Dados extraídos:', dados);
        
        // Verificar se tem dados suficientes
        if (!dados.nome || dados.nome.length < 3) {
            return {
                success: false,
                response: `📝 **Para cadastrar um novo cliente, preciso dos seguintes dados:**

• **Nome completo**
• Telefone (opcional)
• CPF/CNPJ (opcional)
• Email (opcional)

**Exemplo:**
"Nome: João Silva, Tel: (85) 99999-9999, CPF: 123.456.789-00"

**Ou informe apenas o nome para cadastro rápido:**
"Cadastrar cliente João Silva"`,
                tipo: 'pergunta'
            };
        }
        
        // Verificar se cliente já existe
        const clienteExistente = await prisma.cliente.findFirst({
            where: {
                nomeCompleto: {
                    equals: dados.nome,
                    mode: 'insensitive'
                },
                oficinaId
            }
        });
        
        if (clienteExistente) {
            return {
                success: false,
                response: `⚠️ **Cliente já cadastrado!**

**Nome:** ${clienteExistente.nomeCompleto}
**Telefone:** ${clienteExistente.telefone || 'Não informado'}
**CPF/CNPJ:** ${clienteExistente.cpfCnpj || 'Não informado'}

💡 Deseja fazer um agendamento para este cliente?`,
                tipo: 'alerta',
                cliente: clienteExistente
            };
        }
        
        // Criar novo cliente
        const novoCliente = await prisma.cliente.create({
            data: {
                nomeCompleto: dados.nome,
                telefone: dados.telefone || null,
                cpfCnpj: dados.cpfCnpj || null,
                email: dados.email || null,
                oficinaId
            }
        });
        
        return {
            success: true,
            response: `✅ **Cliente cadastrado com sucesso!**

**Nome:** ${novoCliente.nomeCompleto}
${dados.telefone ? `**Telefone:** ${dados.telefone}` : ''}
${dados.cpfCnpj ? `**CPF/CNPJ:** ${dados.cpfCnpj}` : ''}
${dados.email ? `**Email:** ${dados.email}` : ''}

💡 **Próximos passos:**
• Fazer agendamento para este cliente
• Cadastrar veículo do cliente
• Adicionar mais informações`,
            tipo: 'sucesso',
            cliente: novoCliente
        };
        
    } catch (error) {
        console.error('❌ Erro ao cadastrar cliente:', error);
        return {
            success: false,
            response: '❌ **Erro ao cadastrar cliente**\n\nPor favor, tente novamente ou cadastre manualmente na tela de clientes.',
            tipo: 'erro'
        };
    }
}

// ============================================================
// ENDPOINTS PARA INTEGRAÇÃO COM AGNO - FUNCIONALIDADES MATIAS
// ============================================================

// Endpoint para o Agno consultar Ordens de Serviço
router.post('/consultar-os', async (req, res) => {
    try {
        const { veiculo, proprietario, status, periodo } = req.body;
        
        console.log('🔍 Agno consultando OS:', { veiculo, proprietario, status, periodo });
        
        const resultados = await ConsultasOSService.consultarOS({
            veiculo,
            proprietario, 
            status,
            periodo
        });
        
        res.json({
            success: true,
            total: resultados.length,
            ordens_servico: resultados,
            timestamp: new Date().toISOString()
        });
        
    } catch (error) {
        console.error('❌ Erro na consulta OS:', error);
        res.status(500).json({
            success: false,
            error: 'Erro ao consultar ordens de serviço',
            message: error.message
        });
    }
});

// Endpoint para o Agno agendar serviços
router.post('/agendar-servico', async (req, res) => {
    try {
        const { cliente, veiculo, servico, data_hora, descricao } = req.body;
        
        console.log('📅 Agno agendando serviço:', { cliente, veiculo, servico, data_hora });
        
        const agendamento = await AgendamentosService.criarAgendamento({
            clienteId: cliente.id,
            veiculoId: veiculo.id,
            tipoServico: servico,
            dataHora: new Date(data_hora),
            descricao,
            status: 'AGENDADO'
        });
        
        res.json({
            success: true,
            agendamento,
            mensagem: `Serviço ${servico} agendado para ${new Date(data_hora).toLocaleString('pt-BR')}`,
            timestamp: new Date().toISOString()
        });
        
    } catch (error) {
        console.error('❌ Erro no agendamento:', error);
        res.status(500).json({
            success: false,
            error: 'Erro ao agendar serviço',
            message: error.message
        });
    }
});

// Endpoint para o Agno consultar estatísticas
router.get('/estatisticas', async (req, res) => {
    try {
        const { periodo = '30_dias' } = req.query;
        
        console.log('📊 Agno consultando estatísticas:', { periodo });
        
        const stats = await ConsultasOSService.obterEstatisticas(periodo);
        
        res.json({
            success: true,
            periodo,
            estatisticas: stats,
            timestamp: new Date().toISOString()
        });
        
    } catch (error) {
        console.error('❌ Erro nas estatísticas:', error);
        res.status(500).json({
            success: false,
            error: 'Erro ao consultar estatísticas',
            message: error.message
        });
    }
});

// Endpoint para o Agno salvar conversas
router.post('/salvar-conversa', async (req, res) => {
    try {
        const { usuario_id, mensagem, resposta, contexto } = req.body;
        
        console.log('💾 Agno salvando conversa:', { usuario_id, mensagem: mensagem?.substring(0, 50) });
        
        const conversa = await ConversasService.salvarConversa({
            usuarioId: usuario_id,
            pergunta: mensagem,
            resposta,
            contexto: JSON.stringify(contexto || {}),
            timestamp: new Date()
        });
        
        res.json({
            success: true,
            conversa_id: conversa.id,
            timestamp: new Date().toISOString()
        });
        
    } catch (error) {
        console.error('❌ Erro ao salvar conversa:', error);
        res.status(500).json({
            success: false,
            error: 'Erro ao salvar conversa',
            message: error.message
        });
    }
});

// Endpoint para o Agno recuperar histórico de conversas
router.get('/historico-conversas/:usuario_id', async (req, res) => {
    try {
        const { usuario_id } = req.params;
        const { limite = 10 } = req.query;
        
        console.log('📚 Agno recuperando histórico:', { usuario_id, limite });
        
        const historico = await ConversasService.obterHistorico(usuario_id, parseInt(limite));
        
        res.json({
            success: true,
            usuario_id,
            total: historico.length,
            conversas: historico,
            timestamp: new Date().toISOString()
        });
        
    } catch (error) {
        console.error('❌ Erro no histórico:', error);
        res.status(500).json({
            success: false,
            error: 'Erro ao recuperar histórico',
            message: error.message
        });
    }
});

// Endpoint para fornecer contexto do sistema ao Agno
router.get('/contexto-sistema', async (req, res) => {
    try {
        const contexto = {
            sistema: "OFIX - Sistema de Oficina Automotiva",
            versao: "2024.1",
            assistente: "Matias",
            capacidades: [
                "Consultar ordens de serviço por veículo, proprietário ou status",
                "Agendar novos serviços com data e hora específicas", 
                "Calcular orçamentos baseados em peças e mão de obra",
                "Consultar histórico completo de veículos",
                "Gerar relatórios de produtividade da oficina",
                "Buscar peças no estoque com preços atualizados",
                "Acompanhar status de serviços em andamento"
            ],
            funcoes_disponivel: {
                "consultar_os": "/agno/consultar-os",
                "agendar_servico": "/agno/agendar-servico", 
                "obter_estatisticas": "/agno/estatisticas",
                "salvar_conversa": "/agno/salvar-conversa",
                "historico": "/agno/historico-conversas/:usuario_id"
            },
            exemplos_uso: {
                consulta_os: "Mostrar todas as ordens de serviço do Gol 2020 prata",
                agendamento: "Agendar revisão para o Civic do João na próxima segunda às 14h",
                estatisticas: "Quantos carros atendemos este mês?"
            },
            timestamp: new Date().toISOString()
        };
        
        res.json({
            success: true,
            contexto
        });
        
    } catch (error) {
        console.error('❌ Erro no contexto:', error);
        res.status(500).json({
            success: false,
            error: 'Erro ao obter contexto do sistema'
        });
    }
});

// Middleware para verificar autenticação
const verificarAuth = (req, res, next) => {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
        return res.status(401).json({ error: 'Token de autenticação necessário' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        next();
    } catch (error) {
        return res.status(401).json({ error: 'Token inválido' });
    }
};

// Health check do agente Agno
router.get('/health', verificarAuth, async (req, res) => {
    try {
        console.log('🔍 Verificando status do agente Agno...');
        
        const response = await fetch(`${AGNO_API_URL}/health`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                ...(AGNO_API_TOKEN && { 'Authorization': `Bearer ${AGNO_API_TOKEN}` })
            },
            timeout: 5000
        });

        if (response.ok) {
            const data = await response.json();
            console.log('✅ Agente Agno online:', data);
            
            res.json({
                status: 'online',
                agno_status: data,
                timestamp: new Date().toISOString()
            });
        } else {
            console.log('⚠️ Agente Agno retornou erro:', response.status);
            res.status(response.status).json({
                status: 'erro',
                message: 'Agente não disponível',
                agno_status: response.status
            });
        }
    } catch (error) {
        console.error('❌ Erro ao conectar com agente Agno:', error.message);
        res.status(503).json({
            status: 'erro',
            message: 'Serviço temporariamente indisponível',
            error: error.message
        });
    }
});

// Listar agentes disponíveis
router.get('/agents', verificarAuth, async (req, res) => {
    try {
        console.log('📋 Listando agentes disponíveis...');
        
        const response = await fetch(`${AGNO_API_URL}/agents`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                ...(AGNO_API_TOKEN && { 'Authorization': `Bearer ${AGNO_API_TOKEN}` })
            }
        });

        if (response.ok) {
            const data = await response.json();
            console.log('📋 Agentes encontrados:', data.length);
            
            res.json({
                success: true,
                agents: data,
                count: data.length
            });
        } else {
            const errorData = await response.text();
            console.error('❌ Erro ao listar agentes:', response.status, errorData);
            res.status(response.status).json({
                error: 'Erro ao listar agentes',
                details: errorData
            });
        }
    } catch (error) {
        console.error('❌ Erro ao conectar para listar agentes:', error.message);
        res.status(500).json({
            error: 'Erro interno do servidor',
            message: error.message
        });
    }
});

// Chat com o agente Agno
router.post('/chat', verificarAuth, async (req, res) => {
    try {
        const { message, agent_id, session_id } = req.body;
        
        if (!message) {
            return res.status(400).json({ error: 'Mensagem é obrigatória' });
        }

        // Verificar se temos user_id válido
        const userId = req.user?.id || req.user?.userId || 'anonymous';
        const agentId = agent_id || 'oficinaia'; // Usar oficinaia por padrão, mas permitir override
        
        console.log('💬 Enviando mensagem para agente Agno:', {
            user: req.user.email,
            user_id: userId,
            agent_id: agentId,
            session_id: session_id,
            message: message.substring(0, 100) + '...'
        });

        // Preparar FormData para multipart/form-data
        const formData = new FormData();
        formData.append('message', message);
        formData.append('stream', 'false');
        formData.append('user_id', userId);
        
        // Adicionar session_id para manter contexto (opcional)
        if (session_id) {
            formData.append('session_id', session_id);
        }

        const response = await fetch(`${AGNO_API_URL}/agents/${agentId}/runs`, {
            method: 'POST',
            headers: {
                ...formData.getHeaders(),
                ...(AGNO_API_TOKEN && { 'Authorization': `Bearer ${AGNO_API_TOKEN}` })
            },
            body: formData,
            timeout: 30000 // 30 segundos timeout
        });

        if (response.ok) {
            const data = await response.json();
            console.log('✅ Resposta recebida do agente Agno:', JSON.stringify(data, null, 2));
            
            // Extrair o conteúdo da resposta de forma segura
            let responseText = '';
            
            if (typeof data === 'string') {
                responseText = data;
            } else if (data.content) {
                responseText = data.content;
            } else if (data.response) {
                responseText = data.response;
            } else if (data.message) {
                responseText = data.message;
            } else if (data.output) {
                responseText = data.output;
            } else {
                responseText = 'Resposta recebida do agente (formato não reconhecido)';
            }
            
            res.json({
                success: true,
                response: responseText,
                session_id: data.session_id, // Retornar session_id para o frontend
                metadata: {
                    agent_id: agentId,
                    run_id: data.run_id,
                    session_id: data.session_id,
                    model: data.model || data.model_provider,
                    tokens_used: data.tokens_used || data.metrics?.total_tokens,
                    timestamp: new Date().toISOString()
                }
            });
        } else {
            const errorData = await response.text();
            console.error('❌ Erro na resposta do agente Agno:', response.status, errorData);
            
            let suggestion = null;
            if (response.status === 404) {
                suggestion = 'Agente não encontrado. Use GET /api/agno/agents para listar agentes disponíveis.';
            }
            
            res.status(response.status).json({
                error: 'Erro no processamento da mensagem',
                details: errorData,
                agno_status: response.status,
                suggestion: suggestion
            });
        }
    } catch (error) {
        console.error('❌ Erro ao comunicar com agente Agno:', error.message);
        res.status(500).json({
            error: 'Erro interno do servidor',
            message: error.message
        });
    }
});

// Rota para testar com parâmetros específicos (debug)
router.post('/chat-debug', verificarAuth, async (req, res) => {
    try {
        const { message, agent_id, session_id, custom_params } = req.body;
        
        if (!message) {
            return res.status(400).json({ error: 'Mensagem é obrigatória' });
        }

        const userId = req.user?.id || req.user?.userId || 'anonymous';
        const agentId = agent_id || 'oficinaia';
        
        console.log('🔍 Debug - Testando com parâmetros personalizados:', {
            user: req.user.email,
            agent_id: agentId,
            session_id: session_id,
            custom_params: custom_params,
            message: message
        });

        // Preparar FormData com parâmetros customizáveis
        const formData = new FormData();
        formData.append('message', message);
        formData.append('stream', 'false');
        formData.append('user_id', userId);
        
        if (session_id) {
            formData.append('session_id', session_id);
        }
        
        // Adicionar parâmetros customizados se fornecidos
        if (custom_params) {
            Object.keys(custom_params).forEach(key => {
                formData.append(key, custom_params[key]);
            });
        }

        const response = await fetch(`${AGNO_API_URL}/agents/${agentId}/runs`, {
            method: 'POST',
            headers: {
                ...formData.getHeaders(),
                ...(AGNO_API_TOKEN && { 'Authorization': `Bearer ${AGNO_API_TOKEN}` })
            },
            body: formData,
            timeout: 30000
        });

        if (response.ok) {
            const data = await response.json();
            console.log('🔍 Debug - Resposta completa:', JSON.stringify(data, null, 2));
            
            res.json({
                success: true,
                debug: true,
                full_response: data, // Retornar resposta completa para análise
                extracted_response: data.content || data.response || data.message,
                session_id: data.session_id,
                metadata: {
                    agent_id: agentId,
                    run_id: data.run_id,
                    session_id: data.session_id,
                    model: data.model || data.model_provider,
                    tokens_used: data.tokens_used || data.metrics?.total_tokens
                }
            });
        } else {
            const errorData = await response.text();
            res.status(response.status).json({
                error: 'Erro no debug',
                details: errorData
            });
        }
    } catch (error) {
        console.error('❌ Erro no debug:', error.message);
        res.status(500).json({
            error: 'Erro interno no debug',
            message: error.message
        });
    }
});

// Rota para testar com mensagens mais diretas (sem user_id que pode confundir)
router.post('/chat-direct', verificarAuth, async (req, res) => {
    try {
        const { message, agent_id } = req.body;
        
        if (!message) {
            return res.status(400).json({ error: 'Mensagem é obrigatória' });
        }

        const agentId = agent_id || 'oficinaia';
        
        console.log('🎯 Teste direto - sem user_id específico:', {
            agent_id: agentId,
            message: message
        });

        // FormData mais simples, sem user_id específico
        const formData = new FormData();
        formData.append('message', message);
        formData.append('stream', 'false');
        // Não enviar user_id específico para ver se melhora

        const response = await fetch(`${AGNO_API_URL}/agents/${agentId}/runs`, {
            method: 'POST',
            headers: {
                ...formData.getHeaders(),
                ...(AGNO_API_TOKEN && { 'Authorization': `Bearer ${AGNO_API_TOKEN}` })
            },
            body: formData,
            timeout: 30000
        });

        if (response.ok) {
            const data = await response.json();
            console.log('🎯 Resposta do teste direto:', JSON.stringify(data, null, 2));
            
            const responseText = data.content || data.response || data.message || 'Sem resposta';
            
            res.json({
                success: true,
                response: responseText,
                session_id: data.session_id,
                test_mode: 'direct',
                metadata: {
                    agent_id: agentId,
                    run_id: data.run_id,
                    session_id: data.session_id,
                    model: data.model || data.model_provider,
                    tools_used: data.tools ? data.tools.length : 0,
                    tokens_used: data.tokens_used || data.metrics?.total_tokens
                }
            });
        } else {
            const errorData = await response.text();
            res.status(response.status).json({
                error: 'Erro no teste direto',
                details: errorData
            });
        }
    } catch (error) {
        console.error('❌ Erro no teste direto:', error.message);
        res.status(500).json({
            error: 'Erro interno no teste direto',
            message: error.message
        });
    }
});

// Nova rota com instruções RIGOROSAS para usar APENAS dados encontrados
router.post('/chat-strict', verificarAuth, async (req, res) => {
    try {
        const { message, session_id } = req.body;
        const agentId = 'oficinaia';
        
        console.log('🎯 Chat-strict iniciado - instruções rigorosas');
        console.log('📝 Mensagem original:', message);
        
        // Instruções ULTRA RIGOROSAS para forçar uso de dados específicos
        const enhancedMessage = `INSTRUÇÕES CRÍTICAS - LEIA COM ATENÇÃO TOTAL:

1. Você DEVE usar EXCLUSIVAMENTE os dados encontrados nas suas pesquisas da base de conhecimento
2. Se encontrar dados específicos (preços, valores, informações), use EXATAMENTE esses dados
3. JAMAIS invente, estime ou use conhecimento geral quando tiver dados específicos
4. Se pesquisar e encontrar "R$ 120,00" para troca de óleo, responda EXATAMENTE "R$ 120,00"
5. TOTALMENTE PROIBIDO usar ranges como "R$ 50-150" ou "em média R$ 80" quando tiver valor específico
6. Se não encontrar dados específicos na base, diga claramente "Não encontrei essa informação específica na base de conhecimento"
7. Use SOMENTE o que está documentado nos resultados das suas pesquisas
8. IGNORE completamente conhecimento geral se tiver dados específicos encontrados

PERGUNTA DO USUÁRIO: ${message}

LEMBRE-SE: DADOS ENCONTRADOS = RESPOSTA EXATA. NUNCA substitua dados específicos por estimativas!`;

        console.log('🔧 Mensagem com instruções rigorosas preparada');

        const formData = new FormData();
        formData.append('message', enhancedMessage);
        formData.append('stream', 'false');
        formData.append('user_id', req.user?.id || req.user?.userId || 'ofix_user');
        
        if (session_id) {
            formData.append('session_id', session_id);
        }

        const response = await fetch(`${AGNO_API_URL}/agents/${agentId}/runs`, {
            method: 'POST',
            headers: {
                ...formData.getHeaders(),
                ...(AGNO_API_TOKEN && { 'Authorization': `Bearer ${AGNO_API_TOKEN}` })
            },
            body: formData,
            timeout: 30000
        });

        if (response.ok) {
            const data = await response.json();
            console.log('🎯 Resposta chat-strict:', JSON.stringify(data, null, 2));
            
            const responseText = data.content || data.response || data.message || 'Sem resposta';
            
            res.json({
                success: true,
                response: responseText,
                session_id: data.session_id,
                mode: 'strict-instructions',
                metadata: {
                    agent_id: agentId,
                    run_id: data.run_id,
                    session_id: data.session_id,
                    model: data.model || data.model_provider,
                    tools_used: data.tools ? data.tools.length : 0,
                    tokens_used: data.tokens_used || data.metrics?.total_tokens,
                    timestamp: new Date().toISOString()
                }
            });
        } else {
            const errorData = await response.text();
            console.error('❌ Erro no chat-strict:', response.status, errorData);
            res.status(response.status).json({
                error: 'Erro no chat com instruções rigorosas',
                details: errorData
            });
        }
    } catch (error) {
        console.error('❌ Erro no chat-strict:', error.message);
        res.status(500).json({
            error: 'Erro interno no chat-strict',
            message: error.message
        });
    }
});

export default router;