/**
 * 🗓️ AGENDAMENTO LOCAL SERVICE
 * 
 * Processa agendamentos LOCALMENTE sem usar Agno AI
 * - Extrai entidades com NLP
 * - Valida dados
 * - Guia usuário em multi-etapa
 * - Cria agendamento no banco
 * 
 * Baseado no plano de otimização multi-agente
 */

import { NLPService } from './nlp.service.js';
import prisma from '../config/database.js';

class AgendamentoLocalService {
  constructor() {
    // Mantém contextos temporários de agendamentos em andamento
    this.contextosAtivos = new Map();
    this.TEMPO_EXPIRACAO = 15 * 60 * 1000; // 15 minutos
  }

  /**
   * Processa agendamento localmente (SEM Agno AI)
   * @param {string} message - Mensagem do usuário
   * @param {string} userId - ID do usuário
   * @param {Object} contextoAtivo - Contexto de conversa anterior (opcional)
   * @returns {Object} - Resposta formatada
   */
  async processar(message, userId, contextoAtivo = null) {
    try {
      console.log('📅 [AGENDAMENTO LOCAL] Processando:', message.substring(0, 100));

      // 1️⃣ Extrai entidades da mensagem atual
      const entidadesNovos = NLPService.extrairEntidadesAgendamento(message);
      console.log('   📝 Entidades extraídas:', entidadesNovos);

      // 2️⃣ Busca contexto existente ou cria novo
      let contexto = this.obterContexto(userId);
      if (!contexto) {
        contexto = this.criarNovoContexto(userId);
      }

      // 3️⃣ Mescla entidades antigas com novas
      const entidades = {
        ...contexto.entidades,
        ...this.filtrarEntidadesValidas(entidadesNovos)
      };

      console.log('   🔄 Entidades mescladas:', entidades);

      // 4️⃣ Valida o que foi coletado
      const faltando = this.validarEntidades(entidades);

      // 5️⃣ Se falta algo, pergunta ao usuário
      if (faltando.length > 0) {
        this.atualizarContexto(userId, entidades);
        
        return {
          response: this.gerarPerguntaFaltante(faltando, entidades),
          tipo: 'pergunta',
          contexto_ativo: {
            tipo: 'agendamento_pendente',
            entidades_coletadas: entidades,
            faltando: faltando
          },
          aguardando_resposta: true,
          metadata: {
            processed_by: 'BACKEND_LOCAL',
            action: 'AGENDAMENTO_INCOMPLETO'
          }
        };
      }

      // 6️⃣ Tudo OK! Tenta criar o agendamento
      try {
        const agendamento = await this.criarAgendamento(entidades, userId);
        this.limparContexto(userId);

        return {
          response: this.formatarConfirmacao(agendamento),
          tipo: 'agendamento_confirmado',
          agendamento_criado: agendamento,
          contexto_ativo: null,
          metadata: {
            processed_by: 'BACKEND_LOCAL',
            action: 'AGENDAMENTO_CRIADO',
            agendamento_id: agendamento.id
          }
        };

      } catch (error) {
        console.error('❌ [AGENDAMENTO LOCAL] Erro ao criar:', error);
        this.limparContexto(userId);

        return {
          response: this.formatarErro(error),
          tipo: 'erro',
          error: error.message,
          contexto_ativo: null,
          metadata: {
            processed_by: 'BACKEND_LOCAL',
            action: 'AGENDAMENTO_ERRO'
          }
        };
      }

    } catch (error) {
      console.error('❌ [AGENDAMENTO LOCAL] Erro geral:', error);
      return {
        response: '❌ Desculpe, houve um erro ao processar seu agendamento. Pode tentar novamente?',
        tipo: 'erro',
        error: error.message
      };
    }
  }

  /**
   * Filtra entidades válidas (remove nulls e vazios)
   */
  filtrarEntidadesValidas(entidades) {
    const filtradas = {};
    for (const [key, value] of Object.entries(entidades)) {
      if (value !== null && value !== undefined && value !== '') {
        filtradas[key] = value;
      }
    }
    return filtradas;
  }

  /**
   * Valida quais entidades obrigatórias estão faltando
   */
  validarEntidades(entidades) {
    const obrigatorios = ['cliente', 'data', 'hora', 'servico'];
    return obrigatorios.filter(campo => !entidades[campo]);
  }

