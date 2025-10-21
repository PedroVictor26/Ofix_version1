/**
 * 🧪 Teste do NLP Melhorado
 * 
 * Testa se o classificador de intenções está funcionando corretamente
 */

import { enrichMessage } from './src/utils/nlp/queryParser.js';

console.log('🧠 Testando NLP Melhorado\n');
console.log('='.repeat(60));

const testCases = [
  {
    input: 'quanto custa a troca de óleo?',
    expectedIntent: 'consulta_preco',
    expectedEntity: 'troca de óleo'
  },
  {
    input: 'qual o valor da revisão?',
    expectedIntent: 'consulta_preco',
    expectedEntity: 'revisão'
  },
  {
    input: 'quero agendar uma troca de óleo',
    expectedIntent: 'agendamento',
    expectedEntity: 'troca de óleo'
  },
  {
    input: 'tem filtro de óleo em estoque?',
    expectedIntent: 'consulta_estoque',
    expectedEntity: 'filtro'
  },
  {
    input: 'buscar cliente João Silva',
    expectedIntent: 'consulta_cliente',
    expectedEntity: 'João Silva'
  },
  {
    input: 'status da OS 123',
    expectedIntent: 'consulta_os',
    expectedEntity: '123'
  },
  {
    input: 'bom dia',
    expectedIntent: 'saudacao',
    expectedEntity: null
  },
  {
    input: 'me ajuda',
    expectedIntent: 'ajuda',
    expectedEntity: null
  }
];

let passed = 0;
let failed = 0;

testCases.forEach((testCase, index) => {
  console.log(`\n📝 Teste ${index + 1}: "${testCase.input}"`);
  console.log('-'.repeat(60));
  
  const result = enrichMessage(testCase.input);
  
  console.log(`Intenção detectada: ${result.nlp.intencao} (confiança: ${(result.nlp.confianca * 100).toFixed(1)}%)`);
  console.log(`Intenção esperada: ${testCase.expectedIntent}`);
  
  if (Object.keys(result.nlp.entidades).length > 0) {
    console.log(`Entidades extraídas:`, result.nlp.entidades);
  } else {
    console.log(`Entidades extraídas: (nenhuma)`);
  }
  
  const intentMatch = result.nlp.intencao === testCase.expectedIntent;
  
  if (intentMatch) {
    console.log('✅ PASSOU');
    passed++;
  } else {
    console.log('❌ FALHOU');
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
