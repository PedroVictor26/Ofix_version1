/**
 * 🧪 TESTE DO BACKEND OFIX COM AGNO AI
 * 
 * Este script testa os endpoints do backend após as correções
 */

const BACKEND_URL = 'https://ofix-backend-prod.onrender.com';

async function testarChatPublico() {
    console.log('\n📋 1. TESTANDO /api/agno/chat-public');
    console.log('='.repeat(60));
    
    try {
        const response = await fetch(`${BACKEND_URL}/api/agno/chat-public`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                message: 'Olá, preciso de ajuda com meu carro'
            })
        });

        const data = await response.json();
        
        console.log(`Status: ${response.status}`);
        console.log('Resposta:', JSON.stringify(data, null, 2));
        
        if (data.success && data.response) {
            console.log('✅ SUCESSO - Chat público funcionando!');
            return true;
        } else {
            console.log('❌ FALHA - Resposta inesperada');
            return false;
        }
    } catch (error) {
        console.log('❌ ERRO:', error.message);
        return false;
    }
}

async function testarChatInteligente() {
    console.log('\n📋 2. TESTANDO /api/agno/chat-inteligente');
    console.log('='.repeat(60));
    
    try {
        const response = await fetch(`${BACKEND_URL}/api/agno/chat-inteligente`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                message: 'Quanto custa uma revisão completa?',
                usuario_id: 'test_user_123',
                nlp: {
                    intencao: 'consulta_preco',
                    confianca: 0.95,
                    entidades: {
                        servico: 'revisão completa'
                    }
                }
            })
        });

        const data = await response.json();
        
        console.log(`Status: ${response.status}`);
        console.log('Resposta:', JSON.stringify(data, null, 2));
        
        if (data.success && data.response) {
            console.log('✅ SUCESSO - Chat inteligente funcionando!');
            return true;
        } else {
            console.log('❌ FALHA - Resposta inesperada');
            return false;
        }
    } catch (error) {
        console.log('❌ ERRO:', error.message);
        return false;
    }
}

async function testarConfig() {
    console.log('\n📋 3. TESTANDO /api/agno/config');
    console.log('='.repeat(60));
    
    try {
        const response = await fetch(`${BACKEND_URL}/api/agno/config`);
        const data = await response.json();
        
        console.log(`Status: ${response.status}`);
        console.log('Configuração:', JSON.stringify(data, null, 2));
        
        if (data.configured) {
            console.log('✅ Agno está configurado!');
            console.log(`   URL: ${data.agno_url}`);
            console.log(`   Agent ID: ${data.agent_id}`);
            console.log(`   Status: ${data.status}`);
        } else {
            console.log('⚠️ Agno não está configurado (modo desenvolvimento)');
        }
        
        return true;
    } catch (error) {
        console.log('❌ ERRO:', error.message);
        return false;
    }
}

async function testarDiretamenteAgno() {
    console.log('\n📋 4. TESTANDO DIRETAMENTE O AGNO AI');
    console.log('='.repeat(60));
    
    const AGNO_URL = 'https://matias-agno-assistant.onrender.com';
    
    try {
        const response = await fetch(`${AGNO_URL}/chat`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                message: 'teste de conexão',
                user_id: 'test'
            })
        });

        const data = await response.json();
        
        console.log(`Status: ${response.status}`);
        console.log('Resposta do Agno:', JSON.stringify(data, null, 2).substring(0, 200) + '...');
        
        if (response.ok && data.response) {
            console.log('✅ SUCESSO - Agno AI respondendo corretamente!');
            return true;
        } else {
            console.log('❌ FALHA - Agno não respondeu como esperado');
            return false;
        }
    } catch (error) {
        console.log('❌ ERRO:', error.message);
        return false;
    }
}

async function main() {
    console.log('🚀 INICIANDO TESTES DO BACKEND OFIX + AGNO AI');
    console.log('='.repeat(60));
    console.log(`Backend URL: ${BACKEND_URL}`);
    console.log('');
    
    const resultados = {
        config: false,
        agno_direto: false,
        chat_publico: false,
        chat_inteligente: false
    };
    
    // Teste 1: Verificar configuração
    resultados.config = await testarConfig();
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Teste 2: Testar Agno diretamente
    resultados.agno_direto = await testarDiretamenteAgno();
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Teste 3: Chat público
    resultados.chat_publico = await testarChatPublico();
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Teste 4: Chat inteligente
    resultados.chat_inteligente = await testarChatInteligente();
    
    // Resumo
    console.log('\n' + '='.repeat(60));
    console.log('📊 RESUMO DOS TESTES');
    console.log('='.repeat(60));
    
    const total = Object.keys(resultados).length;
    const sucessos = Object.values(resultados).filter(r => r).length;
    
    console.log(`\n✅ Sucessos: ${sucessos}/${total}`);
    console.log(`❌ Falhas: ${total - sucessos}/${total}`);
    
    console.log('\nDetalhes:');
    console.log(`   ${resultados.config ? '✅' : '❌'} Configuração`);
    console.log(`   ${resultados.agno_direto ? '✅' : '❌'} Agno AI (direto)`);
    console.log(`   ${resultados.chat_publico ? '✅' : '❌'} Chat Público`);
    console.log(`   ${resultados.chat_inteligente ? '✅' : '❌'} Chat Inteligente`);
    
    if (sucessos === total) {
        console.log('\n🎉 TODOS OS TESTES PASSARAM!');
        console.log('✅ O backend está integrado corretamente com o Agno AI');
    } else {
        console.log('\n⚠️ ALGUNS TESTES FALHARAM');
        console.log('💡 Verifique:');
        console.log('   1. O backend está rodando? (npm run dev)');
        console.log('   2. As variáveis de ambiente estão configuradas?');
        console.log('   3. O Agno AI está online?');
    }
}

// Executar
main().catch(console.error);
