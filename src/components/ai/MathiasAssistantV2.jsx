import { useState, useRef, useEffect } from 'react';
import { 
    MessageSquare, X, Send, User, Wrench, Search, 
    Clock, AlertCircle, CheckCircle, Calendar, 
    Package, Car, FileText, DollarSign, Settings,
    Minimize2, Maximize2, Volume2, VolumeX, Copy,
    Phone, Mail, MapPin, TrendingUp, Mic, MicOff
} from 'lucide-react';

const MathiasAssistantV2 = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState([
        {
            id: 1,
            type: 'bot',
            content: '🔧 Olá! Eu sou o **Mathias**, seu assistente pessoal da OFIX!\n\n🎯 **Especialidades:**\n• 📅 **Agendamento Inteligente** - Falo com você por voz!\n• 🔍 **Consultas Rápidas** - OS, peças, histórico\n• 🚗 **Diagnóstico Veicular** - Status em tempo real\n• 🆘 **Emergência 24h** - Suporte imediato\n• 📊 **Relatórios** - Custos e prazos\n\n🎤 **Dica:** Clique no microfone para falar comigo!',
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
    
    const messagesEndRef = useRef(null);

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

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const startListening = () => {
        setIsListening(true);
        // Simular reconhecimento de voz
        setTimeout(() => {
            setIsListening(false);
            setInputMessage("Quero agendar um serviço para meu carro");
        }, 3000);
    };

    const getIntelligentResponse = (userInput) => {
        const input = userInput.toLowerCase();
        
        if (input.includes('agenda') || input.includes('marcar') || input.includes('horário')) {
            return {
                content: '📅 **Agendamento Inteligente Ativado**\n\n**Mathias:** Perfeito! Vou ajudá-lo a agendar.\n\n🚗 **Primeiro, qual é a placa do seu veículo?**\n\n*Digite a placa ou fale comigo usando o microfone*\n\n**Horários disponíveis hoje:**\n• 14:00 - Manutenção preventiva\n• 16:30 - Diagnóstico\n• 18:00 - Serviços rápidos',
                suggestions: [
                    { icon: Car, text: 'ABC-1234', action: 'informar_placa' },
                    { icon: Mic, text: '🎤 Falar Placa', action: 'falar_placa' },
                    { icon: Calendar, text: 'Ver Agenda Completa', action: 'agenda_completa' }
                ]
            };
        }
        
        if (input.includes('os') || input.includes('ordem') || input.includes('serviço')) {
            return {
                content: '🔍 **Consulta Inteligente de OS**\n\n**Ordens de Serviço Recentes:**\n\n📋 **OS #12347** - Toyota Corolla 2021\n• Status: 🟢 **Finalizado**\n• Serviço: Revisão dos 10.000km\n• Total: R$ 285,00\n• Cliente muito satisfeito! ⭐⭐⭐⭐⭐\n\n📋 **OS #12348** - Honda Civic 2019\n• Status: 🟡 **Em Andamento**\n• Serviço: Troca de pastilhas\n• Previsão: Hoje 17h\n• Técnico: João (experiente)',
                suggestions: [
                    { icon: FileText, text: 'Detalhes OS #12347', action: 'detalhes_os' },
                    { icon: Clock, text: 'Acompanhar OS #12348', action: 'acompanhar_os' },
                    { icon: Phone, text: 'Ligar para Oficina', action: 'ligar_oficina' }
                ]
            };
        }
        
        if (input.includes('emergência') || input.includes('urgente') || input.includes('socorro')) {
            return {
                content: '🚨 **CENTRAL DE EMERGÊNCIA MATHIAS**\n\n**Status:** 🟢 Operacional 24h\n**Localização:** São Paulo - SP\n**Guincho:** Disponível (ETA: 15min)\n\n🆘 **Serviços de emergência:**\n• Guincho 24h\n• Mecânico móvel\n• Diagnóstico remoto\n• Chaveiro automotivo\n\n📞 **Emergência:** (11) 99999-9999\n\n**Onde você está? Posso rastrear sua localização.**',
                suggestions: [
                    { icon: MapPin, text: '📍 Compartilhar Local', action: 'compartilhar_local' },
                    { icon: Phone, text: '📞 Ligar Emergência', action: 'ligar_emergencia' },
                    { icon: AlertCircle, text: '🚗 Problema no Carro', action: 'descrever_problema' }
                ]
            };
        }
        
        return {
            content: `🤖 **Mathias processando:** "${userInput}"\n\n💡 **Posso ajudar com:**\n\n📅 **Agendamentos:** "Quero marcar um horário"\n🔍 **Consultas:** "Status da minha OS"\n📦 **Peças:** "Preciso de um filtro de ar"\n🚗 **Veículos:** "Informações do meu carro"\n🆘 **Emergência:** "Preciso de ajuda urgente"\n\n🎤 **Use o microfone para falar comigo!**`,
            suggestions: [
                { icon: Mic, text: '🎤 Ativar Voz', action: 'ativar_voz' },
                { icon: Calendar, text: '📅 Agendar', action: 'agendar_servico' },
                { icon: Search, text: '🔍 Consultar', action: 'consultar_os' },
                { icon: AlertCircle, text: '🆘 Socorro', action: 'emergencia_24h' }
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

        // Simulate bot response
        setTimeout(() => {
            const response = getIntelligentResponse(text);

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
        }, 1500 + Math.random() * 1000);
    };

    const handleSuggestionClick = (suggestion) => {
        if (suggestion.action === 'ativar_voz') {
            startListening();
            return;
        }
        handleSendMessage(suggestion.text, suggestion.action);
    };

    const toggleChat = () => {
        setIsOpen(!isOpen);
        if (!isOpen) {
            playNotificationSound();
        }
    };

    return (
        <>
            {/* Mathias Enhanced Button */}
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
                
                {/* Notification dot */}
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
                        animation: 'slideIn 0.3s ease-out',
                        backdropFilter: 'blur(20px)',
                        background: 'rgba(255, 255, 255, 0.95)'
                    }}
                >
                    {/* Header */}
                    <div className="bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-800 p-4 text-white">
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
                    </div>

                    {!isMinimized && (
                        <>
                            {/* Messages */}
                            <div className="flex-1 overflow-y-auto p-4 space-y-4 h-[400px] bg-gradient-to-b from-slate-50 to-white">
                                {messages.map((message) => (
                                    <div
                                        key={message.id}
                                        className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
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
                                                <div className={`text-xs mt-2 ${
                                                    message.type === 'user' ? 'text-blue-100' : 'text-slate-500'
                                                }`}>
                                                    {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </div>
                                            </div>
                                            
                                            {/* Suggestions */}
                                            {message.suggestions && (
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
                                                <Wrench className="w-4 h-4 text-white" />
                                            )}
                                        </div>
                                    </div>
                                ))}
                                
                                {/* Typing indicator */}
                                {isTyping && (
                                    <div className="flex justify-start">
                                        <div className="flex items-center space-x-3">
                                            <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-600 to-blue-700 flex items-center justify-center">
                                                <Wrench className="w-4 h-4 text-white" />
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
                                    {/* Voice button */}
                                    <button
                                        onClick={startListening}
                                        className={`p-3 rounded-xl transition-all duration-200 ${
                                            isListening 
                                                ? 'bg-red-600 text-white animate-pulse' 
                                                : 'bg-slate-100 hover:bg-blue-100 text-slate-600 hover:text-blue-700'
                                        }`}
                                        title={isListening ? 'Ouvindo...' : 'Clique para falar'}
                                    >
                                        <Mic className="w-4 h-4" />
                                    </button>
                                    
                                    <div className="flex-1 relative">
                                        <input
                                            type="text"
                                            value={inputMessage}
                                            onChange={(e) => setInputMessage(e.target.value)}
                                            onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                                            placeholder={isListening ? "Ouvindo..." : "Digite ou fale com Mathias..."}
                                            className="w-full p-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            disabled={isTyping || isListening}
                                        />
                                    </div>
                                    
                                    <button
                                        onClick={() => handleSendMessage()}
                                        disabled={!inputMessage.trim() || isTyping}
                                        className="p-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl
                                            hover:from-blue-700 hover:to-blue-800 disabled:opacity-50 disabled:cursor-not-allowed 
                                            transition-all duration-200 transform hover:scale-105 active:scale-95"
                                    >
                                        <Send className="w-4 h-4" />
                                    </button>
                                </div>
                                
                                {/* Quick actions */}
                                <div className="flex flex-wrap gap-2 mt-3">
                                    {[
                                        { icon: Calendar, text: '📅 Agendar', action: 'agendar_servico' },
                                        { icon: Search, text: '🔍 Consultar OS', action: 'consultar_os' },
                                        { icon: AlertCircle, text: '🆘 Emergência', action: 'emergencia_24h' }
                                    ].map((action, index) => (
                                        <button
                                            key={index}
                                            onClick={() => handleSendMessage(action.text, action.action)}
                                            className="flex items-center gap-1 px-3 py-1.5 text-xs bg-slate-100 hover:bg-blue-100 
                                                text-slate-600 hover:text-blue-700 rounded-lg transition-colors"
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
            `}</style>
        </>
    );
};

export default MathiasAssistantV2;
