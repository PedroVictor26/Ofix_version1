import { useState, useEffect, useMemo, useCallback } from "react";
import { getAllPecas } from "../services/pecas.service";
import { getAllFornecedores } from "../services/fornecedores.service";

export function useEstoqueData() {
  const [pecas, setPecas] = useState([]);
  const [fornecedores, setFornecedores] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [pecasData, fornecedoresData] = await Promise.all([
        getAllPecas(),
        getAllFornecedores(),
      ]);
      setPecas(pecasData || []);
      setFornecedores(fornecedoresData || []);
    } catch (err) {
      console.error("Erro ao carregar dados de estoque:", err);
      setError(err.message || "Falha ao carregar dados.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const stats = useMemo(() => {
    const totalPecas = pecas.length;
    const valorTotalEstoque = pecas.reduce((total, peca) => {
      const quantidade = Number(peca.quantidade || peca.estoqueAtual || 0);
      const precoCusto = Number(peca.precoCusto || 0);
      return total + quantidade * precoCusto;
    }, 0);
    const pecasEstoqueBaixo = pecas.filter((p) => {
      const qtd = Number(p.quantidade || p.estoqueAtual || 0);
      const min = Number(p.estoqueMinimo || 0);
      return qtd <= min;
    }).length;
    const totalFornecedores = fornecedores.length;

    return {
      totalPecas,
      valorTotalEstoque,
      pecasEstoqueBaixo,
      totalFornecedores,
    };
  }, [pecas, fornecedores]);

  return {
    pecas,
    fornecedores,
    stats,
    isLoading,
    error,
    reload: loadData,
  };
}
