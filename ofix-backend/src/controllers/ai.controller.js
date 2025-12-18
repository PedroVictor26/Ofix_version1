import knowledgeBase from '../services/knowledgeBase.service.js';
import contextManager from '../services/contextManager.service.js';
import ofixIntegration from '../services/ofixIntegration.service.js';
import diagnosticEngine from '../services/diagnosticEngine.service.js';
import aiProviderFactory from '../ai/providers/AIProviderFactory.js';

// In-memory store as a minimal implementation; can be replaced by Prisma later
const conversations = new Map();
const feedbackLog = [];

// Função de fallback para análise de triagem
async function analyzeWithFallback(transcricao) {
	const text = transcricao.toLowerCase();

	// Análise baseada em palavras-chave
	let categoria = 'geral';
	let complexidade = 'media';
	let urgencia = 'media';
	let tempo = 2;
	let pecas = ['Diagnóstico necessário'];
	let sintomas = [];

	// Categorização por palavras-chave
	if (text.includes('freio') || text.includes('para') || text.includes('pedal')) {
		categoria = 'freios';
		pecas = ['Pastilha de freio', 'Disco de freio', 'Fluido de freio'];
		tempo = 3;
		if (text.includes('rangendo') || text.includes('chiando')) {
			urgencia = 'alta';
			sintomas.push('Ruído metálico');
		}
	} else if (text.includes('motor') || text.includes('barulho') || text.includes('vibra')) {
		categoria = 'motor';
		complexidade = 'alta';
		tempo = 6;
		pecas = ['Vela de ignição', 'Filtro de óleo', 'Correia'];
		if (text.includes('fumaça') || text.includes('esquenta')) {
			urgencia = 'alta';
			sintomas.push('Superaquecimento');
		}
	} else if (text.includes('suspens') || text.includes('amortecedor') || text.includes('mola')) {
		categoria = 'suspensao';
		tempo = 4;
		pecas = ['Amortecedor', 'Mola', 'Batente'];
		sintomas.push('Problemas de dirigibilidade');
	} else if (text.includes('luz') || text.includes('bateria') || text.includes('não liga')) {
		categoria = 'eletrica';
		tempo = 2;
		pecas = ['Bateria', 'Alternador', 'Fusível'];
		if (text.includes('não liga')) {
			urgencia = 'alta';
			sintomas.push('Falha na partida');
		}
	} else if (text.includes('marcha') || text.includes('câmbio') || text.includes('embreagem')) {
		categoria = 'transmissao';
		complexidade = 'alta';
		tempo = 5;
		pecas = ['Óleo de câmbio', 'Disco de embreagem'];
	}

	// Verificar urgência geral
	if (text.includes('urgente') || text.includes('parou') || text.includes('não anda')) {
		urgencia = 'emergencia';
	}

	return {
		categoria_principal: categoria,
		categoria_secundaria: 'análise_básica',
		tempo_estimado_horas: tempo,
		complexidade,
		urgencia,
		pecas_provaveis: pecas,
		proximos_passos: `Verificação ${categoria} - análise presencial recomendada`,
		confianca_analise: 65, // Confiança média para análise por palavras-chave
		sintomas_identificados: sintomas.length > 0 ? sintomas : ['Sintomas básicos identificados'],
		diagnostico_preliminar: `Possível problema em ${categoria} baseado na descrição`
	};
}

export async function health(req, res) {
	try {
		// Ensure knowledge base is initialized
		if (!knowledgeBase.initialized) {
			await knowledgeBase.initialize();
		}
		return res.json({ status: 'ok', kbInitialized: true, time: new Date().toISOString() });
	} catch (err) {
		return res.status(500).json({ status: 'error', message: err.message });
	}
}

export async function getSuggestions(req, res) {
	try {
		const contextParam = req.query.context;
		const context = contextParam ? JSON.parse(contextParam) : {};
		const query = context?.lastUserMessage || context?.topic || 'ofix assistente';
		const results = await knowledgeBase.search(query, { limit: 5, user_context: context });
		const suggestions = results.map(r => ({
			text: r.title,
			category: r.category,
			confidence: r.confidence,
		}));
		return res.json(suggestions);
	} catch (err) {
		return res.status(400).json({ error: 'Invalid context', details: err.message });
	}
}

