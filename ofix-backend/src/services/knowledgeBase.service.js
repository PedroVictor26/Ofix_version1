/**
 * 🔍 KNOWLEDGE BASE SERVICE - Matias
 * 
 * Base de conhecimento abrangente para o assistente virtual
 * Funcionalidades: FAQ, manuais técnicos, procedimentos, especificações
 */

import fs from 'fs/promises';
import path from 'path';

class KnowledgeBaseService {
  constructor() {
    this.knowledgeBase = new Map();
    this.indexedData = new Map();
    this.categories = [
      'diagnostics',
      'procedures', 
      'specifications',
      'troubleshooting',
      'maintenance',
      'parts',
      'scheduling',
      'pricing',
      'emergency',
      'general'
    ];
    
    this.initialized = false;
  }

  /**
   * 🚀 Inicializar base de conhecimento
   */
  async initialize() {
    try {
      await this.loadStaticKnowledge();
      await this.loadDynamicKnowledge();
      await this.buildSearchIndex();
      this.initialized = true;
      console.log('✅ Knowledge Base inicializada com sucesso');
    } catch (error) {
      console.error('❌ Erro ao inicializar Knowledge Base:', error);
      throw error;
    }
  }

  /**
   * 📚 Carregar conhecimento estático (arquivos locais)
   */
  async loadStaticKnowledge() {
    const knowledgeData = {
      // 🔧 DIAGNÓSTICOS TÉCNICOS
      diagnostics: {
        'motor_nao_liga': {
          title: 'Motor Não Liga',
          content: `**DIAGNÓSTICO: Motor Não Liga**

🔍 **Verificações Iniciais:**
• Bateria: Testar voltagem (mín. 12.4V)
• Combustível: Verificar nível e qualidade
• Ignição: Testar faíscas nas velas
• Fusíveis: Verificar fusível principal e ignição

⚙️ **Procedimento Diagnóstico:**
1. **Teste da Bateria:** Multímetro nos terminais
2. **Sistema de Combustível:** Pressão da bomba
3. **Sistema Elétrico:** Continuidade dos cabos
4. **Centralina:** Verificar códigos de erro

🎯 **Causas Comuns:**
• Bateria descarregada (40% dos casos)
• Problema no sistema de combustível (25%)
• Falha na ignição (20%)
• Problema elétrico (15%)

💡 **Soluções Rápidas:**
• Bateria: Jump start ou troca
• Combustível: Verificar filtro e bomba
• Ignição: Trocar velas ou bobinas
• Elétrico: Verificar fusíveis e relés`,
          tags: ['motor', 'partida', 'bateria', 'combustível', 'ignição'],
          category: 'diagnostics',
          difficulty: 'intermediate',
          time_estimate: '30-60 minutos',
          tools_needed: ['multímetro', 'scanner', 'chaves básicas']
        },

        'barulho_motor': {
          title: 'Análise de Ruídos do Motor',
          content: `**DIAGNÓSTICO: Ruídos do Motor**

🔊 **Tipos de Ruído e Diagnóstico:**

**BATIDA METÁLICA:**
• Bronzinas gastas → Retífica urgente
• Pistões soltos → Motor fundido
• Bielas empenadas → Revisão completa

**CHIADO AGUDO:**
• Correia dentada → Troca imediata
• Tensor da correia → Substituir
• Bomba d'água → Verificar vazamentos

**RONCO GRAVE:**
• Coxins do motor → Trocar apoios
• Escape furado → Solda ou troca
• Turbina → Revisar turbo

**TIQUE-TAQUE:**
• Válvulas desreguladas → Regulagem
• Tuchos hidráulicos → Trocar óleo
• Corrente de comando → Substituir

🎯 **Método de Diagnóstico:**
1. Identificar localização do ruído
2. Relacionar com RPM do motor
3. Verificar em diferentes condições
4. Testar com motor frio/quente`,
          tags: ['ruído', 'motor', 'diagnóstico', 'mecânica'],
          category: 'diagnostics',
          difficulty: 'expert',
          time_estimate: '45-90 minutos'
        }
      },

      // 🛠️ PROCEDIMENTOS
      procedures: {
        'troca_oleo': {
          title: 'Procedimento: Troca de Óleo',
          content: `**PROCEDIMENTO: Troca de Óleo e Filtro**

⚙️ **Materiais Necessários:**
• Óleo motor (verificar especificação)
• Filtro de óleo original
• Junta do carter (se necessário)
• Ferramenta para filtro

🔧 **Passo a Passo:**
1. **Preparação:** Motor morno (não quente)
2. **Drenagem:** Remover tampão do carter
3. **Filtro:** Trocar filtro e vedar rosca
4. **Enchimento:** Óleo novo pela tampa superior
5. **Verificação:** Nível entre mín/máx

⏱️ **Tempos:**
• Drenagem: 15 minutos
• Troca filtro: 10 minutos  
• Enchimento: 5 minutos
• Verificação: 5 minutos
• **Total: 35 minutos**

💡 **Dicas Importantes:**
• Nunca misturar tipos de óleo
• Descartar óleo usado adequadamente
• Verificar vazamentos após 24h
• Anotar KM da troca`,
          tags: ['óleo', 'manutenção', 'filtro', 'procedimento'],
          category: 'procedures',
          difficulty: 'basic',
          time_estimate: '35 minutos',
          cost_estimate: 'R$ 150-300'
        },

        'alinhamento_balanceamento': {
          title: 'Alinhamento e Balanceamento',
          content: `**PROCEDIMENTO: Alinhamento e Balanceamento**

🎯 **Quando Fazer:**
• Pneus com desgaste irregular
• Volante trepidando
• Carro "puxando" para um lado
• Após trocar pneus/amortecedores

🔧 **Alinhamento (Geometria):**
• **Cambagem:** Inclinação vertical da roda
• **Cáster:** Inclinação do eixo de direção
• **Convergência:** Paralelismo das rodas

⚖️ **Balanceamento:**
• Distribuição uniforme do peso
• Elimina vibrações no volante
• Aumenta vida útil dos pneus

📋 **Processo:**
1. Inspeção visual dos pneus
2. Verificação da suspensão
3. Medição na máquina de alinhamento
4. Ajustes conforme especificação
5. Balanceamento com contrapesos
6. Teste de rodagem

💰 **Investimento:**
• Alinhamento: R$ 80-120
• Balanceamento: R$ 60-100
• Conjunto: R$ 120-180`,
          tags: ['alinhamento', 'balanceamento', 'pneus', 'suspensão'],
          category: 'procedures',
          difficulty: 'intermediate',
          time_estimate: '60-90 minutos'
        }
      },

      // 📋 ESPECIFICAÇÕES
      specifications: {
        'torques_rodas': {
          title: 'Especificações de Torque - Rodas',
          content: `**TORQUES DE APERTO - RODAS**

🚗 **Veículos Populares:**

**VOLKSWAGEN:**
• Gol/Voyage/Saveiro: 110 Nm
• Polo/Virtus: 120 Nm
• Passat/Jetta: 140 Nm

**FIAT:**
• Uno/Mobi: 98 Nm
• Palio/Siena: 105 Nm
• Toro/Argo: 110 Nm

**CHEVROLET:**
• Onix/Prisma: 105 Nm
• Cruze/Tracker: 140 Nm
• S10/Trailblazer: 140 Nm

**FORD:**
• Ka/Fiesta: 105 Nm
• Focus/EcoSport: 130 Nm
• Ranger: 150 Nm

⚠️ **IMPORTANTE:**
• Sempre consultar manual específico
• Apertar em cruz (estrela)
• Reapertar após 100km
• Usar torquímetro calibrado`,
          tags: ['torque', 'rodas', 'especificações', 'segurança'],
          category: 'specifications',
          difficulty: 'basic'
        }
      },

      // 🆘 EMERGÊNCIAS
      emergency: {
        'pane_estrada': {
          title: 'Pane na Estrada - Primeiros Socorros',
          content: `**EMERGÊNCIA: Pane na Estrada**

🚨 **Procedimento de Segurança:**
1. **Pare em local seguro** (acostamento)
2. **Sinalize:** Triângulo 30m atrás
3. **Pisca-alerta** ligado
4. **Saiam pela direita** (lado do acostamento)

🔧 **Diagnóstico Rápido:**

**MOTOR PAROU:**
• Combustível → Verificar nível
• Superaquecimento → Não abrir radiador quente
• Bateria → Testar com chave de fenda

**NÃO LIGA:**
• Bateria fraca → Aceitar ajuda para jump
• Motor de arranque → Bater levemente
• Combustível → Verificar se não é reserva

**PNEU FUROU:**
• Trocar por estepe
• Usar macaco no ponto correto
• Apertar em cruz

📞 **Quando Chamar Socorro:**
• Problemas elétricos complexos
• Superaquecimento grave
• Sem estepe ou macaco
• Local perigoso

🛡️ **Kit Emergência:**
• Triângulo e lanterna
• Macaco e chave de roda
• Cabo para chupeta
• Pneu estepe calibrado`,
          tags: ['emergência', 'pane', 'segurança', 'estrada'],
          category: 'emergency',
          difficulty: 'basic',
          urgency: 'high'
        }
      },

      // 💰 PREÇOS E ORÇAMENTOS
      pricing: {
        'tabela_servicos': {
          title: 'Tabela de Preços - Serviços Principais',
          content: `**TABELA DE PREÇOS - 2024**

🔧 **MANUTENÇÃO BÁSICA:**
• Troca de óleo: R$ 150-300
• Filtros (ar/óleo/combustível): R$ 80-200
• Velas de ignição: R$ 120-350
• Alinhamento/Balanceamento: R$ 120-180

⚙️ **SISTEMA ELÉTRICO:**
• Bateria 60Ah: R$ 350-500
• Alternador (recondicionado): R$ 280-450
• Motor de arranque: R$ 300-600
• Diagnóstico elétrico: R$ 80-150

🚗 **SUSPENSÃO/FREIOS:**
• Amortecedores (par): R$ 300-800
• Pastilhas de freio: R$ 120-300
• Discos de freio: R$ 200-500
• Fluido de freio: R$ 60-100

🌡️ **ARREFECIMENTO:**
• Radiador: R$ 400-800
• Bomba d'água: R$ 200-400
• Termostato: R$ 80-150
• Aditivo radiador: R$ 30-60

💡 **OBSERVAÇÕES:**
• Preços variam por região
• Peças originais custam 20-40% mais
• Mão de obra: R$ 80-120/hora
• Diagnóstico pode ser abatido do serviço`,
          tags: ['preços', 'orçamento', 'tabela', 'custos'],
          category: 'pricing',
          last_updated: '2024-01-01'
        }
      },

      // ❓ FAQ GERAL
      general: {
        'quando_trocar_oleo': {
          title: 'Quando Trocar o Óleo do Motor?',
          content: `**QUANDO TROCAR O ÓLEO?**

⏰ **Intervalos Recomendados:**

**ÓLEO MINERAL:**
• Uso urbano: 5.000 km
• Uso rodoviário: 7.000 km
• Condições severas: 3.000 km

**ÓLEO SEMISSINTÉTICO:**
• Uso urbano: 7.500 km
• Uso rodoviário: 10.000 km
• Condições severas: 5.000 km

**ÓLEO SINTÉTICO:**
• Uso urbano: 10.000 km
• Uso rodoviário: 15.000 km
• Condições severas: 7.500 km

🚨 **Condições Severas:**
• Trânsito intenso (para e anda)
• Trajetos curtos frequentes
• Clima muito quente ou frio
• Estradas com muito pó
• Reboque de cargas pesadas

🔍 **Sinais de Troca:**
• Óleo escuro/espesso
• Ruído excessivo do motor
• Fumaça azul no escape
• Nível baixo frequente

💡 **Dica do Matias:**
"Melhor trocar antes do prazo que depois do estrago!"`,
          tags: ['óleo', 'manutenção', 'intervalo', 'troca'],
          category: 'general',
          popularity: 'high'
        }
      }
    };

    // Carregar dados na base
    for (const [category, items] of Object.entries(knowledgeData)) {
      for (const [key, item] of Object.entries(items)) {
        this.knowledgeBase.set(`${category}_${key}`, {
          id: `${category}_${key}`,
          category,
          ...item,
          created_at: new Date(),
          accessed_count: 0
        });
      }
    }
  }

