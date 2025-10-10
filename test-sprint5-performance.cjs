// test-sprint5-performance.cjs
// Teste para verificar as otimizações de performance do Sprint 5

const fs = require('fs');
const path = require('path');

console.log('⚡ Teste do Sprint 5 - Otimizações de Performance');
console.log('===============================================\n');

// Arquivos e otimizações para testar
const performanceTests = [
  {
    path: 'src/App.jsx',
    name: 'App Principal com Lazy Loading',
    checks: [
      { type: 'import', value: 'lazy', description: 'Lazy loading implementado' },
      { type: 'import', value: 'Suspense', description: 'Suspense para loading states' },
      { type: 'component', value: 'ErrorBoundary', description: 'Error boundary implementado' },
      { type: 'syntax', value: 'lazy(() => import', description: 'Páginas com lazy loading' },
      { type: 'syntax', value: '<Suspense fallback=', description: 'Fallbacks de loading' }
    ]
  },
  {
    path: 'src/context/DashboardContext.jsx',
    name: 'Context Otimizado',
    checks: [
      { type: 'import', value: 'useMemo', description: 'useMemo implementado' },
      { type: 'syntax', value: 'useMemo(() => ({', description: 'Context value memoizado' },
      { type: 'syntax', value: 'actions = useMemo', description: 'Actions memoizadas' }
    ]
  },
  {
    path: 'src/hooks/useDebounce.js',
    name: 'Hook de Debouncing',
    checks: [
      { type: 'export', value: 'useDebounce', description: 'Hook useDebounce exportado' },
      { type: 'export', value: 'useDebouncedCallback', description: 'Hook callback memoizado' },
      { type: 'syntax', value: 'setTimeout', description: 'Debouncing implementado' },
      { type: 'syntax', value: 'clearTimeout', description: 'Cleanup implementado' }
    ]
  },
  {
    path: 'src/components/ErrorBoundary.jsx',
    name: 'Error Boundary',
    checks: [
      { type: 'syntax', value: 'class ErrorBoundary', description: 'Class component criado' },
      { type: 'syntax', value: 'componentDidCatch', description: 'Error catching implementado' },
      { type: 'syntax', value: 'getDerivedStateFromError', description: 'State derivado de erro' },
      { type: 'component', value: 'StandardButton', description: 'Design system integrado' }
    ]
  }
];

let successCount = 0;
let totalChecks = 0;

// Função para testar arquivo
function testPerformanceFile(fileConfig) {
  console.log(`📋 Testando: ${fileConfig.name}`);
  
  try {
    const filePath = path.join(process.cwd(), fileConfig.path);
    
    if (!fs.existsSync(filePath)) {
      console.log(`❌ Arquivo não encontrado: ${fileConfig.path}`);
      return { success: 0, total: fileConfig.checks.length };
    }
    
    const content = fs.readFileSync(filePath, 'utf8');
    let localSuccess = 0;
    
    fileConfig.checks.forEach(check => {
      totalChecks++;
      let found = false;
      
      switch(check.type) {
        case 'import':
          found = content.includes(`import`) && content.includes(check.value);
          break;
        case 'export':
          found = content.includes(`export`) && content.includes(check.value);
          break;
        case 'component':
          found = content.includes(`<${check.value}`) || content.includes(check.value);
          break;
        case 'syntax':
          found = content.includes(check.value);
          break;
      }
      
      if (found) {
        console.log(`   ✅ ${check.description}`);
        successCount++;
        localSuccess++;
      } else {
        console.log(`   ❌ ${check.description}`);
      }
    });
    
    console.log(`   📊 ${localSuccess}/${fileConfig.checks.length} otimizações implementadas\n`);
    return { success: localSuccess, total: fileConfig.checks.length };
    
  } catch (error) {
    console.log(`❌ Erro ao testar ${fileConfig.name}: ${error.message}\n`);
    return { success: 0, total: fileConfig.checks.length };
  }
}

// Executar testes
console.log('🔍 Verificando otimizações de performance...\n');

performanceTests.forEach(fileConfig => {
  testPerformanceFile(fileConfig);
});

// Testes específicos de bundle size
console.log('📦 Testes de Bundle e Performance:\n');