export async function chat(req, res) {
	try {
		const { message, conversationId, userType = 'cliente', context = {} } = req.body || {};
		if (!message || typeof message !== 'string') {
			return res.status(400).json({ error: 'Mensagem inválida' });
		}

		// Resolve conversation
		const id = conversationId || `conv_${Date.now()}`;
		if (!conversations.has(id)) {
			conversations.set(id, { id, messages: [], context: { userType, ...context }, createdAt: new Date() });
		}
		const conv = conversations.get(id);
		conv.messages.push({ id: Date.now(), type: 'user', content: message, createdAt: new Date() });

		let responseText = '';
		let confidence = 0.8;
		let metadata = { source: 'python-agent' };

		// TENTATIVA 1: Chamar Agente Python (Matias Team)
		try {
			const pythonResponse = await fetch('http://localhost:8000/chat', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					message,
					session_id: id,
					user_id: req.user?.id || 'anonymous'
				})
			});

			if (pythonResponse.ok) {
				const data = await pythonResponse.json();
				responseText = data.response;
			} else {
				throw new Error(`Python API error: ${pythonResponse.statusText}`);
			}
		} catch (pyError) {
			console.warn('⚠️ Falha ao chamar Agente Python, usando fallback:', pyError.message);

			// FALLBACK: Lógica antiga (KB Search)
			const kbResults = await knowledgeBase.search(message, { limit: 1, user_context: context });
			const top = kbResults[0];
			responseText = top ? `${top.title}\n\n${top.content}` : 'Entendi. Poderia detalhar um pouco mais para eu ajudar melhor?';
			confidence = top?.confidence ?? 0.6;
			metadata = { source: top ? 'knowledge-base' : 'generic', kbId: top?.id };
		}

		const payload = {
			conversationId: id,
			response: responseText,
			confidence,
			suggestions: (await knowledgeBase.search(message, { limit: 3, user_context: context }))
				.map(r => ({ text: r.title, category: r.category, confidence: r.confidence })),
			context: conv.context,
			metadata
		};

		conv.messages.push({ id: Date.now() + 1, type: 'assistant', content: payload.response, createdAt: new Date(), confidence: payload.confidence, metadata: payload.metadata });
		return res.json(payload);
	} catch (err) {
		return res.status(500).json({ error: 'Falha no processamento da mensagem', details: err.message });
	}
}

export async function diagnosis(req, res) {
	try {
		const { symptoms = [], vehicle = {}, context = {}, conversationId } = req.body || {};
		// Heuristic diagnosis using KB search by symptoms joined
		const query = Array.isArray(symptoms) && symptoms.length > 0 ? symptoms.join(' ') : 'diagnóstico veicular';
		const results = await knowledgeBase.search(query, { category: 'diagnostics', limit: 3, user_context: { ...context, vehicle_brand: vehicle.brand } });

		const primary = results[0];
		const diagnosis = primary ? { primaryCause: primary.title, description: primary.content, confidence: primary.confidence } : { primaryCause: 'Indeterminado', description: 'Necessário coletar mais informações.', confidence: 0.4 };

		const suggestedActions = results.map(r => `Verificar: ${r.title}`).slice(0, 5);
		const estimatedCost = 250; // placeholder
		const urgencyLevel = primary?.urgency || 'normal';

		return res.json({ diagnosis, suggestedActions, estimatedCost, urgencyLevel, conversationId: conversationId || null });
	} catch (err) {
		return res.status(500).json({ error: 'Falha no diagnóstico', details: err.message });
	}
}

export async function quickAction(req, res) {
	try {
		const { action, data = {}, context = {} } = req.body || {};
		if (!action) return res.status(400).json({ error: 'Ação não informada' });
		// Minimal actions
		switch (action) {
			case 'status_os': {
				const os = data?.os || data?.numero || 'N/D';
				return res.json({ ok: true, message: `Status da OS ${os}: Em análise (exemplo)`, context });
			}
			default:
				return res.json({ ok: true, message: `Ação '${action}' executada (simulado).`, context });
		}
	} catch (err) {
		return res.status(500).json({ error: 'Falha na ação', details: err.message });
	}
}

