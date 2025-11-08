import express from 'express';
import fetch from 'node-fetch';
import jwt from 'jsonwebtoken';

// Importar serviços do Matias
import ConversasService from '../services/conversas.service.js';
import AgendamentosService from '../services/agendamentos.service.js';
import ConsultasOSService from '../services/consultasOS.service.js';
import NLPService from '../services/nlp.service.js';
import prisma from '../config/database.js';

// ⭐ NOVA ARQUITETURA MULTI-AGENTE (Nov 2025)
import MessageClassifier from '../services/message-classifier.service.js';
import AgendamentoLocal from '../services/agendamento-local.service.js';
import LocalResponse from '../services/local-response.service.js';

const router = express.Router();

// Configurações do Agno (pode vir de variáveis de ambiente)
const AGNO_API_URL = process.env.AGNO_API_URL || 'http://localhost:8000';
const AGNO_API_TOKEN = process.env.AGNO_API_TOKEN || '';

// Cache simples para manter contexto de seleção de clientes por usuário
const contextoSelecaoClientes = new Map(); // { usuarioId: { clientes: [...], timestamp: Date } }
const TEMPO_EXPIRACAO = 10 * 60 * 1000; // 10 minutos

// Cache de warming do Agno
let agnoWarmed = false;
let lastWarmingAttempt = null;

// ⚡ CIRCUIT BREAKER para Rate Limit (429)
let circuitBreakerOpen = false;
let circuitBreakerOpenUntil = null;
const CIRCUIT_BREAKER_COOLDOWN = 60000; // 1 minuto de cooldown após 429

function checkCircuitBreaker() {
    if (circuitBreakerOpen) {
        const now = Date.now();
        if (now < circuitBreakerOpenUntil) {
            const remainingSeconds = Math.ceil((circuitBreakerOpenUntil - now) / 1000);
            console.log(`🚫 [CIRCUIT BREAKER] Agno AI bloqueado por ${remainingSeconds}s (rate limit)`);
            return false; // Bloqueado
        } else {
            // Cooldown expirou, resetar
            console.log('✅ [CIRCUIT BREAKER] Cooldown expirado, reativando Agno AI');
            circuitBreakerOpen = false;
            circuitBreakerOpenUntil = null;
        }
    }
    return true; // Permitido
}

function openCircuitBreaker() {
    circuitBreakerOpen = true;
    circuitBreakerOpenUntil = Date.now() + CIRCUIT_BREAKER_COOLDOWN;
    console.log(`🚫 [CIRCUIT BREAKER] Agno AI bloqueado por ${CIRCUIT_BREAKER_COOLDOWN / 1000}s (rate limit detectado)`);
}

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
            warmed: agnoWarmed,
            last_warming: lastWarmingAttempt ? new Date(lastWarmingAttempt).toISOString() : null,
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

