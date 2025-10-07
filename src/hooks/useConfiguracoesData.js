import { useState, useEffect, useCallback } from 'react';
import { getAllProcedimentos } from '../services/procedimentos.service';
import { getAllMensagens } from '../services/mensagens.service';

export function useConfiguracoesData() {
    const [procedimentos, setProcedimentos] = useState([]);
    const [mensagens, setMensagens] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    const loadData = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const [procedimentosData, mensagensData] = await Promise.all([
                getAllProcedimentos(),
                getAllMensagens(),
            ]);
            setProcedimentos(procedimentosData || []);
            setMensagens(mensagensData || []);
        } catch (err) {
            console.error("Erro ao carregar dados de configurações:", err);
            setError(err.message || "Falha ao carregar dados.");
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        loadData();
    }, [loadData]);

    return {
        procedimentos,
        mensagens,
        isLoading,
        error,
        reload: loadData,
    };
}
