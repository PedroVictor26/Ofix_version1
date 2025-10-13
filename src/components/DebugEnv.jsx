import React from 'react';

const DebugEnv = () => {
  // Debug das variáveis de ambiente
  console.log('🔍 Debug Component - import.meta.env:', import.meta.env);
  
  const getApiBaseUrl = () => {
    if (import.meta.env.VITE_API_BASE_URL) {
      return import.meta.env.VITE_API_BASE_URL;
    }
    
    if (window.location.hostname === 'ofix.vercel.app') {
      return 'https://ofix-backend-prod.onrender.com';
    }
    
    if (window.location.hostname === 'localhost') {
      return '';
    }
    
    return 'https://ofix-backend-prod.onrender.com';
  };

  const API_BASE_URL = getApiBaseUrl();
  const ENV_VAR = import.meta.env.VITE_API_BASE_URL || "VARIÁVEL NÃO ENCONTRADA";

  const testAPI = async () => {
    try {
      let url;
      if (API_BASE_URL) {
        url = `${API_BASE_URL}/api/agno/chat-matias`;
      } else {
        url = `/api/agno/chat-matias`;
      }

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: 'teste debug componente',
          user_id: 'debug_component_user'
        })
      });

      if (response.ok) {
        const data = await response.json();
        alert(`✅ SUCESSO!\nStatus: ${response.status}\nURL: ${url}\nAgente: ${data.agent}`);
      } else {
        alert(`❌ ERRO\nStatus: ${response.status}\nURL: ${url}`);
      }
    } catch (error) {
      alert(`❌ ERRO DE CONEXÃO\n${error.message}`);
    }
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <h2>🔍 Debug de Variáveis de Ambiente (React)</h2>
      <div style={{ background: '#f5f5f5', padding: '15px', marginBottom: '20px' }}>
        <p><strong>VITE_API_BASE_URL (env var):</strong> {ENV_VAR}</p>
        <p><strong>API_BASE_URL (computed):</strong> {API_BASE_URL}</p>
        <p><strong>Hostname:</strong> {window.location.hostname}</p>
        <p><strong>Modo:</strong> {import.meta.env.MODE || 'unknown'}</p>
        <p><strong>Desenvolvimento:</strong> {String(import.meta.env.DEV || false)}</p>
        <p><strong>Produção:</strong> {String(import.meta.env.PROD || false)}</p>
        <p><strong>Base URL:</strong> {import.meta.env.BASE_URL || 'N/A'}</p>
        <p><strong>Total env vars:</strong> {Object.keys(import.meta.env).length}</p>
      </div>
      
      <h3>Todas as Variáveis de Ambiente:</h3>
      <pre style={{ background: '#f0f0f0', padding: '10px', fontSize: '12px' }}>
        {JSON.stringify(import.meta.env, null, 2)}
      </pre>
      
      <hr />
      <h3>Teste de API:</h3>
      <button onClick={testAPI} style={{ padding: '10px 20px', fontSize: '16px' }}>
        Testar Conexão com Matias
      </button>
    </div>
  );
};

export default DebugEnv;