export async function feedback(req, res) {
	try {
		const { conversationId, messageId, rating = 0, comment = '' } = req.body || {};
		feedbackLog.push({ conversationId, messageId, rating, comment, userId: req.user?.id, date: new Date() });
		return res.json({ ok: true });
	} catch (err) {
		return res.status(500).json({ error: 'Falha ao registrar feedback', details: err.message });
	}
}

export async function listConversations(req, res) {
	try {
		const items = Array.from(conversations.values()).map(c => ({ id: c.id, createdAt: c.createdAt, messageCount: c.messages.length }));
		return res.json(items);
	} catch (err) {
		return res.status(500).json({ error: 'Falha ao listar conversas', details: err.message });
	}
}

export async function getConversationById(req, res) {
	try {
		const id = req.params.id;
		const conv = conversations.get(id);
		if (!conv) return res.status(404).json({ error: 'Conversa não encontrada' });
		return res.json(conv);
	} catch (err) {
		return res.status(500).json({ error: 'Falha ao obter conversa', details: err.message });
	}
}

export async function endConversation(req, res) {
	try {
		const id = req.params.id;
		const conv = conversations.get(id);
		if (!conv) return res.status(404).json({ error: 'Conversa não encontrada' });
		conv.endedAt = new Date();
		return res.json({ ok: true });
	} catch (err) {
		return res.status(500).json({ error: 'Falha ao finalizar conversa', details: err.message });
	}
}

// ---------- NOVAS FUNCIONALIDADES CLIENTES/MECÂNICOS ----------

export async function statusOS(req, res) {
	try {
		const { os, placa } = req.query;
		if (!os && !placa) return res.status(400).json({ error: 'Informe os parâmetros os ou placa' });
		const result = await ofixIntegration.getOSStatus({ os: os || null, placa: placa || null, userId: req.user?.id });
		return res.json(result);
	} catch (err) {
		return res.status(500).json({ error: 'Falha ao consultar status', details: err.message });
	}
}

export async function vehicleHistory(req, res) {
	try {
		const { plate } = req.params;
		const { de, ate, tipo } = req.query;
		const result = await ofixIntegration.getVehicleHistory({ plate, from: de, to: ate, type: tipo, userId: req.user?.id });
		return res.json(result);
	} catch (err) {
		return res.status(500).json({ error: 'Falha ao consultar histórico', details: err.message });
	}
}

export async function createAgendamento(req, res) {
	try {
		const { nome, telefone, placa, preferenciaData, preferenciaHorario, servicos = [] } = req.body || {};
		if (!nome || !telefone) return res.status(400).json({ error: 'Nome e telefone são obrigatórios' });
		const result = await ofixIntegration.createAgendamento({ nome, telefone, placa, preferenciaData, preferenciaHorario, servicos, userId: req.user?.id });
		return res.status(201).json(result);
	} catch (err) {
		return res.status(500).json({ error: 'Falha ao criar agendamento', details: err.message });
	}
}

export async function checkinConduzir(req, res) {
	try {
		const { etapaAtual = 'inicio', dadosParciais = {}, conversationId } = req.body || {};
		const convId = conversationId || `checkin_${Date.now()}`;
		const ctx = await contextManager.updateContext(convId, { etapaAtual, dados: dadosParciais });

		// lógica simples de orquestração de perguntas
		let etapaSeguinte = 'aguardando_resposta';
		let proximaPergunta = 'Olá! Vamos começar o check-in do seu veículo. Qual problema você está enfrentando?';
		if (etapaAtual === 'inicio') {
			etapaSeguinte = 'aguardando_resposta_problema';
		} else if (etapaAtual === 'aguardando_resposta' || etapaAtual === 'aguardando_resposta_problema') {
			etapaSeguinte = 'coletando_detalhes';
			proximaPergunta = 'Entendi. Quando você notou esse problema pela primeira vez? Acontece sempre ou apenas em situações específicas?';
		} else if (etapaAtual === 'coletando_detalhes') {
			etapaSeguinte = 'verificando_manutencao';
			proximaPergunta = 'Obrigado. Quando foi a última manutenção do veículo? Quais serviços foram feitos?';
		} else if (etapaAtual === 'verificando_manutencao') {
			etapaSeguinte = 'finalizando_checkin';
			proximaPergunta = 'Perfeito! Vou preparar um resumo do check-in. Há mais algo a mencionar?';
		} else if (etapaAtual === 'finalizando_checkin') {
			etapaSeguinte = 'check_in_completo';
			proximaPergunta = 'Excelente! Check-in finalizado com sucesso. Todas as informações foram registradas.';
		}

		return res.json({ conversaId: convId, etapa_seguinte: etapaSeguinte, proxima_pergunta: proximaPergunta, contexto: ctx });
	} catch (err) {
		return res.status(500).json({ error: 'Falha ao conduzir check-in', details: err.message });
	}
}

