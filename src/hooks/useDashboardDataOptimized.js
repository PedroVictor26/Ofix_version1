import { useEffect, useState, useCallback, useRef } from "react";
import * as servicosService from '../services/servicos.service.js';
import { getAllClientes, getAllVeiculos } from '../services/clientes.service.js';
import toast from "react-hot-toast";

// Cache para evitar requisições desnecessárias
const cache = {
    data: null,
    timestamp: null,
    ttl: 5 * 60 * 1000 // 5 minutos
};

export default function useDashboardDataOptimized() {
    const [servicos, setServicos] = useState([]);
    const [clientes, setClientes] = useState({});
    const [veiculos, setVeiculos] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [lastUpdate, setLastUpdate] = useState(null);
    
    const abortControllerRef = useRef(null);
    const retryCountRef = useRef(0);
    const maxRetries = 3;

    // Função para verificar se o cache é válido
    const isCacheValid = useCallback(() => {
        return cache.data && 
               cache.timestamp && 
               (Date.now() - cache.timestamp) < cache.ttl;
    }, []);

    // Função para carregar dados com cache e retry
    const loadData = useCallback(async (forceRefresh = false) => {
        // Cancelar requisição anterior se existir
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
        }

        // Usar cache se válido e não forçar refresh
        if (!forceRefresh && isCacheValid()) {
            const cachedData = cache.data;
            setServicos(cachedData.servicos || []);
            setClientes(cachedData.clientes || {});
            setVeiculos(cachedData.veiculos || []);
            setIsLoading(false);
            setError(null);
            setLastUpdate(new Date(cache.timestamp));
            return;
        }

        setIsLoading(true);
        setError(null);
        
        // Criar novo AbortController
        abortControllerRef.current = new AbortController();
        const signal = abortControllerRef.current.signal;

        try {
            const startTime = Date.now();
            
            // Carregar dados em paralelo com timeout
            const timeoutPromise = new Promise((_, reject) => {
                setTimeout(() => reject(new Error('Timeout: Requisição demorou mais que 30 segundos')), 30000);
            });

            const dataPromise = Promise.allSettled([
                servicosService.getAllServicos(),
                getAllClientes(),
                getAllVeiculos()
            ]);

            const [servicosResult, clientesResult, veiculosResult] = await Promise.race([
                dataPromise,
                timeoutPromise
            ]);

            // Verificar se foi cancelado
            if (signal.aborted) {
                return;
            }

            let hasError = false;
            const errorMessages = [];

            // Processar serviços
            if (servicosResult.status === 'fulfilled') {
                setServicos(servicosResult.value || []);
            } else {
                console.error('Erro ao carregar serviços:', servicosResult.reason);
                errorMessages.push('Falha ao carregar serviços');
                hasError = true;
                setServicos([]);
            }

            // Processar clientes
            if (clientesResult.status === 'fulfilled') {
                const clientesMap = (clientesResult.value || []).reduce((acc, cliente) => {
                    acc[cliente.id] = cliente;
                    return acc;
                }, {});
                setClientes(clientesMap);
            } else {
                console.error('Erro ao carregar clientes:', clientesResult.reason);
                errorMessages.push('Falha ao carregar clientes');
                hasError = true;
                setClientes({});
            }

            // Processar veículos
            if (veiculosResult.status === 'fulfilled') {
                setVeiculos(veiculosResult.value || []);
            } else {
                console.error('Erro ao carregar veículos:', veiculosResult.reason);
                errorMessages.push('Falha ao carregar veículos');
                hasError = true;
                setVeiculos([]);
            }

            // Atualizar cache apenas se não houve erros críticos
            if (!hasError || (servicosResult.status === 'fulfilled')) {
                cache.data = {
                    servicos: servicosResult.status === 'fulfilled' ? servicosResult.value : [],
                    clientes: clientesResult.status === 'fulfilled' ? 
                        (clientesResult.value || []).reduce((acc, cliente) => {
                            acc[cliente.id] = cliente;
                            return acc;
                        }, {}) : {},
                    veiculos: veiculosResult.status === 'fulfilled' ? veiculosResult.value : []
                };
                cache.timestamp = Date.now();
                setLastUpdate(new Date());
            }

            // Mostrar erros não críticos
            if (hasError && errorMessages.length > 0) {
                const errorMsg = errorMessages.join(', ');
                setError(errorMsg);
                toast.error(`Alguns dados não puderam ser carregados: ${errorMsg}`);
            } else {
                setError(null);
                retryCountRef.current = 0; // Reset retry count on success
            }

            // Log de performance
            const loadTime = Date.now() - startTime;
            if (loadTime > 5000) {
                console.warn(`Dashboard load time: ${loadTime}ms - Consider optimization`);
            }

        } catch (err) {
            if (err.name === 'AbortError') {
                return; // Requisição foi cancelada, não fazer nada
            }

            console.error("Erro ao carregar dados do dashboard:", err);
            
            // Implementar retry automático
            if (retryCountRef.current < maxRetries) {
                retryCountRef.current++;
                toast.error(`Erro ao carregar dados. Tentativa ${retryCountRef.current}/${maxRetries}...`);
                
                // Retry com backoff exponencial
                setTimeout(() => {
                    loadData(forceRefresh);
                }, Math.pow(2, retryCountRef.current) * 1000);
                
                return;
            }

            const errorMessage = err.message || "Falha ao carregar dados do dashboard";
            setError(errorMessage);
            toast.error(errorMessage);
            
            // Usar dados do cache se disponível em caso de erro
            if (cache.data) {
                const cachedData = cache.data;
                setServicos(cachedData.servicos || []);
                setClientes(cachedData.clientes || {});
                setVeiculos(cachedData.veiculos || []);
                toast.success("Usando dados em cache");
            } else {
                setServicos([]);
                setClientes({});
                setVeiculos([]);
            }
        } finally {
            setIsLoading(false);
        }
    }, [isCacheValid]);

    // Função para forçar atualização
    const forceReload = useCallback(() => {
        retryCountRef.current = 0;
        loadData(true);
    }, [loadData]);

    // Função para atualizar um serviço específico
    const updateServico = useCallback((servicoId, updatedData) => {
        setServicos(prev => prev.map(s => 
            s.id === servicoId ? { ...s, ...updatedData } : s
        ));
        
        // Atualizar cache também
        if (cache.data) {
            cache.data.servicos = cache.data.servicos.map(s => 
                s.id === servicoId ? { ...s, ...updatedData } : s
            );
        }
    }, []);

    // Carregar dados na inicialização
    useEffect(() => {
        loadData();
        
        // Cleanup function
        return () => {
            if (abortControllerRef.current) {
                abortControllerRef.current.abort();
            }
        };
    }, [loadData]);

    // Auto-refresh a cada 5 minutos se a página estiver visível
    useEffect(() => {
        const handleVisibilityChange = () => {
            if (!document.hidden && !isCacheValid()) {
                loadData();
            }
        };

        const interval = setInterval(() => {
            if (!document.hidden) {
                loadData();
            }
        }, 5 * 60 * 1000); // 5 minutos

        document.addEventListener('visibilitychange', handleVisibilityChange);

        return () => {
            clearInterval(interval);
            document.removeEventListener('visibilitychange', handleVisibilityChange);
        };
    }, [loadData, isCacheValid]);

    return {
        servicos,
        clientes,
        veiculos,
        isLoading,
        error,
        lastUpdate,
        reload: loadData,
        forceReload,
        updateServico,
        isCacheValid: isCacheValid()
    };
}