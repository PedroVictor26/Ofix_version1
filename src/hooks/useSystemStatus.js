import { useState, useEffect } from 'react';
import * as servicosService from '../services/servicos.service.js';
import * as pecasService from '../services/pecas.service.js';
import * as financeiroService from '../services/financeiro.service.js';

export const useSystemStatus = () => {
    const [status, setStatus] = useState({
        servicosAtivos: 0,
        estoqueBaixo: 0,
        faturamentoHoje: 0,
        isLoading: true,
        error: null
    });

    const fetchSystemStatus = async () => {
        try {
            setStatus(prev => ({ ...prev, isLoading: true, error: null }));

            // Buscar serviços ativos (em andamento)
            const servicosResponse = await servicosService.getAllServicos();
            const servicosAtivos = servicosResponse.filter(s => 
                s.status === 'EM_ANDAMENTO' || s.status === 'AGUARDANDO_PECAS'
            ).length;

            // Buscar peças com estoque baixo
            const pecasResponse = await pecasService.getAllPecas();
            const estoqueBaixo = pecasResponse.filter(p => 
                p.quantidade_estoque <= (p.estoque_minimo || 5)
            ).length;

            // Calcular faturamento de hoje
            const hoje = new Date().toISOString().split('T')[0];
            const transacoesResponse = await financeiroService.getAllTransacoes();
            const faturamentoHoje = transacoesResponse
                .filter(t => 
                    t.tipo === 'RECEITA' && 
                    t.data_vencimento?.startsWith(hoje)
                )
                .reduce((total, t) => total + (t.valor || 0), 0);

            setStatus({
                servicosAtivos,
                estoqueBaixo,
                faturamentoHoje,
                isLoading: false,
                error: null
            });

        } catch (error) {
            console.error('Erro ao buscar status do sistema:', error);
            setStatus(prev => ({
                ...prev,
                isLoading: false,
                error: 'Erro ao carregar dados do sistema'
            }));
        }
    };

    useEffect(() => {
        fetchSystemStatus();
        
        // Atualizar a cada 30 segundos
        const interval = setInterval(fetchSystemStatus, 30000);
        
        return () => clearInterval(interval);
    }, []);

    const formatCurrency = (value) => {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL'
        }).format(value || 0);
    };

    return {
        ...status,
        faturamentoHojeFormatted: formatCurrency(status.faturamentoHoje),
        refresh: fetchSystemStatus
    };
};