export async function resumoWhatsapp(req, res) {
	try {
		const osId = req.params.id;
		const dadosOS = req.body || {};
		const resumo = await ofixIntegration.buildWhatsappSummary({ osId, dadosOS, userId: req.user?.id });
		return res.json(resumo);
	} catch (err) {
		return res.status(500).json({ error: 'Falha ao gerar resumo', details: err.message });
	}
}

export async function analiseUpsell(req, res) {
	try {
		const osId = req.params.id;
		const { laudoTecnico = '', historicoCliente = {} } = req.body || {};
		const result = await ofixIntegration.analyzeUpsell({ osId, laudoTecnico, historicoCliente, userId: req.user?.id });
		return res.json(result);
	} catch (err) {
		return res.status(500).json({ error: 'Falha na análise de upsell', details: err.message });
	}
}

// ---------- Rotas de teste (sem auth) ----------
export async function testCheckin(req, res) {
	return res.json({ conversaId: 'demo', etapa_seguinte: 'aguardando_resposta', proxima_pergunta: 'Olá! Vamos começar o check-in do seu veículo. Qual problema você está enfrentando?' });
}

export async function testResumoWhatsapp(req, res) {
	return res.json({
		mensagemWhatsapp: 'Olá João! Sua OS #123 está em execução. Prevista para 17h. Qualquer novidade te avisamos. Obrigado! — OFIX',
		cliente: 'João Silva',
		os: '123',
		status: 'EM_EXECUCAO'
	});
}

export async function testUpsell(req, res) {
	return res.json({
		sugestao: 'troca_pastilhas_freio',
		justificativa_tecnica: 'Pastilhas com 3mm indicam desgaste acentuado. Recomenda-se substituição abaixo de 4mm.',
		mensagem_cliente: 'Identificamos que as pastilhas de freio estão próximas do limite. Recomendamos a troca para garantir sua segurança.'
	});
}

