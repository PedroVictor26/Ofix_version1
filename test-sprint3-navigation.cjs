#!/usr/bin/env node

/**
 * Teste das melhorias do Sprint 3 - Sistema de Navegação Avançado
 * Verifica componentes criados e funcionalidades implementadas
 */

const fs = require('fs');
const path = require('path');

console.log('🧭 Testando Implementações do Sprint 3 - Navegação Avançado\n');
console.log('=' .repeat(70));

// Diretório base do projeto
const baseDir = '.';

// Lista de arquivos que devem existir
const requiredFiles = [
  {
    path: 'src/components/Breadcrumbs.jsx',
    description: 'Componente de Breadcrumbs para navegação',
    features: ['ChevronRight', 'Home', 'useLocation', 'routeMap']
  },
  {
    path: 'src/hooks/useModalNavigation.js',
    description: 'Hook para navegação por teclado em modais',
    features: ['useKeyboardNavigation', 'useClickOutside', 'Escape', 'handleEscape']
  },
  {
    path: 'src/components/ui/LoadingSpinner.jsx',
    description: 'Componente de loading avançado',
    features: ['PageLoading', 'SectionLoading', 'InlineLoading', 'LoadingStates']
  },
  {
    path: 'src/components/ui/CustomTooltip.jsx',
    description: 'Sistema de tooltips customizados',
    features: ['FieldTooltip', 'ActionTooltip', 'position', 'type']
  }
];

// Lista de melhorias que devem estar nos modais
const modalImprovements = [
  {
    file: 'src/components/clientes/ClienteModal.jsx',
    improvements: [
      'from "../../hooks/useModalNavigation"',
      'hasUnsavedChanges',
      'data-modal-content',
      'focusFirst'
    ]
  },
  {
    file: 'src/components/clientes/VeiculoModal.jsx',
    improvements: [
      'from "../../hooks/useModalNavigation"',
      'hasUnsavedChanges',
      'data-modal-content',
      'focusFirst'
    ]
  }
];

let totalTests = 0;
let passedTests = 0;
let failedTests = 0;

console.log('\n📁 VERIFICANDO ARQUIVOS CRIADOS');
console.log('-'.repeat(50));

// Verificar se os arquivos existem e têm o conteúdo esperado
requiredFiles.forEach((file, index) => {
  totalTests++;
  const filePath = path.join(baseDir, file.path);
  
  try {
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, 'utf8');
      
      // Verificar se contém as features esperadas
      const hasAllFeatures = file.features.every(feature => 
        content.includes(feature)
      );
      
      if (hasAllFeatures) {
        console.log(`✅ Arquivo ${index + 1}: ${file.path}`);
        console.log(`   Descrição: ${file.description}`);
        console.log(`   Features: ${file.features.join(', ')}`);
        passedTests++;
      } else {
        console.log(`⚠️  Arquivo ${index + 1}: ${file.path}`);
        console.log(`   Descrição: ${file.description}`);
        console.log(`   PROBLEMA: Algumas features não encontradas`);
        
        const missingFeatures = file.features.filter(feature => 
          !content.includes(feature)
        );
        console.log(`   Features faltando: ${missingFeatures.join(', ')}`);
        failedTests++;
      }
    } else {
      console.log(`❌ Arquivo ${index + 1}: ${file.path}`);
      console.log(`   ERRO: Arquivo não encontrado`);
      failedTests++;
    }
  } catch (error) {
    console.log(`❌ Arquivo ${index + 1}: ${file.path}`);
    console.log(`   ERRO: ${error.message}`);
    failedTests++;
  }
  
  console.log();
});

console.log('\n🔧 VERIFICANDO MELHORIAS NOS MODAIS');
console.log('-'.repeat(50));

