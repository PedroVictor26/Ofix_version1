/**
 * 💬 LOCAL RESPONSE SERVICE
 * 
 * Gera respostas locais rápidas para:
 * - Saudações
 * - Menu de ajuda
 * - Mensagens de boas-vindas
 * 
 * SEM usar Agno AI - Resposta instantânea
 */

class LocalResponseService {
  /**
   * Gera saudação personalizada
   * @param {Object} usuario - Dados do usuário (opcional)
   * @returns {string}
   */
  gerarSaudacao(usuario = null) {
    const hora = new Date().getHours();
    let periodo;

    if (hora < 12) {
      periodo = 'Bom dia';
    } else if (hora < 18) {
      periodo = 'Boa tarde';
    } else {
      periodo = 'Boa noite';
    }

    const saudacoes = [
      `${periodo}! 👋 Sou o **Matias**, assistente virtual da oficina. Como posso ajudar?`,
      `${periodo}! 😊 Aqui é o **Matias**. O que você precisa hoje?`,
      `${periodo}! Sou o **Matias**, seu assistente automotivo. Está com alguma dúvida?`,
      `Olá! ${periodo}! 🚗 Sou o **Matias**. Pronto para ajudar!`
    ];

    const saudacao = saudacoes[Math.floor(Math.random() * saudacoes.length)];

    // Se tem nome do usuário, personaliza
    if (usuario && usuario.nome) {
      return saudacao.replace('!', `, ${usuario.nome.split(' ')[0]}!`);
    }

    return saudacao;
  }

  /**
   * Gera menu de ajuda completo
   * @returns {string}
   */
  gerarMenuAjuda() {
    return `🤖 **Assistente Matias - Como posso ajudar você:**

**⚡ AÇÕES RÁPIDAS:**
━━━━━━━━━━━━━━━━━━━━━━
• 📅 **Agendamento:** "Agendar revisão para segunda 14h"
• 🔍 **Consulta OS:** "Status da OS 1234"
• 📦 **Estoque:** "Tem filtro de óleo disponível?"
• 👤 **Cliente:** "Cadastrar novo cliente"
• 📊 **Estatísticas:** "Relatório do mês"

**💬 DÚVIDAS E DIAGNÓSTICOS:**
━━━━━━━━━━━━━━━━━━━━━━
• 🔧 **Problemas:** "Meu carro está fazendo barulho"
• ❓ **Dúvidas:** "O que é alinhamento e balanceamento?"
• 💰 **Preços:** "Quanto custa trocar óleo?"
• 📚 **Recomendações:** "Quando devo fazer revisão?"

**📋 EXEMPLOS DE USO:**
━━━━━━━━━━━━━━━━━━━━━━
\`\`\`
"Agendar troca de óleo para o João terça 15h"
"Meu carro está trepidando quando freio"
"Tem pastilha de freio em estoque?"
"Status da OS 2024-1234"
\`\`\`

💡 **Dica:** Pode falar naturalmente comigo! Entendo linguagem do dia a dia.

**Digite sua dúvida ou escolha uma opção acima!** 😊`;
  }

  /**
   * Gera resposta de despedida
   * @returns {string}
   */
  gerarDespedida() {
    const despedidas = [
      "Até logo! 👋 Estou aqui sempre que precisar!",
      "Tchau! 😊 Volte sempre que precisar de ajuda!",
      "Até mais! 🚗 Boa viagem e dirija com segurança!",
      "Até breve! Pode me chamar quando quiser! 👍"
    ];

    return despedidas[Math.floor(Math.random() * despedidas.length)];
  }

  /**
   * Gera confirmação genérica
   * @param {string} acao - Ação confirmada
   * @returns {string}
   */
  gerarConfirmacao(acao) {
    return `✅ **Confirmado!** ${acao}\n\nMais alguma coisa que posso fazer por você?`;
  }

