/**
 * 🧪 TESTE DE ENDPOINTS DO AGNO AI
 * 
 * Este script testa diferentes endpoints para descobrir qual funciona
 */

const AGNO_URL = 'https://matias-agno-assistant.onrender.com';

// Lista de endpoints possíveis para testar
const ENDPOINTS_PARA_TESTAR = [
    '/agents/oficinaia/runs',
    '/agents/matias/runs',
    '/chat',
    '/api/chat',
    '/run',
    '/api/run',
    '/agents/oficinaia/chat',
    '/v1/chat',
    '/'
];

async function testarEndpoint(endpoint) {
    console.log(`\n🔍 Testando: ${AGNO_URL}${endpoint}`);
    
    try {
        const response = await fetch(`${AGNO_URL}${endpoint}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                message: 'teste',
                user_id: 'test_user'
            })
        });

        console.log(`   Status: ${response.status} ${response.statusText}`);
        
        if (response.ok) {
            const data = await response.json();
            console.log(`   ✅ SUCESSO!`);
            console.log(`   Resposta:`, JSON.stringify(data, null, 2));
            return { endpoint, success: true, data };
        } else {
            const text = await response.text();
            console.log(`   ❌ Erro: ${text.substring(0, 100)}`);
            return { endpoint, success: false, error: text };
        }
    } catch (error) {
        console.log(`   ❌ Exceção: ${error.message}`);
        return { endpoint, success: false, error: error.message };
    }
}

async function testarRaiz() {
    console.log(`\n📋 Testando endpoint raiz (GET): ${AGNO_URL}/`);
    
    try {
        const response = await fetch(`${AGNO_URL}/`, {
            method: 'GET'
        });

        console.log(`   Status: ${response.status} ${response.statusText}`);
        const text = await response.text();
        console.log(`   Resposta:`, text.substring(0, 200));
        
        return text;
    } catch (error) {
        console.log(`   ❌ Erro: ${error.message}`);
        return null;
    }
}

async function main() {
    console.log('🚀 INICIANDO TESTES DE ENDPOINTS DO AGNO AI');
    console.log('='.repeat(60));
    console.log(`URL Base: ${AGNO_URL}`);
    
    // Primeiro, testar a raiz para ver se o serviço está online
    await testarRaiz();
    
    console.log('\n' + '='.repeat(60));
    console.log('🔍 TESTANDO ENDPOINTS DE CHAT');
    console.log('='.repeat(60));
    
    const resultados = [];
    
    for (const endpoint of ENDPOINTS_PARA_TESTAR) {
        const resultado = await testarEndpoint(endpoint);
        resultados.push(resultado);
        
        // Aguardar um pouco entre requisições
        await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    console.log('\n' + '='.repeat(60));
    console.log('📊 RESUMO DOS TESTES');
    console.log('='.repeat(60));
    
    const sucessos = resultados.filter(r => r.success);
    const falhas = resultados.filter(r => !r.success);
    
    if (sucessos.length > 0) {
        console.log('\n✅ ENDPOINTS QUE FUNCIONARAM:');
        sucessos.forEach(r => {
            console.log(`   • ${r.endpoint}`);
        });
    } else {
        console.log('\n❌ Nenhum endpoint funcionou');
    }
    
    if (falhas.length > 0) {
        console.log('\n❌ ENDPOINTS QUE FALHARAM:');
        falhas.forEach(r => {
            console.log(`   • ${r.endpoint} - ${r.error?.substring(0, 50) || 'Erro desconhecido'}`);
        });
    }
    
    console.log('\n' + '='.repeat(60));
    console.log('💡 PRÓXIMOS PASSOS:');
    
    if (sucessos.length > 0) {
        console.log(`\n✅ Use o endpoint: ${sucessos[0].endpoint}`);
        console.log('\nExemplo de uso:');
        console.log(`
const response = await fetch('${AGNO_URL}${sucessos[0].endpoint}', {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json'
    },
    body: JSON.stringify({
        message: 'sua mensagem aqui',
        user_id: 'user_123'
    })
});
        `);
    } else {
        console.log('\n⚠️ Nenhum endpoint funcionou. Possíveis causas:');
        console.log('   1. O serviço Agno pode estar offline');
        console.log('   2. Pode ser necessário autenticação (token)');
        console.log('   3. O formato da requisição pode estar incorreto');
        console.log('   4. A URL base pode estar incorreta');
        console.log('\n💡 Verifique a documentação do Agno ou os logs do serviço');
    }
}

// Executar
main().catch(console.error);
