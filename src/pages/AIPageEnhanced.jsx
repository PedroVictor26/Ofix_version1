/**
 * 🚀 AIPage Enhanced - Interface moderna para o Assistente Matias
 * 
 * Versão simplificada que integra os novos componentes enhanced
 * com o backend existente (MessageClassifier + Agno AI)
 */

import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import MatiasAssistantEnhanced from '../components/ai/MatiasAssistantEnhanced';
import { getApiBaseUrl } from '../utils/api';

// Import design system
import '../styles/matias-design-system.css';
import '../styles/matias-animations.css';

const AIPageEnhanced = () => {
  const { user } = useAuth();
  const [isOnline] = useState(navigator.onLine);

  // Configuração personalizada do assistente
  useEffect(() => {
    // Configuração inicial se necessário
  }, [user]);

  // Configuração do assistente
  const customConfig = {
    apiEndpoint: getApiBaseUrl(),
    user: {
      id: user?.id,
      name: user?.nome || user?.name,
      role: user?.tipo || 'user'
    },
    branding: {
      name: 'Matias',
      title: 'Assistente Inteligente OFIX - Enhanced',
      description: 'Nova versão com recursos avançados',
      avatar: '🤖'
    }
  };

  return (
    <div style={{
      width: '100%',
      height: '100vh',
      display: 'flex',
      flexDirection: 'column',
      background: '#f8fafc',
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      overflow: 'hidden'
    }}>
      {/* Status de conexão */}
      {!isOnline && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          background: '#fef3c7',
          color: '#92400e',
          padding: '0.75rem',
          textAlign: 'center',
          fontSize: '0.875rem',
          fontWeight: 500,
          zIndex: 1000
        }}>
          🔌 Modo Offline
        </div>
      )}

      {/* Forçar o assistente a abrir em fullscreen */}
      <div style={{ 
        width: '100%', 
        height: '100%',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 0,
        margin: 0
      }}>
        <MatiasAssistantEnhanced
          position="center"
          theme="auto"
          language="pt-BR"
          customConfig={customConfig}
          isOpen={true}
          isFullscreen={true}
        />
      </div>
    </div>
  );
};

export default AIPageEnhanced;
