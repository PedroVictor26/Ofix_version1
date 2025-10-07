import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { useAuth } from '../../context/AuthContext';

export default function DebugPanel() {
  const { isAuthenticated, token, user } = useAuth();
  const [healthStatus, setHealthStatus] = useState(null);
  const [authTestStatus, setAuthTestStatus] = useState(null);
  const [loading, setLoading] = useState(false);

  const testHealth = async () => {
    setLoading(true);
    try {
  const response = await fetch('/api/agno/health', {
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
      'Content-Type': 'application/json'
    }
  });
      const data = await response.json();
      setHealthStatus({ success: true, data });
    } catch (error) {
      setHealthStatus({ success: false, error: error.message });
    }
    setLoading(false);
  };

  const testAuthEndpoint = async () => {
    setLoading(true);
    try {
  const response = await fetch('/api/ai/suggestions', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      setAuthTestStatus({ success: response.ok, status: response.status, data });
    } catch (error) {
      setAuthTestStatus({ success: false, error: error.message });
    }
    setLoading(false);
  };

  const testChat = async () => {
    setLoading(true);
    try {
  const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          message: 'Olá, este é um teste!'
        })
      });
      const data = await response.json();
      setAuthTestStatus({ success: response.ok, status: response.status, data, type: 'chat' });
    } catch (error) {
      setAuthTestStatus({ success: false, error: error.message, type: 'chat' });
    }
    setLoading(false);
  };

  useEffect(() => {
    testHealth();
  }, []);

  return (
    <Card className="w-full max-w-4xl mx-auto mt-4">
      <CardHeader>
        <CardTitle>Debug Panel - AI Assistant</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        
        {/* Status de Autenticação */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <h3 className="font-semibold mb-2">Status de Autenticação</h3>
            <div className="space-y-2 text-sm">
              <div>Autenticado: <Badge variant={isAuthenticated ? "success" : "destructive"}>{isAuthenticated ? "Sim" : "Não"}</Badge></div>
              <div>Token: <code className="text-xs bg-gray-100 p-1 rounded">{token ? `${token.substring(0, 20)}...` : "Nenhum"}</code></div>
              <div>Usuário: <span>{user?.email || "Não logado"}</span></div>
            </div>
          </div>

          {/* Status do Backend */}
          <div>
            <h3 className="font-semibold mb-2">Status do Backend</h3>
            <div className="space-y-2">
              <Button 
                onClick={testHealth} 
                disabled={loading}
                variant="outline" 
                size="sm"
              >
                Testar Health
              </Button>
              {healthStatus && (
                <div className="text-xs">
                  <Badge variant={healthStatus.success ? "success" : "destructive"}>
                    {healthStatus.success ? "OK" : "Erro"}
                  </Badge>
                  <pre className="mt-2 bg-gray-100 p-2 rounded text-xs overflow-auto">
                    {JSON.stringify(healthStatus, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Testes de API */}
        <div>
          <h3 className="font-semibold mb-2">Testes de API</h3>
          <div className="flex gap-2 mb-4">
            <Button 
              onClick={testAuthEndpoint} 
              disabled={loading || !isAuthenticated}
              size="sm"
            >
              Testar Suggestions
            </Button>
            <Button 
              onClick={testChat} 
              disabled={loading || !isAuthenticated}
              size="sm"
            >
              Testar Chat
            </Button>
          </div>
          
          {authTestStatus && (
            <div>
              <Badge variant={authTestStatus.success ? "success" : "destructive"}>
                {authTestStatus.type === 'chat' ? 'Chat' : 'Suggestions'}: {authTestStatus.success ? "OK" : `Erro ${authTestStatus.status || ''}`}
              </Badge>
              <pre className="mt-2 bg-gray-100 p-2 rounded text-xs overflow-auto max-h-40">
                {JSON.stringify(authTestStatus, null, 2)}
              </pre>
            </div>
          )}
        </div>

        {/* Token Storage */}
        <div>
          <h3 className="font-semibold mb-2">LocalStorage</h3>
          <div className="text-xs">
            <div>Token no localStorage: <code>{localStorage.getItem('token') ? 'Presente' : 'Ausente'}</code></div>
            <div>User no localStorage: <code>{localStorage.getItem('user') ? 'Presente' : 'Ausente'}</code></div>
          </div>
        </div>

      </CardContent>
    </Card>
  );
}
