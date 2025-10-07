// Versão simples do App para debug
import React from 'react';

export default function AppSimple() {
  const apiUrl = import.meta.env.VITE_API_BASE_URL;
  
  return (
    <div style={{
      padding: '20px',
      fontFamily: 'Arial, sans-serif',
      maxWidth: '800px',
      margin: '0 auto',
      backgroundColor: '#f5f5f5',
      minHeight: '100vh'
    }}>
      <div style={{
        backgroundColor: 'white',
        padding: '20px',
        borderRadius: '8px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
      }}>
        <h1>🔧 OFIX - Sistema Online!</h1>
        
        <div style={{
          backgroundColor: '#d4edda',
          color: '#155724',
          padding: '15px',
          borderRadius: '4px',
          border: '1px solid #c3e6cb',
          marginBottom: '20px'
        }}>
          ✅ Frontend deployado com sucesso!
        </div>
        
        <h2>📊 Informações do Sistema</h2>
        <ul style={{ backgroundColor: '#f8f9fa', padding: '15px', borderRadius: '4px' }}>
          <li><strong>API URL:</strong> {apiUrl || 'NÃO CONFIGURADA'}</li>
          <li><strong>Environment:</strong> {import.meta.env.MODE}</li>
          <li><strong>Timestamp:</strong> {new Date().toLocaleString('pt-BR')}</li>
          <li><strong>Status:</strong> Sistema funcionando</li>
        </ul>
        
        <h2>🔗 Links do Sistema</h2>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <a 
            href="https://ofix-backend-prod.onrender.com/health" 
            target="_blank" 
            rel="noopener noreferrer"
            style={{
              backgroundColor: '#007bff',
              color: 'white',
              padding: '10px 15px',
              textDecoration: 'none',
              borderRadius: '4px',
              display: 'inline-block'
            }}
          >
            🩺 Test Backend Health
          </a>
          
          <a 
            href="https://ofix-backend-prod.onrender.com" 
            target="_blank" 
            rel="noopener noreferrer"
            style={{
              backgroundColor: '#28a745',
              color: 'white',
              padding: '10px 15px',
              textDecoration: 'none',
              borderRadius: '4px',
              display: 'inline-block'
            }}
          >
            🔗 Backend API
          </a>
        </div>
        
        <h2>🚀 Status do Deploy</h2>
        <ol>
          <li>✅ Backend funcionando no Render</li>
          <li>✅ Frontend deployado no Vercel</li>
          <li>🔄 Testando conectividade completa</li>
          <li>🎯 Sistema pronto para uso!</li>
        </ol>
        
        <div style={{
          backgroundColor: '#d1ecf1',
          color: '#0c5460',
          padding: '15px',
          borderRadius: '4px',
          border: '1px solid #bee5eb',
          marginTop: '20px'
        }}>
          <strong>💡 Nota:</strong> Se você está vendo esta página, significa que o deploy do frontend funcionou! 
          O sistema está online e funcionando.
        </div>
      </div>
    </div>
  );
}