  /**
   * Gera pergunta inteligente sobre o que está faltando
   */
  gerarPerguntaFaltante(faltando, entidadesColetadas) {
    const perguntas = {
      cliente: "📝 **Qual o nome do cliente?**",
      veiculo: "🚗 **Qual o modelo do veículo?** (opcional)",
      data: "📅 **Para qual dia?** (exemplo: segunda, 15/11, amanhã)",
      hora: "⏰ **Qual horário prefere?** (exemplo: 14h, 10:30, manhã)",
      servico: "🔧 **Qual serviço deseja agendar?** (revisão, troca de óleo, freio, etc)"
    };

    let resumo = "";
    
    // Mostra o que já foi coletado (feedback positivo)
    const coletados = Object.entries(entidadesColetadas).filter(([k, v]) => v);
    if (coletados.length > 0) {
      resumo += "✅ **Já tenho:**\n";
      if (entidadesColetadas.cliente) resumo += `• Cliente: ${entidadesColetadas.cliente}\n`;
      if (entidadesColetadas.veiculo) resumo += `• Veículo: ${entidadesColetadas.veiculo}\n`;
      if (entidadesColetadas.data) resumo += `• Data: ${this.formatarData(entidadesColetadas.data)}\n`;
      if (entidadesColetadas.hora) resumo += `• Hora: ${entidadesColetadas.hora}\n`;
      if (entidadesColetadas.servico) resumo += `• Serviço: ${entidadesColetadas.servico}\n`;
      resumo += "\n";
    }

    // Pergunta o que falta
    if (faltando.length === 1) {
      return `${resumo}❓ Para concluir o agendamento, preciso saber:\n${perguntas[faltando[0]]}`;
    }

    return `${resumo}❓ **Para agendar, ainda preciso das seguintes informações:**\n\n${
      faltando.map(f => perguntas[f]).join('\n')
    }\n\n💡 *Pode me enviar tudo de uma vez!*`;
  }

  /**
   * Cria agendamento no banco de dados
   */
  async criarAgendamento(entidades, userId) {
    console.log('💾 [AGENDAMENTO LOCAL] Criando no banco:', entidades);

    // 1. Busca ou cria cliente
    const cliente = await this.buscarOuCriarCliente(entidades.cliente, userId);
    console.log('   👤 Cliente:', cliente.id, cliente.nomeCompleto);

    // 2. Busca ou cria veículo (se fornecido)
    let veiculo = null;
    if (entidades.veiculo) {
      veiculo = await this.buscarOuCriarVeiculo(entidades.veiculo, cliente.id);
      console.log('   🚗 Veículo:', veiculo?.id, veiculo?.modelo);
    }

    // 3. Monta data/hora
    const dataHora = this.montarDataHora(entidades.data, entidades.hora);
    console.log('   📅 Data/Hora:', dataHora);

    // 4. Cria ordem de serviço (agendamento)
    const numeroOS = await this.gerarNumeroOS();
    
    const agendamento = await prisma.servico.create({
      data: {
        numeroOs: numeroOS,
        status: 'AGUARDANDO',
        descricaoProblema: `Agendamento via chat: ${entidades.servico}`,
        dataEntrada: dataHora,
        dataPrevisaoEntrega: dataHora,
        clienteId: cliente.id,
        veiculoId: veiculo?.id || cliente.veiculos[0]?.id, // Usa primeiro veículo se não especificado
        oficinaId: cliente.oficinaId,
        observacoes: `Agendado pelo assistente Matias\nServiço solicitado: ${entidades.servico}`
      },
      include: {
        cliente: true,
        veiculo: true
      }
    });

    console.log('   ✅ Agendamento criado:', agendamento.id);
    return agendamento;
  }

  /**
   * Formata confirmação do agendamento
   */
  formatarConfirmacao(agendamento) {
    const data = new Date(agendamento.dataEntrada);
    const dataFormatada = data.toLocaleDateString('pt-BR', { 
      weekday: 'long', 
      day: '2-digit', 
      month: 'long', 
      year: 'numeric' 
    });
    const horaFormatada = data.toLocaleTimeString('pt-BR', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });

