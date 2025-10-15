import express from 'express';
import fetch from 'node-fetch';
import FormData from 'form-data';
import jwt from 'jsonwebtoken';

// Importar serviços do Matias
import ConversasService from '../services/conversas.service.js';
import AgendamentosService from '../services/agendamentos.service.js';
import ConsultasOSService from '../services/consultasOS.service.js';

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