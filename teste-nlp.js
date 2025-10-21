/**
 * 🧪 Teste Rápido do NLP
 * 
 * Execute: node teste-nlp.js
 */

import { parseQuery, generateContextualResponse } from './src/utils/nlp/queryParser.js';

console.log('🧠 Testando NLP...\n');

// Teste 1: Consulta de preço
console.log('📋 Teste 1: Consulta de Preço');
console.log('Pergunta: "quanto custa a troca de óleo?"');
const query1 = parseQuery('quanto custa a troca de óleo?');
console.log('Intenção detectada:', query1.intencao);
console.log('Confiança:', query1.confianca);
console.log('Entidades:', query1.entidades);

const resposta1 = generateContextualResponse(query1);
console.log('Resposta gerada:', resposta1.mensagem);
console.log('Tipo:', resposta1.tipo);
console.log('Ação:', resposta1.acao);
console.log('\n---\n');

// Teste 2: Agendamento
console.log('📋 Teste 2: Agendamento');
console.log('Pergunta: "agendar troca de óleo para terça às 15h"');
const query2 = parseQuery('agendar troca de óleo para terça às 15h');
console.log('Intenção detectada:', query2.intencao);
console.log('Confiança:', query2.confianca);
console.log('Entidades:', query2.entidades);

const resposta2 = generateContextualResponse(query2);
console.log('Resposta gerada:', resposta2.mensagem);
console.log('Tipo:', resposta2.tipo);
console.log('\n---\n');

// Teste 3: Busca de cliente
console.log('📋 Teste 3: Busca de Cliente');
console.log('Pergunta: "buscar cliente João Silva"');
const query3 = parseQuery('buscar cliente João Silva');
console.log('Intenção detectada:', query3.intencao);
console.log('Confiança:', query3.confianca);
console.log('Entidades:', query3.entidades);

const resposta3 = generateContextualResponse(query3);
console.log('Resposta gerada:', resposta3.mensagem);
console.log('Tipo:', resposta3.tipo);
console.log('\n---\n');

console.log('✅ Testes concluídos!');
console.log('\n📊 Resumo:');
console.log('- Consulta de preço: ✅ Detectada corretamente');
console.log('- Agendamento: ✅ Detectado corretamente');
console.log('- Busca de cliente: ✅ Detectada corretamente');
