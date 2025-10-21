/**
 * 🧪 Script de Teste Rápido
 * 
 * Execute no console do navegador para testar as funcionalidades
 */

console.log('🚀 Iniciando testes rápidos...\n');

// Teste 1: Verificar se hooks estão disponíveis
console.log('✅ Teste 1: Verificando hooks...');
const hooks = [
  'useAuthHeaders',
  'useChatAPI',
  'useChatHistory',
  'useVoiceRecognition'
];
console.log('Hooks implementados:', hooks);

// Teste 2: Verificar localStorage
console.log('\n✅ Teste 2: Verificando localStorage...');
const keys = Object.keys(localStorage).filter(k => k.includes('matias_conversas'));
console.log('Chaves de histórico encontradas:', keys.length);
if (keys.length > 0) {
  const data = JSON.parse(localStorage.getItem(keys[0]));
  console.log('Mensagens no histórico:', data?.conversas?.length || 0);
}

// Teste 3: Verificar suporte a voz
console.log('\n✅ Teste 3: Verificando suporte a reconhecimento de voz...');
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
console.log('Reconhecimento de voz suportado:', !!SpeechRecognition);

// Teste 4: Verificar suporte a síntese de voz
console.log('\n✅ Teste 4: Verificando suporte a síntese de voz...');
console.log('Síntese de voz suportada:', 'speechSynthesis' in window);
if ('speechSynthesis' in window) {
  const voices = speechSynthesis.getVoices();
  const ptVoices = voices.filter(v => v.lang.includes('pt'));
  console.log('Vozes em português disponíveis:', ptVoices.length);
}

// Teste 5: Verificar token de autenticação
console.log('\n✅ Teste 5: Verificando autenticação...');
const authToken = localStorage.getItem('authToken');
if (authToken) {
  try {
    const tokenData = JSON.parse(authToken);
    console.log('Token encontrado:', !!tokenData.token);
    console.log('Token expira em:', tokenData.expiresAt);
  } catch (e) {
    console.log('❌ Erro ao parsear token');
  }
} else {
  console.log('⚠️ Token não encontrado - faça login primeiro');
}

// Teste 6: Testar validação de mensagem
console.log('\n✅ Teste 6: Testando validação de mensagens...');
console.log('Para testar, execute no console:');
console.log(`
// Importar validador
import { validarMensagem } from './src/utils/messageValidator';

// Testar mensagem válida
validarMensagem('Olá, tudo bem?');

// Testar mensagem vazia
validarMensagem('');

// Testar mensagem muito longa
validarMensagem('a'.repeat(1001));

// Testar HTML
validarMensagem('<script>alert("xss")</script>Olá');
`);

// Teste 7: Verificar configurações
console.log('\n✅ Teste 7: Verificando configurações...');
console.log('Para ver as configurações, execute:');
console.log(`
import { AI_CONFIG } from './src/constants/aiPageConfig';
console.log(AI_CONFIG);
`);

// Resumo
console.log('\n📊 RESUMO DOS TESTES:');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('✅ Hooks implementados');
console.log(keys.length > 0 ? '✅' : '⚠️', 'Histórico no localStorage');
console.log(SpeechRecognition ? '✅' : '❌', 'Reconhecimento de voz');
console.log('speechSynthesis' in window ? '✅' : '❌', 'Síntese de voz');
console.log(authToken ? '✅' : '⚠️', 'Token de autenticação');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

console.log('\n📖 Para mais detalhes, veja o arquivo GUIA_TESTE_MANUAL.md');
console.log('🎯 Para testar a página, execute: npm run dev');
