// test-design-system-integration.cjs
// Teste para verificar integração do design system

const fs = require('fs');
const path = require('path');

console.log('🔗 Teste de Integração do Design System');
console.log('=====================================\n');

// Arquivos que devem estar usando o design system
const integrationFiles = [
  {
    path: 'src/components/clientes/ClienteModal.jsx',
    name: 'Cliente Modal',
    shouldContain: ['StandardButton', 'StandardInput', 'variant="success"', 'variant="secondary"'],
    shouldNotContain: ['getButtonClass', 'Button type="button"']
  },
  {
    path: 'src/components/clientes/VeiculoModal.jsx',
    name: 'Veículo Modal',
    shouldContain: ['StandardButton', 'variant="success"', 'variant="secondary"'],
    shouldNotContain: ['bg-green-600', 'hover:bg-green-700']
  }
];

let successCount = 0;
let totalTests = 0;

// Função para testar integração
function testIntegration(fileConfig) {
  totalTests++;
  console.log(`📋 Testando: ${fileConfig.name}`);
  
  try {
    const filePath = path.join(process.cwd(), fileConfig.path);
    
    if (!fs.existsSync(filePath)) {
      console.log(`❌ Arquivo não encontrado: ${fileConfig.path}`);
      return false;
    }
    
    const content = fs.readFileSync(filePath, 'utf8');
    let issues = [];
    
    // Verificar items que devem estar presentes
    fileConfig.shouldContain.forEach(item => {
      if (!content.includes(item)) {
        issues.push(`Ausente: ${item}`);
      }
    });
    
    // Verificar items que NÃO devem estar presentes
    if (fileConfig.shouldNotContain) {
      fileConfig.shouldNotContain.forEach(item => {
        if (content.includes(item)) {
          issues.push(`Ainda presente: ${item}`);
        }
      });
    }
    
    if (issues.length > 0) {
      console.log(`⚠️  Problemas encontrados:`);
      issues.forEach(issue => console.log(`   • ${issue}`));
      return false;
    }
    
    console.log(`✅ ${fileConfig.name} - Integrado corretamente`);
    successCount++;
    return true;
    
  } catch (error) {
    console.log(`❌ Erro ao testar ${fileConfig.name}: ${error.message}`);
    return false;
  }
}

// Executar testes
console.log('🔍 Verificando integração do design system...\n');

integrationFiles.forEach(fileConfig => {
  testIntegration(fileConfig);
  console.log('');
});

// Testes adicionais
console.log('🎯 Testes de Funcionalidade:\n');

// Teste 1: Verificar se os componentes do design system são importados corretamente
totalTests++;
try {
  const indexPath = path.join(process.cwd(), 'src/components/ui/index.js');
  const indexContent = fs.readFileSync(indexPath, 'utf8');
  
  const requiredExports = ['StandardButton', 'StandardInput', 'StandardCard', 'IconSystem'];
  let allExportsPresent = requiredExports.every(exp => indexContent.includes(exp));
  
  if (allExportsPresent) {
    console.log('✅ Exportações do design system funcionando');
    successCount++;
  } else {
    console.log('❌ Problemas com exportações do design system');
  }
} catch (error) {
  console.log('❌ Erro ao verificar exportações');
}

// Teste 2: Verificar se não há conflitos de imports
totalTests++;
try {
  const clienteModalPath = path.join(process.cwd(), 'src/components/clientes/ClienteModal.jsx');
  const clienteModalContent = fs.readFileSync(clienteModalPath, 'utf8');
  
  // Verificar se não há imports duplicados ou conflitantes
  const hasOldButton = clienteModalContent.includes('import { Button } from "@/components/ui/button"');
  const hasNewButton = clienteModalContent.includes('StandardButton');
  
  if (!hasOldButton && hasNewButton) {
    console.log('✅ Imports limpos - sem conflitos');
    successCount++;
  } else {
    console.log('❌ Conflitos de import detectados');
    if (hasOldButton) console.log('   • Ainda importando Button antigo');
  }
} catch (error) {
  console.log('❌ Erro ao verificar conflitos de import');
}

// Teste 3: Verificar estrutura de cores do design system
totalTests++;
try {
  const designSystemPath = path.join(process.cwd(), 'src/lib/designSystem.js');
  const designSystemContent = fs.readFileSync(designSystemPath, 'utf8');
  
  const requiredColors = ['primary', 'success', 'danger', 'warning', 'gray'];
  const hasAllColors = requiredColors.every(color => 
    designSystemContent.includes(`${color}: {`) && 
    designSystemContent.includes('500:') // Verifica se tem as variações
  );
  
  if (hasAllColors) {
    console.log('✅ Sistema de cores completo e funcional');
    successCount++;
  } else {
    console.log('❌ Problemas com sistema de cores');
  }
} catch (error) {
  console.log('❌ Erro ao verificar sistema de cores');
}

// Relatório final
console.log('\n📊 RESULTADO DA INTEGRAÇÃO:');
console.log('============================');
console.log(`✅ Sucessos: ${successCount}/${totalTests}`);
console.log(`📈 Taxa de sucesso: ${((successCount/totalTests) * 100).toFixed(1)}%`);

if (successCount === totalTests) {
  console.log('\n🎉 DESIGN SYSTEM INTEGRADO COM SUCESSO!');
  console.log('📋 Benefícios implementados:');
  console.log('   • Consistência visual entre componentes');
  console.log('   • Padronização de cores e estilos');
  console.log('   • Componentes reutilizáveis');
  console.log('   • Manutenção simplificada');
  console.log('   • Melhor experiência do desenvolvedor');
} else {
  console.log('\n⚠️  Integração parcial concluída');
  console.log(`   ${totalTests - successCount} item(s) requerem atenção`);
}

console.log('\n🚀 Próximas ações:');
console.log('   1. Aplicar design system aos demais componentes');
console.log('   2. Testar funcionalidade em ambiente de produção');
console.log('   3. Documentar padrões de uso');
console.log('   4. Iniciar Sprint 5 - Performance');