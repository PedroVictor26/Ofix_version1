// =====================================================
// ARQUIVO 1: ofix-backend/src/services/message-classifier.service.js
// =====================================================

/**
 * Classificador Inteligente de Mensagens
 * Decide se processa localmente ou envia para Agno AI
 */
class MessageClassifier {
  constructor() {
    // Padrões para AÇÕES ESTRUTURADAS (processar localmente)
    this.actionPatterns = {
      AGENDAMENTO: {
        keywords: ['agendar', 'marcar', 'reservar', 'agendar', 'horário', 'horario'],
        confidence: 0.95,
        requiresDB: true
      },
      CADASTRO_CLIENTE: {
        keywords: ['cadastrar cliente', 'novo cliente', 'adicionar cliente', 'registrar cliente'],
        confidence: 0.95,
        requiresDB: true
      },
      CONSULTA_OS: {
        keywords: ['status da os', 'ordem de serviço', 'ordem de servico', 'os número', 'os numero', 'os #'],
        confidence: 0.9,
        requiresDB: true
      },
      CONSULTA_ESTOQUE: {
        keywords: ['tem peça', 'tem peca', 'disponível', 'disponivel', 'estoque de', 'tem em estoque'],
        confidence: 0.9,
        requiresDB: true
      }
    };

    // Padrões para CONVERSAS COMPLEXAS (enviar para Agno)
    this.conversationPatterns = {
      DIAGNOSTICO: {
        keywords: ['barulho', 'problema', 'defeito', 'não funciona', 'nao funciona', 
                   'falha', 'quebrou', 'parou', 'luz acendeu'],
        confidence: 0.85
      },
      DUVIDA_TECNICA: {
        keywords: ['o que é', 'o que e', 'como funciona', 'para que serve', 
                   'qual a diferença', 'qual a diferenca', 'explica'],
        confidence: 0.9
      },
      ORCAMENTO: {
        keywords: ['quanto custa', 'preço', 'preco', 'valor', 'orçamento', 'orcamento'],
        confidence: 0.85
      },
      RECOMENDACAO: {
        keywords: ['recomenda', 'devo fazer', 'preciso trocar', 'quando trocar', 
                   'intervalo de', 'manutenção preventiva', 'manutencao preventiva'],
        confidence: 0.85
      }
    };
  }

  /**
   * Classifica a mensagem
   */
  classify(message) {
    const messageLower = message.toLowerCase();

    // 1. Verifica se é uma AÇÃO ESTRUTURADA
    for (const [action, pattern] of Object.entries(this.actionPatterns)) {
      if (this.matchesPattern(messageLower, pattern.keywords)) {
        return {
          type: 'ACTION',
          subtype: action,
          confidence: pattern.confidence,
          processor: 'BACKEND_LOCAL',
          reason: 'Structured action requiring database operation'
        };
      }
    }

    // 2. Verifica se é uma CONVERSA COMPLEXA
    for (const [conversation, pattern] of Object.entries(this.conversationPatterns)) {
      if (this.matchesPattern(messageLower, pattern.keywords)) {
        return {
          type: 'CONVERSATION',
          subtype: conversation,
          confidence: pattern.confidence,
          processor: 'AGNO_AI',
          reason: 'Complex conversation requiring LLM'
        };
      }
    }

    // 3. Verifica se é saudação (processar localmente)
    if (this.isGreeting(messageLower)) {
      return {
        type: 'GREETING',
        confidence: 0.95,
        processor: 'BACKEND_LOCAL',
        reason: 'Simple greeting'
      };
    }

    // 4. Verifica se é pedido de ajuda (processar localmente)
    if (this.isHelpRequest(messageLower)) {
      return {
        type: 'HELP',
        confidence: 0.95,
        processor: 'BACKEND_LOCAL',
        reason: 'Help menu request'
      };
    }

    // 5. DEFAULT: Considera conversa complexa (Agno AI)
    return {
      type: 'CONVERSATION',
      subtype: 'GENERAL',
      confidence: 0.5,
      processor: 'AGNO_AI',
      reason: 'Default fallback to AI for unknown patterns'
    };
  }

  matchesPattern(text, keywords) {
    return keywords.some(keyword => text.includes(keyword));
  }

  isGreeting(text) {
    const greetings = ['oi', 'olá', 'ola', 'bom dia', 'boa tarde', 'boa noite', 'hey', 'opa'];
    return greetings.some(g => text === g || text.startsWith(g + ' '));
  }

  isHelpRequest(text) {
    const helpKeywords = ['ajuda', 'help', 'o que você pode fazer', 'o que voce pode fazer', 
                          'comandos', 'menu', 'opções', 'opcoes'];
    return helpKeywords.some(h => text.includes(h));
  }
}

module.exports = new MessageClassifier();

