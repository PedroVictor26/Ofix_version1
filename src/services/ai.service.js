/**
 * Serviço de IA para o frontend
 * Centraliza todas as chamadas para as APIs de IA
 */
class AIService {
  constructor() {
    this.baseURL = '/api/ai';
    this.timeout = 60000; // 1 minuto
  }

  /**
   * Faz requisição com timeout e tratamento de erro
   */
  async request(endpoint, options = {}) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${this.baseURL}${endpoint}`, {
        ...options,
        signal: controller.signal,
        headers: {
          'Authorization': `Bearer ${token}`,
          ...options.headers
        }
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Erro na requisição');
      }

      return await response.json();
    } catch (error) {
      clearTimeout(timeoutId);
      
      if (error.name === 'AbortError') {
        throw new Error('Timeout na requisição. Tente novamente.');
      }
      
      throw error;
    }
  }

  /**
   * Processa triagem por voz
   */
  async processarTriagemVoz(audioBlob, clienteTelefone, veiculoPlaca) {
    const formData = new FormData();
    formData.append('audio', audioBlob, 'triagem.webm');
    formData.append('clienteTelefone', clienteTelefone);
    formData.append('veiculoPlaca', veiculoPlaca);

    return this.request('/triagem-voz', {
      method: 'POST',
      body: formData
    });
  }

  /**
   * Gera resumo de OS para WhatsApp
   */
  async gerarResumoWhatsApp(osId) {
    return this.request(`/os/${osId}/resumo-whatsapp`, {
      method: 'POST'
    });
  }

  /**
   * Conduz check-in guiado
   */
  async conduzirCheckin(etapaAtual, respostaCliente, dadosParciais = {}) {
    return this.request('/checkin/conduzir', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        etapaAtual,
        respostaCliente,
        dadosParciais
      })
    });
  }

  /**
   * Analisa oportunidades de upsell
   */
  async analisarUpsell(osId, laudoTecnico) {
    return this.request(`/os/${osId}/analise-upsell`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        laudoTecnico
      })
    });
  }

  /**
   * Verifica saúde do serviço de IA
   */
  async verificarSaude() {
    return this.request('/health', {
      method: 'GET'
    });
  }
}
const aiService = new AIService();
export { aiService };
export default aiService;
