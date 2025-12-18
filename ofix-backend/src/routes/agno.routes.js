import express from 'express';
import fetch from 'node-fetch';
import jwt from 'jsonwebtoken';
import NodeCache from 'node-cache'; // Removido

import rateLimit from 'express-rate-limit';

// Importar serviÃ§os do Matias
import ConversasService from '../services/conversas.service.js';
import AgendamentosService from '../services/agendamentos.service.js';
import ConsultasOSService from '../services/consultasOS.service.js';
import NLPService from '../services/nlp.service.js';
import prisma from '../config/database.js';

// â­ NOVA ARQUITETURA MULTI-AGENTE (Nov 2025)
import MessageClassifier from '../services/message-classifier.service.js';
import AgendamentoLocal from '../services/agendamento-local.service.js';
import LocalResponse from '../services/local-response.service.js';
import CacheService from '../services/cache.service.js';

const router = express.Router();

// ConfiguraÃ§Ãµes do Agno (pode vir de variÃ¡veis de ambiente)
const AGNO_API_URL = process.env.AGNO_API_URL || 'http://localhost:8001';
const AGNO_API_TOKEN = process.env.AGNO_API_TOKEN || '';

// ðŸ’¾ CACHE DE RESPOSTAS - Reduz 60% das chamadas Ã  API (1h de TTL)
// Cache gerenciado via CacheService (Redis)

// â° WARM-UP INTELIGENTE - Rastrear Ãºltima atividade
let agnoWarmed = false;
let lastWarmingAttempt = null;
let lastActivity = Date.now();

// âš¡ CIRCUIT BREAKER para Rate Limit (429)
let circuitBreakerOpen = false;
let circuitBreakerOpenUntil = null;
const CIRCUIT_BREAKER_COOLDOWN = 300000; // 5 minutos de cooldown apÃ³s 429 (Render free tier)

function checkCircuitBreaker() {
    if (circuitBreakerOpen) {
        const now = Date.now();
        if (now < circuitBreakerOpenUntil) {
            const remainingSeconds = Math.ceil((circuitBreakerOpenUntil - now) / 1000);
            console.log(`ðŸš« [CIRCUIT BREAKER] Agno AI bloqueado por ${remainingSeconds}s (rate limit)`);
            return false; // Bloqueado
        } else {
            // Cooldown expirou, resetar
            console.log('âœ… [CIRCUIT BREAKER] Cooldown expirado, reativando Agno AI');
            circuitBreakerOpen = false;
            circuitBreakerOpenUntil = null;
        }
    }
    return true; // Permitido
}

