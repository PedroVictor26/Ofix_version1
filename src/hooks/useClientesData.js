import { useState, useEffect, useCallback } from 'react';
import { getAllClientes } from '../services/clientes.service';
import { getAllServicos } from '../services/servicos.service';

export function useClientesData() {
    const [clientes, setClientes] = useState([]);
    const [servicos, setServicos] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    const loadData = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            // Usando Promise.all para carregar dados em paralelo para melhor performance
            const [clientesData, servicosData] = await Promise.all([
                getAllClientes(),
                getAllServicos()
            ]);

            setClientes(clientesData);
            setServicos(servicosData);
        } catch (err) {
            console.error("Erro ao carregar dados:", err);
            setError(err.message || "Falha ao carregar dados. Tente novamente.");
        } finally {
            setIsLoading(false);
        }
    }, []); // useCallback garante que a função não seja recriada a cada renderização

    useEffect(() => {
        loadData();
    }, [loadData]); // O hook executa a busca de dados na montagem do componente

    const getVeiculosByCliente = (clienteId) => {
        const cliente = clientes.find(c => c.id === clienteId);
        return cliente ? cliente.veiculos : [];
    };

    const getServicosByCliente = (clienteId) => {
        return servicos.filter(s => s.clienteId === clienteId);
    };

    return {
        clientes,
        isLoading,
        error,
        loadData,
        getVeiculosByCliente,
        getServicosByCliente
    };
}
