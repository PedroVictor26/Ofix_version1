import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import {
  Bot,
  Cpu,
  Cloud,
  HardDrive,
  Zap,
  CheckCircle,
  XCircle,
  RefreshCw,
  PlayCircle,
  Download,
  Brain
} from 'lucide-react';

/**
 * Dashboard para gestão de provedores de IA
 * Permite testar, comparar e configurar diferentes modelos de IA
 */
const AIProviderDashboard = ({ className = '' }) => {
  const [providers, setProviders] = useState({});
  const [currentProvider, setCurrentProvider] = useState('ollama');
  const [loading, setLoading] = useState(false);
  const [testPrompt, setTestPrompt] = useState('Explique brevemente o que é manutenção preventiva automotiva');
  const [testResults, setTestResults] = useState({});
  const [ollamaModels, setOllamaModels] = useState({ installed: [], recommended: [] });

  useEffect(() => {
    loadProviderStatus();
    loadOllamaModels();
  }, []);

  const loadProviderStatus = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/ai/providers/status', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setProviders(data.providers);
        setCurrentProvider(data.currentProvider);
      }
    } catch (error) {
      console.error('Erro ao carregar status dos provedores:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadOllamaModels = async () => {
    try {
      const response = await fetch('/api/ai/models/ollama/list', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setOllamaModels(data);
      }
    } catch (error) {
      console.warn('Ollama não disponível');
    }
  };

  const testProvider = async (providerName) => {
    try {
      setLoading(true);
      const response = await fetch('/api/ai/providers/test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          provider: providerName,
          prompt: testPrompt
        })
      });
      
      const result = await response.json();
      setTestResults(prev => ({
        ...prev,
        [providerName]: result
      }));
    } catch (error) {
      setTestResults(prev => ({
        ...prev,
        [providerName]: { success: false, error: error.message }
      }));
    } finally {
      setLoading(false);
    }
  };

  const compareAllProviders = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/ai/providers/compare', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          prompt: testPrompt,
          providers: ['ollama', 'huggingface']
        })
      });
      
      const result = await response.json();
      setTestResults(result.results);
    } catch (error) {
      console.error('Erro na comparação:', error);
    } finally {
      setLoading(false);
    }
  };

  const installOllamaModel = async (modelName) => {
    try {
      const response = await fetch('/api/ai/models/ollama/install', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ modelName })
      });
      
      const result = await response.json();
      alert(result.message);
      
      // Recarregar lista após alguns segundos
      setTimeout(loadOllamaModels, 3000);
    } catch (error) {
      alert('Erro ao instalar modelo: ' + error.message);
    }
  };

  const getProviderIcon = (providerName) => {
    const icons = {
      'ollama': HardDrive,
      'huggingface': Cloud,
      'openai': Zap,
      'custom': Brain
    };
    
    const Icon = icons[providerName] || Bot;
    return <Icon className="h-6 w-6" />;
  };

  const getProviderColor = (available) => {
    return available ? 'text-green-600' : 'text-red-600';
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">🤖 Gestão de IA</h2>
          <p className="text-gray-600">Configure e teste diferentes provedores de inteligência artificial</p>
        </div>
        
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={loadProviderStatus}
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>
        </div>
      </div>

      {/* Provedor Atual */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Cpu className="h-5 w-5 mr-2" />
            Provedor Atual: {currentProvider}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-gray-600">
            O sistema está configurado para usar <strong>{currentProvider}</strong> como provedor principal.
            Configure outras opções no arquivo .env para ter alternativas.
          </div>
        </CardContent>
      </Card>

      {/* Grid de Provedores */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {Object.entries(providers).map(([name, info]) => (
          <Card key={name} className="relative">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center">
                  <div className={getProviderColor(info.available)}>
                    {getProviderIcon(name)}
                  </div>
                  <div className="ml-3">
                    <h3 className="font-semibold capitalize">{name}</h3>
                    <Badge variant={info.available ? "default" : "secondary"}>
                      {info.available ? 'Online' : 'Offline'}
                    </Badge>
                  </div>
                </div>
                
                {currentProvider === name && (
                  <Badge variant="outline" className="text-xs">
                    Ativo
                  </Badge>
                )}
              </div>
              
              <p className="text-sm text-gray-600 mb-4">
                {info.description}
              </p>
              
              {info.available && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => testProvider(name)}
                  disabled={loading}
                  className="w-full"
                >
                  <PlayCircle className="h-4 w-4 mr-2" />
                  Testar
                </Button>
              )}
              
              {info.error && (
                <div className="text-xs text-red-600 mt-2">
                  {info.error}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Teste Comparativo */}
      <Card>
        <CardHeader>
          <CardTitle>🧪 Teste Comparativo</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Prompt de Teste
              </label>
              <Textarea
                value={testPrompt}
                onChange={(e) => setTestPrompt(e.target.value)}
                placeholder="Digite um prompt para testar os provedores..."
                rows={3}
              />
            </div>
            
            <Button
              onClick={compareAllProviders}
              disabled={loading}
              className="w-full"
            >
              <Zap className="h-4 w-4 mr-2" />
              Comparar Todos os Provedores
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Resultados dos Testes */}
      {Object.keys(testResults).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>📊 Resultados dos Testes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {Object.entries(testResults).map(([provider, result]) => (
                <div key={provider} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-semibold capitalize flex items-center">
                      {getProviderIcon(provider)}
                      <span className="ml-2">{provider}</span>
                    </h4>
                    
                    <div className="flex items-center space-x-2">
                      {result.success ? (
                        <CheckCircle className="h-5 w-5 text-green-600" />
                      ) : (
                        <XCircle className="h-5 w-5 text-red-600" />
                      )}
                      
                      {result.responseTime && (
                        <Badge variant="outline">
                          {result.responseTime}ms
                        </Badge>
                      )}
                    </div>
                  </div>
                  
                  {result.success ? (
                    <div>
                      <p className="text-sm text-gray-600 mb-2">
                        <strong>Resposta:</strong>
                      </p>
                      <div className="bg-gray-50 p-3 rounded text-sm">
                        {result.response}
                      </div>
                      
                      {result.model && (
                        <p className="text-xs text-gray-500 mt-2">
                          Modelo: {result.model}
                        </p>
                      )}
                    </div>
                  ) : (
                    <div className="text-red-600 text-sm">
                      Erro: {result.error}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Gestão de Modelos Ollama */}
      {providers.ollama?.available && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <HardDrive className="h-5 w-5 mr-2" />
              Modelos Ollama
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Modelos Instalados */}
              <div>
                <h4 className="font-medium mb-2">Modelos Instalados</h4>
                {ollamaModels.installed?.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {ollamaModels.installed.map((model, index) => (
                      <div key={index} className="flex items-center justify-between p-2 bg-green-50 rounded">
                        <span className="text-sm font-mono">{model.name}</span>
                        <Badge variant="outline" className="text-xs">
                          Instalado
                        </Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-600">Nenhum modelo instalado</p>
                )}
              </div>
              
              {/* Modelos Recomendados */}
              <div>
                <h4 className="font-medium mb-2">Modelos Recomendados</h4>
                <div className="space-y-2">
                  {ollamaModels.recommended?.map((model, index) => (
                    <div key={index} className="flex items-center justify-between p-2 border rounded">
                      <div>
                        <span className="text-sm font-mono">{model.name}</span>
                        <p className="text-xs text-gray-600">{model.description}</p>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <Badge variant="outline" className="text-xs">
                          {model.size}
                        </Badge>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => installOllamaModel(model.name)}
                        >
                          <Download className="h-4 w-4 mr-1" />
                          Instalar
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Configuração Rápida */}
      <Card>
        <CardHeader>
          <CardTitle>⚡ Configuração Rápida</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center p-4 border rounded-lg">
                <HardDrive className="h-8 w-8 mx-auto mb-2 text-blue-600" />
                <h4 className="font-medium">IA Local (Ollama)</h4>
                <p className="text-sm text-gray-600">Instale Ollama para IA gratuita</p>
                <Button 
                  size="sm" 
                  variant="outline" 
                  className="mt-2"
                  onClick={() => window.open('https://ollama.ai/download', '_blank')}
                >
                  Download Ollama
                </Button>
              </div>
              
              <div className="text-center p-4 border rounded-lg">
                <Cloud className="h-8 w-8 mx-auto mb-2 text-green-600" />
                <h4 className="font-medium">Hugging Face</h4>
                <p className="text-sm text-gray-600">Token gratuito para modelos online</p>
                <Button 
                  size="sm" 
                  variant="outline" 
                  className="mt-2"
                  onClick={() => window.open('https://huggingface.co/settings/tokens', '_blank')}
                >
                  Gerar Token
                </Button>
              </div>
              
              <div className="text-center p-4 border rounded-lg">
                <Brain className="h-8 w-8 mx-auto mb-2 text-purple-600" />
                <h4 className="font-medium">Modelo Customizado</h4>
                <p className="text-sm text-gray-600">Treine com dados da sua oficina</p>
                <Button 
                  size="sm" 
                  variant="outline" 
                  className="mt-2"
                  disabled
                >
                  Em Desenvolvimento
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AIProviderDashboard;
