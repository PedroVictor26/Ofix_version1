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
    const { message = '' } = req.body || {};
    
    // URLs do Agno Service (sempre usar o Matias hospedado)
    const AGNO_SERVICE_URL = 'https://matias-agno-assistant.onrender.com';
    const AGNO_AGENT_ID = 'oficinaia';

    // SEMPRE tentar conectar com o serviço Agno hospedado
    const agnoResponse = await fetch(`${AGNO_SERVICE_URL}/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: message,
        agent_id: AGNO_AGENT_ID,
        session_id: `ofix-${Date.now()}`
      })
    });

    if (agnoResponse.ok) {
      const agnoData = await agnoResponse.json();
      return res.status(200).json({
        success: true,
        response: agnoData.response || agnoData.message,
        source: 'agno-service',
        timestamp: new Date().toISOString(),
        agent_id: AGNO_AGENT_ID
      });
    } else {
      // Se o serviço Agno retornar erro, retornar o erro
      throw new Error(`Agno service returned status: ${agnoResponse.status}`);
    }

  } catch (error) {
    // Se houver qualquer erro, retornar erro claro
    return res.status(503).json({
      success: false,
      error: 'Serviço de IA temporariamente indisponível',
      details: `Não foi possível conectar com o assistente Matias: ${error.message}`,
      timestamp: new Date().toISOString(),
      suggestion: 'Tente novamente em alguns instantes'
    });
  }
}