// Vercel Serverless Function para Agno AI Integration
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
    const { message = '', action = 'chat' } = req.body || {};
    
    // URLs do Agno Service
    const AGNO_SERVICE_URL = process.env.VITE_AGNO_SERVICE_URL || 'https://matias-agno-assistant.onrender.com';
    const AGNO_AGENT_ID = process.env.VITE_AGNO_AGENT_ID || 'oficinaia';

    // Tentar conectar com o serviço Agno
    try {
      const agnoResponse = await fetch(`${AGNO_SERVICE_URL}/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: message,
          agent_id: AGNO_AGENT_ID,
          session_id: `ofix-${Date.now()}`
        }),
        timeout: 10000 // 10 segundos timeout
      });

      if (agnoResponse.ok) {
        const agnoData = await agnoResponse.json();
        return res.status(200).json({
          success: true,
          response: agnoData.response || agnoData.message,
          source: 'agno-service',
          timestamp: new Date().toISOString()
        });
      }
    } catch (agnoError) {
      // Fallback para resposta local se Agno não responder
    }

    // Fallback - Resposta inteligente local
    let response = '';
    const msgLower = message.toLowerCase();

    if (msgLower.includes('orcamento') || msgLower.includes('orçamento')) {
      response = `🤖 **OFIX Assistant**

📋 **Gestão de Orçamentos:**
• Acesse "Orçamentos" no menu lateral
• Clique em "Novo Orçamento" 
• Adicione serviços e peças
• Sistema calcula totais automaticamente
• Converta em ordem de serviço quando aprovado

💡 **Dica:** Use templates para agilizar o processo!`;

    } else if (msgLower.includes('cliente')) {
      response = `🤖 **OFIX Assistant**

👥 **Cadastro de Clientes:**
• Menu "Clientes" → "Novo Cliente"
• Dados essenciais: Nome, telefone, e-mail
• Histórico automático de serviços
• Busca rápida por nome ou telefone

📱 **Campos importantes:** CPF, endereço, observações`;

    } else if (msgLower.includes('servico') || msgLower.includes('serviço')) {
      response = `🤖 **OFIX Assistant**

🔧 **Ordens de Serviço:**
• Crie a partir de orçamento aprovado
• Ou diretamente em "Serviços"
• Status: Pendente → Em Andamento → Concluído
• Registre tempo e materiais

⚡ **Acompanhamento:** Dashboard mostra progresso em tempo real`;

    } else {
      response = `🤖 **OFIX Assistant**

Olá! Sou seu assistente virtual do OFIX.

🚗 **Sistema de Gestão para Oficinas**
• 👥 Gestão de clientes
• 📋 Orçamentos inteligentes  
• 🔧 Ordens de serviço
• 📦 Controle de estoque
• 📊 Relatórios detalhados

❓ **Como posso ajudar?** Digite sua dúvida sobre qualquer funcionalidade!`;
    }

    return res.status(200).json({
      success: true,
      response: response,
      source: 'local-fallback',
      timestamp: new Date().toISOString(),
      message_received: message
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      error: 'Erro interno do servidor',
      details: error.message,
      fallback_response: `🤖 **OFIX Assistant**

⚠️ Sistema temporariamente indisponível, mas estou aqui!

🚗 **OFIX - Gestão Completa para Oficinas**
• Clientes, orçamentos e serviços
• Controle de estoque integrado
• Relatórios financeiros detalhados

💬 **Tente novamente em alguns instantes**`
    });
  }
}