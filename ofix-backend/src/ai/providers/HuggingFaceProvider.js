/**
 * Provedor Hugging Face para modelos open source
 * Acesso gratuito a centenas de modelos de IA
 */

import { HfInference } from '@huggingface/inference';

class HuggingFaceProvider {
  constructor() {
    // Funciona mesmo sem token para alguns modelos
    this.client = process.env.HUGGINGFACE_TOKEN ? 
      new HfInference(process.env.HUGGINGFACE_TOKEN) : 
      new HfInference();
    this.defaultModel = 'microsoft/DialoGPT-medium';
    this.whisperModel = 'openai/whisper-large-v3';
    this.embeddingModel = 'sentence-transformers/all-MiniLM-L6-v2';
  }

  async isAvailable() {
    try {
      // Funciona mesmo sem token para alguns modelos públicos
      return true;
    } catch (error) {
      console.warn('🤗 Hugging Face não disponível:', error.message);
      return false;
    }
  }

  async generateText(prompt, options = {}) {
    try {
      const response = await this.client.textGeneration({
        model: options.model || 'microsoft/DialoGPT-medium',
        inputs: prompt,
        parameters: {
          max_new_tokens: options.maxTokens || 500,
          temperature: options.temperature || 0.7,
          top_p: options.topP || 0.9,
          do_sample: true
        }
      });

      return {
        text: response.generated_text || response,
        model: options.model || this.defaultModel,
        usage: {
          promptTokens: prompt.length / 4, // Estimativa
          completionTokens: (response.generated_text?.length || 0) / 4,
          totalTokens: (prompt.length + (response.generated_text?.length || 0)) / 4
        }
      };
    } catch (error) {
      console.error('❌ Erro Hugging Face:', error.message);
      throw error;
    }
  }

  async generateStructuredResponse(prompt, schema, options = {}) {
    const structuredPrompt = `${prompt}

Responda APENAS em formato JSON válido seguindo este schema:
${JSON.stringify(schema, null, 2)}

JSON:`;

    const response = await this.generateText(structuredPrompt, {
      ...options,
      temperature: 0.3,
      maxTokens: 600
    });

    try {
      // Tentar encontrar JSON na resposta
      const text = response.text;
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      
      // Se não encontrar, tentar parsear a resposta completa
      return JSON.parse(text);
    } catch (error) {
      console.warn('⚠️ Resposta não é JSON válido:', response.text);
      
      // Fallback: criar resposta estruturada baseada no schema
      return this.createFallbackResponse(schema, response.text);
    }
  }

  createFallbackResponse(schema, responseText) {
    const fallback = {};
    
    // Tentar extrair informações da resposta texto
    if (schema.categoria_principal) {
      if (responseText.toLowerCase().includes('motor')) fallback.categoria_principal = 'motor';
      else if (responseText.toLowerCase().includes('freio')) fallback.categoria_principal = 'freios';
      else if (responseText.toLowerCase().includes('suspens')) fallback.categoria_principal = 'suspensao';
      else fallback.categoria_principal = 'geral';
    }
    
    if (schema.complexidade) {
      if (responseText.toLowerCase().includes('simples') || responseText.toLowerCase().includes('facil')) {
        fallback.complexidade = 'baixa';
      } else if (responseText.toLowerCase().includes('dificil') || responseText.toLowerCase().includes('complexo')) {
        fallback.complexidade = 'alta';
      } else {
        fallback.complexidade = 'media';
      }
    }
    
    if (schema.tempo_estimado_horas) {
      const timeMatch = responseText.match(/(\d+)\s*horas?/i);
      fallback.tempo_estimado_horas = timeMatch ? parseInt(timeMatch[1]) : 2;
    }
    
    if (schema.confianca_analise) {
      fallback.confianca_analise = 75; // Confiança média para fallback
    }
    
    return fallback;
  }

  async transcribeAudio(audioBuffer, options = {}) {
    try {
      const response = await this.client.automaticSpeechRecognition({
        data: audioBuffer,
        model: this.whisperModel
      });

      return {
        text: response.text,
        confidence: 0.85, // Hugging Face não retorna confidence
        language: 'pt'
      };
    } catch (error) {
      console.error('❌ Erro na transcrição:', error.message);
      throw error;
    }
  }

