/**
 * Provedor de IA Simplificado - Funciona SEM downloads
 * Sistema híbrido: IA online quando disponível + regras inteligentes como fallback
 */

class SimplifiedAIProvider {
  constructor() {
    this.name = 'simplified';
    this.useOnlineAI = false;
    this.huggingfaceClient = null;
    
    // Tentar inicializar HF se disponível
    this.initializeHuggingFace();
  }

  async initializeHuggingFace() {
    try {
      const { HfInference } = await import('@huggingface/inference');
      this.huggingfaceClient = new HfInference();
      this.useOnlineAI = true;
      console.log('✅ Hugging Face disponível online');
    } catch (error) {
      console.log('⚠️ Hugging Face não disponível, usando regras inteligentes');
      this.useOnlineAI = false;
    }
  }

  async isAvailable() {
    return true; // Sempre disponível (fallback garantido)
  }

  async generateText(prompt, options = {}) {
    // Tentar IA online primeiro
    if (this.useOnlineAI && this.huggingfaceClient) {
      try {
        const response = await this.huggingfaceClient.textGeneration({
          model: 'microsoft/DialoGPT-medium',
          inputs: prompt,
          parameters: {
            max_new_tokens: options.maxTokens || 200,
            temperature: options.temperature || 0.7,
          }
        });

        return {
          text: response.generated_text || response,
          model: 'DialoGPT-medium',
          usage: { totalTokens: prompt.length + (response.generated_text?.length || 0) }
        };
      } catch (error) {
        console.warn('⚠️ IA online falhou, usando fallback:', error.message);
      }
    }

    // Fallback: Sistema baseado em regras
    return this.generateWithRules(prompt, options);
  }

  generateWithRules(prompt, options) {
    const lowerPrompt = prompt.toLowerCase();
    
    // Regras para diferentes tipos de prompt
    if (lowerPrompt.includes('manutenção preventiva')) {
      return {
        text: "A manutenção preventiva automotiva consiste em verificações regulares do veículo para evitar problemas futuros. Inclui troca de óleo, filtros, verificação de pneus, freios e fluidos. É recomendada a cada 5.000-10.000 km ou conforme manual do fabricante.",
        model: 'rule-based',
        usage: { totalTokens: prompt.length + 200 }
      };
    }
    
    if (lowerPrompt.includes('diagnóstico') || lowerPrompt.includes('problema')) {
      return {
        text: "Para um diagnóstico preciso, é importante identificar os sintomas: ruídos, vibrações, vazamentos ou luzes de alerta. Cada sintoma pode indicar problemas específicos em motor, freios, suspensão ou sistema elétrico.",
        model: 'rule-based',
        usage: { totalTokens: prompt.length + 150 }
      };
    }
    
    if (lowerPrompt.includes('olá') || lowerPrompt.includes('oi')) {
      return {
        text: "Olá! Sou o assistente da oficina. Posso ajudar com diagnósticos, orientações sobre manutenção e informações sobre serviços automotivos. Como posso ajudar?",
        model: 'rule-based',
        usage: { totalTokens: prompt.length + 100 }
      };
    }
    
    // Resposta genérica
    return {
      text: "Entendi sua solicitação. Para melhor atendimento, pode fornecer mais detalhes sobre o problema ou serviço desejado? Nossa equipe está pronta para ajudar com qualquer questão automotiva.",
      model: 'rule-based',
      usage: { totalTokens: prompt.length + 120 }
    };
  }

  async analisarTriagemVeiculo(transcricao, options = {}) {
    // Tentar IA online primeiro
    if (this.useOnlineAI && this.huggingfaceClient) {
      try {
        const prompt = `Analise este problema automotivo: "${transcricao}". 
        Classifique em: motor, freios, suspensão, elétrica ou transmissão.
        Indique urgência: baixa, média ou alta.
        Estime tempo de reparo em horas.`;
        
        const response = await this.huggingfaceClient.textGeneration({
          model: 'microsoft/DialoGPT-medium',
          inputs: prompt,
          parameters: { max_new_tokens: 300, temperature: 0.4 }
        });
        
        // Tentar extrair informações da resposta
        return this.parseTriagemResponse(response.generated_text || response, transcricao);
      } catch (error) {
        console.warn('⚠️ Análise IA falhou, usando regras:', error.message);
      }
    }

    // Fallback: Análise por palavras-chave (muito confiável)
    return this.analyzeWithKeywords(transcricao);
  }

  parseTriagemResponse(aiResponse, transcricao) {
    const text = aiResponse.toLowerCase();
    
    // Extrair categoria
    let categoria = 'geral';
    if (text.includes('motor')) categoria = 'motor';
    else if (text.includes('freio')) categoria = 'freios';
    else if (text.includes('suspens')) categoria = 'suspensao';
    else if (text.includes('eletric')) categoria = 'eletrica';
    else if (text.includes('transmiss') || text.includes('cambio')) categoria = 'transmissao';
    
    // Extrair urgência
    let urgencia = 'media';
    if (text.includes('urgente') || text.includes('emergencia')) urgencia = 'alta';
    else if (text.includes('simples') || text.includes('rotina')) urgencia = 'baixa';
    
    // Extrair tempo (procurar números + horas)
    const timeMatch = text.match(/(\d+)\s*horas?/);
    const tempo = timeMatch ? parseInt(timeMatch[1]) : 3;
    
    return {
      categoria_principal: categoria,
      categoria_secundaria: 'analise_ia',
      tempo_estimado_horas: tempo,
      complexidade: urgencia === 'alta' ? 'alta' : 'media',
      urgencia,
      pecas_provaveis: this.suggestParts(categoria),
      proximos_passos: `Verificação ${categoria} baseada em análise IA`,
      confianca_analise: 85,
      sintomas_identificados: this.extractSymptoms(transcricao),
      diagnostico_preliminar: `Problema identificado: ${categoria} (análise IA + regras)`
    };
  }