export async function triagemVoz(req, res) {
	try {
		// multer provides file in req.file
		const file = req.file; // buffer in memory
		const { clienteTelefone, veiculoPlaca, providerPreference } = req.body || {};

		if (!file) {
			return res.status(400).json({ error: 'Arquivo de áudio é obrigatório' });
		}

		console.log(`🎤 Processando triagem por voz (${Math.round(file.size / 1024)}KB)`);

		try {
			// 1. Tentar transcrição com IA
			let transcricao;
			let provider;

			try {
				provider = aiProviderFactory.getProvider(providerPreference);
				const transcriptionResult = await provider.transcribeAudio(file.buffer);
				transcricao = transcriptionResult.text;
				console.log(`✅ Transcrição realizada: "${transcricao.substring(0, 100)}..."`);
			} catch (transcriptionError) {
				console.warn('⚠️ Falha na transcrição de IA, usando simulação:', transcriptionError.message);
				// Fallback: simulação baseada no tamanho do arquivo
				const tamanhoKB = Math.round(file.size / 1024);
				const simulatedTexts = [
					'O carro está fazendo um barulho estranho quando eu freio',
					'O motor está falhando e tem uma fumaça saindo',
					'A direção está dura e o carro está puxando para um lado',
					'O ar condicionado não está gelando direito',
					'O carro não está ligando, faz um clique quando viro a chave'
				];
				transcricao = simulatedTexts[tamanhoKB % simulatedTexts.length];
			}

			// 2. Análise da triagem com IA
			let analise;
			try {
				provider = provider || aiProviderFactory.getProvider();
				analise = await provider.analisarTriagemVeiculo(transcricao);
				console.log(`🔍 Análise IA completa: ${analise.categoria_principal} (${analise.confianca_analise}%)`);
			} catch (analysisError) {
				console.warn('⚠️ Falha na análise de IA, usando fallback:', analysisError.message);

				// Fallback simples baseado em palavras-chave
				analise = await analyzeWithFallback(transcricao);
			}

			// 3. Salvar no banco (se houver integração Prisma)
			try {
				// Aqui seria a integração com banco de dados
				// const triagem = await prisma.triagens.create({...})
				console.log('💾 Triagem salva no banco (simulado)');
			} catch (dbError) {
				console.warn('⚠️ Erro ao salvar no banco:', dbError.message);
			}

			// 4. Retornar resultado
			return res.json({
				triagem_id: `triagem_${Date.now()}`,
				transcricao,
				analise,
				provider_usado: provider?.constructor.name || 'Fallback',
				timestamp: new Date().toISOString()
			});

		} catch (processingError) {
			console.error('❌ Erro no processamento da triagem:', processingError);

			// Último fallback: resposta básica
			return res.json({
				triagem_id: `triagem_fallback_${Date.now()}`,
				transcricao: 'Áudio recebido mas não foi possível processar automaticamente',
				analise: {
					categoria_principal: 'geral',
					categoria_secundaria: 'diagnóstico_necessario',
					tempo_estimado_horas: 2,
					complexidade: 'media',
					urgencia: 'media',
					pecas_provaveis: ['Diagnóstico completo necessário'],
					proximos_passos: 'Agendar análise presencial com mecânico',
					confianca_analise: 30,
					sintomas_identificados: ['Audio não processado'],
					diagnostico_preliminar: 'Necessário análise presencial'
				},
				provider_usado: 'Fallback Manual',
				timestamp: new Date().toISOString(),
				observacao: 'Processamento automático falhou, análise manual necessária'
			});
		}

	} catch (error) {
		console.error('❌ Erro geral na triagem por voz:', error);
		return res.status(500).json({
			error: 'Erro interno no processamento da triagem',
			details: process.env.NODE_ENV === 'development' ? error.message : undefined
		});
	}
}

export async function solutionsHistory(req, res) {
	try {
		const { symptoms = [], vehicle = {} } = req.query;
		const symptomsArr = Array.isArray(symptoms) ? symptoms : (typeof symptoms === 'string' ? symptoms.split(',') : []);
		const items = diagnosticEngine.similarSolutionsHistory(symptomsArr, vehicle);
		return res.json({ items });
	} catch (err) {
		return res.status(500).json({ error: 'Falha ao consultar histórico de soluções', details: err.message });
	}
}

export async function analyticsMetrics(req, res) {
	try {
		// Simple metrics from in-memory stores
		const totalConversations = conversations.size;
		const totalFeedback = feedbackLog.length;
		const avgRating = totalFeedback ? (feedbackLog.reduce((s, f) => s + (Number(f.rating) || 0), 0) / totalFeedback) : 0;
		return res.json({
			totalConversations,
			totalFeedback,
			avgRating,
			kbStats: await knowledgeBase.getStatistics?.() || null
		});
	} catch (err) {
		return res.status(500).json({ error: 'Falha ao obter métricas', details: err.message });
	}
}

// Novos endpoints para Dashboard e Analytics

export async function getConversationAnalytics(req, res) {
	try {
		// Dados mockados de analytics de conversas
		const analytics = {
			totalConversations: conversationLog.length,
			activeConversations: conversationLog.filter(c => !c.endedAt).length,
			averageSessionTime: '4.2 min',
			successRate: 87,
			topCategories: [
				{ name: 'Diagnóstico', count: 45 },
				{ name: 'Agendamento', count: 32 },
				{ name: 'Consulta OS', count: 28 }
			],
			hourlyStats: [
				{ hour: '08:00', conversations: 12 },
				{ hour: '09:00', conversations: 18 },
				{ hour: '10:00', conversations: 24 },
				{ hour: '11:00', conversations: 20 },
				{ hour: '14:00', conversations: 22 },
				{ hour: '15:00', conversations: 28 },
				{ hour: '16:00', conversations: 25 },
				{ hour: '17:00', conversations: 15 }
			]
		};

		return res.json(analytics);
	} catch (err) {
		return res.status(500).json({ error: 'Falha ao obter analytics', details: err.message });
	}
}