    return `✅ **Agendamento Confirmado!**

📋 **Detalhes:**
• **OS:** #${agendamento.numeroOs}
• **Cliente:** ${agendamento.cliente.nomeCompleto}
${agendamento.veiculo ? `• **Veículo:** ${agendamento.veiculo.modelo} - ${agendamento.veiculo.placa}` : ''}
• **Data:** ${dataFormatada}
• **Horário:** ${horaFormatada}
• **Serviço:** ${agendamento.descricaoProblema}

📍 **Lembrete:**
• Chegue 10 minutos antes do horário
• Traga a documentação do veículo
• Caso não possa comparecer, avise com antecedência

😊 **Mais alguma coisa que posso ajudar?**`;
  }

  /**
   * Formata mensagem de erro amigável
   */
  formatarErro(error) {
    const errosComuns = {
      'Unique constraint': 'Já existe um agendamento com esses dados. Quer reagendar?',
      'Foreign key constraint': 'Não encontrei o cliente ou veículo. Vamos cadastrar?',
      'Invalid date': 'A data ou hora informada não é válida. Pode informar novamente?'
    };

    for (const [tipo, mensagem] of Object.entries(errosComuns)) {
      if (error.message.includes(tipo)) {
        return `❌ **Ops!** ${mensagem}`;
      }
    }

    return `❌ **Não consegui criar o agendamento.**

Houve um problema: ${error.message}

💡 **Vamos tentar novamente?** Por favor, me informe:
• Nome do cliente
• Data e hora desejada  
• Tipo de serviço`;
  }

  /**
   * Monta objeto Date a partir de data e hora
   */
  montarDataHora(data, hora) {
    let dateTime;

    // Se data já é um Date object
    if (data instanceof Date) {
      dateTime = new Date(data);
    } else if (typeof data === 'string') {
      dateTime = new Date(data);
    } else {
      dateTime = new Date();
    }

    // Aplica hora se fornecida
    if (hora) {
      const [h, m] = hora.split(':').map(n => parseInt(n));
      dateTime.setHours(h, m || 0, 0, 0);
    }

    return dateTime;
  }

  /**
   * Formata data para exibição
   */
  formatarData(data) {
    if (data instanceof Date) {
      return data.toLocaleDateString('pt-BR', { 
        day: '2-digit', 
        month: '2-digit',
        weekday: 'short'
      });
    }
    return String(data);
  }

  /**
   * Busca ou cria cliente
   */
  async buscarOuCriarCliente(nomeCliente, userId) {
    // Busca cliente por nome aproximado
    const clientes = await prisma.cliente.findMany({
      where: {
        nomeCompleto: {
          contains: nomeCliente,
          mode: 'insensitive'
        }
      },
      include: {
        veiculos: true
      },
      take: 1
    });

    if (clientes.length > 0) {
      return clientes[0];
    }

    // Se não encontrou, cria novo cliente
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    return await prisma.cliente.create({
      data: {
        nomeCompleto: nomeCliente,
        oficinaId: user.oficinaId,
        telefone: '', // Pode pedir depois
        email: '',
        cpfCnpj: ''
      },
      include: {
        veiculos: true
      }
    });
  }

  /**
   * Busca ou cria veículo
   */
  async buscarOuCriarVeiculo(modeloVeiculo, clienteId) {
    // Busca veículo do cliente
    const veiculos = await prisma.veiculo.findMany({
      where: {
        clienteId: clienteId,
        modelo: {
          contains: modeloVeiculo,
          mode: 'insensitive'
        }
      },
      take: 1
    });

    if (veiculos.length > 0) {
      return veiculos[0];
    }

    // Cria novo veículo
    const cliente = await prisma.cliente.findUnique({
      where: { id: clienteId }
    });

    return await prisma.veiculo.create({
      data: {
        modelo: modeloVeiculo,
        marca: 'A definir',
        placa: `TEMP-${Date.now().toString().slice(-4)}`, // Placa temporária
        clienteId: clienteId,
        oficinaId: cliente.oficinaId
      }
    });
  }

  /**
   * Gera número único de OS
   */
  async gerarNumeroOS() {
    const ano = new Date().getFullYear().toString().slice(-2);
    const count = await prisma.servico.count();
    return `OS${ano}${(count + 1).toString().padStart(4, '0')}`;
  }

  /**
   * Gerenciamento de contexto (em memória)
   */
  obterContexto(userId) {
    const contexto = this.contextosAtivos.get(userId);
    if (!contexto) return null;

    // Verifica se expirou
    if (Date.now() - contexto.timestamp > this.TEMPO_EXPIRACAO) {
      this.contextosAtivos.delete(userId);
      return null;
    }

    return contexto;
  }

  criarNovoContexto(userId) {
    const contexto = {
      userId,
      entidades: {},
      timestamp: Date.now()
    };
    this.contextosAtivos.set(userId, contexto);
    return contexto;
  }

  atualizarContexto(userId, entidades) {
    const contexto = this.obterContexto(userId) || this.criarNovoContexto(userId);
    contexto.entidades = entidades;
    contexto.timestamp = Date.now();
    this.contextosAtivos.set(userId, contexto);
  }

  limparContexto(userId) {
    this.contextosAtivos.delete(userId);
  }

  // Limpeza periódica de contextos expirados
  limparContextosExpirados() {
    const agora = Date.now();
    for (const [userId, contexto] of this.contextosAtivos.entries()) {
      if (agora - contexto.timestamp > this.TEMPO_EXPIRACAO) {
        this.contextosAtivos.delete(userId);
      }
    }
  }
}

// Exporta instância singleton
const service = new AgendamentoLocalService();

// Limpa contextos expirados a cada 5 minutos
setInterval(() => service.limparContextosExpirados(), 5 * 60 * 1000);

export default service;
