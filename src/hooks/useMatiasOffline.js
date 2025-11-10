/**
 * 📡 Advanced Offline Capabilities Hook
 *
 * Provides comprehensive offline functionality including:
 * - Message queue management
 * - Local conversation sync
 * - Offline detection and handling
 * - Progressive Web App features
 * - Background sync
 */

import { useState, useEffect, useCallback, useRef } from 'react';

export const useMatiasOffline = (config = {}) => {
    // Configuration
    const {
        enableBackgroundSync = true,
        maxOfflineMessages = 100,
        syncInterval = 30000, // 30 seconds
        retryAttempts = 3,
        retryDelay = 5000,
        enableServiceWorker = true,
        storageQuota = 50 * 1024 * 1024, // 50MB
        enableCacheFirst = true
    } = config;

    // Core state
    const [isOnline, setIsOnline] = useState(navigator.onLine);
    const [isOfflineMode, setIsOfflineMode] = useState(false);
    const [offlineQueue, setOfflineQueue] = useState([]);
    const [syncStatus, setSyncStatus] = useState('idle'); // idle, syncing, success, error
    const [lastSyncTime, setLastSyncTime] = useState(null);
    const [pendingMessages, setPendingMessages] = useState(0);
    const [storageUsage, setStorageUsage] = useState(0);

    // Advanced features
    const [serviceWorkerReady, setServiceWorkerReady] = useState(false);
    const [backgroundSyncSupported, setBackgroundSyncSupported] = useState(false);
    const [indexedDBReady, setIndexedDBReady] = useState(false);

    // Refs
    const syncTimeoutRef = useRef(null);
    const retryCountRef = useRef(0);
    const dbRef = useRef(null);

    // Initialize offline system
    useEffect(() => {
        initializeOfflineSystem();
        return () => {
            cleanupOfflineSystem();
        };
    }, []);

    const initializeOfflineSystem = async () => {
        try {
            await setupEventListeners();
            await initializeIndexedDB();
            await loadOfflineQueue();
            await setupServiceWorker();
            await checkBackgroundSyncSupport();
            await checkStorageUsage();
        } catch (error) {
            console.error('Error initializing offline system:', error);
        }
    };

    const setupEventListeners = () => {
        // Online/offline detection
        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        // Page visibility for background sync
        document.addEventListener('visibilitychange', handleVisibilityChange);

        // Storage events for cross-tab sync
        window.addEventListener('storage', handleStorageChange);
    };

    const handleOnline = () => {
        setIsOnline(true);
        setIsOfflineMode(false);
        setSyncStatus('syncing');

        // Attempt to sync queued messages
        if (offlineQueue.length > 0) {
            syncOfflineMessages();
        }

        // Clear any pending sync timeout
        if (syncTimeoutRef.current) {
            clearTimeout(syncTimeoutRef.current);
        }
    };

    const handleOffline = () => {
        setIsOnline(false);
        setIsOfflineMode(true);
        setSyncStatus('idle');
    };

    const handleVisibilityChange = () => {
        if (!document.hidden && isOnline && offlineQueue.length > 0) {
            // Page became visible, attempt sync
            syncOfflineMessages();
        }
    };

    const handleStorageChange = (event) => {
        if (event.key === 'matias_offline_queue') {
            // Queue updated in another tab
            loadOfflineQueue();
        }
    };

    const initializeIndexedDB = async () => {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open('MatiasOfflineDB', 1);

            request.onerror = () => reject(request.error);
            request.onsuccess = () => {
                dbRef.current = request.result;
                setIndexedDBReady(true);
                resolve();
            };

            request.onupgradeneeded = (event) => {
                const db = event.target.result;

                // Create object stores
                if (!db.objectStoreNames.contains('messages')) {
                    const messageStore = db.createObjectStore('messages', { keyPath: 'id' });
                    messageStore.createIndex('timestamp', 'timestamp', { unique: false });
                    messageStore.createIndex('status', 'status', { unique: false });
                }

                if (!db.objectStoreNames.contains('conversations')) {
                    const conversationStore = db.createObjectStore('conversations', { keyPath: 'id' });
                    conversationStore.createIndex('updatedAt', 'updatedAt', { unique: false });
                }

                if (!db.objectStoreNames.contains('responses')) {
                    const responseStore = db.createObjectStore('responses', { keyPath: 'id' });
                    responseStore.createIndex('timestamp', 'timestamp', { unique: false });
                }
            };
        });
    };

    const setupServiceWorker = async () => {
        if (!enableServiceWorker || !('serviceWorker' in navigator)) {
            return;
        }

        try {
            const registration = await navigator.serviceWorker.register('/sw.js');
            setServiceWorkerReady(true);

            // Listen for messages from service worker
            navigator.serviceWorker.addEventListener('message', handleServiceWorkerMessage);

            console.log('Service worker registered:', registration);
        } catch (error) {
            console.warn('Service worker registration failed:', error);
        }
    };

    const handleServiceWorkerMessage = (event) => {
        if (event.data.type === 'SYNC_COMPLETED') {
            setSyncStatus('success');
            setLastSyncTime(new Date());
            loadOfflineQueue();
        } else if (event.data.type === 'SYNC_ERROR') {
            setSyncStatus('error');
        }
    };

    const checkBackgroundSyncSupport = () => {
        const supported = 'serviceWorker' in navigator &&
                          'SyncManager' in window &&
                          enableBackgroundSync;
        setBackgroundSyncSupported(supported);
    };

    const checkStorageUsage = async () => {
        if ('storage' in navigator && 'estimate' in navigator.storage) {
            try {
                const estimate = await navigator.storage.estimate();
                setStorageUsage(estimate.usage || 0);
            } catch (error) {
                console.warn('Error checking storage usage:', error);
            }
        }
    };

    const loadOfflineQueue = async () => {
        try {
            // Load from localStorage first (fallback)
            const stored = localStorage.getItem('matias_offline_queue');
            let queue = [];

            if (stored) {
                queue = JSON.parse(stored);
            }

            // Load from IndexedDB if available
            if (indexedDBReady && dbRef.current) {
                const dbQueue = await getMessagesFromDB('messages', 'status', 'pending');
                queue = [...queue, ...dbQueue];
            }

            // Remove duplicates and sort by timestamp
            const uniqueQueue = queue.filter((msg, index, arr) =>
                arr.findIndex(m => m.id === msg.id) === index
            ).sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

            setOfflineQueue(uniqueQueue);
            setPendingMessages(uniqueQueue.length);

        } catch (error) {
            console.warn('Error loading offline queue:', error);
        }
    };

    const getMessagesFromDB = async (storeName, indexName, value) => {
        if (!dbRef.current) return [];

        return new Promise((resolve, reject) => {
            const transaction = dbRef.current.transaction([storeName], 'readonly');
            const store = transaction.objectStore(storeName);
            const index = store.index(indexName);
            const request = index.getAll(value);

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    };

    const addToOfflineQueue = async (message) => {
        const offlineMessage = {
            id: generateId(),
            ...message,
            timestamp: new Date().toISOString(),
            status: 'pending',
            retryCount: 0,
            offlineMode: true
        };

        try {
            // Add to queue
            const updatedQueue = [...offlineQueue, offlineMessage]
                .slice(-maxOfflineMessages); // Keep only last N messages

            setOfflineQueue(updatedQueue);
            setPendingMessages(updatedQueue.length);

            // Save to localStorage (fallback)
            localStorage.setItem('matias_offline_queue', JSON.stringify(updatedQueue));

            // Save to IndexedDB if available
            if (indexedDBReady && dbRef.current) {
                await saveMessageToDB('messages', offlineMessage);
            }

            // Register for background sync if supported
            if (backgroundSyncSupported && serviceWorkerReady) {
                await registerBackgroundSync();
            }

            return offlineMessage;

        } catch (error) {
            console.error('Error adding to offline queue:', error);
            throw error;
        }
    };

    const saveMessageToDB = async (storeName, data) => {
        return new Promise((resolve, reject) => {
            const transaction = dbRef.current.transaction([storeName], 'readwrite');
            const store = transaction.objectStore(storeName);
            const request = store.put(data);

            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    };

    const generateId = () => {
        return `offline_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    };

    const registerBackgroundSync = async () => {
        try {
            const registration = await navigator.serviceWorker.ready;
            await registration.sync.register('matias-offline-sync');
            console.log('Background sync registered');
        } catch (error) {
            console.warn('Background sync registration failed:', error);
        }
    };

    const syncOfflineMessages = async () => {
        if (!isOnline || offlineQueue.length === 0 || syncStatus === 'syncing') {
            return;
        }

        setSyncStatus('syncing');
        retryCountRef.current = 0;

        try {
            const syncedMessages = [];
            const failedMessages = [];

            for (const message of offlineQueue) {
                try {
                    // Attempt to send message
                    const response = await sendMessageToServer(message);

                    if (response.success) {
                        syncedMessages.push(message.id);
                        await removeMessageFromQueue(message.id);
                    } else {
                        failedMessages.push({ ...message, error: response.error });
                    }
                } catch (error) {
                    failedMessages.push({ ...message, error: error.message });
                }
            }

            // Update queue with failed messages
            if (failedMessages.length > 0) {
                const updatedFailedMessages = failedMessages.map(msg => ({
                    ...msg,
                    retryCount: msg.retryCount + 1,
                    lastRetry: new Date().toISOString()
                }));

                await updateFailedMessages(updatedFailedMessages);
            }

            setSyncStatus('success');
            setLastSyncTime(new Date());

            // Trigger retry for failed messages after delay
            if (failedMessages.length > 0 && retryCountRef.current < retryAttempts) {
                setTimeout(() => {
                    retryCountRef.current++;
                    syncOfflineMessages();
                }, retryDelay);
            }

            // Notify components of sync completion
            window.dispatchEvent(new CustomEvent('offline-sync-completed', {
                detail: {
                    synced: syncedMessages.length,
                    failed: failedMessages.length,
                    total: offlineQueue.length
                }
            }));

        } catch (error) {
            console.error('Error syncing offline messages:', error);
            setSyncStatus('error');
        }
    };

    const sendMessageToServer = async (message) => {
        try {
            const response = await fetch('/api/matias/chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Offline-Mode': 'true',
                    'X-Message-ID': message.id
                },
                body: JSON.stringify({
                    ...message,
                    offlineTimestamp: message.timestamp,
                    retryCount: message.retryCount
                })
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            return await response.json();

        } catch (error) {
            console.error('Error sending message to server:', error);
            throw error;
        }
    };

    const removeMessageFromQueue = async (messageId) => {
        try {
            // Remove from state
            const updatedQueue = offlineQueue.filter(msg => msg.id !== messageId);
            setOfflineQueue(updatedQueue);
            setPendingMessages(updatedQueue.length);

            // Remove from localStorage
            localStorage.setItem('matias_offline_queue', JSON.stringify(updatedQueue));

            // Remove from IndexedDB
            if (indexedDBReady && dbRef.current) {
                await deleteMessageFromDB('messages', messageId);
            }

        } catch (error) {
            console.error('Error removing message from queue:', error);
        }
    };

    const deleteMessageFromDB = async (storeName, id) => {
        return new Promise((resolve, reject) => {
            const transaction = dbRef.current.transaction([storeName], 'readwrite');
            const store = transaction.objectStore(storeName);
            const request = store.delete(id);

            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    };

    const updateFailedMessages = async (failedMessages) => {
        try {
            // Update state
            setOfflineQueue(failedMessages);
            setPendingMessages(failedMessages.length);

            // Update localStorage
            localStorage.setItem('matias_offline_queue', JSON.stringify(failedMessages));

            // Update IndexedDB
            if (indexedDBReady && dbRef.current) {
                for (const message of failedMessages) {
                    await saveMessageToDB('messages', message);
                }
            }

        } catch (error) {
            console.error('Error updating failed messages:', error);
        }
    };

    const clearOfflineQueue = async () => {
        try {
            setOfflineQueue([]);
            setPendingMessages(0);

            localStorage.removeItem('matias_offline_queue');

            if (indexedDBReady && dbRef.current) {
                await clearObjectStore('messages');
            }

        } catch (error) {
            console.error('Error clearing offline queue:', error);
        }
    };

    const clearObjectStore = async (storeName) => {
        return new Promise((resolve, reject) => {
            const transaction = dbRef.current.transaction([storeName], 'readwrite');
            const store = transaction.objectStore(storeName);
            const request = store.clear();

            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    };

    const getOfflineCapabilities = () => {
        return {
            serviceWorkerReady,
            backgroundSyncSupported,
            indexedDBReady,
            storageQuota,
            currentUsage: storageUsage,
            maxMessages: maxOfflineMessages,
            enableCacheFirst
        };
    };

    const getOfflineStats = () => {
        return {
            isOnline,
            isOfflineMode,
            pendingMessages,
            queueLength: offlineQueue.length,
            syncStatus,
            lastSyncTime,
            retryCount: retryCountRef.current,
            storageUsage,
            storagePercentage: (storageUsage / storageQuota) * 100
        };
    };

    const generateOfflineResponse = (userMessage) => {
        const offlineResponses = {
            'agendar': {
                content: '📅 **Agendamento Offline**\n\nSeu pedido de agendamento foi registrado e será processado quando a conexão for restabelecida.\n\n**Informações salvas:**\n• Requisição: ' + userMessage + '\n• Status: Aguardando sincronização\n• Prioridade: Normal\n\n**Próximos passos:**\n1. Conexão restabelecida automaticamente\n2. Processamento imediato do agendamento\n3. Confirmação por mensagem\n\n**Aguarde...** Estou tentando reconectar.',
                type: 'scheduling',
                priority: 'medium'
            },
            'consultar': {
                content: '🔍 **Consulta Offline**\n\nEstou offline, mas posso acessar dados já salvos localmente.\n\n**Capacidades disponíveis:**\n• Histórico de conversas recentes\n• Dados de agendamentos salvos\n• Informações básicas de veículos\n• Status de serviços anteriores\n\n**Deseja consultar o que está disponível offline?**\n\nSua mensagem foi salva para processamento quando voltar online.',
                type: 'searching',
                priority: 'low'
            },
            'emergencia': {
                content: '🚨 **Modo Emergência Offline**\n\n**Atenção:** Detectei que estou offline, mas emergências têm prioridade máxima!\n\n**Ações imediatas:**\n• Sua emergência foi registrada localmente\n• Tentativa automática de reconexão em andamento\n• Quando online: processamento imediato\n\n**Enquanto isso:**\n📞 **Ligue para emergência:** (11) 99999-9999\n🚛 **Guincho disponível:** Verificando...\n\n**Sua segurança é nossa prioridade!**',
                type: 'emergency',
                priority: 'high'
            },
            'default': {
                content: '📡 **Modo Offline**\n\nOlá! Estou temporariamente sem conexão com a internet, mas continue conversando!\n\n**O que posso fazer offline:**\n✅ Salvar suas mensagens\n✅ Acessar histórico recente\n✅ Fornecer respostas básicas\n✅ Registrar solicitações\n\n**Quando voltar online:**\n🔄 Sincronização automática\n📤 Envio de todas as mensagens pendentes\n🎯 Processamento imediato das solicitações\n\n**Status:** ' + pendingMessages + ' mensagens aguardando envio',
                type: 'general',
                priority: 'normal'
            }
        };

        const messageLower = userMessage.toLowerCase();

        for (const [key, response] of Object.entries(offlineResponses)) {
            if (messageLower.includes(key)) {
                return response;
            }
        }

        return offlineResponses.default;
    };

    const cleanupOfflineSystem = () => {
        window.removeEventListener('online', handleOnline);
        window.removeEventListener('offline', handleOffline);
        document.removeEventListener('visibilitychange', handleVisibilityChange);
        window.removeEventListener('storage', handleStorageChange);

        if (syncTimeoutRef.current) {
            clearTimeout(syncTimeoutRef.current);
        }
    };

    // Public API
    const offlineAPI = {
        // State
        isOnline,
        isOfflineMode,
        syncStatus,
        pendingMessages,
        lastSyncTime,
        offlineQueue,

        // Actions
        addToOfflineQueue,
        syncOfflineMessages,
        clearOfflineQueue,

        // Utilities
        getOfflineCapabilities,
        getOfflineStats,
        generateOfflineResponse,

        // Advanced features
        forceSync: () => syncOfflineMessages(),
        markMessageAsSent: (messageId) => removeMessageFromQueue(messageId),
        retryFailedMessages: () => {
            retryCountRef.current = 0;
            syncOfflineMessages();
        }
    };

    return offlineAPI;
};

export default useMatiasOffline;