import { useState, useEffect, useCallback, useMemo } from 'react';
import { procedimentosService } from '../services/procedimentos.service';
import { mensagensService } from '../services/mensagens.service';

// Cache inteligente para dados de configurações
class ConfiguracoesCache {
    constructor() {
        this.cache = new Map();
        this.timestamps = new Map();
        this.CACHE_DURATION = 10 * 60 * 1000; // 10 minutos (configurações mudam menos)
    }

    set(key, data) {
        this.cache.set(key, data);
        this.timestamps.set(key, Date.now());
    }

    get(key) {
        const timestamp = this.timestamps.get(key);
        if (!timestamp || Date.now() - timestamp > this.CACHE_DURATION) {
            this.cache.delete(key);
            this.timestamps.delete(key);
            return null;
        }
        return this.cache.get(key);
    }

    clear() {
        this.cache.clear();
        this.timestamps.clear();
    }

    isValid(key) {
        const timestamp = this.timestamps.get(key);
        return timestamp && Date.now() - timestamp < this.CACHE_DURATION;
    }
}

const configuracoesCache = new ConfiguracoesCache();

export function useConfiguracoesDataOptimized() {
    const [procedimentos, setProcedimentos] = useState([]);
    const [mensagens, setMensagens] = useState([]);
    const [stats, setStats] = useState({});
    const [systemHealth, setSystemHealth] = useState({});
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [lastUpdate, setLastUpdate] = useState(null);
    const [retryCount, setRetryCount] = useState(0);

    // Função para calcular estatísticas
    const calculateStats = useCallback((procedimentosList, mensagensList) => {
        const procedimentosAtivos = procedimentosList.filter(p => p.ativo !== false).length;
        const mensagensAtivas = mensagensList.filter(m => m.ativo !== false).length;
        
        // Análise de qualidade
        const procedimentosComChecklist = procedimentosList.filter(p => 
            p.checklistJson && (Array.isArray(p.checklistJson) ? p.checklistJson.length > 0 : p.checklistJson)
        ).length;
        
        const mensagensComVariaveis = mensagensList.filter(m => 
            m.template && m.template.includes('{{')
        ).length;
        
        // Análise de uso (simulado - em produção viria do backend)
        const procedimentosMaisUsados = procedimentosList
            .sort((a, b) => (b.usoCount || 0) - (a.usoCount || 0))
            .slice(0, 5);
        
        const mensagensMaisUsadas = mensagensList
            .sort((a, b) => (b.usoCount || 0) - (a.usoCount || 0))
            .slice(0, 5);
        
        // Categorias
        const categoriasProcedimentos = {};
        procedimentosList.forEach(p => {
            const categoria = p.categoria || 'Sem categoria';
            categoriasProcedimentos[categoria] = (categoriasProcedimentos[categoria] || 0) + 1;
        });
        
        const categoriasMensagens = {};
        mensagensList.forEach(m => {
            const categoria = m.categoria || 'Sem categoria';
            categoriasMensagens[categoria] = (categoriasMensagens[categoria] || 0) + 1;
        });

        return {
            totalProcedimentos: procedimentosList.length,
            totalMensagens: mensagensList.length,
            procedimentosAtivos,
            mensagensAtivas,
            configuracoesAtivas: procedimentosAtivos + mensagensAtivas,
            procedimentosComChecklist,
            mensagensComVariaveis,
            eficienciaProcedimentos: procedimentosList.length > 0 ? 
                Math.round((procedimentosComChecklist / procedimentosList.length) * 100) : 0,
            eficienciaMensagens: mensagensList.length > 0 ? 
                Math.round((mensagensComVariaveis / mensagensList.length) * 100) : 0,
            procedimentosMaisUsados,
            mensagensMaisUsadas,
            categoriasProcedimentos,
            categoriasMensagens,
            totalConfiguracoes: procedimentosList.length + mensagensList.length
        };
    }, []);

    // Função para verificar saúde do sistema
    const checkSystemHealth = useCallback(() => {
        // Simulação de verificação de saúde do sistema
        // Em produção, isso faria chamadas reais para endpoints de health check
        const health = {
            status: 'healthy',
            uptime: '99.9%',
            lastBackup: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 horas atrás
            databaseConnection: true,
            cacheStatus: true,
            apiResponse: 'normal',
            memoryUsage: '45%',
            diskSpace: '78%'
        };
        
        setSystemHealth(health);
        return health;
    }, []);

    // Função para carregar dados com retry automático
    const loadData = useCallback(async (useCache = true) => {
        const cacheKey = 'configuracoes_data';
        
        try {
            // Tentar usar cache primeiro
            if (useCache) {
                const cachedData = configuracoesCache.get(cacheKey);
                if (cachedData) {
                    console.log('⚙️ Dados de configurações carregados do cache');
                    setProcedimentos(cachedData.procedimentos);
                    setMensagens(cachedData.mensagens);
                    setStats(cachedData.stats);
                    setSystemHealth(cachedData.systemHealth);
                    setLastUpdate(new Date(cachedData.timestamp));
                    setIsLoading(false);
                    setError(null);
                    return;
                }
            }

            setIsLoading(true);
            setError(null);

            console.log('🔄 Carregando dados de configurações da API...');
            
            // Carregar dados em paralelo
            const [procedimentosResponse, mensagensResponse] = await Promise.all([
                procedimentosService?.getAll() || Promise.resolve([]),
                mensagensService?.getAll() || Promise.resolve([])
            ]);
            
            const procedimentosList = Array.isArray(procedimentosResponse) ? procedimentosResponse : [];
            const mensagensList = Array.isArray(mensagensResponse) ? mensagensResponse : [];
            
            // Calcular estatísticas
            const calculatedStats = calculateStats(procedimentosList, mensagensList);
            
            // Verificar saúde do sistema
            const healthStatus = checkSystemHealth();
            
            // Salvar no cache
            const dataToCache = {
                procedimentos: procedimentosList,
                mensagens: mensagensList,
                stats: calculatedStats,
                systemHealth: healthStatus,
                timestamp: Date.now()
            };
            configuracoesCache.set(cacheKey, dataToCache);
            
            setProcedimentos(procedimentosList);
            setMensagens(mensagensList);
            setStats(calculatedStats);
            setSystemHealth(healthStatus);
            setLastUpdate(new Date());
            setRetryCount(0);
            
            console.log('✅ Dados de configurações carregados com sucesso:', {
                procedimentos: procedimentosList.length,
                mensagens: mensagensList.length,
                configuracoes: calculatedStats.totalConfiguracoes
            });
            
        } catch (err) {
            console.error('❌ Erro ao carregar dados de configurações:', err);
            setError(err);
            
            // Retry automático (máximo 3 tentativas)
            if (retryCount < 3) {
                console.log(`🔄 Tentativa ${retryCount + 1}/3 de retry em 2 segundos...`);
                setTimeout(() => {
                    setRetryCount(prev => prev + 1);
                    loadData(false);
                }, 2000);
            }
        } finally {
            setIsLoading(false);
        }
    }, [calculateStats, checkSystemHealth, retryCount]);

    // Função para recarregar dados
    const reload = useCallback(() => {
        console.log('🔄 Recarregando dados de configurações...');
        configuracoesCache.clear();
        setRetryCount(0);
        loadData(false);
    }, [loadData]);

    // Verificar se o cache é válido
    const isCacheValid = useMemo(() => {
        return configuracoesCache.isValid('configuracoes_data');
    }, [lastUpdate]);

    // Carregar dados quando o componente monta
    useEffect(() => {
        loadData();
    }, [loadData]);

    // Auto-refresh a cada 15 minutos se a página estiver ativa
    useEffect(() => {
        const interval = setInterval(() => {
            if (document.visibilityState === 'visible' && !isCacheValid) {
                console.log('🔄 Auto-refresh dos dados de configurações...');
                loadData(false);
            }
        }, 15 * 60 * 1000); // 15 minutos

        return () => clearInterval(interval);
    }, [loadData, isCacheValid]);

    // Funções utilitárias para manipulação de dados
    const addProcedimento = useCallback((novoProcedimento) => {
        setProcedimentos(prev => [...prev, novoProcedimento]);
        // Recalcular stats
        const newStats = calculateStats([...procedimentos, novoProcedimento], mensagens);
        setStats(newStats);
    }, [procedimentos, mensagens, calculateStats]);

    const updateProcedimento = useCallback((id, dadosAtualizados) => {
        setProcedimentos(prev => prev.map(p => p.id === id ? { ...p, ...dadosAtualizados } : p));
        // Recalcular stats
        const updatedProcedimentos = procedimentos.map(p => p.id === id ? { ...p, ...dadosAtualizados } : p);
        const newStats = calculateStats(updatedProcedimentos, mensagens);
        setStats(newStats);
    }, [procedimentos, mensagens, calculateStats]);

    const removeProcedimento = useCallback((id) => {
        setProcedimentos(prev => prev.filter(p => p.id !== id));
        // Recalcular stats
        const filteredProcedimentos = procedimentos.filter(p => p.id !== id);
        const newStats = calculateStats(filteredProcedimentos, mensagens);
        setStats(newStats);
    }, [procedimentos, mensagens, calculateStats]);

    const addMensagem = useCallback((novaMensagem) => {
        setMensagens(prev => [...prev, novaMensagem]);
        // Recalcular stats
        const newStats = calculateStats(procedimentos, [...mensagens, novaMensagem]);
        setStats(newStats);
    }, [procedimentos, mensagens, calculateStats]);

    const updateMensagem = useCallback((id, dadosAtualizados) => {
        setMensagens(prev => prev.map(m => m.id === id ? { ...m, ...dadosAtualizados } : m));
        // Recalcular stats
        const updatedMensagens = mensagens.map(m => m.id === id ? { ...m, ...dadosAtualizados } : m);
        const newStats = calculateStats(procedimentos, updatedMensagens);
        setStats(newStats);
    }, [procedimentos, mensagens, calculateStats]);

    const removeMensagem = useCallback((id) => {
        setMensagens(prev => prev.filter(m => m.id !== id));
        // Recalcular stats
        const filteredMensagens = mensagens.filter(m => m.id !== id);
        const newStats = calculateStats(procedimentos, filteredMensagens);
        setStats(newStats);
    }, [procedimentos, mensagens, calculateStats]);

    // Dados memoizados para performance
    const memoizedData = useMemo(() => {
        return {
            procedimentos,
            mensagens,
            stats,
            systemHealth
        };
    }, [procedimentos, mensagens, stats, systemHealth]);

    return {
        ...memoizedData,
        isLoading,
        error,
        reload,
        lastUpdate,
        isCacheValid,
        
        // Funções de manipulação
        addProcedimento,
        updateProcedimento,
        removeProcedimento,
        addMensagem,
        updateMensagem,
        removeMensagem,
        
        // Funções utilitárias
        calculateStats,
        checkSystemHealth,
        
        // Informações de debug
        cacheInfo: {
            hasCache: configuracoesCache.cache.size > 0,
            cacheSize: configuracoesCache.cache.size,
            retryCount
        }
    };
}