  /**
   * 🔄 Carregar conhecimento dinâmico (banco de dados)
   */
  async loadDynamicKnowledge() {
    try {
      // Aqui carregaríamos dados do banco de dados
      // Por exemplo: procedimentos personalizados, histórico de soluções, etc.
      
      // Simulação de dados dinâmicos
      const dynamicKnowledge = [
        {
          id: 'custom_solution_001',
          title: 'Solução Para Problema Recorrente',
          content: 'Solução específica baseada em caso real...',
          category: 'troubleshooting',
          source: 'database',
          confidence: 0.95
        }
      ];

      dynamicKnowledge.forEach(item => {
        this.knowledgeBase.set(item.id, item);
      });

    } catch (error) {
      console.warn('Erro ao carregar conhecimento dinâmico:', error);
    }
  }

  /**
   * 📇 Construir índice de busca
   */
  async buildSearchIndex() {
    for (const [id, item] of this.knowledgeBase) {
      // Indexar por palavras-chave
      const searchableText = [
        item.title,
        item.content,
        ...(item.tags || [])
      ].join(' ').toLowerCase();

      const words = searchableText.split(/\s+/)
        .filter(word => word.length > 2)
        .filter(word => !this.isStopWord(word));

      words.forEach(word => {
        if (!this.indexedData.has(word)) {
          this.indexedData.set(word, []);
        }
        this.indexedData.get(word).push({
          id,
          relevance: this.calculateWordRelevance(word, item)
        });
      });
    }
  }

