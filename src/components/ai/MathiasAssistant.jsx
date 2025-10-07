import React, { useState, useRef, useEffect } from 'react';
import { 
    MessageSquare, X, Send, User, Wrench, Search, 
    Clock, AlertCircle, CheckCircle, Calendar, 
    Package, Car, FileText, DollarSign, Settings,
    Minimize2, Maximize2, Volume2, VolumeX, Copy,
    Phone, Mail, MapPin, TrendingUp, Mic, MicOff,
    Play, Pause, RotateCcw, Users, Clock3
} from 'lucide-react';

const MathiasAssistant = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState([
        {
            id: 1,
            type: 'bot',
            content: '🔧 Olá! Eu sou o **Mathias**, seu assistente pessoal da OFIX!\n\n🎯 **Especialidades:**\n• 📅 **Agendamento Inteligente** - Falo com você por voz!\n• 🔍 **Consultas Rápidas** - OS, peças, histórico\n• � **Diagnóstico Veicular** - Status em tempo real\n• 🆘 **Emergência 24h** - Suporte imediato\n• 📊 **Relatórios** - Custos e prazos\n\n🎤 **Dica:** Clique no microfone para falar comigo!',
            timestamp: new Date(),
            suggestions: [
                { icon: Mic, text: '🎤 Falar com Mathias', action: 'iniciar_voz' },
                { icon: Calendar, text: '📅 Agendar Serviço', action: 'agendar_servico' },
                { icon: Search, text: '🔍 Consultar OS', action: 'consultar_os' },
                { icon: AlertCircle, text: '🆘 Emergência', action: 'emergencia_24h' }
            ]
        }
    ]);
    const [inputMessage, setInputMessage] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const [isMinimized, setIsMinimized] = useState(false);
    const [soundEnabled, setSoundEnabled] = useState(true);
    const [isListening, setIsListening] = useState(false);
    const [recognition, setRecognition] = useState(null);
    const [conversationFlow, setConversationFlow] = useState(null);
    const [userContext, setUserContext] = useState({});
    
    const messagesEndRef = useRef(null);
    const inputRef = useRef(null);

    // Fluxos de conversa estruturados
    const conversationFlows = {
        'agendar_servico': {
            step: 1,
            totalSteps: 5,
            title: 'Agendamento de Serviço',
            questions: [
                {
                    step: 1,
                    question: 'Perfeito! Vamos agendar seu serviço. Primeiro, preciso saber:\n\n🚗 **Qual é a placa do seu veículo?**\n\n*Exemplo: ABC-1234 ou ABC1D23*',
                    field: 'placa',
                    validation: /^[A-Z]{3}[-]?[0-9]{4}$|^[A-Z]{3}[0-9][A-Z][0-9]{2}$/,
                    errorMsg: 'Por favor, digite uma placa válida (ABC-1234 ou ABC1D23)'
                },
                {
                    step: 2,
                    question: 'Ótimo! Agora me diga:\n\n🔧 **Que tipo de serviço você precisa?**\n\n• Manutenção preventiva\n• Reparo específico\n• Diagnóstico\n• Emergência\n\n*Ou descreva o problema do seu veículo*',
                    field: 'tipoServico',
                    validation: /.{3,}/,
                    errorMsg: 'Por favor, descreva o tipo de serviço necessário'
                },
                {
                    step: 3,
                    question: 'Entendi! Para o serviço **"{tipoServico}"** no veículo placa **{placa}**:\n\n📅 **Quando você gostaria de trazer o veículo?**\n\n• Hoje\n• Amanhã\n• Esta semana\n• Próxima semana\n\n*Ou informe uma data específica (ex: 20/01/2024)*',
                    field: 'dataPreferencia',
                    validation: /.{3,}/,
                    errorMsg: 'Por favor, informe quando gostaria do atendimento'
                },
                {
                    step: 4,
                    question: 'Perfeito! Último passo:\n\n📱 **Qual seu telefone para contato?**\n\n*Exemplo: (11) 99999-9999*\n\nPreciso para confirmar o agendamento e enviar atualizações sobre o serviço.',
                    field: 'telefone',
                    validation: /\(?[\d\s\-\(\)]{10,}/,
                    errorMsg: 'Por favor, digite um telefone válido'
                },
                {
                    step: 5,
                    question: 'Excelente! Seu agendamento foi processado:\n\n📋 **Resumo do Agendamento:**\n🚗 Veículo: **{placa}**\n🔧 Serviço: **{tipoServico}**\n📅 Data preferida: **{dataPreferencia}**\n📱 Contato: **{telefone}**\n\n✅ **Nossa equipe entrará em contato em até 2 horas para confirmar o horário disponível.**\n\n🏢 **OFIX - Rua das Oficinas, 123**\n📞 **(11) 3333-4444**',
                    field: 'confirmacao',
                    isComplete: true
                }
            ]
        },
        'consultar_os': {
            step: 1,
            totalSteps: 2,
            title: 'Consulta de OS',
            questions: [
                {
                    step: 1,
                    question: 'Vou consultar sua Ordem de Serviço! 📋\n\n**Como você gostaria de consultar?**\n\n🔢 **Por número da OS** (ex: OS-12345)\n🚗 **Por placa do veículo** (ex: ABC-1234)\n📱 **Por telefone cadastrado**\n\nInforme o número da OS ou a placa do veículo:',
                    field: 'consultaInfo',
                    validation: /.{3,}/,
                    errorMsg: 'Por favor, informe o número da OS ou placa do veículo'
                },
                {
                    step: 2,
                    question: '📋 **Ordem de Serviço Encontrada!**\n\n**OS #12345** - Honda Civic 2020\n**Status:** 🟡 **Em Andamento**\n**Cliente:** João Silva\n**Entrada:** 15/01/2024 às 08:30\n**Previsão:** 17/01/2024 às 17:00\n\n**Serviços em Execução:**\n✅ Troca de óleo - **Concluído**\n🔄 Alinhamento - **Em andamento**\n⏳ Balanceamento - **Aguardando**\n💰 **Valor Total:** R$ 380,00\n\n📞 **Dúvidas?** Ligue (11) 3333-4444',
                    field: 'resultado',
                    isComplete: true
                }
            ]
        }
    };

    // Inicializar reconhecimento de voz
    useEffect(() => {
        if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
            const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
            const recognitionInstance = new SpeechRecognition();
            
            recognitionInstance.continuous = false;
            recognitionInstance.interimResults = false;
            recognitionInstance.lang = 'pt-BR';
            
            recognitionInstance.onresult = (event) => {
                const transcript = event.results[0][0].transcript;
                setInputMessage(transcript);
                setIsListening(false);
            };
            
            recognitionInstance.onerror = () => {
                setIsListening(false);
            };
            
            recognitionInstance.onend = () => {
                setIsListening(false);
            };
            
            setRecognition(recognitionInstance);
        }
    }, []);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    const playNotificationSound = () => {
        if (soundEnabled) {
            try {
                const audioContext = new (window.AudioContext || window.webkitAudioContext)();
                const oscillator = audioContext.createOscillator();
                const gainNode = audioContext.createGain();
                
                oscillator.connect(gainNode);
                gainNode.connect(audioContext.destination);
                
                oscillator.frequency.value = 800;
                oscillator.type = 'sine';
                
                gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
                gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);
                
                oscillator.start(audioContext.currentTime);
                oscillator.stop(audioContext.currentTime + 0.1);
            } catch (error) {
                console.log('Audio not supported');
            }
        }
    };

    // Síntese de voz para o Mathias
    const speakMessage = (message) => {
        if (soundEnabled && 'speechSynthesis' in window) {
            const utterance = new SpeechSynthesisUtterance(message.replace(/\*\*/g, '').replace(/[🔧🚗📅📋📱📞💰✅🔄⏳🟡]/g, ''));
            utterance.lang = 'pt-BR';
            utterance.rate = 0.9;
            utterance.pitch = 1;
            speechSynthesis.speak(utterance);
        }
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const startListening = () => {
        if (recognition && !isListening) {
            setIsListening(true);
            recognition.start();
        }
    };

    const stopListening = () => {
        if (recognition && isListening) {
            recognition.stop();
            setIsListening(false);
        }
    };

    const processConversationFlow = (userInput, action) => {
        if (!conversationFlow && action && conversationFlows[action]) {
            // Iniciar novo fluxo
            const flow = { ...conversationFlows[action] };
            setConversationFlow(flow);
            setUserContext({});
            
            const firstQuestion = flow.questions[0];
            return {
                content: firstQuestion.question,
                suggestions: []
            };
        }
        
        if (conversationFlow) {
            const currentStep = conversationFlow.step;
            const currentQuestion = conversationFlow.questions[currentStep - 1];
            
            // Validar entrada do usuário
            if (currentQuestion.validation && !currentQuestion.validation.test(userInput)) {
                return {
                    content: `❌ ${currentQuestion.errorMsg}\n\n${currentQuestion.question}`,
                    suggestions: []
                };
            }
            
            // Salvar resposta do usuário
            const newContext = { ...userContext, [currentQuestion.field]: userInput };
            setUserContext(newContext);
            
            // Verificar se é o último passo
            if (currentQuestion.isComplete) {
                setConversationFlow(null);
                setUserContext({});
                return {
                    content: interpolateMessage(currentQuestion.question, newContext),
                    suggestions: [
                        { icon: Calendar, text: 'Novo Agendamento', action: 'agendar_servico' },
                        { icon: Search, text: 'Consultar OS', action: 'consultar_os' },
                        { icon: Phone, text: 'Falar com Atendente', action: 'falar_atendente' }
                    ]
                };
            }
            
            // Próximo passo
            const nextStep = currentStep + 1;
            const nextQuestion = conversationFlow.questions[nextStep - 1];
            
            setConversationFlow({ ...conversationFlow, step: nextStep });
            
            return {
                content: interpolateMessage(nextQuestion.question, newContext),
                suggestions: []
            };
        }
        
        return null;
    };

    const interpolateMessage = (message, context) => {
        let result = message;
        Object.keys(context).forEach(key => {
            result = result.replace(new RegExp(`{${key}}`, 'g'), context[key]);
        });
        return result;
    };

    const getDefaultResponse = (userInput) => {
        const input = userInput.toLowerCase();
        
        // Detecção mais avançada de intenções
        if (input.includes('agenda') || input.includes('marcar') || input.includes('horário') || input.includes('agendar')) {
            return processConversationFlow(userInput, 'agendar_servico');
        }
        
        if (input.includes('os') || input.includes('ordem') || input.includes('serviço') || input.match(/\d{3,}/)) {
            return {
                content: '🔍 **Consulta de Ordem de Serviço**\n\n**Encontrei essas opções:**\n\n📋 **OS #12347** - Toyota Corolla 2021\n• Status: 🟢 **Finalizado**\n• Serviço: Revisão dos 10.000km\n• Total: R$ 285,00\n\n📋 **OS #12348** - Honda Civic 2019  \n• Status: 🟡 **Em Andamento**\n• Serviço: Troca de pastilhas\n• Previsão: Hoje 17h\n\n🔍 **Buscar OS específica?** Digite o número',
                suggestions: [
                    { icon: FileText, text: 'OS #12347', action: 'ver_os_detalhes' },
                    { icon: Clock, text: 'OS #12348', action: 'ver_os_detalhes' },
                    { icon: Search, text: 'Buscar por Placa', action: 'buscar_por_placa' }
                ]
            };
        }
        
        if (input.includes('peça') || input.includes('estoque') || input.includes('preço') || input.includes('filtro') || input.includes('óleo')) {
            return {
                content: '📦 **Consulta de Peças - Sistema Inteligente**\n\n🏪 **Estoque Atual:**\n\n✅ **Óleo Motor 5W30** - 15 unid. - R$ 28,90\n✅ **Filtro de Ar Honda** - 8 unid. - R$ 45,00\n⚠️ **Pastilha Freio Civic** - 2 unid. - R$ 89,90\n❌ **Correia Dentada** - **Sem estoque** - Chegada: Amanhã\n\n🔍 **Buscar peça específica?**',
                suggestions: [
                    { icon: Package, text: 'Óleo Motor', action: 'detalhes_peca' },
                    { icon: Search, text: 'Filtros', action: 'categoria_filtros' },
                    { icon: AlertCircle, text: 'Peças em Falta', action: 'pecas_falta' },
                    { icon: TrendingUp, text: 'Promoções', action: 'promocoes_pecas' }
                ]
            };
        }
        
        if (input.includes('carro') || input.includes('veículo') || input.includes('placa') || input.match(/[A-Z]{3}[-]?\d{4}/)) {
            return {
                content: '🚗 **Central do Veículo**\n\n**Últimos veículos atendidos:**\n\n🚙 **Honda Civic 2019** - Placa: ABC-1234\n• Última visita: 10/01/2024\n• Próxima revisão: 15.000km\n• Status: ✅ **Em dia**\n\n🚗 **Toyota Corolla 2021** - Placa: XYZ-5678\n• Última visita: 05/01/2024  \n• Alerta: 🔔 **Revisão próxima**\n• Km atual: 9.850km\n\nℹ️ **Digite a placa para detalhes**',
                suggestions: [
                    { icon: Car, text: 'ABC-1234', action: 'detalhes_veiculo' },
                    { icon: AlertCircle, text: 'XYZ-5678', action: 'detalhes_veiculo' },
                    { icon: Calendar, text: 'Agendar Revisão', action: 'agendar_revisao' }
                ]
            };
        }
        
        if (input.includes('emergência') || input.includes('urgente') || input.includes('socorro') || input.includes('guincho')) {
            return {
                content: '🚨 **CENTRAL DE EMERGÊNCIA 24H**\n\n**Situação:** Atendimento imediato disponível\n\n🚛 **Guincho:** Ativo na região (ETA: 15min)\n🔧 **Mecânico Mobile:** Disponível\n⚡ **Prioridade Alta:** Liberada\n\n📍 **Onde você está?**\n📞 **Contato direto:** (11) 99999-9999\n\n**Tipo de emergência:**',
                suggestions: [
                    { icon: AlertCircle, text: '🚗 Não Liga', action: 'emergencia_nao_liga' },
                    { icon: MapPin, text: '🚛 Solicitar Guincho', action: 'solicitar_guincho' },
                    { icon: Phone, text: '📞 Ligar Agora', action: 'ligar_emergencia' }
                ]
            };
        }
        
        return {
            content: `💭 **Mathias analisando:** "${userInput}"\n\n🎯 **Posso ajudar com:**\n\n📅 **Agendamentos Inteligentes**\n- "Quero agendar uma revisão"\n- "Marcar horário para amanhã"\n\n🔍 **Consultas Rápidas**\n- "Status da OS 12345"\n- "Peças para Honda Civic"\n\n� **Informações do Veículo**\n- "Meu carro placa ABC-1234"\n- "Quando é a próxima revisão"\n\n🆘 **Emergências**\n- "Preciso de guincho"\n- "Meu carro não liga"\n\n📞 **Suporte:** (11) 3333-4444`,
            suggestions: [
                { icon: Calendar, text: '📅 Agendar', action: 'agendar_servico' },
                { icon: Search, text: '🔍 Consultar', action: 'consultar_os' },
                { icon: AlertCircle, text: '🆘 Emergência', action: 'emergencia_24h' },
                { icon: Phone, text: '👤 Atendente', action: 'falar_atendente' }
            ]
        };
    };

    const handleSendMessage = (messageText = null, action = null) => {
        const text = messageText || inputMessage.trim();
        if (!text && !action) return;

        // Add user message
        const userMessage = {
            id: Date.now(),
            type: 'user',
            content: text,
            timestamp: new Date()
        };

        setMessages(prev => [...prev, userMessage]);
        setInputMessage('');
        setIsTyping(true);

        // Process response
        setTimeout(() => {
            let response;
            
            if (conversationFlow || action) {
                response = processConversationFlow(text, action);
            }
            
            if (!response) {
                response = getDefaultResponse(text);
            }

            const botMessage = {
                id: Date.now() + 1,
                type: 'bot',
                content: response.content,
                timestamp: new Date(),
                suggestions: response.suggestions
            };

            setMessages(prev => [...prev, botMessage]);
            setIsTyping(false);
            playNotificationSound();
            
            // Mathias fala a resposta
            setTimeout(() => {
                speakMessage(response.content);
            }, 500);
            
        }, 1000 + Math.random() * 1000);
    };

    const handleSuggestionClick = (suggestion) => {
        handleSendMessage(suggestion.text, suggestion.action);
    };

    const copyToClipboard = (text) => {
        navigator.clipboard.writeText(text);
    };

    const toggleChat = () => {
        setIsOpen(!isOpen);
        if (!isOpen) {
            playNotificationSound();
        }
    };

    return (
        <>
            {/* Chat Button - Mathias Enhanced */}
            <button
                onClick={toggleChat}
                className={`fixed bottom-6 right-6 z-50 w-20 h-20 rounded-full shadow-2xl
                    bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 text-white 
                    hover:from-blue-700 hover:via-blue-800 hover:to-indigo-900 
                    transition-all duration-500 ease-out
                    transform hover:scale-110 active:scale-95
                    ${isOpen ? 'scale-0 rotate-180' : 'scale-100 rotate-0'}
                    border-4 border-white/20 backdrop-blur-sm`}
                style={{
                    transform: isOpen ? 'scale(0) rotate(180deg)' : 'scale(1) rotate(0deg)',
                    transition: 'all 0.5s cubic-bezier(0.68, -0.55, 0.265, 1.55)',
                    boxShadow: '0 20px 40px rgba(37, 99, 235, 0.3), 0 0 30px rgba(37, 99, 235, 0.2)'
                }}
            >
                <div className="relative flex items-center justify-center w-full h-full">
                    {/* Ícone principal */}
                    <div className="relative">
                        <Wrench className="w-8 h-8 transform rotate-12" />
                        {/* Pulse de atividade */}
                        <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
                    </div>
                    
                    {/* Indicator de voz ativa */}
                    {isListening && (
                        <div className="absolute inset-0 border-2 border-green-400 rounded-full animate-pulse">
                            <div className="absolute inset-1 border-2 border-green-300 rounded-full animate-ping"></div>
                        </div>
                    )}
                </div>
                
                {/* Badge do Mathias */}
                <div className="absolute -top-2 -left-2 bg-gradient-to-r from-orange-400 to-orange-500 
                    text-white text-xs font-bold px-2 py-1 rounded-full shadow-lg animate-bounce">
                    🤖 Mathias
                </div>
                
                {/* Notification dot com contador */}
                <div className="absolute -top-1 -right-1 w-6 h-6 bg-gradient-to-r from-red-500 to-red-600 
                    rounded-full animate-pulse flex items-center justify-center border-2 border-white">
                    <span className="text-xs font-bold text-white">!</span>
                </div>
                
                {/* Efeito de ondas */}
                <div className="absolute inset-0 rounded-full opacity-30">
                    <div className="absolute inset-0 rounded-full bg-blue-400 animate-ping"></div>
                    <div className="absolute inset-2 rounded-full bg-blue-300 animate-ping" style={{animationDelay: '0.5s'}}></div>
                </div>
            </button>

            {/* Chat Window */}
            {isOpen && (
                <div
                    className={`fixed bottom-6 right-6 z-40 bg-white rounded-2xl shadow-2xl
                        border border-slate-200 overflow-hidden
                        ${isMinimized ? 'w-80 h-16' : 'w-96 h-[600px]'} transition-all duration-300`}
                    style={{
                        animation: 'slideIn 0.3s ease-out'
                    }}
                >
                    {/* Header */}
                    <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-4 text-white">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
                                    <Wrench className="w-5 h-5" />
                                </div>
                                <div>
                                    <h3 className="font-semibold flex items-center gap-2">
                                        🤖 Mathias Assistant 
                                        <span className="text-xs font-normal bg-white/20 px-2 py-0.5 rounded-full">IA</span>
                                    </h3>
                                    <p className="text-xs text-blue-100 flex items-center gap-1">
                                        <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                                        {isTyping ? '✍️ Pensando...' : isListening ? '👂 Ouvindo você...' : '🎯 Especialista em Oficinas'}
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => setSoundEnabled(!soundEnabled)}
                                    className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                                    title={soundEnabled ? 'Desativar som' : 'Ativar som'}
                                >
                                    {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
                                </button>
                                <button
                                    onClick={() => setIsMinimized(!isMinimized)}
                                    className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                                >
                                    {isMinimized ? <Maximize2 className="w-4 h-4" /> : <Minimize2 className="w-4 h-4" />}
                                </button>
                                <button
                                    onClick={() => setIsOpen(false)}
                                    className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                        
                        {/* Progress bar para fluxos de conversa */}
                        {conversationFlow && (
                            <div className="mt-3">
                                <div className="flex items-center justify-between text-xs text-blue-100 mb-1">
                                    <span>{conversationFlow.title}</span>
                                    <span>{conversationFlow.step}/{conversationFlow.totalSteps}</span>
                                </div>
                                <div className="w-full bg-white/20 rounded-full h-1">
                                    <div 
                                        className="bg-orange-400 h-1 rounded-full transition-all duration-300"
                                        style={{ width: `${(conversationFlow.step / conversationFlow.totalSteps) * 100}%` }}
                                    ></div>
                                </div>
                            </div>
                        )}
                    </div>

                    {!isMinimized && (
                        <>
                            {/* Messages */}
                            <div className="flex-1 overflow-y-auto p-4 space-y-4 h-[400px] bg-gradient-to-b from-slate-50 to-white">
                                {messages.map((message) => (
                                    <div
                                        key={message.id}
                                        className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
                                        style={{ animation: 'slideInMessage 0.3s ease-out' }}
                                    >
                                        <div className={`max-w-[80%] ${message.type === 'user' ? 'order-1' : 'order-2'}`}>
                                            <div className={`p-3 rounded-2xl ${
                                                message.type === 'user'
                                                    ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white ml-auto'
                                                    : 'bg-white border border-slate-200 shadow-sm'
                                            }`}>
                                                <div className="text-sm leading-relaxed whitespace-pre-line">
                                                    {message.content}
                                                </div>
                                                <div className={`text-xs mt-2 flex items-center gap-2 ${
                                                    message.type === 'user' ? 'text-blue-100' : 'text-slate-500'
                                                }`}>
                                                    <Clock3 className="w-3 h-3" />
                                                    {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                    {message.type === 'bot' && (
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
                                                <div className="mt-3 space-y-2">
                                                    {message.suggestions.map((suggestion, index) => (
                                                        <button
                                                            key={index}
                                                            onClick={() => handleSuggestionClick(suggestion)}
                                                            className="flex items-center gap-2 w-full p-2 text-sm bg-gradient-to-r from-slate-50 to-slate-100 
                                                                hover:from-blue-50 hover:to-blue-100 border border-slate-200 hover:border-blue-300 
                                                                rounded-lg transition-all duration-200 text-slate-700 hover:text-blue-700
                                                                transform hover:scale-102 active:scale-98"
                                                        >
                                                            <suggestion.icon className="w-4 h-4 flex-shrink-0" />
                                                            <span>{suggestion.text}</span>
                                                        </button>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                        
                                        {/* Avatar */}
                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                                            message.type === 'user' ? 'order-2 ml-3 bg-slate-200' : 'order-1 mr-3 bg-gradient-to-r from-blue-600 to-blue-700'
                                        }`}>
                                            {message.type === 'user' ? (
                                                <User className="w-4 h-4 text-slate-600" />
                                            ) : (
                                                <span className="text-white font-bold text-xs">M</span>
                                            )}
                                        </div>
                                    </div>
                                ))}
                                
                                {/* Typing indicator */}
                                {isTyping && (
                                    <div className="flex justify-start">
                                        <div className="flex items-center space-x-3">
                                            <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-600 to-blue-700 flex items-center justify-center">
                                                <span className="text-white font-bold text-xs">M</span>
                                            </div>
                                            <div className="bg-white border border-slate-200 rounded-2xl p-3 shadow-sm">
                                                <div className="flex space-x-1">
                                                    <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"></div>
                                                    <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                                                    <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}
                                <div ref={messagesEndRef} />
                            </div>

                            {/* Input */}
                            <div className="p-4 border-t border-slate-200 bg-white">
                                <div className="flex items-center space-x-3">
                                    <div className="flex-1 relative">
                                        <input
                                            ref={inputRef}
                                            type="text"
                                            value={inputMessage}
                                            onChange={(e) => setInputMessage(e.target.value)}
                                            onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                                            placeholder={isListening ? "Ouvindo..." : "Digite sua mensagem ou clique no microfone..."}
                                            className="w-full p-3 pr-24 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            disabled={isTyping || isListening}
                                        />
                                        
                                        {/* Voice button */}
                                        <button
                                            onClick={isListening ? stopListening : startListening}
                                            disabled={isTyping}
                                            className={`absolute right-12 top-1/2 transform -translate-y-1/2 p-2 rounded-lg transition-all duration-200 ${
                                                isListening 
                                                    ? 'bg-red-500 text-white animate-pulse' 
                                                    : 'bg-slate-100 text-slate-600 hover:bg-blue-100 hover:text-blue-700'
                                            }`}
                                            title={isListening ? 'Parar gravação' : 'Falar com Mathias'}
                                        >
                                            {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                                        </button>
                                    </div>
                                    
                                    <button
                                        onClick={() => handleSendMessage()}
                                        disabled={!inputMessage.trim() || isTyping || isListening}
                                        className="p-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl
                                            hover:from-blue-700 hover:to-blue-800 disabled:opacity-50 disabled:cursor-not-allowed 
                                            transition-all duration-200 transform hover:scale-105 active:scale-95"
                                    >
                                        <Send className="w-4 h-4" />
                                    </button>
                                </div>
                                
                                {/* Quick voice commands */}
                                <div className="flex flex-wrap gap-2 mt-3">
                                    <div className="text-xs text-slate-500 mb-1 w-full">💡 Comandos rápidos:</div>
                                    {[
                                        { icon: Calendar, text: '"Quero agendar"', action: 'agendar_servico' },
                                        { icon: Search, text: '"Consultar OS"', action: 'consultar_os' },
                                        { icon: AlertCircle, text: '"Emergência"', action: 'emergencia' }
                                    ].map((action, index) => (
                                        <button
                                            key={index}
                                            onClick={() => handleSendMessage(action.text.replace(/"/g, ''), action.action)}
                                            className="flex items-center gap-1 px-2 py-1 text-xs bg-slate-100 hover:bg-blue-100 
                                                text-slate-600 hover:text-blue-700 rounded-md transition-colors"
                                        >
                                            <action.icon className="w-3 h-3" />
                                            {action.text}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </>
                    )}
                </div>
            )}

            <style jsx>{`
                @keyframes slideIn {
                    from {
                        opacity: 0;
                        transform: translateY(100px) scale(0.8);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0) scale(1);
                    }
                }
                
                @keyframes slideInMessage {
                    from {
                        opacity: 0;
                        transform: translateY(20px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }
            `}</style>
        </>
    );
};

export default MathiasAssistant;
