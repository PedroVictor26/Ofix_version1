/**
 * Provedor OpenAI (mantido para compatibilidade)
 */

import OpenAI from 'openai';

class OpenAIProvider {
  constructor() {
    this.client = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });
    this.defaultModel = process.env.OPENAI_MODEL || 'gpt-4o-mini';
    this.whisperModel = 'whisper-1';
  }

  async isAvailable() {
    try {
      if (!process.env.OPENAI_API_KEY) {
        console.warn('🔑 Chave OpenAI não configurada');
        return false;
      }
      return true;
    } catch (error) {
      console.warn('🤖 OpenAI não disponível:', error.message);
      return false;
    }
  }

  async generateText(prompt, options = {}) {
    const response = await this.client.chat.completions.create({
      model: options.model || this.defaultModel,
      messages: [{ role: 'user', content: prompt }],
      max_tokens: options.maxTokens || 1000,
      temperature: options.temperature || 0.7,
      top_p: options.topP || 0.9
    });

    return {
      text: response.choices[0].message.content,
      model: response.model,
      usage: response.usage
    };
  }

  async generateStructuredResponse(prompt, schema, options = {}) {
    const response = await this.client.chat.completions.create({
      model: options.model || this.defaultModel,
      messages: [{ role: 'user', content: prompt }],
      response_format: { type: "json_object" },
      max_tokens: options.maxTokens || 800,
      temperature: options.temperature || 0.3
    });

    return JSON.parse(response.choices[0].message.content);
  }

  async transcribeAudio(audioBuffer, options = {}) {
    const response = await this.client.audio.transcriptions.create({
      file: audioBuffer,
      model: this.whisperModel,
      language: 'pt'
    });

    return {
      text: response.text,
      confidence: 0.95, // OpenAI não retorna confidence
      language: 'pt'
    };
  }

  async analisarTriagemVeiculo(transcricao, options = {}) {
    const prompt = `Você é um especialista em diagnóstico automotivo. Analise a descrição do problema e retorne uma análise estruturada.

DESCRIÇÃO DO CLIENTE: "${transcricao}"

Retorne um JSON com esta estrutura exata:
{
  "categoria_principal": "string (motor|freios|suspensao|eletrica|transmissao|ar_condicionado)",
  "categoria_secundaria": "string",
  "tempo_estimado_horas": "number",
  "complexidade": "baixa|media|alta",
  "urgencia": "baixa|media|alta|emergencia",
  "pecas_provaveis": ["array de strings"],
  "proximos_passos": "string",
  "confianca_analise": "number (0-100)",
  "sintomas_identificados": ["array de strings"],
  "diagnostico_preliminar": "string"
}`;

    return await this.generateStructuredResponse(prompt, {}, {
      temperature: 0.4,
      maxTokens: 800
    });
  }

  async gerarMensagemWhatsApp(servico, statusNovo, statusAnterior) {
    const prompt = `Gere uma mensagem WhatsApp profissional para atualização de status de serviço automotivo.

DADOS:
- Cliente: ${servico.cliente_nome}
- Veículo: ${servico.veiculo_modelo}
- Status anterior: ${statusAnterior}
- Status novo: ${statusNovo}

REGRAS:
- Máximo 160 caracteres
- Tom profissional mas amigável
- Inclua emoji apropriado
- Seja específico

Responda apenas com a mensagem:`;

    const response = await this.generateText(prompt, {
      temperature: 0.6,
      maxTokens: 100
    });

    return response.text.trim();
  }

  async analisarAlertaPrazo(servico, horasAtraso) {
    const prompt = `Analise este atraso em serviço automotivo e sugira ações.

SITUAÇÃO:
- Serviço: ${servico.descricao}
- Cliente: ${servico.cliente_nome}
- Atraso: ${horasAtraso} horas
- Status: ${servico.status}

Retorne JSON com sugestões específicas:
{
  "prioridade": "baixa|media|alta|critica",
  "resumo": "string",
  "acoes": ["ação 1", "ação 2", "ação 3"],
  "impacto_cliente": "string",
  "tempo_resolucao_estimado": "string"
}`;

    return await this.generateStructuredResponse(prompt, {}, {
      temperature: 0.3,
      maxTokens: 500
    });
  }

  async generateEmbedding(text) {
    const response = await this.client.embeddings.create({
      model: 'text-embedding-3-small',
      input: text
    });

    return response.data[0].embedding;
  }
}

export default OpenAIProvider;
