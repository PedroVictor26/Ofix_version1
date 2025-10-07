import React, { useState, useEffect, useRef } from 'react';
import { X, MessageCircle, Send, Mic, MicOff, Settings, History, User, Wrench, Phone, Calendar, FileText, AlertTriangle, CheckCircle, Clock, DollarSign, Volume2, VolumeX, Pause, Play } from 'lucide-react';
import { useSpeechToText } from '../../hooks/useSpeechToText';
import { useTextToSpeech } from '../../hooks/useTextToSpeech';

/**
 * 🤖 MATIAS - Assistente Virtual Profissional da Ofix
 * 
 * Persona: Mecânico-chefe e gerente experiente da oficina com 15 anos de experiência
 * Missão: Ser o pilar de conhecimento e operação da Ofix
 * Funcionalidades: Consultoria especializada, diagnósticos técnicos, gestão de chamados
 * 
 * Conforme especificado no prompt: "O Matias não é apenas um assistente; 
 * ele é o mecânico-chefe de confiança e gerente experiente da Ofix"
 */

const MatiasWidgetProfessional = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('chat');
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([
    {
      type: 'matias',
      content: `👋 **Olá! Eu sou o Matias - Mecânico-Chefe da Ofix**

Com **15 anos de experiência** em automóveis, sou responsável por toda a operação técnica e administrativa da oficina.

🔧 **Como posso te ajudar hoje?**

**Especialidades técnicas:**
• **Diagnósticos complexos** - Análise detalhada de problemas
• **Consultoria especializada** - Orientação técnica profissional  
• **Gestão de chamados** - Abertura e acompanhamento completo
• **Orçamentos precisos** - Baseados em 15 anos de experiência
• **Agendamentos prioritários** - Otimização da sua agenda

**Acesso completo a:**
✅ Histórico completo do seu veículo
✅ Base de conhecimento técnico avançada
✅ Sistema de gestão da oficina
✅ Rede de fornecedores e peças

*Fale comigo como se estivesse conversando diretamente com o dono da oficina. Tenho autoridade para resolver qualquer situação.*

**🎤 NOVO: Agora você pode falar comigo por voz! Use o botão do microfone para conversar naturalmente.**`,
      timestamp: new Date(),
      priority: 'high',
      actions: [
        { label: '🚗 Diagnóstico Urgente', action: 'emergency_diagnostic', priority: 'urgent' },
        { label: '📅 Agendar Serviço', action: 'schedule_service', priority: 'normal' },
        { label: '📋 Consultar Histórico', action: 'check_history', priority: 'normal' },
        { label: '💰 Solicitar Orçamento', action: 'request_budget', priority: 'normal' },
        { label: '📞 Falar com Matias', action: 'direct_contact', priority: 'high' }
      ]
    }
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const [userProfile] = useState({
    name: 'Cliente',
    vehicle: 'Não informado',
    lastService: null,
    activeServices: 0,
    loyaltyLevel: 'Bronze'
  });
  const [offlineMode, setOfflineMode] = useState(false);
  const [autoSpeak, setAutoSpeak] = useState(true);
  const [lastSpokenMessageId, setLastSpokenMessageId] = useState(null);
  const [isPreparingSpeech, setIsPreparingSpeech] = useState(false);
  
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const speechTimeoutRef = useRef(null);

  // Hooks de voz
  const { 
    isListening, 
    transcript, 
    isSupported: speechSupported, 
    error: speechError,
    startListening, 
    stopListening, 
    resetTranscript 
  } = useSpeechToText();

  const { 
    isSpeaking, 
    isPaused,
    isSupported: ttsSupported,
    speakMatias,
    pause: pauseSpeech,
    resume: resumeSpeech,
    stop: stopSpeech 
  } = useTextToSpeech();

  // Auto-scroll para mensagens
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Foco no input quando abre
  useEffect(() => {
    if (isOpen && activeTab === 'chat') {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen, activeTab]);

  // Atualizar input com transcript de voz
  useEffect(() => {
    if (transcript && transcript.trim()) {
      setMessage(transcript);
    }
  }, [transcript]);

  // Auto-falar respostas do Matias se habilitado
  useEffect(() => {
    // Limpar timeout anterior se existir
    if (speechTimeoutRef.current) {
      clearTimeout(speechTimeoutRef.current);
    }

    if (autoSpeak && ttsSupported && messages.length > 1 && !isListening) {
      const lastMessage = messages[messages.length - 1];
      
      // Só processar mensagens do Matias
      if (lastMessage.type === 'matias' && lastMessage.content) {
        // Criar ID simples baseado no índice da mensagem
        const messageId = `msg_${messages.length - 1}`;
        
        // Verificar se esta mensagem já foi falada
        if (messageId !== lastSpokenMessageId && !isSpeaking && !isPreparingSpeech) {
          console.log('🔊 Preparando para falar mensagem:', messageId);
          
          // Marcar que está preparando para falar
          setIsPreparingSpeech(true);
          setLastSpokenMessageId(messageId);
          
          // Delay menor para resposta mais rápida
          speechTimeoutRef.current = setTimeout(() => {
            console.log('🔊 Executando fala da mensagem:', messageId);
            speakMatias(lastMessage.content);
            setIsPreparingSpeech(false);
          }, 800);
        }
      }
    }

    // Cleanup
    return () => {
      if (speechTimeoutRef.current) {
        clearTimeout(speechTimeoutRef.current);
      }
    };
  }, [messages, autoSpeak, ttsSupported, isListening]);

  // Função real para comunicar com a API do Matias
  const sendMessageToMatias = async (userMessage, action = null) => {
    setIsLoading(true);
    
    try {
  const response = await fetch('/api/matias/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          message: userMessage,
          action: action,
          language: 'pt-BR',
          context: {
            userProfile,
            activeTab,
            conversationHistory: messages.slice(-5) // Últimas 5 mensagens para contexto
          }
        })
      });

      if (!response.ok) {
        throw new Error(`Erro ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      
      if (data.success) {
        return {
          response: data.response,
          actions: Array.isArray(data.actions) ? data.actions : [],
          priority: 'normal'
        };
      } else {
        throw new Error(data.error || 'Erro na comunicação com Matias');
      }
      
    } catch (error) {
      console.error('Erro ao comunicar com Matias:', error);
      
      // Fallback para modo offline
      return {
        response: `🔧 **Matias (Modo Emergência)**
        
Estou com dificuldades técnicas no momento, mas vou te ajudar:

Sua mensagem: "${userMessage}"

**⚡ Ação Imediata:**
• Para emergências: **(11) 99999-0000** (WhatsApp Matias)
• Para agendamentos: Entre em contato por telefone
• Para dúvidas técnicas: Posso orientar com base na minha experiência

*Assim que normalizar a conexão, voltarei com minha consultoria completa.* 🚗`,
        actions: [
          { label: '📞 Ligar Emergência', action: 'emergency_call', priority: 'urgent' },
          { label: '📱 WhatsApp Direto', action: 'whatsapp_direct', priority: 'high' }
        ],
        priority: 'urgent'
      };
    } finally {
      setIsLoading(false);
    }
  };

  // Simular resposta do Matias como mecânico-chefe experiente (MODO FALLBACK)
  const simulateMatiasExpertResponse = async (userMessage, action = null) => {
    setIsLoading(true);
    
    // Simular processamento técnico (substituir por API real)
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    let response = '';
    let actions = [];
    let priority = 'normal';
    
    if (action) {
      switch (action) {
        case 'emergency_diagnostic':
          response = `🚨 **DIAGNÓSTICO URGENTE - Matias Atendendo**

Como mecânico-chefe, vou te ajudar imediatamente:

**⚠️ PRIMEIRO - SEGURANÇA:**
1. O veículo está **seguro para dirigir**?
2. Há **luzes de alerta** acesas no painel?
3. Você ouve **ruídos anormais**?

**🔧 DIAGNÓSTICO REMOTO MATIAS:**
Baseado em 15 anos de experiência, posso:

• **Orientação imediata** - O que fazer agora
• **Avaliação de risco** - Se pode esperar ou é urgente
• **Providências** - Guincho, reboque ou autorização para dirigir
• **Agendamento prioritário** - Atendimento hoje mesmo

**📞 CONTATO DIRETO:**
WhatsApp Matias: **(11) 99999-0000**
Emergência 24h: **(11) 88888-0000**

*Não se preocupe, com 15 anos resolvendo problemas automotivos, vamos solucionar isso juntos.*`;
          
          actions = [
            { label: '🚨 É Emergência Real', action: 'real_emergency', priority: 'urgent' },
            { label: '📋 Descrever Problema', action: 'describe_problem', priority: 'high' },
            { label: '📞 Ligar para Matias', action: 'call_matias', priority: 'high' }
          ];
          priority = 'urgent';
          break;
          
        case 'schedule_service':
          response = `📅 **AGENDAMENTO PROFISSIONAL - Matias**

Como gerente da oficina, vou organizar seu atendimento:

**🕐 HORÁRIOS DESTA SEMANA:**
• **Hoje**: 14h00 *(diagnóstico express)*, 16h30 *(serviço completo)*
• **Amanhã**: 08h00 *(primeira consulta)*, 10h00, 15h00
• **Sexta**: 09h00, 13h00 *(meio período)*, 17h00

**🔧 SERVIÇOS MAIS SOLICITADOS:**
• **Diagnóstico Completo** (1-2h) - R$ 120,00
• **Revisão Preventiva** (2-3h) - R$ 280,00  
• **Troca de Óleo + Filtros** (45min) - R$ 95,00
• **Freios Completos** (3-4h) - R$ 450,00

**⭐ VANTAGENS CLIENTE OFIX:**
✅ **Garantia estendida** em todos os serviços
✅ **Peças originais** com certificado
✅ **Diagnóstico gratuito** em retornos
✅ **Desconto fidelidade** - até 15%

*Qual serviço você precisa? Vou reservar o melhor horário para você.*`;
          
          actions = [
            { label: '⏰ Reservar Hoje', action: 'book_today', priority: 'high' },
            { label: '📋 Ver Todos Serviços', action: 'all_services', priority: 'normal' },
            { label: '💰 Consultar Preços', action: 'check_prices', priority: 'normal' },
            { label: '📞 Agendar por Telefone', action: 'phone_schedule', priority: 'normal' }
          ];
          break;
          
        case 'check_history':
          response = `📋 **HISTÓRICO COMPLETO DO CLIENTE - Matias**

Acessando o sistema da oficina...

**🚗 VEÍCULO PRINCIPAL:**
Honda Civic 2020 - Placa: ABC1234
Km atual: 28.500km

**📅 ÚLTIMO SERVIÇO** (15/08/2025):
🔧 **Revisão dos 20.000km** - ✅ **Concluído**
• Troca de óleo e filtros
• Inspeção de freios  
• Verificação de suspensão
• **Valor:** R$ 350,00 | **Garantia:** 6 meses

**⚠️ ATENÇÃO - RECOMENDAÇÕES TÉCNICAS:**
• **Pastilhas de freio**: 40% desgaste *(trocar em dez/2025)*
• **Pneus**: Desgaste normal *(verificar em 5.000km)*
• **Próxima revisão**: 30.000km *(estimativa: jan/2026)*

**🛡️ GARANTIAS ATIVAS:**
✅ Óleo sintético - até novembro/2025
✅ Filtro de ar - até fevereiro/2026
✅ Mão de obra freios - até fevereiro/2026

**💳 NÍVEL FIDELIDADE:** Ouro *(15% desconto)*

*Posso agendar sua próxima manutenção preventiva com desconto especial!*`;
          
          actions = [
            { label: '📅 Agendar Próxima Revisão', action: 'schedule_next', priority: 'high' },
            { label: '🛡️ Detalhes das Garantias', action: 'warranty_details', priority: 'normal' },
            { label: '📊 Relatório Completo', action: 'full_report', priority: 'normal' }
          ];
          break;
          
        case 'request_budget':
          response = `💰 **ORÇAMENTO PROFISSIONAL - Matias, 15 anos de experiência**

Como mecânico-chefe, garanto transparência total:

**🎯 PARA ORÇAMENTO PRECISO, INFORME:**
1. **Tipo de serviço** necessário
2. **Sintomas ou problemas** específicos  
3. **Marca, modelo e ano** do veículo
4. **Urgência** do serviço

**💡 TABELA DE REFERÊNCIA MATIAS:**
• **Diagnóstico Eletrônico**: R$ 120-150
• **Troca de Óleo Sintético**: R$ 95-130  
• **Revisão 10.000km**: R$ 280-350
• **Revisão 20.000km**: R$ 380-480
• **Freios (pastilhas + discos)**: R$ 450-650
• **Suspensão completa**: R$ 800-1.200

**🔍 DIFERENCIAIS OFIX:**
✅ **Orçamento gratuito** - sem compromisso
✅ **Preço fechado** - sem surpresas  
✅ **3 opções de peças** - original, genuína, alternativa
✅ **Parcelamento facilitado** - até 6x sem juros
✅ **Garantia estendida** - até 12 meses

*Envie fotos do problema ou descreva os sintomas. Com minha experiência, posso dar uma estimativa inicial imediata.*`;
          
          actions = [
            { label: '📝 Enviar Descrição Detalhada', action: 'detailed_description', priority: 'high' },
            { label: '📸 Enviar Fotos', action: 'send_photos', priority: 'normal' },
            { label: '📞 Orçamento por Telefone', action: 'phone_budget', priority: 'normal' },
            { label: '🏪 Visitar Oficina', action: 'visit_workshop', priority: 'normal' }
          ];
          break;
          
        case 'direct_contact':
          response = `📞 **CONTATO DIRETO COM MATIAS**

Como mecânico-chefe, estou disponível para atendimento personalizado:

**🔧 MATIAS - WHATSAPP DIRETO:**
**(11) 99999-0000** *(respondo pessoalmente)*

**📞 TELEFONE OFICINA:**
**(11) 3333-4444** *(pedir para falar com Matias)*

**⏰ HORÁRIOS DE ATENDIMENTO:**
• Segunda a Sexta: 7h30 às 18h00
• Sábado: 8h00 às 12h00  
• **Emergências**: 24h por WhatsApp

**🚨 URGÊNCIAS MECÂNICAS:**
Se o problema for urgente (vazamentos, superaquecimento, freios), me chame **imediatamente** no WhatsApp.

**💬 TIPOS DE CONSULTA:**
• Diagnóstico remoto por áudio/foto
• Orientação técnica especializada
• Segundo parecer profissional
• Emergências automotivas

*Com 15 anos de experiência, resolvo 80% dos problemas por orientação telefônica. Para os outros 20%, te guio exatamente sobre o que fazer.*`;
          
          actions = [
            { label: '📱 Abrir WhatsApp', action: 'open_whatsapp', priority: 'high' },
            { label: '📞 Ligar Agora', action: 'call_now', priority: 'high' },
            { label: '⏰ Agendar Ligação', action: 'schedule_call', priority: 'normal' }
          ];
          break;
          
        default:
          // Resposta baseada na mensagem com expertise de mecânico-chefe
          const msg = userMessage.toLowerCase();
          
          if (msg.includes('problema') || msg.includes('defeito') || msg.includes('ruído')) {
            response = `🔧 **ANÁLISE TÉCNICA MATIAS - Mecânico-Chefe**

Entendi que você está com um problema técnico. Com 15 anos de experiência, vou te orientar:

**🚨 PRIMEIRA AVALIAÇÃO:**
1. **Segurança**: O veículo está seguro para usar?
2. **Sintomas**: Descreva exatamente o que está acontecendo
3. **Quando começou**: O problema é recente ou antigo?
4. **Condições**: Acontece sempre ou só em situações específicas?

**⚠️ SINAIS DE ALERTA IMEDIATO:**
• Luzes vermelhas no painel - **PARE IMEDIATAMENTE**
• Ruídos de freio - **MUITO PERIGOSO**
• Superaquecimento - **DESLIGUE O MOTOR**
• Vazamentos visíveis - **VERIFIQUE O FLUIDO**

**💡 DIAGNÓSTICO MATIAS:**
Baseado na sua descrição, posso:
• Identificar possíveis causas
• Avaliar grau de urgência  
• Orientar primeiros socorros automotivos
• Calcular custos aproximados
• Agendar reparo prioritário

*Detalhe o problema que vou te orientar profissionalmente. Em 15 anos, já vi de tudo!*`;
            
            actions = [
              { label: '🚨 É Urgente/Perigoso', action: 'urgent_problem', priority: 'urgent' },
              { label: '📝 Descrever Sintomas', action: 'describe_symptoms', priority: 'high' },
              { label: '📱 Enviar Áudio/Foto', action: 'send_media', priority: 'normal' }
            ];
            
          } else if (msg.includes('preço') || msg.includes('valor') || msg.includes('custo')) {
            response = `💰 **CONSULTORIA DE PREÇOS - Matias**

Como gerente da Ofix, garanto sempre o melhor custo-benefício:

**📊 NOSSA POLÍTICA DE PREÇOS:**
✅ **Transparência total** - itemização completa
✅ **3 fornecedores** - sempre comparamos  
✅ **Preço justo** - margem honesta
✅ **Sem surpresas** - orçamento fechado

**💡 FATORES QUE INFLUENCIAM O PREÇO:**
• **Marca/modelo** do veículo
• **Tipo de peça** (original/genuína/alternativa)
• **Complexidade** do serviço
• **Urgência** do atendimento

**🎯 ESTRATÉGIA MATIAS PARA ECONOMIA:**
• **Manutenção preventiva** - economiza até 70%
• **Peças em promoção** - parceria com fornecedores
• **Pacotes de serviços** - desconto progressivo
• **Fidelidade** - cliente ouro = 15% desconto

*Para um orçamento exato, preciso saber o serviço específico e modelo do veículo. Posso te dar uma estimativa inicial baseada na minha experiência.*`;
            
          } else if (msg.includes('agend') || msg.includes('horário') || msg.includes('marca')) {
            response = `📅 **AGENDAMENTO MATIAS - Gestão Profissional**

Como gerente da oficina, organizo os horários para máxima eficiência:

**⚡ ATENDIMENTO EXPRESSO:**
• **Diagnóstico rápido**: 30min - hoje mesmo
• **Troca de óleo**: 45min - sem agendamento
• **Inspeção básica**: 20min - imediato

**🕐 AGENDA DESTA SEMANA:**
• **Hoje**: *(2 horários disponíveis)*
• **Amanhã**: *(manhã cheia, tarde disponível)*  
• **Sexta**: *(dia mais tranquilo)*

**📋 TIPOS DE AGENDAMENTO:**
• **Urgente** - mesmo dia
• **Normal** - até 3 dias
• **Programado** - manutenção preventiva
• **Especial** - serviços complexos

*Qual o tipo de serviço? Vou encontrar o melhor encaixe na agenda conforme a urgência.*`;
            
          } else {
            response = `👨‍🔧 **MATIAS RESPONDE - Mecânico-Chefe Ofix**

Como mecânico-chefe com 15 anos de experiência, estou aqui para resolver qualquer questão automotiva.

**🎯 SOBRE SUA MENSAGEM:**
"*${userMessage}*"

**💡 POSSO TE AJUDAR COM:**
• **Diagnósticos técnicos** detalhados
• **Consultoria especializada** em reparos
• **Orientação sobre custos** realistas
• **Priorização de serviços** por urgência
• **Acesso direto** aos dados da oficina

**🔧 EXPERTISE MATIAS:**
• 15 anos resolvendo problemas automotivos
• Especialista em diagnósticos complexos  
• Conhecimento profundo de todas as marcas
• Acesso a base técnica completa
• Autoridade para decisões imediatas

*Seja mais específico sobre sua necessidade. Como se estivesse conversando diretamente comigo na oficina - vou te orientar com toda minha experiência profissional.*`;
          }
          
          actions = [
            { label: '🔧 Problema Técnico', action: 'technical_issue', priority: 'high' },
            { label: '📅 Agendar Serviço', action: 'schedule_service', priority: 'normal' },
            { label: '💰 Consultar Preços', action: 'check_pricing', priority: 'normal' },
            { label: '📞 Falar Direto', action: 'direct_contact', priority: 'high' }
          ];
      }
    }
    
    setMessages(prev => [...prev, {
      type: 'matias',
      content: response,
      timestamp: new Date(),
      actions: actions,
      priority: priority,
      expertise: true
    }]);
    
    setIsLoading(false);
  };

  const handleSendMessage = async () => {
    if (!message.trim()) return;
    
    const userMessage = message;
    setMessage('');
    
    // Adicionar mensagem do usuário
    setMessages(prev => [...prev, {
      type: 'user',
      content: userMessage,
      timestamp: new Date()
    }]);
    
    // Chamar API real do Matias
    const result = await sendMessageToMatias(userMessage);
    
    // Adicionar resposta do Matias
    setMessages(prev => [...prev, {
      type: 'matias',
      content: result.response,
      timestamp: new Date(),
      actions: result.actions,
      priority: result.priority,
      expertise: true
    }]);
  };

  const handleActionClick = async (action) => {
    // Adicionar mensagem indicando a ação
    const actionLabels = {
      'emergency_diagnostic': '🚨 Solicitar diagnóstico urgente',
      'schedule_service': '📅 Solicitar agendamento de serviço',
      'check_history': '📋 Consultar histórico completo',
      'request_budget': '💰 Solicitar orçamento detalhado',
      'direct_contact': '📞 Solicitar contato direto com Matias'
    };
    
    const actionMessage = actionLabels[action] || 'Ação solicitada';
    
    setMessages(prev => [...prev, {
      type: 'user',
      content: actionMessage,
      timestamp: new Date()
    }]);
    
    // Chamar API real do Matias com ação específica
    const result = await sendMessageToMatias(actionMessage, action);
    
    // Adicionar resposta do Matias
    setMessages(prev => [...prev, {
      type: 'matias',
      content: result.response,
      timestamp: new Date(),
      actions: result.actions,
      priority: result.priority,
      expertise: true
    }]);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const toggleRecording = () => {
    if (!speechSupported) {
      alert('Seu navegador não suporta reconhecimento de voz. Use o Chrome ou Edge para melhor experiência.');
      return;
    }

    if (isListening) {
      stopListening();
    } else {
      stopSpeech(); // Para a fala se estiver falando
      resetTranscript();
      startListening();
    }
  };

  // Função para pausar auto-fala quando usuário está falando
  useEffect(() => {
    if (isListening && isSpeaking) {
      stopSpeech();
    }
  }, [isListening, isSpeaking, stopSpeech]);

  if (!isOpen) {
    return (
      <div className="fixed bottom-6 right-6 z-50">
        <button
          onClick={() => setIsOpen(true)}
          className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white p-4 rounded-full shadow-2xl transition-all duration-300 hover:scale-110 group relative"
          title="Matias - Mecânico-Chefe Ofix • 15 anos de experiência"
        >
          <div className="relative">
            <Wrench className="w-7 h-7" />
            <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full animate-pulse border-2 border-white"></div>
          </div>
          
          {/* Tooltip profissional */}
          <div className="absolute bottom-20 right-0 bg-gray-900 text-white px-4 py-3 rounded-lg text-sm opacity-0 group-hover:opacity-100 transition-all duration-300 whitespace-nowrap shadow-xl">
            <div className="font-bold">🔧 Matias - Mecânico-Chefe</div>
            <div className="text-gray-300">15 anos • Especialista • Online</div>
            <div className="text-green-400 text-xs">• Diagnósticos • Consultoria • Gestão</div>
          </div>
        </button>
      </div>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 z-50 w-[420px] h-[650px] bg-white rounded-xl shadow-2xl border border-gray-200 flex flex-col overflow-hidden">
      {/* Header Profissional com Controles de Voz */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-5 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="relative">
            <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center">
              <Wrench className="w-6 h-6" />
            </div>
            <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-400 rounded-full border-2 border-white"></div>
          </div>
          <div>
            <h3 className="font-bold text-lg">Matias</h3>
            <p className="text-blue-100 text-sm">Mecânico-Chefe • 15 anos exp.</p>
            <div className="flex items-center space-x-2 text-xs text-blue-200">
              <CheckCircle className="w-3 h-3" />
              <span>Especialista Online</span>
              {ttsSupported && (
                <>
                  <span>•</span>
                  <Mic className="w-3 h-3" />
                  <span>Voz Ativa</span>
                </>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          {/* Controles de Voz */}
          {ttsSupported && (
            <div className="flex items-center space-x-1">
              {isSpeaking && (
                <button
                  onClick={isPaused ? resumeSpeech : pauseSpeech}
                  className="text-white hover:bg-blue-800 p-1.5 rounded-lg transition-colors"
                  title={isPaused ? "Retomar fala" : "Pausar fala"}
                >
                  {isPaused ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
                </button>
              )}
              <button
                onClick={() => {
                  setAutoSpeak(!autoSpeak);
                  // Reset do último ID falado quando desabilita/habilita
                  if (!autoSpeak) {
                    setLastSpokenMessageId(null);
                    console.log('🔊 Voz automática habilitada - reset ID');
                  } else {
                    console.log('🔊 Voz automática desabilitada');
                  }
                }}
                className={`p-1.5 rounded-lg transition-colors ${
                  autoSpeak ? 'bg-green-500 text-white' : 'text-white hover:bg-blue-800'
                }`}
                title={autoSpeak ? "Desabilitar voz automática" : "Habilitar voz automática"}
              >
                {autoSpeak ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
              </button>
              {/* Botão de teste da voz */}
              <button
                onClick={() => {
                  console.log('🔊 Teste de voz iniciado');
                  speakMatias('Olá! Eu sou o Matias, seu mecânico-chefe. Estou testando minha voz.');
                }}
                className="text-white hover:bg-blue-800 p-1.5 rounded-lg transition-colors"
                title="Testar voz do Matias"
              >
                <Play className="w-4 h-4" />
              </button>
              {/* Botão de reset para casos de erro */}
              {(isSpeaking || isListening || isPreparingSpeech) && (
                <button
                  onClick={() => {
                    stopSpeech();
                    stopListening();
                    resetTranscript();
                    setLastSpokenMessageId(null); // Reset do controle de repetição
                    setIsPreparingSpeech(false); // Reset do estado de preparação
                    if (speechTimeoutRef.current) {
                      clearTimeout(speechTimeoutRef.current); // Limpar timeout pendente
                    }
                  }}
                  className="text-white hover:bg-red-600 bg-red-500 p-1.5 rounded-lg transition-colors"
                  title="Parar toda atividade de voz"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          )}
          <button
            onClick={() => setIsOpen(false)}
            className="text-white hover:bg-blue-800 p-2 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Tabs Profissionais */}
      <div className="flex border-b border-gray-200 bg-gray-50">
        <button
          onClick={() => setActiveTab('chat')}
          className={`flex-1 p-3 text-sm font-medium transition-all ${
            activeTab === 'chat'
              ? 'text-blue-600 border-b-2 border-blue-600 bg-white'
              : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100'
          }`}
        >
          <MessageCircle className="w-4 h-4 inline mr-2" />
          Consultoria
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={`flex-1 p-3 text-sm font-medium transition-all ${
            activeTab === 'history'
              ? 'text-blue-600 border-b-2 border-blue-600 bg-white'
              : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100'
          }`}
        >
          <History className="w-4 h-4 inline mr-2" />
          Histórico
        </button>
        <button
          onClick={() => setActiveTab('settings')}
          className={`flex-1 p-3 text-sm font-medium transition-all ${
            activeTab === 'settings'
              ? 'text-blue-600 border-b-2 border-blue-600 bg-white'
              : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100'
          }`}
        >
          <Settings className="w-4 h-4 inline mr-2" />
          Conta
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden">
        {activeTab === 'chat' && (
          <div className="h-full flex flex-col">
            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map((msg, index) => (
                <div
                  key={index}
                  className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[85%] rounded-xl p-4 ${
                      msg.type === 'user'
                        ? 'bg-blue-600 text-white'
                        : msg.priority === 'urgent' 
                          ? 'bg-red-50 text-gray-800 border border-red-200'
                          : msg.priority === 'high'
                          ? 'bg-orange-50 text-gray-800 border border-orange-200'
                          : 'bg-gray-50 text-gray-800 border border-gray-200'
                    }`}
                  >
                    {msg.type === 'matias' && (
                      <div className="flex items-center space-x-2 mb-3">
                        <Wrench className={`w-4 h-4 ${
                          msg.priority === 'urgent' ? 'text-red-600' :
                          msg.priority === 'high' ? 'text-orange-600' : 'text-blue-600'
                        }`} />
                        <span className={`font-bold ${
                          msg.priority === 'urgent' ? 'text-red-600' :
                          msg.priority === 'high' ? 'text-orange-600' : 'text-blue-600'
                        }`}>
                          Matias {msg.expertise && '• Especialista'}
                        </span>
                        {msg.priority === 'urgent' && (
                          <AlertTriangle className="w-4 h-4 text-red-500" />
                        )}
                      </div>
                    )}
                    
                    <div className="whitespace-pre-wrap text-sm leading-relaxed">{msg.content}</div>
                    
                    {/* Action Buttons Profissionais */}
                    {msg.actions && msg.actions.length > 0 && (
                      <div className="mt-4 space-y-2">
                        {msg.actions.map((action, actionIndex) => (
                          <button
                            key={actionIndex}
                            onClick={() => handleActionClick(action.action)}
                            className={`w-full text-left px-4 py-3 text-sm font-medium rounded-lg transition-all hover:scale-105 ${
                              action.priority === 'urgent' 
                                ? 'bg-red-600 text-white hover:bg-red-700 shadow-lg'
                                : action.priority === 'high'
                                ? 'bg-orange-500 text-white hover:bg-orange-600 shadow-md'
                                : 'bg-white border-2 border-blue-200 text-blue-700 hover:bg-blue-50 hover:border-blue-300'
                            }`}
                          >
                            {action.label}
                          </button>
                        ))}
                      </div>
                    )}
                    
                    <div className={`text-xs mt-3 ${
                      msg.type === 'user' ? 'text-blue-200' : 'text-gray-500'
                    }`}>
                      {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      {msg.type === 'matias' && msg.expertise && (
                        <span className="ml-2">• Resposta Especializada</span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              
              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 max-w-[85%]">
                    <div className="flex items-center space-x-2 mb-3">
                      <Wrench className="w-4 h-4 text-blue-600" />
                      <span className="font-bold text-blue-600">Matias • Analisando</span>
                    </div>
                    <div className="flex space-x-1 mb-2">
                      <div className="w-3 h-3 bg-blue-400 rounded-full animate-bounce"></div>
                      <div className="w-3 h-3 bg-blue-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                      <div className="w-3 h-3 bg-blue-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                    </div>
                    <div className="text-xs text-blue-600">Aplicando 15 anos de experiência técnica...</div>
                  </div>
                </div>
              )}
              
              <div ref={messagesEndRef} />
            </div>

            {/* Input Profissional com Controles de Voz */}
            <div className="border-t border-gray-200 p-4 bg-gray-50">
              {/* Indicador de Status de Voz */}
              {(isListening || speechError || isSpeaking || isPreparingSpeech || (autoSpeak && isLoading)) && (
                <div className="mb-3 p-3 rounded-lg border">
                  {isListening && (
                    <div className="flex items-center space-x-2 text-red-600">
                      <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                      <span className="text-sm font-medium">🎤 Escutando... Fale agora!</span>
                    </div>
                  )}
                  {speechError && (
                    <div className="flex items-center space-x-2 text-red-600">
                      <AlertTriangle className="w-4 h-4" />
                      <span className="text-sm">{speechError}</span>
                    </div>
                  )}
                  {isSpeaking && (
                    <div className="flex items-center space-x-2 text-blue-600">
                      <Volume2 className={`w-4 h-4 ${isPaused ? '' : 'animate-pulse'}`} />
                      <span className="text-sm font-medium">
                        🔊 Matias {isPaused ? 'pausado' : 'falando'}...
                      </span>
                      {!isPaused && (
                        <button
                          onClick={stopSpeech}
                          className="text-xs bg-red-100 text-red-600 px-2 py-1 rounded hover:bg-red-200"
                        >
                          Parar
                        </button>
                      )}
                    </div>
                  )}
                  {isPreparingSpeech && !isSpeaking && (
                    <div className="flex items-center space-x-2 text-blue-600">
                      <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse"></div>
                      <span className="text-sm font-medium">🔊 Aguardando para falar...</span>
                    </div>
                  )}
                  {autoSpeak && isLoading && !isListening && !isSpeaking && !isPreparingSpeech && (
                    <div className="flex items-center space-x-2 text-blue-600">
                      <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse"></div>
                      <span className="text-sm font-medium">🔊 Preparando resposta por voz...</span>
                    </div>
                  )}
                </div>
              )}

              <div className="flex space-x-3">
                <input
                  ref={inputRef}
                  type="text"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder={isListening ? "Fale agora... (ou digite)" : "Descreva seu problema técnico para Matias..."}
                  className={`flex-1 border rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 transition-all ${
                    isListening 
                      ? 'border-red-300 bg-red-50 focus:border-red-500 focus:ring-red-200' 
                      : 'border-gray-300 focus:border-blue-500 focus:ring-blue-200'
                  }`}
                />
                <button
                  onClick={toggleRecording}
                  className={`p-3 rounded-lg transition-all ${
                    isListening 
                      ? 'bg-red-500 text-white animate-pulse shadow-lg' 
                      : speechSupported
                      ? 'bg-blue-100 text-blue-600 hover:bg-blue-200'
                      : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                  }`}
                  title={
                    !speechSupported 
                      ? 'Reconhecimento de voz não suportado' 
                      : isListening 
                      ? 'Parar gravação de voz' 
                      : 'Gravar áudio para Matias'
                  }
                  disabled={!speechSupported}
                >
                  {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                </button>
                <button
                  onClick={handleSendMessage}
                  disabled={!message.trim()}
                  className="bg-blue-600 text-white p-3 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:scale-105"
                  title="Enviar para Matias"
                >
                  <Send className="w-5 h-5" />
                </button>
              </div>
              
              {/* Status profissional com info de voz */}
              <div className="flex items-center justify-between mt-3 text-xs text-gray-600">
                <div className="flex items-center space-x-2">
                  <CheckCircle className="w-3 h-3 text-green-500" />
                  <span>Matias Online • Resposta garantida</span>
                  {speechSupported && (
                    <>
                      <span>•</span>
                      <Mic className="w-3 h-3 text-blue-500" />
                      <span>Voz ativa</span>
                    </>
                  )}
                </div>
                <div className="flex items-center space-x-1">
                  <Clock className="w-3 h-3" />
                  <span>Tempo médio: 30s</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Outras abas permaneceram similares... */}
        {activeTab === 'history' && (
          <div className="p-4 h-full overflow-y-auto">
            <h4 className="font-bold text-gray-800 mb-4 flex items-center">
              <History className="w-5 h-5 mr-2 text-blue-600" />
              Histórico de Atendimentos
            </h4>
            <div className="space-y-4">
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <div className="flex items-center justify-between mb-2">
                  <div className="font-medium text-sm">Diagnóstico Urgente - Honda Civic</div>
                  <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">Resolvido</span>
                </div>
                <div className="text-xs text-gray-600 mb-2">15/08/2025 - 14:30 • Matias</div>
                <div className="text-sm text-gray-700">Problema: Ruído nos freios • Solução: Troca de pastilhas</div>
                <div className="text-xs text-blue-600 mt-2">⭐ Atendimento especializado • 15min</div>
              </div>
              
              <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
                <div className="flex items-center justify-between mb-2">
                  <div className="font-medium text-sm">Consultoria - Manutenção Preventiva</div>
                  <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">Agendado</span>
                </div>
                <div className="text-xs text-gray-600 mb-2">10/08/2025 - 09:15 • Matias</div>
                <div className="text-sm text-gray-700">Revisão dos 20.000km • Agenda: 20/08 - 8h00</div>
                <div className="text-xs text-orange-600 mt-2">📅 Lembrete ativo • Desconto fidelidade</div>
              </div>
              
              <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                <div className="flex items-center justify-between mb-2">
                  <div className="font-medium text-sm">Orçamento - Sistema de Freios</div>
                  <span className="text-xs bg-gray-100 text-gray-800 px-2 py-1 rounded">Concluído</span>
                </div>
                <div className="text-xs text-gray-600 mb-2">05/08/2025 - 16:45 • Matias</div>
                <div className="text-sm text-gray-700">Orçamento: R$ 450,00 • Aprovado e executado</div>
                <div className="text-xs text-green-600 mt-2">✅ Garantia 12 meses • Cliente satisfeito</div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="p-4 h-full overflow-y-auto">
            <h4 className="font-bold text-gray-800 mb-4 flex items-center">
              <User className="w-5 h-5 mr-2 text-blue-600" />
              Perfil & Configurações
            </h4>
            
            {/* Perfil do Cliente */}
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200 mb-6">
              <h5 className="font-medium text-sm mb-3 text-blue-800">Dados do Cliente</h5>
              <div className="space-y-2 text-sm">
                <div><strong>Nome:</strong> {userProfile.name}</div>
                <div><strong>Veículo:</strong> {userProfile.vehicle}</div>
                <div><strong>Fidelidade:</strong> 
                  <span className={`ml-2 px-2 py-1 rounded text-xs ${
                    userProfile.loyaltyLevel === 'Ouro' ? 'bg-yellow-100 text-yellow-800' :
                    userProfile.loyaltyLevel === 'Prata' ? 'bg-gray-100 text-gray-800' :
                    'bg-orange-100 text-orange-800'
                  }`}>
                    {userProfile.loyaltyLevel}
                  </span>
                </div>
                <div><strong>Serviços ativos:</strong> {userProfile.activeServices}</div>
              </div>
            </div>
            
            {/* Configurações */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Notificações Push</span>
                <input type="checkbox" defaultChecked className="rounded" />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Respostas por Voz</span>
                <input 
                  type="checkbox" 
                  checked={autoSpeak}
                  onChange={(e) => setAutoSpeak(e.target.checked)}
                  className="rounded" 
                  disabled={!ttsSupported}
                />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Reconhecimento de Voz</span>
                <div className="flex items-center space-x-2">
                  <input 
                    type="checkbox" 
                    checked={speechSupported}
                    disabled
                    className="rounded" 
                  />
                  <span className={`text-xs ${speechSupported ? 'text-green-600' : 'text-red-600'}`}>
                    {speechSupported ? 'Ativo' : 'Não suportado'}
                  </span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Modo Offline</span>
                <input 
                  type="checkbox" 
                  checked={offlineMode}
                  onChange={(e) => setOfflineMode(e.target.checked)}
                  className="rounded" 
                />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Lembretes Automáticos</span>
                <input type="checkbox" defaultChecked className="rounded" />
              </div>
            </div>
            
            {/* Informações sobre Recursos de Voz */}
            {(speechSupported || ttsSupported) && (
              <div className="border-t pt-4 mt-4">
                <h5 className="font-medium text-sm mb-3 flex items-center">
                  <Mic className="w-4 h-4 mr-2 text-blue-600" />
                  Recursos de Voz
                </h5>
                <div className="text-xs text-gray-600 space-y-2">
                  <div className="flex items-center justify-between">
                    <span>Reconhecimento de Fala:</span>
                    <span className={speechSupported ? 'text-green-600' : 'text-red-600'}>
                      {speechSupported ? '✅ Ativo' : '❌ Indisponível'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Síntese de Voz:</span>
                    <span className={ttsSupported ? 'text-green-600' : 'text-red-600'}>
                      {ttsSupported ? '✅ Ativo' : '❌ Indisponível'}
                    </span>
                  </div>
                  {speechSupported && (
                    <div className="text-xs text-blue-600 mt-2 p-2 bg-blue-50 rounded">
                      💡 <strong>Dica:</strong> Use o Chrome ou Edge para melhor experiência de voz
                    </div>
                  )}
                </div>
              </div>
            )}
            
            {/* Informações do Matias */}
            <div className="border-t pt-6 mt-6">
              <h5 className="font-medium text-sm mb-3 flex items-center">
                <Wrench className="w-4 h-4 mr-2 text-blue-600" />
                Sobre Matias
              </h5>
              <div className="text-xs text-gray-600 space-y-2">
                <p><strong>Versão:</strong> 1.0 Professional</p>
                <p><strong>Especialidade:</strong> Mecânico-Chefe Experiente</p>
                <p><strong>Experiência:</strong> 15 anos em automóveis</p>
                <p><strong>Certificações:</strong> Diagnóstico Avançado, Gestão</p>
                <p><strong>Disponibilidade:</strong> 24/7 para emergências</p>
                <p><strong>Idiomas:</strong> Português, Inglês</p>
              </div>
              
              <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                <div className="text-xs text-green-800 font-medium">
                  🎯 Missão: Ser o pilar de conhecimento e operação da Ofix
                </div>
                <div className="text-xs text-green-700 mt-1">
                  Fornecendo suporte instantâneo, consultoria especializada e gerenciamento eficiente
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MatiasWidgetProfessional;
