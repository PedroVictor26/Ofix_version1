/**
 * 🤖 MATIAS Enhanced AI Assistant
 *
 * Enhanced version with modern UX/UI, rich content support, advanced voice interface
 * Implements the comprehensive design system and accessibility improvements
 */

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
    MessageSquare, X, Send, User, Wrench, Search,
    Clock, AlertCircle, CheckCircle, Calendar,
    Package, Car, FileText, DollarSign, Settings,
    Minimize2, Maximize2, Volume2, VolumeX, Copy,
    Phone, Mail, MapPin, TrendingUp, Mic, MicOff,
    Play, Pause, RotateCcw, Users, Camera, Image,
    Paperclip, Smile, Zap, Shield, Wifi, WifiOff,
    Moon, Sun, Globe, Download, Upload, ChevronDown,
    ChevronUp, MoreVertical, Loader2, ThumbsUp,
    ThumbsDown, Share2, Bookmark, History, Sparkles
} from 'lucide-react';

// Import design system styles
import '../../styles/matias-design-system.css';
import '../../styles/matias-animations.css';

const MatiasAssistantEnhanced = ({
    position = 'bottom-right',
    theme = 'auto',
    language = 'pt-BR',
    onAction = () => {},
    customConfig = {},
    isOpen: isOpenProp = false,
    isFullscreen = false
}) => {
    // Core state management
    const [isOpen, setIsOpen] = useState(isOpenProp || isFullscreen);
    
    // Auto-open if fullscreen mode
    useEffect(() => {
        if (isFullscreen) {
            setIsOpen(true);
        }
    }, [isFullscreen]);
    const [isMinimized, setIsMinimized] = useState(false);
    const [isExpanded, setIsExpanded] = useState(false);
    const [messages, setMessages] = useState([]);
    const [inputMessage, setInputMessage] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const [isOnline, setIsOnline] = useState(navigator.onLine);
    const [soundEnabled, setSoundEnabled] = useState(true);
    const [voiceEnabled, setVoiceEnabled] = useState(true);
    const [currentTheme, setCurrentTheme] = useState(theme);
    const [showQuickActions, setShowQuickActions] = useState(true);
    const [showRichContent, setShowRichContent] = useState(true);

    // Voice and speech state
    const [isListening, setIsListening] = useState(false);
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [voiceLevel, setVoiceLevel] = useState(0);
    const [recognition, setRecognition] = useState(null);
    const [synthesis, setSynthesis] = useState(null);

    // Conversation state
    const [conversationFlow, setConversationFlow] = useState(null);
    const [userContext, setUserContext] = useState({});
    const [suggestions, setSuggestions] = useState([]);
    const [messageHistory, setMessageHistory] = useState([]);

    // Rich content state
    const [attachments, setAttachments] = useState([]);
    const [isDragging, setIsDragging] = useState(false);
    const [cameraStream, setCameraStream] = useState(null);
    const [showCamera, setShowCamera] = useState(false);

    // Accessibility state
    const [screenReaderEnabled, setScreenReaderEnabled] = useState(false);
    const [highContrastMode, setHighContrastMode] = useState(false);
    const [fontSize, setFontSize] = useState('medium');

    // Refs
    const messagesEndRef = useRef(null);
    const inputRef = useRef(null);
    const fileInputRef = useRef(null);
    const cameraRef = useRef(null);
    const voiceAnalyzerRef = useRef(null);
    const dropZoneRef = useRef(null);

    // Enhanced conversation flows with rich content
    const conversationFlows = useMemo(() => ({
        'agendar_servico': {
            step: 1,
            totalSteps: 6,
            title: 'Agendamento Inteligente',
            icon: Calendar,
            color: 'primary',
            questions: [
                {
                    step: 1,
                    question: '🚗 **Vamos agendar seu serviço!** Primeiro, preciso saber:\n\n**Qual é a placa do seu veículo?**\n\n*Você pode digitar ou usar o scanner de câmera 📷*',
                    field: 'placa',
                    validation: /^[A-Z]{3}[-]?[0-9]{4}$|^[A-Z]{3}[0-9][A-Z][0-9]{2}$/,
                    errorMsg: 'Por favor, digite uma placa válida (ABC-1234 ou ABC1D23)',
                    type: 'text',
                    placeholder: 'Ex: ABC-1234',
                    richContent: {
                        type: 'camera',
                        hint: 'Ou clique na câmera para escanear a placa'
                    }
                },
                {
                    step: 2,
                    question: '🔧 **Que tipo de serviço você precisa?**\n\n• Manutenção preventiva\n• Reparo específico\n• Diagnóstico completo\n• Emergência\n\n*Descreva o problema ou selecione uma opção*',
                    field: 'tipoServico',
                    type: 'select',
                    options: [
                        'Manutenção Preventiva',
                        'Reparo Específico',
                        'Diagnóstico Completo',
                        'Emergência 24h',
                        'Revisão Programada',
                        'Outro'
                    ],
                    richContent: {
                        type: 'cards',
                        options: [
                            { icon: Wrench, title: 'Manutenção', desc: 'Preventiva e corretiva' },
                            { icon: Search, title: 'Diagnóstico', desc: 'Identificação de problemas' },
                            { icon: AlertCircle, title: 'Emergência', desc: 'Atendimento imediato' }
                        ]
                    }
                },
                {
                    step: 3,
                    question: '📅 **Quando você prefere trazer o veículo?**\n\n• Hoje (primeira vaga)\n• Amanhã\n• Próxima semana\n• Data específica\n\n*Selecione a opção mais conveniente*',
                    field: 'dataPreferencia',
                    type: 'datetime',
                    richContent: {
                        type: 'calendar',
                        minDate: new Date(),
                        availableSlots: [
                            { date: '2024-01-15', slots: ['08:00', '10:00', '14:00', '16:00'] },
                            { date: '2024-01-16', slots: ['09:00', '11:00', '15:00', '17:00'] }
                        ]
                    }
                },
                {
                    step: 4,
                    question: '👤 **Seus dados para contato:**\n\n**Nome completo:**\n**Telefone:**\n**Email:**\n\n*Para confirmarmos o agendamento*',
                    field: 'contato',
                    type: 'form',
                    fields: [
                        { name: 'nome', type: 'text', required: true, placeholder: 'Seu nome completo' },
                        { name: 'telefone', type: 'tel', required: true, placeholder: '(11) 99999-9999' },
                        { name: 'email', type: 'email', required: false, placeholder: 'seu@email.com' }
                    ]
                },
                {
                    step: 5,
                    question: '💰 **Informações adicionais:**\n\n**Descreva os sintomas ou problemas:**\n\n*Quanto mais detalhes, melhor nosso atendimento*\n\nVocê pode anexar fotos ou vídeos 📎',
                    field: 'observacoes',
                    type: 'textarea',
                    placeholder: 'Descreva os sintomas, ruídos, ou qualquer informação relevante...',
                    richContent: {
                        type: 'attachments',
                        allowedTypes: ['image/*', 'video/*', 'audio/*'],
                        maxSize: '10MB',
                        hint: 'Anexe fotos do problema, vídeos do ruído, etc.'
                    }
                },
                {
                    step: 6,
                    question: '✅ **Confirmação do Agendamento**\n\n**Resumo:**\n🚗 **Veículo:** {placa}\n🔧 **Serviço:** {tipoServico}\n📅 **Data:** {dataPreferencia}\n👤 **Contato:** {contato.nome}\n📞 **Telefone:** {contato.telefone}\n\n**Confirmar agendamento?**',
                    field: 'confirmacao',
                    type: 'confirmation',
                    isComplete: true,
                    richContent: {
                        type: 'summary',
                        actions: [
                            { label: 'Confirmar Agendamento', action: 'confirm', style: 'primary' },
                            { label: 'Alterar Dados', action: 'edit', style: 'secondary' },
                            { label: 'Cancelar', action: 'cancel', style: 'ghost' }
                        ]
                    }
                }
            ]
        },
        'diagnostico_veicular': {
            step: 1,
            totalSteps: 4,
            title: 'Diagnóstico Veicular Inteligente',
            icon: Search,
            color: 'secondary',
            questions: [
                {
                    step: 1,
                    question: '🔍 **Diagnóstico Inteligente**\n\n**Qual sintoma seu veículo está apresentando?**\n\n• Ruídos estranhos\n• Luzes de painel acesas\n• Desempenho reduzido\n• Problemas na partida\n\n*Selecione ou descreva o problema*',
                    field: 'sintoma',
                    type: 'symptom_selector',
                    richContent: {
                        type: 'interactive_diagram',
                        vehicleType: 'car',
                        selectableAreas: ['motor', 'freios', 'transmissao', 'suspensao']
                    }
                },
                {
                    step: 2,
                    question: '📊 **Informações técnicas:**\n\n**Marca/Modelo:**\n**Ano:**\n**Km atual:**\n\n*Isso ajuda no diagnóstico preciso*',
                    field: 'dadosVeiculo',
                    type: 'vehicle_form',
                    richContent: {
                        type: 'auto_complete',
                        fields: ['marca', 'modelo', 'ano', 'quilometragem']
                    }
                },
                {
                    step: 3,
                    question: '🔧 **Análise do problema:**\n\n**Quando ocorre o sintoma?**\n\n• Ao ligar o motor\n• Em movimento\n• Ao frear\n• Em qualquer situação\n\n*Fotos ou vídeos ajudam muito! 📷*',
                    field: 'condicoes',
                    type: 'conditional_select',
                    richContent: {
                        type: 'media_upload',
                        instructions: 'Tire fotos do painel, vídeos do ruído, etc.'
                    }
                },
                {
                    step: 4,
                    question: '💡 **Diagnóstico Preliminar:**\n\n**Com base nos sintomas:** {sintoma}\n\n**Possíveis causas:**\n1. [Análise em andamento...]\n2. [Verificação de componentes]\n3. [Testes recomendados]\n\n**Recomendação:** {recomendacao}',
                    field: 'resultado',
                    type: 'diagnostic_result',
                    isComplete: true,
                    richContent: {
                        type: 'diagnostic_report',
                        severity: 'medium',
                        estimatedCost: 'R$ 200-500',
                        estimatedTime: '2-4 horas',
                        recommendations: [
                            'Verificar nível de óleo',
                            'Inspecionar filtros',
                            'Testar sensores'
                        ]
                    }
                }
            ]
        },
        'consulta_os': {
            step: 1,
            totalSteps: 3,
            title: 'Consulta de Ordem de Serviço',
            icon: FileText,
            color: 'info',
            questions: [
                {
                    step: 1,
                    question: '📋 **Consulta de OS**\n\n**Como prefere consultar?**\n\n• Por número da OS\n• Por placa do veículo\n• Por seu telefone\n• Por nome\n\n*Selecione a forma de consulta*',
                    field: 'consultaTipo',
                    type: 'search_method',
                    richContent: {
                        type: 'search_options',
                        methods: [
                            { icon: FileText, label: 'Número OS', placeholder: 'OS-12345' },
                            { icon: Car, label: 'Placa', placeholder: 'ABC-1234' },
                            { icon: Phone, label: 'Telefone', placeholder: '(11) 99999-9999' },
                            { icon: User, label: 'Nome', placeholder: 'Seu nome' }
                        ]
                    }
                },
                {
                    step: 2,
                    question: '🔍 **Digite o valor para consulta:**\n\n**{consultaTipo}:**\n\n*Informe o valor para buscar*',
                    field: 'consultaValor',
                    type: 'search_input',
                    validation: /.{3,}/,
                    placeholder: 'Digite aqui...'
                },
                {
                    step: 3,
                    question: '📋 **Resultado da Consulta:**\n\n**OS #12345** - {consultaValor}\n\n**Status:** 🟡 **Em Andamento**\n**Veículo:** Honda Civic 2020\n**Cliente:** {cliente}\n**Entrada:** {dataEntrada}\n**Previsão:** {dataPrevisao}\n\n**Serviços:**\n{servicos}\n\n**Valor Total:** R$ {valor}',
                    field: 'resultado',
                    type: 'os_result',
                    isComplete: true,
                    richContent: {
                        type: 'os_details',
                        status: 'progress',
                        progress: 65,
                        services: [
                            { name: 'Troca de óleo', status: 'completed' },
                            { name: 'Filtro de ar', status: 'in_progress' },
                            { name: 'Balancemento', status: 'pending' }
                        ],
                        actions: [
                            { label: 'Ver Detalhes', action: 'view_details' },
                            { label: 'Aprovar Serviço', action: 'approve' },
                            { label: 'Falar com Atendente', action: 'contact' }
                        ]
                    }
                }
            ]
        }
    }), [language]);

    // Initialize voice recognition and synthesis
    useEffect(() => {
        // Initialize speech recognition
        if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
            const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
            const recognitionInstance = new SpeechRecognition();

            recognitionInstance.continuous = false;
            recognitionInstance.interimResults = true;
            recognitionInstance.lang = language;

            recognitionInstance.onresult = (event) => {
                const transcript = event.results[0][0].transcript;
                setInputMessage(transcript);

                // Voice level animation
                if (event.results[0].isFinal) {
                    setVoiceLevel(0);
                    setIsListening(false);
                }
            };

            recognitionInstance.onerror = (event) => {
                console.error('Speech recognition error:', event.error);
                setIsListening(false);
                setVoiceLevel(0);
            };

            recognitionInstance.onend = () => {
                setIsListening(false);
                setVoiceLevel(0);
            };

            setRecognition(recognitionInstance);
        }

        // Initialize speech synthesis
        if ('speechSynthesis' in window) {
            setSynthesis(window.speechSynthesis);
        }

        // Initialize voice level analyzer
        initializeVoiceAnalyzer();

        return () => {
            if (recognition) {
                recognition.stop();
            }
            if (synthesis) {
                synthesis.cancel();
            }
            if (cameraStream) {
                cameraStream.getTracks().forEach(track => track.stop());
            }
        };
    }, [language]);

    // Online/offline detection
    useEffect(() => {
        const handleOnline = () => setIsOnline(true);
        const handleOffline = () => setIsOnline(false);

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, []);

    // Auto-scroll to bottom
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    // Load saved conversation and preferences
    useEffect(() => {
        loadUserPreferences();
        loadConversationHistory();
        initializeMessages();
    }, []);

    const loadUserPreferences = () => {
        try {
            const saved = localStorage.getItem('matias_preferences');
            if (saved) {
                const prefs = JSON.parse(saved);
                setSoundEnabled(prefs.soundEnabled ?? true);
                setVoiceEnabled(prefs.voiceEnabled ?? true);
                setFontSize(prefs.fontSize ?? 'medium');
                setScreenReaderEnabled(prefs.screenReaderEnabled ?? false);
                setHighContrastMode(prefs.highContrastMode ?? false);
            }
        } catch (error) {
            console.warn('Error loading preferences:', error);
        }
    };

    const loadConversationHistory = () => {
        try {
            const saved = localStorage.getItem('matias_conversation_history');
            if (saved) {
                setMessageHistory(JSON.parse(saved));
            }
        } catch (error) {
            console.warn('Error loading conversation history:', error);
        }
    };

    const initializeMessages = () => {
        const welcomeMessage = {
            id: Date.now(),
            type: 'assistant',
            content: getWelcomeMessage(),
            timestamp: new Date(),
            suggestions: getInitialSuggestions(),
            richContent: {
                type: 'welcome',
                features: [
                    { icon: Mic, title: 'Comando por Voz', description: 'Fale comigo naturalmente' },
                    { icon: Camera, title: 'Diagnóstico Visual', description: 'Tire fotos do problema' },
                    { icon: Calendar, title: 'Agendamento Inteligente', description: 'Marque horários automaticamente' },
                    { icon: Shield, title: 'Suporte 24/7', description: 'Estou sempre disponível' }
                ]
            }
        };

        setMessages([welcomeMessage]);
    };

    const getWelcomeMessage = () => {
        const messages = {
            'pt-BR': `🔧 **Olá! Eu sou o Matias, seu assistente AI superpotenciado da Ofix!**\n\nEstou aqui para transformar sua experiência com:\n\n🎯 **Comunicação Natural** - Fale comigo como falaria com seu mecânico de confiança\n🎤 **Comandos de Voz** - "Agendar revisão para amanhã" ou "Consultar OS 12345"\n📷 **Diagnóstico Visual** - Tire fotos que eu analiso os problemas\n🧠 **Inteligência Contextual** - Lembro suas preferências e histórico\n🌐 **Multi-idioma** - PT-BR, EN, ES disponíveis\n♿ **Acessibilidade Total** - Apto para todos os usuários\n\n**Vamos começar?** Escolha uma opção ou simplesmente fale comigo!`,
            'en': `🔧 **Hello! I'm Matias, your superpowered AI assistant from Ofix!**\n\nI'm here to transform your experience with:\n\n🎯 **Natural Communication** - Talk to me like you would with your trusted mechanic\n🎤 **Voice Commands** - "Schedule maintenance for tomorrow" or "Check OS 12345"\n📷 **Visual Diagnosis** - Take photos and I'll analyze the problems\n🧠 **Contextual Intelligence** - I remember your preferences and history\n🌐 **Multi-language** - EN, PT-BR, ES available\n♿ **Full Accessibility** - Ready for all users\n\n**Ready to start?** Choose an option or just talk to me!`
        };

        return messages[language] || messages['pt-BR'];
    };

    const getInitialSuggestions = () => [
        { icon: Mic, text: '🎤 Falar com Matias', action: 'iniciar_voz', primary: true },
        { icon: Calendar, text: '📅 Agendar Serviço', action: 'agendar_servico', primary: true },
        { icon: Camera, text: '📷 Tirar Foto do Problema', action: 'tirar_foto', primary: true },
        { icon: Search, text: '🔍 Consultar OS', action: 'consultar_os' },
        { icon: AlertCircle, text: '🆘 Emergência', action: 'emergencia_24h' },
        { icon: Settings, text: '⚙️ Configurações', action: 'configuracoes' }
    ];

    const initializeVoiceAnalyzer = () => {
        if ('webkitAudioContext' in window || 'AudioContext' in window) {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            const audioContext = new AudioContext();
            const analyser = audioContext.createAnalyser();
            analyser.fftSize = 256;
            voiceAnalyzerRef.current = analyser;
        }
    };

    const startListening = async () => {
        if (recognition && !isListening && voiceEnabled) {
            try {
                // Request microphone permission
                const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

                // Set up voice level monitoring
                if (voiceAnalyzerRef.current) {
                    const source = voiceAnalyzerRef.current.context.createMediaStreamSource(stream);
                    source.connect(voiceAnalyzerRef.current);
                    monitorVoiceLevel();
                }

                setIsListening(true);
                recognition.start();
                playNotificationSound('start_listening');
            } catch (error) {
                console.error('Error accessing microphone:', error);
                handleVoiceError();
            }
        }
    };

    const stopListening = () => {
        if (recognition && isListening) {
            recognition.stop();
            setIsListening(false);
            setVoiceLevel(0);
            playNotificationSound('stop_listening');
        }
    };

    const monitorVoiceLevel = () => {
        if (!isListening || !voiceAnalyzerRef.current) return;

        const dataArray = new Uint8Array(voiceAnalyzerRef.current.frequencyBinCount);
        voiceAnalyzerRef.current.getByteFrequencyData(dataArray);

        const average = dataArray.reduce((a, b) => a + b) / dataArray.length;
        setVoiceLevel(Math.min(100, (average / 128) * 100));

        if (isListening) {
            requestAnimationFrame(monitorVoiceLevel);
        }
    };

    const handleVoiceError = () => {
        const errorMessage = {
            id: Date.now(),
            type: 'assistant',
            content: '❌ **Erro no reconhecimento de voz**\n\nVerifique se o microfone está permitido no navegador.\n\nVocê pode continuar digitando ou tentar novamente.',
            timestamp: new Date(),
            isError: true
        };

        setMessages(prev => [...prev, errorMessage]);
    };

    const speakMessage = useCallback((text) => {
        if (!synthesis || !soundEnabled || !voiceEnabled) return;

        // Cancel any ongoing speech
        synthesis.cancel();

        const cleanText = text.replace(/\*\*/g, '').replace(/[🔧🚗📅📋📱📞💰✅🔄⏳🟡]/g, '');

        const utterance = new SpeechSynthesisUtterance(cleanText);
        utterance.lang = language;
        utterance.rate = 0.9;
        utterance.pitch = 1.0;
        utterance.volume = 0.8;

        utterance.onstart = () => setIsSpeaking(true);
        utterance.onend = () => setIsSpeaking(false);
        utterance.onerror = () => setIsSpeaking(false);

        synthesis.speak(utterance);
    }, [synthesis, soundEnabled, voiceEnabled, language]);

    const playNotificationSound = (type = 'message') => {
        if (!soundEnabled) return;

        try {
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();

            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);

            const frequencies = {
                'message': [800, 600],
                'start_listening': [400, 600],
                'stop_listening': [600, 400],
                'error': [300, 200],
                'success': [800, 1000]
            };

            const [freq1, freq2] = frequencies[type] || frequencies.message;

            oscillator.frequency.setValueAtTime(freq1, audioContext.currentTime);
            oscillator.frequency.exponentialRampToValueAtTime(freq2, audioContext.currentTime + 0.1);

            oscillator.type = 'sine';

            gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);

            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 0.1);
        } catch (error) {
            console.log('Audio not supported:', error);
        }
    };

    const processConversationFlow = useCallback((userInput, action) => {
        if (!conversationFlow && action && conversationFlows[action]) {
            const flow = { ...conversationFlows[action] };
            setConversationFlow(flow);
            setUserContext({});

            const firstQuestion = flow.questions[0];
            return {
                content: firstQuestion.question,
                suggestions: [],
                richContent: firstQuestion.richContent
            };
        }

        if (conversationFlow) {
            const currentStep = conversationFlow.step;
            const currentQuestion = conversationFlow.questions[currentStep - 1];

            if (currentQuestion.validation && !currentQuestion.validation.test(userInput)) {
                return {
                    content: `❌ ${currentQuestion.errorMsg}\n\n${currentQuestion.question}`,
                    suggestions: [],
                    richContent: currentQuestion.richContent
                };
            }

            const newContext = { ...userContext, [currentQuestion.field]: userInput };
            setUserContext(newContext);

            if (currentQuestion.isComplete) {
                setConversationFlow(null);
                const finalMessage = interpolateMessage(currentQuestion.question, newContext);

                return {
                    content: finalMessage,
                    suggestions: [
                        { icon: Calendar, text: 'Novo Agendamento', action: 'agendar_servico', primary: true },
                        { icon: Search, text: 'Consultar OS', action: 'consultar_os' },
                        { icon: Camera, text: 'Diagnóstico', action: 'diagnostico_veicular' },
                        { icon: Phone, text: 'Falar com Atendente', action: 'falar_atendente' }
                    ],
                    richContent: currentQuestion.richContent
                };
            }

            const nextStep = currentStep + 1;
            const nextQuestion = conversationFlow.questions[nextStep - 1];

            setConversationFlow({ ...conversationFlow, step: nextStep });

            return {
                content: interpolateMessage(nextQuestion.question, newContext),
                suggestions: [],
                richContent: nextQuestion.richContent
            };
        }

        return null;
    }, [conversationFlow, conversationFlows]);

    const interpolateMessage = (message, context) => {
        let result = message;
        Object.keys(context).forEach(key => {
            const value = typeof context[key] === 'object' ? JSON.stringify(context[key]) : context[key];
            result = result.replace(new RegExp(`{${key}}`, 'g'), value);
        });
        return result;
    };

    const getSmartResponse = useCallback((userInput) => {
        const input = userInput.toLowerCase();

        // Enhanced intent detection
        if (input.includes('agenda') || input.includes('marcar') || input.includes('horário')) {
            return processConversationFlow(userInput, 'agendar_servico');
        }

        if (input.includes('foto') || input.includes('camera') || input.includes('tirar')) {
            return {
                content: '📷 **Modo Câmera Ativado**\n\nPosso analisar fotos para:\n\n• Identificar problemas visuais\n• Ler informações do painel\n• Reconhecer peças e componentes\n• Diagnosticar danos\n\n**Clique na câmera para começar!**',
                suggestions: [
                    { icon: Camera, text: '📷 Abrir Câmera', action: 'abrir_camera', primary: true },
                    { icon: Image, text: '🖼️ Enviar Imagem', action: 'enviar_imagem' },
                    { icon: FileText, text: '📋 Fazer Upload', action: 'fazer_upload' }
                ],
                richContent: {
                    type: 'camera_invite',
                    instructions: 'Posso analisar: painel do carro, motor, pneus, danos externos'
                }
            };
        }

        if (input.includes('emergência') || input.includes('urgente') || input.includes('socorro')) {
            return {
                content: '🚨 **CENTRAL DE EMERGÊNCIA 24H**\n\n**Status:** Atendimento imediato disponível\n\n🚛 **Guincho:** Disponível na região (ETA: 15min)\n🔧 **Mecânico Mobile:** Disponível\n📍 **Localização:** Detectando...\n\n**Tipo de emergência:**',
                suggestions: [
                    { icon: AlertCircle, text: '🚗 Carro não liga', action: 'emergencia_nao_liga', primary: true },
                    { icon: MapPin, text: '🚛 Solicitar Guincho', action: 'solicitar_guincho' },
                    { icon: Phone, text: '📞 Ligar Agora', action: 'ligar_emergencia' }
                ],
                richContent: {
                    type: 'emergency',
                    location: {
                        request: true,
                        autoDetect: true
                    },
                    quickActions: [
                        'Acidente',
                        'Pane seca',
                        'Bateria descarregada',
                        'Pneu furado'
                    ]
                }
            };
        }

        if (input.includes('configurar') || input.includes('ajustar') || input.includes('preferência')) {
            return {
                content: '⚙️ **Configurações do Assistente**\n\n**Personalize sua experiência:**\n\n🎵 **Som e Voz** - Ativar/desativar notificações\n🎨 **Aparência** - Tema, cores, tamanho da fonte\n♿ **Acessibilidade** - Leitor de tela, alto contraste\n💾 **Dados** - Histórico, cache, exportação\n\n**O que você gostaria de configurar?**',
                suggestions: [
                    { icon: Volume2, text: '🔊 Áudio e Voz', action: 'config_audio' },
                    { icon: Moon, text: '🌙 Tema Visual', action: 'config_tema' },
                    { icon: Settings, text: '⚙️ Acessibilidade', action: 'config_accessibility' },
                    { icon: Download, text: '💾 Exportar Dados', action: 'exportar_dados' }
                ],
                richContent: {
                    type: 'settings_panel',
                    sections: [
                        { title: 'Áudio', icon: Volume2, settings: ['som', 'voz', 'notificacoes'] },
                        { title: 'Visual', icon: Moon, settings: ['tema', 'fonte', 'cores'] },
                        { title: 'Acessibilidade', icon: Settings, settings: ['leitor_tela', 'contraste', 'navegacao'] }
                    ]
                }
            };
        }

        return {
            content: `💭 **Analisando:** "${userInput}"\n\n🎯 **Posso ajudar com:**\n\n📅 **Agendamentos Inteligentes**\n- "Quero agendar uma revisão"\n- "Marcar horário para sexta-feira"\n\n🔍 **Consultas Rápidas**\n- "Status da OS 12345"\n- "Consultar por placa ABC-1234"\n\n📷 **Diagnóstico Visual**\n- "Tirar foto do problema"\n- "Analisar painel do carro"\n\n🆘 **Emergências 24h**\n- "Preciso de guincho"\n- "Meu carro não liga"\n\n⚙️ **Configurações**\n- "Configurar assistente"\n- "Ajustar preferências"\n\n🎤 **Comandos de Voz**\n- Clique no microfone para começar\n- Fale naturalmente comigo`,
            suggestions: getInitialSuggestions(),
            richContent: {
                type: 'help_menu',
                categories: [
                    { icon: Calendar, title: 'Agendamentos', description: 'Marque e gerencie serviços' },
                    { icon: Search, title: 'Consultas', description: 'Acompanhe OS e histórico' },
                    { icon: Camera, title: 'Diagnóstico', description: 'Análise visual de problemas' },
                    { icon: Settings, title: 'Configurações', description: 'Personalize sua experiência' }
                ]
            }
        };
    }, [processConversationFlow]);

    const handleSendMessage = async (messageText = null, action = null, attachments = null) => {
        const text = messageText || inputMessage.trim();
        if (!text && !action && !attachments?.length) return;

        // Add user message
        const userMessage = {
            id: Date.now(),
            type: 'user',
            content: text,
            timestamp: new Date(),
            attachments: attachments || [],
            metadata: {
                isVoice: !messageText, // If no text, it was a voice message
                hasAttachments: !!(attachments && attachments.length)
            }
        };

        setMessages(prev => [...prev, userMessage]);
        setInputMessage('');
        setIsTyping(true);

        // Clear input suggestions
        setSuggestions([]);

        // Process response with enhanced delay for realistic interaction
        setTimeout(() => {
            let response;

            if (conversationFlow || action) {
                response = processConversationFlow(text, action);
            }

            if (!response) {
                response = getSmartResponse(text);
            }

            const botMessage = {
                id: Date.now() + 1,
                type: 'assistant',
                content: response.content,
                timestamp: new Date(),
                suggestions: response.suggestions || [],
                richContent: response.richContent || null,
                metadata: {
                    context: userContext,
                    flow: conversationFlow,
                    isOffline: !isOnline
                }
            };

            setMessages(prev => [...prev, botMessage]);
            setIsTyping(false);
            playNotificationSound('message');

            // Save to history
            saveToHistory(userMessage, botMessage);

            // Speak response if enabled
            if (voiceEnabled && soundEnabled) {
                setTimeout(() => {
                    speakMessage(response.content);
                }, 500);
            }

        }, 1000 + Math.random() * 1000);
    };

    const saveToHistory = (userMessage, botMessage) => {
        try {
            const newEntry = {
                timestamp: new Date().toISOString(),
                messages: [userMessage, botMessage],
                context: userContext
            };

            const updatedHistory = [...messageHistory, newEntry];
            setMessageHistory(updatedHistory.slice(-100)); // Keep last 100 conversations
            localStorage.setItem('matias_conversation_history', JSON.stringify(updatedHistory.slice(-100)));
        } catch (error) {
            console.warn('Error saving to history:', error);
        }
    };

    const handleSuggestionClick = (suggestion) => {
        if (suggestion.action === 'abrir_camera') {
            handleOpenCamera();
        } else if (suggestion.action === 'fazer_upload') {
            fileInputRef.current?.click();
        } else {
            handleSendMessage(suggestion.text, suggestion.action);
        }
    };

    const handleOpenCamera = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: 'environment' }
            });
            setCameraStream(stream);
            setShowCamera(true);
        } catch (error) {
            console.error('Error accessing camera:', error);
            handleCameraError();
        }
    };

    const handleCameraError = () => {
        const errorMessage = {
            id: Date.now(),
            type: 'assistant',
            content: '❌ **Erro ao acessar câmera**\n\nVerifique se:\n\n• A câmera está permitida no navegador\n• Outro aplicativo não está usando a câmera\n• Você está usando HTTPS\n\nVocê também pode enviar imagens existentes.',
            timestamp: new Date(),
            isError: true,
            suggestions: [
                { icon: Image, text: '📷 Enviar Imagem', action: 'enviar_imagem' },
                { icon: FileText, text: '📋 Fazer Upload', action: 'fazer_upload' }
            ]
        };

        setMessages(prev => [...prev, errorMessage]);
    };

    const handleCapturePhoto = () => {
        if (!cameraRef.current || !cameraStream) return;

        const canvas = document.createElement('canvas');
        canvas.width = cameraRef.current.videoWidth;
        canvas.height = cameraRef.current.videoHeight;
        const context = canvas.getContext('2d');
        context.drawImage(cameraRef.current, 0, 0);

        canvas.toBlob((blob) => {
            const file = new File([blob], `photo_${Date.now()}.jpg`, { type: 'image/jpeg' });
            handleFileSelect([file]);
            handleCloseCamera();
        });
    };

    const handleCloseCamera = () => {
        if (cameraStream) {
            cameraStream.getTracks().forEach(track => track.stop());
            setCameraStream(null);
        }
        setShowCamera(false);
    };

    const handleFileSelect = (files) => {
        const validFiles = Array.from(files).filter(file => {
            const isValidType = file.type.startsWith('image/') ||
                              file.type.startsWith('video/') ||
                              file.type.startsWith('audio/');
            const isValidSize = file.size <= 10 * 1024 * 1024; // 10MB

            return isValidType && isValidSize;
        });

        if (validFiles.length > 0) {
            setAttachments(prev => [...prev, ...validFiles]);

            // Process files for analysis
            processAttachments(validFiles);
        }
    };

    const processAttachments = async (files) => {
        for (const file of files) {
            if (file.type.startsWith('image/')) {
                const analysis = await analyzeImage(file);
                const analysisMessage = {
                    id: Date.now() + Math.random(),
                    type: 'assistant',
                    content: `📷 **Análise da Imagem:** ${file.name}\n\n${analysis}`,
                    timestamp: new Date(),
                    richContent: {
                        type: 'image_analysis',
                        image: URL.createObjectURL(file),
                        analysis: analysis
                    }
                };

                setMessages(prev => [...prev, analysisMessage]);
            }
        }
    };

    const analyzeImage = async (file) => {
        // Simulate AI image analysis
        return `🔍 **Detectado:**\n\n• Painel do veículo visível\n• Luz de check engine acendeu\n• Nível de combustível baixo\n• Hodômetro: 45.230 km\n\n**Recomendações:**\n\n⚠️ Prioridade: **Média**\n• Verificar código de erro\n• Realizar diagnóstico computadorizado\n• Possível sensor de oxigênio com defeito\n\n**Próximos passos:**\n1. Trazer veículo para diagnóstico\n2. Orçamento estimado: R$ 150-300\n3. Tempo estimado: 1-2 horas`;
    };

    const handleDragOver = (e) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = () => {
        setIsDragging(false);
    };

    const handleDrop = (e) => {
        e.preventDefault();
        setIsDragging(false);

        const files = e.dataTransfer.files;
        if (files.length > 0) {
            handleFileSelect(files);
        }
    };

    const copyToClipboard = async (text) => {
        try {
            await navigator.clipboard.writeText(text);

            const successMessage = {
                id: Date.now(),
                type: 'assistant',
                content: '✅ **Mensagem copiada!**',
                timestamp: new Date(),
                isSystem: true
            };

            setMessages(prev => [...prev, successMessage]);
            setTimeout(() => {
                setMessages(prev => prev.filter(msg => msg.id !== successMessage.id));
            }, 2000);
        } catch (error) {
            console.error('Error copying to clipboard:', error);
        }
    };

    const toggleChat = () => {
        setIsOpen(!isOpen);
        if (!isOpen) {
            playNotificationSound('message');
            setTimeout(() => {
                inputRef.current?.focus();
            }, 300);
        }
    };

    const renderMessage = (message) => {
        const isUser = message.type === 'user';

        return (
            <div
                key={message.id}
                className={`matias-animate-message-slide flex ${isUser ? 'justify-end' : 'justify-start'} mb-4`}
            >
                <div className={`max-w-[80%] ${isUser ? 'order-2' : 'order-1'}`}>
                    {/* Avatar */}
                    {!isUser && (
                        <div className="flex items-center gap-2 mb-2">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 flex items-center justify-center matias-animate-bounce-in">
                                <Wrench className="w-4 h-4 text-white" />
                            </div>
                            <div>
                                <span className="text-sm font-semibold text-gray-900">Matias</span>
                                {message.metadata?.isOffline && (
                                    <span className="ml-2 text-xs bg-gray-200 px-2 py-1 rounded">Offline</span>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Message bubble */}
                    <div className={`
                        matias-message ${isUser ? 'matias-message-user' : 'matias-message-bot'}
                        p-4 shadow-sm
                        ${message.isError ? 'border-red-300 bg-red-50' : ''}
                    `}>
                        {/* Content */}
                        <div className="text-sm whitespace-pre-line leading-relaxed">
                            {message.content}
                        </div>

                        {/* Rich content rendering */}
                        {message.richContent && (
                            <div className="mt-3">
                                {renderRichContent(message.richContent)}
                            </div>
                        )}

                        {/* Attachments */}
                        {message.attachments && message.attachments.length > 0 && (
                            <div className="mt-3 space-y-2">
                                {message.attachments.map((attachment, index) => (
                                    <div key={index} className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
                                        {attachment.type.startsWith('image/') ? (
                                            <img
                                                src={URL.createObjectURL(attachment)}
                                                alt={attachment.name}
                                                className="w-12 h-12 object-cover rounded"
                                            />
                                        ) : (
                                            <FileText className="w-5 h-5 text-gray-500" />
                                        )}
                                        <span className="text-xs text-gray-600 truncate">{attachment.name}</span>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Message footer */}
                        <div className={`text-xs mt-2 flex items-center gap-2 ${
                            isUser ? 'text-blue-100' : 'text-gray-500'
                        }`}>
                            <Clock className="w-3 h-3" />
                            {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            {message.metadata?.isVoice && (
                                <Mic className="w-3 h-3" title="Mensagem de voz" />
                            )}
                            {message.metadata?.hasAttachments && (
                                <Paperclip className="w-3 h-3" title="Com anexos" />
                            )}
                            {!isUser && (
                                <button
                                    onClick={() => copyToClipboard(message.content)}
                                    className="ml-2 hover:text-blue-600 transition-colors"
                                    title="Copiar mensagem"
                                >
                                    <Copy className="w-3 h-3" />
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Suggestions */}
                    {message.suggestions && message.suggestions.length > 0 && (
                        <div className="mt-3 matias-stagger">
                            {message.suggestions.map((suggestion, index) => (
                                <button
                                    key={index}
                                    onClick={() => handleSuggestionClick(suggestion)}
                                    className={`
                                        matias-btn matias-animate-suggestion-slide
                                        ${suggestion.primary
                                            ? 'matias-btn-primary'
                                            : 'matias-btn-ghost'
                                        }
                                        w-full justify-start mb-2
                                        text-sm
                                    `}
                                    style={{ animationDelay: `${index * 50}ms` }}
                                >
                                    <suggestion.icon className="w-4 h-4" />
                                    <span>{suggestion.text}</span>
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* User avatar */}
                {isUser && (
                    <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center order-2 ml-3">
                        <User className="w-4 h-4 text-gray-600" />
                    </div>
                )}
            </div>
        );
    };

    const renderRichContent = (richContent) => {
        switch (richContent.type) {
            case 'camera_invite':
                return (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                        <div className="flex items-center gap-2 mb-2">
                            <Camera className="w-4 h-4 text-blue-600" />
                            <span className="text-sm font-medium text-blue-900">Modo Câmera</span>
                        </div>
                        <p className="text-xs text-blue-700">{richContent.instructions}</p>
                    </div>
                );

            case 'image_analysis':
                return (
                    <div className="bg-gray-50 rounded-lg p-3">
                        <div className="flex gap-3">
                            <img
                                src={richContent.image}
                                alt="Análise"
                                className="w-24 h-24 object-cover rounded"
                            />
                            <div className="flex-1">
                                <div className="text-xs text-gray-600 whitespace-pre-line">
                                    {richContent.analysis}
                                </div>
                            </div>
                        </div>
                    </div>
                );

            case 'welcome':
                return (
                    <div className="grid grid-cols-2 gap-2 mt-3">
                        {richContent.features.map((feature, index) => (
                            <div
                                key={index}
                                className="bg-gradient-to-br from-blue-50 to-purple-50 border border-blue-200 rounded-lg p-2"
                            >
                                <feature.icon className="w-4 h-4 text-blue-600 mb-1" />
                                <div className="text-xs font-medium text-gray-900">{feature.title}</div>
                                <div className="text-xs text-gray-600">{feature.description}</div>
                            </div>
                        ))}
                    </div>
                );

            case 'emergency':
                return (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                        <div className="flex items-center gap-2 mb-2">
                            <AlertCircle className="w-4 h-4 text-red-600" />
                            <span className="text-sm font-medium text-red-900">Emergência Ativa</span>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                            {richContent.quickActions?.map((action, index) => (
                                <button
                                    key={index}
                                    className="text-xs bg-red-100 hover:bg-red-200 text-red-800 px-2 py-1 rounded transition-colors"
                                >
                                    {action}
                                </button>
                            ))}
                        </div>
                    </div>
                );

            case 'settings_panel':
                return (
                    <div className="bg-gray-50 rounded-lg p-3">
                        {richContent.sections.map((section, index) => (
                            <div key={index} className="flex items-center justify-between py-2 border-b border-gray-200 last:border-0">
                                <div className="flex items-center gap-2">
                                    <section.icon className="w-4 h-4 text-gray-600" />
                                    <span className="text-sm font-medium">{section.title}</span>
                                </div>
                                <ChevronDown className="w-4 h-4 text-gray-400" />
                            </div>
                        ))}
                    </div>
                );

            default:
                return null;
        }
    };

    const renderTypingIndicator = () => (
        <div className="flex justify-start mb-4">
            <div className="flex items-center space-x-3">
                <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 flex items-center justify-center">
                    <Wrench className="w-4 h-4 text-white" />
                </div>
                <div className="bg-white border border-gray-200 rounded-2xl p-3 shadow-sm">
                    <div className="matias-typing-indicator">
                        <div className="matias-typing-dot"></div>
                        <div className="matias-typing-dot"></div>
                        <div className="matias-typing-dot"></div>
                    </div>
                </div>
            </div>
        </div>
    );

    const renderVoiceWaveform = () => (
        <div className="flex items-center gap-1 px-2">
            {[1, 2, 3, 4, 5].map((bar) => (
                <div
                    key={bar}
                    className="w-1 bg-blue-500 rounded-full transition-all duration-100"
                    style={{
                        height: `${isListening ? Math.random() * 20 + 5 : 3}px`,
                        opacity: isListening ? 1 : 0.3
                    }}
                />
            ))}
        </div>
    );

    const getPositionClasses = () => {
        const positions = {
            'bottom-right': 'bottom-6 right-6',
            'bottom-left': 'bottom-6 left-6',
            'top-right': 'top-6 right-6',
            'top-left': 'top-6 left-6'
        };
        return positions[position] || positions['bottom-right'];
    };

    if (!isOpen) {
        return (
            <button
                onClick={toggleChat}
                className={`
                    fixed ${getPositionClasses()} z-50
                    w-16 h-16 rounded-full shadow-2xl
                    bg-gradient-to-br from-blue-600 via-blue-700 to-purple-800
                    hover:from-blue-700 hover:via-blue-800 hover:to-purple-900
                    transition-all duration-500 ease-out
                    transform hover:scale-110 active:scale-95
                    border-4 border-white/20 backdrop-blur-sm
                    matias-animate-button-float
                `}
                style={{
                    boxShadow: '0 20px 40px rgba(37, 99, 235, 0.3), 0 0 30px rgba(37, 99, 235, 0.2)'
                }}
            >
                <div className="relative flex items-center justify-center w-full h-full">
                    {/* Main icon */}
                    <Wrench className="w-7 h-7 text-white transform rotate-12" />

                    {/* Status indicator */}
                    <div className={`absolute -top-1 -right-1 w-4 h-4 rounded-full border-2 border-white ${
                        isOnline ? 'bg-green-400' : 'bg-red-400'
                    } matias-animate-status-online`} />

                    {/* Voice indicator */}
                    {isListening && (
                        <div className="absolute inset-0 border-2 border-blue-400 rounded-full animate-pulse">
                            <div className="absolute inset-1 border-2 border-blue-300 rounded-full animate-ping"></div>
                        </div>
                    )}
                </div>

                {/* Badge */}
                <div className="absolute -top-2 -left-2 bg-gradient-to-r from-orange-400 to-orange-500
                    text-white text-xs font-bold px-2 py-1 rounded-full shadow-lg matias-animate-bounce-in">
                    🤖
                </div>

                {/* Pulse waves */}
                <div className="absolute inset-0 rounded-full opacity-30">
                    <div className="absolute inset-0 rounded-full bg-blue-400 animate-ping"></div>
                    <div className="absolute inset-2 rounded-full bg-blue-300 animate-ping" style={{animationDelay: '0.5s'}}></div>
                </div>
            </button>
        );
    }

    return (
        <div className={`${isFullscreen ? 'w-full h-full' : `fixed ${getPositionClasses()} w-full max-w-md`} z-40`}>
            <div className={`
                bg-white ${isFullscreen ? 'rounded-none' : 'rounded-2xl'} ${isFullscreen ? 'shadow-none' : 'shadow-2xl'} border border-gray-200 overflow-hidden
                ${isMinimized ? 'h-16' : isFullscreen ? 'h-full' : 'h-[600px]'}
                ${isExpanded || isFullscreen ? 'max-w-full' : ''}
                transition-all duration-300 ${isFullscreen ? '' : 'matias-animate-chat-open'}
                ${highContrastMode ? 'border-4 border-black' : ''}
            `}>
                {/* Header */}
                <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-4 text-white">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="relative">
                                <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
                                    <Wrench className="w-5 h-5" />
                                </div>
                                <div className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-white ${
                                    isOnline ? 'bg-green-400' : 'bg-red-400'
                                }`} />
                            </div>
                            <div>
                                <h3 className="font-semibold flex items-center gap-2">
                                    Matias Enhanced
                                    <span className="text-xs font-normal bg-white/20 px-2 py-0.5 rounded-full">AI v3.0</span>
                                    {!isOnline && (
                                        <span className="text-xs bg-red-500/80 px-2 py-0.5 rounded-full">Offline</span>
                                    )}
                                </h3>
                                <p className="text-xs text-blue-100 flex items-center gap-2">
                                    {isTyping ? '✍️ Digitando...' : isListening ? '👂 Ouvindo...' : '🎯 Assistente Inteligente'}
                                    {isSpeaking && <Volume2 className="w-3 h-3 animate-pulse" />}
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center gap-1">
                            <button
                                onClick={() => setSoundEnabled(!soundEnabled)}
                                className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                                title={soundEnabled ? 'Desativar som' : 'Ativar som'}
                            >
                                {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
                            </button>
                            <button
                                onClick={() => setIsExpanded(!isExpanded)}
                                className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                                title={isExpanded ? 'Minimizar' : 'Expandir'}
                            >
                                <Maximize2 className="w-4 h-4" />
                            </button>
                            <button
                                onClick={() => setIsMinimized(!isMinimized)}
                                className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                                title={isMinimized ? 'Maximizar' : 'Minimizar'}
                            >
                                {isMinimized ? <Maximize2 className="w-4 h-4" /> : <Minimize2 className="w-4 h-4" />}
                            </button>
                            <button
                                onClick={toggleChat}
                                className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                                title="Fechar"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                    </div>

                    {/* Progress bar */}
                    {conversationFlow && (
                        <div className="mt-3">
                            <div className="flex items-center justify-between text-xs text-blue-100 mb-1">
                                <span>{conversationFlow.title}</span>
                                <span>{conversationFlow.step}/{conversationFlow.totalSteps}</span>
                            </div>
                            <div className="w-full bg-white/20 rounded-full h-1">
                                <div
                                    className="bg-orange-400 h-1 rounded-full transition-all duration-300 matias-animate-progress"
                                    style={{
                                        width: `${(conversationFlow.step / conversationFlow.totalSteps) * 100}%`,
                                        '--progress-width': `${(conversationFlow.step / conversationFlow.totalSteps) * 100}%`
                                    }}
                                />
                            </div>
                        </div>
                    )}
                </div>

                {!isMinimized && (
                    <>
                        {/* Camera view */}
                        {showCamera && (
                            <div className="absolute inset-0 z-50 bg-black">
                                <video
                                    ref={cameraRef}
                                    autoPlay
                                    playsInline
                                    className="w-full h-full object-cover"
                                />
                                <div className="absolute top-4 left-4 right-4 flex justify-between">
                                    <button
                                        onClick={handleCloseCamera}
                                        className="p-2 bg-red-500 text-white rounded-full"
                                    >
                                        <X className="w-4 h-4" />
                                    </button>
                                    <button
                                        onClick={handleCapturePhoto}
                                        className="p-2 bg-blue-500 text-white rounded-full"
                                    >
                                        <Camera className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* Messages area */}
                        <div
                            className="flex-1 overflow-y-auto p-4 space-y-4 h-[400px] bg-gradient-to-b from-gray-50 to-white"
                            onDragOver={handleDragOver}
                            onDragLeave={handleDragLeave}
                            onDrop={handleDrop}
                            ref={dropZoneRef}
                        >
                            {isDragging && (
                                <div className="fixed inset-0 z-50 bg-blue-50/90 border-4 border-dashed border-blue-400 flex items-center justify-center">
                                    <div className="text-center">
                                        <Upload className="w-12 h-12 text-blue-600 mx-auto mb-2" />
                                        <p className="text-lg font-medium text-blue-900">Solte para enviar arquivos</p>
                                        <p className="text-sm text-blue-700">Imagens, vídeos ou áudios</p>
                                    </div>
                                </div>
                            )}

                            {messages.map(renderMessage)}

                            {isTyping && renderTypingIndicator()}

                            <div ref={messagesEndRef} />
                        </div>

                        {/* Input area */}
                        <div className="p-4 border-t border-gray-200 bg-white">
                            {/* Attachments preview */}
                            {attachments.length > 0 && (
                                <div className="mb-3 flex flex-wrap gap-2">
                                    {attachments.map((file, index) => (
                                        <div key={index} className="relative bg-gray-100 rounded-lg p-2 flex items-center gap-2">
                                            {file.type.startsWith('image/') ? (
                                                <img
                                                    src={URL.createObjectURL(file)}
                                                    alt={file.name}
                                                    className="w-8 h-8 object-cover rounded"
                                                />
                                            ) : (
                                                <FileText className="w-4 h-4 text-gray-500" />
                                            )}
                                            <span className="text-xs text-gray-600 truncate max-w-32">{file.name}</span>
                                            <button
                                                onClick={() => setAttachments(prev => prev.filter((_, i) => i !== index))}
                                                className="text-red-500 hover:text-red-700"
                                            >
                                                <X className="w-3 h-3" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}

                            <div className="flex items-center gap-2">
                                <div className="flex-1 relative">
                                    <input
                                        ref={inputRef}
                                        type="text"
                                        value={inputMessage}
                                        onChange={(e) => setInputMessage(e.target.value)}
                                        onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && handleSendMessage()}
                                        placeholder={isListening ? "Ouvindo..." : "Digite sua mensagem ou use o microfone..."}
                                        className="matias-input pr-32"
                                        disabled={isTyping || isListening}
                                        aria-label="Mensagem para o assistente"
                                    />

                                    {/* Voice waveform */}
                                    {isListening && (
                                        <div className="absolute left-2 top-1/2 transform -translate-y-1/2">
                                            {renderVoiceWaveform()}
                                        </div>
                                    )}

                                    {/* Action buttons */}
                                    <div className="absolute right-1 top-1/2 transform -translate-y-1/2 flex items-center gap-1">
                                        <button
                                            onClick={() => fileInputRef.current?.click()}
                                            className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
                                            title="Enviar arquivo"
                                        >
                                            <Paperclip className="w-4 h-4 text-gray-500" />
                                        </button>

                                        <button
                                            onClick={handleOpenCamera}
                                            className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
                                            title="Tirar foto"
                                        >
                                            <Camera className="w-4 h-4 text-gray-500" />
                                        </button>

                                        <button
                                            onClick={isListening ? stopListening : startListening}
                                            disabled={!voiceEnabled}
                                            className={`
                                                p-1.5 rounded-lg transition-all duration-200
                                                ${isListening
                                                    ? 'bg-red-500 text-white animate-pulse'
                                                    : 'hover:bg-gray-100 text-gray-500'
                                                }
                                            `}
                                            title={isListening ? 'Parar gravação' : 'Falar com Matias'}
                                        >
                                            {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                                        </button>
                                    </div>
                                </div>

                                <button
                                    onClick={() => handleSendMessage()}
                                    disabled={!inputMessage.trim() && attachments.length === 0}
                                    className="matias-btn matias-btn-primary w-10 h-10 p-0"
                                    title="Enviar mensagem"
                                >
                                    <Send className="w-4 h-4" />
                                </button>
                            </div>

                            {/* Quick actions */}
                            {showQuickActions && (
                                <div className="flex flex-wrap gap-2 mt-3">
                                    <div className="text-xs text-gray-500 mb-1 w-full">💡 Ações rápidas:</div>
                                    {[
                                        { icon: Calendar, text: 'Agendar', action: 'agendar_servico' },
                                        { icon: Search, text: 'Consultar OS', action: 'consultar_os' },
                                        { icon: Camera, text: 'Câmera', action: 'abrir_camera' },
                                        { icon: Settings, text: 'Config', action: 'configuracoes' }
                                    ].map((action, index) => (
                                        <button
                                            key={index}
                                            onClick={() => handleSendMessage(action.text, action.action)}
                                            className="flex items-center gap-1 px-2 py-1 text-xs bg-gray-100 hover:bg-blue-100
                                                text-gray-600 hover:text-blue-700 rounded-md transition-colors"
                                        >
                                            <action.icon className="w-3 h-3" />
                                            {action.text}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    </>
                )}
            </div>

            {/* Hidden file input */}
            <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/*,video/*,audio/*,.pdf,.doc,.docx"
                onChange={(e) => handleFileSelect(e.target.files)}
                className="hidden"
            />
        </div>
    );
};

export default MatiasAssistantEnhanced;