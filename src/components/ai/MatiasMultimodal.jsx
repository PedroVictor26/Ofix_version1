/**
 * 🎯 Multi-Modal Interface Component
 *
 * Advanced interface supporting multiple input modalities:
 * - Drag and drop file uploads
 * - Camera integration
 * - Voice + text simultaneous input
 * - Gesture support for mobile
 * - Rich content processing
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
    Camera, Upload, X, FileText, Image, Video, Mic, MicOff,
    Pause, Play, RotateCcw, Maximize2, Download, Share2,
    Trash2, Edit, Check, AlertCircle, Loader2, Zap,
    Smartphone, MousePointer, Touch, Eye, EyeOff,
    Volume2, VolumeX, Wifi, WifiOff, Cloud, CloudOff
} from 'lucide-react';

const MatiasMultimodal = ({
    onFileSelect = () => {},
    onVoiceRecord = () => {},
    onGestureCapture = () => {},
    onContentAnalyze = () => {},
    maxFileSize = 10 * 1024 * 1024, // 10MB
    allowedTypes = ['image/*', 'video/*', 'audio/*', '.pdf', '.doc', '.docx'],
    enableCamera = true,
    enableVoice = true,
    enableGestures = true,
    enableDragDrop = true,
    autoAnalyze = true,
    cloudSync = false,
    compressionEnabled = true
}) => {
    // State management
    const [isDragging, setIsDragging] = useState(false);
    const [isRecording, setIsRecording] = useState(false);
    const [isPaused, setIsPaused] = useState(false);
    const [cameraActive, setCameraActive] = useState(false);
    const [selectedFiles, setSelectedFiles] = useState([]);
    const [recordedChunks, setRecordedChunks] = useState([]);
    const [isProcessing, setIsProcessing] = useState(false);
    const [isOnline, setIsOnline] = useState(navigator.onLine);
    const [captureMode, setCaptureMode] = useState('photo'); // photo, video, document

    // Camera and media refs
    const fileInputRef = useRef(null);
    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const mediaRecorderRef = useRef(null);
    const cameraStreamRef = useRef(null);
    const dropZoneRef = useRef(null);
    const gestureCanvasRef = useRef(null);

    // Upload progress
    const [uploadProgress, setUploadProgress] = useState({});
    const [analysisProgress, setAnalysisProgress] = useState({});

    // Initialize component
    useEffect(() => {
        initializeMultimodalSystem();
        return () => cleanupMultimodalSystem();
    }, []);

    const initializeMultimodalSystem = async () => {
        try {
            // Check online status
            window.addEventListener('online', () => setIsOnline(true));
            window.addEventListener('offline', () => setIsOnline(false));

            // Initialize camera if available
            if (enableCamera) {
                await checkCameraAvailability();
            }

            // Initialize gesture detection
            if (enableGestures) {
                initializeGestureDetection();
            }

            // Check permissions
            await checkPermissions();

        } catch (error) {
            console.error('Error initializing multimodal system:', error);
        }
    };

    const checkCameraAvailability = async () => {
        try {
            const devices = await navigator.mediaDevices.enumerateDevices();
            const hasCamera = devices.some(device => device.kind === 'videoinput');
            if (!hasCamera) {
                console.warn('No camera devices found');
            }
        } catch (error) {
            console.warn('Camera availability check failed:', error);
        }
    };

    const initializeGestureDetection = () => {
        if (!gestureCanvasRef.current) return;

        const canvas = gestureCanvasRef.current;
        const ctx = canvas.getContext('2d');

        // Set up gesture detection canvas
        canvas.width = 320;
        canvas.height = 240;

        // Initialize TouchEvent listeners for mobile gestures
        if ('ontouchstart' in window) {
            setupTouchGestures(canvas);
        }

        // Initialize PointerEvent listeners for desktop gestures
        setupPointerGestures(canvas);
    };

    const setupTouchGestures = (canvas) => {
        let touchStartX = 0;
        let touchStartY = 0;
        let touchStartTime = 0;

        canvas.addEventListener('touchstart', (e) => {
            const touch = e.touches[0];
            touchStartX = touch.clientX;
            touchStartY = touch.clientY;
            touchStartTime = Date.now();
        });

        canvas.addEventListener('touchend', (e) => {
            const touch = e.changedTouches[0];
            const touchEndX = touch.clientX;
            const touchEndY = touch.clientY;
            const touchEndTime = Date.now();

            const gesture = analyzeGesture(
                touchStartX, touchStartY, touchEndX, touchEndY,
                touchStartTime, touchEndTime
            );

            if (gesture) {
                onGestureCapture(gesture);
            }
        });
    };

    const setupPointerGestures = (canvas) => {
        let isPointerDown = false;
        let startX = 0, startY = 0;
        let startTime = 0;

        canvas.addEventListener('pointerdown', (e) => {
            isPointerDown = true;
            startX = e.clientX;
            startY = e.clientY;
            startTime = Date.now();
        });

        canvas.addEventListener('pointerup', (e) => {
            if (!isPointerDown) return;

            isPointerDown = false;
            const gesture = analyzeGesture(
                startX, startY, e.clientX, e.clientY,
                startTime, Date.now()
            );

            if (gesture) {
                onGestureCapture(gesture);
            }
        });
    };

    const analyzeGesture = (startX, startY, endX, endY, startTime, endTime) => {
        const deltaX = endX - startX;
        const deltaY = endY - startY;
        const deltaTime = endTime - startTime;
        const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

        if (distance < 10) return null; // Too small

        const gesture = {
            type: 'unknown',
            direction: '',
            distance: distance,
            duration: deltaTime,
            velocity: distance / deltaTime,
            timestamp: new Date().toISOString()
        };

        // Determine gesture type and direction
        if (deltaTime < 200) {
            gesture.type = 'tap';
        } else if (deltaTime > 500) {
            gesture.type = 'long_press';
        } else {
            gesture.type = 'swipe';

            // Determine direction
            const angle = Math.atan2(deltaY, deltaX) * 180 / Math.PI;
            if (angle > -45 && angle <= 45) {
                gesture.direction = 'right';
            } else if (angle > 45 && angle <= 135) {
                gesture.direction = 'down';
            } else if (angle > 135 || angle <= -135) {
                gesture.direction = 'left';
            } else {
                gesture.direction = 'up';
            }
        }

        return gesture;
    };

    const checkPermissions = async () => {
        try {
            // Check camera permission
            if (enableCamera) {
                const cameraPermission = await navigator.permissions.query({ name: 'camera' });
                if (cameraPermission.state === 'denied') {
                    console.warn('Camera permission denied');
                }
            }

            // Check microphone permission
            if (enableVoice) {
                const micPermission = await navigator.permissions.query({ name: 'microphone' });
                if (micPermission.state === 'denied') {
                    console.warn('Microphone permission denied');
                }
            }
        } catch (error) {
            console.warn('Permission check failed:', error);
        }
    };

    // File handling functions
    const handleDragOver = useCallback((e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(true);
    }, []);

    const handleDragLeave = useCallback((e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
    }, []);

    const handleDrop = useCallback((e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);

        const files = Array.from(e.dataTransfer.files);
        processFiles(files);
    }, []);

    const handleFileSelect = useCallback((e) => {
        const files = Array.from(e.target.files);
        processFiles(files);
    }, []);

    const processFiles = async (files) => {
        try {
            setIsProcessing(true);

            const validFiles = files.filter(file => {
                // Check file type
                const isValidType = allowedTypes.some(type => {
                    if (type.endsWith('/*')) {
                        return file.type.startsWith(type.slice(0, -2));
                    }
                    return file.type === type || file.name.endsWith(type);
                });

                // Check file size
                const isValidSize = file.size <= maxFileSize;

                return isValidType && isValidSize;
            });

            if (validFiles.length === 0) {
                alert('Nenhum arquivo válido selecionado. Verifique o tipo e o tamanho do arquivo.');
                return;
            }

            // Process each file
            const processedFiles = await Promise.all(
                validFiles.map(file => processFile(file))
            );

            setSelectedFiles(prev => [...prev, ...processedFiles]);
            onFileSelect(processedFiles);

            // Auto-analyze if enabled
            if (autoAnalyze) {
                await analyzeFiles(processedFiles);
            }

        } catch (error) {
            console.error('Error processing files:', error);
        } finally {
            setIsProcessing(false);
        }
    };

    const processFile = async (file) => {
        const processedFile = {
            id: generateId(),
            file,
            name: file.name,
            type: file.type,
            size: file.size,
            url: URL.createObjectURL(file),
            thumbnail: null,
            metadata: await extractFileMetadata(file),
            uploadProgress: 0,
            analysisProgress: 0,
            analysisResult: null,
            uploaded: false,
            analyzed: false,
            timestamp: new Date().toISOString()
        };

        // Generate thumbnail for images
        if (file.type.startsWith('image/')) {
            processedFile.thumbnail = await generateImageThumbnail(file);
        }

        // Compress if enabled and applicable
        if (compressionEnabled && shouldCompress(file)) {
            processedFile.file = await compressFile(file);
            processedFile.size = processedFile.file.size;
        }

        return processedFile;
    };

    const extractFileMetadata = async (file) => {
        const metadata = {
            name: file.name,
            type: file.type,
            size: file.size,
            lastModified: file.lastModified
        };

        // Extract EXIF data for images
        if (file.type.startsWith('image/')) {
            try {
                const exifData = await extractImageExif(file);
                metadata.exif = exifData;
            } catch (error) {
                console.warn('Could not extract EXIF data:', error);
            }
        }

        // Extract metadata for videos
        if (file.type.startsWith('video/')) {
            try {
                const videoMetadata = await extractVideoMetadata(file);
                metadata.video = videoMetadata;
            } catch (error) {
                console.warn('Could not extract video metadata:', error);
            }
        }

        return metadata;
    };

    const extractImageExif = async (file) => {
        return new Promise((resolve) => {
            const img = new Image();
            img.onload = () => {
                resolve({
                    width: img.width,
                    height: img.height,
                    aspectRatio: img.width / img.height
                });
            };
            img.src = URL.createObjectURL(file);
        });
    };

    const extractVideoMetadata = async (file) => {
        return new Promise((resolve) => {
            const video = document.createElement('video');
            video.onloadedmetadata = () => {
                resolve({
                    duration: video.duration,
                    width: video.videoWidth,
                    height: video.videoHeight
                });
            };
            video.src = URL.createObjectURL(file);
        });
    };

    const generateImageThumbnail = async (file) => {
        return new Promise((resolve) => {
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');

                const maxSize = 200;
                const scale = Math.min(maxSize / img.width, maxSize / img.height);

                canvas.width = img.width * scale;
                canvas.height = img.height * scale;

                ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
                resolve(canvas.toDataURL('image/jpeg', 0.8));
            };
            img.src = URL.createObjectURL(file);
        });
    };

    const shouldCompress = (file) => {
        // Compress images larger than 2MB
        return file.type.startsWith('image/') && file.size > 2 * 1024 * 1024;
    };

    const compressFile = async (file) => {
        if (!file.type.startsWith('image/')) return file;

        return new Promise((resolve) => {
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');

                // Reduce dimensions for large images
                const maxWidth = 1920;
                const maxHeight = 1080;
                let { width, height } = img;

                if (width > maxWidth) {
                    height = (maxWidth / width) * height;
                    width = maxWidth;
                }

                if (height > maxHeight) {
                    width = (maxHeight / height) * width;
                    height = maxHeight;
                }

                canvas.width = width;
                canvas.height = height;

                ctx.drawImage(img, 0, 0, width, height);

                canvas.toBlob((blob) => {
                    resolve(new File([blob], file.name, { type: file.type }));
                }, file.type, 0.8);
            };
            img.src = URL.createObjectURL(file);
        });
    };

    const analyzeFiles = async (files) => {
        try {
            for (const fileData of files) {
                setAnalysisProgress(prev => ({
                    ...prev,
                    [fileData.id]: 0
                }));

                const analysisResult = await analyzeContent(fileData, (progress) => {
                    setAnalysisProgress(prev => ({
                        ...prev,
                        [fileData.id]: progress
                    }));
                });

                // Update file with analysis result
                setSelectedFiles(prev => prev.map(f =>
                    f.id === fileData.id
                        ? { ...f, analysisResult, analyzed: true }
                        : f
                ));

                onContentAnalyze(fileData, analysisResult);
            }
        } catch (error) {
            console.error('Error analyzing files:', error);
        }
    };

    const analyzeContent = async (fileData, progressCallback) => {
        // Simulate content analysis
        const steps = [
            { name: 'Carregando arquivo', weight: 20 },
            { name: 'Analisando conteúdo', weight: 40 },
            { name: 'Processando metadados', weight: 20 },
            { name: 'Gerando insights', weight: 20 }
        ];

        let currentProgress = 0;

        for (const step of steps) {
            await new Promise(resolve => setTimeout(resolve, 300));
            currentProgress += step.weight;
            progressCallback(currentProgress);
        }

        // Return mock analysis result
        return {
            type: fileData.file.type.startsWith('image/') ? 'image' : 'document',
            confidence: 0.85,
            insights: [
                `Arquivo ${fileData.name} analisado com sucesso`,
                `Tamanho: ${(fileData.size / 1024).toFixed(2)} KB`,
                `Tipo: ${fileData.type}`
            ],
            tags: ['analisado', 'processado'],
            extractedText: fileData.file.type.startsWith('image/')
                ? 'Imagem detectada com conteúdo visual'
                : 'Documento processado'
        };
    };

    // Camera functions
    const startCamera = async () => {
        try {
            const constraints = {
                video: {
                    facingMode: captureMode === 'selfie' ? 'user' : 'environment',
                    width: { ideal: 1920 },
                    height: { ideal: 1080 }
                },
                audio: captureMode === 'video'
            };

            const stream = await navigator.mediaDevices.getUserMedia(constraints);
            cameraStreamRef.current = stream;

            if (videoRef.current) {
                videoRef.current.srcObject = stream;
            }

            setCameraActive(true);

        } catch (error) {
            console.error('Error accessing camera:', error);
            alert('Não foi possível acessar a câmera. Verifique as permissões.');
        }
    };

    const stopCamera = () => {
        if (cameraStreamRef.current) {
            cameraStreamRef.current.getTracks().forEach(track => track.stop());
            cameraStreamRef.current = null;
        }

        if (videoRef.current) {
            videoRef.current.srcObject = null;
        }

        setCameraActive(false);
    };

    const capturePhoto = () => {
        if (!videoRef.current || !canvasRef.current) return;

        const video = videoRef.current;
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');

        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        ctx.drawImage(video, 0, 0);

        canvas.toBlob((blob) => {
            const file = new File([blob], `photo_${Date.now()}.jpg`, { type: 'image/jpeg' });
            processFiles([file]);
        }, 'image/jpeg', 0.9);
    };

    // Voice recording functions
    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const mediaRecorder = new MediaRecorder(stream);
            const chunks = [];

            mediaRecorder.ondataavailable = (e) => {
                if (e.data.size > 0) {
                    chunks.push(e.data);
                }
            };

            mediaRecorder.onstop = () => {
                const blob = new Blob(chunks, { type: 'audio/webm' });
                const file = new File([blob], `voice_${Date.now()}.webm`, { type: 'audio/webm' });
                processFiles([file]);
                setRecordedChunks([]);
            };

            mediaRecorderRef.current = mediaRecorder;
            mediaRecorder.start();
            setIsRecording(true);
            setRecordedChunks(chunks);

            onVoiceRecord('start');

        } catch (error) {
            console.error('Error starting recording:', error);
            alert('Não foi possível acessar o microfone. Verifique as permissões.');
        }
    };

    const stopRecording = () => {
        if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.stop();
            setIsRecording(false);

            // Stop all audio tracks
            mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());

            onVoiceRecord('stop');
        }
    };

    const pauseRecording = () => {
        if (mediaRecorderRef.current && isRecording && !isPaused) {
            mediaRecorderRef.current.pause();
            setIsPaused(true);
        }
    };

    const resumeRecording = () => {
        if (mediaRecorderRef.current && isRecording && isPaused) {
            mediaRecorderRef.current.resume();
            setIsPaused(false);
        }
    };

    // Utility functions
    const generateId = () => {
        return `mm_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    };

    const removeFile = (fileId) => {
        setSelectedFiles(prev => prev.filter(f => f.id !== fileId));
    };

    const formatFileSize = (bytes) => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    const getFileIcon = (type) => {
        if (type.startsWith('image/')) return Image;
        if (type.startsWith('video/')) return Video;
        if (type.startsWith('audio/')) return Mic;
        return FileText;
    };

    const cleanupMultimodalSystem = () => {
        stopCamera();
        if (isRecording) {
            stopRecording();
        }

        window.removeEventListener('online', () => setIsOnline(true));
        window.removeEventListener('offline', () => setIsOnline(false));
    };

    return (
        <div className="matias-multimodal">
            {/* Drag and drop zone */}
            {enableDragDrop && (
                <div
                    ref={dropZoneRef}
                    className={`
                        relative border-2 border-dashed rounded-lg p-8 text-center transition-colors
                        ${isDragging
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-300 hover:border-gray-400'
                        }
                    `}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                >
                    <input
                        ref={fileInputRef}
                        type="file"
                        multiple
                        accept={allowedTypes.join(',')}
                        onChange={handleFileSelect}
                        className="hidden"
                    />

                    <Upload className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                        Arraste arquivos para cá
                    </h3>
                    <p className="text-sm text-gray-600 mb-4">
                        ou clique para selecionar
                    </p>

                    <button
                        onClick={() => fileInputRef.current?.click()}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                        Selecionar Arquivos
                    </button>

                    <p className="text-xs text-gray-500 mt-4">
                        Máximo: {formatFileSize(maxFileSize)} • Formatos: {allowedTypes.length > 5 ? `${allowedTypes.length} tipos` : allowedTypes.join(', ')}
                    </p>

                    {!isOnline && (
                        <div className="mt-4 flex items-center justify-center gap-2 text-orange-600">
                            <WifiOff className="w-4 h-4" />
                            <span className="text-sm">Modo offline - arquivos serão sincronizados</span>
                        </div>
                    )}
                </div>
            )}

            {/* Camera interface */}
            {enableCamera && (
                <div className="mt-6">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-medium text-gray-900">Câmera</h3>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => setCaptureMode('photo')}
                                className={`px-3 py-1 rounded ${
                                    captureMode === 'photo'
                                        ? 'bg-blue-600 text-white'
                                        : 'bg-gray-200 text-gray-700'
                                }`}
                            >
                                <Camera className="w-4 h-4" /> Foto
                            </button>
                            <button
                                onClick={() => setCaptureMode('video')}
                                className={`px-3 py-1 rounded ${
                                    captureMode === 'video'
                                        ? 'bg-blue-600 text-white'
                                        : 'bg-gray-200 text-gray-700'
                                }`}
                            >
                                <Video className="w-4 h-4" /> Vídeo
                            </button>
                        </div>
                    </div>

                    {cameraActive ? (
                        <div className="relative">
                            <video
                                ref={videoRef}
                                autoPlay
                                playsInline
                                className="w-full rounded-lg bg-black"
                            />
                            <canvas ref={canvasRef} className="hidden" />

                            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-2">
                                <button
                                    onClick={capturePhoto}
                                    className="p-3 bg-white rounded-full shadow-lg hover:bg-gray-100"
                                >
                                    <Camera className="w-6 h-6 text-gray-800" />
                                </button>
                                <button
                                    onClick={stopCamera}
                                    className="p-3 bg-red-500 text-white rounded-full shadow-lg hover:bg-red-600"
                                >
                                    <X className="w-6 h-6" />
                                </button>
                            </div>
                        </div>
                    ) : (
                        <button
                            onClick={startCamera}
                            className="w-full p-4 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors flex items-center justify-center gap-2"
                        >
                            <Camera className="w-5 h-5" />
                            <span>Abrir Câmera</span>
                        </button>
                    )}
                </div>
            )}

            {/* Voice recording */}
            {enableVoice && (
                <div className="mt-6">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Gravação de Áudio</h3>

                    <div className="flex items-center justify-center gap-4">
                        <button
                            onClick={isRecording ? stopRecording : startRecording}
                            className={`
                                p-4 rounded-full transition-all duration-200
                                ${isRecording
                                    ? 'bg-red-500 text-white animate-pulse'
                                    : 'bg-blue-600 text-white hover:bg-blue-700'
                                }
                            `}
                        >
                            {isRecording ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
                        </button>

                        {isRecording && (
                            <>
                                <button
                                    onClick={isPaused ? resumeRecording : pauseRecording}
                                    className="p-3 bg-gray-200 text-gray-700 rounded-full hover:bg-gray-300"
                                >
                                    {isPaused ? <Play className="w-5 h-5" /> : <Pause className="w-5 h-5" />}
                                </button>

                                <div className="flex items-center gap-2">
                                    <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                                    <span className="text-sm text-gray-600">
                                        {isPaused ? 'Pausado' : 'Gravando...'}
                                    </span>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            )}

            {/* Gesture detection */}
            {enableGestures && (
                <div className="mt-6">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Gestos</h3>
                    <canvas
                        ref={gestureCanvasRef}
                        className="w-full border border-gray-300 rounded-lg cursor-pointer"
                        style={{ touchAction: 'none' }}
                    />
                    <p className="text-sm text-gray-600 mt-2">
                        Deslize ou toque na área acima para capturar gestos
                    </p>
                </div>
            )}

            {/* Selected files */}
            {selectedFiles.length > 0 && (
                <div className="mt-6">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">
                        Arquivos Selecionados ({selectedFiles.length})
                    </h3>

                    <div className="space-y-3">
                        {selectedFiles.map(fileData => {
                            const Icon = getFileIcon(fileData.type);
                            return (
                                <div key={fileData.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                                    {fileData.thumbnail ? (
                                        <img
                                            src={fileData.thumbnail}
                                            alt={fileData.name}
                                            className="w-12 h-12 object-cover rounded"
                                        />
                                    ) : (
                                        <div className="w-12 h-12 bg-gray-200 rounded flex items-center justify-center">
                                            <Icon className="w-6 h-6 text-gray-500" />
                                        </div>
                                    )}

                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium text-gray-900 truncate">
                                            {fileData.name}
                                        </p>
                                        <p className="text-xs text-gray-500">
                                            {formatFileSize(fileData.size)}
                                        </p>

                                        {/* Progress bars */}
                                        {fileData.uploadProgress !== undefined && fileData.uploadProgress < 100 && (
                                            <div className="mt-2">
                                                <div className="w-full bg-gray-200 rounded-full h-1">
                                                    <div
                                                        className="bg-blue-600 h-1 rounded-full transition-all duration-300"
                                                        style={{ width: `${fileData.uploadProgress}%` }}
                                                    />
                                                </div>
                                            </div>
                                        )}

                                        {fileData.analysisProgress !== undefined && fileData.analysisProgress < 100 && (
                                            <div className="mt-1">
                                                <div className="w-full bg-gray-200 rounded-full h-1">
                                                    <div
                                                        className="bg-green-600 h-1 rounded-full transition-all duration-300"
                                                        style={{ width: `${fileData.analysisProgress}%` }}
                                                    />
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    <div className="flex items-center gap-1">
                                        {fileData.analyzed && (
                                            <Check className="w-4 h-4 text-green-500" />
                                        )}
                                        {fileData.uploaded && (
                                            <Cloud className="w-4 h-4 text-blue-500" />
                                        )}
                                        <button
                                            onClick={() => removeFile(fileData.id)}
                                            className="p-1 text-red-500 hover:text-red-700"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Processing indicator */}
            {isProcessing && (
                <div className="mt-6 text-center">
                    <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2 text-blue-600" />
                    <p className="text-sm text-gray-600">Processando arquivos...</p>
                </div>
            )}
        </div>
    );
};

export default MatiasMultimodal;