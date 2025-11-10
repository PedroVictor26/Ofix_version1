/**
 * ♿ Comprehensive Screen Reader Support Component
 *
 * Provides WCAG 2.1 AA compliant accessibility features including:
 * - Screen reader announcements
 * - ARIA labels and descriptions
 * - Focus management
 * - Keyboard navigation
 * - High contrast mode support
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Volume2, VolumeX, Eye, EyeOff, Keyboard, Mouse, Smartphone } from 'lucide-react';

const ScreenReaderSupport = ({
    children,
    announcements = [],
    autoAnnounce = true,
    highContrast = false,
    reducedMotion = false,
    fontSize = 'medium', // small, medium, large, extra-large
    onAccessibilityChange = () => {}
}) => {
    // Accessibility state
    const [screenReaderEnabled, setScreenReaderEnabled] = useState(false);
    const [keyboardNavigation, setKeyboardNavigation] = useState(false);
    const [focusVisible, setFocusVisible] = useState(false);
    const [currentAnnouncement, setCurrentAnnouncement] = useState('');
    const [announcedItems, setAnnouncedItems] = useState(new Set());

    // User preferences
    const [userPreferences, setUserPreferences] = useState({
        reducedMotion: false,
        highContrast: false,
        fontSize: 'medium',
        screenReader: false,
        keyboardOnly: false
    });

    // Refs
    const liveRegionRef = useRef(null);
    const politeRegionRef = useRef(null);
    const assertiveRegionRef = useRef(null);
    const focusContainerRef = useRef(null);
    const lastFocusedElementRef = useRef(null);

    // Initialize accessibility features
    useEffect(() => {
        initializeAccessibility();
        detectUserPreferences();
        setupKeyboardListeners();
        setupScreenReaderDetection();

        return () => {
            cleanupAccessibility();
        };
    }, []);

    const initializeAccessibility = async () => {
        try {
            // Check for accessibility API support
            const hasAccessibilityAPI = 'ariaLive' in document.createElement('div');

            if (!hasAccessibilityAPI) {
                console.warn('Accessibility API not supported');
                return;
            }

            // Load saved preferences
            await loadAccessibilityPreferences();

            // Apply initial accessibility settings
            applyAccessibilitySettings();

        } catch (error) {
            console.error('Error initializing accessibility:', error);
        }
    };

    const detectUserPreferences = () => {
        // Detect motion preferences
        const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

        // Detect contrast preferences
        const prefersHighContrast = window.matchMedia('(prefers-contrast: high)').matches;

        // Detect screen reader usage (heuristics)
        const possibleScreenReader =
            navigator.userAgent.includes('NVDA') ||
            navigator.userAgent.includes('JAWS') ||
            window.speechSynthesis?.getVoices().length > 0 ||
            document.body.getAttribute('aria-live') !== null;

        setUserPreferences(prev => ({
            ...prev,
            reducedMotion: prefersReducedMotion,
            highContrast: prefersHighContrast,
            screenReader: possibleScreenReader
        }));

        setScreenReaderEnabled(possibleScreenReader);
        setReducedMotion(prefersReducedMotion);
        setHighContrastMode(prefersHighContrast);
    };

    const setupKeyboardListeners = () => {
        // Detect keyboard-only navigation
        const handleKeyDown = (event) => {
            if (event.key === 'Tab') {
                setKeyboardNavigation(true);
                setFocusVisible(true);
            }

            // Accessibility shortcuts
            if (event.altKey) {
                switch (event.key) {
                    case '1':
                        event.preventDefault();
                        announceToScreenReader('Modo de leitor de tela ativado');
                        break;
                    case '2':
                        event.preventDefault();
                        toggleHighContrast();
                        break;
                    case '3':
                        event.preventDefault();
                        cycleFontSize();
                        break;
                    case '4':
                        event.preventDefault();
                        toggleReducedMotion();
                        break;
                }
            }
        };

        const handleMouseDown = () => {
            setKeyboardNavigation(false);
            setFocusVisible(false);
        };

        document.addEventListener('keydown', handleKeyDown);
        document.addEventListener('mousedown', handleMouseDown);

        return () => {
            document.removeEventListener('keydown', handleKeyDown);
            document.removeEventListener('mousedown', handleMouseDown);
        };
    };

    const setupScreenReaderDetection = () => {
        // Additional screen reader detection techniques
        const checkScreenReader = () => {
            const hasAriaLivePolite = document.querySelector('[aria-live="polite"]') !== null;
            const hasScreenReaderStyles = getComputedStyle(document.body).getPropertyValue('--sr-only') !== '';
            const hasVoiceOver = /iPhone|iPad|iPod/.test(navigator.userAgent) && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

            const detected = hasAriaLivePolite || hasScreenReaderStyles || hasVoiceOver;
            setScreenReaderEnabled(detected);
        };

        // Periodically check for screen reader
        const interval = setInterval(checkScreenReader, 5000);

        return () => clearInterval(interval);
    };

    const loadAccessibilityPreferences = async () => {
        try {
            const saved = localStorage.getItem('matias_accessibility_preferences');
            if (saved) {
                const preferences = JSON.parse(saved);
                setUserPreferences(preferences);
            }
        } catch (error) {
            console.warn('Error loading accessibility preferences:', error);
        }
    };

    const saveAccessibilityPreferences = async (preferences) => {
        try {
            localStorage.setItem('matias_accessibility_preferences', JSON.stringify(preferences));
        } catch (error) {
            console.warn('Error saving accessibility preferences:', error);
        }
    };

    const applyAccessibilitySettings = () => {
        // Apply high contrast mode
        if (userPreferences.highContrast || highContrast) {
            document.body.classList.add('high-contrast');
        }

        // Apply reduced motion
        if (userPreferences.reducedMotion || reducedMotion) {
            document.body.classList.add('reduced-motion');
        }

        // Apply font size
        document.body.classList.remove('font-small', 'font-medium', 'font-large', 'font-extra-large');
        document.body.classList.add(`font-${userPreferences.fontSize || fontSize}`);

        // Apply screen reader specific styles
        if (userPreferences.screenReader || screenReaderEnabled) {
            document.body.classList.add('screen-reader-active');
        }
    };

    // Announcement functions
    const announceToScreenReader = useCallback((message, priority = 'polite') => {
        if (!screenReaderEnabled) return;

        const messageId = `${message}_${Date.now()}`;

        // Prevent duplicate announcements
        if (announcedItems.has(messageId)) return;

        setAnnouncedItems(prev => new Set(prev).add(messageId));

        // Choose appropriate live region
        let region;
        switch (priority) {
            case 'assertive':
                region = assertiveRegionRef.current;
                break;
            case 'polite':
                region = politeRegionRef.current;
                break;
            default:
                region = liveRegionRef.current;
        }

        if (region) {
            region.textContent = message;

            // Clear announcement after it's read
            setTimeout(() => {
                region.textContent = '';
                setAnnouncedItems(prev => {
                    const newSet = new Set(prev);
                    newSet.delete(messageId);
                    return newSet;
                });
            }, 1000);
        }

        // Also use speech synthesis if available
        if (window.speechSynthesis && userPreferences.screenReader) {
            speakMessage(message);
        }
    }, [screenReaderEnabled, announcedItems, userPreferences]);

    const speakMessage = (text) => {
        if (!window.speechSynthesis) return;

        // Cancel any ongoing speech
        window.speechSynthesis.cancel();

        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'pt-BR';
        utterance.rate = 1.2;
        utterance.pitch = 1;
        utterance.volume = 0.8;

        window.speechSynthesis.speak(utterance);
    };

    // Accessibility settings functions
    const toggleScreenReader = () => {
        const newSettings = {
            ...userPreferences,
            screenReader: !userPreferences.screenReader
        };

        setUserPreferences(newSettings);
        setScreenReaderEnabled(newSettings.screenReader);
        saveAccessibilityPreferences(newSettings);
        applyAccessibilitySettings();

        announceToScreenReader(
            newSettings.screenReader
                ? 'Modo leitor de tela ativado'
                : 'Modo leitor de tela desativado'
        );

        onAccessibilityChange('screenReader', newSettings.screenReader);
    };

    const toggleHighContrast = () => {
        const newSettings = {
            ...userPreferences,
            highContrast: !userPreferences.highContrast
        };

        setUserPreferences(newSettings);
        setHighContrastMode(newSettings.highContrast);
        saveAccessibilityPreferences(newSettings);
        applyAccessibilitySettings();

        announceToScreenReader(
            newSettings.highContrast
                ? 'Modo alto contraste ativado'
                : 'Modo alto contraste desativado'
        );

        onAccessibilityChange('highContrast', newSettings.highContrast);
    };

    const toggleReducedMotion = () => {
        const newSettings = {
            ...userPreferences,
            reducedMotion: !userPreferences.reducedMotion
        };

        setUserPreferences(newSettings);
        setReducedMotion(newSettings.reducedMotion);
        saveAccessibilityPreferences(newSettings);
        applyAccessibilitySettings();

        announceToScreenReader(
            newSettings.reducedMotion
                ? 'Animações reduzidas ativadas'
                : 'Animações reduzidas desativadas'
        );

        onAccessibilityChange('reducedMotion', newSettings.reducedMotion);
    };

    const cycleFontSize = () => {
        const sizes = ['small', 'medium', 'large', 'extra-large'];
        const currentIndex = sizes.indexOf(userPreferences.fontSize || 'medium');
        const nextIndex = (currentIndex + 1) % sizes.length;
        const nextSize = sizes[nextIndex];

        const newSettings = {
            ...userPreferences,
            fontSize: nextSize
        };

        setUserPreferences(newSettings);
        saveAccessibilityPreferences(newSettings);
        applyAccessibilitySettings();

        const sizeLabels = {
            small: 'Pequeno',
            medium: 'Médio',
            large: 'Grande',
            'extra-large': 'Extra Grande'
        };

        announceToScreenReader(`Tamanho da fonte alterado para ${sizeLabels[nextSize]}`);
        onAccessibilityChange('fontSize', nextSize);
    };

    const setHighContrastMode = (enabled) => {
        const newSettings = {
            ...userPreferences,
            highContrast: enabled
        };

        setUserPreferences(newSettings);
        setHighContrastMode(enabled);
        saveAccessibilityPreferences(newSettings);
        applyAccessibilitySettings();
    };

    const setReducedMotion = (enabled) => {
        const newSettings = {
            ...userPreferences,
            reducedMotion: enabled
        };

        setUserPreferences(newSettings);
        setReducedMotion(enabled);
        saveAccessibilityPreferences(newSettings);
        applyAccessibilitySettings();
    };

    // Focus management
    const setFocusToElement = (element) => {
        if (element) {
            lastFocusedElementRef.current = document.activeElement;
            element.focus();
            announceToScreenReader(`Foco movido para ${element.getAttribute('aria-label') || 'elemento'}`);
        }
    };

    const restoreFocus = () => {
        if (lastFocusedElementRef.current && lastFocusedElementRef.current.focus) {
            lastFocusedElementRef.current.focus();
        }
    };

    const trapFocus = (container) => {
        const focusableElements = container.querySelectorAll(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );

        const firstFocusable = focusableElements[0];
        const lastFocusable = focusableElements[focusableElements.length - 1];

        const handleTabKey = (e) => {
            if (e.key === 'Tab') {
                if (e.shiftKey) {
                    if (document.activeElement === firstFocusable) {
                        lastFocusable.focus();
                        e.preventDefault();
                    }
                } else {
                    if (document.activeElement === lastFocusable) {
                        firstFocusable.focus();
                        e.preventDefault();
                    }
                }
            }
        };

        container.addEventListener('keydown', handleTabKey);
        firstFocusable?.focus();

        return () => {
            container.removeEventListener('keydown', handleTabKey);
        };
    };

    // Auto-announcements
    useEffect(() => {
        if (autoAnnounce && announcements.length > 0) {
            const latest = announcements[announcements.length - 1];
            announceToScreenReader(latest.message, latest.priority);
        }
    }, [announcements, autoAnnounce]);

    const cleanupAccessibility = () => {
        // Remove accessibility classes
        document.body.classList.remove(
            'high-contrast',
            'reduced-motion',
            'screen-reader-active',
            'font-small',
            'font-medium',
            'font-large',
            'font-extra-large'
        );
    };

    return (
        <div
            ref={focusContainerRef}
            className={`accessibility-container ${
                keyboardNavigation ? 'keyboard-navigation' : ''
            } ${focusVisible ? 'focus-visible' : ''}`}
            role="application"
            aria-label="Assistente Matias"
        >
            {/* Screen reader only content */}
            <div className="sr-only" aria-hidden="true">
                <div
                    ref={liveRegionRef}
                    aria-live="polite"
                    aria-atomic="true"
                    className="sr-only"
                />
                <div
                    ref={politeRegionRef}
                    aria-live="polite"
                    aria-atomic="true"
                    className="sr-only"
                />
                <div
                    ref={assertiveRegionRef}
                    aria-live="assertive"
                    aria-atomic="true"
                    className="sr-only"
                />
            </div>

            {/* Accessibility controls (visible when keyboard navigation) */}
            {keyboardNavigation && (
                <div className="accessibility-controls fixed top-4 left-4 z-50 bg-white border-2 border-blue-500 rounded-lg p-4 shadow-lg">
                    <h3 className="text-lg font-semibold mb-3 text-blue-800">Controles de Acessibilidade</h3>

                    <div className="space-y-2">
                        <button
                            onClick={toggleScreenReader}
                            className="flex items-center gap-2 px-3 py-2 bg-blue-100 hover:bg-blue-200 rounded transition-colors"
                            aria-label={screenReaderEnabled ? 'Desativar leitor de tela' : 'Ativar leitor de tela'}
                        >
                            {screenReaderEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
                            <span>Leitor de Tela</span>
                        </button>

                        <button
                            onClick={toggleHighContrast}
                            className="flex items-center gap-2 px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded transition-colors"
                            aria-label={userPreferences.highContrast ? 'Desativar alto contraste' : 'Ativar alto contraste'}
                        >
                            {userPreferences.highContrast ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                            <span>Alto Contraste</span>
                        </button>

                        <button
                            onClick={toggleReducedMotion}
                            className="flex items-center gap-2 px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded transition-colors"
                            aria-label={userPreferences.reducedMotion ? 'Desativar animações reduzidas' : 'Ativar animações reduzidas'}
                        >
                            <span>⏸️</span>
                            <span>Animações</span>
                        </button>

                        <button
                            onClick={cycleFontSize}
                            className="flex items-center gap-2 px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded transition-colors"
                            aria-label="Alterar tamanho da fonte"
                        >
                            <span>🔤</span>
                            <span>Tamanho Fonte</span>
                        </button>
                    </div>

                    <div className="mt-3 pt-3 border-t border-gray-300">
                        <p className="text-sm text-gray-600">
                            <strong>Atalhos:</strong><br/>
                            Alt+1: Leitor de tela<br/>
                            Alt+2: Alto contraste<br/>
                            Alt+3: Tamanho da fonte<br/>
                            Alt+4: Animações
                        </p>
                    </div>
                </div>
            )}

            {/* Visual indicators */}
            <div className="accessibility-indicators fixed bottom-4 left-4 flex gap-2">
                {screenReaderEnabled && (
                    <div
                        className="bg-green-500 text-white px-2 py-1 rounded text-xs flex items-center gap-1"
                        aria-label="Leitor de tela ativado"
                    >
                        <Volume2 className="w-3 h-3" />
                        SR
                    </div>
                )}

                {userPreferences.highContrast && (
                    <div
                        className="bg-blue-500 text-white px-2 py-1 rounded text-xs flex items-center gap-1"
                        aria-label="Alto contraste ativado"
                    >
                        <Eye className="w-3 h-3" />
                        AC
                    </div>
                )}

                {keyboardNavigation && (
                    <div
                        className="bg-purple-500 text-white px-2 py-1 rounded text-xs flex items-center gap-1"
                        aria-label="Navegação por teclado"
                    >
                        <Keyboard className="w-3 h-3" />
                        Teclado
                    </div>
                )}

                {userPreferences.reducedMotion && (
                    <div
                        className="bg-orange-500 text-white px-2 py-1 rounded text-xs"
                        aria-label="Animações reduzidas"
                    >
                        ⚡
                    </div>
                )}
            </div>

            {/* Main content with accessibility attributes */}
            <div
                className="accessible-content"
                role="main"
                aria-label="Conteúdo principal do assistente"
                aria-describedby="content-description"
            >
                <div id="content-description" className="sr-only">
                    Assistente virtual Matias para agendamento e diagnóstico de serviços automotivos
                </div>

                {children}
            </div>

            {/* Accessibility styles */}
            <style jsx>{`
                :global(.sr-only) {
                    position: absolute !important;
                    width: 1px !important;
                    height: 1px !important;
                    padding: 0 !important;
                    margin: -1px !important;
                    overflow: hidden !important;
                    clip: rect(0, 0, 0, 0) !important;
                    white-space: nowrap !important;
                    border: 0 !important;
                }

                :global(.high-contrast) {
                    filter: contrast(2);
                }

                :global(.high-contrast *) {
                    background-color: white !important;
                    color: black !important;
                    border-color: black !important;
                }

                :global(.high-contrast button),
                :global(.high-contrast a) {
                    background-color: black !important;
                    color: white !important;
                    border: 2px solid white !important;
                }

                :global(.reduced-motion *),
                :global(.reduced-motion *) {
                    animation-duration: 0.01ms !important;
                    animation-iteration-count: 1 !important;
                    transition-duration: 0.01ms !important;
                    scroll-behavior: auto !important;
                }

                :global(.font-small) {
                    font-size: 14px !important;
                }

                :global(.font-medium) {
                    font-size: 16px !important;
                }

                :global(.font-large) {
                    font-size: 18px !important;
                }

                :global(.font-extra-large) {
                    font-size: 20px !important;
                }

                :global(.keyboard-navigation *:focus) {
                    outline: 3px solid #0066cc !important;
                    outline-offset: 2px !important;
                }

                :global(.screen-reader-active) {
                    /* Additional styles for screen reader users */
                }

                :global(.focus-visible) {
                    /* Enhanced focus visibility */
                }

                /* Skip links for keyboard navigation */
                .skip-links {
                    position: absolute;
                    top: -40px;
                    left: 0;
                    right: 0;
                    z-index: 100;
                }

                .skip-links a {
                    position: absolute;
                    top: -40px;
                    left: 6px;
                    background: #0066cc;
                    color: white;
                    padding: 8px;
                    text-decoration: none;
                    border-radius: 4px;
                    font-weight: bold;
                }

                .skip-links a:focus {
                    top: 6px;
                }
            `}</style>
        </div>
    );
};

export default ScreenReaderSupport;