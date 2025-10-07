import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import {
  Settings,
  Save,
  RefreshCw,
  User,
  MessageSquare,
  Brain,
  Palette,
  Volume2,
  VolumeX,
  Eye,
  EyeOff,
  Clock,
  Globe
} from 'lucide-react';

/**
 * Sistema de Personalização do Assistente Virtual
 * Permite configurar comportamento, aparência e preferências
 */
const AssistantPersonalization = ({ className = '' }) => {
  const [settings, setSettings] = useState({
    // Configurações de Personalidade
    personality: {
      tone: 'profissional', // casual, profissional, amigavel
      formality: 'formal', // formal, informal
      verbosity: 'medio', // conciso, medio, detalhado
      humor: false,
      empathy: true
    },
    
    // Configurações de Aparência
    appearance: {
      theme: 'auto', // light, dark, auto
      avatarStyle: 'robotic', // human, robotic, abstract
      position: 'bottom-right', // bottom-left, bottom-right, top-right
      size: 'medium', // small, medium, large
      animations: true
    },
    
    // Configurações de Comportamento
    behavior: {
      autoGreeting: true,
      proactiveHelp: true,
      contextMemory: true,
      learningMode: true,
      confidenceThreshold: 0.7,
      maxResponseTime: 5000
    },
    
    // Configurações de Interface
    interface: {
      language: 'pt-BR',
      soundEnabled: true,
      notificationsEnabled: true,
      quickActionsVisible: true,
      historyVisible: true,
      feedbackPrompts: true
    },
    
    // Configurações Avançadas
    advanced: {
      apiTimeout: 30000,
      retryAttempts: 3,
      debugMode: false,
      analyticsEnabled: true,
      dataRetention: 30 // dias
    }
  });
  
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('personality');

  // Carregar configurações do usuário
  useEffect(() => {
    loadUserSettings();
  }, []);

  const loadUserSettings = async () => {
    try {
      const response = await fetch('/api/ai/user/settings', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (response.ok) {
        const userSettings = await response.json();
        setSettings(prev => ({ ...prev, ...userSettings }));
      }
    } catch (error) {
      // console.error('Erro ao carregar configurações:', error);
    }
  };

  const saveSettings = async () => {
    try {
      setSaving(true);
      const response = await fetch('/api/ai/user/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(settings)
      });

      if (response.ok) {
        // Sucesso - pode mostrar toast
      }
    } catch (error) {
      // console.error('Erro ao salvar configurações:', error);
    } finally {
      setSaving(false);
    }
  };

  const resetToDefaults = () => {
    setSettings({
      personality: {
        tone: 'profissional',
        formality: 'formal',
        verbosity: 'medio',
        humor: false,
        empathy: true
      },
      appearance: {
        theme: 'auto',
        avatarStyle: 'robotic',
        position: 'bottom-right',
        size: 'medium',
        animations: true
      },
      behavior: {
        autoGreeting: true,
        proactiveHelp: true,
        contextMemory: true,
        learningMode: true,
        confidenceThreshold: 0.7,
        maxResponseTime: 5000
      },
      interface: {
        language: 'pt-BR',
        soundEnabled: true,
        notificationsEnabled: true,
        quickActionsVisible: true,
        historyVisible: true,
        feedbackPrompts: true
      },
      advanced: {
        apiTimeout: 30000,
        retryAttempts: 3,
        debugMode: false,
        analyticsEnabled: true,
        dataRetention: 30
      }
    });
  };

  const updateSetting = (category, key, value) => {
    setSettings(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        [key]: value
      }
    }));
  };

  const tabs = [
    { id: 'personality', label: 'Personalidade', icon: User },
    { id: 'appearance', label: 'Aparência', icon: Palette },
    { id: 'behavior', label: 'Comportamento', icon: Brain },
    { id: 'interface', label: 'Interface', icon: MessageSquare },
    { id: 'advanced', label: 'Avançado', icon: Settings }
  ];

  const renderPersonalitySettings = () => (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Tom de Voz
        </label>
        <select
          value={settings.personality.tone}
          onChange={(e) => updateSetting('personality', 'tone', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md"
        >
          <option value="casual">Casual</option>
          <option value="profissional">Profissional</option>
          <option value="amigavel">Amigável</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Nível de Formalidade
        </label>
        <select
          value={settings.personality.formality}
          onChange={(e) => updateSetting('personality', 'formality', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md"
        >
          <option value="formal">Formal</option>
          <option value="informal">Informal</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Verbosidade das Respostas
        </label>
        <select
          value={settings.personality.verbosity}
          onChange={(e) => updateSetting('personality', 'verbosity', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md"
        >
          <option value="conciso">Conciso</option>
          <option value="medio">Médio</option>
          <option value="detalhado">Detalhado</option>
        </select>
      </div>

      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-gray-700">Usar Humor</label>
        <button
          onClick={() => updateSetting('personality', 'humor', !settings.personality.humor)}
          className={`relative inline-flex h-6 w-11 items-center rounded-full ${
            settings.personality.humor ? 'bg-blue-600' : 'bg-gray-200'
          }`}
        >
          <span
            className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${
              settings.personality.humor ? 'translate-x-6' : 'translate-x-1'
            }`}
          />
        </button>
      </div>

      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-gray-700">Demonstrar Empatia</label>
        <button
          onClick={() => updateSetting('personality', 'empathy', !settings.personality.empathy)}
          className={`relative inline-flex h-6 w-11 items-center rounded-full ${
            settings.personality.empathy ? 'bg-blue-600' : 'bg-gray-200'
          }`}
        >
          <span
            className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${
              settings.personality.empathy ? 'translate-x-6' : 'translate-x-1'
            }`}
          />
        </button>
      </div>
    </div>
  );

  const renderAppearanceSettings = () => (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Tema
        </label>
        <select
          value={settings.appearance.theme}
          onChange={(e) => updateSetting('appearance', 'theme', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md"
        >
          <option value="light">Claro</option>
          <option value="dark">Escuro</option>
          <option value="auto">Automático</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Estilo do Avatar
        </label>
        <select
          value={settings.appearance.avatarStyle}
          onChange={(e) => updateSetting('appearance', 'avatarStyle', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md"
        >
          <option value="human">Humano</option>
          <option value="robotic">Robótico</option>
          <option value="abstract">Abstrato</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Posição na Tela
        </label>
        <select
          value={settings.appearance.position}
          onChange={(e) => updateSetting('appearance', 'position', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md"
        >
          <option value="bottom-left">Inferior Esquerda</option>
          <option value="bottom-right">Inferior Direita</option>
          <option value="top-right">Superior Direita</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Tamanho
        </label>
        <select
          value={settings.appearance.size}
          onChange={(e) => updateSetting('appearance', 'size', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md"
        >
          <option value="small">Pequeno</option>
          <option value="medium">Médio</option>
          <option value="large">Grande</option>
        </select>
      </div>

      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-gray-700">Animações</label>
        <button
          onClick={() => updateSetting('appearance', 'animations', !settings.appearance.animations)}
          className={`relative inline-flex h-6 w-11 items-center rounded-full ${
            settings.appearance.animations ? 'bg-blue-600' : 'bg-gray-200'
          }`}
        >
          <span
            className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${
              settings.appearance.animations ? 'translate-x-6' : 'translate-x-1'
            }`}
          />
        </button>
      </div>
    </div>
  );

  const renderBehaviorSettings = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-gray-700">Saudação Automática</label>
        <button
          onClick={() => updateSetting('behavior', 'autoGreeting', !settings.behavior.autoGreeting)}
          className={`relative inline-flex h-6 w-11 items-center rounded-full ${
            settings.behavior.autoGreeting ? 'bg-blue-600' : 'bg-gray-200'
          }`}
        >
          <span
            className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${
              settings.behavior.autoGreeting ? 'translate-x-6' : 'translate-x-1'
            }`}
          />
        </button>
      </div>

      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-gray-700">Ajuda Proativa</label>
        <button
          onClick={() => updateSetting('behavior', 'proactiveHelp', !settings.behavior.proactiveHelp)}
          className={`relative inline-flex h-6 w-11 items-center rounded-full ${
            settings.behavior.proactiveHelp ? 'bg-blue-600' : 'bg-gray-200'
          }`}
        >
          <span
            className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${
              settings.behavior.proactiveHelp ? 'translate-x-6' : 'translate-x-1'
            }`}
          />
        </button>
      </div>

      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-gray-700">Memória de Contexto</label>
        <button
          onClick={() => updateSetting('behavior', 'contextMemory', !settings.behavior.contextMemory)}
          className={`relative inline-flex h-6 w-11 items-center rounded-full ${
            settings.behavior.contextMemory ? 'bg-blue-600' : 'bg-gray-200'
          }`}
        >
          <span
            className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${
              settings.behavior.contextMemory ? 'translate-x-6' : 'translate-x-1'
            }`}
          />
        </button>
      </div>

      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-gray-700">Modo Aprendizado</label>
        <button
          onClick={() => updateSetting('behavior', 'learningMode', !settings.behavior.learningMode)}
          className={`relative inline-flex h-6 w-11 items-center rounded-full ${
            settings.behavior.learningMode ? 'bg-blue-600' : 'bg-gray-200'
          }`}
        >
          <span
            className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${
              settings.behavior.learningMode ? 'translate-x-6' : 'translate-x-1'
            }`}
          />
        </button>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Limiar de Confiança: {settings.behavior.confidenceThreshold}
        </label>
        <input
          type="range"
          min="0.1"
          max="1"
          step="0.1"
          value={settings.behavior.confidenceThreshold}
          onChange={(e) => updateSetting('behavior', 'confidenceThreshold', parseFloat(e.target.value))}
          className="w-full"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Tempo Máximo de Resposta (ms)
        </label>
        <input
          type="number"
          value={settings.behavior.maxResponseTime}
          onChange={(e) => updateSetting('behavior', 'maxResponseTime', parseInt(e.target.value))}
          className="w-full px-3 py-2 border border-gray-300 rounded-md"
          min="1000"
          max="30000"
          step="1000"
        />
      </div>
    </div>
  );

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Personalização do Assistente</h2>
          <p className="text-gray-600">Configure o comportamento e aparência do seu assistente</p>
        </div>
        
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={resetToDefaults}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Restaurar Padrões
          </Button>
          <Button size="sm" onClick={saveSettings} disabled={saving}>
            <Save className="h-4 w-4 mr-2" />
            {saving ? 'Salvando...' : 'Salvar'}
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex space-x-1 border-b border-gray-200">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center px-4 py-2 text-sm font-medium rounded-t-lg ${
                activeTab === tab.id
                  ? 'bg-blue-50 text-blue-700 border-b-2 border-blue-700'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <Icon className="h-4 w-4 mr-2" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Content */}
      <Card>
        <CardHeader>
          <CardTitle>
            {tabs.find(tab => tab.id === activeTab)?.label}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {activeTab === 'personality' && renderPersonalitySettings()}
          {activeTab === 'appearance' && renderAppearanceSettings()}
          {activeTab === 'behavior' && renderBehaviorSettings()}
          {activeTab === 'interface' && (
            <div className="text-center py-8 text-gray-500">
              Configurações de interface em desenvolvimento...
            </div>
          )}
          {activeTab === 'advanced' && (
            <div className="text-center py-8 text-gray-500">
              Configurações avançadas em desenvolvimento...
            </div>
          )}
        </CardContent>
      </Card>

      {/* Preview */}
      <Card>
        <CardHeader>
          <CardTitle>Preview do Assistente</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="bg-gray-50 rounded-lg p-4 border-2 border-dashed border-gray-300">
            <div className="text-center text-gray-500">
              <MessageSquare className="h-12 w-12 mx-auto mb-2" />
              <p>Preview do assistente com as configurações atuais</p>
              <p className="text-sm mt-2">
                Tom: {settings.personality.tone} | Tema: {settings.appearance.theme} | 
                Posição: {settings.appearance.position}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AssistantPersonalization;