function openCircuitBreaker() {
    circuitBreakerOpen = true;
    circuitBreakerOpenUntil = Date.now() + CIRCUIT_BREAKER_COOLDOWN;
    console.log(`ðŸš« [CIRCUIT BREAKER] Agno AI bloqueado por ${CIRCUIT_BREAKER_COOLDOWN / 1000}s (rate limit detectado)`);
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

// Endpoint pÃºblico para verificar configuraÃ§Ã£o do Agno
router.get('/config', async (req, res) => {
    try {
        console.log('ðŸ”§ Verificando configuraÃ§Ã£o do Agno...');

        const memoryEnabled = process.env.AGNO_ENABLE_MEMORY === 'true' && AGNO_API_URL !== 'http://localhost:8000';

        res.json({
            configured: !!AGNO_API_URL && AGNO_API_URL !== 'http://localhost:8000',
            agno_url: AGNO_API_URL,
            has_token: !!AGNO_API_TOKEN,
            agent_id: process.env.AGNO_DEFAULT_AGENT_ID || 'matias',
            warmed: agnoWarmed,
            memory_enabled: memoryEnabled, // â† NOVO: indica se memÃ³ria estÃ¡ ativa
            last_warming: lastWarmingAttempt ? new Date(lastWarmingAttempt).toISOString() : null,
            timestamp: new Date().toISOString(),
            status: AGNO_API_URL === 'http://localhost:8000' ? 'development' : 'production'
        });
    } catch (error) {
        console.error('âŒ Erro ao verificar configuraÃ§Ã£o:', error.message);
        res.status(500).json({
            error: 'Erro ao verificar configuraÃ§Ã£o',
            message: error.message
        });
    }
});

// Endpoint para aquecer o serviÃ§o Agno (Ãºtil para evitar cold starts)
router.post('/warm', async (req, res) => {
    try {
        console.log('ðŸ”¥ RequisiÃ§Ã£o de warming do Agno...');

        const success = await warmAgnoService();

        res.json({
            success: success,
            warmed: agnoWarmed,
            agno_url: AGNO_API_URL,
            message: success ? 'ServiÃ§o Agno aquecido com sucesso' : 'Falha ao aquecer serviÃ§o Agno',
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('âŒ Erro ao aquecer Agno:', error.message);
        res.status(500).json({
            success: false,
            error: 'Erro ao aquecer serviÃ§o',
            message: error.message
        });
    }
});

// ðŸ”’ RATE LIMITER para endpoints pÃºblicos (previne abuso)
const publicLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutos
    max: 20, // 20 requests por IP
    message: {
        error: 'Muitas requisiÃ§Ãµes deste IP',
        retry_after: '15 minutos'
    },
    standardHeaders: true,
    legacyHeaders: false,
    // ConfiguraÃ§Ã£o para contar requests corretamente
    keyGenerator: (req) => {
        // Em produÃ§Ã£o, usa X-Forwarded-For; em local, usa IP real
        const ip = req.headers['x-forwarded-for']?.split(',')[0] ||
            req.ip ||
            req.connection.remoteAddress;
        console.log(`ðŸ”’ [RATE-LIMIT] Request de IP: ${ip}`);
        return ip;
    },
    handler: (req, res) => {
        console.log(`â›” [RATE-LIMIT] Bloqueado IP: ${req.ip}`);
        res.status(429).json({
            error: 'Muitas requisiÃ§Ãµes deste IP',
            retry_after: '15 minutos'
        });
    }
});

// Endpoint pÃºblico para testar chat SEM AUTENTICAÃ‡ÃƒO (com rate limit e cache)
router.post('/chat-public', publicLimiter, validateMessage, async (req, res) => {
    try {
        const { message } = req.body;

        console.log('ðŸ§ª Teste pÃºblico do chat - ConfiguraÃ§Ã£o:', {
            agno_url: AGNO_API_URL,
            configured: AGNO_API_URL !== 'http://localhost:8000',
            message: message.substring(0, 50) + '...'
        });

        // Se nÃ£o estÃ¡ configurado, retornar resposta de demonstraÃ§Ã£o
        if (AGNO_API_URL === 'http://localhost:8000') {
            return res.json({
                success: true,
                response: `ðŸ¤– **Modo DemonstraÃ§Ã£o Ativado**\n\nVocÃª disse: "${message}"\n\nðŸ“‹ **Status**: Agente Matias nÃ£o configurado no ambiente de produÃ§Ã£o.\n\nâš™ï¸ **ConfiguraÃ§Ã£o necessÃ¡ria no Render:**\n- AGNO_API_URL=https://matias-agno-assistant.onrender.com\n- AGNO_DEFAULT_AGENT_ID=matias\n\nðŸ’¡ ApÃ³s configurar, o assistente conectarÃ¡ com seu agente real!`,
                mode: 'demo',
                agno_configured: false
            });
        }

        // Usar processarComAgnoAI para se beneficiar do cache
        console.log('ðŸ”Œ Processando com cache habilitado...');

        try {
            const result = await processarComAgnoAI(message, 'test_user', 'matias', null);

            const responseText = result.response || result.content || result.message || 'Resposta do agente Matias';

            console.log(`âœ… Sucesso na comunicaÃ§Ã£o com Agno ${result.from_cache ? '(CACHE)' : '(API)'}`);

            res.json({
                success: true,
                response: responseText,
                mode: 'production',
                agno_configured: true,
                from_cache: result.from_cache || false,
                metadata: result
            });
        } catch (agnoError) {
            console.error('âŒ Erro ao conectar com Agno:', agnoError.message);

            // FALLBACK: Resposta inteligente baseada na mensagem
            let fallbackResponse;
            const msgLower = message.toLowerCase();

            if (msgLower.includes('serviÃ§o') || msgLower.includes('problema') || msgLower.includes('carro')) {
                fallbackResponse = `ðŸ”§ **Assistente OFIX**\n\nVocÃª mencionou: "${message}"\n\n**Posso ajudar com:**\nâ€¢ DiagnÃ³stico de problemas automotivos\nâ€¢ InformaÃ§Ãµes sobre serviÃ§os\nâ€¢ Consulta de peÃ§as\nâ€¢ Agendamento de manutenÃ§Ã£o\n\n*âš ï¸ Agente Matias temporariamente indisponÃ­vel. Respondendo em modo local.*`;
            } else if (msgLower.includes('preÃ§o') || msgLower.includes('valor') || msgLower.includes('custo')) {
                fallbackResponse = `ðŸ’° **Consulta de PreÃ§os**\n\nPara "${message}":\n\n**ServiÃ§os populares:**\nâ€¢ Troca de Ã³leo: R$ 80-120\nâ€¢ RevisÃ£o completa: R$ 200-400\nâ€¢ DiagnÃ³stico: R$ 50-100\n\n*ðŸ’¡ Para valores exatos, consulte nossa equipe.*`;
            } else {
                fallbackResponse = `ðŸ¤– **OFIX Assistant**\n\nOlÃ¡! VocÃª disse: "${message}"\n\n**Como posso ajudar:**\nâ€¢ Problemas no veÃ­culo\nâ€¢ InformaÃ§Ãµes sobre serviÃ§os\nâ€¢ Consultas de peÃ§as\nâ€¢ Agendamentos\n\n*ðŸ”„ Tentando reconectar com agente principal...*`;
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
        console.error('âŒ Erro geral no teste pÃºblico:', mainError.message);
        res.status(500).json({
            error: 'Erro interno',
            message: mainError.message,
            agno_url: AGNO_API_URL
        });
    }
});

// ============================================================
// ðŸ¤– CHAT INTELIGENTE - PROCESSAMENTO DE LINGUAGEM NATURAL
// ============================================================

router.post('/chat-inteligente', validateMessage, async (req, res) => {
    try {
        const { message, usuario_id, contexto_ativo } = req.body;

        if (!message) {
            return res.status(400).json({
                success: false,
                error: 'Mensagem Ã© obrigatÃ³ria'
            });
        }

        console.log('ðŸ’¬ [CHAT-INTELIGENTE] Nova mensagem:', message.substring(0, 80) + '...');
        console.log('ðŸŽ¯ Usuario ID:', usuario_id);
        console.log('ðŸŽ¯ Contexto ativo:', contexto_ativo);

        // â­ NOVA ARQUITETURA: Usar MessageClassifier
        const classification = MessageClassifier.classify(message);
        console.log('ðŸŽ¯ [CLASSIFIER] Resultado:', {
            processor: classification.processor,
            type: classification.type,
            subtype: classification.subtype,
            confidence: classification.confidence
        });

        // 2ï¸âƒ£ ROTEAMENTO INTELIGENTE
        let responseData;
        const startTime = Date.now();

        if (classification.processor === 'BACKEND_LOCAL') {
            // âš¡ PROCESSA LOCALMENTE (rÃ¡pido, confiÃ¡vel)
            console.log('âš¡ [BACKEND_LOCAL] Processando localmente...');

            responseData = await processarLocal(message, classification, usuario_id, contexto_ativo, req);

            const duration = Date.now() - startTime;
            console.log(`âœ… [BACKEND_LOCAL] Processado em ${duration}ms`);

            // Adiciona metadata
            responseData.metadata = {
                ...responseData.metadata,
                processed_by: 'BACKEND_LOCAL',
                processing_time_ms: duration,
                classification: classification
            };

        } else {
            // ðŸ§  ENVIA PARA AGNO AI (inteligente, conversacional)
            console.log('ðŸ§  [AGNO_AI] Enviando para Agno AI...');

            try {
                responseData = await processarComAgnoAI(message, usuario_id, 'matias', null);

                const duration = Date.now() - startTime;
                console.log(`âœ… [AGNO_AI] Processado em ${duration}ms`);

                // Adiciona metadata
                if (responseData.metadata) {
                    responseData.metadata.processed_by = 'AGNO_AI';
                    responseData.metadata.processing_time_ms = duration;
                    responseData.metadata.classification = classification;
                }
            } catch (agnoError) {
                const isTimeout = agnoError.message.includes('timeout') || agnoError.message.includes('429');
                const errorType = isTimeout ? 'â±ï¸ Timeout/Rate Limit' : 'âŒ Erro';
                console.error(`   âš ï¸ Agno falhou (${errorType}), usando fallback:`, agnoError.message);

                // Fallback para resposta local baseado no subtipo
                const duration = Date.now() - startTime;

                if (classification.subtype === 'ORCAMENTO' || classification.subtype === 'CONSULTA_PRECO') {
                    responseData = {
                        success: true,
                        response: `ðŸ’° **Consulta de PreÃ§o**\n\n${isTimeout ? 'âš ï¸ _O assistente estÃ¡ temporariamente indisponÃ­vel._\n\n' : ''}Para fornecer um orÃ§amento preciso, preciso de algumas informaÃ§Ãµes:\n\nâ€¢ Qual Ã© o modelo do veÃ­culo?\nâ€¢ Qual ano?\n\nOs valores variam dependendo do veÃ­culo. Entre em contato para um orÃ§amento personalizado!\n\nðŸ“ž **Contato:** (11) 1234-5678`,
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
                    // Fallback genÃ©rico
                    responseData = {
                        success: true,
                        response: `OlÃ¡! ðŸ‘‹\n\n${isTimeout ? 'âš ï¸ _O assistente avanÃ§ado estÃ¡ temporariamente indisponÃ­vel._\n\n' : ''}Como posso ajudar vocÃª hoje?\n\nâ€¢ Agendar um serviÃ§o\nâ€¢ Consultar ordem de serviÃ§o\nâ€¢ Ver peÃ§as em estoque\nâ€¢ Cadastrar cliente\nâ€¢ Ver estatÃ­sticas\n\nDigite sua solicitaÃ§Ã£o!`,
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

        // 3ï¸âƒ£ SALVAR CONVERSA NO BANCO
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
                console.log('âœ… Mensagem salva no histÃ³rico');
            }
        } catch (saveError) {
            console.error('âš ï¸ Erro ao salvar conversa (nÃ£o crÃ­tico):', saveError.message);
        }

        // 4ï¸âƒ£ RETORNAR RESPOSTA
        return res.json({
            success: true,
            ...responseData
        });

    } catch (error) {
        console.error('âŒ Erro no chat inteligente:', error);
        return res.status(500).json({
            success: false,
            error: 'Erro ao processar mensagem',
            message: error.message
        });
    }
});

// ============================================================
// ðŸ“œ HISTÃ“RICO DE CONVERSAS
// ============================================================

router.get('/historico-conversa', async (req, res) => {
    try {
        const { usuario_id } = req.query;

        if (!usuario_id) {
            return res.status(400).json({
                success: false,
                error: 'usuario_id Ã© obrigatÃ³rio'
            });
        }

        console.log('ðŸ“œ Buscando histÃ³rico para usuÃ¡rio:', usuario_id);

        // Converter UUID para Int para busca
        const usuarioIdInt = parseInt(usuario_id.replace(/-/g, '').substring(0, 9), 16) % 2147483647;

        // Buscar conversa mais recente do usuÃ¡rio
        const conversa = await prisma.conversaMatias.findFirst({
            where: { userId: usuarioIdInt },
            orderBy: { createdAt: 'desc' },
            include: {
                mensagens: {
                    orderBy: { createdAt: 'asc' },
                    take: 50 // Ãšltimas 50 mensagens
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

        console.log(`âœ… HistÃ³rico retornado: ${mensagensFormatadas.length} mensagens`);

        res.json({
            success: true,
            mensagens: mensagensFormatadas,
            total: mensagensFormatadas.length,
            conversa_id: conversa.id
        });

    } catch (error) {
        console.error('âŒ Erro ao buscar histÃ³rico:', error);
        res.status(500).json({
            success: false,
            error: 'Erro ao buscar histÃ³rico',
            message: error.message
        });
    }
});

// ============================================================================
// ðŸ“… FUNÃ‡ÃƒO: PROCESSAR AGENDAMENTO
// ============================================================================

async function processarAgendamento(mensagem, usuario_id, cliente_selecionado = null) {
    try {
        console.log('ðŸ” DEBUG AGENDAMENTO:');
        console.log('   - Mensagem recebida:', mensagem);
        console.log('   - Usuario ID:', usuario_id);
        console.log('   - Cliente selecionado:', cliente_selecionado);

        // VerificaÃ§Ã£o especÃ­fica para quando cliente estÃ¡ selecionado e mensagem Ã© "agendar"
        const mensagemNormalizada = mensagem ? mensagem.trim().toLowerCase() : '';
        console.log('   - Mensagem normalizada:', mensagemNormalizada);

        if (cliente_selecionado && (mensagemNormalizada === 'agendar' || mensagemNormalizada === 'agende' || mensagemNormalizada === 'agendar serviÃ§o')) {
            console.log('   âœ… Cliente selecionado e mensagem de agendamento detectada');
            return {
                success: false,
                response: `ðŸ“‹ **Agendamento para ${cliente_selecionado.nomeCompleto}**\n\n` +
                    `ðŸ’¡ **Me informe os dados restantes:**\n\n` +
                    `â€¢ **ServiÃ§o:** Tipo de manutenÃ§Ã£o (revisÃ£o, troca de Ã³leo, etc)\n` +
                    `â€¢ **Dia:** Dia da semana ou data (segunda, terÃ§a, 20/10)\n` +
                    `â€¢ **HorÃ¡rio:** Hora desejada (14h, 16:00)\n\n` +
                    `**Exemplo:**\n` +
                    `"RevisÃ£o na segunda Ã s 14h" ou "Troca de Ã³leo amanhÃ£ Ã s 10h"`,
                tipo: 'pergunta',
                cliente_selecionado: cliente_selecionado,
                faltando: [
                    'â€¢ **ServiÃ§o:** Tipo de manutenÃ§Ã£o (revisÃ£o, troca de Ã³leo, etc)',
                    'â€¢ **Dia:** Dia da semana ou data (segunda, terÃ§a, 20/10)',
                    'â€¢ **HorÃ¡rio:** Hora desejada (14h, 16:00)'
                ]
            };
        }

        // 0. BUSCAR OFICINA DO USUÃRIO
        let oficinaId = null;
        if (usuario_id) {
            const usuario = await prisma.user.findUnique({
                where: { id: String(usuario_id) }, // USER ID Ã‰ STRING (UUID)
                select: { oficinaId: true }
            });
            oficinaId = usuario?.oficinaId;
            console.log('   ðŸ¢ Oficina ID:', oficinaId);
        }

        // 1. EXTRAIR ENTIDADES
        const entidades = NLPService.extrairEntidadesAgendamento(mensagem);
        console.log('   ðŸ“‹ Entidades:', JSON.stringify(entidades, null, 2));

        // 2. VALIDAR DADOS NECESSÃRIOS
        // SE HOUVER CLIENTE SELECIONADO, NÃƒO VALIDAR A NECESSIDADE DO CLIENTE
        let validacao;
        if (cliente_selecionado) {
            // Quando o cliente jÃ¡ estÃ¡ selecionado e a mensagem Ã© apenas "agendar",
            // retornar uma resposta personalizada pedindo apenas os dados restantes
            if (mensagem.trim().toLowerCase() === 'agendar') {
                return {
                    success: false,
                    response: `ðŸ“‹ **Agendamento para ${cliente_selecionado.nomeCompleto}**\n\n` +
                        `ðŸ’¡ **Me informe os dados restantes:**\n\n` +
                        `â€¢ **ServiÃ§o:** Tipo de manutenÃ§Ã£o (revisÃ£o, troca de Ã³leo, etc)\n` +
                        `â€¢ **Dia:** Dia da semana ou data (segunda, terÃ§a, 20/10)\n` +
                        `â€¢ **HorÃ¡rio:** Hora desejada (14h, 16:00)\n\n` +
                        `**Exemplo:**\n` +
                        `"RevisÃ£o na segunda Ã s 14h" ou "Troca de Ã³leo amanhÃ£ Ã s 10h"`,
                    tipo: 'pergunta',
                    cliente_selecionado: cliente_selecionado,
                    faltando: [
                        'â€¢ **ServiÃ§o:** Tipo de manutenÃ§Ã£o (revisÃ£o, troca de Ã³leo, etc)',
                        'â€¢ **Dia:** Dia da semana ou data (segunda, terÃ§a, 20/10)',
                        'â€¢ **HorÃ¡rio:** Hora desejada (14h, 16:00)'
                    ]
                };
            }

            // Criar validaÃ§Ã£o personalizada que ignora a falta de cliente
            const entidadesObrigatorias = ['servico', 'dia', 'hora'];
            const faltando = [];

            if (!entidades.servico) faltando.push('â€¢ **ServiÃ§o:** Tipo de manutenÃ§Ã£o (revisÃ£o, troca de Ã³leo, etc)');
            if (!entidades.diaSemana && !entidades.dataEspecifica) faltando.push('â€¢ **Dia:** Dia da semana ou data (segunda, terÃ§a, 20/10)');
            if (!entidades.hora) faltando.push('â€¢ **HorÃ¡rio:** Hora desejada (14h, 16:00)');

            // NÃ£o exigir veÃ­culo pois podemos usar o veÃ­culo do cliente selecionado
            // ou pedir para selecionar um dos veÃ­culos do cliente
            validacao = {
                valido: faltando.length === 0,
                faltando: faltando
            };
        } else {
            validacao = NLPService.validarDadosAgendamento(entidades);
        }

        if (!validacao.valido) {
            // Mensagem personalizada baseada no que estÃ¡ faltando
            let mensagemAjuda = 'ðŸ“‹ **Vamos fazer seu agendamento!**\n\n';

            if (cliente_selecionado) {
                // O cliente jÃ¡ estÃ¡ selecionado, mostrar mensagem personalizada
                mensagemAjuda += `**Cliente selecionado:** ${cliente_selecionado.nomeCompleto}\n\n`;
                mensagemAjuda += 'ðŸ’¡ **Me informe os dados restantes:**\n\n';
                mensagemAjuda += validacao.faltando.join('\n');
                mensagemAjuda += '\n\n**Exemplo:**\n';
                mensagemAjuda += '"Agendar revisÃ£o na segunda Ã s 14h" ou "Troca de Ã³leo amanhÃ£ Ã s 10h"';
            } else if (validacao.faltando.length === 4 || validacao.faltando.length === 5) {
                // EstÃ¡ faltando quase tudo - dar exemplo completo
                mensagemAjuda += 'ðŸ’¡ **Me informe os seguintes dados:**\n\n';
                mensagemAjuda += 'â€¢ **Cliente:** Nome do cliente\n';
                mensagemAjuda += 'â€¢ **VeÃ­culo:** Modelo ou placa\n';
                mensagemAjuda += 'â€¢ **ServiÃ§o:** Tipo de manutenÃ§Ã£o (revisÃ£o, troca de Ã³leo, etc)\n';
                mensagemAjuda += 'â€¢ **Dia:** Dia da semana ou data (segunda, terÃ§a, 20/10)\n';
                mensagemAjuda += 'â€¢ **HorÃ¡rio:** Hora desejada (14h, 16:00)\n\n';
                mensagemAjuda += '**Exemplo:**\n';
                mensagemAjuda += '"Agendar revisÃ£o para o Gol do JoÃ£o na segunda Ã s 14h"';
            } else {
                // EstÃ¡ faltando apenas alguns dados - ser especÃ­fico
                mensagemAjuda += '**InformaÃ§Ãµes que ainda preciso:**\n\n';
                mensagemAjuda += validacao.faltando.map((item, i) => `${i + 1}. ${item}`).join('\n');
                mensagemAjuda += '\n\n**Exemplo:**\n';

                // Gerar exemplo baseado no que jÃ¡ tem
                const partes = [];
                if (entidades.servico) partes.push(entidades.servico);
                else partes.push('revisÃ£o');

                if (cliente_selecionado) {
                    partes.push(`para o cliente ${cliente_selecionado.nomeCompleto}`);
                } else if (entidades.veiculo) {
                    partes.push(`para o ${entidades.veiculo}`);
                } else if (entidades.cliente) {
                    partes.push(`para o cliente ${entidades.cliente}`);
                } else {
                    partes.push('para o Gol do JoÃ£o');
                }

                if (entidades.diaSemana || entidades.dataEspecifica) {
                    partes.push(entidades.diaTexto || new Date(entidades.dataEspecifica).toLocaleDateString('pt-BR'));
                } else {
                    partes.push('na segunda');
                }

                if (entidades.hora) partes.push(`Ã s ${entidades.hora}`);
                else partes.push('Ã s 14h');

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

        // Se houver um cliente selecionado previamente, usÃ¡-lo
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

            // Adicionar filtro de oficina se disponÃ­vel
            if (oficinaId) {
                whereClause.oficinaId = oficinaId; // CAMPO Ã‰ oficinaId (camelCase)
            }

            cliente = await prisma.cliente.findFirst({
                where: whereClause,
                include: {
                    veiculos: true
                }
            });

            // Se nÃ£o encontrou, buscar clientes similares para sugestÃ£o (FILTRADO POR OFICINA)
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
                        whereSugestoes.oficinaId = oficinaId; // CAMPO Ã‰ oficinaId (camelCase)
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

        // Se nÃ£o encontrou cliente, mostrar sugestÃµes ou listar todos
        if (!cliente) {
            if (clientesSugeridos.length > 0) {
                // Formatar opÃ§Ãµes para seleÃ§Ã£o no frontend
                const options = clientesSugeridos.map((c) => ({
                    id: c.id,
                    label: c.nomeCompleto,
                    subtitle: c.telefone || 'Sem telefone',
                    details: c.veiculos.length > 0
                        ? [`ðŸš— ${c.veiculos.map(v => `${v.marca} ${v.modelo}`).join(', ')}`]
                        : ['Sem veÃ­culos cadastrados'],
                    value: `Buscar cliente ${c.nomeCompleto}` // Mensagem que serÃ¡ enviada ao selecionar
                }));

                return {
                    success: false,
                    response: `ðŸ” **Encontrei ${clientesSugeridos.length} clientes com nome similar a "${entidades.cliente}"**\n\nEscolha o cliente correto abaixo:`,
                    tipo: 'multiplos',
                    metadata: {
                        options: options,
                        selectionTitle: 'Clientes encontrados:'
                    }
                };
            }

            // Se nÃ£o tem sugestÃµes, listar alguns clientes recentes (FILTRADO POR OFICINA)
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

            console.log('   ðŸ“‹ Clientes recentes encontrados:', clientesRecentes.length);
            console.log('   ðŸ¢ Filtrado por oficinaId:', oficinaId || 'SEM FILTRO');

            if (clientesRecentes.length > 0) {
                return {
                    success: false,
                    response: `âŒ **Cliente nÃ£o encontrado**\n\n${entidades.cliente ? `NÃ£o encontrei "${entidades.cliente}" no sistema.` : 'Nenhum cliente especificado.'}\n\n**Clientes recentes cadastrados:**\n${clientesRecentes.map((c, i) => `${i + 1}. ${c.nomeCompleto}${c.veiculos.length > 0 ? `\n   ðŸš— ${c.veiculos.map(v => `${v.marca} ${v.modelo}`).join(', ')}` : ''}`).join('\n\n')}\n\nðŸ’¡ **OpÃ§Ãµes:**\nâ€¢ Digite o nome completo do cliente\nâ€¢ Ou cadastre um novo cliente primeiro`,
                    tipo: 'erro',
                    clientes_disponiveis: clientesRecentes
                };
            }

            return {
                success: false,
                response: `âŒ **Nenhum cliente cadastrado**\n\n${entidades.cliente ? `NÃ£o encontrei "${entidades.cliente}".` : ''}\n\nðŸ’¡ **Ã‰ necessÃ¡rio cadastrar o cliente primeiro:**\n1. Acesse "Clientes" no menu\n2. Clique em "Novo Cliente"\n3. Preencha os dados\n4. Depois volte aqui para agendar`,
                tipo: 'erro'
            };
        }

        // 4. BUSCAR VEÃCULO (com busca inteligente)
        let veiculo = null;

        if (entidades.placa) {
            // Busca por placa (mais precisa)
            veiculo = cliente.veiculos.find(v => v.placa === entidades.placa);
        } else if (entidades.veiculo) {
            // Busca por modelo (pode ter mÃºltiplos)
            const veiculosEncontrados = cliente.veiculos.filter(v =>
                v.modelo.toLowerCase().includes(entidades.veiculo.toLowerCase()) ||
                v.marca.toLowerCase().includes(entidades.veiculo.toLowerCase())
            );

            if (veiculosEncontrados.length === 1) {
                veiculo = veiculosEncontrados[0];
            } else if (veiculosEncontrados.length > 1) {
                // Formatar opÃ§Ãµes para seleÃ§Ã£o no frontend
                const options = veiculosEncontrados.map((v) => ({
                    id: v.id,
                    label: `${v.marca} ${v.modelo} ${v.anoModelo || ''}`,
                    subtitle: `Placa: ${v.placa}`,
                    details: v.cor ? [`Cor: ${v.cor}`] : [],
                    value: `Agendar para o veÃ­culo ${v.placa}` // Mensagem que serÃ¡ enviada
                }));

                return {
                    success: false,
                    response: `ðŸš— **Encontrei ${veiculosEncontrados.length} veÃ­culos "${entidades.veiculo}" para ${cliente.nomeCompleto}**\n\nEscolha o veÃ­culo correto abaixo:`,
                    tipo: 'multiplos',
                    metadata: {
                        options: options,
                        selectionTitle: 'VeÃ­culos do cliente:'
                    }
                };
            }
        }

        // Se nÃ£o encontrou e o cliente tem veÃ­culos, listar para escolha
        if (!veiculo && cliente.veiculos.length > 0) {
            // Se tem apenas 1 veÃ­culo, usar automaticamente
            if (cliente.veiculos.length === 1) {
                veiculo = cliente.veiculos[0];
                console.log(`   âœ… Ãšnico veÃ­culo do cliente selecionado automaticamente: ${veiculo.marca} ${veiculo.modelo}`);
            } else {
                // Formatar opÃ§Ãµes para seleÃ§Ã£o no frontend
                const options = cliente.veiculos.map((v) => ({
                    id: v.id,
                    label: `${v.marca} ${v.modelo} ${v.anoModelo || ''}`,
                    subtitle: `Placa: ${v.placa}`,
                    details: v.cor ? [`Cor: ${v.cor}`] : [],
                    value: `Agendar para o veÃ­culo ${v.placa} do cliente ${cliente.nomeCompleto}`
                }));

                return {
                    success: false,
                    response: `ðŸš— **${entidades.veiculo ? `VeÃ­culo "${entidades.veiculo}" nÃ£o encontrado.` : 'Qual veÃ­culo deseja agendar?'}**\n\n**Cliente:** ${cliente.nomeCompleto}\n\nEscolha o veÃ­culo abaixo:`,
                    tipo: 'pergunta',
                    metadata: {
                        options: options,
                        selectionTitle: 'VeÃ­culos disponÃ­veis:'
                    },
                    opcoes: cliente.veiculos
                };
            }
        }

        if (!veiculo) {
            return {
                success: false,
                response: `âŒ **Nenhum veÃ­culo cadastrado**\n\n**Cliente:** ${cliente.nomeCompleto}\n\nðŸ’¡ **Ã‰ necessÃ¡rio cadastrar um veÃ­culo primeiro:**\n1. Acesse "Clientes" no menu\n2. Selecione "${cliente.nomeCompleto}"\n3. Adicione um veÃ­culo\n4. Depois volte aqui para agendar`,
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
                response: 'ðŸ“… **Qual dia deseja agendar?**\n\nExemplos: "segunda", "terÃ§a", "20/10"',
                tipo: 'pergunta'
            };
        }

        const dataHora = new Date(`${dataAgendamento}T${entidades.hora}:00`);

        // Validar se a data nÃ£o estÃ¡ no passado
        if (dataHora < new Date()) {
            return {
                success: false,
                response: `âŒ **Data invÃ¡lida**\n\nA data ${NLPService.formatarDataAmigavel(dataAgendamento)} Ã s ${entidades.hora} jÃ¡ passou.\n\nðŸ’¡ Escolha uma data futura.`,
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
                response: `â° **HorÃ¡rio ocupado**\n\n${NLPService.formatarDataAmigavel(dataAgendamento)} Ã s ${entidades.hora} jÃ¡ estÃ¡ reservado para ${conflito.cliente.nomeCompleto}.\n\n**HorÃ¡rios disponÃ­veis no mesmo dia:**\nâ€¢ 08:00\nâ€¢ 10:00\nâ€¢ 14:00\nâ€¢ 16:00\n\nðŸ’¡ Qual horÃ¡rio prefere?`,
                tipo: 'conflito',
                horarios_disponiveis: ['08:00', '10:00', '14:00', '16:00']
            };
        }

        // 7. CRIAR AGENDAMENTO! âœ…
        const agendamento = await AgendamentosService.criarAgendamento({
            clienteId: cliente.id,
            veiculoId: veiculo.id,
            tipoServico: entidades.servico || 'ServiÃ§o Geral',
            dataHora: dataHora,
            descricao: `Agendamento via IA: ${mensagem}`,
            status: 'AGENDADO'
        });

        // 8. CONFIRMAR COM DETALHES
        const dataFormatada = NLPService.formatarDataAmigavel(dataAgendamento);

        return {
            success: true,
            response: `âœ… **Agendamento Confirmado!**\n\nðŸ“‹ **Protocolo:** #${agendamento.id}\n\nðŸ‘¤ **Cliente:** ${cliente.nomeCompleto}\nðŸ“ž **Telefone:** ${cliente.telefone || 'NÃ£o cadastrado'}\n\nðŸš— **VeÃ­culo:** ${veiculo.marca} ${veiculo.modelo}\nðŸ”– **Placa:** ${veiculo.placa}${veiculo.cor ? `\nðŸŽ¨ **Cor:** ${veiculo.cor}` : ''}\n\nðŸ“… **Data:** ${dataFormatada}\nâ° **HorÃ¡rio:** ${entidades.hora}\nðŸ”§ **ServiÃ§o:** ${entidades.servico || 'ServiÃ§o Geral'}\n\n${entidades.urgente ? 'ðŸš¨ **Urgente** - Priorizado\n\n' : ''}ðŸ’¬ ${cliente.nomeCompleto.split(' ')[0]} receberÃ¡ confirmaÃ§Ã£o por WhatsApp.`,
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
        console.error('âŒ Erro em processarAgendamento:', error);
        return {
            success: false,
            response: `âŒ **Erro ao processar agendamento**\n\n${error.message}\n\nðŸ’¡ Por favor, tente novamente ou contate o suporte.`,
            tipo: 'erro'
        };
    }
}

// ============================================================================
// ðŸ” FUNÃ‡ÃƒO: PROCESSAR CONSULTA OS
// ============================================================================

async function processarConsultaOS(mensagem) {
    try {
        const dados = NLPService.extrairDadosConsultaOS(mensagem);
        console.log('   ðŸ” Dados para consulta OS:', dados);

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

        const ordensServico = await prisma.servico.findMany({
            where,
            include: {
                cliente: true,
                veiculo: true
            },
            orderBy: {
                dataEntrada: 'desc'
            },
            take: 10
        });

        if (ordensServico.length === 0) {
            return {
                success: false,
                response: 'ðŸ” **Nenhuma ordem de serviÃ§o encontrada**\n\nðŸ’¡ Verifique os dados e tente novamente.',
                tipo: 'vazio'
            };
        }

        const lista = ordensServico.map((os, i) =>
            `${i + 1}. **OS #${os.id}** - ${os.cliente.nomeCompleto}\n   ðŸš— ${os.veiculo.marca} ${os.veiculo.modelo} (${os.veiculo.placa})\n   ðŸ“Š Status: ${os.status}\n   ðŸ“… Abertura: ${new Date(os.dataAbertura).toLocaleDateString('pt-BR')}`
        ).join('\n\n');

        return {
            success: true,
            response: `ðŸ” **Ordens de ServiÃ§o Encontradas** (${ordensServico.length})\n\n${lista}`,
            tipo: 'lista',
            total: ordensServico.length,
            ordensServico
        };

    } catch (error) {
        console.error('âŒ Erro em processarConsultaOS:', error);
        return {
            success: false,
            response: 'âŒ Erro ao consultar ordens de serviÃ§o',
            tipo: 'erro'
        };
    }
}

// ============================================================================
// ðŸ“¦ FUNÃ‡ÃƒO: PROCESSAR CONSULTA ESTOQUE
// ============================================================================

async function processarConsultaEstoque(mensagem) {
    try {
        // Implementar lÃ³gica de consulta de estoque
        return {
            success: true,
            response: 'ðŸ“¦ **Consulta de Estoque**\n\nFuncionalidade em desenvolvimento.',
            tipo: 'info'
        };
    } catch (error) {
        return {
            success: false,
            response: 'âŒ Erro ao consultar estoque',
            tipo: 'erro'
        };
    }
}

// ============================================================================
// ðŸ“Š FUNÃ‡ÃƒO: PROCESSAR ESTATÃSTICAS
// ============================================================================

async function processarEstatisticas(mensagem) {
    try {
        const stats = await ConsultasOSService.obterResumoOfficina('hoje');

        return {
            success: true,
            response: `ðŸ“Š **EstatÃ­sticas de Hoje**\n\nâ€¢ **Ordens de ServiÃ§o:** ${stats.total_os || 0}\nâ€¢ **Agendamentos:** ${stats.agendamentos || 0}\nâ€¢ **Clientes Atendidos:** ${stats.clientes || 0}\nâ€¢ **Receita:** R$ ${(stats.receita || 0).toFixed(2)}`,
            tipo: 'estatisticas',
            stats
        };
    } catch (error) {
        console.error('âŒ Erro em processarEstatisticas:', error);
        return {
            success: false,
            response: 'âŒ Erro ao buscar estatÃ­sticas',
            tipo: 'erro'
        };
    }
}

// ============================================================================
// ðŸ‘¤ FUNÃ‡ÃƒO: PROCESSAR CONSULTA CLIENTE
// ============================================================================

async function processarConsultaCliente(mensagem, contexto_ativo = null, usuario_id = null) {
    try {
        console.log('ðŸ” DEBUG: processarConsultaCliente - Mensagem recebida:', mensagem);
        console.log('ðŸ” DEBUG: processarConsultaCliente - Contexto ativo:', contexto_ativo);
        console.log('ðŸ” DEBUG: processarConsultaCliente - Usuario ID:', usuario_id);

        // Verificar se a mensagem Ã© um nÃºmero e se estamos em um contexto de seleÃ§Ã£o de cliente
        // ou se a mensagem Ã© composta apenas por um nÃºmero (o que indica seleÃ§Ã£o)
        const mensagemTrimmed = mensagem.trim();
        console.log('ðŸ” DEBUG: Mensagem apÃ³s trim:', mensagemTrimmed);

        if (mensagemTrimmed.match(/^\d+$/)) {  // Verifica se a mensagem contÃ©m apenas dÃ­gitos
            console.log('ðŸ”¢ DEBUG: Detectado nÃºmero, tentando seleÃ§Ã£o de cliente');
            const numeroDigitado = parseInt(mensagemTrimmed);

            // Verificar se hÃ¡ clientes armazenados no cache para este usuÃ¡rio
            if (usuario_id) {
                const dadosCache = await CacheService.get(`contexto_cliente:${usuario_id}`);

                // CacheService (Redis) jÃ¡ gerencia expiraÃ§Ã£o automaticamente
                if (dadosCache) {
                    const clientes = dadosCache.clientes;
                    console.log('ðŸ”¢ DEBUG: Clientes no cache:', clientes.length);

                    // O usuÃ¡rio digitou um nÃºmero em resposta Ã  lista de clientes
                    if (numeroDigitado >= 1 && numeroDigitado <= clientes.length) {
                        const clienteSelecionado = clientes[numeroDigitado - 1];
                        console.log('ðŸ”¢ DEBUG: Cliente selecionado:', clienteSelecionado.nomeCompleto);

                        // Limpar o cache apÃ³s seleÃ§Ã£o bem-sucedida
                        await CacheService.delete(`contexto_cliente:${usuario_id}`);

                        return {
                            success: true,
                            response: `âœ… **Cliente selecionado:** ${clienteSelecionado.nomeCompleto}\n\nTelefone: ${clienteSelecionado.telefone || 'NÃ£o informado'}\nCPF/CNPJ: ${clienteSelecionado.cpfCnpj || 'NÃ£o informado'}\nVeÃ­culos: ${clienteSelecionado.veiculos && clienteSelecionado.veiculos.length > 0 ? clienteSelecionado.veiculos.map(v => v.modelo).join(', ') : 'Nenhum veÃ­culo cadastrado'}\n\nðŸ’¡ O que deseja fazer com este cliente?\nâ€¢ "agendar" - Agendar serviÃ§o\nâ€¢ "editar" - Editar dados\nâ€¢ "histÃ³rico" - Ver histÃ³rico de serviÃ§os`,
                            tipo: 'cliente_selecionado',
                            cliente: clienteSelecionado,
                            cliente_id: clienteSelecionado.id
                        };
                    } else {
                        // NÃºmero fora do intervalo
                        console.log('ðŸ”¢ DEBUG: NÃºmero fora do intervalo:', numeroDigitado);
                        return {
                            success: false,
                            response: `âŒ **NÃºmero invÃ¡lido:** ${numeroDigitado}\n\nPor favor, escolha um nÃºmero entre 1 e ${clientes.length}.`,
                            tipo: 'erro'
                        };
                    }
                } else {
                    console.log('ðŸ”¢ DEBUG: Cache expirado ou nÃ£o encontrado para o usuÃ¡rio:', usuario_id);
                    // Cache expirado, remover entrada
                    await CacheService.delete(`contexto_cliente:${usuario_id}`);
                }
            } else {
                console.log('ðŸ”¢ DEBUG: Nenhum cache encontrado para o usuÃ¡rio ou usuÃ¡rio nÃ£o informado');
            }
        }

        // Extrair nome, telefone ou cpf da mensagem
        const padraoNome = /(?:nome|cliente|dados do cliente|consultar cliente|buscar cliente|telefone|cpf|cnpj):?\s*([A-Z\u00C0-\u00FFa-z0-9\s-]+)/i;
        let termoBusca = null;
        const matchNome = mensagem.match(padraoNome);

        if (matchNome) {
            termoBusca = matchNome[1].trim();
            console.log('ðŸ” DEBUG: Termo de busca extraÃ­do do padrÃ£o:', termoBusca);
        } else {
            // Se nÃ£o veio formatado, usa a mensagem inteira (Ãºtil para nomes compostos)
            termoBusca = mensagem.trim();
            console.log('ðŸ” DEBUG: Termo de busca usando mensagem completa:', termoBusca);
        }

        if (!termoBusca || termoBusca.length < 2) {
            console.log('ðŸ” DEBUG: Termo de busca invÃ¡lido ou muito curto');
            return {
                success: false,
                response: 'âŒ Informe o nome, telefone ou CPF do cliente para consultar.',
                tipo: 'erro'
            };
        }

        // Buscar clientes por nome, telefone ou cpf
        console.log('ðŸ” DEBUG: Iniciando busca no banco de dados para:', termoBusca);

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

        console.log('ðŸ” DEBUG: Resultado da busca - encontrados:', clientes.length, 'clientes');
        if (clientes.length > 0) {
            console.log('ðŸ” DEBUG: Clientes encontrados:', clientes.map(c => c.nomeCompleto));
        }

        if (clientes.length === 0) {
            console.log('ðŸ” DEBUG: Nenhum cliente encontrado para o termo de busca:', termoBusca);
            return {
                success: false,
                response: `âŒ Nenhum cliente encontrado para "${termoBusca}".\n\nTente informar nome completo, telefone ou CPF.`,
                tipo: 'erro'
            };
        }

        // Armazenar os clientes no cache para seleÃ§Ã£o futura, se tivermos usuario_id
        if (usuario_id) {
            await CacheService.set(`contexto_cliente:${usuario_id}`, {
                clientes: clientes,
                timestamp: Date.now()
            }, 600); // 10 minutos TTL
            console.log('ðŸ” DEBUG: Clientes armazenados no cache para usuÃ¡rio:', usuario_id);
        }

        // Montar resposta com lista de clientes
        let resposta = `ðŸ‘¤ **Clientes encontrados:**\n\n`;
        clientes.forEach((c, idx) => {
            resposta += `${idx + 1}. **${c.nomeCompleto}**\n`;
            resposta += `   â€¢ Telefone: ${c.telefone || 'NÃ£o informado'}\n`;
            resposta += `   â€¢ CPF/CNPJ: ${c.cpfCnpj || 'NÃ£o informado'}\n`;
            if (c.veiculos && c.veiculos.length > 0) {
                resposta += `   â€¢ VeÃ­culos: ${c.veiculos.map(v => v.modelo).join(', ')}\n`;
            }
            resposta += '\n';
        });

        resposta += `\nðŸ’¡ Digite o nÃºmero do cliente para selecionar ou "agendar" para iniciar um agendamento.`;

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
                    details: c.veiculos && c.veiculos.length > 0 ? [`ðŸš— ${c.veiculos.map(v => `${v.marca} ${v.modelo}`).join(', ')}`] : [],
                    value: (idx + 1).toString() // Valor que serÃ¡ enviado ao selecionar por nÃºmero
                })),
                selectionTitle: 'Clientes encontrados:'
            },
            contexto_ativo: 'buscar_cliente'  // Sinaliza que estamos em modo de busca de cliente
        };
    } catch (error) {
        console.error('âŒ Erro em processarConsultaCliente:', error.message);
        return {
            success: false,
            response: 'âŒ Erro ao consultar cliente',
            tipo: 'erro'
        };
    }
}

// ============================================================================
// ðŸ’¬ FUNÃ‡ÃƒO: PROCESSAR CONVERSA GERAL
// ============================================================================

async function processarConversaGeral(mensagem, usuario_id = null) {
    // ðŸ¤– Se Agno estiver configurado, SEMPRE tentar chamar
    if (AGNO_API_URL && AGNO_API_URL !== 'http://localhost:8000') {
        try {
            console.log('   ðŸ¤– Chamando Agno AI para conversa geral');
            const agnoResponse = await chamarAgnoAI(mensagem, usuario_id, 'CONVERSA_GERAL', null);
            return agnoResponse;
        } catch (agnoError) {
            const isTimeout = agnoError.message.includes('timeout');
            const errorType = isTimeout ? 'â±ï¸ Timeout' : 'âŒ Erro';
            console.error(`   âš ï¸ Agno falhou (${errorType}), usando fallback:`, agnoError.message);

            // Fallback: resposta genÃ©rica com informaÃ§Ã£o sobre o erro
            const fallbackMessage = isTimeout
                ? `ðŸ¤– **Assistente Matias**\n\nâš ï¸ _O assistente avanÃ§ado estÃ¡ iniciando (pode levar atÃ© 50 segundos no primeiro acesso)._\n\nEnquanto isso, como posso ajudar?\n\nðŸ’¡ Digite "ajuda" para ver o que posso fazer!`
                : `ðŸ¤– **Assistente Matias**\n\nComo posso ajudar?\n\nðŸ’¡ Digite "ajuda" para ver o que posso fazer!`;

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

    // SenÃ£o, resposta genÃ©rica local
    return {
        success: true,
        response: 'ðŸ¤– **Assistente Matias**\n\nComo posso ajudar?\n\nðŸ’¡ Digite "ajuda" para ver o que posso fazer!',
        tipo: 'conversa',
        mode: 'local',
        agno_configured: false
    };
}

// ============================================================================
// ðŸ‘¤ FUNÃ‡ÃƒO: PROCESSAR CADASTRO DE CLIENTE
// ============================================================================

async function processarCadastroCliente(mensagem, usuario_id) {
    try {
        // Buscar oficinaId do usuÃ¡rio
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
                response: 'âŒ **Erro:** NÃ£o foi possÃ­vel identificar sua oficina.',
                tipo: 'erro'
            };
        }

        // Extrair dados do cliente da mensagem
        const dados = NLPService.extrairDadosCliente(mensagem);

        console.log('   ðŸ“‹ Dados extraÃ­dos:', dados);

        // ðŸŽ¯ SEMPRE ABRIR MODAL PARA REVISÃƒO E COMPLEMENTO
        // Mesmo que tenha nome, pedir para revisar e adicionar telefone, CPF, email
        if (!dados.nome || dados.nome.length < 3) {
            // Sem nome ou nome muito curto - pedir dados
            return {
                success: false,
                response: `ðŸ“ **Para cadastrar um novo cliente, preciso dos seguintes dados:**

â€¢ **Nome completo**
â€¢ Telefone (opcional)
â€¢ CPF/CNPJ (opcional)
â€¢ Email (opcional)

**Exemplo:**
"Nome: JoÃ£o Silva, Tel: (85) 99999-9999, CPF: 123.456.789-00"

**Ou informe apenas o nome para cadastro rÃ¡pido:**
"Cadastrar cliente JoÃ£o Silva"`,
                tipo: 'cadastro',
                dadosExtraidos: dados
            };
        }

        // Verificar se cliente jÃ¡ existe
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
            // Cliente existe - abrir modal com dados dele para ediÃ§Ã£o
            return {
                success: false,
                response: `âš ï¸ **Cliente jÃ¡ cadastrado!**

**Nome:** ${clienteExistente.nomeCompleto}
**Telefone:** ${clienteExistente.telefone || 'NÃ£o informado'}
**CPF/CNPJ:** ${clienteExistente.cpfCnpj || 'NÃ£o informado'}

ðŸ’¡ Clique no formulÃ¡rio para editar ou adicionar mais informaÃ§Ãµes.`,
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

        // ðŸŽ¯ NÃƒO CADASTRAR DIRETO - SEMPRE ABRIR MODAL PARA REVISÃƒO
        // Retorna os dados extraÃ­dos para prÃ©-preencher o modal
        // UsuÃ¡rio pode revisar e adicionar telefone, CPF, email antes de salvar
        return {
            success: false,
            response: `ðŸ“ **Detectei os seguintes dados. Por favor, revise e complete no formulÃ¡rio:**

**Nome:** ${dados.nome}
${dados.telefone ? `**Telefone:** ${dados.telefone}` : 'â€¢ Telefone (recomendado)'}
${dados.cpfCnpj ? `**CPF/CNPJ:** ${dados.cpfCnpj}` : 'â€¢ CPF/CNPJ (recomendado)'}
${dados.email ? `**Email:** ${dados.email}` : 'â€¢ Email (opcional)'}

âœ… Clique no formulÃ¡rio que abriu para revisar e salvar o cadastro.`,
            tipo: 'cadastro',
            dadosExtraidos: dados
        };

    } catch (error) {
        console.error('âŒ Erro ao processar cadastro:', error);
        return {
            success: false,
            response: 'âŒ **Erro ao cadastrar cliente**\n\nPor favor, tente novamente ou cadastre manualmente na tela de clientes.',
            tipo: 'erro'
        };
    }
}

// ============================================================
// ENDPOINTS PARA INTEGRAÃ‡ÃƒO COM AGNO - FUNCIONALIDADES MATIAS
// ============================================================

// Endpoint para o Agno consultar Ordens de ServiÃ§o
router.post('/consultar-os', async (req, res) => {
    try {
        const { veiculo, proprietario, status, periodo } = req.body;

        console.log('ðŸ” Agno consultando OS:', { veiculo, proprietario, status, periodo });

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
        console.error('âŒ Erro na consulta OS:', error);
        res.status(500).json({
            success: false,
            error: 'Erro ao consultar ordens de serviÃ§o',
            message: error.message
        });
    }
});

// Endpoint para o Agno agendar serviÃ§os
router.post('/agendar-servico', async (req, res) => {
    try {
        const { cliente, veiculo, servico, data_hora, descricao } = req.body;

        console.log('ðŸ“… Agno agendando serviÃ§o:', { cliente, veiculo, servico, data_hora });

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
            mensagem: `ServiÃ§o ${servico} agendado para ${new Date(data_hora).toLocaleString('pt-BR')}`,
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error('âŒ Erro no agendamento:', error);
        res.status(500).json({
            success: false,
            error: 'Erro ao agendar serviÃ§o',
            message: error.message
        });
    }
});

// Endpoint para o Agno consultar estatÃ­sticas
router.get('/estatisticas', async (req, res) => {
    try {
        const { periodo = '30_dias' } = req.query;

        console.log('ðŸ“Š Agno consultando estatÃ­sticas:', { periodo });

        const stats = await ConsultasOSService.obterEstatisticas(periodo);

        res.json({
            success: true,
            periodo,
            estatisticas: stats,
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error('âŒ Erro nas estatÃ­sticas:', error);
        res.status(500).json({
            success: false,
            error: 'Erro ao consultar estatÃ­sticas',
            message: error.message
        });
    }
});

// Endpoint para o Agno salvar conversas
router.post('/salvar-conversa', async (req, res) => {
    try {
        const { usuario_id, mensagem, resposta, contexto } = req.body;

        console.log('ðŸ’¾ Agno salvando conversa:', { usuario_id, mensagem: mensagem?.substring(0, 50) });

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
        console.error('âŒ Erro ao salvar conversa:', error);
        res.status(500).json({
            success: false,
            error: 'Erro ao salvar conversa',
            message: error.message
        });
    }
});

// Endpoint para o Agno recuperar histÃ³rico de conversas
router.get('/historico-conversas/:usuario_id', async (req, res) => {
    try {
        const { usuario_id } = req.params;
        const { limite = 10 } = req.query;

        console.log('ðŸ“š Agno recuperando histÃ³rico:', { usuario_id, limite });

        const historico = await ConversasService.obterHistorico(usuario_id, parseInt(limite));

        res.json({
            success: true,
            usuario_id,
            total: historico.length,
            conversas: historico,
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error('âŒ Erro no histÃ³rico:', error);
        res.status(500).json({
            success: false,
            error: 'Erro ao recuperar histÃ³rico',
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
                "Consultar ordens de serviÃ§o por veÃ­culo, proprietÃ¡rio ou status",
                "Agendar novos serviÃ§os com data e hora especÃ­ficas",
                "Calcular orÃ§amentos baseados em peÃ§as e mÃ£o de obra",
                "Consultar histÃ³rico completo de veÃ­culos",
                "Gerar relatÃ³rios de produtividade da oficina",
                "Buscar peÃ§as no estoque com preÃ§os atualizados",
                "Acompanhar status de serviÃ§os em andamento"
            ],
            funcoes_disponivel: {
                "consultar_os": "/agno/consultar-os",
                "agendar_servico": "/agno/agendar-servico",
                "obter_estatisticas": "/agno/estatisticas",
                "salvar_conversa": "/agno/salvar-conversa",
                "historico": "/agno/historico-conversas/:usuario_id"
            },
            exemplos_uso: {
                consulta_os: "Mostrar todas as ordens de serviÃ§o do Gol 2020 prata",
                agendamento: "Agendar revisÃ£o para o Civic do JoÃ£o na prÃ³xima segunda Ã s 14h",
                estatisticas: "Quantos carros atendemos este mÃªs?"
            },
            timestamp: new Date().toISOString()
        };

        res.json({
            success: true,
            contexto
        });

    } catch (error) {
        console.error('âŒ Erro no contexto:', error);
        res.status(500).json({
            success: false,
            error: 'Erro ao obter contexto do sistema'
        });
    }
});

// Middleware para verificar autenticaÃ§Ã£o
const verificarAuth = (req, res, next) => {
    const token = req.headers.authorization?.replace('Bearer ', '');

    if (!token) {
        return res.status(401).json({ error: 'Token de autenticaÃ§Ã£o necessÃ¡rio' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        next();
    } catch (error) {
        return res.status(401).json({ error: 'Token invÃ¡lido' });
    }
};

// Health check do agente Agno
router.get('/health', verificarAuth, async (req, res) => {
    try {
        console.log('ðŸ” Verificando status do agente Agno...');

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
            console.log('âœ… Agente Agno online:', data);

            res.json({
                status: 'online',
                agno_status: data,
                timestamp: new Date().toISOString()
            });
        } else {
            console.log('âš ï¸ Agente Agno retornou erro:', response.status);
            res.status(response.status).json({
                status: 'erro',
                message: 'Agente nÃ£o disponÃ­vel',
                agno_status: response.status
            });
        }
    } catch (error) {
        console.error('âŒ Erro ao conectar com agente Agno:', error.message);
        res.status(503).json({
            status: 'erro',
            message: 'ServiÃ§o temporariamente indisponÃ­vel',
            error: error.message
        });
    }
});

// Listar agentes disponÃ­veis
router.get('/agents', verificarAuth, async (req, res) => {
    try {
        console.log('ðŸ“‹ Listando agentes disponÃ­veis...');

        const response = await fetch(`${AGNO_API_URL}/agents`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                ...(AGNO_API_TOKEN && { 'Authorization': `Bearer ${AGNO_API_TOKEN}` })
            }
        });

        if (response.ok) {
            const data = await response.json();
            console.log('ðŸ“‹ Agentes encontrados:', data.length);

            res.json({
                success: true,
                agents: data,
                count: data.length
            });
        } else {
            const errorData = await response.text();
            console.error('âŒ Erro ao listar agentes:', response.status, errorData);
            res.status(response.status).json({
                error: 'Erro ao listar agentes',
                details: errorData
            });
        }
    } catch (error) {
        console.error('âŒ Erro ao conectar para listar agentes:', error.message);
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
            return res.status(400).json({ error: 'Mensagem Ã© obrigatÃ³ria' });
        }

        // Verificar se temos user_id vÃ¡lido
        const userId = req.user?.id || req.user?.userId || 'anonymous';
        const agentId = agent_id || 'matias'; // Usar matias por padrÃ£o, mas permitir override

        console.log('ðŸ’¬ [CHAT] Nova mensagem recebida:', {
            user: req.user.email,
            user_id: userId,
            message: message.substring(0, 100) + '...'
        });

        // â­ NOVA ARQUITETURA MULTI-AGENTE
        // 1ï¸âƒ£ CLASSIFICA A MENSAGEM
        const classification = MessageClassifier.classify(message);
        console.log('ðŸŽ¯ [CLASSIFIER] Resultado:', {
            processor: classification.processor,
            type: classification.type,
            subtype: classification.subtype,
            confidence: classification.confidence,
            reason: classification.reason
        });

        // 2ï¸âƒ£ ROTEAMENTO INTELIGENTE
        let responseData;

        if (classification.processor === 'BACKEND_LOCAL') {
            // âš¡ PROCESSA LOCALMENTE (rÃ¡pido, confiÃ¡vel)
            console.log('âš¡ [BACKEND_LOCAL] Processando localmente...');
            const startTime = Date.now();

            responseData = await processarLocal(message, classification, userId, contexto_ativo, req);

            const duration = Date.now() - startTime;
            console.log(`âœ… [BACKEND_LOCAL] Processado em ${duration}ms`);

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
            // ðŸ§  ENVIA PARA AGNO AI (inteligente, conversacional)
            console.log('ðŸ§  [AGNO_AI] Enviando para Agno AI...');
            const startTime = Date.now();

            responseData = await processarComAgnoAI(message, userId, agentId, session_id);

            const duration = Date.now() - startTime;
            console.log(`âœ… [AGNO_AI] Processado em ${duration}ms`);

            // Adiciona metadata
            if (responseData.metadata) {
                responseData.metadata.processed_by = 'AGNO_AI';
                responseData.metadata.processing_time_ms = duration;
                responseData.metadata.classification = classification;
            }

            return res.json(responseData);
        }

    } catch (error) {
        console.error('âŒ [CHAT] Erro geral:', error);
        res.status(500).json({
            error: 'Erro interno do servidor',
            message: error.message
        });
    }
});

// ============================================================
// ðŸ”§ FUNÃ‡Ã•ES AUXILIARES - PROCESSAMENTO LOCAL
// ============================================================

/**
 * Processa mensagem localmente (SEM Agno AI)
 */
async function processarLocal(message, classification, userId, contexto_ativo, req) {
    try {
        switch (classification.type) {
            case 'GREETING':
                // SaudaÃ§Ã£o instantÃ¢nea
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
                // AÃ§Ãµes estruturadas (CRUD)
                return await processarAcaoLocal(message, classification.subtype, userId, contexto_ativo);

            default:
                // Fallback: envia para Agno AI
                console.log('âš ï¸ [BACKEND_LOCAL] Tipo nÃ£o reconhecido, enviando para Agno AI');
                return await processarComAgnoAI(message, userId);
        }
    } catch (error) {
        console.error('âŒ [BACKEND_LOCAL] Erro:', error);
        // Em caso de erro, tenta Agno AI como fallback
        return await processarComAgnoAI(message, userId);
    }
}

/**
 * Processa aÃ§Ãµes estruturadas localmente
 */
async function processarAcaoLocal(message, actionType, userId, contexto_ativo) {
    console.log(`ðŸ”§ [ACAO_LOCAL] Processando: ${actionType}`);

    try {
        switch (actionType) {
            case 'AGENDAMENTO':
                // â­ AGENDAMENTO LOCAL (10x mais rÃ¡pido) - NOVA IMPLEMENTAÃ‡ÃƒO
                return await AgendamentoLocal.processar(message, userId, contexto_ativo);

            case 'CONSULTA_OS':
                // Consulta de Ordem de ServiÃ§o (usa funÃ§Ã£o existente)
                return await processarConsultaOS(message);

            case 'CONSULTA_ESTOQUE':
                // Consulta de estoque (usa funÃ§Ã£o existente)
                return await processarConsultaEstoque(message);

            case 'CONSULTA_CLIENTE':
                // Consulta de cliente (usa funÃ§Ã£o existente)
                return await processarConsultaCliente(message, contexto_ativo, userId);

            case 'CADASTRO_CLIENTE':
                // Cadastro de cliente (usa funÃ§Ã£o existente)
                return await processarCadastroCliente(message, userId);

            case 'ESTATISTICAS':
                // EstatÃ­sticas (usa funÃ§Ã£o existente)
                return await processarEstatisticas(message);

            default:
                // AÃ§Ã£o nÃ£o implementada, envia para Agno AI
                console.log(`âš ï¸ [ACAO_LOCAL] AÃ§Ã£o ${actionType} nÃ£o implementada, enviando para Agno AI`);
                return await processarComAgnoAI(message, userId);
        }
    } catch (error) {
        console.error(`âŒ [ACAO_LOCAL] Erro ao processar ${actionType}:`, error);
        // Em caso de erro, tenta Agno AI como fallback
        return await processarComAgnoAI(message, userId);
    }
}

/**
 * ðŸ”‘ Gera chave de cache normalizada para mensagens
 */
function getCacheKey(message, userId) {
    return `${userId}:${message.toLowerCase().trim().substring(0, 100)}`;
}

/**
 * ðŸ§¹ Sanitiza dados para logs (LGPD compliance)
 */
function sanitizeForLog(text) {
    if (!text) return '';
    return String(text)
        .replace(/\d{3}\.\d{3}\.\d{3}-\d{2}/g, 'CPF***')
        .replace(/\(\d{2}\)\s?\d{4,5}-\d{4}/g, 'TEL***')
        .replace(/\d{11}/g, 'TEL***')
        .substring(0, 150);
}

/**
 * âœ… Middleware de validaÃ§Ã£o de mensagens
 */
function validateMessage(req, res, next) {
    const { message } = req.body;

    if (!message?.trim()) {
        return res.status(400).json({ error: 'Mensagem obrigatÃ³ria' });
    }

    next();
}

/**
 * ðŸ§  GET /api/agno/memories/:userId
 * Recupera memÃ³rias de um usuÃ¡rio especÃ­fico
 */
router.get('/memories/:userId', verificarAuth, async (req, res) => {
    try {
        const { userId } = req.params;

        // ðŸ” Validar que usuÃ¡rio sÃ³ acessa suas prÃ³prias memÃ³rias (seguranÃ§a)
        const requestUserId = req.user?.id || req.user?.userId;
        if (userId !== requestUserId.toString()) {
            console.warn(`âš ï¸ [MEMÃ“RIA] Tentativa de acesso nÃ£o autorizado - User ${requestUserId} tentou acessar memÃ³rias de ${userId}`);
            return res.status(403).json({
                success: false,
                error: 'Acesso negado - vocÃª sÃ³ pode ver suas prÃ³prias memÃ³rias'
            });
        }

        const agnoUserId = `user_${userId}`;
        console.log(`ðŸ” [MEMÃ“RIA] Buscando memÃ³rias para: ${agnoUserId}`);

        // Verificar se Agno AI estÃ¡ configurado
        if (AGNO_API_URL === 'http://localhost:8000') {
            return res.json({
                success: true,
                memories: [],
                total: 0,
                message: 'Sistema de memÃ³ria nÃ£o disponÃ­vel em modo de desenvolvimento'
            });
        }

        const response = await fetch(
            `${AGNO_API_URL}/memories?user_id=${agnoUserId}`,
            {
                headers: {
                    'Content-Type': 'application/json',
                    ...(AGNO_API_TOKEN && { 'Authorization': `Bearer ${AGNO_API_TOKEN}` })
                },
                signal: AbortSignal.timeout(10000)
            }
        );

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }

        const data = await response.json();
        const memories = data.memories || data.results || [];

        console.log(`âœ… [MEMÃ“RIA] ${memories.length} memÃ³rias encontradas para user_${userId}`);

        return res.json({
            success: true,
            memories: memories,
            total: memories.length,
            user_id: agnoUserId
        });

    } catch (error) {
        console.error('âŒ [MEMÃ“RIA] Erro ao buscar memÃ³rias:', error);
        return res.status(500).json({
            success: false,
            error: 'Erro ao buscar memÃ³rias do assistente',
            details: error.message
        });
    }
});

/**
 * ðŸ—‘ï¸ DELETE /api/agno/memories/:userId
 * Limpa as memÃ³rias de um usuÃ¡rio (LGPD/GDPR compliance)
 */
router.delete('/memories/:userId', verificarAuth, async (req, res) => {
    try {
        const { userId } = req.params;

        // ðŸ” Validar acesso
        const requestUserId = req.user?.id || req.user?.userId;
        if (userId !== requestUserId.toString()) {
            console.warn(`âš ï¸ [MEMÃ“RIA] Tentativa de exclusÃ£o nÃ£o autorizada - User ${requestUserId} tentou excluir memÃ³rias de ${userId}`);
            return res.status(403).json({
                success: false,
                error: 'Acesso negado'
            });
        }

        const agnoUserId = `user_${userId}`;
        console.log(`ðŸ—‘ï¸ [MEMÃ“RIA] Excluindo memÃ³rias para: ${agnoUserId}`);

        // Verificar se Agno AI estÃ¡ configurado
        if (AGNO_API_URL === 'http://localhost:8000') {
            return res.json({
                success: true,
                message: 'Sistema de memÃ³ria nÃ£o disponÃ­vel em modo de desenvolvimento'
            });
        }

        const response = await fetch(
            `${AGNO_API_URL}/memories?user_id=${agnoUserId}`,
            {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                    ...(AGNO_API_TOKEN && { 'Authorization': `Bearer ${AGNO_API_TOKEN}` })
                },
                signal: AbortSignal.timeout(10000)
            }
        );

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }

        console.log(`âœ… [MEMÃ“RIA] MemÃ³rias excluÃ­das com sucesso para user_${userId}`);

        return res.json({
            success: true,
            message: 'MemÃ³rias excluÃ­das com sucesso. O assistente nÃ£o se lembrarÃ¡ mais das conversas anteriores.',
            user_id: agnoUserId
        });

    } catch (error) {
        console.error('âŒ [MEMÃ“RIA] Erro ao excluir memÃ³rias:', error);
        return res.status(500).json({
            success: false,
            error: 'Erro ao excluir memÃ³rias',
            details: error.message
        });
    }
});

/**
 * ðŸ“Š GET /api/agno/memory-status
 * Verifica se o sistema de memÃ³ria estÃ¡ ativo e funcionando
 */
router.get('/memory-status', async (req, res) => {
    try {
        // Verificar se Agno AI estÃ¡ configurado
        const isConfigured = AGNO_API_URL !== 'http://localhost:8000';

        if (!isConfigured) {
            return res.json({
                enabled: false,
                status: 'disabled',
                message: 'Sistema de memÃ³ria nÃ£o disponÃ­vel em desenvolvimento'
            });
        }

        // Testar conexÃ£o com endpoint de memÃ³ria
        const response = await fetch(`${AGNO_API_URL}/health`, {
            signal: AbortSignal.timeout(5000)
        });

        const isOnline = response.ok;

        return res.json({
            enabled: isOnline,
            status: isOnline ? 'active' : 'unavailable',
            agno_url: AGNO_API_URL,
            message: isOnline
                ? 'Sistema de memÃ³ria ativo - Matias lembra das suas conversas'
                : 'Sistema temporariamente indisponÃ­vel',
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error('âŒ [MEMÃ“RIA] Erro ao verificar status:', error);
        return res.json({
            enabled: false,
            status: 'error',
            message: 'Erro ao verificar sistema de memÃ³ria',
            details: error.message
        });
    }
});

// Warm-up INTELIGENTE - apenas se inativo por >8 minutos (economia 50%)
if (AGNO_API_URL && AGNO_API_URL !== 'http://localhost:8000') {
    const WARMUP_INTERVAL = 10 * 60 * 1000; // 10 minutos

    setInterval(async () => {
        try {
            const inactiveTime = Date.now() - lastActivity;
            const inactiveMinutes = Math.floor(inactiveTime / 60000);

            // Aquecer apenas se inativo por mais de 8 minutos
            if (inactiveTime > 8 * 60 * 1000) {
                console.log(`ðŸ”¥ [AUTO-WARMUP] Inativo ${inactiveMinutes}min - aquecendo...`);
                const response = await fetch(`${AGNO_API_URL}/health`, {
                    signal: AbortSignal.timeout(5000)
                });

                if (response.ok) {
                    console.log('âœ… [AUTO-WARMUP] Agno AI aquecido com sucesso');
                    agnoWarmed = true;
                } else {
                    console.warn('âš ï¸ [AUTO-WARMUP] Agno AI nÃ£o respondeu:', response.status);
                }
            } else {
                console.log(`âœ… [AUTO-WARMUP] Ativo (${inactiveMinutes}min) - warm-up desnecessÃ¡rio`);
            }
        } catch (error) {
            console.warn('âš ï¸ [AUTO-WARMUP] Erro ao aquecer:', error.message);
        }
    }, WARMUP_INTERVAL);

    console.log('🔥 [AUTO-WARMUP] Sistema INTELIGENTE ativado (economia 50%)');
}

/**
 * Processa mensagem com Agno AI (com fallback, circuit breaker e CACHE L1)
 */
async function processarComAgnoAI(message, userId, agentId = 'matias', session_id = null) {
    // 0. Verificar Cache L1 (Redis) - 🚀 OTIMIZAÇÃO EXTREMA
    const cacheKey = `agno:response:${CacheService.hash(message)}`;
    const cachedResponse = await CacheService.get(cacheKey);

    if (cachedResponse) {
        console.log('⚡ [CACHE] HIT - Retornando resposta cacheada');
        return {
            ...cachedResponse,
            from_cache: true,
            metadata: {
                ...cachedResponse.metadata,
                cached: true,
                retrieved_at: new Date().toISOString()
            }
        };
    }

    console.log('💨 [CACHE] MISS - Consultando Agno AI...');

    // 1. Verificar Circuit Breaker (Rate Limit Protection)
    if (!checkCircuitBreaker()) {
        console.warn('⚠️ [AGNO] Circuit breaker aberto. Usando fallback local.');
        return {
            response: "Estou com muitas requisições no momento. Tente novamente em alguns instantes.",
            conteudo: "Estou com muitas requisições no momento. Tente novamente em alguns instantes.",
            metadata: {
                model: "fallback-local",
                usage: { total_tokens: 0 }
            }
        };
    }

    const agnoUserId = `user_${userId}`;
    const sessionId = session_id || agnoUserId; // Manter consistência da sessão

    try {
        // Endpoint correto conforme matias_agno/api.py
        const endpoint = `${AGNO_API_URL}/agno/chat-inteligente`;
        console.log(`🚀 [AGNO] Enviando para ${endpoint}`);

        // Payload compatível com matias_agno/api.py (ChatRequest)
        const payload = {
            message: message,
            session_id: sessionId,
            user_id: agnoUserId
        };

        const response = await fetch(endpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                ...(AGNO_API_TOKEN && { 'Authorization': `Bearer ${AGNO_API_TOKEN}` })
            },
            body: JSON.stringify(payload),
            signal: AbortSignal.timeout(60000) // 60s timeout (modelos demoram)
        });

        // 2. Tratamento de Erros HTTP
        if (!response.ok) {
            // Se for 429 (Too Many Requests), abrir circuit breaker
            if (response.status === 429) {
                openCircuitBreaker();
            }

            const errorText = await response.text();
            throw new Error(`HTTP ${response.status}: ${errorText.substring(0, 200)}`);
        }

        // 3. Processamento da Resposta
        const data = await response.json();

        // Normalização da resposta (Agno retorna 'conteudo' no ChatResponse)
        const respostaTexto = data.conteudo || data.response || data.message || data.content || "Não entendi.";

        const finalResponse = {
            response: respostaTexto,
            conteudo: respostaTexto, // Compatibilidade com frontend
            metadata: {
                model: data.modelo || "agno-agent", // 'modelo' vem do ContextoResponse, mas aqui pode variar
                usage: { total_tokens: 0 },
                session_id: sessionId
            }
        };

        // 4. Salvar no Cache (TTL 24h)
        await CacheService.set(cacheKey, finalResponse, 86400);
        console.log('💾 [CACHE] Resposta salva no Redis (TTL 24h)');

        return finalResponse;

    } catch (error) {
        console.error('❌ [AGNO] Erro na requisição:', error.message);

        // Fallback gracioso
        return {
            response: "Desculpe, estou tendo dificuldades para conectar com minha inteligência central. Tente novamente em alguns instantes.",
            conteudo: "Desculpe, estou tendo dificuldades para conectar com minha inteligência central. Tente novamente em alguns instantes.",
            metadata: {
                model: "fallback-error",
                error: error.message
            }
        };
    }
}

export default router;