  /**
   * Gera mensagem de erro amigável
   * @param {string} erro - Descrição do erro
   * @returns {string}
   */
  gerarMensagemErro(erro) {
    return `❌ **Ops! Algo deu errado...**

${erro}

💡 **O que posso fazer:**
• Tente reformular sua pergunta
• Digite "ajuda" para ver o menu
• Entre em contato com o suporte se o problema persistir

Estou aqui para ajudar! 😊`;
  }

  /**
   * Gera resposta para comando não reconhecido
   * @returns {string}
   */
  gerarComandoNaoReconhecido() {
    return `🤔 **Hmm, não entendi muito bem...**

Você pode:
• 📝 **Reformular** sua mensagem de forma mais clara
• ❓ **Digite "ajuda"** para ver o que posso fazer
• 💬 **Perguntar diretamente**, por exemplo:
  - "Agendar revisão"
  - "Status da OS 123"
  - "Meu carro está com problema"

Estou aqui para ajudar! 😊`;
  }

  /**
   * Gera sugestões contextuais
   * @param {string} contexto - Contexto da conversa
   * @returns {Array<string>}
   */
  gerarSugestoes(contexto) {
    const sugestoesPorContexto = {
      agendamento: [
        "📅 Agendar revisão",
        "📅 Marcar troca de óleo",
        "📅 Ver horários disponíveis"
      ],
      consulta: [
        "🔍 Ver status da OS",
        "🔍 Consultar histórico",
        "🔍 Buscar cliente"
      ],
      diagnostico: [
        "🔧 Descrever problema",
        "🔧 Barulho no motor",
        "🔧 Luz do painel acesa"
      ],
      orcamento: [
        "💰 Preço de revisão",
        "💰 Quanto custa freio",
        "💰 Valor de alinhamento"
      ],
      default: [
        "📅 Agendar serviço",
        "🔍 Consultar OS",
        "🔧 Reportar problema",
        "💰 Ver preços",
        "❓ Ajuda"
      ]
    };

    return sugestoesPorContexto[contexto] || sugestoesPorContexto.default;
  }

  /**
   * Gera resposta de agradecimento
   * @returns {string}
   */
  gerarAgradecimento() {
    const agradecimentos = [
      "Por nada! 😊 Estou aqui para isso!",
      "Sempre às ordens! 👍",
      "Disponha! É um prazer ajudar! 😊",
      "Fico feliz em ajudar! 🚗"
    ];

    return agradecimentos[Math.floor(Math.random() * agradecimentos.length)];
  }

  /**
   * Gera dica do dia (aleatória)
   * @returns {string}
   */
  gerarDicaDoDia() {
    const dicas = [
      "💡 **Dica:** Troque o óleo do motor a cada 5.000 km ou 6 meses!",
      "💡 **Dica:** Verifique a pressão dos pneus mensalmente para economia e segurança!",
      "💡 **Dica:** A revisão preventiva evita 80% dos problemas mecânicos!",
      "💡 **Dica:** Troque o filtro de ar condicionado a cada 10.000 km para ar puro!",
      "💡 **Dica:** Água no radiador deve ser verificada semanalmente!",
      "💡 **Dica:** Pastilhas de freio devem ser trocadas a cada 30.000 km!",
      "💡 **Dica:** Alinhamento e balanceamento aumentam a vida útil dos pneus!",
      "💡 **Dica:** Luz do motor acesa? Não ignore! Pode ser algo grave."
    ];

    return dicas[Math.floor(Math.random() * dicas.length)];
  }

  /**
   * Formata resposta padrão do serviço local
   * @param {string} mensagem - Mensagem principal
   * @param {string} tipo - Tipo de mensagem
   * @param {Object} metadata - Metadados adicionais
   * @returns {Object}
   */
  formatarResposta(mensagem, tipo = 'info', metadata = {}) {
    return {
      response: mensagem,
      tipo: tipo,
      metadata: {
        processed_by: 'BACKEND_LOCAL',
        processor_type: 'LOCAL_RESPONSE',
        timestamp: new Date().toISOString(),
        ...metadata
      }
    };
  }
}

// Exporta instância singleton
export default new LocalResponseService();
