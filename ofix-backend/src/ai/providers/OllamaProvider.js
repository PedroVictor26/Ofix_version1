/**
 * Provedor Ollama para IA Local
 * Executa modelos LLM localmente sem dependências externas
 */

import { Ollama } from 'ollama';

class OllamaProvider {
  constructor() {
    this.client = new Ollama({
      host: process.env.OLLAMA_HOST || 'http://localhost:11434'
    });
    this.defaultModel = process.env.OLLAMA_MODEL || 'llama3.1:8b';
    this.whisperModel = 'whisper:latest';
  }

  async isAvailable() {
    try {
      await this.client.list();
      return true;
    } catch (error) {
      console.warn('🦙 Ollama não disponível:', error.message);
      return false;
    }
  }

  async generateText(prompt, options = {}) {
    const response = await this.client.generate({
      model: options.model || this.defaultModel,
      prompt,
      stream: false,
      options: {
        temperature: options.temperature || 0.7,
        max_tokens: options.maxTokens || 1000,
        top_p: options.topP || 0.9
      }
    });

    return {
      text: response.response,
      model: response.model,
      usage: {
        promptTokens: response.prompt_eval_count || 0,
        completionTokens: response.eval_count || 0,
        totalTokens: (response.prompt_eval_count || 0) + (response.eval_count || 0)
      }
    };
  }

  async generateStructuredResponse(prompt, schema, options = {}) {
    const structuredPrompt = `${prompt}

Responda APENAS em formato JSON válido seguindo este schema:
${JSON.stringify(schema, null, 2)}

Sua resposta deve ser um JSON válido, sem texto adicional:`;

    const response = await this.generateText(structuredPrompt, {
      ...options,
      temperature: 0.3 // Menor temperatura para respostas mais consistentes
    });

    try {
      return JSON.parse(response.text);
    } catch (error) {
      // Tentar extrair JSON da resposta
      const jsonMatch = response.text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      throw new Error('Resposta não está em formato JSON válido');
    }
  }

  async transcribeAudio(audioBuffer, options = {}) {
    // Para transcrição local, seria necessário usar whisper.cpp ou similar
    // Por enquanto, vamos simular com um placeholder
    throw new Error('Transcrição de áudio local ainda não implementada. Use OpenAI para esta funcionalidade.');
  }

  // Método específico para triagem automotiva
  async analisarTriagemVeiculo(transcricao, options = {}) {
    const prompt = `Você é um especialista em diagnóstico automotivo. Analise a descrição do problema e retorne uma análise estruturada.

DESCRIÇÃO DO CLIENTE: "${transcricao}"

Analise e categorize o problema seguindo estas regras:
- Seja específico e técnico
- Base-se em conhecimento automotivo real
- Considere a urgência do problema
- Sugira próximos passos práticos

Responda em JSON com esta estrutura exata:`;

    const schema = {
      categoria_principal: "string (ex: motor, freios, suspensao, eletrica, transmissao)",
      categoria_secundaria: "string (mais específico)",
      tempo_estimado_horas: "number (1-40)",
      complexidade: "string (baixa|media|alta)",
      urgencia: "string (baixa|media|alta|emergencia)",
      pecas_provaveis: ["array de strings"],
      proximos_passos: "string (ação específica para o mecânico)",
      confianca_analise: "number (0-100)",
      sintomas_identificados: ["array de strings"],
      diagnostico_preliminar: "string"
    };

    return await this.generateStructuredResponse(prompt, schema, {
      temperature: 0.4,
      maxTokens: 800
    });
  }

  // Método para geração de mensagens WhatsApp
  async gerarMensagemWhatsApp(servico, statusNovo, statusAnterior) {
    const prompt = `Gere uma mensagem WhatsApp profissional e amigável para cliente de oficina mecânica.

DADOS DO SERVIÇO:
- Cliente: ${servico.cliente_nome}
- Veículo: ${servico.veiculo_modelo} ${servico.veiculo_ano || ''}
- Status anterior: ${statusAnterior}
- Status novo: ${statusNovo}
- Mecânico: ${servico.mecanico_nome || 'Nossa equipe'}
- Prazo estimado: ${servico.prazo_estimado || 'Em breve'}

REGRAS:
- Máximo 160 caracteres
- Tom profissional mas amigável
- Inclua emoji apropriado
- Seja específico sobre o status
- Tranquilize o cliente

Responda apenas com a mensagem, sem aspas ou formatação adicional:`;

    const response = await this.generateText(prompt, {
      temperature: 0.6,
      maxTokens: 100
    });

    return response.text.trim();
  }

  // Método para alertas inteligentes
  async analisarAlertaPrazo(servico, horasAtraso) {
    const prompt = `Analise este serviço automotivo em atraso e sugira 3 ações específicas e práticas.

SITUAÇÃO:
- Serviço: ${servico.descricao}
- Cliente: ${servico.cliente_nome}
- Mecânico: ${servico.mecanico?.nome || 'Não alocado'}
- Status: ${servico.status}
- Horas de atraso: ${horasAtraso}

Você deve sugerir ações ESPECÍFICAS e PRÁTICAS que podem ser tomadas imediatamente.

Responda em JSON:`;

    const schema = {
      prioridade: "string (baixa|media|alta|critica)",
      resumo: "string (resumo da situação em 1 linha)",
      acoes: [
        "string (ação específica 1)",
        "string (ação específica 2)", 
        "string (ação específica 3)"
      ],
      impacto_cliente: "string (como isso afeta o cliente)",
      tempo_resolucao_estimado: "string (ex: '30 minutos', '2 horas')"
    };

    return await this.generateStructuredResponse(prompt, schema, {
      temperature: 0.3,
      maxTokens: 500
    });
  }

  // Método para embeddings (usando modelo local se disponível)
  async generateEmbedding(text) {
    try {
      const response = await this.client.embeddings({
        model: 'nomic-embed-text:latest',
        prompt: text
      });
      return response.embedding;
    } catch (error) {
      console.warn('❌ Embedding local não disponível:', error.message);
      throw new Error('Embedding local não configurado');
    }
  }

  // Método para instalar modelos automaticamente
  async installModel(modelName) {
    try {
      console.log(`📥 Baixando modelo ${modelName}...`);
      await this.client.pull({ model: modelName, stream: false });
      console.log(`✅ Modelo ${modelName} instalado com sucesso`);
      return true;
    } catch (error) {
      console.error(`❌ Erro ao instalar modelo ${modelName}:`, error.message);
      return false;
    }
  }

  // Método para listar modelos instalados
  async listInstalledModels() {
    try {
      const response = await this.client.list();
      return response.models.map(model => ({
        name: model.name,
        size: model.size,
        modified: model.modified_at
      }));
    } catch (error) {
      console.error('❌ Erro ao listar modelos:', error.message);
      return [];
    }
  }
}

export default OllamaProvider;