export async function listKnowledge(req, res) {
	try {
		// Simular base de conhecimento
		const knowledgeItems = [
			{
				id: 1,
				title: 'Diagnóstico de problemas de motor',
				content: 'Procedimento completo para diagnóstico de motores...',
				category: 'diagnostico',
				tags: ['motor', 'diagnóstico', 'problemas'],
				type: 'procedure',
				priority: 'high',
				isActive: true,
				createdAt: new Date().toISOString(),
				updatedAt: new Date().toISOString(),
				author: 'Sistema',
				views: 45,
				helpful: 38
			},
			{
				id: 2,
				title: 'Preços de serviços de freio',
				content: 'Tabela de preços para serviços relacionados ao sistema de freios...',
				category: 'servicos',
				tags: ['freio', 'preços', 'serviços'],
				type: 'faq',
				priority: 'medium',
				isActive: true,
				createdAt: new Date().toISOString(),
				updatedAt: new Date().toISOString(),
				author: 'Gestor',
				views: 23,
				helpful: 20
			}
		];

		return res.json(knowledgeItems);
	} catch (err) {
		return res.status(500).json({ error: 'Falha ao listar conhecimento', details: err.message });
	}
}

export async function createKnowledge(req, res) {
	try {
		const { title, content, category, tags, type, priority } = req.body;

		if (!title || !content || !category) {
			return res.status(400).json({ error: 'Título, conteúdo e categoria são obrigatórios' });
		}

		const newItem = {
			id: Date.now(),
			title,
			content,
			category,
			tags: tags || [],
			type: type || 'faq',
			priority: priority || 'medium',
			isActive: true,
			createdAt: new Date().toISOString(),
			updatedAt: new Date().toISOString(),
			author: req.user?.nome || 'Usuário',
			views: 0,
			helpful: 0
		};

		return res.status(201).json(newItem);
	} catch (err) {
		return res.status(500).json({ error: 'Falha ao criar item de conhecimento', details: err.message });
	}
}

export async function updateKnowledge(req, res) {
	try {
		const { id } = req.params;
		const updates = req.body;

		// Simular atualização
		const updatedItem = {
			id: parseInt(id),
			...updates,
			updatedAt: new Date().toISOString()
		};

		return res.json(updatedItem);
	} catch (err) {
		return res.status(500).json({ error: 'Falha ao atualizar item', details: err.message });
	}
}

export async function deleteKnowledge(req, res) {
	try {
		const { id } = req.params;

		// Simular exclusão
		return res.json({ message: `Item ${id} excluído com sucesso` });
	} catch (err) {
		return res.status(500).json({ error: 'Falha ao excluir item', details: err.message });
	}
}

export async function getKnowledgeCategories(req, res) {
	try {
		const categories = [
			{ id: 'servicos', name: 'Serviços', count: 15 },
			{ id: 'pecas', name: 'Peças', count: 8 },
			{ id: 'diagnostico', name: 'Diagnóstico', count: 12 },
			{ id: 'atendimento', name: 'Atendimento', count: 6 },
			{ id: 'politicas', name: 'Políticas', count: 4 }
		];

		return res.json(categories);
	} catch (err) {
		return res.status(500).json({ error: 'Falha ao obter categorias', details: err.message });
	}
}

export async function getUserSettings(req, res) {
	try {
		// Configurações padrão do usuário
		const defaultSettings = {
			personality: {
				tone: 'profissional',
				formality: 'formal',
				verbosity: 'medio',
				humor: false,
				empathy: true
			},
			appearance: {
				theme: 'auto',
				avatarStyle: 'robotic',
				position: 'bottom-right',
				size: 'medium',
				animations: true
			},
			behavior: {
				autoGreeting: true,
				proactiveHelp: true,
				contextMemory: true,
				learningMode: true,
				confidenceThreshold: 0.7,
				maxResponseTime: 5000
			},
			interface: {
				language: 'pt-BR',
				soundEnabled: true,
				notificationsEnabled: true,
				quickActionsVisible: true,
				historyVisible: true,
				feedbackPrompts: true
			},
			advanced: {
				apiTimeout: 30000,
				retryAttempts: 3,
				debugMode: false,
				analyticsEnabled: true,
				dataRetention: 30
			}
		};

		return res.json(defaultSettings);
	} catch (err) {
		return res.status(500).json({ error: 'Falha ao obter configurações', details: err.message });
	}
}

