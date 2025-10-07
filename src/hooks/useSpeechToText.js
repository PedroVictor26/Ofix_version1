import { useState, useEffect, useRef } from 'react';

/**
 * Hook personalizado para reconhecimento de voz (Speech-to-Text)
 * Utiliza a Web Speech API nativa do navegador
 */
export const useSpeechToText = () => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [isSupported, setIsSupported] = useState(false);
  const [error, setError] = useState(null);
  
  const recognitionRef = useRef(null);
  const timeoutRef = useRef(null);

  useEffect(() => {
    // Verificar se o navegador suporta Web Speech API
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    
    if (SpeechRecognition) {
      setIsSupported(true);
      
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'pt-BR';
      recognition.maxAlternatives = 1;

      recognition.onstart = () => {
        console.log('🎤 Reconhecimento de voz iniciado');
        setIsListening(true);
        setError(null);
      };

      recognition.onresult = (event) => {
        let finalTranscript = '';
        let interimTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += transcript;
          } else {
            interimTranscript += transcript;
          }
        }

        setTranscript(finalTranscript || interimTranscript);
        
        // Auto-parar após 3 segundos de silêncio se houver transcript final
        if (finalTranscript) {
          clearTimeout(timeoutRef.current);
          timeoutRef.current = setTimeout(() => {
            stopListening();
          }, 3000);
        }
      };

      recognition.onerror = (event) => {
        console.error('Erro no reconhecimento de voz:', event.error);
        setError(`Erro: ${event.error}`);
        setIsListening(false);
      };

      recognition.onend = () => {
        console.log('🎤 Reconhecimento de voz finalizado');
        setIsListening(false);
      };

      recognitionRef.current = recognition;
    } else {
      setIsSupported(false);
      setError('Seu navegador não suporta reconhecimento de voz');
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const startListening = () => {
    if (recognitionRef.current && !isListening) {
      setTranscript('');
      setError(null);
      try {
        recognitionRef.current.start();
      } catch (error) {
        console.error('Erro ao iniciar reconhecimento:', error);
        setError('Erro ao iniciar reconhecimento de voz');
      }
    }
  };

  const stopListening = () => {
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop();
      clearTimeout(timeoutRef.current);
    }
  };

  const resetTranscript = () => {
    setTranscript('');
    setError(null);
  };

  return {
    isListening,
    transcript,
    isSupported,
    error,
    startListening,
    stopListening,
    resetTranscript
  };
};
