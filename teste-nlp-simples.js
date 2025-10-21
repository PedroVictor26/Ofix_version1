/**
 * 🧪 Teste Simples do NLP
 * 
 * Testa classificação de intenções sem dependências do Vite
 */

// Mock do logger
const logger = {
  debug: () => {},
  info: () => {},
  warn: () => {},
  error: () => {}
};

// Padrões para cada tipo de intenção
const INTENT_PATTERNS = {
  consulta_preco: {
    keywords: [
      'quanto custa', 'qual o valor', 'qual valor', 'preço', 'valor de', 'valor da',
      'quanto é', 'quanto fica', 'quanto sai', 'custo', 'cobram', 'cobra',
      'preço de', 'preço da', 'quanto pago', 'quanto vou pagar', 'valor do serviço',
      'quanto custa a', 'quanto custa o', 'quanto custa uma', 'quanto custa um',
      'qual é o preço', 'qual é o valor', 'me diz o preço', 'me diz o valor'
    ],
    weight: 1.2
  },
  agendamento: {
    keywords: [
      'agendar', 'marcar', 'reservar', 'agendar para', 'marcar para', 
      'quero agendar', 'gostaria de agendar', 'preciso agendar',
      'fazer agendamento', 'criar agendamento', 'novo agendamento',
      'marcar horário', 'reservar horário', 'disponibilidade para'
    ],
    weight: 1.0
  },
  consulta_cliente: {
    keywords: [
      'buscar cliente', 'dados do cliente', 'informações do cliente', 
      'cliente', 'cadastro', 'procurar cliente', 'encontrar cliente',
      'ver cliente', 'consultar cliente', 'informações de', 'dados de'
    ],
    weight: 0.8
  },
  consulta_estoque: {
    keywords: [
      'tem em estoque', 'disponibilidade', 'tem', 'estoque', 'peça disponível',
      'tem peça', 'tem produto', 'disponível', 'em estoque', 'verificar estoque',
      'consultar estoque', 'checar estoque', 'ver estoque'
    ],
    weight: 0.9
  },
  saudacao: {
    keywords: [
      'oi', 'olá', 'ola', 'bom dia', 'boa tarde', 'boa noite', 'hey', 'ola',
      'e aí', 'e ai', 'opa', 'salve', 'fala'
    ],
    weight: 0.7
  },
  ajuda: {
    keywords: [
      'ajuda', 'help', 'o que você faz', 'como funciona', 'comandos',
      'o que pode fazer', 'quais comandos', 'me ajuda', 'preciso de ajuda',
      'não sei', 'nao sei', 'como usar'
    ],
    weight: 0.8
  }
};

/**
 * Classifica a intenção de uma mensagem
 */
const classifyIntent = (mensagem) => {
  if (!mensagem || typeof mensagem !== 'string') {
    return {
      intencao: 'desconhecida',
      confianca: 0,
      alternativas: []
    };
  }

  const mensagemLower = mensagem.toLowerCase().trim();
  const scores = {};

  // Calcular score para cada intenção
  Object.entries(INTENT_PATTERNS).forEach(([intencao, config]) => {
    let score = 0;
    let matchCount = 0;

    config.keywords.forEach(keyword => {
      if (mensagemLower.includes(keyword.toLowerCase())) {
        score += config.weight;
        matchCount++;
      }
    });

    // Normalizar score baseado no número de matches
    if (matchCount > 0) {
      scores[intencao] = {
        score: score / config.keywords.length,
        matchCount
      };
    }
  });

  // Ordenar por score
  const sortedIntents = Object.entries(scores)
    .sort((a, b) => b[1].score - a[1].score)
    .map(([intencao, data]) => ({
      intencao,
      confianca: Math.min(data.score * data.matchCount, 1.0)
    }));

  // Resultado principal
  const resultado = sortedIntents.length > 0
    ? sortedIntents[0]
    : { intencao: 'desconhecida', confianca: 0 };

  // Alternativas (outras intenções possíveis)
  const alternativas = sortedIntents.slice(1, 3);

  return {
    ...resultado,
    alternativas
  };
};

// ============================================
// TESTES
// ============================================

console.log('🧠 Testando NLP Melhorado\n');
console.log('='.repeat(60));

const testCases = [
  {
    input: 'quanto custa a troca de óleo?',
    expectedIntent: 'consulta_preco'
  },
  {
    input: 'qual o valor da revisão?',
    expectedIntent: 'consulta_preco'
  },
  {
    input: 'me diz o preço da troca de óleo',
    expectedIntent: 'consulta_preco'
  },
  {
    input: 'quanto vou pagar pela revisão?',
    expectedIntent: 'consulta_preco'
  },
  {
    input: 'quero agendar uma troca de óleo',
    expectedIntent: 'agendamento'
  },
  {
    input: 'tem filtro de óleo em estoque?',
    expectedIntent: 'consulta_estoque'
  },
  {
    input: 'buscar cliente João Silva',
    expectedIntent: 'consulta_cliente'
  },
  {
    input: 'bom dia',
    expectedIntent: 'saudacao'
  },
  {
    input: 'me ajuda',
    expectedIntent: 'ajuda'
  }
];

let passed = 0;
let failed = 0;

testCases.forEach((testCase, index) => {
  console.log(`\n📝 Teste ${index + 1}: "${testCase.input}"`);
  console.log('-'.repeat(60));
  
  const result = classifyIntent(testCase.input);
  
  console.log(`Intenção detectada: ${result.intencao} (confiança: ${(result.confianca * 100).toFixed(1)}%)`);
  console.log(`Intenção esperada: ${testCase.expectedIntent}`);
  
  const intentMatch = result.intencao === testCase.expectedIntent;
  
  if (intentMatch) {
    console.log('✅ PASSOU');
    passed++;
  } else {
    console.log('❌ FALHOU');
    console.log(`   Alternativas: ${result.alternativas.map(a => `${a.intencao} (${(a.confianca * 100).toFixed(1)}%)`).join(', ')}`);
    failed++;
  }
});

console.log('\n' + '='.repeat(60));
console.log(`\n📊 Resultado Final: ${passed}/${testCases.length} testes passaram`);
console.log(`✅ Passou: ${passed}`);
console.log(`❌ Falhou: ${failed}`);

if (failed === 0) {
  console.log('\n🎉 Todos os testes passaram! NLP está funcionando corretamente.');
} else {
  console.log('\n⚠️ Alguns testes falharam. Verifique os padrões de intenção.');
}
