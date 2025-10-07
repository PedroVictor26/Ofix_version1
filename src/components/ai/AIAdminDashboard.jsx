import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import {
  Settings,
  BarChart3,
  Heart,
  Brain,
  BookOpen,
  X,
  Maximize2,
  Minimize2
} from 'lucide-react';

// Importar dashboards
import ConversationDashboard from './ConversationDashboard';
import FeedbackDashboard from './FeedbackDashboard';
import AssistantPersonalization from './AssistantPersonalization';
import KnowledgeManagement from './KnowledgeManagement';

/**
 * Dashboard Administrativo do Assistente Virtual
 * Interface completa para gestão e configuração do sistema
 */
const AIAdminDashboard = ({ 
  isOpen = false, 
  onClose = () => {},
  className = '' 
}) => {
  const [activeTab, setActiveTab] = useState('analytics');
  const [isMinimized, setIsMinimized] = useState(false);

  // Dados de demonstração
  const systemStats = {
    uptime: '24h 15m',
    totalUsers: 156,
    activeConversations: 8,
    systemHealth: 98
  };

  const tabs = [
    {
      id: 'analytics',
      label: 'Analytics',
      icon: BarChart3,
      component: ConversationDashboard
    },
    {
      id: 'feedback',
      label: 'Feedback',
      icon: Heart,
      component: FeedbackDashboard
    },
    {
      id: 'knowledge',
      label: 'Base de Conhecimento',
      icon: BookOpen,
      component: KnowledgeManagement
    },
    {
      id: 'settings',
      label: 'Configurações',
      icon: Settings,
      component: AssistantPersonalization
    }
  ];

  // Fechar com ESC
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const renderSystemStatus = () => (
    <div className="grid grid-cols-4 gap-4 mb-6">
      <Card>
        <CardContent className="p-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">{systemStats.uptime}</div>
            <div className="text-sm text-gray-600">Uptime</div>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardContent className="p-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">{systemStats.totalUsers}</div>
            <div className="text-sm text-gray-600">Usuários Ativos</div>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardContent className="p-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">{systemStats.activeConversations}</div>
            <div className="text-sm text-gray-600">Conversas Ativas</div>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardContent className="p-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-orange-600">{systemStats.systemHealth}%</div>
            <div className="text-sm text-gray-600">Saúde do Sistema</div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  return (
    <div className={`fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center ${className}`}>
      <div className={`bg-white rounded-lg shadow-2xl transition-all duration-300 ${
        isMinimized ? 'w-96 h-20' : 'w-[95vw] h-[95vh] max-w-7xl'
      }`}>
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Brain className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">
                Dashboard do Assistente Virtual
              </h2>
              <p className="text-sm text-gray-600">
                Gestão e monitoramento completo do sistema
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsMinimized(!isMinimized)}
            >
              {isMinimized ? <Maximize2 className="h-4 w-4" /> : <Minimize2 className="h-4 w-4" />}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Content */}
        {!isMinimized && (
          <div className="p-6 overflow-auto" style={{ height: 'calc(95vh - 80px)' }}>
            {/* System Status */}
            {renderSystemStatus()}

            {/* Main Content Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full">
              <TabsList className="grid w-full grid-cols-4 mb-6">
                {tabs.map((tab) => {
                  const Icon = tab.icon;
                  return (
                    <TabsTrigger
                      key={tab.id}
                      value={tab.id}
                      className="flex items-center space-x-2"
                    >
                      <Icon className="h-4 w-4" />
                      <span>{tab.label}</span>
                    </TabsTrigger>
                  );
                })}
              </TabsList>

              {tabs.map((tab) => {
                const Component = tab.component;
                return (
                  <TabsContent
                    key={tab.id}
                    value={tab.id}
                    className="h-full overflow-auto"
                  >
                    <Component />
                  </TabsContent>
                );
              })}
            </Tabs>
          </div>
        )}
      </div>
    </div>
  );
};

export default AIAdminDashboard;
