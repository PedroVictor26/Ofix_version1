import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { 
  Bot, 
  MessageSquare, 
  Wrench, 
  Zap, 
  Settings,
  Minimize2,
  Maximize2,
  X,
  Activity,
  BarChart3,
  Heart,
  Brain,
  BookOpen
} from 'lucide-react';

// Importar componentes criados
import ChatInterface from './ChatInterface';
import DiagnosticPanel from './DiagnosticPanel';
import QuickSuggestions from './QuickSuggestions';
import AIAdminDashboard from './AIAdminDashboard';
import { useAIAssistant } from '../../hooks/useAIAssistant';
import { useToast } from '../../hooks/use-toast';

const VirtualAssistant = ({ 
  userType = 'cliente', 
  initialContext = {},
  vehicleData = null,
  className = ""
}) => {
  const [isMinimized, setIsMinimized] = useState(false);
  const [activeTab, setActiveTab] = useState('chat');
  const [assistantVisible, setAssistantVisible] = useState(false);
  const [showAdminDashboard, setShowAdminDashboard] = useState(false);
  const { toast } = useToast();

  // Hook do assistente virtual
  const {
    isConnected,
    isLoading,
    messages,
    conversationId,
    suggestions,
    context,
    sendMessage,
    performDiagnosis,
    executeQuickAction,
    clearConversation,
    endConversation,
    updateContext,
    isOpen,
    setIsOpen
  } = useAIAssistant({
    userType,
    autoConnect: true,
    enableDiagnostic: userType === 'mecanico' || userType === 'cliente',
    enableSuggestions: true,
    systemContext: initialContext
  });

  // Atualizar contexto quando dados do veículo mudarem
  useEffect(() => {
    if (vehicleData) {
      updateContext({
        currentVehicle: vehicleData,
        lastUpdate: new Date().toISOString()
      });
    }
  }, [vehicleData, updateContext]);

  // Mostrar toast quando conexão for estabelecida
  useEffect(() => {
    if (isConnected && !assistantVisible) {
      setAssistantVisible(true);
      toast({
        title: "Assistente Virtual Conectado",
        description: "Olá! Estou aqui para ajudar você.",
        variant: "default"
      });
    }
  }, [isConnected, assistantVisible, toast]);

  const handleSuggestionClick = async (suggestion) => {
    if (suggestion.action) {
      try {
        await executeQuickAction(suggestion.action, suggestion.data);
      } catch (error) {
        // console.error('Erro ao executar sugestão:', error);
        toast({
          title: "Erro",
          description: "Não foi possível executar a ação sugerida.",
          variant: "destructive"
        });
      }
    } else if (suggestion.title) {
      await sendMessage(suggestion.title);
    }
  };

  const handleDiagnosisComplete = (diagnosisResult) => {
    toast({
      title: "Diagnóstico Concluído",
      description: `Análise realizada com ${Math.round(diagnosisResult.confidence * 100)}% de confiança.`,
      variant: "default"
    });
    
    // Mudar para aba do chat para mostrar resultado
    setActiveTab('chat');
  };

  const handleClearConversation = () => {
    clearConversation();
    toast({
      title: "Conversa Limpa",
      description: "Uma nova conversa foi iniciada.",
      variant: "default"
    });
  };

  const handleEndConversation = () => {
    endConversation();
    setIsOpen(false);
    toast({
      title: "Conversa Finalizada",
      description: "Obrigado por usar nosso assistente virtual!",
      variant: "default"
    });
  };

  const getTabIcon = (tab) => {
    switch (tab) {
      case 'chat': return <MessageSquare className="h-4 w-4" />;
      case 'diagnostic': return <Wrench className="h-4 w-4" />;
      case 'suggestions': return <Zap className="h-4 w-4" />;
      default: return <Bot className="h-4 w-4" />;
    }
  };

  const getStatusColor = () => {
    if (!isConnected) return 'bg-red-500';
    if (isLoading) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  // Floating button para abrir o assistente
  if (!isOpen) {
    return (
      <div className={`fixed bottom-6 right-6 z-50 ${className}`}>
        <Button
          onClick={() => setIsOpen(true)}
          className="h-14 w-14 rounded-full bg-blue-600 hover:bg-blue-700 shadow-lg hover:shadow-xl transition-all duration-300"
          size="icon"
        >
          <Bot className="h-6 w-6 text-white" />
        </Button>
        
        {/* Indicador de status */}
        <div className={`absolute -top-1 -right-1 h-4 w-4 rounded-full ${getStatusColor()} border-2 border-white`} 
             title={isConnected ? 'Online' : 'Conectando...'} />
        
        {/* Badge de mensagens não lidas (se aplicável) */}
        {messages.length > 1 && (
          <Badge 
            variant="destructive" 
            className="absolute -top-2 -left-2 h-6 w-6 rounded-full flex items-center justify-center p-0 text-xs"
          >
            {messages.length - 1}
          </Badge>
        )}
      </div>
    );
  }

  return (
    <div className={`fixed bottom-6 right-6 z-50 ${className}`}>
      <Card className={`transition-all duration-300 ${
        isMinimized ? 'w-80 h-16' : 'w-96 h-[600px]'
      } shadow-2xl border-0 bg-white/95 backdrop-blur-sm`}>
        
        {/* Header */}
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className={`p-2 rounded-full ${getStatusColor()}`}>
                <Bot className="h-4 w-4 text-white" />
              </div>
              <div>
                <CardTitle className="text-sm font-medium">
                  Assistente Virtual
                </CardTitle>
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <Activity className="h-3 w-3" />
                  {isConnected ? 'Online' : 'Conectando...'}
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-1">
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
                onClick={() => setIsOpen(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>

        {/* Content */}
        {!isMinimized && (
          <CardContent className="h-[500px] p-4 flex flex-col">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
              <TabsList className="grid w-full grid-cols-3 mb-4">
                <TabsTrigger value="chat" className="flex items-center gap-1 text-xs">
                  {getTabIcon('chat')}
                  Chat
                </TabsTrigger>
                <TabsTrigger 
                  value="diagnostic" 
                  className="flex items-center gap-1 text-xs"
                  disabled={userType === 'admin'}
                >
                  {getTabIcon('diagnostic')}
                  Diagnóstico
                </TabsTrigger>
                <TabsTrigger value="suggestions" className="flex items-center gap-1 text-xs">
                  {getTabIcon('suggestions')}
                  Sugestões
                </TabsTrigger>
              </TabsList>

              <div className="flex-1 overflow-hidden">
                <TabsContent value="chat" className="h-full mt-0">
                  <ChatInterface
                    messages={messages}
                    onSendMessage={sendMessage}
                    isLoading={isLoading}
                    isConnected={isConnected}
                    userType={userType}
                    suggestions={suggestions}
                    onSuggestionClick={handleSuggestionClick}
                    conversationId={conversationId}
                    className="h-full"
                  />
                </TabsContent>

                <TabsContent value="diagnostic" className="h-full mt-0 overflow-auto">
                  <DiagnosticPanel
                    onDiagnosisComplete={handleDiagnosisComplete}
                    vehicleData={vehicleData}
                    isVisible={activeTab === 'diagnostic'}
                  />
                </TabsContent>

                <TabsContent value="suggestions" className="h-full mt-0 overflow-auto">
                  <QuickSuggestions
                    userType={userType}
                    context={context}
                    onSuggestionClick={handleSuggestionClick}
                    className="h-full"
                  />
                </TabsContent>
              </div>
            </Tabs>

            {/* Footer Actions */}
            <div className="flex justify-between items-center pt-3 border-t">
              <div className="flex gap-1">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleClearConversation}
                  disabled={messages.length <= 1}
                >
                  Limpar
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleEndConversation}
                >
                  Finalizar
                </Button>
                {userType === 'admin' && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowAdminDashboard(true)}
                  >
                    <BarChart3 className="h-4 w-4 mr-1" />
                    Dashboard
                  </Button>
                )}
              </div>
              
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <Badge variant={userType === 'cliente' ? 'default' : userType === 'mecanico' ? 'secondary' : 'outline'}>
                  {userType.charAt(0).toUpperCase() + userType.slice(1)}
                </Badge>
                {context.currentVehicle && (
                  <Badge variant="outline" title={`${context.currentVehicle.brand} ${context.currentVehicle.model}`}>
                    {context.currentVehicle.brand}
                  </Badge>
                )}
              </div>
            </div>
          </CardContent>
        )}
      </Card>

      {/* Admin Dashboard */}
      <AIAdminDashboard 
        isOpen={showAdminDashboard} 
        onClose={() => setShowAdminDashboard(false)} 
      />
    </div>
  );
};

export default VirtualAssistant;