  /**
   * 🔍 Buscar na base de conhecimento
   */
  async search(query, options = {}) {
    if (!this.initialized) {
      await this.initialize();
    }

    const {
      category = null,
      language = 'pt-BR',
      limit = 10,
      user_context = null
    } = options;

    try {
      // Normalizar query
      const normalizedQuery = query.toLowerCase()
        .replace(/[^\w\s]/g, ' ')
        .split(/\s+/)
        .filter(word => word.length > 2)
        .filter(word => !this.isStopWord(word));

      if (normalizedQuery.length === 0) {
        return [];
      }

      // Buscar matches
      const matches = new Map();

      normalizedQuery.forEach(word => {
        if (this.indexedData.has(word)) {
          this.indexedData.get(word).forEach(match => {
            if (!matches.has(match.id)) {
              matches.set(match.id, {
                id: match.id,
                score: 0,
                word_matches: []
              });
            }
            
            const current = matches.get(match.id);
            current.score += match.relevance;
            current.word_matches.push(word);
          });
        }
      });

      // Converter para array e ordenar por score
      let results = Array.from(matches.values())
        .map(match => {
          const item = this.knowledgeBase.get(match.id);
          return {
            ...item,
            search_score: match.score,
            word_matches: match.word_matches,
            confidence: this.calculateConfidence(match, normalizedQuery),
            relevance_factors: this.getRelevanceFactors(item, user_context)
          };
        })
        .sort((a, b) => b.search_score - a.search_score);

      // Filtrar por categoria se especificada
      if (category) {
        results = results.filter(item => item.category === category);
      }

      // Aplicar limite
      results = results.slice(0, limit);

      // Incrementar contador de acesso
      results.forEach(item => {
        const original = this.knowledgeBase.get(item.id);
        if (original) {
          original.accessed_count = (original.accessed_count || 0) + 1;
          original.last_accessed = new Date();
        }
      });

      return results;

    } catch (error) {
      console.error('Erro na busca da base de conhecimento:', error);
      return [];
    }
  }

