import { useState, useEffect, useCallback, useMemo } from 'react';
import { financeiroService } from '../services/financeiro.service';

// Cache inteligente para dados financeiros
class FinanceiroCache {
    constructor() {
        this.cache = new Map();
        this.timestamps = new Map();
        this.CACHE_DURATION = 5 * 60 * 1000; // 5 minutos
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

const financeiroCache = new FinanceiroCache();

export function useFinanceiroDataOptimized() {
    const [transacoes, setTransacoes] = useState([]);
    const [stats, setStats] = useState({});
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [lastUpdate, setLastUpdate] = useState(null);
    const [filterPeriod, setFilterPeriod] = useState('month');
    const [retryCount, setRetryCount] = useState(0);

    // Função para calcular estatísticas
    const calculateStats = useCallback((transacoesList) => {
        const receitas = transacoesList.filter(t => t.tipo === 'receita');
        const despesas = transacoesList.filter(t => t.tipo === 'despesa');
        
        const totalReceitas = receitas.reduce((acc, t) => acc + parseFloat(t.valor || 0), 0);
        const totalDespesas = despesas.reduce((acc, t) => acc + parseFloat(t.valor || 0), 0);
        const saldoTotal = totalReceitas - totalDespesas;
        
        // Análise por período
        const hoje = new Date();
        const inicioMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
        const inicioSemana = new Date(hoje);
        inicioSemana.setDate(hoje.getDate() - 7);
        
        const transacoesMes = transacoesList.filter(t => new Date(t.data) >= inicioMes);
        const transacoesSemana = transacoesList.filter(t => new Date(t.data) >= inicioSemana);
        
        const receitasMes = transacoesMes
            .filter(t => t.tipo === 'receita')
            .reduce((acc, t) => acc + parseFloat(t.valor || 0), 0);
        
        const despesasMes = transacoesMes
            .filter(t => t.tipo === 'despesa')
            .reduce((acc, t) => acc + parseFloat(t.valor || 0), 0);
        
        const receitasSemana = transacoesSemana
            .filter(t => t.tipo === 'receita')
            .reduce((acc, t) => acc + parseFloat(t.valor || 0), 0);
        
        const despesasSemana = transacoesSemana
            .filter(t => t.tipo === 'despesa')
            .reduce((acc, t) => acc + parseFloat(t.valor || 0), 0);

        // Categorias mais frequentes
        const categorias = {};
        transacoesList.forEach(t => {
            if (t.categoria) {
                categorias[t.categoria] = (categorias[t.categoria] || 0) + parseFloat(t.valor || 0);
            }
        });

        const topCategorias = Object.entries(categorias)
            .sort(([,a], [,b]) => b - a)
            .slice(0, 5)
            .map(([categoria, valor]) => ({ categoria, valor }));

        return {
            totalReceitas,
            totalDespesas,
            saldoTotal,
            totalTransacoes: transacoesList.length,
            receitasMes,
            despesasMes,
            saldoMes: receitasMes - despesasMes,
            receitasSemana,
            despesasSemana,
            saldoSemana: receitasSemana - despesasSemana,
            topCategorias,
            margemLucro: totalReceitas > 0 ? ((saldoTotal / totalReceitas) * 100) : 0
        };
    }, []);

    // Função para filtrar transações por período
    const filterTransacoesByPeriod = useCallback((transacoesList, period) => {
        const hoje = new Date();
        let dataInicio;

        switch (period) {
            case 'week':
                dataInicio = new Date(hoje);
                dataInicio.setDate(hoje.getDate() - 7);
                break;
            case 'month':
                dataInicio = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
                break;
            case 'year':
                dataInicio = new Date(hoje.getFullYear(), 0, 1);
                break;
            case 'all':
            default:
                return transacoesList;
        }

        return transacoesList.filter(t => new Date(t.data) >= dataInicio);
    }, []);

    // Função para carregar dados com retry automático
    const loadData = useCallback(async (useCache = true) => {
        const cacheKey = `financeiro_${filterPeriod}`;
        
        try {
            // Tentar usar cache primeiro
            if (useCache) {
                const cachedData = financeiroCache.get(cacheKey);
                if (cachedData) {
                    console.log('📊 Dados financeiros carregados do cache');
                    setTransacoes(cachedData.transacoes);
                    setStats(cachedData.stats);
                    setLastUpdate(new Date(cachedData.timestamp));
                    setIsLoading(false);
                    setError(null);
                    return;
                }
            }

            setIsLoading(true);
            setError(null);

            // Carregar dados da API
            console.log('🔄 Carregando dados financeiros da API...');
            const response = await financeiroService.getAll();
            
            if (response && Array.isArray(response)) {
                const filteredTransacoes = filterTransacoesByPeriod(response, filterPeriod);
                const calculatedStats = calculateStats(filteredTransacoes);
                
                // Salvar no cache
                const dataToCache = {
                    transacoes: filteredTransacoes,
                    stats: calculatedStats,
                    timestamp: Date.now()
                };
                financeiroCache.set(cacheKey, dataToCache);
                
                setTransacoes(filteredTransacoes);
                setStats(calculatedStats);
                setLastUpdate(new Date());
                setRetryCount(0);
                
                console.log('✅ Dados financeiros carregados com sucesso:', {
                    total: filteredTransacoes.length,
                    receitas: calculatedStats.totalReceitas,
                    despesas: calculatedStats.totalDespesas,
                    saldo: calculatedStats.saldoTotal
                });
            } else {
                throw new Error('Formato de dados inválido recebido da API');
            }
        } catch (err) {
            console.error('❌ Erro ao carregar dados financeiros:', err);
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
    }, [filterPeriod, calculateStats, filterTransacoesByPeriod, retryCount]);

    // Função para recarregar dados
    const reload = useCallback(() => {
        console.log('🔄 Recarregando dados financeiros...');
        financeiroCache.clear();
        setRetryCount(0);
        loadData(false);
    }, [loadData]);

    // Verificar se o cache é válido
    const isCacheValid = useMemo(() => {
        return financeiroCache.isValid(`financeiro_${filterPeriod}`);
    }, [filterPeriod, lastUpdate]);

    // Carregar dados quando o componente monta ou o período muda
    useEffect(() => {
        loadData();
    }, [loadData]);

    // Auto-refresh a cada 10 minutos se a página estiver ativa
    useEffect(() => {
        const interval = setInterval(() => {
            if (document.visibilityState === 'visible' && !isCacheValid) {
                console.log('🔄 Auto-refresh dos dados financeiros...');
                loadData(false);
            }
        }, 10 * 60 * 1000); // 10 minutos

        return () => clearInterval(interval);
    }, [loadData, isCacheValid]);

    // Limpar cache quando o componente desmonta
    useEffect(() => {
        return () => {
            // Não limpar o cache ao desmontar para permitir navegação rápida
        };
    }, []);

    // Dados filtrados por período (memoizados para performance)
    const filteredData = useMemo(() => {
        return {
            transacoes,
            stats
        };
    }, [transacoes, stats]);

    return {
        transacoes: filteredData.transacoes,
        stats: filteredData.stats,
        isLoading,
        error,
        reload,
        lastUpdate,
        isCacheValid,
        filterPeriod,
        setFilterPeriod,
        
        // Funções utilitárias
        calculateStats,
        filterTransacoesByPeriod,
        
        // Informações de debug
        cacheInfo: {
            hasCache: financeiroCache.cache.size > 0,
            cacheSize: financeiroCache.cache.size,
            retryCount
        }
    };
}