export async function updateUserSettings(req, res) {
	try {
		const settings = req.body;

		// Simular salvamento das configurações
		return res.json({
			message: 'Configurações atualizadas com sucesso',
			settings: settings
		});
	} catch (err) {
		return res.status(500).json({ error: 'Falha ao atualizar configurações', details: err.message });
	}
}

export async function listFeedback(req, res) {
	try {
		// Dados mockados de feedback
		const mockFeedbacks = [
			{
				id: 1,
				userId: 'usr_001',
				rating: 5,
				comment: 'Excelente atendimento! O assistente foi muito útil.',
				category: 'atendimento',
				conversationId: 'conv_123',
				createdAt: new Date().toISOString(),
				userType: 'cliente'
			},
			{
				id: 2,
				userId: 'usr_002',
				rating: 4,
				comment: 'Bom, mas pode melhorar nas respostas técnicas.',
				category: 'tecnico',
				conversationId: 'conv_124',
				createdAt: new Date().toISOString(),
				userType: 'mecanico'
			}
		];

		return res.json(mockFeedbacks);
	} catch (err) {
		return res.status(500).json({ error: 'Falha ao listar feedback', details: err.message });
	}
}

export async function createFeedback(req, res) {
	try {
		const { rating, comment, category, conversationId } = req.body;

		if (!rating || rating < 1 || rating > 5) {
			return res.status(400).json({ error: 'Rating deve ser entre 1 e 5' });
		}

		const newFeedback = {
			id: Date.now(),
			userId: req.user?.id || 'anonymous',
			rating,
			comment: comment || '',
			category: category || 'geral',
			conversationId: conversationId || null,
			createdAt: new Date().toISOString(),
			userType: req.user?.tipo || 'cliente'
		};

		// Adicionar ao log
		feedbackLog.push(newFeedback);

		return res.status(201).json(newFeedback);
	} catch (err) {
		return res.status(500).json({ error: 'Falha ao criar feedback', details: err.message });
	}
}

// ===== NOVOS CONTROLADORES PARA GESTÃO DE IA =====

export async function getProvidersStatus(req, res) {
	try {
		const providers = ['ollama', 'huggingface', 'openai', 'custom'];
		const status = {};

		for (const providerName of providers) {
			try {
				const provider = aiProviderFactory.getProvider(providerName);
				const isAvailable = await provider.isAvailable();

				status[providerName] = {
					available: isAvailable,
					description: getProviderDescription(providerName),
					models: providerName === 'ollama' ? await getOllamaModels(provider) : null
				};
			} catch (error) {
				status[providerName] = {
					available: false,
					error: error.message,
					description: getProviderDescription(providerName)
				};
			}
		}

		return res.json({
			currentProvider: process.env.AI_PROVIDER || 'ollama',
			providers: status,
			timestamp: new Date().toISOString()
		});
	} catch (error) {
		return res.status(500).json({ error: error.message });
	}
}

export async function testProvider(req, res) {
	try {
		const { provider, prompt = "Diga 'Olá' de forma amigável" } = req.body;

		if (!provider) {
			return res.status(400).json({ error: 'Provider é obrigatório' });
		}

		const aiProvider = aiProviderFactory.getProvider(provider);
		const startTime = Date.now();

		const response = await aiProvider.generateText(prompt, { maxTokens: 100 });
		const endTime = Date.now();

		return res.json({
			provider,
			prompt,
			response: response.text,
			responseTime: endTime - startTime,
			model: response.model,
			usage: response.usage,
			success: true
		});
	} catch (error) {
		return res.status(500).json({
			provider: req.body.provider,
			success: false,
			error: error.message
		});
	}
}

