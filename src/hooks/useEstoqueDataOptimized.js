import { useEffect, useState, useCallback, useRef, useMemo } from "react";
import { getAllPecas } from '../services/pecas.service';
import { getAllFornecedores } from '../services/fornecedores.service';
import toast from "react-hot-toast";

// Cache para evitar requisições desnecessárias
const cache = {
    data: null,
    timestamp: null,
    ttl: 5 * 60 * 1000 // 5 minutos
};

export function useEstoqueDataOptimized() {
    const [pecas, setPecas] = useState([]);
    const [fornecedores, setFornecedores] = useState([]);
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
            setPecas(cachedData.pecas || []);
            setFornecedores(cachedData.fornecedores || []);
            setIsLoading(false);
            setError(null);
            setLastUpdate(new Date(cache.timestamp));
            return;
        }

        setIsLoading(true);
        setError(null);
        
        // Criar novo AbortController
        abortControllerRef.current = new AbortController();

        try {
            const startTime = Date.now();
            
            // Carregar dados em paralelo com timeout
            const timeoutPromise = new Promise((_, reject) => {
                setTimeout(() => reject(new Error('Timeout: Requisição demorou mais que 30 segundos')), 30000);
            });

            const dataPromise = Promise.allSettled([
                getAllPecas(),
                getAllFornecedores()
            ]);

            const [pecasResult, fornecedoresResult] = await Promise.race([
                dataPromise,
                timeoutPromise
            ]);

            let hasError = false;
            const errorMessages = [];

            // Processar peças
            if (pecasResult.status === 'fulfilled') {
                setPecas(pecasResult.value || []);
            } else {
                console.error('Erro ao carregar peças:', pecasResult.reason);
                errorMessages.push('Falha ao carregar peças');
                hasError = true;
                setPecas([]);
            }

            // Processar fornecedores
            if (fornecedoresResult.status === 'fulfilled') {
                setFornecedores(fornecedoresResult.value || []);
            } else {
                console.error('Erro ao carregar fornecedores:', fornecedoresResult.reason);
                errorMessages.push('Falha ao carregar fornecedores');
                hasError = true;
                setFornecedores([]);
            }

            // Atualizar cache apenas se não houve erros críticos
            if (!hasError || (pecasResult.status === 'fulfilled')) {
                cache.data = {
                    pecas: pecasResult.status === 'fulfilled' ? pecasResult.value : [],
                    fornecedores: fornecedoresResult.status === 'fulfilled' ? fornecedoresResult.value : []
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
                console.warn(`Estoque load time: ${loadTime}ms - Consider optimization`);
            }

        } catch (err) {
            if (err.name === 'AbortError') {
                return; // Requisição foi cancelada, não fazer nada
            }

            console.error("Erro ao carregar dados do estoque:", err);
            
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

            const errorMessage = err.message || "Falha ao carregar dados do estoque";
            setError(errorMessage);
            toast.error(errorMessage);
            
            // Usar dados do cache se disponível em caso de erro
            if (cache.data) {
                const cachedData = cache.data;
                setPecas(cachedData.pecas || []);
                setFornecedores(cachedData.fornecedores || []);
                toast.success("Usando dados em cache");
            } else {
                setPecas([]);
                setFornecedores([]);
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

    // Função para atualizar uma peça específica
    const updatePeca = useCallback((pecaId, updatedData) => {
        setPecas(prev => prev.map(p => 
            p.id === pecaId ? { ...p, ...updatedData } : p
        ));
        
        // Atualizar cache também
        if (cache.data) {
            cache.data.pecas = cache.data.pecas.map(p => 
                p.id === pecaId ? { ...p, ...updatedData } : p
            );
        }
    }, []);

    // Calcular estatísticas otimizadas
    const stats = useMemo(() => {
        const totalPecas = pecas.length;
        const valorTotalEstoque = pecas.reduce((total, peca) => {
            const quantidade = Number(peca.estoqueAtual || 0);
            const precoCusto = Number(peca.precoCusto || 0);
            return total + (quantidade * precoCusto);
        }, 0);
        const pecasEstoqueBaixo = pecas.filter(p => 
            (p.estoqueAtual || 0) <= (p.estoqueMinimo || 0)
        ).length;
        const totalFornecedores = fornecedores.length;

        return {
            totalPecas,
            valorTotalEstoque,
            pecasEstoqueBaixo,
            totalFornecedores,
        };
    }, [pecas, fornecedores]);

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
        pecas,
        fornecedores,
        stats,
        isLoading,
        error,
        lastUpdate,
        reload: loadData,
        forceReload,
        updatePeca,
        isCacheValid: isCacheValid()
    };
}