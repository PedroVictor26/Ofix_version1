// test-sprint4-design-system.cjs
// Teste para verificar a implementação do Sprint 4 - Design System

const fs = require('fs');
const path = require('path');

console.log('🎨 Teste do Sprint 4 - Design System OFIX');
console.log('================================================\n');

// Configuração de arquivos para testar
const testFiles = [
  {
    path: 'src/lib/designSystem.js',
    name: 'Sistema de Design Principal',
    required: ['colors', 'buttonVariants', 'inputVariants', 'cardVariants', 'getButtonClass', 'getInputClass', 'getCardClass']
  },
  {
    path: 'src/components/ui/IconSystem.jsx',
    name: 'Sistema de Ícones',
    required: ['iconMap', 'Icon', 'ActionIcon', 'EntityIcon', 'StatusIcon', 'IconButton']
  },
  {
    path: 'src/components/ui/StandardButton.jsx',
    name: 'Botão Padronizado',
    required: ['StandardButton', 'forwardRef', 'loading', 'icon']
  },
  {
    path: 'src/components/ui/StandardInput.jsx',
    name: 'Input Padronizado',
    required: ['StandardInput', 'error', 'success', 'helperText', 'label']
  },
  {
    path: 'src/components/ui/StandardCard.jsx',
    name: 'Card Padronizado',
    required: ['StandardCard', 'Header', 'Content', 'Footer']
  },
  {
    path: 'src/components/ui/index.js',
    name: 'Índice de Componentes UI',
    required: ['StandardButton', 'StandardInput', 'StandardCard', 'IconSystem', 'colors']
  }
];

let successCount = 0;
let totalTests = 0;

// Função para verificar arquivo
function testFile(fileConfig) {
  totalTests++;
  console.log(`📋 Testando: ${fileConfig.name}`);
  
  try {
    const filePath = path.join(process.cwd(), fileConfig.path);
    
    if (!fs.existsSync(filePath)) {
      console.log(`❌ Arquivo não encontrado: ${fileConfig.path}`);
      return false;
    }
    
    const content = fs.readFileSync(filePath, 'utf8');
    let missingItems = [];
    
    // Verificar se todos os itens obrigatórios estão presentes
    fileConfig.required.forEach(item => {
      if (!content.includes(item)) {
        missingItems.push(item);
      }
    });
    
    if (missingItems.length > 0) {
      console.log(`⚠️  Itens ausentes: ${missingItems.join(', ')}`);
      return false;
    }
    
    console.log(`✅ ${fileConfig.name} - OK`);
    successCount++;
    return true;
    
  } catch (error) {
    console.log(`❌ Erro ao testar ${fileConfig.name}: ${error.message}`);
    return false;
  }
}

// Executar testes
console.log('🔍 Executando verificações...\n');

testFiles.forEach(fileConfig => {
  testFile(fileConfig);
  console.log('');
});

// Testes específicos do design system
console.log('🎯 Testes específicos do Design System:\n');

// Teste 1: Verificar paleta de cores
totalTests++;
try {
  const designSystemPath = path.join(process.cwd(), 'src/lib/designSystem.js');
  const designSystemContent = fs.readFileSync(designSystemPath, 'utf8');
  
  const colorVariants = ['primary', 'success', 'danger', 'warning', 'gray'];
  const colorShades = ['50', '100', '200', '300', '400', '500', '600', '700', '800', '900'];
  
  let colorSystemValid = true;
  colorVariants.forEach(variant => {
    if (!designSystemContent.includes(`${variant}: {`)) {
      colorSystemValid = false;
    }
  });
  
  // Verificar shades
  colorShades.forEach(shade => {
    if (!designSystemContent.includes(`${shade}:`)) {
      colorSystemValid = false;
    }
  });
  
  if (colorSystemValid) {
    console.log('✅ Sistema de cores completo');
    successCount++;
  } else {
    console.log('❌ Sistema de cores incompleto');
  }
} catch (error) {
  console.log('❌ Erro ao verificar sistema de cores');
}

// Teste 2: Verificar variantes de botão
totalTests++;
try {
  const designSystemPath = path.join(process.cwd(), 'src/lib/designSystem.js');
  const designSystemContent = fs.readFileSync(designSystemPath, 'utf8');
  
  const buttonVariants = ['primary', 'secondary', 'success', 'danger', 'warning'];
  let buttonSystemValid = buttonVariants.every(variant => 
    designSystemContent.includes(`${variant}:`) || designSystemContent.includes(`'${variant}'`)
  );
  
  if (buttonSystemValid) {
    console.log('✅ Sistema de variantes de botão completo');
    successCount++;
  } else {
    console.log('❌ Sistema de variantes de botão incompleto');
  }
} catch (error) {
  console.log('❌ Erro ao verificar variantes de botão');
}

// Teste 3: Verificar categorias de ícones
totalTests++;
try {
  const iconSystemPath = path.join(process.cwd(), 'src/components/ui/IconSystem.jsx');
  const iconSystemContent = fs.readFileSync(iconSystemPath, 'utf8');
  
  const iconCategories = ['entities', 'actions', 'navigation', 'status', 'contact'];
  let iconSystemValid = iconCategories.every(category => 
    iconSystemContent.includes(category)
  );
  
  if (iconSystemValid) {
    console.log('✅ Sistema de categorias de ícones completo');
    successCount++;
  } else {
    console.log('❌ Sistema de categorias de ícones incompleto');
  }
} catch (error) {
  console.log('❌ Erro ao verificar categorias de ícones');
}

// Teste 4: Verificar exportações do índice
totalTests++;
try {
  const indexPath = path.join(process.cwd(), 'src/components/ui/index.js');
  const indexContent = fs.readFileSync(indexPath, 'utf8');
  
  const requiredExports = ['StandardButton', 'StandardInput', 'StandardCard', 'IconSystem', 'colors'];
  let exportsValid = requiredExports.every(exportItem => 
    indexContent.includes(exportItem)
  );
  
  if (exportsValid) {
    console.log('✅ Sistema de exportações completo');
    successCount++;
  } else {
    console.log('❌ Sistema de exportações incompleto');
  }
} catch (error) {
  console.log('❌ Erro ao verificar exportações');
}

// Relatório final
console.log('\n📊 RESULTADO DOS TESTES:');
console.log('========================');
console.log(`✅ Sucessos: ${successCount}/${totalTests}`);
console.log(`📈 Taxa de sucesso: ${((successCount/totalTests) * 100).toFixed(1)}%`);

if (successCount === totalTests) {
  console.log('\n🎉 SPRINT 4 - DESIGN SYSTEM IMPLEMENTADO COM SUCESSO!');
  console.log('📋 Todos os componentes do design system foram criados:');
  console.log('   • Sistema de cores padronizado');
  console.log('   • Variantes de botões consistentes');
  console.log('   • Sistema de ícones categorizado');
  console.log('   • Componentes input padronizados');
  console.log('   • Sistema de cards reutilizáveis');
  console.log('   • Exportações organizadas');
} else {
  console.log('\n⚠️  Alguns componentes precisam de ajustes');
  console.log(`   ${totalTests - successCount} item(s) requerem atenção`);
}

console.log('\n🔄 Próximos passos:');
console.log('   1. Integrar design system nos componentes existentes');
console.log('   2. Aplicar cores e estilos padronizados');
console.log('   3. Substituir botões antigos pelos novos componentes');
console.log('   4. Testar consistência visual');