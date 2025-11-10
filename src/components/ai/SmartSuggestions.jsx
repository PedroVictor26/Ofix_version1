/**
 * 🧠 Smart Suggestions Component
 *
 * Context-aware quick actions that adapt based on:
 * - Time of day
 * - Conversation history
 * - User patterns
 * - Workshop-specific context
 * - Current conversation flow
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
    Calendar, Search, Camera, AlertCircle, Settings, Phone,
    Clock, TrendingUp, Users, FileText, Wrench, Car,
    MapPin, Star, Zap, Shield, Globe, Coffee, Sun, Moon,
    ChevronRight, Sparkles, Target, BarChart3, MessageSquare,
    HelpCircle, Download, Upload, Filter, Bell, Heart,
    ThumbsUp, Share2, Bookmark, History, Timer
} from 'lucide-react';

const SmartSuggestions = ({
    onSuggestionClick = () => {},
    conversationHistory = [],
    currentUser = null,
    workshopData = {},
    timeContext = null,
    maxSuggestions = 6,
    adaptiveLearning = true,
    personalizationEnabled = true
}) => {
    const [suggestions, setSuggestions] = useState([]);
    const [categories, setCategories] = useState([]);
    const [contextualFactors, setContextualFactors] = useState({});
    const [userPatterns, setUserPatterns] = useState({});
    const [loading, setLoading] = useState(false);

    // Time-based and contextual state
    const [currentTime, setCurrentTime] = useState(new Date());
    const [isActive, setIsActive] = useState(false);
    const [urgencyLevel, setUrgencyLevel] = useState('normal');

    // Update current time every minute
    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentTime(new Date());
        }, 60000);

        return () => clearInterval(timer);
    }, []);

    // Load user patterns and preferences
    useEffect(() => {
        loadUserPatterns();
        analyzeContextualFactors();
    }, [conversationHistory, currentUser, timeContext]);

    // Generate suggestions based on context
    useEffect(() => {
        generateSmartSuggestions();
    }, [contextualFactors, userPatterns, currentTime, conversationHistory]);

    const loadUserPatterns = async () => {
        try {
            // Load from localStorage or API
            const saved = localStorage.getItem('matias_user_patterns');
            if (saved) {
                setUserPatterns(JSON.parse(saved));
            }

            // Analyze conversation history for patterns
            const patterns = analyzeConversationPatterns(conversationHistory);
            setUserPatterns(prev => ({ ...prev, ...patterns }));
        } catch (error) {
            console.warn('Error loading user patterns:', error);
        }
    };

    const analyzeConversationPatterns = (history) => {
        if (!history || history.length === 0) return {};

        const patterns = {
            frequentActions: {},
            timePreferences: {},
            urgencyTriggers: [],
            preferredTopics: [],
            lastTopics: []
        };

        // Analyze last 20 messages for patterns
        const recentHistory = history.slice(-20);

        recentHistory.forEach((message, index) => {
            if (message.type === 'user') {
                // Extract action patterns
                const actions = extractActions(message.content);
                actions.forEach(action => {
                    patterns.frequentActions[action] = (patterns.frequentActions[action] || 0) + 1;
                });

                // Time preferences
                const hour = new Date(message.timestamp).getHours();
                patterns.timePreferences[hour] = (patterns.timePreferences[hour] || 0) + 1;

                // Urgency detection
                if (isUrgentMessage(message.content)) {
                    patterns.urgencyTriggers.push({
                        time: message.timestamp,
                        content: message.content
                    });
                }

                // Topic extraction
                const topics = extractTopics(message.content);
                patterns.preferredTopics.push(...topics);

                // Track recent topics
                if (index >= recentHistory.length - 3) {
                    patterns.lastTopics.push(...topics);
                }
            }
        });

        // Sort and limit preferences
        patterns.preferredTopics = [...new Set(patterns.preferredTopics)]
            .slice(0, 10);

        return patterns;
    };

    const extractActions = (content) => {
        const actionKeywords = {
            'agendar': 'scheduling',
            'marcar': 'scheduling',
            'consultar': 'searching',
            'procurar': 'searching',
            'verificar': 'checking',
            'diagnosticar': 'diagnosis',
            'ajuda': 'help',
            'emergência': 'emergency',
            'contato': 'contact'
        };

        const actions = [];
        const contentLower = content.toLowerCase();

        Object.keys(actionKeywords).forEach(keyword => {
            if (contentLower.includes(keyword)) {
                actions.push(actionKeywords[keyword]);
            }
        });

        return actions;
    };

    const isUrgentMessage = (content) => {
        const urgentKeywords = [
            'urgente', 'emergência', 'socorro', 'não liga',
            'acidente', 'quebrado', 'parou', 'não funciona',
            'imediato', 'rápido', 'pressa', 'desesperado'
        ];

        return urgentKeywords.some(keyword =>
            content.toLowerCase().includes(keyword)
        );
    };

    const extractTopics = (content) => {
        const topicPatterns = {
            'os': 'ordem_servico',
            'ordem': 'ordem_servico',
            'serviço': 'servicos',
            'manutenção': 'manutencao',
            'revisão': 'revisao',
            'óleo': 'oleo',
            'pneu': 'pneus',
            'freio': 'freios',
            'motor': 'motor',
            'bateria': 'bateria',
            'peça': 'pecas',
            'agendamento': 'agendamento',
            'horário': 'agendamento',
            'preço': 'precos',
            'custo': 'precos'
        };

        const topics = [];
        const contentLower = content.toLowerCase();

        Object.keys(topicPatterns).forEach(pattern => {
            if (contentLower.includes(pattern)) {
                topics.push(topicPatterns[pattern]);
            }
        });

        return topics;
    };

    const analyzeContextualFactors = () => {
        const hour = currentTime.getHours();
        const dayOfWeek = currentTime.getDay();
        const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

        const factors = {
            timeOfDay: getTimeOfDay(hour),
            isWorkHours: hour >= 8 && hour <= 18,
            isWeekend,
            isMorning: hour >= 6 && hour < 12,
            isAfternoon: hour >= 12 && hour < 18,
            isEvening: hour >= 18 && hour < 22,
            isNight: hour >= 22 || hour < 6,
            dayOfWeek,
            urgencyLevel: 'normal'
        };

        // Determine urgency based on recent conversations
        const recentMessages = conversationHistory.slice(-5);
        const hasUrgentRecent = recentMessages.some(msg =>
            msg.type === 'user' && isUrgentMessage(msg.content)
        );

        if (hasUrgentRecent) {
            factors.urgencyLevel = 'high';
        }

        // Workshop-specific factors
        if (workshopData) {
            factors.isWorkshopOpen = workshopData.isOpen !== false;
            factors.currentLoad = workshopData.currentLoad || 'normal';
            factors.specialties = workshopData.specialties || [];
        }

        setContextualFactors(factors);
        setUrgencyLevel(factors.urgencyLevel);
    };

    const getTimeOfDay = (hour) => {
        if (hour >= 6 && hour < 12) return 'morning';
        if (hour >= 12 && hour < 18) return 'afternoon';
        if (hour >= 18 && hour < 22) return 'evening';
        return 'night';
    };

    const generateSmartSuggestions = async () => {
        setLoading(true);

        try {
            const baseSuggestions = getBaseSuggestions();
            const contextualSuggestions = getContextualSuggestions();
            const personalizedSuggestions = getPersonalizedSuggestions();
            const urgentSuggestions = getUrgentSuggestions();

            // Combine and prioritize
            let allSuggestions = [
                ...urgentSuggestions,
                ...contextualSuggestions,
                ...personalizedSuggestions,
                ...baseSuggestions
            ];

            // Remove duplicates and sort by priority
            allSuggestions = deduplicateSuggestions(allSuggestions);
            allSuggestions = sortSuggestionsByPriority(allSuggestions);

            // Limit to maxSuggestions
            setSuggestions(allSuggestions.slice(0, maxSuggestions));

            // Generate categories
            setCategories(generateCategories(allSuggestions));

        } catch (error) {
            console.error('Error generating suggestions:', error);
        } finally {
            setLoading(false);
        }
    };

    const getBaseSuggestions = () => {
        return [
            {
                id: 'agendar_servico',
                text: '📅 Agendar Serviço',
                icon: Calendar,
                action: 'start_scheduling',
                category: 'scheduling',
                priority: 3,
                description: 'Marcar horário para manutenção ou reparo',
                tags: ['scheduling', 'appointment', 'service']
            },
            {
                id: 'consultar_os',
                text: '🔍 Consultar OS',
                icon: FileText,
                action: 'check_service_order',
                category: 'searching',
                priority: 2,
                description: 'Verificar status de ordens de serviço',
                tags: ['searching', 'os', 'status']
            },
            {
                id: 'diagnostico_rapido',
                text: '🎯 Diagnóstico Rápido',
                icon: Search,
                action: 'quick_diagnosis',
                category: 'diagnosis',
                priority: 2,
                description: 'Análise rápida de problemas',
                tags: ['diagnosis', 'quick', 'analysis']
            },
            {
                id: 'contato_oficina',
                text: '📞 Contato Oficina',
                icon: Phone,
                action: 'contact_workshop',
                category: 'contact',
                priority: 1,
                description: 'Falar diretamente com a oficina',
                tags: ['contact', 'phone', 'workshop']
            }
        ];
    };

    const getContextualSuggestions = () => {
        const suggestions = [];
        const factors = contextualFactors;

        // Time-based suggestions
        if (factors.isMorning) {
            suggestions.push({
                id: 'agendar_manha',
                text: '☀️ Agendar para Manhã',
                icon: Coffee,
                action: 'schedule_morning',
                category: 'scheduling',
                priority: 4,
                description: 'Primeiros horários disponíveis',
                contextual: true,
                reason: 'Manhã é ótimo horário para manutenção'
            });
        }

        if (factors.isEvening && !factors.isWorkHours) {
            suggestions.push({
                id: 'emergencia_24h',
                text: '🆘 Emergência 24h',
                icon: AlertCircle,
                action: 'emergency_support',
                category: 'emergency',
                priority: 5,
                description: 'Suporte imediato disponível',
                contextual: true,
                reason: 'Fora do horário comercial'
            });
        }

        if (factors.isWeekend) {
            suggestions.push({
                id: 'servico_urgente_fds',
                text: '🚨 Serviço Urgente FDS',
                icon: AlertCircle,
                action: 'weekend_urgent',
                category: 'emergency',
                priority: 4,
                description: 'Atendimento especial fim de semana',
                contextual: true,
                reason: 'Serviços de fim de semana disponíveis'
            });
        }

        // Workshop-specific suggestions
        if (workshopData.specialties && workshopData.specialties.length > 0) {
            const mainSpecialty = workshopData.specialties[0];
            suggestions.push({
                id: `especialidade_${mainSpecialty}`,
                text: `🔧 ${mainSpecialty}`,
                icon: Wrench,
                action: 'specialty_service',
                category: 'services',
                priority: 3,
                description: `Serviço especializado em ${mainSpecialty}`,
                contextual: true,
                reason: 'Especialidade da oficina'
            });
        }

        // Load-based suggestions
        if (workshopData.currentLoad === 'low') {
            suggestions.push({
                id: 'atendimento_rapido',
                text: '⚡ Atendimento Rápido',
                icon: Zap,
                action: 'fast_service',
                category: 'services',
                priority: 4,
                description: 'Pouca fila, atendimento imediato',
                contextual: true,
                reason: 'Oficina com baixa demanda'
            });
        }

        return suggestions;
    };

    const getPersonalizedSuggestions = () => {
        if (!personalizationEnabled) return [];

        const suggestions = [];
        const patterns = userPatterns;

        // Based on frequent actions
        if (patterns.frequentActions) {
            const mostFrequent = Object.entries(patterns.frequentActions)
                .sort(([,a], [,b]) => b - a)[0];

            if (mostFrequent && mostFrequent[1] > 2) {
                const action = mostFrequent[0];
                suggestions.push({
                    id: `repetir_${action}`,
                    text: `🔄 Repetir Ação Anterior`,
                    icon: History,
                    action: `repeat_${action}`,
                    category: 'personalized',
                    priority: 3,
                    description: `Repetir sua ação mais comum: ${action}`,
                    personalized: true,
                    usageCount: mostFrequent[1]
                });
            }
        }

        // Based on time preferences
        if (patterns.timePreferences) {
            const currentHour = currentTime.getHours();
            const preferredHour = Object.entries(patterns.timePreferences)
                .sort(([,a], [,b]) => b - a)[0];

            if (preferredHour) {
                const [hour, count] = preferredHour;
                if (count > 3 && Math.abs(hour - currentHour) <= 2) {
                    suggestions.push({
                        id: 'horario_preferido',
                        text: '🕐 Horário Preferido',
                        icon: Clock,
                        action: 'preferred_time',
                        category: 'personalized',
                        priority: 3,
                        description: `Seu horário preferido de atendimento`,
                        personalized: true,
                        reason: 'Baseado no seu histórico'
                    });
                }
            }
        }

        // Based on preferred topics
        if (patterns.preferredTopics && patterns.preferredTopics.length > 0) {
            const topTopic = patterns.preferredTopics[0];
            suggestions.push({
                id: `topico_favorito_${topTopic}`,
                text: `💡 Sobre ${topTopic}`,
                icon: Star,
                action: `favorite_topic_${topTopic}`,
                category: 'personalized',
                priority: 2,
                description: `Informações sobre seu tópico preferido`,
                personalized: true,
                topic: topTopic
            });
        }

        // Recent conversation context
        if (patterns.lastTopics && patterns.lastTopics.length > 0) {
            const lastTopic = patterns.lastTopics[patterns.lastTopics.length - 1];
            suggestions.push({
                id: `continuar_${lastTopic}`,
                text: `➡️ Continuar sobre ${lastTopic}`,
                icon: ChevronRight,
                action: `continue_topic_${lastTopic}`,
                category: 'personalized',
                priority: 3,
                description: 'Continuar conversa anterior',
                personalized: true,
                recent: true
            });
        }

        return suggestions;
    };

    const getUrgentSuggestions = () => {
        if (urgencyLevel === 'normal') return [];

        const urgentSuggestions = [
            {
                id: 'emergencia_imediata',
                text: '🚨 EMERGÊNCIA IMEDIATA',
                icon: AlertCircle,
                action: 'emergency_immediate',
                category: 'emergency',
                priority: 10,
                description: 'Atendimento de emergência agora',
                urgent: true
            },
            {
                id: 'guincho_urgente',
                text: '🚛 Solicitar Guincho',
                icon: MapPin,
                action: 'request_tow',
                category: 'emergency',
                priority: 9,
                description: 'Guincho imediato disponível',
                urgent: true
            },
            {
                id: 'contato_direto_urgente',
                text: '📞 Contato Urgente',
                icon: Phone,
                action: 'urgent_contact',
                category: 'emergency',
                priority: 8,
                description: 'Falar com atendente agora',
                urgent: true
            }
        ];

        return urgentSuggestions;
    };

    const deduplicateSuggestions = (suggestions) => {
        const seen = new Set();
        return suggestions.filter(suggestion => {
            const key = suggestion.action || suggestion.id;
            if (seen.has(key)) return false;
            seen.add(key);
            return true;
        });
    };

    const sortSuggestionsByPriority = (suggestions) => {
        return suggestions.sort((a, b) => {
            // Urgent suggestions first
            if (a.urgent && !b.urgent) return -1;
            if (!a.urgent && b.urgent) return 1;

            // Then by priority
            if (a.priority !== b.priority) {
                return b.priority - a.priority;
            }

            // Then by contextual relevance
            if (a.contextual && !b.contextual) return -1;
            if (!a.contextual && b.contextual) return 1;

            // Then by personalized
            if (a.personalized && !b.personalized) return -1;
            if (!a.personalized && b.personalized) return 1;

            return 0;
        });
    };

    const generateCategories = (suggestionsList) => {
        const categoryGroups = {};

        suggestionsList.forEach(suggestion => {
            if (!categoryGroups[suggestion.category]) {
                categoryGroups[suggestion.category] = {
                    name: suggestion.category,
                    suggestions: [],
                    icon: getCategoryIcon(suggestion.category)
                };
            }
            categoryGroups[suggestion.category].suggestions.push(suggestion);
        });

        return Object.values(categoryGroups);
    };

    const getCategoryIcon = (category) => {
        const icons = {
            'scheduling': Calendar,
            'searching': Search,
            'diagnosis': Search,
            'contact': Phone,
            'emergency': AlertCircle,
            'services': Wrench,
            'personalized': Star,
            'help': HelpCircle
        };

        return icons[category] || MessageSquare;
    };

    const handleSuggestionClick = (suggestion) => {
        // Track interaction for learning
        trackSuggestionInteraction(suggestion);

        // Call parent handler
        onSuggestionClick(suggestion);
    };

    const trackSuggestionInteraction = (suggestion) => {
        if (!adaptiveLearning) return;

        try {
            // Track this interaction in patterns
            const interaction = {
                suggestionId: suggestion.id,
                action: suggestion.action,
                category: suggestion.category,
                timestamp: new Date().toISOString(),
                context: contextualFactors
            };

            const existing = JSON.parse(localStorage.getItem('matias_suggestion_interactions') || '[]');
            existing.push(interaction);

            // Keep only last 100 interactions
            const trimmed = existing.slice(-100);
            localStorage.setItem('matias_suggestion_interactions', JSON.stringify(trimmed));

        } catch (error) {
            console.warn('Error tracking suggestion interaction:', error);
        }
    };

    const renderSuggestion = (suggestion) => {
        const Icon = suggestion.icon;
        const isUrgent = suggestion.urgent;
        const isPersonalized = suggestion.personalized;
        const isContextual = suggestion.contextual;

        return (
            <button
                key={suggestion.id}
                onClick={() => handleSuggestionClick(suggestion)}
                className={`
                    relative w-full p-3 rounded-lg border transition-all duration-200
                    text-left hover:shadow-md transform hover:scale-105
                    ${isUrgent
                        ? 'border-red-300 bg-red-50 hover:border-red-400 hover:bg-red-100'
                        : 'border-gray-200 bg-white hover:border-blue-300 hover:bg-blue-50'
                    }
                    ${isPersonalized ? 'ring-2 ring-purple-200' : ''}
                    ${isContextual ? 'bg-gradient-to-r from-blue-50 to-purple-50' : ''}
                `}
            >
                {/* Badges */}
                <div className="absolute top-2 right-2 flex gap-1">
                    {isUrgent && (
                        <span className="px-2 py-1 bg-red-500 text-white text-xs rounded-full">
                            Urgente
                        </span>
                    )}
                    {isPersonalized && (
                        <span className="px-2 py-1 bg-purple-500 text-white text-xs rounded-full">
                            Personalizado
                        </span>
                    )}
                    {isContextual && (
                        <span className="px-2 py-1 bg-blue-500 text-white text-xs rounded-full">
                            Contextual
                        </span>
                    )}
                </div>

                {/* Content */}
                <div className="flex items-start gap-3">
                    <div className={`
                        w-10 h-10 rounded-lg flex items-center justify-center
                        ${isUrgent
                            ? 'bg-red-100 text-red-600'
                            : 'bg-blue-100 text-blue-600'
                        }
                    `}>
                        <Icon className="w-5 h-5" />
                    </div>

                    <div className="flex-1 min-w-0">
                        <div className="font-medium text-gray-900 pr-16">
                            {suggestion.text}
                        </div>
                        {suggestion.description && (
                            <div className="text-sm text-gray-600 mt-1">
                                {suggestion.description}
                            </div>
                        )}

                        {/* Tags */}
                        {suggestion.tags && suggestion.tags.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-2">
                                {suggestion.tags.slice(0, 3).map((tag, index) => (
                                    <span
                                        key={index}
                                        className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded"
                                    >
                                        {tag}
                                    </span>
                                ))}
                            </div>
                        )}

                        {/* Reason for suggestion */}
                        {suggestion.reason && (
                            <div className="text-xs text-gray-500 mt-2 flex items-center gap-1">
                                <Sparkles className="w-3 h-3" />
                                {suggestion.reason}
                            </div>
                        )}
                    </div>
                </div>

                {/* Usage indicator for personalized suggestions */}
                {suggestion.usageCount && (
                    <div className="mt-2 text-xs text-gray-500 flex items-center gap-1">
                        <BarChart3 className="w-3 h-3" />
                        Usado {suggestion.usageCount} vezes
                    </div>
                )}
            </button>
        );
    };

    const renderCategory = (category) => {
        const Icon = category.icon;

        return (
            <div key={category.name} className="mb-6">
                <div className="flex items-center gap-2 mb-3">
                    <Icon className="w-4 h-4 text-gray-600" />
                    <h3 className="text-sm font-semibold text-gray-900 capitalize">
                        {category.name}
                    </h3>
                    <span className="text-xs text-gray-500">
                        ({category.suggestions.length})
                    </span>
                </div>

                <div className="space-y-2">
                    {category.suggestions.map(renderSuggestion)}
                </div>
            </div>
        );
    };

    if (loading) {
        return (
            <div className="space-y-3">
                {[...Array(3)].map((_, index) => (
                    <div key={index} className="p-4 bg-gray-100 rounded-lg animate-pulse">
                        <div className="h-4 bg-gray-300 rounded w-3/4 mb-2"></div>
                        <div className="h-3 bg-gray-300 rounded w-1/2"></div>
                    </div>
                ))}
            </div>
        );
    }

    if (suggestions.length === 0) {
        return (
            <div className="text-center py-8 text-gray-500">
                <HelpCircle className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                <p className="text-sm">Nenhuma sugestão disponível</p>
                <p className="text-xs mt-1">Continue conversando para ver sugestões personalizadas</p>
            </div>
        );
    }

    return (
        <div className="smart-suggestions">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-purple-600" />
                    <h2 className="text-lg font-semibold text-gray-900">
                        Sugestões Inteligentes
                    </h2>
                    {personalizationEnabled && (
                        <span className="px-2 py-1 bg-purple-100 text-purple-700 text-xs rounded-full">
                            IA Adaptativa
                        </span>
                    )}
                </div>

                <div className="flex items-center gap-2 text-xs text-gray-500">
                    <Clock className="w-3 h-3" />
                    {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
            </div>

            {/* Contextual indicator */}
            {Object.keys(contextualFactors).length > 0 && (
                <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="flex items-center gap-2 text-sm text-blue-800">
                        <Target className="w-4 h-4" />
                        <span className="font-medium">
                            {contextualFactors.timeOfDay === 'morning' && '☀️ Bom dia'}
                            {contextualFactors.timeOfDay === 'afternoon' && '🌛 Boa tarde'}
                            {contextualFactors.timeOfDay === 'evening' && '🌆 Boa noite'}
                            {contextualFactors.timeOfDay === 'night' && '🌙 Boa noite'}
                        </span>
                        <span className="text-blue-600">
                            {urgencyLevel === 'high' && '• Prioridade alta detectada'}
                            {contextualFactors.isWeekend && '• Final de semana'}
                            {!contextualFactors.isWorkHours && '• Fora do horário comercial'}
                        </span>
                    </div>
                </div>
            )}

            {/* Urgent suggestions alert */}
            {suggestions.some(s => s.urgent) && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                    <div className="flex items-center gap-2 text-sm text-red-800">
                        <AlertCircle className="w-4 h-4" />
                        <span className="font-medium">Situação Urgente Detectada</span>
                    </div>
                </div>
            )}

            {/* Categorized suggestions */}
            <div className="space-y-4">
                {categories.map(renderCategory)}
            </div>

            {/* Show more button */}
            {categories.length > 2 && (
                <div className="mt-4 text-center">
                    <button
                        onClick={() => setIsActive(!isActive)}
                        className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1 mx-auto"
                    >
                        {isActive ? (
                            <>
                                Mostrar menos
                                <ChevronRight className="w-4 h-4 transform rotate-90" />
                            </>
                        ) : (
                            <>
                                Mostrar todas categorias
                                <ChevronRight className="w-4 h-4" />
                            </>
                        )}
                    </button>
                </div>
            )}
        </div>
    );
};

export default SmartSuggestions;