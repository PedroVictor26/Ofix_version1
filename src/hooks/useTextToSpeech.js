import { useState, useEffect, useRef } from 'react';

/**
 * Hook personalizado para síntese de voz (Text-to-Speech)
 * Utiliza a Web Speech Synthesis API nativa do navegador
 */
export const useTextToSpeech = () => {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  const [voices, setVoices] = useState([]);
  const [selectedVoice, setSelectedVoice] = useState(null);
  const [rate, setRate] = useState(1.2); // ⚡ Velocidade padrão mais rápida
  const [pitch, setPitch] = useState(1);
  const [volume, setVolume] = useState(1);

  const utteranceRef = useRef(null);

  useEffect(() => {
    if ('speechSynthesis' in window) {
      setIsSupported(true);
      
      // Carregar vozes disponíveis
      const loadVoices = () => {
        const availableVoices = speechSynthesis.getVoices();
        setVoices(availableVoices);
        
        // Tentar encontrar uma voz em português brasileiro
        const portugueseVoice = availableVoices.find(voice => 
          voice.lang.includes('pt-BR') || voice.lang.includes('pt')
        );
        
        if (portugueseVoice) {
          setSelectedVoice(portugueseVoice);
        } else if (availableVoices.length > 0) {
          setSelectedVoice(availableVoices[0]);
        }
      };

      loadVoices();
      
      // Algumas vezes as vozes não carregam imediatamente
      speechSynthesis.onvoiceschanged = loadVoices;
    } else {
      setIsSupported(false);
    }
  }, []);

  const speak = (text, options = {}) => {
    console.log('🔊 Hook speak chamado com texto:', text?.substring(0, 50) + '...');
    console.log('🔊 Opções:', options);
    
    if (!isSupported || !text.trim()) {
      console.log('❌ Não suportado ou texto vazio, não falando');
      return;
    }

    // Parar qualquer fala em andamento antes de iniciar nova
    if (isSpeaking) {
      console.log('🔊 Parando fala anterior...');
      speechSynthesis.cancel();
      setIsSpeaking(false);
      setIsPaused(false);
    }

    // Limpar texto de markdown e formatação
    const cleanText = text
      .replace(/[*_~`#]/g, '') // Remove markdown
      .replace(/\*\*(.*?)\*\*/g, '$1') // Remove bold
      .replace(/__(.*?)__/g, '$1') // Remove underline
      .replace(/\[(.*?)\]/g, '') // Remove colchetes
      .replace(/\n+/g, '. ') // Quebras de linha viram pausas
      .replace(/[\u{1F300}-\u{1F9FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/gu, '') // Remove emojis
      .trim();

    console.log('🔊 Texto limpo:', cleanText.substring(0, 50) + '...');

    if (!cleanText) {
      console.log('❌ Texto limpo vazio, não falando');
      return;
    }

    // Aguardar um pequeno delay para garantir que speechSynthesis.cancel() foi processado
    setTimeout(() => {
      console.log('🔊 Criando utterance...');
      const utterance = new SpeechSynthesisUtterance(cleanText);
      
      // Configurações da voz
      utterance.voice = selectedVoice || voices[0];
      utterance.rate = options.rate || rate;
      utterance.pitch = options.pitch || pitch;
      utterance.volume = options.volume || volume;

      console.log('🔊 Configurações:', {
        voice: utterance.voice?.name,
        rate: utterance.rate,
        pitch: utterance.pitch,
        volume: utterance.volume
      });

      // Event listeners
      utterance.onstart = () => {
        setIsSpeaking(true);
        setIsPaused(false);
        console.log('🔊 Matias começou a falar');
      };

      utterance.onend = () => {
        setIsSpeaking(false);
        setIsPaused(false);
        console.log('🔊 Matias terminou de falar');
      };

      utterance.onerror = (event) => {
        // Ignorar erros de 'interrupted' pois são esperados quando cancelamos
        if (event.error !== 'interrupted') {
          console.error('❌ Erro na síntese de voz:', event.error);
        }
        setIsSpeaking(false);
        setIsPaused(false);
      };

      utterance.onpause = () => {
        setIsPaused(true);
        console.log('🔊 Matias pausou');
      };

      utterance.onresume = () => {
        setIsPaused(false);
        console.log('🔊 Matias retomou');
      };

      utteranceRef.current = utterance;
      console.log('🔊 Iniciando speechSynthesis.speak...');
      speechSynthesis.speak(utterance);
    }, 100);
  };

  const pause = () => {
    if (isSpeaking && !isPaused) {
      speechSynthesis.pause();
    }
  };

  const resume = () => {
    if (isSpeaking && isPaused) {
      speechSynthesis.resume();
    }
  };

  const stop = () => {
    speechSynthesis.cancel();
    setIsSpeaking(false);
    setIsPaused(false);
  };

  const speakMatias = (text) => {
    console.log('🔊 speakMatias chamado com texto:', text?.substring(0, 100) + '...');
    
    // Configurações específicas para o Matias - voz mais rápida e profissional
    // Limitar o tamanho do texto para evitar falas muito longas
    let textToSpeak = text;
    
    // Se o texto for muito longo, pegar apenas os primeiros parágrafos
    if (text.length > 500) {
      const lines = text.split('\n');
      const shortText = [];
      let charCount = 0;
      
      for (const line of lines) {
        if (charCount + line.length > 500) break;
        shortText.push(line);
        charCount += line.length;
      }
      
      textToSpeak = shortText.join('\n');
      
      // Se ainda for muito longo, pegar apenas as primeiras 2 frases
      if (textToSpeak.length > 300) {
        const sentences = textToSpeak.split(/[.!?]+/);
        textToSpeak = sentences.slice(0, 2).join('. ') + '.';
      }
      
      console.log('🔊 Texto encurtado para:', textToSpeak);
    }
    
    console.log('🔊 Iniciando speak com configurações Matias - VELOCIDADE ACELERADA');
    speak(textToSpeak, {
      rate: 1.3,  // ⚡ ACELERADO: Mais rápido para eficiência
      pitch: 0.8, // Tom mais grave para parecer experiente
      volume: 1   // Volume máximo para autoridade
    });
  };

  return {
    isSupported,
    isSpeaking,
    isPaused,
    voices,
    selectedVoice,
    rate,
    pitch,
    volume,
    speak,
    speakMatias,
    pause,
    resume,
    stop,
    setSelectedVoice,
    setRate,
    setPitch,
    setVolume
  };
};
