import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Edit, TrendingUp, TrendingDown, DollarSign } from "lucide-react";

const TransactionRow = ({ transacao, onEdit }) => {
    const isEntrada = transacao.tipo === 'Entrada';
    const parsedValor = parseFloat(transacao.valor || 0);
    return (
        <TableRow className="bg-white hover:bg-slate-50">
            <TableCell>
                <div className="font-medium text-slate-800">{transacao.descricao}</div>
                {transacao.categoria && <div className="text-sm text-slate-500">{transacao.categoria}</div>}
            </TableCell>
            <TableCell className={`font-semibold ${isEntrada ? 'text-green-600' : 'text-red-600'}`}>
                {isEntrada ? '+' : '-'} R$ {parsedValor.toFixed(2)}
            </TableCell>
            <TableCell>
                <Badge variant={isEntrada ? "success" : "destructive"} className="capitalize">
                    {transacao.tipo}
                </Badge>
            </TableCell>
            <TableCell className="text-slate-600">
                {new Date(transacao.data).toLocaleDateString('pt-BR', { timeZone: 'UTC' })}
            </TableCell>
            <TableCell className="text-right">
                <Button variant="ghost" size="icon" onClick={() => onEdit(transacao)}>
                    <Edit className="w-4 h-4" />
                </Button>
            </TableCell>
        </TableRow>
    );
};

const EmptyState = () => (
    <TableRow>
        <TableCell colSpan={5} className="h-48 text-center">
            <DollarSign className="w-12 h-12 mx-auto text-slate-300 mb-4" />
            <h3 className="font-semibold text-slate-700">Nenhuma transação encontrada</h3>
            <p className="text-sm text-slate-500">Tente ajustar o período ou adicione uma nova transação.</p>
        </TableCell>
    </TableRow>
);

export default function FinanceiroTable({ transacoes, onEditTransacao }) {
    return (
        <div className="border border-slate-200 rounded-xl">
            <Table>
                <TableHeader className="bg-slate-50">
                    <TableRow>
                        <TableHead className="w-[45%]">Descrição</TableHead>
                        <TableHead>Valor</TableHead>
                        <TableHead>Tipo</TableHead>
                        <TableHead>Data</TableHead>
                        <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {transacoes.length > 0 ? (
                        transacoes.map(t => <TransactionRow key={t.id} transacao={t} onEdit={onEditTransacao} />)
                    ) : (
                        <EmptyState />
                    )}
                </TableBody>
            </Table>
        </div>
    );
}