  /**
   * 📊 Obter estatísticas da base
   */
  getStatistics() {
    const stats = {
      total_items: this.knowledgeBase.size,
      categories: {},
      most_accessed: [],
      recent_additions: []
    };

    // Contar por categoria
    for (const [id, item] of this.knowledgeBase) {
      const category = item.category || 'uncategorized';
      stats.categories[category] = (stats.categories[category] || 0) + 1;
    }

    // Itens mais acessados
    stats.most_accessed = Array.from(this.knowledgeBase.values())
      .sort((a, b) => (b.accessed_count || 0) - (a.accessed_count || 0))
      .slice(0, 10)
      .map(item => ({
        id: item.id,
        title: item.title,
        accessed_count: item.accessed_count || 0
      }));

    // Adições recentes
    stats.recent_additions = Array.from(this.knowledgeBase.values())
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
      .slice(0, 5)
      .map(item => ({
        id: item.id,
        title: item.title,
        created_at: item.created_at
      }));

    return stats;
  }

  /**
   * ➕ Adicionar novo conhecimento
   */
  async addKnowledge(knowledge) {
    const id = knowledge.id || `custom_${Date.now()}`;
    const item = {
      ...knowledge,
      id,
      created_at: new Date(),
      accessed_count: 0,
      source: 'user_added'
    };

    this.knowledgeBase.set(id, item);
    
    // Reindexar
    await this.reindexItem(item);
    
    return id;
  }

