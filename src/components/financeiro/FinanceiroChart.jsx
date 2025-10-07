import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useMemo } from 'react';

const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-white p-3 rounded-lg shadow-lg border border-slate-200">
                <p className="font-semibold text-slate-700">{label}</p>
                <p className="text-sm text-green-600">{`Entradas: R$ ${parseFloat(payload[0].value).toFixed(2)}`}</p>
                <p className="text-sm text-red-600">{`Saídas: R$ ${parseFloat(payload[1].value).toFixed(2)}`}</p>
            </div>
        );
    }
    return null;
};

export default function FinanceiroChart({ transacoes }) {
    const chartData = useMemo(() => {
        const grouped = transacoes.reduce((acc, t) => {
            const date = new Date(t.data).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
            if (!acc[date]) {
                acc[date] = { date, entradas: 0, saidas: 0 };
            }
            if (t.tipo === 'Entrada') {
                acc[date].entradas += parseFloat(t.valor);
            } else {
                acc[date].saidas += parseFloat(t.valor);
            }
            return acc;
        }, {});
        return Object.values(grouped).sort((a, b) => a.date.localeCompare(b.date));
    }, [transacoes]);

    return (
        <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="date" tick={{ fill: '#64748b', fontSize: 12 }} tickLine={false} axisLine={false} />
                    <YAxis tick={{ fill: '#64748b', fontSize: 12 }} tickLine={false} axisLine={false} tickFormatter={(value) => `R$${value / 1000}k`} />
                    <Tooltip content={<CustomTooltip />} cursor={{ fill: '#f1f5f9' }} />
                    <Legend wrapperStyle={{ fontSize: "14px" }} />
                    <Bar dataKey="entradas" fill="#22c55e" name="Entradas" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="saidas" fill="#ef4444" name="Saídas" radius={[4, 4, 0, 0]} />
                </BarChart>
            </ResponsiveContainer>
        </div>
    );
}