  analyzeWithKeywords(transcricao) {
    const text = transcricao.toLowerCase();
    
    // Sistema de pontuação por categoria
    const scores = {
      motor: 0,
      freios: 0,
      suspensao: 0,
      eletrica: 0,
      transmissao: 0
    };
    
    // Palavras-chave com pesos
    const keywords = {
      motor: ['motor', 'barulho', 'vibra', 'óleo', 'fumaça', 'esquenta', 'fervendo'],
      freios: ['freio', 'para', 'pedal', 'rangendo', 'chiando', 'pastilha'],
      suspensao: ['suspens', 'amortecedor', 'mola', 'buraco', 'balanç', 'batente'],
      eletrica: ['luz', 'bateria', 'não liga', 'elétric', 'fusível', 'alternador'],
      transmissao: ['marcha', 'câmbio', 'embreagem', 'engata', 'acelera']
    };
    
    // Calcular pontuações
    for (const [categoria, words] of Object.entries(keywords)) {
      for (const word of words) {
        if (text.includes(word)) {
          scores[categoria] += 1;
        }
      }
    }
    
    // Encontrar categoria com maior pontuação
    const categoria = Object.keys(scores).reduce((a, b) => 
      scores[a] > scores[b] ? a : b
    );
    
    // Determinar urgência
    const urgencyWords = ['parou', 'não anda', 'vazando', 'fumaça', 'urgente', 'emergencia'];
    const urgencia = urgencyWords.some(word => text.includes(word)) ? 'alta' : 'media';
    
    // Mapear tempo e complexidade
    const timeMap = { motor: 6, freios: 3, suspensao: 4, eletrica: 2, transmissao: 5 };
    const complexityMap = { motor: 'alta', freios: 'media', suspensao: 'media', eletrica: 'baixa', transmissao: 'alta' };
    
    return {
      categoria_principal: categoria,
      categoria_secundaria: 'analise_palavras_chave',
      tempo_estimado_horas: timeMap[categoria] || 3,
      complexidade: complexityMap[categoria] || 'media',
      urgencia,
      pecas_provaveis: this.suggestParts(categoria),
      proximos_passos: `Diagnóstico ${categoria} recomendado`,
      confianca_analise: scores[categoria] > 0 ? 75 : 50,
      sintomas_identificados: this.extractSymptoms(transcricao),
      diagnostico_preliminar: `Possível problema: ${categoria} (confiança: ${scores[categoria] > 0 ? 'alta' : 'baixa'})`
    };
  }

  suggestParts(categoria) {
    const parts = {
      motor: ['Vela de ignição', 'Filtro de óleo', 'Filtro de ar', 'Correia'],
      freios: ['Pastilha de freio', 'Disco de freio', 'Fluido de freio'],
      suspensao: ['Amortecedor', 'Mola', 'Batente', 'Bucha'],
      eletrica: ['Bateria', 'Alternador', 'Fusível', 'Relé'],
      transmissao: ['Óleo de câmbio', 'Disco de embreagem', 'Filtro']
    };
    
    return parts[categoria] || ['Diagnóstico necessário'];
  }

  extractSymptoms(transcricao) {
    const symptoms = [];
    const text = transcricao.toLowerCase();
    
    if (text.includes('barulho') || text.includes('ruído')) symptoms.push('Ruído anômalo');
    if (text.includes('vibra') || text.includes('trepida')) symptoms.push('Vibração');
    if (text.includes('vazando') || text.includes('gotejando')) symptoms.push('Vazamento');
    if (text.includes('esquenta') || text.includes('fervendo')) symptoms.push('Superaquecimento');
    if (text.includes('não liga') || text.includes('difícil')) symptoms.push('Problema de partida');
    
    return symptoms.length > 0 ? symptoms : ['Sintomas relatados pelo cliente'];
  }

  async gerarMensagemWhatsApp(servico, statusNovo, statusAnterior) {
    const templates = {
      // Status principais do workflow simplificado
      AGUARDANDO: `🚗 Olá ${servico.cliente_nome}! Seu ${servico.veiculo_modelo} chegou na oficina. Já iniciamos a análise!`,
      EM_ANDAMENTO: `🔧 Mãos à obra! O reparo do seu ${servico.veiculo_modelo} já começou. Tudo sob controle!`,
      FINALIZADO: `✅ Pronto! Seu ${servico.veiculo_modelo} está finalizado e pode ser retirado!`,
      
      // Status legados (ainda suportados mas não usados no workflow principal)
      recebido: `🚗 Olá ${servico.cliente_nome}! Seu ${servico.veiculo_modelo} chegou na oficina. Já iniciamos a análise!`,
      em_analise: `🔍 ${servico.cliente_nome}, estamos analisando seu ${servico.veiculo_modelo}. Em breve teremos o diagnóstico!`,
      aguardando_pecas: `⏳ ${servico.cliente_nome}, identificamos o problema! Estamos providenciando as peças para seu ${servico.veiculo_modelo}.`,
      em_execucao: `🔧 Mãos à obra! O reparo do seu ${servico.veiculo_modelo} já começou. Tudo sob controle!`,
      pronto: `✅ Pronto! Seu ${servico.veiculo_modelo} está finalizado e pode ser retirado!`,
      entregue: `🎉 Obrigado pela confiança! Qualquer dúvida sobre o serviço, estamos aqui!`
    };
    
    return templates[statusNovo] || `📱 Status do seu ${servico.veiculo_modelo} atualizado: ${statusNovo}`;
  }
}

export default SimplifiedAIProvider;