  /**
   * 🔄 Reindexar item específico
   */
  async reindexItem(item) {
    const searchableText = [
      item.title,
      item.content,
      ...(item.tags || [])
    ].join(' ').toLowerCase();

    const words = searchableText.split(/\s+/)
      .filter(word => word.length > 2)
      .filter(word => !this.isStopWord(word));

    words.forEach(word => {
      if (!this.indexedData.has(word)) {
        this.indexedData.set(word, []);
      }
      
      // Remover entradas antigas deste item
      const wordIndex = this.indexedData.get(word);
      const filtered = wordIndex.filter(entry => entry.id !== item.id);
      
      // Adicionar nova entrada
      filtered.push({
        id: item.id,
        relevance: this.calculateWordRelevance(word, item)
      });
      
      this.indexedData.set(word, filtered);
    });
  }

  /**
   * 🚫 Verificar stop words
   */
  isStopWord(word) {
    const stopWords = [
      'o', 'a', 'os', 'as', 'um', 'uma', 'uns', 'umas',
      'de', 'do', 'da', 'dos', 'das', 'em', 'no', 'na',
      'nos', 'nas', 'por', 'para', 'com', 'sem', 'sob',
      'sobre', 'entre', 'até', 'desde', 'que', 'se',
      'como', 'quando', 'onde', 'porque', 'muito',
      'mais', 'menos', 'bem', 'mal', 'todo', 'toda',
      'and', 'or', 'but', 'the', 'is', 'are', 'was',
      'were', 'be', 'been', 'have', 'has', 'had'
    ];
    return stopWords.includes(word);
  }

  /**
   * 📈 Calcular relevância da palavra
   */
  calculateWordRelevance(word, item) {
    let relevance = 1;

    // Palavra no título vale mais
    if (item.title && item.title.toLowerCase().includes(word)) {
      relevance += 2;
    }

    // Palavra nas tags vale mais
    if (item.tags && item.tags.some(tag => tag.toLowerCase().includes(word))) {
      relevance += 1.5;
    }

    // Categoria específica vale mais
    if (item.category && item.category.toLowerCase().includes(word)) {
      relevance += 1;
    }

    // Items populares valem mais
    if (item.popularity === 'high') {
      relevance += 0.5;
    }

    return relevance;
  }

  /**
   * 🎯 Calcular confiança do resultado
   */
  calculateConfidence(match, originalQuery) {
    const matchRatio = match.word_matches.length / originalQuery.length;
    const scoreNormalized = Math.min(match.score / 10, 1);
    return (matchRatio * 0.6) + (scoreNormalized * 0.4);
  }

  /**
   * 🔍 Obter fatores de relevância
   */
  getRelevanceFactors(item, userContext) {
    const factors = [];

    if (item.urgency === 'high') factors.push('Urgente');
    if (item.difficulty === 'basic') factors.push('Fácil');
    if (item.popularity === 'high') factors.push('Popular');
    if (item.accessed_count > 10) factors.push('Frequente');

    if (userContext?.vehicle_brand && 
        item.content?.toLowerCase().includes(userContext.vehicle_brand.toLowerCase())) {
      factors.push('Específico para sua marca');
    }

    return factors;
  }

  /**
   * 🏷️ Obter itens por categoria
   */
  async getByCategory(category, limit = 10) {
    const items = Array.from(this.knowledgeBase.values())
      .filter(item => item.category === category)
      .sort((a, b) => (b.accessed_count || 0) - (a.accessed_count || 0))
      .slice(0, limit);

    return items;
  }

  /**
   * 🔥 Obter itens populares
   */
  async getPopular(limit = 5) {
    return Array.from(this.knowledgeBase.values())
      .sort((a, b) => (b.accessed_count || 0) - (a.accessed_count || 0))
      .slice(0, limit);
  }

  /**
   * 🆕 Obter itens recentes
   */
  async getRecent(limit = 5) {
    return Array.from(this.knowledgeBase.values())
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
      .slice(0, limit);
  }
}

const knowledgeBaseService = new KnowledgeBaseService();
export default knowledgeBaseService;
