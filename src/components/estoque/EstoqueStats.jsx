import { Package, DollarSign, AlertTriangle, Building2 } from "lucide-react";
import StatsCards, { StatsCardSkeleton } from "@/components/dashboard/StatsCards"; // Reutilizando o StatsCards do dashboard

export default function EstoqueStats({ stats, isLoading }) {
    const { totalPecas, valorTotalEstoque, pecasEstoqueBaixo, totalFornecedores } = stats;

    const statItems = [
        {
            title: "Total de Itens",
            value: totalPecas,
            icon: Package,
            color: "text-blue-600",
            bgColor: "bg-blue-100",
        },
        {
            title: "Valor do Estoque",
            value: `R$ ${valorTotalEstoque.toFixed(2)}`,
            icon: DollarSign,
            color: "text-green-600",
            bgColor: "bg-green-100",
        },
        {
            title: "Estoque Baixo",
            value: pecasEstoqueBaixo,
            icon: AlertTriangle,
            color: "text-orange-600",
            bgColor: "bg-orange-100",
        },
        {
            title: "Fornecedores",
            value: totalFornecedores,
            icon: Building2,
            color: "text-purple-600",
            bgColor: "bg-purple-100",
        }
    ];

    if (isLoading) {
        return (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {Array(4).fill(0).map((_, i) => <StatsCardSkeleton key={i} />)}
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {statItems.map((stat) => (
                <StatsCards
                    key={stat.title}
                    title={stat.title}
                    value={stat.value}
                    icon={stat.icon}
                    color={stat.color}
                    bgColor={stat.bgColor}
                />
            ))}
        </div>
    );
}
