/**
 * 🎤 Advanced Voice Interface Component
 *
 * Provides enhanced voice interaction with waveform visualization,
 * natural language processing, and comprehensive feedback systems
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
    Mic, MicOff, Volume2, VolumeX, Loader2, Play, Pause,
    Settings, RotateCcw, AlertCircle, CheckCircle, X,
    Zap, Activity, Wifi, WifiOff, Globe, Headphones
} from 'lucide-react';

const VoiceInterface = ({
    enabled = true,
    language = 'pt-BR',
    onTranscript = () => {},
    onError = () => {},
    onStatusChange = () => {},
    autoStart = false,
    continuousMode = false,
    noiseSuppression = true,
    visualizationEnabled = true,
    customStyles = {}
}) => {
    // Core state
    const [isActive, setIsActive] = useState(false);
    const [isListening, setIsListening] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [volume, setVolume] = useState(0);
    const [transcript, setTranscript] = useState('');
    const [interimTranscript, setInterimTranscript] = useState('');
    const [status, setStatus] = useState('ready'); // ready, listening, processing, error, speaking
    const [error, setError] = useState(null);

    // Voice settings
    const [sensitivity, setSensitivity] = useState(50);
    const [autoTimeout, setAutoTimeout] = useState(3000);
    const [voiceCommands, setVoiceCommands] = useState(true);
    const [naturalLanguage, setNaturalLanguage] = useState(true);

    // Audio context and analyzers
    const [audioContext, setAudioContext] = useState(null);
    const [analyser, setAnalyser] = useState(null);
    const [mediaRecorder, setMediaRecorder] = useState(null);
    const [stream, setStream] = useState(null);

    // Recognition and synthesis
    const [recognition, setRecognition] = useState(null);
    const [synthesis, setSynthesis] = useState(null);

    // Visualization data
    const [waveformData, setWaveformData] = useState([]);
    const [frequencyData, setFrequencyData] = useState([]);

    // Refs
    const canvasRef = useRef(null);
    const animationFrameRef = useRef(null);
    const timeoutRef = useRef(null);
    const audioBufferRef = useRef([]);

    // Initialize voice recognition and synthesis
    useEffect(() => {
        initializeVoiceSystem();
        return () => {
            cleanupVoiceSystem();
        };
    }, [language]);

    // Start listening if autoStart is enabled
    useEffect(() => {
        if (autoStart && enabled) {
            startListening();
        }
    }, [autoStart, enabled]);

    const initializeVoiceSystem = async () => {
        try {
            // Initialize speech recognition
            await initializeSpeechRecognition();

            // Initialize speech synthesis
            await initializeSpeechSynthesis();

            // Initialize audio context for visualization
            await initializeAudioContext();

            setStatus('ready');
        } catch (error) {
            console.error('Error initializing voice system:', error);
            handleVoiceError(error);
        }
    };

    const initializeSpeechRecognition = async () => {
        if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
            throw new Error('Speech recognition not supported');
        }

        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        const recognitionInstance = new SpeechRecognition();

        recognitionInstance.continuous = continuousMode;
        recognitionInstance.interimResults = true;
        recognitionInstance.lang = language;
        recognitionInstance.maxAlternatives = 3;

        if (noiseSuppression) {
            // Configure noise suppression if available
            try {
                const constraints = {
                    audio: {
                        echoCancellation: true,
                        noiseSuppression: true,
                        autoGainControl: true
                    }
                };
                await navigator.mediaDevices.getUserMedia(constraints);
            } catch (error) {
                console.warn('Noise suppression not available:', error);
            }
        }

        recognitionInstance.onstart = () => {
            setIsListening(true);
            setStatus('listening');
            setInterimTranscript('');
            onStatusChange('listening');
            startVisualization();
        };

        recognitionInstance.onresult = (event) => {
            let finalTranscript = '';
            let interimTranscriptText = '';

            for (let i = event.resultIndex; i < event.results.length; i++) {
                const result = event.results[i];
                const transcript = result[0].transcript;

                if (result.isFinal) {
                    finalTranscript += transcript;
                } else {
                    interimTranscriptText += transcript;
                }
            }

            if (finalTranscript) {
                setTranscript(prev => prev + finalTranscript);
                setInterimTranscript('');
                onTranscript(finalTranscript, true);

                // Process voice commands if enabled
                if (voiceCommands) {
                    processVoiceCommand(finalTranscript);
                }
            } else {
                setInterimTranscript(interimTranscriptText);
                onTranscript(interimTranscriptText, false);
            }

            // Reset auto timeout
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }
            timeoutRef.current = setTimeout(() => {
                if (continuousMode) {
                    // Continue listening with a pause
                    stopListening();
                    setTimeout(() => startListening(), 1000);
                }
            }, autoTimeout);
        };

        recognitionInstance.onerror = (event) => {
            console.error('Speech recognition error:', event.error);
            handleVoiceError(new Error(event.error));
        };

        recognitionInstance.onend = () => {
            setIsListening(false);
            setStatus('processing');
            stopVisualization();

            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }

            // Auto restart if in continuous mode
            if (continuousMode && isActive) {
                setTimeout(() => startListening(), 500);
            }
        };

        setRecognition(recognitionInstance);
    };

    const initializeSpeechSynthesis = async () => {
        if ('speechSynthesis' in window) {
            const synth = window.speechSynthesis;

            // Configure synthesis settings
            synth.onvoiceschanged = () => {
                const voices = synth.getVoices();
                console.log('Available voices:', voices.length);
            };

            setSynthesis(synth);
        } else {
            throw new Error('Speech synthesis not supported');
        }
    };

    const initializeAudioContext = async () => {
        try {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            const context = new AudioContext();

            const analyser = context.createAnalyser();
            analyser.fftSize = 256;
            analyser.smoothingTimeConstant = 0.8;

            setAudioContext(context);
            setAnalyser(analyser);

            return context;
        } catch (error) {
            console.error('Error initializing audio context:', error);
            throw error;
        }
    };

    const startListening = async () => {
        if (!enabled || !recognition || isListening) return;

        try {
            // Request microphone access
            const mediaStream = await navigator.mediaDevices.getUserMedia({
                audio: {
                    echoCancellation: true,
                    noiseSuppression: true,
                    autoGainControl: true,
                    sampleRate: 44100
                }
            });

            setStream(mediaStream);

            // Connect to analyzer for visualization
            if (audioContext && analyser) {
                const source = audioContext.createMediaStreamSource(mediaStream);
                source.connect(analyser);
            }

            // Start recognition
            recognition.start();
            setIsActive(true);
            setError(null);

        } catch (error) {
            console.error('Error starting voice recognition:', error);
            handleVoiceError(error);
        }
    };

    const stopListening = () => {
        if (recognition && isListening) {
            recognition.stop();
            setIsActive(false);
            setIsListening(false);

            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }

            // Stop media stream
            if (stream) {
                stream.getTracks().forEach(track => track.stop());
                setStream(null);
            }
        }
    };

    const speak = useCallback((text, options = {}) => {
        if (!synthesis || !enabled) return;

        // Cancel any ongoing speech
        synthesis.cancel();

        const utterance = new SpeechSynthesisUtterance(text);

        // Configure utterance
        utterance.lang = language;
        utterance.rate = options.rate || 1.0;
        utterance.pitch = options.pitch || 1.0;
        utterance.volume = options.volume || 0.8;

        // Select voice if specified
        if (options.voice) {
            const voices = synthesis.getVoices();
            const selectedVoice = voices.find(voice =>
                voice.name === options.voice ||
                voice.lang === options.voice
            );
            if (selectedVoice) {
                utterance.voice = selectedVoice;
            }
        }

        // Event handlers
        utterance.onstart = () => {
            setIsSpeaking(true);
            setStatus('speaking');
            onStatusChange('speaking');
        };

        utterance.onend = () => {
            setIsSpeaking(false);
            setStatus('ready');
            onStatusChange('ready');
        };

        utterance.onerror = (event) => {
            console.error('Speech synthesis error:', event);
            setIsSpeaking(false);
            handleVoiceError(new Error('Speech synthesis failed'));
        };

        synthesis.speak(utterance);
    }, [synthesis, language, enabled, onStatusChange]);

    const processVoiceCommand = (command) => {
        const normalizedCommand = command.toLowerCase().trim();

        // Predefined voice commands
        const commands = {
            'parar': () => stopListening(),
            'parar de ouvir': () => stopListening(),
            'cancelar': () => stopListening(),
            'continuar ouvindo': () => startListening(),
            'começar de novo': () => {
                setTranscript('');
                startListening();
            },
            'repetir': () => {
                if (transcript) {
                    speak(transcript);
                }
            },
            'limpar': () => {
                setTranscript('');
                setInterimTranscript('');
            },
            'ajuda': () => {
                const helpText = "Comandos de voz disponíveis: parar, continuar, limpar, ajuda, repetir, aumentar volume, diminuir volume";
                speak(helpText);
            },
            'aumentar volume': () => speak('Volume aumentado'),
            'diminuir volume': () => speak('Volume diminuído')
        };

        // Check for exact matches first
        if (commands[normalizedCommand]) {
            commands[normalizedCommand]();
            return;
        }

        // Check for partial matches
        Object.keys(commands).forEach(key => {
            if (normalizedCommand.includes(key)) {
                commands[key]();
                return;
            }
        });

        // Natural language processing for complex commands
        if (naturalLanguage) {
            processNaturalLanguageCommand(normalizedCommand);
        }
    };

    const processNaturalLanguageCommand = (command) => {
        // Simple NLP for common patterns
        const patterns = [
            {
                regex: /(agendar|marcar|reservar)/,
                action: 'scheduling',
                response: 'Iniciando agendamento. Por favor, diga o que você gostaria de agendar.'
            },
            {
                regex: /(consultar|verificar|procurar|buscar)/,
                action: 'search',
                response: 'Iniciando consulta. O que você gostaria de procurar?'
            },
            {
                regex: /(emergência|ajuda|socorro|urgente)/,
                action: 'emergency',
                response: 'Detectando emergência. Posso ajudar você agora?'
            },
            {
                regex: /(configurar|ajustar|configuração)/,
                action: 'settings',
                response: 'Abrindo configurações. O que você gostaria de ajustar?'
            }
        ];

        for (const pattern of patterns) {
            if (pattern.regex.test(command)) {
                onTranscript(command, true, {
                    intent: pattern.action,
                    response: pattern.response
                });

                if (pattern.response) {
                    speak(pattern.response);
                }
                return;
            }
        }
    };

    const startVisualization = () => {
        if (!visualizationEnabled || !canvasRef.current || !analyser) return;

        const canvas = canvasRef.current;
        const canvasContext = canvas.getContext('2d');
        const bufferLength = analyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);

        const draw = () => {
            if (!isListening && !isSpeaking) {
                cancelAnimationFrame(animationFrameRef.current);
                return;
            }

            animationFrameRef.current = requestAnimationFrame(draw);

            analyser.getByteTimeDomainData(dataArray);
            analyser.getByteFrequencyData(dataArray);

            // Clear canvas
            canvasContext.fillStyle = 'rgb(249, 250, 251)';
            canvasContext.fillRect(0, 0, canvas.width, canvas.height);

            // Draw waveform
            canvasContext.lineWidth = 2;
            canvasContext.strokeStyle = 'rgb(59, 130, 246)';
            canvasContext.beginPath();

            const sliceWidth = canvas.width / bufferLength;
            let x = 0;

            for (let i = 0; i < bufferLength; i++) {
                const v = dataArray[i] / 128.0;
                const y = v * canvas.height / 2;

                if (i === 0) {
                    canvasContext.moveTo(x, y);
                } else {
                    canvasContext.lineTo(x, y);
                }

                x += sliceWidth;
            }

            canvasContext.lineTo(canvas.width, canvas.height / 2);
            canvasContext.stroke();

            // Draw frequency bars
            const barWidth = (canvas.width / bufferLength) * 2.5;
            let barX = 0;

            for (let i = 0; i < bufferLength; i++) {
                const barHeight = (dataArray[i] / 255) * canvas.height;

                const r = barHeight + 25 * (i / bufferLength);
                const g = 250 * (i / bufferLength);
                const b = 50;

                canvasContext.fillStyle = `rgb(${r}, ${g}, ${b})`;
                canvasContext.fillRect(barX, canvas.height - barHeight, barWidth, barHeight);

                barX += barWidth + 1;
            }

            // Update volume
            const average = dataArray.reduce((a, b) => a + b) / dataArray.length;
            setVolume(Math.min(100, (average / 128) * 100));

            // Update wave data for external use
            setWaveformData(Array.from(dataArray));
            setFrequencyData(Array.from(dataArray));
        };

        draw();
    };

    const stopVisualization = () => {
        if (animationFrameRef.current) {
            cancelAnimationFrame(animationFrameRef.current);
        }
    };

    const handleVoiceError = (error) => {
        setError(error);
        setStatus('error');
        setIsListening(false);
        setIsActive(false);
        onError(error);

        // Provide user-friendly error messages
        const errorMessages = {
            'not-allowed': 'Por favor, permita o acesso ao microfone nas configurações do navegador',
            'not-found': 'Nenhum microfone encontrado. Verifique se há um microfone conectado',
            'network': 'Erro de conexão. Verifique sua internet e tente novamente',
            'no-speech': 'Nenhuma fala detectada. Tente novamente falando mais claramente'
        };

        const userMessage = errorMessages[error.name] ||
            'Ocorreu um erro no reconhecimento de voz. Tente novamente.';

        setTimeout(() => {
            if (enabled) {
                speak(userMessage);
            }
        }, 1000);
    };

    const cleanupVoiceSystem = () => {
        if (recognition) {
            recognition.stop();
            recognition.abort();
        }

        if (synthesis) {
            synthesis.cancel();
        }

        if (stream) {
            stream.getTracks().forEach(track => track.stop());
        }

        if (audioContext && audioContext.state !== 'closed') {
            audioContext.close();
        }

        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
        }

        if (animationFrameRef.current) {
            cancelAnimationFrame(animationFrameRef.current);
        }
    };

    const resetTranscript = () => {
        setTranscript('');
        setInterimTranscript('');
        setError(null);
        setStatus('ready');
    };

    const getStatusIcon = () => {
        switch (status) {
            case 'listening':
                return <Activity className="w-4 h-4 text-green-500 animate-pulse" />;
            case 'processing':
                return <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />;
            case 'speaking':
                return <Volume2 className="w-4 h-4 text-purple-500 animate-pulse" />;
            case 'error':
                return <AlertCircle className="w-4 h-4 text-red-500" />;
            default:
                return <Mic className="w-4 h-4 text-gray-500" />;
        }
    };

    const getStatusColor = () => {
        switch (status) {
            case 'listening':
                return 'border-green-500 bg-green-50';
            case 'processing':
                return 'border-blue-500 bg-blue-50';
            case 'speaking':
                return 'border-purple-500 bg-purple-50';
            case 'error':
                return 'border-red-500 bg-red-50';
            default:
                return 'border-gray-300 bg-white';
        }
    };

    if (!enabled) {
        return (
            <div className="flex items-center gap-2 p-2 bg-gray-100 rounded-lg">
                <MicOff className="w-4 h-4 text-gray-400" />
                <span className="text-sm text-gray-500">Voz desativada</span>
            </div>
        );
    }

    return (
        <div className="voice-interface" style={customStyles}>
            {/* Main voice control */}
            <div className={`
                relative border-2 rounded-xl p-4 transition-all duration-300
                ${getStatusColor()}
            `}>
                {/* Status indicator */}
                <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                        {getStatusIcon()}
                        <span className="text-sm font-medium capitalize">
                            {status === 'ready' && 'Pronto para ouvir'}
                            {status === 'listening' && 'Ouvindo...'}
                            {status === 'processing' && 'Processando...'}
                            {status === 'speaking' && 'Falando...'}
                            {status === 'error' && 'Erro'}
                        </span>
                    </div>

                    <div className="flex items-center gap-2">
                        {/* Volume indicator */}
                        <div className="flex items-center gap-1">
                            {isListening && (
                                <div className="w-16 h-2 bg-gray-200 rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-green-500 transition-all duration-100"
                                        style={{ width: `${volume}%` }}
                                    />
                                </div>
                            )}
                            <Volume2 className="w-4 h-4 text-gray-600" />
                        </div>

                        {/* Control buttons */}
                        <button
                            onClick={isActive ? stopListening : startListening}
                            disabled={status === 'speaking'}
                            className={`
                                p-2 rounded-lg transition-all duration-200
                                ${isActive
                                    ? 'bg-red-500 text-white hover:bg-red-600'
                                    : 'bg-blue-500 text-white hover:bg-blue-600'
                                }
                                ${status === 'speaking' ? 'opacity-50 cursor-not-allowed' : ''}
                            `}
                            title={isActive ? 'Parar de ouvir' : 'Começar a ouvir'}
                        >
                            {isActive ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                        </button>

                        <button
                            onClick={resetTranscript}
                            className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                            title="Limpar transcrição"
                        >
                            <RotateCcw className="w-4 h-4" />
                        </button>

                        <button
                            onClick={() => speak(transcript)}
                            disabled={!transcript.trim() || isSpeaking}
                            className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
                            title="Repetir texto"
                        >
                            <Play className="w-4 h-4" />
                        </button>
                    </div>
                </div>

                {/* Visualization canvas */}
                {visualizationEnabled && (isListening || isSpeaking) && (
                    <div className="mb-3">
                        <canvas
                            ref={canvasRef}
                            width={400}
                            height={100}
                            className="w-full h-24 rounded-lg border border-gray-200 bg-gray-50"
                        />
                    </div>
                )}

                {/* Transcript display */}
                <div className="space-y-2">
                    <div className="min-h-[60px] p-3 bg-gray-50 rounded-lg">
                        <div className="text-sm text-gray-900">
                            {transcript || (
                                <span className="text-gray-400 italic">
                                    {status === 'listening' ? 'Comece a falar...' : 'Nenhuma transcrição ainda'}
                                </span>
                            )}
                        </div>

                        {interimTranscript && (
                            <div className="text-sm text-gray-500 italic mt-1">
                                {interimTranscript}
                            </div>
                        )}
                    </div>

                    {/* Error display */}
                    {error && (
                        <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                            <AlertCircle className="w-4 h-4 text-red-500" />
                            <span className="text-sm text-red-700">
                                {error.message || 'Erro no reconhecimento de voz'}
                            </span>
                            <button
                                onClick={() => setError(null)}
                                className="ml-auto text-red-500 hover:text-red-700"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                    )}
                </div>

                {/* Voice settings panel */}
                <div className="mt-4 pt-3 border-t border-gray-200">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                            <label className="flex items-center justify-between mb-1">
                                <span className="text-gray-600">Sensibilidade</span>
                                <span className="text-gray-500">{sensitivity}%</span>
                            </label>
                            <input
                                type="range"
                                min="0"
                                max="100"
                                value={sensitivity}
                                onChange={(e) => setSensitivity(parseInt(e.target.value))}
                                className="w-full"
                                disabled={isListening}
                            />
                        </div>

                        <div>
                            <label className="flex items-center justify-between mb-1">
                                <span className="text-gray-600">Timeout (ms)</span>
                                <span className="text-gray-500">{autoTimeout}</span>
                            </label>
                            <input
                                type="range"
                                min="1000"
                                max="10000"
                                step="500"
                                value={autoTimeout}
                                onChange={(e) => setAutoTimeout(parseInt(e.target.value))}
                                className="w-full"
                                disabled={isListening}
                            />
                        </div>
                    </div>

                    <div className="flex items-center gap-4 mt-3 text-xs text-gray-500">
                        <label className="flex items-center gap-1">
                            <input
                                type="checkbox"
                                checked={voiceCommands}
                                onChange={(e) => setVoiceCommands(e.target.checked)}
                                disabled={isListening}
                            />
                            <span>Comandos de voz</span>
                        </label>

                        <label className="flex items-center gap-1">
                            <input
                                type="checkbox"
                                checked={naturalLanguage}
                                onChange={(e) => setNaturalLanguage(e.target.checked)}
                                disabled={isListening}
                            />
                            <span>Processamento natural</span>
                        </label>

                        <label className="flex items-center gap-1">
                            <input
                                type="checkbox"
                                checked={continuousMode}
                                onChange={(e) => setContinuousMode(e.target.checked)}
                                disabled={isListening}
                            />
                            <span>Modo contínuo</span>
                        </label>
                    </div>
                </div>

                {/* Language and connection status */}
                <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-200 text-xs text-gray-500">
                    <div className="flex items-center gap-2">
                        <Globe className="w-3 h-3" />
                        <span>{language.toUpperCase()}</span>
                    </div>

                    <div className="flex items-center gap-2">
                        {enabled ? (
                            <Wifi className="w-3 h-3 text-green-500" />
                        ) : (
                            <WifiOff className="w-3 h-3 text-red-500" />
                        )}
                        <span>{enabled ? 'Online' : 'Offline'}</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default VoiceInterface;