// Endpoint para aquecer o serviço Agno (útil para evitar cold starts)
router.post('/warm', async (req, res) => {
    try {
        console.log('🔥 Requisição de warming do Agno...');
        
        const success = await warmAgnoService();
        
        res.json({
            success: success,
            warmed: agnoWarmed,
            agno_url: AGNO_API_URL,
            message: success ? 'Serviço Agno aquecido com sucesso' : 'Falha ao aquecer serviço Agno',
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('❌ Erro ao aquecer Agno:', error.message);
        res.status(500).json({
            success: false,
            error: 'Erro ao aquecer serviço',
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

        try {
            const response = await fetch(`${AGNO_API_URL}/chat`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...(AGNO_API_TOKEN && { 'Authorization': `Bearer ${AGNO_API_TOKEN}` })
                },
                body: JSON.stringify({
                    message: message,
                    user_id: 'test_user'
                }),
                timeout: 15000 // 15 segundos
            });

            if (response.ok) {
                const data = await response.json();
                const responseText = data.response || data.content || data.message || 'Resposta do agente Matias';

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
        const { message, usuario_id, nlp, contextoNLP, contexto_ativo } = req.body;

        if (!message) {
            return res.status(400).json({
                success: false,
                error: 'Mensagem é obrigatória'
            });
        }

        console.log('💬 [CHAT-INTELIGENTE] Nova mensagem:', message.substring(0, 80) + '...');
        console.log('🎯 Usuario ID:', usuario_id);
        console.log('🎯 Contexto ativo:', contexto_ativo);

        // ⭐ NOVA ARQUITETURA: Usar MessageClassifier
        const classification = MessageClassifier.classify(message);
        console.log('🎯 [CLASSIFIER] Resultado:', {
            processor: classification.processor,
            type: classification.type,
            subtype: classification.subtype,
            confidence: classification.confidence
        });

        // 2️⃣ ROTEAMENTO INTELIGENTE
        let responseData;
        const startTime = Date.now();

        if (classification.processor === 'BACKEND_LOCAL') {
            // ⚡ PROCESSA LOCALMENTE (rápido, confiável)
            console.log('⚡ [BACKEND_LOCAL] Processando localmente...');
            
            responseData = await processarLocal(message, classification, usuario_id, contexto_ativo, req);
            
            const duration = Date.now() - startTime;
            console.log(`✅ [BACKEND_LOCAL] Processado em ${duration}ms`);
            
            // Adiciona metadata
            responseData.metadata = {
                ...responseData.metadata,
                processed_by: 'BACKEND_LOCAL',
                processing_time_ms: duration,
                classification: classification
            };

        } else {
            // 🧠 ENVIA PARA AGNO AI (inteligente, conversacional)
            console.log('🧠 [AGNO_AI] Enviando para Agno AI...');
            
            try {
                responseData = await processarComAgnoAI(message, usuario_id, 'oficinaia', null);
                
                const duration = Date.now() - startTime;
                console.log(`✅ [AGNO_AI] Processado em ${duration}ms`);
                
                // Adiciona metadata
                if (responseData.metadata) {
                    responseData.metadata.processed_by = 'AGNO_AI';
                    responseData.metadata.processing_time_ms = duration;
                    responseData.metadata.classification = classification;
                }
            } catch (agnoError) {
                const isTimeout = agnoError.message.includes('timeout') || agnoError.message.includes('429');
                const errorType = isTimeout ? '⏱️ Timeout/Rate Limit' : '❌ Erro';
                console.error(`   ⚠️ Agno falhou (${errorType}), usando fallback:`, agnoError.message);
                
                // Fallback para resposta local baseado no subtipo
                const duration = Date.now() - startTime;
                
                if (classification.subtype === 'ORCAMENTO' || classification.subtype === 'CONSULTA_PRECO') {
                    responseData = {
                        success: true,
                        response: `💰 **Consulta de Preço**\n\n${isTimeout ? '⚠️ _O assistente está temporariamente indisponível._\n\n' : ''}Para fornecer um orçamento preciso, preciso de algumas informações:\n\n• Qual é o modelo do veículo?\n• Qual ano?\n\nOs valores variam dependendo do veículo. Entre em contato para um orçamento personalizado!\n\n📞 **Contato:** (11) 1234-5678`,
                        tipo: 'consulta_preco',
                        mode: 'fallback',
                        metadata: {
                            processed_by: 'BACKEND_LOCAL_FALLBACK',
                            processing_time_ms: duration,
                            agno_error: agnoError.message,
                            is_timeout: isTimeout,
                            classification: classification
                        }
                    };
                } else {
                    // Fallback genérico
                    responseData = {
                        success: true,
                        response: `Olá! 👋\n\n${isTimeout ? '⚠️ _O assistente avançado está temporariamente indisponível._\n\n' : ''}Como posso ajudar você hoje?\n\n• Agendar um serviço\n• Consultar ordem de serviço\n• Ver peças em estoque\n• Cadastrar cliente\n• Ver estatísticas\n\nDigite sua solicitação!`,
                        tipo: 'ajuda',
                        mode: 'fallback',
                        metadata: {
                            processed_by: 'BACKEND_LOCAL_FALLBACK',
                            processing_time_ms: duration,
                            agno_error: agnoError.message,
                            is_timeout: isTimeout,
                            classification: classification
                        }
                    };
                }
            }
        }

        // 3️⃣ SALVAR CONVERSA NO BANCO
        try {
            if (usuario_id) {
                await ConversasService.salvarConversa({
                    usuarioId: usuario_id,
                    pergunta: message,
                    resposta: responseData.response || 'Sem resposta',
                    contexto: JSON.stringify({ 
                        classification: classification,
                        contexto_ativo, 
                        ...responseData.metadata 
                    }),
                    timestamp: new Date()
                });
                console.log('✅ Mensagem salva no histórico');
            }
        } catch (saveError) {
            console.error('⚠️ Erro ao salvar conversa (não crítico):', saveError.message);
        }

        // 4️⃣ RETORNAR RESPOSTA
        return res.json({
            success: true,
            ...responseData
        });

    } catch (error) {
        console.error('❌ Erro no chat inteligente:', error);
        return res.status(500).json({
            success: false,
            error: 'Erro ao processar mensagem',
            message: error.message
        });
    }
});

// ============================================================
// 📜 HISTÓRICO DE CONVERSAS
// ============================================================

router.get('/historico-conversa', async (req, res) => {
    try {
        const { usuario_id } = req.query;

        if (!usuario_id) {
            return res.status(400).json({
                success: false,
                error: 'usuario_id é obrigatório'
            });
        }

        console.log('📜 Buscando histórico para usuário:', usuario_id);

        // Converter UUID para Int para busca
        const usuarioIdInt = parseInt(usuario_id.replace(/-/g, '').substring(0, 9), 16) % 2147483647;

        // Buscar conversa mais recente do usuário
        const conversa = await prisma.conversaMatias.findFirst({
            where: { userId: usuarioIdInt },
            orderBy: { createdAt: 'desc' },
            include: {
                mensagens: {
                    orderBy: { createdAt: 'asc' },
                    take: 50 // Últimas 50 mensagens
                }
            }
        });

        if (!conversa || conversa.mensagens.length === 0) {
            return res.json({
                success: true,
                mensagens: [],
                total: 0
            });
        }

        // Formatar mensagens
        const mensagensFormatadas = conversa.mensagens.map(msg => ({
            id: msg.id,
            tipo_remetente: msg.tipo,
            conteudo: msg.conteudo,
            timestamp: msg.createdAt
        }));

        console.log(`✅ Histórico retornado: ${mensagensFormatadas.length} mensagens`);

        res.json({
            success: true,
            mensagens: mensagensFormatadas,
            total: mensagensFormatadas.length,
            conversa_id: conversa.id
        });

    } catch (error) {
        console.error('❌ Erro ao buscar histórico:', error);
        res.status(500).json({
            success: false,
            error: 'Erro ao buscar histórico',
            message: error.message
        });
    }
});

// ============================================================================
// 📅 FUNÇÃO: PROCESSAR AGENDAMENTO
// ============================================================================

async function processarAgendamento(mensagem, usuario_id, cliente_selecionado = null) {
    try {
        console.log('🔍 DEBUG AGENDAMENTO:');
        console.log('   - Mensagem recebida:', mensagem);
        console.log('   - Usuario ID:', usuario_id);
        console.log('   - Cliente selecionado:', cliente_selecionado);
        
        // Verificação específica para quando cliente está selecionado e mensagem é "agendar"
        const mensagemNormalizada = mensagem ? mensagem.trim().toLowerCase() : '';
        console.log('   - Mensagem normalizada:', mensagemNormalizada);
        
        if (cliente_selecionado && (mensagemNormalizada === 'agendar' || mensagemNormalizada === 'agende' || mensagemNormalizada === 'agendar serviço')) {
            console.log('   ✅ Cliente selecionado e mensagem de agendamento detectada');
            return {
                success: false,
                response: `📋 **Agendamento para ${cliente_selecionado.nomeCompleto}**\n\n` +
                         `💡 **Me informe os dados restantes:**\n\n` +
                         `• **Serviço:** Tipo de manutenção (revisão, troca de óleo, etc)\n` +
                         `• **Dia:** Dia da semana ou data (segunda, terça, 20/10)\n` +
                         `• **Horário:** Hora desejada (14h, 16:00)\n\n` +
                         `**Exemplo:**\n` +
                         `"Revisão na segunda às 14h" ou "Troca de óleo amanhã às 10h"`,
                tipo: 'pergunta',
                cliente_selecionado: cliente_selecionado,
                faltando: [
                    '• **Serviço:** Tipo de manutenção (revisão, troca de óleo, etc)',
                    '• **Dia:** Dia da semana ou data (segunda, terça, 20/10)',
                    '• **Horário:** Hora desejada (14h, 16:00)'
                ]
            };
        }

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
        // SE HOUVER CLIENTE SELECIONADO, NÃO VALIDAR A NECESSIDADE DO CLIENTE
        let validacao;
        if (cliente_selecionado) {
            // Quando o cliente já está selecionado e a mensagem é apenas "agendar",
            // retornar uma resposta personalizada pedindo apenas os dados restantes
            if (mensagem.trim().toLowerCase() === 'agendar') {
                return {
                    success: false,
                    response: `📋 **Agendamento para ${cliente_selecionado.nomeCompleto}**\n\n` +
                             `💡 **Me informe os dados restantes:**\n\n` +
                             `• **Serviço:** Tipo de manutenção (revisão, troca de óleo, etc)\n` +
                             `• **Dia:** Dia da semana ou data (segunda, terça, 20/10)\n` +
                             `• **Horário:** Hora desejada (14h, 16:00)\n\n` +
                             `**Exemplo:**\n` +
                             `"Revisão na segunda às 14h" ou "Troca de óleo amanhã às 10h"`,
                    tipo: 'pergunta',
                    cliente_selecionado: cliente_selecionado,
                    faltando: [
                        '• **Serviço:** Tipo de manutenção (revisão, troca de óleo, etc)',
                        '• **Dia:** Dia da semana ou data (segunda, terça, 20/10)',
                        '• **Horário:** Hora desejada (14h, 16:00)'
                    ]
                };
            }
            
            // Criar validação personalizada que ignora a falta de cliente
            const entidadesObrigatorias = ['servico', 'dia', 'hora'];
            const faltando = [];
            
            if (!entidades.servico) faltando.push('• **Serviço:** Tipo de manutenção (revisão, troca de óleo, etc)');
            if (!entidades.diaSemana && !entidades.dataEspecifica) faltando.push('• **Dia:** Dia da semana ou data (segunda, terça, 20/10)');
            if (!entidades.hora) faltando.push('• **Horário:** Hora desejada (14h, 16:00)');
            
            // Não exigir veículo pois podemos usar o veículo do cliente selecionado
            // ou pedir para selecionar um dos veículos do cliente
            validacao = {
                valido: faltando.length === 0,
                faltando: faltando
            };
        } else {
            validacao = NLPService.validarDadosAgendamento(entidades);
        }

        if (!validacao.valido) {
            // Mensagem personalizada baseada no que está faltando
            let mensagemAjuda = '📋 **Vamos fazer seu agendamento!**\n\n';

            if (cliente_selecionado) {
                // O cliente já está selecionado, mostrar mensagem personalizada
                mensagemAjuda += `**Cliente selecionado:** ${cliente_selecionado.nomeCompleto}\n\n`;
                mensagemAjuda += '💡 **Me informe os dados restantes:**\n\n';
                mensagemAjuda += validacao.faltando.join('\n');
                mensagemAjuda += '\n\n**Exemplo:**\n';
                mensagemAjuda += '"Agendar revisão na segunda às 14h" ou "Troca de óleo amanhã às 10h"';
            } else if (validacao.faltando.length === 4 || validacao.faltando.length === 5) {
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

                if (cliente_selecionado) {
                    partes.push(`para o cliente ${cliente_selecionado.nomeCompleto}`);
                } else if (entidades.veiculo) {
                    partes.push(`para o ${entidades.veiculo}`);
                } else if (entidades.cliente) {
                    partes.push(`para o cliente ${entidades.cliente}`);
                } else {
                    partes.push('para o Gol do João');
                }

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

        // Se houver um cliente selecionado previamente, usá-lo
        if (cliente_selecionado) {
            cliente = await prisma.cliente.findFirst({
                where: { id: cliente_selecionado.id },
                include: {
                    veiculos: true
                }
            });
        } else if (entidades.cliente) {
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
                // Formatar opções para seleção no frontend
                const options = clientesSugeridos.map((c) => ({
                    id: c.id,
                    label: c.nomeCompleto,
                    subtitle: c.telefone || 'Sem telefone',
                    details: c.veiculos.length > 0 
                        ? [`🚗 ${c.veiculos.map(v => `${v.marca} ${v.modelo}`).join(', ')}`]
                        : ['Sem veículos cadastrados'],
                    value: `Buscar cliente ${c.nomeCompleto}` // Mensagem que será enviada ao selecionar
                }));

                return {
                    success: false,
                    response: `🔍 **Encontrei ${clientesSugeridos.length} clientes com nome similar a "${entidades.cliente}"**\n\nEscolha o cliente correto abaixo:`,
                    tipo: 'multiplos',
                    metadata: {
                        options: options,
                        selectionTitle: 'Clientes encontrados:'
                    }
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
                // Formatar opções para seleção no frontend
                const options = veiculosEncontrados.map((v) => ({
                    id: v.id,
                    label: `${v.marca} ${v.modelo} ${v.anoModelo || ''}`,
                    subtitle: `Placa: ${v.placa}`,
                    details: v.cor ? [`Cor: ${v.cor}`] : [],
                    value: `Agendar para o veículo ${v.placa}` // Mensagem que será enviada
                }));

                return {
                    success: false,
                    response: `🚗 **Encontrei ${veiculosEncontrados.length} veículos "${entidades.veiculo}" para ${cliente.nomeCompleto}**\n\nEscolha o veículo correto abaixo:`,
                    tipo: 'multiplos',
                    metadata: {
                        options: options,
                        selectionTitle: 'Veículos do cliente:'
                    }
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
                // Formatar opções para seleção no frontend
                const options = cliente.veiculos.map((v) => ({
                    id: v.id,
                    label: `${v.marca} ${v.modelo} ${v.anoModelo || ''}`,
                    subtitle: `Placa: ${v.placa}`,
                    details: v.cor ? [`Cor: ${v.cor}`] : [],
                    value: `Agendar para o veículo ${v.placa} do cliente ${cliente.nomeCompleto}`
                }));

                return {
                    success: false,
                    response: `🚗 **${entidades.veiculo ? `Veículo "${entidades.veiculo}" não encontrado.` : 'Qual veículo deseja agendar?'}**\n\n**Cliente:** ${cliente.nomeCompleto}\n\nEscolha o veículo abaixo:`,
                    tipo: 'pergunta',
                    metadata: {
                        options: options,
                        selectionTitle: 'Veículos disponíveis:'
                    },
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

async function processarConsultaCliente(mensagem, contexto_ativo = null, usuario_id = null) {
    try {
        console.log('🔍 DEBUG: processarConsultaCliente - Mensagem recebida:', mensagem);
        console.log('🔍 DEBUG: processarConsultaCliente - Contexto ativo:', contexto_ativo);
        console.log('🔍 DEBUG: processarConsultaCliente - Usuario ID:', usuario_id);
        
        // Verificar se a mensagem é um número e se estamos em um contexto de seleção de cliente
        // ou se a mensagem é composta apenas por um número (o que indica seleção)
        const mensagemTrimmed = mensagem.trim();
        console.log('🔍 DEBUG: Mensagem após trim:', mensagemTrimmed);
        
        if (mensagemTrimmed.match(/^\d+$/)) {  // Verifica se a mensagem contém apenas dígitos
            console.log('🔢 DEBUG: Detectado número, tentando seleção de cliente');
            const numeroDigitado = parseInt(mensagemTrimmed);
            
            // Verificar se há clientes armazenados no cache para este usuário
            if (usuario_id && contextoSelecaoClientes.has(usuario_id)) {
                const dadosCache = contextoSelecaoClientes.get(usuario_id);
                
                // Verificar se o cache ainda é válido (não expirou)
                if (Date.now() - dadosCache.timestamp < TEMPO_EXPIRACAO) {
                    const clientes = dadosCache.clientes;
                    console.log('🔢 DEBUG: Clientes no cache:', clientes.length);
                    
                    // O usuário digitou um número em resposta à lista de clientes
                    if (numeroDigitado >= 1 && numeroDigitado <= clientes.length) {
                        const clienteSelecionado = clientes[numeroDigitado - 1];
                        console.log('🔢 DEBUG: Cliente selecionado:', clienteSelecionado.nomeCompleto);
                        
                        // Limpar o cache após seleção bem-sucedida
                        contextoSelecaoClientes.delete(usuario_id);
                        
                        return {
                            success: true,
                            response: `✅ **Cliente selecionado:** ${clienteSelecionado.nomeCompleto}\n\nTelefone: ${clienteSelecionado.telefone || 'Não informado'}\nCPF/CNPJ: ${clienteSelecionado.cpfCnpj || 'Não informado'}\nVeículos: ${clienteSelecionado.veiculos && clienteSelecionado.veiculos.length > 0 ? clienteSelecionado.veiculos.map(v => v.modelo).join(', ') : 'Nenhum veículo cadastrado'}\n\n💡 O que deseja fazer com este cliente?\n• "agendar" - Agendar serviço\n• "editar" - Editar dados\n• "histórico" - Ver histórico de serviços`,
                            tipo: 'cliente_selecionado',
                            cliente: clienteSelecionado,
                            cliente_id: clienteSelecionado.id
                        };
                    } else {
                        // Número fora do intervalo
                        console.log('🔢 DEBUG: Número fora do intervalo:', numeroDigitado);
                        return {
                            success: false,
                            response: `❌ **Número inválido:** ${numeroDigitado}\n\nPor favor, escolha um número entre 1 e ${clientes.length}.`,
                            tipo: 'erro'
                        };
                    }
                } else {
                    console.log('🔢 DEBUG: Cache expirado ou não encontrado para o usuário:', usuario_id);
                    // Cache expirado, remover entrada
                    contextoSelecaoClientes.delete(usuario_id);
                }
            } else {
                console.log('🔢 DEBUG: Nenhum cache encontrado para o usuário ou usuário não informado');
            }
        }

        // Extrair nome, telefone ou cpf da mensagem
        const padraoNome = /(?:nome|cliente|dados do cliente|consultar cliente|buscar cliente|telefone|cpf|cnpj):?\s*([A-ZÀ-Üa-zà-ü0-9\s-]+)/i;
        let termoBusca = null;
        const matchNome = mensagem.match(padraoNome);
        
        if (matchNome) {
            termoBusca = matchNome[1].trim();
            console.log('🔍 DEBUG: Termo de busca extraído do padrão:', termoBusca);
        } else {
            // Se não veio formatado, usa a mensagem inteira (útil para nomes compostos)
            termoBusca = mensagem.trim();
            console.log('🔍 DEBUG: Termo de busca usando mensagem completa:', termoBusca);
        }

        if (!termoBusca || termoBusca.length < 2) {
            console.log('🔍 DEBUG: Termo de busca inválido ou muito curto');
            return {
                success: false,
                response: '❌ Informe o nome, telefone ou CPF do cliente para consultar.',
                tipo: 'erro'
            };
        }

        // Buscar clientes por nome, telefone ou cpf
        console.log('🔍 DEBUG: Iniciando busca no banco de dados para:', termoBusca);
        
        const clientes = await prisma.cliente.findMany({
            where: {
                OR: [
                    { nomeCompleto: { contains: termoBusca, mode: 'insensitive' } },
                    { telefone: { contains: termoBusca } },
                    { cpfCnpj: { contains: termoBusca } }
                ]
            },
            include: { veiculos: true }
        });
        
        console.log('🔍 DEBUG: Resultado da busca - encontrados:', clientes.length, 'clientes');
        if (clientes.length > 0) {
            console.log('🔍 DEBUG: Clientes encontrados:', clientes.map(c => c.nomeCompleto));
        }

        if (clientes.length === 0) {
            console.log('🔍 DEBUG: Nenhum cliente encontrado para o termo de busca:', termoBusca);
            return {
                success: false,
                response: `❌ Nenhum cliente encontrado para "${termoBusca}".\n\nTente informar nome completo, telefone ou CPF.`,
                tipo: 'erro'
            };
        }

        // Armazenar os clientes no cache para seleção futura, se tivermos usuario_id
        if (usuario_id) {
            contextoSelecaoClientes.set(usuario_id, {
                clientes: clientes,
                timestamp: Date.now()
            });
            console.log('🔍 DEBUG: Clientes armazenados no cache para usuário:', usuario_id);
        }

        // Montar resposta com lista de clientes
        let resposta = `👤 **Clientes encontrados:**\n\n`;
        clientes.forEach((c, idx) => {
            resposta += `${idx + 1}. **${c.nomeCompleto}**\n`;
            resposta += `   • Telefone: ${c.telefone || 'Não informado'}\n`;
            resposta += `   • CPF/CNPJ: ${c.cpfCnpj || 'Não informado'}\n`;
            if (c.veiculos && c.veiculos.length > 0) {
                resposta += `   • Veículos: ${c.veiculos.map(v => v.modelo).join(', ')}\n`;
            }
            resposta += '\n';
        });

        resposta += `\n💡 Digite o número do cliente para selecionar ou "agendar" para iniciar um agendamento.`;

        return {
            success: true,
            response: resposta,
            tipo: 'consulta_cliente',
            metadata: {
                clientes: clientes,
                options: clientes.map((c, idx) => ({
                    id: c.id,
                    label: c.nomeCompleto,
                    subtitle: c.telefone || 'Sem telefone',
                    details: c.veiculos && c.veiculos.length > 0 ? [`🚗 ${c.veiculos.map(v => `${v.marca} ${v.modelo}`).join(', ')}`] : [],
                    value: (idx + 1).toString() // Valor que será enviado ao selecionar por número
                })),
                selectionTitle: 'Clientes encontrados:'
            },
            contexto_ativo: 'buscar_cliente'  // Sinaliza que estamos em modo de busca de cliente
        };
    } catch (error) {
        console.error('❌ Erro em processarConsultaCliente:', error.message);
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

async function processarConversaGeral(mensagem, usuario_id = null) {
    // 🤖 Se Agno estiver configurado, SEMPRE tentar chamar
    if (AGNO_API_URL && AGNO_API_URL !== 'http://localhost:8000') {
        try {
            console.log('   🤖 Chamando Agno AI para conversa geral');
            const agnoResponse = await chamarAgnoAI(mensagem, usuario_id, 'CONVERSA_GERAL', null);
            return agnoResponse;
        } catch (agnoError) {
            const isTimeout = agnoError.message.includes('timeout');
            const errorType = isTimeout ? '⏱️ Timeout' : '❌ Erro';
            console.error(`   ⚠️ Agno falhou (${errorType}), usando fallback:`, agnoError.message);
            
            // Fallback: resposta genérica com informação sobre o erro
            const fallbackMessage = isTimeout 
                ? `🤖 **Assistente Matias**\n\n⚠️ _O assistente avançado está iniciando (pode levar até 50 segundos no primeiro acesso)._\n\nEnquanto isso, como posso ajudar?\n\n💡 Digite "ajuda" para ver o que posso fazer!`
                : `🤖 **Assistente Matias**\n\nComo posso ajudar?\n\n💡 Digite "ajuda" para ver o que posso fazer!`;
            
            return {
                success: true,
                response: fallbackMessage,
                tipo: 'conversa',
                mode: 'fallback',
                agno_error: agnoError.message,
                is_timeout: isTimeout
            };
        }
    }
    
    // Senão, resposta genérica local
    return {
        success: true,
        response: '🤖 **Assistente Matias**\n\nComo posso ajudar?\n\n💡 Digite "ajuda" para ver o que posso fazer!',
        tipo: 'conversa',
        mode: 'local',
        agno_configured: false
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

        // 🎯 SEMPRE ABRIR MODAL PARA REVISÃO E COMPLEMENTO
        // Mesmo que tenha nome, pedir para revisar e adicionar telefone, CPF, email
        if (!dados.nome || dados.nome.length < 3) {
            // Sem nome ou nome muito curto - pedir dados
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
                tipo: 'cadastro',
                dadosExtraidos: dados
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
            // Cliente existe - abrir modal com dados dele para edição
            return {
                success: false,
                response: `⚠️ **Cliente já cadastrado!**

**Nome:** ${clienteExistente.nomeCompleto}
**Telefone:** ${clienteExistente.telefone || 'Não informado'}
**CPF/CNPJ:** ${clienteExistente.cpfCnpj || 'Não informado'}

💡 Clique no formulário para editar ou adicionar mais informações.`,
                tipo: 'alerta',
                cliente: clienteExistente,
                dadosExtraidos: {
                    nome: clienteExistente.nomeCompleto,
                    telefone: clienteExistente.telefone,
                    cpfCnpj: clienteExistente.cpfCnpj,
                    email: clienteExistente.email
                }
            };
        }

        // 🎯 NÃO CADASTRAR DIRETO - SEMPRE ABRIR MODAL PARA REVISÃO
        // Retorna os dados extraídos para pré-preencher o modal
        // Usuário pode revisar e adicionar telefone, CPF, email antes de salvar
        return {
            success: false,
            response: `📝 **Detectei os seguintes dados. Por favor, revise e complete no formulário:**

**Nome:** ${dados.nome}
${dados.telefone ? `**Telefone:** ${dados.telefone}` : '• Telefone (recomendado)'}
${dados.cpfCnpj ? `**CPF/CNPJ:** ${dados.cpfCnpj}` : '• CPF/CNPJ (recomendado)'}
${dados.email ? `**Email:** ${dados.email}` : '• Email (opcional)'}

✅ Clique no formulário que abriu para revisar e salvar o cadastro.`,
            tipo: 'cadastro',
            dadosExtraidos: dados
        };

    } catch (error) {
        console.error('❌ Erro ao processar cadastro:', error);
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
        const { message, agent_id, session_id, contexto_ativo } = req.body;

        if (!message) {
            return res.status(400).json({ error: 'Mensagem é obrigatória' });
        }

        // Verificar se temos user_id válido
        const userId = req.user?.id || req.user?.userId || 'anonymous';
        const agentId = agent_id || 'oficinaia'; // Usar oficinaia por padrão, mas permitir override

        console.log('💬 [CHAT] Nova mensagem recebida:', {
            user: req.user.email,
            user_id: userId,
            message: message.substring(0, 100) + '...'
        });

        // ⭐ NOVA ARQUITETURA MULTI-AGENTE
        // 1️⃣ CLASSIFICA A MENSAGEM
        const classification = MessageClassifier.classify(message);
        console.log('🎯 [CLASSIFIER] Resultado:', {
            processor: classification.processor,
            type: classification.type,
            subtype: classification.subtype,
            confidence: classification.confidence,
            reason: classification.reason
        });

        // 2️⃣ ROTEAMENTO INTELIGENTE
        let responseData;

        if (classification.processor === 'BACKEND_LOCAL') {
            // ⚡ PROCESSA LOCALMENTE (rápido, confiável)
            console.log('⚡ [BACKEND_LOCAL] Processando localmente...');
            const startTime = Date.now();
            
            responseData = await processarLocal(message, classification, userId, contexto_ativo, req);
            
            const duration = Date.now() - startTime;
            console.log(`✅ [BACKEND_LOCAL] Processado em ${duration}ms`);
            
            // Adiciona metadata
            responseData.metadata = {
                ...responseData.metadata,
                processed_by: 'BACKEND_LOCAL',
                processing_time_ms: duration,
                classification: classification
            };

            return res.json({
                success: true,
                ...responseData
            });

        } else {
            // 🧠 ENVIA PARA AGNO AI (inteligente, conversacional)
            console.log('🧠 [AGNO_AI] Enviando para Agno AI...');
            const startTime = Date.now();
            
            responseData = await processarComAgnoAI(message, userId, agentId, session_id);
            
            const duration = Date.now() - startTime;
            console.log(`✅ [AGNO_AI] Processado em ${duration}ms`);
            
            // Adiciona metadata
            if (responseData.metadata) {
                responseData.metadata.processed_by = 'AGNO_AI';
                responseData.metadata.processing_time_ms = duration;
                responseData.metadata.classification = classification;
            }

            return res.json(responseData);
        }

    } catch (error) {
        console.error('❌ [CHAT] Erro geral:', error);
        res.status(500).json({
            error: 'Erro interno do servidor',
            message: error.message
        });
    }
});

// ============================================================
// 🔧 FUNÇÕES AUXILIARES - PROCESSAMENTO LOCAL
// ============================================================

/**
 * Processa mensagem localmente (SEM Agno AI)
 */
async function processarLocal(message, classification, userId, contexto_ativo, req) {
    try {
        switch (classification.type) {
            case 'GREETING':
                // Saudação instantânea
                const usuario = req.user;
                return LocalResponse.formatarResposta(
                    LocalResponse.gerarSaudacao(usuario),
                    'greeting'
                );

            case 'HELP':
                // Menu de ajuda
                return LocalResponse.formatarResposta(
                    LocalResponse.gerarMenuAjuda(),
                    'help'
                );

            case 'ACTION':
                // Ações estruturadas (CRUD)
                return await processarAcaoLocal(message, classification.subtype, userId, contexto_ativo);

            default:
                // Fallback: envia para Agno AI
                console.log('⚠️ [BACKEND_LOCAL] Tipo não reconhecido, enviando para Agno AI');
                return await processarComAgnoAI(message, userId);
        }
    } catch (error) {
        console.error('❌ [BACKEND_LOCAL] Erro:', error);
        // Em caso de erro, tenta Agno AI como fallback
        return await processarComAgnoAI(message, userId);
    }
}

/**
 * Processa ações estruturadas localmente
 */
async function processarAcaoLocal(message, actionType, userId, contexto_ativo) {
    console.log(`🔧 [ACAO_LOCAL] Processando: ${actionType}`);

    try {
        switch (actionType) {
            case 'AGENDAMENTO':
                // ⭐ AGENDAMENTO LOCAL (10x mais rápido) - NOVA IMPLEMENTAÇÃO
                return await AgendamentoLocal.processar(message, userId, contexto_ativo);

            case 'CONSULTA_OS':
                // Consulta de Ordem de Serviço (usa função existente)
                return await processarConsultaOS(message);

            case 'CONSULTA_ESTOQUE':
                // Consulta de estoque (usa função existente)
                return await processarConsultaEstoque(message);

            case 'CONSULTA_CLIENTE':
                // Consulta de cliente (usa função existente)
                return await processarConsultaCliente(message, contexto_ativo, userId);

            case 'CADASTRO_CLIENTE':
                // Cadastro de cliente (usa função existente)
                return await processarCadastroCliente(message, userId);

            case 'ESTATISTICAS':
                // Estatísticas (usa função existente)
                return await processarEstatisticas(message);

            default:
                // Ação não implementada, envia para Agno AI
                console.log(`⚠️ [ACAO_LOCAL] Ação ${actionType} não implementada, enviando para Agno AI`);
                return await processarComAgnoAI(message, userId);
        }
    } catch (error) {
        console.error(`❌ [ACAO_LOCAL] Erro ao processar ${actionType}:`, error);
        // Em caso de erro, tenta Agno AI como fallback
        return await processarComAgnoAI(message, userId);
    }
}

/**
 * Processa mensagem com Agno AI (mantém lógica original)
 */
async function processarComAgnoAI(message, userId, agentId = 'oficinaia', session_id = null) {
    console.log('🧠 [AGNO_AI] Conectando com Agno...');

    // ⚡ Verificar Circuit Breaker
    if (!checkCircuitBreaker()) {
        // Circuit breaker aberto - retornar fallback local imediatamente
        return {
            success: true,
            response: `🤖 **Processando sua solicitação...**\n\n` +
                `Você disse: "${message}"\n\n` +
                `💡 **Como posso ajudar:**\n` +
                `• Agendar um serviço\n` +
                `• Consultar ordem de serviço\n` +
                `• Ver peças disponíveis\n` +
                `• Tirar dúvidas técnicas\n\n` +
                `📞 **Contato direto:** (11) 1234-5678\n\n` +
                `_Digite sua solicitação específica ou "ajuda" para ver todas as opções_`,
            tipo: 'circuit_breaker_fallback',
            mode: 'local_fallback',
            metadata: {
                circuit_breaker_active: true,
                timestamp: new Date().toISOString()
            }
        };
    }

    // Preparar payload JSON
    const payload = {
        message: message,
        user_id: userId
    };

    // Adicionar session_id para manter contexto (opcional)
    if (session_id) {
        payload.session_id = session_id;
    }

    try {
        const response = await fetch(`${AGNO_API_URL}/chat`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                ...(AGNO_API_TOKEN && { 'Authorization': `Bearer ${AGNO_API_TOKEN}` })
            },
            body: JSON.stringify(payload),
            timeout: 30000 // 30 segundos timeout
        });

        if (response.ok) {
            const data = await response.json();
            console.log('✅ [AGNO_AI] Resposta recebida');
            console.log('📦 [AGNO_AI] Dados completos:', JSON.stringify(data).substring(0, 500));

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

            console.log('📝 [AGNO_AI] Texto extraído:', responseText.substring(0, 200) + '...');

            return {
                success: true,
                response: responseText,
                session_id: data.session_id,
                metadata: {
                    agent_id: agentId,
                    run_id: data.run_id,
                    session_id: data.session_id,
                    model: data.model || data.model_provider,
                    tokens_used: data.tokens_used || data.metrics?.total_tokens,
                    timestamp: new Date().toISOString()
                }
            };
        } else {
            const errorData = await response.text();
            console.error('❌ [AGNO_AI] Erro na resposta:', response.status, errorData);

            // Se for 429 (rate limit), abrir circuit breaker e retornar fallback
            if (response.status === 429) {
                console.warn('⚠️ [AGNO_AI] Rate limit atingido - ativando circuit breaker');
                openCircuitBreaker(); // Bloquear novas chamadas por 1 minuto
                return {
                    success: true,
                    response: `🤖 **Diagnosticando seu problema...**\n\n` +
                        `Você mencionou: "${message}"\n\n` +
                        `💡 **Recomendações iniciais:**\n` +
                        `• Para problemas com barulhos, é importante verificar a fonte do som\n` +
                        `• Traga seu veículo para uma avaliação detalhada\n` +
                        `• Nossa equipe pode fazer um diagnóstico completo\n\n` +
                        `📞 **Contato:** (11) 1234-5678\n\n` +
                        `_Ou agende um horário digitando "agendar"_`,
                    tipo: 'diagnostico_fallback',
                    mode: 'local_fallback',
                    metadata: {
                        rate_limited: true,
                        status: 429,
                        timestamp: new Date().toISOString()
                    }
                };
            }

            throw new Error(`Agno AI retornou status ${response.status}: ${errorData}`);
        }
    } catch (error) {
        console.error('❌ [AGNO_AI] Erro ao comunicar:', error.message);
        
        // FALLBACK: Resposta local em caso de erro do Agno
        return {
            success: true,
            response: `🤖 **Assistente Matias temporariamente indisponível**\n\n` +
                `Sua mensagem: "${message}"\n\n` +
                `⚠️ Estamos processando muitas solicitações. Aguarde alguns instantes.\n\n` +
                `💡 **Enquanto isso, posso ajudar com:**\n` +
                `• Agendamentos (digite "agendar")\n` +
                `• Consulta de OS (digite "status da OS")\n` +
                `• Ver estoque (digite "tem peça X")\n` +
                `• Ajuda (digite "ajuda")`,
            tipo: 'error_fallback',
            mode: 'local_fallback',
            metadata: {
                agno_error: error.message,
                timestamp: new Date().toISOString()
            }
        };
    }
}

// ============================================================
// 🎉 NOVA ARQUITETURA MULTI-AGENTE INTEGRADA!
// 
// As funções existentes (processarConsultaOS, processarConsultaEstoque, etc)
// são reutilizadas. A nova arquitetura adiciona:
// - MessageClassifier (classifica mensagens)
// - AgendamentoLocal (agendamentos sem AI - 10x mais rápido)
// - LocalResponse (respostas instantâneas)
// - processarLocal/processarAcaoLocal (roteamento inteligente)
// - processarComAgnoAI (integração com Agno)
// ============================================================

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

        // Preparar payload JSON com parâmetros customizáveis
        const payload = {
            message: message,
            user_id: userId
        };

        if (session_id) {
            payload.session_id = session_id;
        }

        // Adicionar parâmetros customizados se fornecidos
        if (custom_params) {
            Object.assign(payload, custom_params);
        }

        const response = await fetch(`${AGNO_API_URL}/chat`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                ...(AGNO_API_TOKEN && { 'Authorization': `Bearer ${AGNO_API_TOKEN}` })
            },
            body: JSON.stringify(payload),
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

        // Payload JSON mais simples, sem user_id específico
        const payload = {
            message: message
        };

        const response = await fetch(`${AGNO_API_URL}/chat`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                ...(AGNO_API_TOKEN && { 'Authorization': `Bearer ${AGNO_API_TOKEN}` })
            },
            body: JSON.stringify(payload),
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

        const payload = {
            message: enhancedMessage,
            user_id: req.user?.id || req.user?.userId || 'ofix_user'
        };

        if (session_id) {
            payload.session_id = session_id;
        }

        const response = await fetch(`${AGNO_API_URL}/chat`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                ...(AGNO_API_TOKEN && { 'Authorization': `Bearer ${AGNO_API_TOKEN}` })
            },
            body: JSON.stringify(payload),
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

// ============================================================
// 🤖 FUNÇÕES AUXILIARES: AGNO AI
// ============================================================

/**
 * Acordar o serviço Agno (cold start no Render pode levar até 50s)
 */
async function warmAgnoService() {
    if (!AGNO_API_URL || AGNO_API_URL === 'http://localhost:8000') {
        return false;
    }

    // Evitar múltiplas tentativas simultâneas
    const now = Date.now();
    if (lastWarmingAttempt && (now - lastWarmingAttempt) < 60000) { // 1 minuto
        return agnoWarmed;
    }

    lastWarmingAttempt = now;

    try {
        console.log('🔥 Aquecendo serviço Agno...');
        
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 60000); // 60 segundos para warming
        
        const response = await fetch(`${AGNO_API_URL}/health`, {
            method: 'GET',
            signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        
        agnoWarmed = response.ok;
        
        if (agnoWarmed) {
            console.log('✅ Serviço Agno aquecido e pronto!');
        } else {
            console.log('⚠️ Serviço Agno respondeu mas não está healthy');
        }
        
        return agnoWarmed;
    } catch (error) {
        console.log('⚠️ Não foi possível aquecer o serviço Agno:', error.message);
        agnoWarmed = false;
        return false;
    }
}

async function chamarAgnoAI(message, usuario_id, intencao, nlp) {
    console.log('   🔌 Conectando com Agno AI...');

    // Tentar aquecer o serviço se não estiver warm
    if (!agnoWarmed) {
        console.log('   ⏳ Agno não está aquecido, tentando warming...');
        await warmAgnoService();
    }

    // Preparar contexto rico para o Agno
    const contexto = {
        intencao: intencao,
        entidades: nlp?.entidades || {},
        confianca: nlp?.confianca || 0,
        periodo: nlp?.periodo || null
    };

    // Tentar até 2 vezes (primeira pode falhar por cold start)
    let lastError;
    const maxRetries = 2;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        if (attempt > 1) {
            console.log(`   🔄 Tentativa ${attempt}/${maxRetries}...`);
        }

        // Implementar timeout manualmente (node-fetch não suporta timeout nativo)
        const controller = new AbortController();
        const timeoutMs = attempt === 1 ? 45000 : 30000; // Primeira tentativa: 45s (cold start), depois: 30s
        const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

        try {
            const agnoResponse = await fetch(`${AGNO_API_URL}/chat`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...(AGNO_API_TOKEN && { 'Authorization': `Bearer ${AGNO_API_TOKEN}` })
                },
                body: JSON.stringify({
                    message: message,
                    user_id: usuario_id || 'anonymous',
                    context: contexto
                }),
                signal: controller.signal
            });

            clearTimeout(timeoutId);

            if (!agnoResponse.ok) {
                throw new Error(`Agno retornou status ${agnoResponse.status}`);
            }

            const agnoData = await agnoResponse.json();
            const agnoContent = agnoData.response || agnoData.content || agnoData.message || 'Resposta do Agno';

            console.log('   ✅ Resposta do Agno recebida');
            agnoWarmed = true; // Marcar como aquecido após sucesso

            return {
                success: true,
                response: agnoContent,
                tipo: intencao.toLowerCase(),
                mode: 'production',
                agno_configured: true,
                metadata: {
                    intencao_detectada: intencao,
                    agno_response: true,
                    entidades: nlp?.entidades,
                    attempts: attempt,
                    ...agnoData
                }
            };
        } catch (error) {
            clearTimeout(timeoutId);
            lastError = error;

            if (error.name === 'AbortError') {
                console.log(`   ⏱️ Timeout na tentativa ${attempt} (${timeoutMs}ms)`);
                lastError = new Error(`timeout - Agno AI não respondeu em ${timeoutMs/1000}s (possível cold start)`);
            } else {
                console.log(`   ❌ Erro na tentativa ${attempt}:`, error.message);
            }

            // Se não for a última tentativa, aguardar um pouco antes de tentar novamente
            if (attempt < maxRetries) {
                await new Promise(resolve => setTimeout(resolve, 2000)); // 2 segundos
            }
        }
    }

    // Se chegou aqui, todas as tentativas falharam
    throw lastError;
}

export default router;