import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, TrendingUp, BarChart2 } from "lucide-react";

import { useFinanceiroData } from "@/hooks/useFinanceiroData";
import FinanceiroStats from "@/components/financeiro/FinanceiroStats";
import FinanceiroChart from "@/components/financeiro/FinanceiroChart";
import FinanceiroTable from "@/components/financeiro/FinanceiroTable";
import FinanceiroModal from "@/components/financeiro/FinanceiroModal";

export default function FinanceiroPage() {
  const {
    transacoes,
    stats,
    isLoading,
    error,
    filterPeriod,
    setFilterPeriod,
    reload,
  } = useFinanceiroData();

  const [isModalOpen, setModalOpen] = useState(false);
  const [editingTransacao, setEditingTransacao] = useState(null);

  const handleNewTransacao = () => {
    setEditingTransacao(null);
    setModalOpen(true);
  };

  const handleEditTransacao = (transacao) => {
    setEditingTransacao(transacao);
    setModalOpen(true);
  };

  const handleModalSuccess = () => {
    reload();
    setModalOpen(false);
  };

  return (
    <div className="p-2">
      <div className="w-full">
        {/* Header */}
        <header className="mb-2">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold text-slate-800 dark:text-slate-100">
                Gestão Financeira
              </h1>
              <p className="text-slate-500 dark:text-slate-400 mt-1">
                Acompanhe as entradas e saídas da sua oficina.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Select value={filterPeriod} onValueChange={setFilterPeriod}>
                <SelectTrigger className="w-40 bg-blue-600 text-white border-blue-600 hover:bg-blue-700 focus:ring-blue-500">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="week">Últimos 7 dias</SelectItem>
                  <SelectItem value="month">Este Mês</SelectItem>
                  <SelectItem value="year">Este Ano</SelectItem>
                  <SelectItem value="all">Tudo</SelectItem>
                </SelectContent>
              </Select>
              <Button
                onClick={handleNewTransacao}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <Plus className="w-4 h-4 mr-2" />
                Nova Transação
              </Button>
            </div>
          </div>
        </header>

        {/* Stats */}
        <section className="mb-2">
          <FinanceiroStats stats={stats} isLoading={isLoading} />
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Gráfico */}
          <div className="lg:col-span-2">
            <Card className="bg-white dark:bg-slate-900 shadow-sm border-slate-200 dark:border-slate-800">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-xl text-slate-800 dark:text-slate-100">
                  <BarChart2 className="w-5 h-5" />
                  Fluxo de Caixa
                </CardTitle>
              </CardHeader>
              <CardContent>
                <FinanceiroChart transacoes={transacoes} />
              </CardContent>
            </Card>
          </div>

          {/* Tabela de Transações Recentes */}
          <div className="lg:col-span-1">
            <Card className="bg-white dark:bg-slate-900 shadow-sm border-slate-200 dark:border-slate-800">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-xl text-slate-800 dark:text-slate-100">
                  <TrendingUp className="w-5 h-5" />
                  Transações Recentes
                </CardTitle>
              </CardHeader>
              <CardContent>
                <FinanceiroTable
                  transacoes={transacoes.slice(0, 5)} // Mostra apenas as 5 mais recentes
                  onEditTransacao={handleEditTransacao}
                />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Modal */}
      <FinanceiroModal
        isOpen={isModalOpen}
        onClose={() => setModalOpen(false)}
        transacao={editingTransacao}
        onSuccess={handleModalSuccess}
      />
    </div>
  );
}
