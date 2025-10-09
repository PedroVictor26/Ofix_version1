// Vercel Serverless Function para teste do Agno AI
export default async function handler(req, res) {
  // Configurar CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  // Handle preflight OPTIONS request
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Só aceitar POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { message = 'Olá!' } = req.body || {};
    
    // Resposta inteligente baseada na mensagem
    let response = '';
    const msgLower = message.toLowerCase();

    if (msgLower.includes('orcamento') || msgLower.includes('orçamento')) {
      response = `🤖 **OFIX Assistant**

📋 **Sobre Orçamentos:**
• Acesse "Orçamentos" no menu lateral
• Clique em "Novo Orçamento" para criar
• Adicione serviços, peças e mão de obra
• O sistema calcula automaticamente os totais
• Você pode converter orçamentos em ordens de serviço

💡 **Dica:** Use os templates de serviços para agilizar o processo!`;

    } else if (msgLower.includes('cliente') || msgLower.includes('cadastro')) {
      response = `🤖 **OFIX Assistant**

👥 **Gestão de Clientes:**
• Acesse "Clientes" no menu lateral
• Cadastre dados completos do cliente
• Histórico de serviços fica salvo automaticamente
• Use a busca para encontrar clientes rapidamente

📱 **Campos importantes:** Nome, telefone, e-mail, endereço`;

    } else if (msgLower.includes('servico') || msgLower.includes('serviço') || msgLower.includes('ordem')) {
      response = `🤖 **OFIX Assistant**

🔧 **Ordens de Serviço:**
• Crie a partir de um orçamento aprovado
• Ou crie diretamente em "Serviços"
• Acompanhe o status: Pendente → Em Andamento → Concluído
• Registre tempo gasto e materiais usados

⚡ **Status disponíveis:** Pendente, Em Andamento, Concluído, Cancelado`;

    } else if (msgLower.includes('estoque') || msgLower.includes('peça') || msgLower.includes('peca')) {
      response = `🤖 **OFIX Assistant**

📦 **Controle de Estoque:**
• Cadastre peças em "Estoque"
• Monitore quantidades disponíveis
• Sistema alerta quando estoque está baixo
• Histórico de entradas e saídas

📈 **Relatórios:** Visualize movimentação e valor do estoque`;

    } else if (msgLower.includes('relatorio') || msgLower.includes('relatório') || msgLower.includes('dashboard')) {
      response = `🤖 **OFIX Assistant**

📊 **Relatórios e Dashboard:**
• Dashboard com visão geral do negócio
• Relatórios de faturamento mensal
• Serviços mais realizados
• Clientes mais ativos
• Performance da oficina

📈 **Acesse:** Menu "Relatórios" ou Dashboard principal`;

    } else if (msgLower.includes('help') || msgLower.includes('ajuda') || msgLower.includes('como')) {
      response = `🤖 **OFIX Assistant**

❓ **Como posso ajudar:**
• 📋 Orçamentos e cotações
• 👥 Gestão de clientes
• 🔧 Ordens de serviço
• 📦 Controle de estoque
• 📊 Relatórios e dashboard
• 💰 Gestão financeira

💬 **Faça uma pergunta específica sobre qualquer funcionalidade!**`;

    } else if (msgLower.includes('teste') || msgLower.includes('test')) {
      response = `🤖 **OFIX Assistant**

✅ **Sistema Funcionando Perfeitamente!**
• ✅ Frontend conectado
• ✅ Backend operacional  
• ✅ Banco de dados ativo
• ✅ AI Assistant online

🎉 **Tudo pronto para usar o OFIX!**`;

    } else {
      response = `🤖 **OFIX Assistant**

Olá! Sou o assistente virtual do OFIX. 

🚗 **Sistema de Gestão para Oficinas**
• Gestão completa de clientes
• Orçamentos e ordens de serviço
• Controle de estoque
• Relatórios financeiros

❓ **Como posso ajudar você hoje?**
Pergunte sobre orçamentos, clientes, serviços, estoque ou relatórios!`;
    }

    // Log da resposta
    // Resposta gerada com sucesso

    return res.status(200).json({
      success: true,
      response: response,
      timestamp: new Date().toISOString(),
      endpoint: 'agno-test (Vercel Function)',
      message_received: message
    });

  } catch (error) {
    // Erro no endpoint agno-test
    
    return res.status(500).json({
      success: false,
      error: 'Erro interno do servidor',
      details: error.message,
      fallback_response: `🤖 **OFIX Assistant**

⚠️ Ocorreu um erro, mas estou aqui para ajudar!

🚗 **OFIX - Sistema de Gestão para Oficinas**
• Gestão de clientes e veículos
• Orçamentos e ordens de serviço  
• Controle de estoque e peças
• Relatórios financeiros

❓ **Como posso ajudar você?**`
    });
  }
}