  async analisarTriagemVeiculo(transcricao, options = {}) {
    const prompt = `Analise este problema automotivo relatado pelo cliente e forneça um diagnóstico estruturado.

PROBLEMA RELATADO: "${transcricao}"

Como especialista automotivo, analise os sintomas e classifique o problema:

1. Categoria principal (motor, freios, suspensão, elétrica, transmissão)
2. Complexidade estimada 
3. Tempo de reparo
4. Urgência do problema
5. Peças que podem ser necessárias

Forneça uma análise técnica precisa em formato JSON:`;

    const schema = {
      categoria_principal: "string",
      categoria_secundaria: "string", 
      tempo_estimado_horas: "number",
      complexidade: "string",
      urgencia: "string",
      pecas_provaveis: ["array"],
      proximos_passos: "string",
      confianca_analise: "number",
      sintomas_identificados: ["array"],
      diagnostico_preliminar: "string"
    };

    return await this.generateStructuredResponse(prompt, schema, {
      temperature: 0.4
    });
  }

  async gerarMensagemWhatsApp(servico, statusNovo, statusAnterior) {
    const prompt = `Crie uma mensagem WhatsApp profissional para atualizar cliente sobre seu veículo.

Cliente: ${servico.cliente_nome}
Veículo: ${servico.veiculo_modelo}
Status: mudou de "${statusAnterior}" para "${statusNovo}"

Mensagem deve ser:
- Máximo 160 caracteres
- Profissional mas amigável  
- Com emoji apropriado
- Tranquilizadora

Mensagem:`;

    const response = await this.generateText(prompt, {
      temperature: 0.6,
      maxTokens: 50
    });

    // Limpar e retornar apenas a mensagem
    return response.text
      .replace(/^Mensagem:\s*/i, '')
      .replace(/^["']|["']$/g, '')
      .trim()
      .substring(0, 160);
  }

  async generateEmbedding(text) {
    try {
      const response = await this.client.featureExtraction({
        model: this.embeddingModel,
        inputs: text
      });

      // Hugging Face retorna array de arrays, pegar o primeiro
      return Array.isArray(response[0]) ? response[0] : response;
    } catch (error) {
      console.error('❌ Erro ao gerar embedding:', error.message);
      throw error;
    }
  }

  async analisarAlertaPrazo(servico, horasAtraso) {
    const prompt = `Analise este atraso em serviço automotivo e sugira soluções.

SITUAÇÃO:
- Serviço: ${servico.descricao}
- Cliente: ${servico.cliente_nome}  
- Atraso: ${horasAtraso} horas
- Status: ${servico.status}

Sugira 3 ações específicas para resolver o atraso:

1. Ação imediata
2. Comunicação com cliente
3. Prevenção futura

Resposta em JSON com prioridade, resumo e ações específicas:`;

    const schema = {
      prioridade: "string",
      resumo: "string", 
      acoes: ["array"],
      impacto_cliente: "string",
      tempo_resolucao_estimado: "string"
    };

    return await this.generateStructuredResponse(prompt, schema, {
      temperature: 0.3
    });
  }

  // Método para buscar modelos disponíveis
  async listAvailableModels() {
    const recommendedModels = [
      {
        name: 'microsoft/DialoGPT-medium',
        type: 'conversational',
        description: 'Modelo para conversas naturais'
      },
      {
        name: 'google/flan-t5-base', 
        type: 'text-generation',
        description: 'Modelo para geração de texto estruturado'
      },
      {
        name: 'sentence-transformers/all-MiniLM-L6-v2',
        type: 'embedding',
        description: 'Modelo para embeddings semânticos'
      },
      {
        name: 'openai/whisper-large-v3',
        type: 'speech-recognition', 
        description: 'Transcrição de áudio'
      }
    ];

    return recommendedModels;
  }
}

export default HuggingFaceProvider;
