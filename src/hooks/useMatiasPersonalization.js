/**
 * 🎯 Advanced Personalization Engine Hook
 *
 * Provides comprehensive user personalization including:
 * - User preference learning
 * - Customized response style adaptation
 * - Personalized quick actions
 * - Workshop-specific terminology
 * - Behavioral pattern analysis
 * - Adaptive interface customization
 */

import { useState, useEffect, useCallback, useRef } from 'react';

export const useMatiasPersonalization = (config = {}) => {
    // Configuration
    const {
        enableLearning = true,
        adaptationSpeed = 'medium', // slow, medium, fast
        maxHistorySize = 1000,
        personalityTraits = ['professional', 'helpful', 'friendly'],
        responseStyles = ['formal', 'casual', 'technical'],
        enableWorkshopCustomization = true,
        enableAdaptiveUI = true,
        persistentStorage = true
    } = config;

    // Core state
    const [userProfile, setUserProfile] = useState({});
    const [preferences, setPreferences] = useState({});
    const [behavioralPatterns, setBehavioralPatterns] = useState({});
    const [personalizationLevel, setPersonalizationLevel] = useState(0); // 0-100
    const [responseStyle, setResponseStyle] = useState('professional');
    const [customTerminology, setCustomTerminology] = useState({});
    const [quickActions, setQuickActions] = useState([]);
    const [interfaceSettings, setInterfaceSettings] = useState({});

    // Learning state
    const [isLearning, setIsLearning] = useState(false);
    const [learningProgress, setLearningProgress] = useState({});
    const [adaptationHistory, setAdaptationHistory] = useState([]);

    // Workshop-specific state
    const [workshopProfile, setWorkshopProfile] = useState({});
    const [specializedVocabulary, setSpecializedVocabulary] = useState({});
    const [workflowPreferences, setWorkflowPreferences] = useState({});

    // Refs
    const interactionHistoryRef = useRef([]);
    const preferenceWeightsRef = useRef({});
    const lastAdaptationRef = useRef(null);

    // Initialize personalization system
    useEffect(() => {
        initializePersonalizationSystem();
        return () => cleanupPersonalizationSystem();
    }, []);

    const initializePersonalizationSystem = async () => {
        try {
            await loadUserProfile();
            await loadPreferences();
            await loadBehavioralPatterns();
            await loadWorkshopProfile();
            await calculatePersonalizationLevel();
            await initializeMachineLearning();
        } catch (error) {
            console.error('Error initializing personalization system:', error);
        }
    };

    const loadUserProfile = async () => {
        try {
            if (persistentStorage) {
                const saved = localStorage.getItem('matias_user_profile');
                if (saved) {
                    setUserProfile(JSON.parse(saved));
                } else {
                    // Create default profile
                    const defaultProfile = createDefaultProfile();
                    setUserProfile(defaultProfile);
                    await saveUserProfile(defaultProfile);
                }
            }
        } catch (error) {
            console.warn('Error loading user profile:', error);
            setUserProfile(createDefaultProfile());
        }
    };

    const createDefaultProfile = () => ({
        id: generateId(),
        name: 'Usuário',
        role: 'customer',
        experience: 'intermediate', // beginner, intermediate, expert
        communicationStyle: 'balanced', // direct, indirect, balanced
        technicalLevel: 'medium', // low, medium, high
        preferredLanguage: 'pt-BR',
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        interactionFrequency: 'regular', // occasional, regular, frequent
        patienceLevel: 'medium', // low, medium, high
        detailPreference: 'balanced', // concise, balanced, detailed
        personalityMatch: 'professional',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    });

    const loadPreferences = async () => {
        try {
            if (persistentStorage) {
                const saved = localStorage.getItem('matias_preferences');
                if (saved) {
                    setPreferences(JSON.parse(saved));
                } else {
                    const defaultPreferences = createDefaultPreferences();
                    setPreferences(defaultPreferences);
                    await savePreferences(defaultPreferences);
                }
            }
        } catch (error) {
            console.warn('Error loading preferences:', error);
            setPreferences(createDefaultPreferences());
        }
    };

    const createDefaultPreferences = () => ({
        theme: 'auto', // light, dark, auto
        language: 'pt-BR',
        notifications: {
            enabled: true,
            sound: true,
            vibration: false,
            desktop: true
        },
        privacy: {
            dataCollection: true,
            personalization: true,
            analytics: false
        },
        accessibility: {
            fontSize: 'medium',
            highContrast: false,
            screenReader: false,
            reducedMotion: false
        },
        conversation: {
            autoSave: true,
            contextRetention: 7,
            responseStyle: 'professional',
            quickResponseMode: false,
            emojiUsage: 'moderate'
        },
        ui: {
            sidebarCollapsed: false,
            compactMode: false,
            showAdvancedOptions: false,
            animationsEnabled: true
        }
    });

    const loadBehavioralPatterns = async () => {
        try {
            if (persistentStorage) {
                const saved = localStorage.getItem('matias_behavioral_patterns');
                if (saved) {
                    setBehavioralPatterns(JSON.parse(saved));
                }
            }
        } catch (error) {
            console.warn('Error loading behavioral patterns:', error);
        }
    };

    const loadWorkshopProfile = async () => {
        try {
            if (persistentStorage && enableWorkshopCustomization) {
                const saved = localStorage.getItem('matias_workshop_profile');
                if (saved) {
                    setWorkshopProfile(JSON.parse(saved));
                } else {
                    // Try to detect workshop context
                    const detected = await detectWorkshopContext();
                    setWorkshopProfile(detected);
                    await saveWorkshopProfile(detected);
                }
            }
        } catch (error) {
            console.warn('Error loading workshop profile:', error);
        }
    };

    const detectWorkshopContext = async () => {
        // Basic workshop detection logic
        const detected = {
            type: 'general', // general, authorized_service, quick_service, specialty
            specialties: [],
            vehicleBrands: [],
            commonServices: [],
            location: null,
            businessHours: {
                opening: '08:00',
                closing: '18:00',
                saturday: false,
                sunday: false
            },
            pricing: {
                labor: 'standard', // low, standard, premium
                parts: 'oem' // oem, aftermarket, mixed
            }
        };

        // Analyze current URL/domain for workshop context
        const domain = window.location.hostname;
        if (domain.includes('oficina') || domain.includes('workshop')) {
            detected.type = 'authorized_service';
        }

        return detected;
    };

    const calculatePersonalizationLevel = async () => {
        const factors = {
            profileCompleteness: Object.keys(userProfile).length / 10,
            preferenceCount: Object.keys(preferences).length / 5,
            interactionHistory: interactionHistoryRef.current.length / 100,
            adaptationHistory: adaptationHistory.length / 50,
            behavioralPatterns: Object.keys(behavioralPatterns).length / 20
        };

        const level = Object.values(factors).reduce((sum, value) => sum + value, 0) / Object.keys(factors).length * 100;
        setPersonalizationLevel(Math.min(100, Math.round(level)));
    };

    const initializeMachineLearning = async () => {
        if (!enableLearning) return;

        try {
            // Initialize ML models for personalization
            await loadMLModels();
            setIsLearning(true);
        } catch (error) {
            console.warn('ML initialization failed:', error);
            setIsLearning(false);
        }
    };

    const loadMLModels = async () => {
        // Mock ML model loading - in production, this would load actual ML models
        return new Promise(resolve => {
            setTimeout(() => {
                resolve({
                    responseStyle: { version: '1.0', accuracy: 0.85 },
                    userIntent: { version: '1.0', accuracy: 0.78 },
                    personalityMatch: { version: '1.0', accuracy: 0.82 }
                });
            }, 100);
        });
    };

    // Personalization functions
    const recordInteraction = useCallback(async (interaction) => {
        const enhancedInteraction = {
            ...interaction,
            timestamp: new Date().toISOString(),
            sessionId: getSessionId(),
            personalizationContext: {
                currentLevel: personalizationLevel,
                userProfile: userProfile,
                preferences: preferences
            }
        };

        // Add to history
        interactionHistoryRef.current.push(enhancedInteraction);

        // Limit history size
        if (interactionHistoryRef.current.length > maxHistorySize) {
            interactionHistoryRef.current = interactionHistoryRef.current.slice(-maxHistorySize);
        }

        // Trigger learning if enabled
        if (enableLearning && !isLearning) {
            await triggerLearning(enhancedInteraction);
        }

        // Update behavioral patterns
        await updateBehavioralPatterns(enhancedInteraction);

        // Adapt response style if needed
        await adaptResponseStyle(enhancedInteraction);

    }, [personalizationLevel, userProfile, preferences, enableLearning, isLearning]);

    const triggerLearning = async (interaction) => {
        setIsLearning(true);

        try {
            // Simulate ML training process
            await new Promise(resolve => setTimeout(resolve, 100));

            const adaptations = await generateAdaptations(interaction);

            if (adaptations.length > 0) {
                await applyAdaptations(adaptations);
            }

        } catch (error) {
            console.warn('Learning error:', error);
        } finally {
            setIsLearning(false);
        }
    };

    const generateAdaptations = async (interaction) => {
        const adaptations = [];

        // Analyze interaction for adaptation opportunities
        if (interaction.type === 'user_message') {
            // Communication style adaptation
            const styleAnalysis = analyzeCommunicationStyle(interaction.content);
            if (styleAnalysis.confidence > 0.7) {
                adaptations.push({
                    type: 'communication_style',
                    value: styleAnalysis.style,
                    confidence: styleAnalysis.confidence,
                    reason: 'Detected preference for ' + styleAnalysis.style + ' communication'
                });
            }

            // Response length adaptation
            const lengthPreference = analyzeResponseLengthPreference(interaction);
            if (lengthPreference.confidence > 0.6) {
                adaptations.push({
                    type: 'response_length',
                    value: lengthPreference.length,
                    confidence: lengthPreference.confidence,
                    reason: 'User prefers ' + lengthPreference.length + ' responses'
                });
            }

            // Technical level adaptation
            const technicalLevel = analyzeTechnicalLevel(interaction.content);
            if (technicalLevel.confidence > 0.7) {
                adaptations.push({
                    type: 'technical_level',
                    value: technicalLevel.level,
                    confidence: technicalLevel.confidence,
                    reason: 'Technical level detected: ' + technicalLevel.level
                });
            }
        }

        return adaptations;
    };

    const analyzeCommunicationStyle = (content) => {
        const formal = content.includes('por favor') || content.includes('gostaria');
        const casual = content.includes('oi') || content.includes('mano') || content.includes('cara');
        const emojis = content.match(/[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]/gu);
        const hasEmojis = emojis && emojis.length > 0;

        let style = 'professional';
        let confidence = 0.5;

        if (formal && !casual && !hasEmojis) {
            style = 'formal';
            confidence = 0.8;
        } else if (casual || hasEmojis) {
            style = 'casual';
            confidence = 0.9;
        }

        return { style, confidence };
    };

    const analyzeResponseLengthPreference = (content) => {
        const wordCount = content.split(' ').length;
        const avgSentenceLength = wordCount / (content.split(/[.!?]+/).length || 1);

        let length = 'medium';
        let confidence = 0.5;

        if (wordCount < 5 && avgSentenceLength < 8) {
            length = 'short';
            confidence = 0.7;
        } else if (wordCount > 20 || avgSentenceLength > 15) {
            length = 'detailed';
            confidence = 0.7;
        }

        return { length, confidence };
    };

    const analyzeTechnicalLevel = (content) => {
        const technicalTerms = ['motor', 'cilindro', 'embreagem', 'transmissão', 'suspensão', 'freio'];
        const basicTerms = ['carro', 'não funciona', 'barulho', 'problema'];
        const contentLower = content.toLowerCase();

        const technicalCount = technicalTerms.filter(term => contentLower.includes(term)).length;
        const basicCount = basicTerms.filter(term => contentLower.includes(term)).length;

        let level = 'medium';
        let confidence = 0.5;

        if (technicalCount > basicCount) {
            level = 'high';
            confidence = 0.8;
        } else if (basicCount > 0 && technicalCount === 0) {
            level = 'low';
            confidence = 0.9;
        }

        return { level, confidence };
    };

    const applyAdaptations = async (adaptations) => {
        try {
            for (const adaptation of adaptations) {
                await applyAdaptation(adaptation);
            }

            // Record adaptation in history
            setAdaptationHistory(prev => [...prev, {
                adaptations,
                timestamp: new Date().toISOString(),
                personalizationLevel: personalizationLevel + 5
            }]);

            // Update personalization level
            await calculatePersonalizationLevel();

        } catch (error) {
            console.error('Error applying adaptations:', error);
        }
    };

    const applyAdaptation = async (adaptation) => {
        switch (adaptation.type) {
            case 'communication_style':
                setResponseStyle(adaptation.value);
                await updateProfile('communicationStyle', adaptation.value);
                break;

            case 'response_length':
                await updatePreference('conversation.detailPreference', adaptation.value);
                break;

            case 'technical_level':
                await updateProfile('technicalLevel', adaptation.value);
                break;

            case 'quick_action':
                await addQuickAction(adaptation.value);
                break;

            case 'terminology':
                await updateCustomTerminology(adaptation.key, adaptation.value);
                break;

            default:
                console.warn('Unknown adaptation type:', adaptation.type);
        }
    };

    const updateBehavioralPatterns = async (interaction) => {
        const patterns = { ...behavioralPatterns };

        // Update interaction frequency
        const hour = new Date().getHours();
        patterns.interactionTime = patterns.interactionTime || {};
        patterns.interactionTime[hour] = (patterns.interactionTime[hour] || 0) + 1;

        // Update message length pattern
        if (interaction.content) {
            const length = interaction.content.split(' ').length;
            patterns.messageLength = patterns.messageLength || { short: 0, medium: 0, long: 0 };
            if (length < 5) patterns.messageLength.short++;
            else if (length < 15) patterns.messageLength.medium++;
            else patterns.messageLength.long++;
        }

        // Update topic preferences
        const topics = extractTopics(interaction.content || '');
        patterns.topics = patterns.topics || {};
        topics.forEach(topic => {
            patterns.topics[topic] = (patterns.topics[topic] || 0) + 1;
        });

        setBehavioralPatterns(patterns);

        if (persistentStorage) {
            await saveBehavioralPatterns(patterns);
        }
    };

    const extractTopics = (content) => {
        const topicKeywords = {
            'agendamento': ['agendar', 'marcar', 'horário', 'dia'],
            'diagnóstico': ['problema', 'barulho', 'funciona', 'revisão'],
            'peças': ['peça', 'pecas', 'componente', 'reparo'],
            'preço': ['quanto', 'custa', 'preço', 'valor', 'orçamento'],
            'emergência': ['urgente', 'emergência', 'não liga', 'parou'],
            'manutenção': ['manutenção', 'preventiva', 'revisão', 'troca'],
            'garantia': ['garantia', 'cobertura', 'seguro', 'assistência']
        };

        const topics = [];
        const contentLower = content.toLowerCase();

        Object.keys(topicKeywords).forEach(topic => {
            if (topicKeywords[topic].some(keyword => contentLower.includes(keyword))) {
                topics.push(topic);
            }
        });

        return topics;
    };

    const adaptResponseStyle = async (interaction) => {
        if (!enableLearning || !interaction.response) return;

        // Analyze user's response to Matias's message
        const sentiment = analyzeSentiment(interaction.response);

        if (sentiment.satisfaction < 0.3) {
            // User not satisfied, try different style
            const alternativeStyles = responseStyles.filter(style => style !== responseStyle);
            const newStyle = alternativeStyles[Math.floor(Math.random() * alternativeStyles.length)];

            await applyAdaptation({
                type: 'communication_style',
                value: newStyle,
                confidence: 0.6,
                reason: 'Low satisfaction detected, trying alternative style'
            });
        }
    };

    const analyzeSentiment = (content) => {
        const positiveWords = ['bom', 'ótimo', 'excelente', 'ajudou', 'perfeito', 'obrigado'];
        const negativeWords = ['ruim', 'péssimo', 'não ajudou', 'errado', 'chateado', 'frustrado'];

        const contentLower = content.toLowerCase();
        const positiveCount = positiveWords.filter(word => contentLower.includes(word)).length;
        const negativeCount = negativeWords.filter(word => contentLower.includes(word)).length;

        const totalWords = positiveCount + negativeCount;
        if (totalWords === 0) return { satisfaction: 0.5, confidence: 0 };

        const satisfaction = positiveCount / totalWords;
        return {
            satisfaction,
            confidence: Math.min(totalWords / 3, 1),
            positiveCount,
            negativeCount
        };
    };

    // Personalization functions
    const personalizeResponse = useCallback((response, context = {}) => {
        if (!enableLearning || personalizationLevel < 10) {
            return response; // No personalization yet
        }

        let personalizedResponse = { ...response };

        // Apply response style personalization
        personalizedResponse.content = adaptContentStyle(response.content, responseStyle);

        // Apply technical level personalization
        personalizedResponse.content = adaptTechnicalLevel(
            personalizedResponse.content,
            userProfile.technicalLevel || 'medium'
        );

        // Apply workshop terminology
        personalizedResponse.content = applyWorkshopTerminology(
            personalizedResponse.content,
            specializedVocabulary
        );

        // Add personalized suggestions
        personalizedResponse.suggestions = generatePersonalizedSuggestions(context);

        // Adjust detail level
        if (preferences.conversation?.detailPreference) {
            personalizedResponse.content = adjustDetailLevel(
                personalizedResponse.content,
                preferences.conversation.detailPreference
            );
        }

        return personalizedResponse;
    }, [enableLearning, personalizationLevel, responseStyle, userProfile, preferences, specializedVocabulary]);

    const adaptContentStyle = (content, style) => {
        switch (style) {
            case 'formal':
                return content
                    .replace(/Oi/g, 'Olá')
                    .replace(/mano/g, 'caro cliente')
                    .replace(/cara/g, 'caro cliente')
                    .replace(/\b(vou|vai)\b/g, 'irei');

            case 'casual':
                return content
                    .replace(/Olá/g, 'Oi')
                    .replace(/Prezado/g, '')
                    .replace(/Atenciosamente/g, 'Abraços');

            default:
                return content; // professional/balanced
        }
    };

    const adaptTechnicalLevel = (content, level) => {
        switch (level) {
            case 'low':
                return content
                    .replace(/transmissão automática/g, 'caixa automática')
                    .replace(/sistema de injeção eletrônica/g, 'injeção eletrônica')
                    .replace(/embreagem hidráulica/g, 'embreagem');

            case 'high':
                return content
                    .replace(/motor/g, 'conjunto motor-propulsor')
                    .replace(/freios/g, 'sistema de frenagem')
                    .replace(/suspensão/g, 'conjunto de suspensão');

            default:
                return content;
        }
    };

    const applyWorkshopTerminology = (content, vocabulary) => {
        let adaptedContent = content;

        Object.keys(vocabulary).forEach(term => {
            const replacement = vocabulary[term];
            adaptedContent = adaptedContent.replace(
                new RegExp(term, 'gi'),
                replacement
            );
        });

        return adaptedContent;
    };

    const generatePersonalizedSuggestions = (context) => {
        const suggestions = [];

        // Based on behavioral patterns
        if (behavioralPatterns.topics) {
            const topTopics = Object.entries(behavioralPatterns.topics)
                .sort(([,a], [,b]) => b - a)
                .slice(0, 3)
                .map(([topic]) => topic);

            topTopics.forEach(topic => {
                suggestions.push({
                    text: `Continuar sobre ${topic}`,
                    action: `continue_${topic}`,
                    personalized: true,
                    reason: 'Baseado no seu histórico'
                });
            });
        }

        // Based on time patterns
        if (behavioralPatterns.interactionTime) {
            const preferredHour = Object.entries(behavioralPatterns.interactionTime)
                .sort(([,a], [,b]) => b - a)[0];

            if (preferredHour) {
                const [hour] = preferredHour;
                const currentHour = new Date().getHours();

                if (Math.abs(hour - currentHour) <= 2) {
                    suggestions.push({
                        text: 'Agendar para seu horário preferido',
                        action: 'preferred_time',
                        personalized: true,
                        reason: 'Horário preferido detectado'
                    });
                }
            }
        }

        return suggestions;
    };

    const adjustDetailLevel = (content, level) => {
        // Implementation for adjusting content detail level
        return content; // Placeholder
    };

    // Profile management functions
    const updateProfile = async (key, value) => {
        const updatedProfile = {
            ...userProfile,
            [key]: value,
            updatedAt: new Date().toISOString()
        };

        setUserProfile(updatedProfile);
        await saveUserProfile(updatedProfile);
    };

    const updatePreference = async (key, value) => {
        const keys = key.split('.');
        const updatedPreferences = { ...preferences };

        let current = updatedPreferences;
        for (let i = 0; i < keys.length - 1; i++) {
            current[keys[i]] = current[keys[i]] || {};
            current = current[keys[i]];
        }

        current[keys[keys.length - 1]] = value;

        setPreferences(updatedPreferences);
        await savePreferences(updatedPreferences);
    };

    const updateCustomTerminology = async (key, value) => {
        const updated = {
            ...customTerminology,
            [key]: value
        };

        setCustomTerminology(updated);

        if (persistentStorage) {
            localStorage.setItem('matias_custom_terminology', JSON.stringify(updated));
        }
    };

    const addQuickAction = async (action) => {
        const updated = [...quickActions, action];
        setQuickActions(updated);

        if (persistentStorage) {
            localStorage.setItem('matias_quick_actions', JSON.stringify(updated));
        }
    };

    // Storage functions
    const saveUserProfile = async (profile) => {
        if (persistentStorage) {
            try {
                localStorage.setItem('matias_user_profile', JSON.stringify(profile));
            } catch (error) {
                console.warn('Error saving user profile:', error);
            }
        }
    };

    const savePreferences = async (prefs) => {
        if (persistentStorage) {
            try {
                localStorage.setItem('matias_preferences', JSON.stringify(prefs));
            } catch (error) {
                console.warn('Error saving preferences:', error);
            }
        }
    };

    const saveBehavioralPatterns = async (patterns) => {
        if (persistentStorage) {
            try {
                localStorage.setItem('matias_behavioral_patterns', JSON.stringify(patterns));
            } catch (error) {
                console.warn('Error saving behavioral patterns:', error);
            }
        }
    };

    const saveWorkshopProfile = async (profile) => {
        if (persistentStorage) {
            try {
                localStorage.setItem('matias_workshop_profile', JSON.stringify(profile));
            } catch (error) {
                console.warn('Error saving workshop profile:', error);
            }
        }
    };

    // Utility functions
    const generateId = () => {
        return `pers_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    };

    const getSessionId = () => {
        let sessionId = sessionStorage.getItem('matias_session_id');
        if (!sessionId) {
            sessionId = generateId();
            sessionStorage.setItem('matias_session_id', sessionId);
        }
        return sessionId;
    };

    const getPersonalizationStats = () => {
        return {
            level: personalizationLevel,
            interactionCount: interactionHistoryRef.current.length,
            adaptationsCount: adaptationHistory.length,
            learningEnabled: enableLearning,
            isLearning: isLearning,
            responseStyle,
            profileCompleteness: Object.keys(userProfile).length,
            preferenceCount: Object.keys(preferences).length
        };
    };

    const resetPersonalization = async () => {
        try {
            // Clear all stored data
            localStorage.removeItem('matias_user_profile');
            localStorage.removeItem('matias_preferences');
            localStorage.removeItem('matias_behavioral_patterns');
            localStorage.removeItem('matias_workshop_profile');
            localStorage.removeItem('matias_custom_terminology');
            localStorage.removeItem('matias_quick_actions');

            // Reset state
            setUserProfile(createDefaultProfile());
            setPreferences(createDefaultPreferences());
            setBehavioralPatterns({});
            setWorkshopProfile({});
            setCustomTerminology({});
            setQuickActions([]);
            setAdaptationHistory([]);
            interactionHistoryRef.current = [];

            // Reset personalization level
            await calculatePersonalizationLevel();

        } catch (error) {
            console.error('Error resetting personalization:', error);
        }
    };

    const cleanupPersonalizationSystem = () => {
        // Cleanup if needed
    };

    // Public API
    return {
        // State
        userProfile,
        preferences,
        behavioralPatterns,
        personalizationLevel,
        responseStyle,
        customTerminology,
        quickActions,
        isLearning,

        // Core functions
        recordInteraction,
        personalizeResponse,

        // Management functions
        updateProfile,
        updatePreference,
        updateCustomTerminology,
        addQuickAction,

        // Analytics
        getPersonalizationStats,

        // Utilities
        resetPersonalization,
        generatePersonalizedSuggestions,

        // Advanced features
        adaptContentStyle,
        adaptTechnicalLevel,
        applyWorkshopTerminology
    };
};

export default useMatiasPersonalization;