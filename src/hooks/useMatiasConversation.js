/**
 * 💬 Advanced Conversation Management Hook
 *
 * Handles multi-turn conversations with context preservation,
 * memory management, and intelligent flow control
 */

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { v4 as uuidv4 } from 'uuid';

export const useMatiasConversation = (config = {}) => {
    // Core configuration
    const {
        maxHistorySize = 100,
        contextWindow = 10,
        persistenceEnabled = true,
        autoSave = true,
        encryptionEnabled = false,
        multiLanguageSupport = true,
        defaultLanguage = 'pt-BR',
        contextRetention = 7 * 24 * 60 * 60 * 1000, // 7 days in ms
        maxContextSize = 5000, // characters
        intelligentPruning = true
    } = config;

    // Conversation state
    const [conversations, setConversations] = useState([]);
    const [activeConversation, setActiveConversation] = useState(null);
    const [messages, setMessages] = useState([]);
    const [context, setContext] = useState({});
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);

    // Advanced features
    const [conversationFlows, setConversationFlows] = useState({});
    const [userPreferences, setUserPreferences] = useState({});
    const [conversationInsights, setConversationInsights] = useState({});
    const [contextMemory, setContextMemory] = useState({});

    // Refs
    const contextRef = useRef(context);
    const messagesRef = useRef(messages);
    const insightsRef = useRef(conversationInsights);

    // Update refs when state changes
    useEffect(() => {
        contextRef.current = context;
    }, [context]);

    useEffect(() => {
        messagesRef.current = messages;
    }, [messages]);

    useEffect(() => {
        insightsRef.current = conversationInsights;
    }, [conversationInsights]);

    // Initialize conversation system
    useEffect(() => {
        initializeConversationSystem();
    }, []);

    const initializeConversationSystem = async () => {
        try {
            await loadSavedConversations();
            await loadUserPreferences();
            await loadContextMemory();

            // Create default conversation if none exists
            if (conversations.length === 0) {
                await createNewConversation('Nova Conversa');
            }

        } catch (error) {
            console.error('Error initializing conversation system:', error);
            setError(error);
        }
    };

    const loadSavedConversations = async () => {
        if (!persistenceEnabled) return;

        try {
            const saved = localStorage.getItem('matias_conversations_v2');
            if (saved) {
                const parsed = JSON.parse(saved);
                // Validate and migrate if needed
                const validConversations = validateAndMigrateConversations(parsed);
                setConversations(validConversations);

                // Set most recent conversation as active
                if (validConversations.length > 0) {
                    const mostRecent = validConversations
                        .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))[0];
                    setActiveConversation(mostRecent.id);
                    setMessages(mostRecent.messages || []);
                    setContext(mostRecent.context || {});
                }
            }
        } catch (error) {
            console.warn('Error loading saved conversations:', error);
        }
    };

    const validateAndMigrateConversations = (conversations) => {
        return conversations
            .filter(conv => conv && conv.id && conv.messages)
            .map(conv => ({
                ...conv,
                id: conv.id || uuidv4(),
                messages: (conv.messages || []).map(msg => ({
                    ...msg,
                    id: msg.id || uuidv4(),
                    timestamp: msg.timestamp ? new Date(msg.timestamp) : new Date()
                })),
                updatedAt: conv.updatedAt ? new Date(conv.updatedAt) : new Date(),
                createdAt: conv.createdAt ? new Date(conv.createdAt) : new Date(),
                context: conv.context || {},
                metadata: conv.metadata || {},
                insights: conv.insights || {}
            }))
            .slice(-maxHistorySize);
    };

    const loadUserPreferences = async () => {
        try {
            const saved = localStorage.getItem('matias_conversation_preferences');
            if (saved) {
                setUserPreferences(JSON.parse(saved));
            }
        } catch (error) {
            console.warn('Error loading user preferences:', error);
        }
    };

    const loadContextMemory = async () => {
        try {
            const saved = localStorage.getItem('matias_context_memory');
            if (saved) {
                const parsed = JSON.parse(saved);
                // Clean old context entries
                const cleaned = cleanOldContext(parsed);
                setContextMemory(cleaned);
            }
        } catch (error) {
            console.warn('Error loading context memory:', error);
        }
    };

    const cleanOldContext = (memory) => {
        const cutoff = Date.now() - contextRetention;
        const cleaned = {};

        Object.keys(memory).forEach(key => {
            if (memory[key].timestamp > cutoff) {
                cleaned[key] = memory[key];
            }
        });

        return cleaned;
    };

    const createNewConversation = async (title = null) => {
        const conversationId = uuidv4();
        const now = new Date();

        const newConversation = {
            id: conversationId,
            title: title || generateConversationTitle(),
            messages: [],
            context: {},
            metadata: {
                language: defaultLanguage,
                startTime: now.toISOString(),
                messageCount: 0,
                avgResponseTime: 0,
                satisfaction: null
            },
            insights: {},
            createdAt: now,
            updatedAt: now
        };

        const updatedConversations = [newConversation, ...conversations];
        setConversations(updatedConversations);
        setActiveConversation(conversationId);
        setMessages([]);
        setContext({});

        if (autoSave) {
            await saveConversations(updatedConversations);
        }

        return newConversation;
    };

    const generateConversationTitle = () => {
        const titles = [
            'Consulta Rápida',
            'Agendamento',
            'Diagnóstico',
            'Suporte Técnico',
            'Dúvida Geral',
            'Assistência',
            'Orientação',
            'Solicitação'
        ];

        return titles[Math.floor(Math.random() * titles.length)];
    };

    const addMessage = async (content, type = 'user', metadata = {}) => {
        if (!content || !content.trim()) {
            throw new Error('Message content cannot be empty');
        }

        const messageId = uuidv4();
        const now = new Date();

        const message = {
            id: messageId,
            type,
            content: content.trim(),
            timestamp: now,
            metadata: {
                ...metadata,
                conversationId: activeConversation,
                language: userPreferences.language || defaultLanguage
            }
        };

        // Add message to current conversation
        const updatedMessages = [...messages, message];
        setMessages(updatedMessages);
        messagesRef.current = updatedMessages;

        // Update conversation metadata
        await updateConversationMetadata(message);

        // Extract and update context
        await extractAndUpdateContext(message);

        // Generate conversation insights
        await generateConversationInsights(message);

        // Update conversation list
        const updatedConversations = conversations.map(conv =>
            conv.id === activeConversation
                ? { ...conv, messages: updatedMessages, updatedAt: now }
                : conv
        );

        setConversations(updatedConversations);

        if (autoSave) {
            await saveConversations(updatedConversations);
        }

        return message;
    };

    const updateConversationMetadata = async (message) => {
        if (!activeConversation) return;

        const conversation = conversations.find(conv => conv.id === activeConversation);
        if (!conversation) return;

        const updatedMetadata = {
            ...conversation.metadata,
            messageCount: (conversation.metadata.messageCount || 0) + 1,
            lastMessageTime: message.timestamp.toISOString(),
            lastMessageType: message.type
        };

        // Update average response time for bot messages
        if (message.type === 'assistant') {
            const lastUserMessage = messages
                .filter(m => m.type === 'user')
                .pop();

            if (lastUserMessage) {
                const responseTime = message.timestamp - lastUserMessage.timestamp;
                const currentAvg = updatedMetadata.avgResponseTime || 0;
                const messageCount = updatedMetadata.messageCount;

                updatedMetadata.avgResponseTime =
                    (currentAvg * (messageCount - 1) + responseTime) / messageCount;
            }
        }

        // Update conversation in list
        const updatedConversations = conversations.map(conv =>
            conv.id === activeConversation
                ? { ...conv, metadata: updatedMetadata }
                : conv
        );

        setConversations(updatedConversations);
    };

    const extractAndUpdateContext = async (message) => {
        try {
            const extractedContext = await extractContextFromMessage(message);
            const updatedContext = { ...contextRef.current, ...extractedContext };

            setContext(updatedContext);

            // Update context memory for persistence
            if (persistenceEnabled) {
                await updateContextMemory(extractedContext);
            }
        } catch (error) {
            console.warn('Error extracting context:', error);
        }
    };

    const extractContextFromMessage = async (message) => {
        const extracted = {};

        // Extract entities and information
        if (message.type === 'user') {
            // Vehicle information
            const vehicleInfo = extractVehicleInfo(message.content);
            if (Object.keys(vehicleInfo).length > 0) {
                extracted.vehicle = vehicleInfo;
            }

            // Contact information
            const contactInfo = extractContactInfo(message.content);
            if (Object.keys(contactInfo).length > 0) {
                extracted.contact = contactInfo;
            }

            // Service information
            const serviceInfo = extractServiceInfo(message.content);
            if (Object.keys(serviceInfo).length > 0) {
                extracted.service = serviceInfo;
            }

            // Location information
            const locationInfo = extractLocationInfo(message.content);
            if (Object.keys(locationInfo).length > 0) {
                extracted.location = locationInfo;
            }

            // Emotional state
            const emotionalState = extractEmotionalState(message.content);
            if (emotionalState) {
                extracted.emotional = emotionalState;
            }
        }

        // Add message metadata to context
        extracted.lastMessage = {
            id: message.id,
            type: message.type,
            timestamp: message.timestamp.toISOString(),
            length: message.content.length
        };

        return extracted;
    };

    const extractVehicleInfo = (content) => {
        const info = {};
        const lowerContent = content.toLowerCase();

        // License plate extraction (Brazilian format)
        const platePattern = /[A-Z]{3}[-\s]?[0-9][A-Z][0-9]{2}|[A-Z]{3}[-\s]?[0-9]{4}/gi;
        const plateMatch = content.match(platePattern);
        if (plateMatch) {
            info.licensePlate = plateMatch[0].replace(/[-\s]/g, '');
        }

        // Vehicle brand extraction
        const brands = ['volkswagen', 'fiat', 'chevrolet', 'ford', 'toyota', 'honda', 'hyundai', 'renault', 'nissan'];
        const foundBrand = brands.find(brand => lowerContent.includes(brand));
        if (foundBrand) {
            info.brand = foundBrand.charAt(0).toUpperCase() + foundBrand.slice(1);
        }

        // Year extraction
        const yearPattern = /\b(19|20)\d{2}\b/g;
        const yearMatch = content.match(yearPattern);
        if (yearMatch) {
            const years = yearMatch.map(year => parseInt(year));
            const currentYear = new Date().getFullYear();
            const validYears = years.filter(year => year >= 1980 && year <= currentYear + 1);
            if (validYears.length > 0) {
                info.year = Math.max(...validYears);
            }
        }

        // Model extraction (basic)
        const models = ['gol', 'palio', 'celta', 'corolla', 'civic', 'hb20', 'creta', 'kwid', 'march'];
        const foundModel = models.find(model => lowerContent.includes(model));
        if (foundModel) {
            info.model = foundModel.charAt(0).toUpperCase() + foundModel.slice(1);
        }

        return info;
    };

    const extractContactInfo = (content) => {
        const info = {};

        // Phone extraction (Brazilian format)
        const phonePattern = /\(?[\d]{2}\)?\s?[\d]{4,5}[-\s]?[\d]{4}/g;
        const phoneMatch = content.match(phonePattern);
        if (phoneMatch) {
            info.phone = phoneMatch[0];
        }

        // Email extraction
        const emailPattern = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g;
        const emailMatch = content.match(emailPattern);
        if (emailMatch) {
            info.email = emailMatch[0];
        }

        // Name extraction (basic - assumes first name)
        const words = content.split(' ');
        const names = words.filter(word =>
            word.length > 2 &&
            /^[A-Z][a-z]+$/.test(word) &&
            !['Olá', 'Oi', 'Bom', 'Boa', 'Por', 'Para', 'Com'].includes(word)
        );
        if (names.length > 0) {
            info.name = names[0];
        }

        return info;
    };

    const extractServiceInfo = (content) => {
        const info = {};
        const lowerContent = content.toLowerCase();

        // Service type extraction
        const serviceTypes = {
            'manutenção preventiva': 'preventive_maintenance',
            'revisão': 'maintenance',
            'troca de óleo': 'oil_change',
            'alinhamento': 'alignment',
            'balanceamento': 'balancing',
            'freio': 'brake_service',
            'pneu': 'tire_service',
            'bateria': 'battery_service',
            'diagnóstico': 'diagnosis',
            'emergência': 'emergency'
        };

        Object.keys(serviceTypes).forEach(type => {
            if (lowerContent.includes(type)) {
                info.type = serviceTypes[type];
                info.description = type;
            }
        });

        // Urgency extraction
        if (lowerContent.includes('urgente') || lowerContent.includes('emergência')) {
            info.urgency = 'high';
        } else if (lowerContent.includes('rápido') || lowerContent.includes('hoje')) {
            info.urgency = 'medium';
        }

        return info;
    };

    const extractLocationInfo = (content) => {
        const info = {};

        // Brazilian city patterns (basic)
        const cities = ['são paulo', 'rio de janeiro', 'brasília', 'salvador', 'fortaleza', 'belo horizonte'];
        const foundCity = cities.find(city => content.toLowerCase().includes(city));
        if (foundCity) {
            info.city = foundCity;
        }

        // Address pattern
        const addressPattern = /\b[rua|avenida|alameda|travessa|estrada]\s+.+/gi;
        const addressMatch = content.match(addressPattern);
        if (addressMatch) {
            info.address = addressMatch[0];
        }

        return info;
    };

    const extractEmotionalState = (content) => {
        const lowerContent = content.toLowerCase();

        if (lowerContent.includes('feliz') || lowerContent.includes('ótimo') || lowerContent.includes('excelente')) {
            return { sentiment: 'positive', intensity: 0.8 };
        }

        if (lowerContent.includes('triste') || lowerContent.includes('chateado') || lowerContent.includes('frustrado')) {
            return { sentiment: 'negative', intensity: 0.7 };
        }

        if (lowerContent.includes('urgente') || lowerContent.includes('desesperado') || lowerContent.includes('ajuda')) {
            return { sentiment: 'urgent', intensity: 0.9 };
        }

        if (lowerContent.includes('dúvida') || lowerContent.includes('confuso') || lowerContent.includes('não entendi')) {
            return { sentiment: 'confused', intensity: 0.6 };
        }

        return { sentiment: 'neutral', intensity: 0.5 };
    };

    const updateContextMemory = async (newContext) => {
        const timestamp = Date.now();
        const updatedMemory = {
            ...contextMemory,
            [activeConversation]: {
                context: { ...contextMemory[activeConversation]?.context, ...newContext },
                timestamp,
                lastUpdated: new Date().toISOString()
            }
        };

        setContextMemory(updatedMemory);

        if (autoSave) {
            try {
                localStorage.setItem('matias_context_memory', JSON.stringify(updatedMemory));
            } catch (error) {
                console.warn('Error saving context memory:', error);
            }
        }
    };

    const generateConversationInsights = async (message) => {
        try {
            const insights = { ...conversationInsights };

            // Message pattern analysis
            insights.messagePatterns = analyzeMessagePatterns(messagesRef.current);

            // Topic analysis
            insights.topics = analyzeConversationTopics(messagesRef.current);

            // User behavior patterns
            insights.userBehavior = analyzeUserBehavior(messagesRef.current);

            // Conversation flow analysis
            insights.flowAnalysis = analyzeConversationFlow(messagesRef.current);

            // Satisfaction indicators
            insights.satisfaction = analyzeSatisfactionIndicators(messagesRef.current);

            setConversationInsights(insights);

            // Update active conversation with insights
            if (activeConversation) {
                const updatedConversations = conversations.map(conv =>
                    conv.id === activeConversation
                        ? { ...conv, insights }
                        : conv
                );
                setConversations(updatedConversations);
            }
        } catch (error) {
            console.warn('Error generating conversation insights:', error);
        }
    };

    const analyzeMessagePatterns = (messagesList) => {
        if (messagesList.length < 3) return {};

        const userMessages = messagesList.filter(m => m.type === 'user');
        const botMessages = messagesList.filter(m => m.type === 'assistant');

        return {
            avgUserMessageLength: userMessages.reduce((sum, m) => sum + m.content.length, 0) / userMessages.length,
            avgBotMessageLength: botMessages.reduce((sum, m) => sum + m.content.length, 0) / botMessages.length,
            userMessageFrequency: userMessages.length / ((Date.now() - messagesList[0].timestamp) / (1000 * 60)), // per minute
            conversationTurns: Math.min(userMessages.length, botMessages.length)
        };
    };

    const analyzeConversationTopics = (messagesList) => {
        const topics = {
            scheduling: 0,
            diagnosis: 0,
            emergency: 0,
            pricing: 0,
            general: 0
        };

        const topicKeywords = {
            scheduling: ['agendar', 'marcar', 'horário', 'data', 'agendamento'],
            diagnosis: ['diagnosticar', 'problema', 'sintoma', 'barulho', 'funciona'],
            emergency: ['emergência', 'urgente', 'socorro', 'não liga', 'parou'],
            pricing: ['preço', 'custo', 'valor', 'quanto custa', 'orçamento']
        };

        messagesList.forEach(message => {
            const content = message.content.toLowerCase();
            let topicFound = false;

            Object.keys(topicKeywords).forEach(topic => {
                if (topicKeywords[topic].some(keyword => content.includes(keyword))) {
                    topics[topic]++;
                    topicFound = true;
                }
            });

            if (!topicFound) {
                topics.general++;
            }
        });

        return topics;
    };

    const analyzeUserBehavior = (messagesList) => {
        const userMessages = messagesList.filter(m => m.type === 'user');

        if (userMessages.length === 0) return {};

        const messageTimes = userMessages.map(m => m.timestamp.getHours());
        const preferredHour = getMostCommonValue(messageTimes);

        const messageLengths = userMessages.map(m => m.content.length);
        const avgLength = messageLengths.reduce((sum, len) => sum + len, 0) / messageLengths.length;

        return {
            preferredInteractionTime: preferredHour,
            averageMessageLength: avgLength,
            totalMessages: userMessages.length,
            conversationDuration: messagesList.length > 0
                ? (Date.now() - messagesList[0].timestamp) / (1000 * 60)
                : 0 // in minutes
        };
    };

    const analyzeConversationFlow = (messagesList) => {
        if (messagesList.length < 2) return {};

        const flows = [];
        for (let i = 1; i < messagesList.length; i++) {
            const current = messagesList[i];
            const previous = messagesList[i - 1];

            flows.push({
                from: previous.type,
                to: current.type,
                responseTime: current.timestamp - previous.timestamp
            });
        }

        const avgResponseTime = flows
            .filter(f => f.from === 'user' && f.to === 'assistant')
            .reduce((sum, f) => sum + f.responseTime, 0) /
            flows.filter(f => f.from === 'user' && f.to === 'assistant').length;

        return {
            averageResponseTime: avgResponseTime || 0,
            conversationTurns: flows.filter(f => f.from === 'user').length,
            flowEfficiency: flows.length > 0 ? flows.filter(f => f.to === 'assistant').length / flows.length : 0
        };
    };

    const analyzeSatisfactionIndicators = (messagesList) => {
        const positiveIndicators = ['obrigado', 'ótimo', 'perfeito', 'excelente', 'ajudou'];
        const negativeIndicators = ['ruim', 'péssimo', 'não ajudou', 'frustrado', 'chateado'];

        let positiveCount = 0;
        let negativeCount = 0;

        messagesList.forEach(message => {
            const content = message.content.toLowerCase();

            positiveIndicators.forEach(indicator => {
                if (content.includes(indicator)) positiveCount++;
            });

            negativeIndicators.forEach(indicator => {
                if (content.includes(indicator)) negativeCount++;
            });
        });

        const totalIndicators = positiveCount + negativeCount;
        const satisfactionScore = totalIndicators > 0
            ? (positiveCount / totalIndicators) * 100
            : 50; // neutral score

        return {
            score: satisfactionScore,
            positiveIndicators: positiveCount,
            negativeIndicators: negativeCount,
            confidence: totalIndicators > 0 ? Math.min(totalIndicators / 10, 1) : 0
        };
    };

    const getMostCommonValue = (array) => {
        const counts = {};
        array.forEach(value => {
            counts[value] = (counts[value] || 0) + 1;
        });

        return Object.keys(counts).reduce((a, b) => counts[a] > counts[b] ? a : b);
    };

    const getContextForResponse = useCallback((limit = contextWindow) => {
        const recentMessages = messagesRef.current.slice(-limit);
        return {
            messages: recentMessages,
            context: contextRef.current,
            insights: insightsRef.current,
            conversationMetadata: conversations.find(c => c.id === activeConversation)?.metadata
        };
    }, [contextWindow, activeConversation, conversations]);

    const switchConversation = async (conversationId) => {
        const conversation = conversations.find(conv => conv.id === conversationId);
        if (!conversation) {
            throw new Error('Conversation not found');
        }

        setActiveConversation(conversationId);
        setMessages(conversation.messages || []);
        setContext(conversation.context || {});
    };

    const deleteConversation = async (conversationId) => {
        const updatedConversations = conversations.filter(conv => conv.id !== conversationId);
        setConversations(updatedConversations);

        if (conversationId === activeConversation) {
            if (updatedConversations.length > 0) {
                await switchConversation(updatedConversations[0].id);
            } else {
                await createNewConversation();
            }
        }

        if (autoSave) {
            await saveConversations(updatedConversations);
        }

        // Remove from context memory
        const updatedMemory = { ...contextMemory };
        delete updatedMemory[conversationId];
        setContextMemory(updatedMemory);
        localStorage.setItem('matias_context_memory', JSON.stringify(updatedMemory));
    };

    const updateConversationTitle = async (conversationId, newTitle) => {
        const updatedConversations = conversations.map(conv =>
            conv.id === conversationId
                ? { ...conv, title: newTitle, updatedAt: new Date() }
                : conv
        );

        setConversations(updatedConversations);

        if (autoSave) {
            await saveConversations(updatedConversations);
        }
    };

    const saveConversations = async (conversationsToSave) => {
        if (!persistenceEnabled) return;

        try {
            const dataToSave = intelligentPruning
                ? pruneConversations(conversationsToSave)
                : conversationsToSave;

            const data = encryptionEnabled
                ? await encryptData(dataToSave)
                : dataToSave;

            localStorage.setItem('matias_conversations_v2', JSON.stringify(data));
        } catch (error) {
            console.error('Error saving conversations:', error);
            setError(error);
        }
    };

    const pruneConversations = (conversationsToPrune) => {
        return conversationsToPrune
            .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
            .slice(0, maxHistorySize)
            .map(conv => ({
                ...conv,
                messages: conv.messages.slice(-20), // Keep only last 20 messages
                context: pruneContext(conv.context)
            }));
    };

    const pruneContext = (contextToPrune) => {
        const pruned = {};
        const contextString = JSON.stringify(contextToPrune);

        if (contextString.length > maxContextSize) {
            // Keep most important context keys
            const importantKeys = ['vehicle', 'contact', 'service', 'lastMessage'];
            importantKeys.forEach(key => {
                if (contextToPrune[key]) {
                    pruned[key] = contextToPrune[key];
                }
            });
        } else {
            return contextToPrune;
        }

        return pruned;
    };

    const encryptData = async (data) => {
        // Simple encryption implementation - in production, use proper encryption
        return {
            encrypted: true,
            data: btoa(JSON.stringify(data)),
            timestamp: Date.now()
        };
    };

    const exportConversations = () => {
        const exportData = {
            conversations,
            preferences: userPreferences,
            insights: conversationInsights,
            exportedAt: new Date().toISOString(),
            version: '2.0'
        };

        const blob = new Blob([JSON.stringify(exportData, null, 2)], {
            type: 'application/json'
        });

        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `matias-conversations-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    const importConversations = async (file) => {
        try {
            const text = await file.text();
            const data = JSON.parse(text);

            if (data.version === '2.0') {
                setConversations(data.conversations || []);
                setUserPreferences(data.preferences || {});
                setConversationInsights(data.insights || {});
            } else {
                // Handle legacy format
                const migrated = validateAndMigrateConversations(Array.isArray(data) ? data : [data]);
                setConversations(migrated);
            }

            if (autoSave) {
                await saveConversations(conversations);
            }

        } catch (error) {
            console.error('Error importing conversations:', error);
            setError(error);
        }
    };

    const clearAllData = async () => {
        setConversations([]);
        setMessages([]);
        setContext({});
        setConversationInsights({});
        setContextMemory({});

        localStorage.removeItem('matias_conversations_v2');
        localStorage.removeItem('matias_context_memory');
        localStorage.removeItem('matias_conversation_preferences');

        await createNewConversation();
    };

    // Memoized values for performance
    const conversationStats = useMemo(() => {
        const totalConversations = conversations.length;
        const totalMessages = conversations.reduce((sum, conv) => sum + (conv.messages?.length || 0), 0);
        const avgMessagesPerConversation = totalConversations > 0 ? totalMessages / totalConversations : 0;

        const activeConversations = conversations.filter(conv => {
            const lastMessage = conv.messages?.[conv.messages.length - 1];
            if (!lastMessage) return false;
            const hoursSinceLastMessage = (Date.now() - new Date(lastMessage.timestamp)) / (1000 * 60 * 60);
            return hoursSinceLastMessage < 24;
        }).length;

        return {
            totalConversations,
            totalMessages,
            avgMessagesPerConversation,
            activeConversations,
            averageResponseTime: conversationInsights.flowAnalysis?.averageResponseTime || 0,
            satisfactionScore: conversationInsights.satisfaction?.score || 50
        };
    }, [conversations, conversationInsights]);

    return {
        // Core state
        conversations,
        activeConversation,
        messages,
        context,
        isLoading,
        error,

        // Advanced features
        conversationFlows,
        userPreferences,
        conversationInsights,
        contextMemory,

        // Actions
        createNewConversation,
        addMessage,
        switchConversation,
        deleteConversation,
        updateConversationTitle,
        getContextForResponse,

        // Data management
        exportConversations,
        importConversations,
        clearAllData,

        // Analytics
        conversationStats,

        // Utility
        setError,
        setIsLoading
    };
};

export default useMatiasConversation;