import { useState, useCallback, useEffect, useRef } from 'react';
import { aiService } from '../services/ai.service';
import { useAuth } from '../context/AuthContext.jsx';

export function useAIAssistant(options = {}) {
    const {
        userType = 'cliente',
        autoConnect = true,
        enableDiagnostic = true,
        enableSuggestions = true,
        conversationId: initialConversationId = null,
        systemContext = {}
    } = options;

    // Hook de autenticação
    const { isAuthenticated, token } = useAuth();

    // Estados principais
    const [isOpen, setIsOpen] = useState(false);
    const [isConnected, setIsConnected] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [isTyping, setIsTyping] = useState(false);
    const [error, setError] = useState(null);
    const [conversationId, setConversationId] = useState(initialConversationId);
    const [messages, setMessages] = useState([
        {
            id: 1,
            message: getWelcomeMessage(userType),
            isUser: false,
            timestamp: new Date(),
            type: 'greeting'
        }
    ]);
    const [suggestions, setSuggestions] = useState([]);
    const [context, setContext] = useState({
        userType,
        sessionStarted: new Date().toISOString(),
        ...systemContext
    });
    const [conversationStats, setConversationStats] = useState({
        totalMessages: 1,
        userMessages: 0,
        aiMessages: 1,
        averageResponseTime: 0
    });

    const responseTimeRef = useRef(null);
    const abortControllerRef = useRef(null);

    // Carregar sugestões baseadas no contexto
    useEffect(() => {
        const loadSuggestions = async () => {
            try {
                // Verificar se usuário está autenticado
                const token = localStorage.getItem('token');
                if (!token) {
                    return; // Não carregar sugestões se não estiver autenticado
                }

                if (enableSuggestions) {
                    const contextSuggestions = await aiService.getSuggestions(context);
                    setSuggestions(contextSuggestions);
                }
            } catch (error) {
                console.error('Erro ao carregar sugestões:', error);
                // Se erro 401, não mostrar erro para o usuário (normal quando não logado)
                if (!error.message.includes('Sessão expirada')) {
                    setError(error.message);
                }
            }
        };

        if (isOpen) {
            loadSuggestions();
        }
    }, [isOpen, context, enableSuggestions]);

    /**
     * Inicializa o assistente virtual
     */
    const initializeAssistant = useCallback(async () => {
        try {
            setIsLoading(true);
            setError(null);

            // Primeiro verificar se a API está funcionando (sem autenticação)
            const healthResponse = await fetch('/api/agno/health', {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });
            
            if (!healthResponse.ok) {
                throw new Error('Servidor AI não está disponível');
            }

            // Verificar se usuário está autenticado para funcionalidades protegidas
            if (!isAuthenticated || !token) {
                console.log('Usuário não autenticado, funcionalidades limitadas');
                setIsConnected(false);
                setIsLoading(false);
                return; // Não inicializar funcionalidades protegidas se não estiver autenticado
            }

            // Verificar conectividade com a API autenticada
            const authResponse = await fetch('/api/ai/suggestions', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (authResponse.ok) {
                setIsConnected(true);
            } else {
                throw new Error('Falha na conexão com o assistente');
            }
        } catch (err) {
            setError(err.message);
            setIsConnected(false);
        } finally {
            setIsLoading(false);
        }
    }, [isAuthenticated, token]);

    // Inicialização após a declaração da função
    useEffect(() => {
        if (autoConnect) {
            initializeAssistant();
        }

        return () => {
            if (abortControllerRef.current) {
                abortControllerRef.current.abort();
            }
        };
    }, [autoConnect, initializeAssistant]);

    /**
     * Carrega o histórico de uma conversa
     */
    const loadConversationHistory = useCallback(async () => {
        try {
            const response = await fetch(`/api/ai/conversations/${conversationId}`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });

            if (response.ok) {
                const conversation = await response.json();
                const formattedMessages = conversation.messages?.map(msg => ({
                    id: msg.id,
                    message: msg.content,
                    isUser: msg.type === 'user',
                    timestamp: new Date(msg.createdAt),
                    type: msg.type,
                    confidence: msg.confidence,
                    metadata: msg.metadata
                })) || [];
                
                setMessages(formattedMessages);
                setContext(prev => ({
                    ...prev,
                    ...conversation.context
                }));
            }
        } catch (error) {
            console.error('Erro ao carregar histórico:', error);
        }
    }, [conversationId]);

    // Carregar histórico quando conversationId mudar
    useEffect(() => {
        if (conversationId) {
            loadConversationHistory();
        }
    }, [conversationId, loadConversationHistory]);

    /**
     * Carrega sugestões contextuais
     */
    const loadSuggestions = async () => {
        try {
            const response = await fetch(`/api/ai/suggestions?context=${encodeURIComponent(JSON.stringify(context))}`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });

            if (response.ok) {
                const data = await response.json();
                setSuggestions(data);
            }
        } catch (error) {
            console.error('Erro ao carregar sugestões:', error);
        }
    };

    // Enviar mensagem (versão atualizada)
    const sendMessage = useCallback(async (messageText, additionalContext = {}) => {
        if (!messageText.trim() || isLoading) return;

        // Cancelar requisição anterior se existir
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
        }
        abortControllerRef.current = new AbortController();

        const userMessage = {
            id: Date.now(),
            message: messageText,
            isUser: true,
            timestamp: new Date(),
            type: 'user'
        };

        setMessages(prev => [...prev, userMessage]);
        setIsLoading(true);
        setIsTyping(true);
        responseTimeRef.current = Date.now();
        setError(null);

        try {
            // Preparar contexto enriquecido
            const enrichedContext = {
                ...context,
                ...additionalContext,
                conversationLength: messages.length,
                lastUserMessage: messageText,
                currentTime: new Date().toISOString()
            };

            // Enviar para a nova API
            const response = await fetch('/api/ai/chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({
                    message: messageText,
                    conversationId,
                    userType,
                    context: enrichedContext
                }),
                signal: abortControllerRef.current.signal
            });

            if (!response.ok) {
                throw new Error('Falha na comunicação com o assistente');
            }

            const result = await response.json();
            
            const aiMessage = {
                id: Date.now() + 1,
                message: result.response,
                isUser: false,
                timestamp: new Date(),
                type: 'assistant',
                confidence: result.confidence,
                suggestions: result.suggestions,
                metadata: result.metadata
            };

            setMessages(prev => [...prev, aiMessage]);

            // Atualizar conversationId se for uma nova conversa
            if (result.conversationId && !conversationId) {
                setConversationId(result.conversationId);
            }

            // Atualizar contexto
            if (result.context) {
                setContext(prev => ({ ...prev, ...result.context }));
            }

            // Atualizar sugestões se fornecidas
            if (result.suggestions && result.suggestions.length > 0) {
                setSuggestions(result.suggestions);
            }

            // Atualizar estatísticas
            const responseTime = Date.now() - responseTimeRef.current;
            setConversationStats(prev => ({
                totalMessages: prev.totalMessages + 2,
                userMessages: prev.userMessages + 1,
                aiMessages: prev.aiMessages + 1,
                averageResponseTime: Math.round((prev.averageResponseTime + responseTime) / 2)
            }));

            return result;

        } catch (error) {
            if (error.name !== 'AbortError') {
                setError(error.message);
                const errorMessage = {
                    id: Date.now() + 1,
                    message: "Desculpe, ocorreu um erro. Tente novamente em alguns instantes.",
                    isUser: false,
                    timestamp: new Date(),
                    type: 'error'
                };
                setMessages(prev => [...prev, errorMessage]);
            }
        } finally {
            setIsLoading(false);
            setIsTyping(false);
        }
    }, [isLoading, messages.length, context, conversationId, userType]);

    /**
     * Executa um diagnóstico baseado em sintomas
     */
    const performDiagnosis = useCallback(async (diagnosticData) => {
        if (!enableDiagnostic) {
            throw new Error('Diagnóstico não habilitado');
        }

        try {
            setIsLoading(true);
            setError(null);

            const response = await fetch('/api/ai/diagnosis', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({
                    ...diagnosticData,
                    conversationId,
                    context
                })
            });

            if (!response.ok) {
                throw new Error('Falha no diagnóstico');
            }

            const result = await response.json();

            // Adicionar resultado do diagnóstico às mensagens
            const diagnosticMessage = {
                id: Date.now(),
                message: formatDiagnosticResult(result),
                isUser: false,
                timestamp: new Date(),
                type: 'diagnostic',
                metadata: { type: 'diagnostic', ...result }
            };

            setMessages(prev => [...prev, diagnosticMessage]);
            return result;

        } catch (error) {
            setError(error.message);
            throw error;
        } finally {
            setIsLoading(false);
        }
    }, [conversationId, context, enableDiagnostic]);

    /**
     * Executa uma ação rápida
     */
    const executeQuickAction = useCallback(async (action, data = {}) => {
        try {
            setIsLoading(true);

            const response = await fetch('/api/ai/quick-action', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({
                    action,
                    context,
                    data
                })
            });

            if (!response.ok) {
                throw new Error('Falha na execução da ação');
            }

            const result = await response.json();

            // Adicionar resultado como mensagem se fornecido
            if (result.message) {
                const actionMessage = {
                    id: Date.now(),
                    message: result.message,
                    isUser: false,
                    timestamp: new Date(),
                    type: 'action_result'
                };
                setMessages(prev => [...prev, actionMessage]);
            }

            // Atualizar contexto se fornecido
            if (result.context) {
                setContext(prev => ({ ...prev, ...result.context }));
            }

            return result;

        } catch (error) {
            setError(error.message);
            throw error;
        } finally {
            setIsLoading(false);
        }
    }, [context]);

    /**
     * Envia feedback sobre uma mensagem
     */
    const provideFeedback = useCallback(async (messageId, feedbackData) => {
        try {
            const response = await fetch('/api/ai/feedback', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({
                    conversationId,
                    messageId,
                    ...feedbackData
                })
            });

            if (response.ok) {
                // Atualizar a mensagem com o feedback
                setMessages(prev => prev.map(msg => 
                    msg.id === messageId 
                        ? { ...msg, feedback: feedbackData }
                        : msg
                ));
            }
        } catch (error) {
            console.error('Erro ao enviar feedback:', error);
        }
    }, [conversationId]);

    // Limpar conversa (versão atualizada)
    const clearConversation = useCallback(() => {
        setMessages([
            {
                id: Date.now(),
                message: getWelcomeMessage(userType),
                isUser: false,
                timestamp: new Date(),
                type: 'system'
            }
        ]);
        
        setConversationId(null);
        setContext({
            userType,
            sessionStarted: new Date().toISOString(),
            ...systemContext
        });
        
        setConversationStats({
            totalMessages: 1,
            userMessages: 0,
            aiMessages: 1,
            averageResponseTime: 0
        });

        aiService.clearHistory();
    }, [userType, systemContext]);

    /**
     * Finaliza a conversa atual
     */
    const endConversation = useCallback(async () => {
        if (conversationId) {
            try {
                await fetch(`/api/ai/conversations/${conversationId}/end`, {
                    method: 'PUT',
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('token')}`
                    }
                });
            } catch (error) {
                console.error('Erro ao finalizar conversa:', error);
            }
        }
        clearConversation();
    }, [conversationId, clearConversation]);

    /**
     * Atualiza o contexto
     */
    const updateContext = useCallback((newContext) => {
        setContext(prev => ({ ...prev, ...newContext }));
    }, []);

    // Reagir a sugestão
    const handleSuggestion = useCallback((suggestionText) => {
        sendMessage(suggestionText);
    }, [sendMessage]);

    // Copiar mensagem
    const copyMessage = useCallback(async (messageText) => {
        try {
            await navigator.clipboard.writeText(messageText);
            console.log('Mensagem copiada para a área de transferência');
        } catch (error) {
            console.error('Erro ao copiar mensagem:', error);
        }
    }, []);

    // Exportar conversa
    const exportConversation = useCallback(() => {
        const conversationText = messages
            .map(msg => `${msg.isUser ? 'Usuário' : 'Assistente'} (${msg.timestamp.toLocaleString()}): ${msg.message}`)
            .join('\n\n');
        
        const blob = new Blob([conversationText], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `conversa-assistente-${new Date().toISOString().split('T')[0]}.txt`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }, [messages]);

    // Analisar conversa
    const analyzeConversation = useCallback(() => {
        const userMessages = messages.filter(msg => msg.isUser);
        const aiMessages = messages.filter(msg => !msg.isUser && msg.type !== 'system');
        
        const topics = [];
        const sentiments = [];
        
        userMessages.forEach(msg => {
            const sentiment = aiService.analyzeSentiment(msg.message);
            const entities = aiService.extractEntities(msg.message);
            
            sentiments.push(sentiment);
            
            // Extrair tópicos baseados nas entidades
            if (entities.vehicles.length > 0) topics.push('veículos');
            if (entities.parts.length > 0) topics.push('peças');
            if (entities.services.length > 0) topics.push('serviços');
        });

        return {
            messageCount: {
                total: messages.length,
                user: userMessages.length,
                ai: aiMessages.length
            },
            topics: [...new Set(topics)],
            sentiment: {
                positive: sentiments.filter(s => s === 'positive').length,
                negative: sentiments.filter(s => s === 'negative').length,
                neutral: sentiments.filter(s => s === 'neutral').length
            },
            averageResponseTime: conversationStats.averageResponseTime
        };
    }, [messages, conversationStats]);

    // Funções auxiliares
    const formatDiagnosticResult = (result) => {
        let message = `**Diagnóstico Concluído**\n\n`;
        
        if (result.diagnosis) {
            message += `**Análise:** ${typeof result.diagnosis === 'object' ? result.diagnosis.description || result.diagnosis.primaryCause : result.diagnosis}\n\n`;
        }

        if (result.suggestedActions && result.suggestedActions.length > 0) {
            message += `**Ações Recomendadas:**\n`;
            result.suggestedActions.forEach(action => {
                message += `• ${action}\n`;
            });
            message += '\n';
        }

        if (result.estimatedCost) {
            message += `**Custo Estimado:** R$ ${result.estimatedCost.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}\n\n`;
        }

        if (result.urgencyLevel) {
            message += `**Urgência:** ${result.urgencyLevel}\n`;
        }

        return message;
    };

    return {
        // Estados principais
        isOpen,
        setIsOpen,
        isConnected,
        isLoading,
        isTyping,
        error,
        messages,
        conversationId,
        suggestions,
        context,
        conversationStats,
        
        // Ações principais
        sendMessage,
        performDiagnosis,
        executeQuickAction,
        loadSuggestions,
        updateContext,
        clearConversation,
        endConversation,
        initializeAssistant,
        
        // Ações de interface
        handleSuggestion,
        provideFeedback,
        copyMessage,
        exportConversation,
        
        // Análise
        analyzeConversation,
        
        // Utilitários
        hasMessages: messages.length > 1,
        lastMessage: messages[messages.length - 1],
        canSend: !isLoading && isConnected
    };
}

// Função auxiliar para mensagem de boas-vindas
function getWelcomeMessage(userType) {
    switch (userType) {
        case 'cliente':
            return 'Olá! Sou seu assistente virtual. Como posso ajudá-lo hoje? Posso verificar o status do seu serviço, agendar manutenções ou ajudar com problemas do seu veículo.';
        case 'mecanico':
            return 'Olá! Estou aqui para auxiliar com diagnósticos, consultas técnicas e procedimentos. Como posso ajudar?';
        default:
            return 'Olá! Sou seu assistente virtual especializado em oficinas. Como posso ajudar você hoje?';
    }
}