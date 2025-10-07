import { TrendingUp, TrendingDown, Scale } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export default function FinanceiroStats({ stats, isLoading }) {
  const { entradas, saidas, saldo } = stats;

  const parsedEntradas = parseFloat(entradas || 0);
  const parsedSaidas = parseFloat(saidas || 0);
  const parsedSaldo = parseFloat(saldo || 0);

  const statItems = [
    {
      title: "TOTAL DE ENTRADAS",
      value: `R$ ${parsedEntradas.toFixed(2)}`,
      icon: TrendingUp,
      iconColor: "text-green-500",
    },
    {
      title: "TOTAL DE SAÍDAS",
      value: `R$ ${parsedSaidas.toFixed(2)}`,
      icon: TrendingDown,
      iconColor: "text-red-500",
    },
    {
      title: "SALDO LÍQUIDO",
      value: `R$ ${parsedSaldo.toFixed(2)}`,
      icon: Scale,
      iconColor: "text-blue-500",
    },
  ];

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array(3)
          .fill(0)
          .map((_, i) => (
            <Card key={i} className="border-2 border-blue-200 bg-white">
              <CardContent className="p-6">
                <div className="animate-pulse">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
                  <div className="h-8 bg-gray-200 rounded w-1/2"></div>
                </div>
              </CardContent>
            </Card>
          ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {statItems.map((stat) => (
        <Card
          key={stat.title}
          className="border-2 border-blue-200 bg-white hover:shadow-lg transition-shadow"
        >
          <CardContent className="p-6 text-center">
            <div className="flex justify-center mb-4">
              <stat.icon className={`w-8 h-8 ${stat.iconColor}`} />
            </div>
            <p className="text-sm font-medium text-gray-600 mb-2 uppercase tracking-wide">
              {stat.title}
            </p>
            <p className="text-3xl font-bold text-gray-900">{stat.value}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