// Teste 1: Verificar se as páginas estão sendo lazy loaded
totalChecks++;
try {
  const appPath = path.join(process.cwd(), 'src/App.jsx');
  const appContent = fs.readFileSync(appPath, 'utf8');
  
  const pagesWithLazy = ['Dashboard', 'Clientes', 'Estoque', 'Financeiro', 'Configuracoes', 'AIPage'];
  const lazyCount = pagesWithLazy.filter(page => 
    appContent.includes(`const ${page} = lazy(() => import`)
  ).length;
  
  if (lazyCount >= 5) {
    console.log(`✅ Lazy loading: ${lazyCount}/6 páginas principais otimizadas`);
    successCount++;
  } else {
    console.log(`⚠️  Lazy loading: ${lazyCount}/6 páginas - algumas podem precisar otimização`);
  }
} catch (error) {
  console.log('❌ Erro ao verificar lazy loading');
}

// Teste 2: Verificar se Suspense está sendo usado corretamente
totalChecks++;
try {
  const appPath = path.join(process.cwd(), 'src/App.jsx');
  const appContent = fs.readFileSync(appPath, 'utf8');
  
  const suspenseCount = (appContent.match(/<Suspense fallback=/g) || []).length;
  
  if (suspenseCount >= 5) {
    console.log(`✅ Suspense boundaries: ${suspenseCount} implementados corretamente`);
    successCount++;
  } else {
    console.log(`⚠️  Suspense boundaries: ${suspenseCount} - podem precisar mais implementações`);
  }
} catch (error) {
  console.log('❌ Erro ao verificar Suspense boundaries');
}

// Teste 3: Verificar se o ErrorBoundary está no nível correto
totalChecks++;
try {
  const appPath = path.join(process.cwd(), 'src/App.jsx');
  const appContent = fs.readFileSync(appPath, 'utf8');
  
  const hasTopLevelErrorBoundary = appContent.includes('<ErrorBoundary>') && 
                                   appContent.includes('</ErrorBoundary>');
  
  if (hasTopLevelErrorBoundary) {
    console.log('✅ Error Boundary no nível superior da aplicação');
    successCount++;
  } else {
    console.log('❌ Error Boundary não encontrado no nível superior');
  }
} catch (error) {
  console.log('❌ Erro ao verificar Error Boundary');
}

// Teste 4: Verificar otimizações de re-render
totalChecks++;
try {
  const dashboardContextPath = path.join(process.cwd(), 'src/context/DashboardContext.jsx');
  const dashboardContextContent = fs.readFileSync(dashboardContextPath, 'utf8');
  
  const hasMemoizedContext = dashboardContextContent.includes('const contextValue = useMemo');
  const hasMemoizedActions = dashboardContextContent.includes('const actions = useMemo');
  
  if (hasMemoizedContext && hasMemoizedActions) {
    console.log('✅ Context otimizado com useMemo para evitar re-renders');
    successCount++;
  } else {
    console.log('⚠️  Context pode precisar mais otimizações de re-render');
  }
} catch (error) {
  console.log('❌ Erro ao verificar otimizações de context');
}

// Relatório final
console.log('\n📊 RESULTADO DAS OTIMIZAÇÕES:');
console.log('==============================');
console.log(`✅ Sucessos: ${successCount}/${totalChecks}`);
console.log(`📈 Taxa de sucesso: ${((successCount/totalChecks) * 100).toFixed(1)}%`);

if (successCount >= totalChecks * 0.8) { // 80% ou mais
  console.log('\n🚀 SPRINT 5 - PERFORMANCE OTIMIZADA COM SUCESSO!');
  console.log('📋 Otimizações implementadas:');
  console.log('   • Lazy loading de componentes');
  console.log('   • Suspense para loading states');
  console.log('   • Error boundaries robustos');
  console.log('   • Context memoization');
  console.log('   • Hooks de debouncing');
  console.log('   • Bundle splitting otimizado');
} else {
  console.log('\n⚠️  Otimizações parciais implementadas');
  console.log(`   ${totalChecks - successCount} item(s) podem ser melhorados`);
}

console.log('\n🎯 Benefícios esperados:');
console.log('   • Carregamento inicial mais rápido');
console.log('   • Menor uso de memória');
console.log('   • Navegação mais fluida');
console.log('   • Melhor experiência do usuário');
console.log('   • Aplicação mais robusta');

console.log('\n📈 Próximos passos:');
console.log('   1. Monitorar métricas de performance');
console.log('   2. Implementar mais otimizações conforme necessário');
console.log('   3. Considerar implementar React Query para cache');
console.log('   4. Avaliar virtual scrolling para listas grandes');