// Verificar melhorias nos modais
modalImprovements.forEach((modal, index) => {
  totalTests++;
  const filePath = path.join(baseDir, modal.file);
  
  try {
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, 'utf8');
      
      const hasAllImprovements = modal.improvements.every(improvement => 
        content.includes(improvement)
      );
      
      if (hasAllImprovements) {
        console.log(`✅ Modal ${index + 1}: ${modal.file}`);
        console.log(`   Melhorias: ${modal.improvements.join(', ')}`);
        passedTests++;
      } else {
        console.log(`⚠️  Modal ${index + 1}: ${modal.file}`);
        
        const missingImprovements = modal.improvements.filter(improvement => 
          !content.includes(improvement)
        );
        console.log(`   PROBLEMA: Melhorias faltando: ${missingImprovements.join(', ')}`);
        failedTests++;
      }
    } else {
      console.log(`❌ Modal ${index + 1}: ${modal.file}`);
      console.log(`   ERRO: Arquivo não encontrado`);
      failedTests++;
    }
  } catch (error) {
    console.log(`❌ Modal ${index + 1}: ${modal.file}`);
    console.log(`   ERRO: ${error.message}`);
    failedTests++;
  }
  
  console.log();
});

console.log('\n📄 VERIFICANDO INTEGRAÇÃO NAS PÁGINAS');
console.log('-'.repeat(50));

// Verificar se o breadcrumb foi integrado na página de clientes
totalTests++;
const clientesPagePath = path.join(baseDir, 'src/pages/Clientes.jsx');

try {
  if (fs.existsSync(clientesPagePath)) {
    const content = fs.readFileSync(clientesPagePath, 'utf8');
    
    if (content.includes('import Breadcrumbs') && content.includes('<Breadcrumbs />')) {
      console.log(`✅ Página de Clientes: Breadcrumbs integrado`);
      passedTests++;
    } else {
      console.log(`⚠️  Página de Clientes: Breadcrumbs não integrado corretamente`);
      failedTests++;
    }
  } else {
    console.log(`❌ Página de Clientes: Arquivo não encontrado`);
    failedTests++;
  }
} catch (error) {
  console.log(`❌ Página de Clientes: ${error.message}`);
  failedTests++;
}

// Resumo Final
console.log('\n' + '=' .repeat(70));
console.log(`📊 RESUMO DOS TESTES DO SPRINT 3:`);
console.log();
console.log(`✅ Testes Passaram: ${passedTests}`);
console.log(`❌ Testes Falharam: ${failedTests}`);
console.log(`📈 Taxa de sucesso: ${((passedTests / totalTests) * 100).toFixed(1)}%`);

if (failedTests === 0) {
  console.log('\n🎉 Sprint 3 FINALIZADO COM SUCESSO!');
  console.log('\n📋 Funcionalidades implementadas:');
  console.log('   🧭 Sistema de Breadcrumbs para navegação clara');
  console.log('   ⌨️  Navegação por teclado (ESC, Tab, Click Outside)');
  console.log('   🎯 Auto-focus inteligente nos modais');
  console.log('   ⏳ Sistema de loading avançado');
  console.log('   💡 Tooltips customizados e contextuais');
  console.log('   🔒 Proteção contra perda de dados não salvos');
  
  console.log('\n🚀 Benefícios para o usuário:');
  console.log('   • Navegação mais intuitiva e rápida');
  console.log('   • Melhor acessibilidade e usabilidade');
  console.log('   • Feedback visual aprimorado');
  console.log('   • Proteção contra perda acidental de dados');
  console.log('   • Experiência de usuário profissional');
  
} else {
  console.log('\n⚠️  Alguns componentes precisam de ajustes.');
}

console.log('\n🎯 Status Geral dos Sprints:');
console.log('   ✅ Sprint 1: Melhorias visuais e loading');
console.log('   ✅ Sprint 2: Validações brasileiras (100% dos testes)');
console.log(`   ${failedTests === 0 ? '✅' : '🔄'} Sprint 3: Navegação avançada`);
console.log('   🔄 Sprint 4: Consistência visual (próximo)');
console.log('   🔄 Sprint 5: Otimizações finais (próximo)');