// =====================================================
// ARQUIVO 2: ofix-backend/src/routes/chat.routes.js (REFATORADO)
// =====================================================

const messageClassifier = require('../services/message-classifier.service');
const agendamentoService = require('../services/agendamento-local.service');
const { chamarAgnoAI } = require('../services/agno.service');

router.post('/chat', async (req, res) => {
  const { message, usuario_id } = req.body;

  try {
    // 1. CLASSIFICA A MENSAGEM
    const classification = messageClassifier.classify(message);
    
    console.log(`📊 Classificação:`, {
      tipo: classification.type,
      subtipo: classification.subtype,
      processador: classification.processor,
      confianca: classification.confidence
    });

    // 2. ROTEAMENTO BASEADO NA CLASSIFICAÇÃO
    let response;

    if (classification.processor === 'BACKEND_LOCAL') {
      // PROCESSA LOCALMENTE (rápido e confiável)
      response = await processarLocal(message, classification, usuario_id, req);
    } else {
      // ENVIA PARA AGNO AI (inteligente)
      response = await chamarAgnoAI(message, usuario_id, classification.subtype);
    }

    // 3. SALVA NO HISTÓRICO
    await salvarConversa(usuario_id, message, response);

    // 4. RETORNA RESPOSTA
    res.json({
      success: true,
      ...response,
      metadata: {
        classification,
        processed_by: classification.processor,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('❌ Erro no chat:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      response: 'Desculpe, tive um problema ao processar sua mensagem. Pode tentar novamente?'
    });
  }
});

/**
 * Processa mensagens localmente (sem Agno AI)
 */
async function processarLocal(message, classification, userId, req) {
  switch (classification.type) {
    case 'GREETING':
      return {
        response: gerarSaudacao(),
        tipo: 'saudacao'
      };

    case 'HELP':
      return {
        response: gerarMenuAjuda(),
        tipo: 'ajuda'
      };

    case 'ACTION':
      return await processarAcao(message, classification.subtype, userId, req);

    default:
      throw new Error('Classification type not handled locally');
  }
}

/**
 * Processa ações estruturadas
 */
async function processarAcao(message, actionType, userId, req) {
  switch (actionType) {
    case 'AGENDAMENTO':
      return await agendamentoService.processar(message, userId, req.contexto_ativo);

    case 'CONSULTA_OS':
      return await consultarOS(message, userId);

    case 'CONSULTA_ESTOQUE':
      return await consultarEstoque(message);

    case 'CADASTRO_CLIENTE':
      return await cadastrarCliente(message, userId);

    default:
      throw new Error(`Action type ${actionType} not implemented`);
  }
}

function gerarSaudacao() {
  const saudacoes = [
    "Olá! Sou o Matias, assistente da oficina. Como posso ajudar?",
    "Oi! Sou o Matias. Em que posso ajudá-lo hoje?",
    "Olá! Pronto para ajudar. O que você precisa?"
  ];
  return saudacoes[Math.floor(Math.random() * saudacoes.length)];
}

function gerarMenuAjuda() {
  return `🤖 **Assistente Matias - Como posso ajudar:**

**⚡ AÇÕES RÁPIDAS:**
• "Agendar revisão para segunda 14h"
• "Status da OS 1234"
• "Tem filtro de óleo disponível?"
• "Cadastrar novo cliente"

**💬 DÚVIDAS E DIAGNÓSTICOS:**
• "Meu carro está fazendo barulho"
• "O que é alinhamento?"
• "Quanto custa troca de óleo?"
• "Quando devo fazer revisão?"

**📊 CONSULTAS:**
• "Estatísticas da oficina"
• "Meus agendamentos"

Digite sua dúvida ou escolha uma opção! 😊`;
}

// =====================================================
// ARQUIVO 3: ofix-backend/src/services/agendamento-local.service.js
// =====================================================

const { extrairEntidadesAgendamento } = require('./nlp.service');
const prisma = require('./prisma');

class AgendamentoLocalService {
  /**
   * Processa agendamento localmente (SEM Agno AI)
   */
  async processar(message, userId, contextoAtivo) {
    // 1. Extrai entidades da mensagem
    const entidades = extrairEntidadesAgendamento(message);

    // 2. Se tem contexto ativo, combina dados
    if (contextoAtivo?.tipo === 'agendamento_pendente') {
      Object.assign(entidades, contextoAtivo.entidades_coletadas);
    }

    // 3. Valida o que foi coletado
    const faltando = this.validarEntidades(entidades);

    // 4. Se falta algo, pergunta
    if (faltando.length > 0) {
      return {
        response: this.gerarPerguntaFaltante(faltando, entidades),
        tipo: 'pergunta',
        contexto_ativo: {
          tipo: 'agendamento_pendente',
          entidades_coletadas: entidades
        },
        aguardando_resposta: true
      };
    }

    // 5. Tudo OK! Cria o agendamento
    try {
      const agendamento = await this.criarAgendamento(entidades, userId);

      return {
        response: this.formatarConfirmacao(agendamento),
        tipo: 'agendamento_confirmado',
        agendamento_criado: agendamento,
        contexto_ativo: null // Limpa contexto
      };

    } catch (error) {
      return {
        response: `❌ Não consegui criar o agendamento: ${error.message}\n\nPode tentar novamente com outros detalhes?`,
        tipo: 'erro',
        error: error.message
      };
    }
  }

  validarEntidades(entidades) {
    const obrigatorios = ['cliente', 'data', 'hora', 'servico'];
    return obrigatorios.filter(campo => !entidades[campo]);
  }

  gerarPerguntaFaltante(faltando, entidadesColetadas) {
    const perguntas = {
      cliente: "📝 Qual o nome do cliente?",
      veiculo: "🚗 Qual o modelo do veículo?",
      data: "📅 Para qual dia? (exemplo: segunda, 15/11)",
      hora: "⏰ Qual horário prefere? (exemplo: 14h, 10:30)",
      servico: "🔧 Qual serviço deseja agendar? (revisão, troca de óleo, freio, etc)"
    };

    // Mostra o que já foi coletado
    let resumo = "";
    if (Object.values(entidadesColetadas).some(v => v)) {
      resumo += "\n✅ **Já tenho:**\n";
      if (entidadesColetadas.cliente) resumo += `• Cliente: ${entidadesColetadas.cliente}\n`;
      if (entidadesColetadas.veiculo) resumo += `• Veículo: ${entidadesColetadas.veiculo}\n`;
      if (entidadesColetadas.data) resumo += `• Data: ${entidadesColetadas.data}\n`;
      if (entidadesColetadas.hora) resumo += `• Hora: ${entidadesColetadas.hora}\n`;
      if (entidadesColetadas.servico) resumo += `• Serviço: ${entidadesColetadas.servico}\n`;
    }

    // Pergunta o que falta
    if (faltando.length === 1) {
      return `${resumo}\n❓ Para concluir, preciso saber:\n${perguntas[faltando[0]]}`;
    }

    return `${resumo}\n❓ Para agendar, ainda preciso das seguintes informações:\n${
      faltando.map(f => perguntas[f]).join('\n')
    }`;
  }

  async criarAgendamento(entidades, userId) {
    // Busca ou cria cliente
    const cliente = await this.buscarOuCriarCliente(entidades.cliente, userId);

    // Busca ou cria veículo
    let veiculo = null;
    if (entidades.veiculo) {
      veiculo = await this.buscarOuCriarVeiculo(entidades.veiculo, cliente.id);
    }

    // Cria agendamento
    const agendamento = await prisma.agendamento.create({
      data: {
        cliente_id: cliente.id,
        veiculo_id: veiculo?.id,
        data_hora: this.montarDataHora(entidades.data, entidades.hora),
        servico: entidades.servico,
        status: 'AGENDADO',
        observacoes: `Agendamento via chat - Matias IA`
      },
      include: {
        cliente: true,
        veiculo: true
      }
    });

    return agendamento;
  }

  formatarConfirmacao(agendamento) {
    const data = new Date(agendamento.data_hora);
    const dataFormatada = data.toLocaleDateString('pt-BR', { 
      weekday: 'long', 
      day: '2-digit', 
      month: '2-digit', 
      year: 'numeric' 
    });
    const horaFormatada = data.toLocaleTimeString('pt-BR', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });

    return `✅ **Agendamento Confirmado!**

📋 **Detalhes:**
• Cliente: ${agendamento.cliente.nome}
${agendamento.veiculo ? `• Veículo: ${agendamento.veiculo.modelo} - ${agendamento.veiculo.placa}` : ''}
• Data: ${dataFormatada}
• Horário: ${horaFormatada}
• Serviço: ${agendamento.servico}

📍 **Lembrete:**
• Chegue 10 minutos antes
• Traga a documentação do veículo
• Caso não possa comparecer, avise com antecedência

Alguma outra coisa que posso ajudar? 😊`;
  }

  montarDataHora(data, hora) {
    // Implementação simplificada - você já tem isso
    const [h, m] = hora.split(':');
    const dateTime = new Date(data);
    dateTime.setHours(parseInt(h), parseInt(m), 0);
    return dateTime;
  }

  async buscarOuCriarCliente(nomeCliente, userId) {
    // Busca cliente por nome
    let cliente = await prisma.cliente.findFirst({
      where: {
        nome: {
          contains: nomeCliente,
          mode: 'insensitive'
        }
      }
    });

    // Se não encontrou, cria um novo
    if (!cliente) {
      cliente = await prisma.cliente.create({
        data: {
          nome: nomeCliente,
          usuario_id: userId,
          telefone: '', // Pode pedir depois
          email: ''
        }
      });
    }

    return cliente;
  }

  async buscarOuCriarVeiculo(modeloVeiculo, clienteId) {
    // Similar ao cliente
    let veiculo = await prisma.veiculo.findFirst({
      where: {
        cliente_id: clienteId,
        modelo: {
          contains: modeloVeiculo,
          mode: 'insensitive'
        }
      }
    });

    if (!veiculo) {
      veiculo = await prisma.veiculo.create({
        data: {
          cliente_id: clienteId,
          modelo: modeloVeiculo,
          placa: 'A DEFINIR' // Pode pedir depois
        }
      });
    }

    return veiculo;
  }
}

module.exports = new AgendamentoLocalService();

// =====================================================
// ARQUIVO 4: matias_agno/main.py (SIMPLIFICADO)
// =====================================================

"""
AGENTE MATIAS - FOCADO EM CONVERSAÇÃO
Responsável APENAS por:
- Diagnósticos técnicos
- Explicações
- Recomendações
- Orçamentos estimados
"""

from agno.agent import Agent
from agno.models.groq import Groq

# PROMPT FOCADO - Sem lógica de agendamento
SYSTEM_INSTRUCTIONS = """Você é o Matias, consultor técnico especializado em oficina automotiva.

🎯 SEU PAPEL:
Você é um CONSULTOR, não um sistema de agendamento. 
Foque em DIAGNÓSTICOS, EXPLICAÇÕES e RECOMENDAÇÕES técnicas.

✅ O QUE VOCÊ FAZ BEM:
1. Diagnosticar problemas por sintomas
2. Explicar procedimentos técnicos
3. Recomendar manutenções preventivas
4. Dar orçamentos ESTIMADOS (faixas de preço)
5. Responder dúvidas sobre mecânica automotiva
6. Interpretar sintomas e sugerir soluções

❌ O QUE VOCÊ NÃO FAZ:
1. Criar agendamentos (o sistema faz isso)
2. Cadastrar clientes (o sistema faz isso)
3. Consultar banco de dados (o sistema faz isso)
4. Acessar informações específicas de OS

📚 USE A BASE DE CONHECIMENTO:
Sempre busque informações nos documentos antes de responder.
Se não encontrar informação específica, seja honesto.

💰 PREÇOS DE REFERÊNCIA (mercado brasileiro):
- Troca de óleo: R$ 80-120
- Alinhamento e balanceamento: R$ 60-100
- Pastilhas de freio: R$ 150-300 (dianteiras) / R$ 100-200 (traseiras)
- Suspensão/amortecedores: R$ 200-800 por unidade
- Diagnóstico eletrônico: R$ 50-100
- Bateria: R$ 300-600
- Pneus: R$ 200-500 cada

🗣️ TOM:
- Seja técnico mas didático
- Use linguagem acessível
- Pergunte detalhes quando necessário
- Sempre termine oferecendo mais ajuda

Responda em português brasileiro, de forma clara e objetiva."""

# Configuração do agente
assistente = Agent(
    name="Matias",
    role="Consultor Técnico Automotivo",
    model=Groq(id="llama-3.1-70b-instant", api_key=GROQ_API_KEY),
    instructions=[SYSTEM_INSTRUCTIONS],
    markdown=True
)

@app.post("/chat")
async def chat(request: ChatRequest):
    """
    Processa conversa técnica
    """
    try:
        # Busca na base de conhecimento
        context = ""
        if knowledge_wrapper:
            results = knowledge_wrapper.search(request.message, limit=3)
            if results:
                context = "\n\n📚 Contexto da base de conhecimento:\n"
                for i, result in enumerate(results, 1):
                    context += f"\n{i}. {result.content[:300]}...\n"
        
        # Monta prompt completo
        full_message = f"{request.message}\n{context}"
        
        # Gera resposta
        response = assistente.run(full_message, stream=False)
        
        return {
            "response": str(response.content),
            "status": "success",
            "model": "groq-llama-3.1-70b",
            "used_knowledge_base": bool(context)
        }
        
    except Exception as e:
        return {
            "response": "Desculpe, tive um problema técnico. Pode reformular sua pergunta?",
            "status": "error",
            "error": str(e)
        }

# =====================================================
// FIM DA IMPLEMENTAÇÃO
// =====================================================

// 📝 RESUMO DA MUDANÇA:
// 
// ANTES:
// - Tudo passava pelo Agno AI
// - Lento (4-5s por mensagem)
// - Complexo de debugar
// - Propenso a erros de parsing
//
// DEPOIS:
// - Ações estruturadas: Backend (500ms)
// - Conversas complexas: Agno AI (4s, mas vale a pena)
// - Fácil de debugar
// - Confiável e escalável
