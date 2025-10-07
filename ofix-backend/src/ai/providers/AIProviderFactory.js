/**
 * Factory para diferentes provedores de IA
 * Suporta: OpenAI, Ollama (local), Hugging Face, Claude, e modelos customizados
 */

import OpenAIProvider from './OpenAIProvider.js';
import OllamaProvider from './OllamaProvider.js';
import HuggingFaceProvider from './HuggingFaceProvider.js';
import CustomModelProvider from './CustomModelProvider.js';
import SimplifiedAIProvider from './SimplifiedAIProvider.js';

class AIProviderFactory {
  constructor() {
    this.providers = new Map();
    this.defaultProvider = null;
    this.initializeProviders();
  }

  initializeProviders() {
    // Registrar provedores disponíveis
    this.registerProvider('simplified', SimplifiedAIProvider);
    this.registerProvider('huggingface', HuggingFaceProvider);
    this.registerProvider('openai', OpenAIProvider);
    this.registerProvider('ollama', OllamaProvider);
    this.registerProvider('custom', CustomModelProvider);

    // Definir provedor padrão (simplificado funciona sempre)
    this.defaultProvider = process.env.AI_PROVIDER || 'simplified';
    
    console.log(`🤖 AI Provider configurado: ${this.defaultProvider}`);
  }

  registerProvider(name, providerClass) {
    this.providers.set(name, providerClass);
  }

  getProvider(providerName = null) {
    const name = providerName || this.defaultProvider;
    const ProviderClass = this.providers.get(name);
    
    if (!ProviderClass) {
      throw new Error(`Provedor de IA '${name}' não encontrado`);
    }

    return new ProviderClass();
  }

  // Método para fallback automático
  async executeWithFallback(operation, ...args) {
    const providers = ['simplified', 'huggingface', 'openai'];
    
    for (const providerName of providers) {
      try {
        const provider = this.getProvider(providerName);
        if (await provider.isAvailable()) {
          return await provider[operation](...args);
        }
      } catch (error) {
        console.warn(`❌ Erro no provedor ${providerName}:`, error.message);
        continue;
      }
    }
    
    throw new Error('Nenhum provedor de IA disponível');
  }

  // Método para análise comparativa de múltiplos modelos
  async compareProviders(prompt, options = {}) {
    const results = {};
    const enabledProviders = options.providers || ['ollama', 'huggingface'];
    
    await Promise.allSettled(
      enabledProviders.map(async (providerName) => {
        try {
          const provider = this.getProvider(providerName);
          const startTime = Date.now();
          const response = await provider.generateText(prompt, { maxTokens: 150 });
          const endTime = Date.now();
          
          results[providerName] = {
            response,
            responseTime: endTime - startTime,
            status: 'success'
          };
        } catch (error) {
          results[providerName] = {
            error: error.message,
            status: 'error'
          };
        }
      })
    );
    
    return results;
  }
}

export default new AIProviderFactory();