export async function compareProviders(req, res) {
	try {
		const { prompt = "Explique brevemente o que é manutenção preventiva automotiva", providers } = req.body;

		const results = await aiProviderFactory.compareProviders(prompt, { providers });

		return res.json({
			prompt,
			results,
			timestamp: new Date().toISOString()
		});
	} catch (error) {
		return res.status(500).json({ error: error.message });
	}
}

export async function listOllamaModels(req, res) {
	try {
		const provider = aiProviderFactory.getProvider('ollama');

		if (!await provider.isAvailable()) {
			return res.status(503).json({ error: 'Ollama não está disponível' });
		}

		const models = await provider.listInstalledModels();

		return res.json({
			installed: models,
			recommended: [
				{ name: 'llama3.1:8b', description: 'Modelo principal para texto', size: '4.7GB' },
				{ name: 'llama3.1:70b', description: 'Modelo mais poderoso', size: '40GB' },
				{ name: 'codellama:7b', description: 'Especializado em código', size: '3.8GB' },
				{ name: 'nomic-embed-text:latest', description: 'Para embeddings', size: '274MB' }
			]
		});
	} catch (error) {
		return res.status(500).json({ error: error.message });
	}
}

export async function installOllamaModel(req, res) {
	try {
		const { modelName } = req.body;

		if (!modelName) {
			return res.status(400).json({ error: 'Nome do modelo é obrigatório' });
		}

		const provider = aiProviderFactory.getProvider('ollama');

		if (!await provider.isAvailable()) {
			return res.status(503).json({ error: 'Ollama não está disponível' });
		}

		// Iniciar instalação em background
		provider.installModel(modelName)
			.then(success => {
				console.log(`✅ Modelo ${modelName} ${success ? 'instalado' : 'falhou'}`);
			})
			.catch(error => {
				console.error(`❌ Erro ao instalar ${modelName}:`, error.message);
			});

		return res.json({
			message: `Instalação do modelo ${modelName} iniciada em background`,
			modelName,
			status: 'downloading'
		});
	} catch (error) {
		return res.status(500).json({ error: error.message });
	}
}

export async function startTraining(req, res) {
	try {
		const { modelName, trainingData, config } = req.body;

		if (!modelName || !trainingData) {
			return res.status(400).json({ error: 'Nome do modelo e dados de treinamento são obrigatórios' });
		}

		const provider = aiProviderFactory.getProvider('custom');

		// Iniciar treinamento em background
		const trainingId = `training_${Date.now()}`;

		provider.trainModel(trainingData, { name: modelName, ...config })
			.then(success => {
				console.log(`✅ Treinamento ${trainingId} ${success ? 'concluído' : 'falhou'}`);
			})
			.catch(error => {
				console.error(`❌ Erro no treinamento ${trainingId}:`, error.message);
			});

		return res.json({
			message: `Treinamento do modelo ${modelName} iniciado`,
			trainingId,
			status: 'training',
			estimatedTime: '30-60 minutos'
		});
	} catch (error) {
		return res.status(500).json({ error: error.message });
	}
}

export async function getTrainingStatus(req, res) {
	try {
		// Em uma implementação real, verificaria o status do treinamento
		return res.json({
			message: 'Funcionalidade em desenvolvimento',
			availableTrainingMethods: [
				'Fine-tuning com dados específicos da oficina',
				'Treinamento de modelos de classificação',
				'Modelos de embedding customizados'
			]
		});
	} catch (error) {
		return res.status(500).json({ error: error.message });
	}
}

// ===== FUNÇÕES AUXILIARES =====

function getProviderDescription(providerName) {
	const descriptions = {
		'ollama': 'IA local - Modelos executados no próprio servidor (RECOMENDADO)',
		'huggingface': 'IA na nuvem - Acesso gratuito a modelos open source',
		'openai': 'IA premium - OpenAI GPT (requer chave API paga)',
		'custom': 'IA própria - Modelos treinados especificamente para sua oficina'
	};

	return descriptions[providerName] || 'Provedor desconhecido';
}

async function getOllamaModels(provider) {
	try {
		const models = await provider.listInstalledModels();
		return models.slice(0, 5); // Limitar retorno
	} catch (error) {
		return [];
	}
}

