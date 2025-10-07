import { useEffect, useState, useCallback } from "react";
import * as servicosService from '../services/servicos.service.js';
import { getAllClientes, getAllVeiculos } from '../services/clientes.service.js'; // Importar getAllVeiculos
import toast from "react-hot-toast";

export default function useDashboardData() {
    const [servicos, setServicos] = useState([]);
    const [clientes, setClientes] = useState({}); 
    const [veiculos, setVeiculos] = useState({}); // Inicializar como objeto vazio para o mapa
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    const loadData = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const [servicosResult, clientesResult, veiculosResult] = await Promise.allSettled([
                servicosService.getAllServicos(),
                getAllClientes(),
                getAllVeiculos() // Buscar todos os veículos
            ]);

            if (servicosResult.status === 'fulfilled') {
                setServicos(servicosResult.value || []);
            } else {
                console.error('Erro ao carregar serviços:', servicosResult.reason);
                toast.error("Falha ao carregar serviços.");
            }

            if (clientesResult.status === 'fulfilled') {
                const clientesMap = clientesResult.value.reduce((acc, cliente) => {
                    acc[cliente.id] = cliente;
                    return acc;
                }, {});
                setClientes(clientesMap);
            } else {
                console.error('Erro ao carregar clientes:', clientesResult.reason);
                toast.error("Falha ao carregar clientes.");
            }

            if (veiculosResult.status === 'fulfilled') {
                const veiculosMap = veiculosResult.value.reduce((acc, veiculo) => {
                    acc[veiculo.id] = veiculo;
                    return acc;
                }, {});
                setVeiculos(veiculosMap);
            } else {
                console.error('Erro ao carregar veículos:', veiculosResult.reason);
                toast.error("Falha ao carregar veículos.");
            }

        } catch (err) {
            console.error("Erro ao carregar dados do dashboard:", err);
            setError(err.message || "Falha ao carregar dados do dashboard.");
            toast.error(err.message || "Falha ao carregar dados do dashboard.");
            setServicos([]); 
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        loadData();
    }, [loadData]);

    return {
        servicos,
        clientes,
        veiculos: Object.values(veiculos), // Retornar como array para o componente
        isLoading,
        error,
        reload: loadData,
    };
}
