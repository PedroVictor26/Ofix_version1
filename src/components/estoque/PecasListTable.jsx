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
import { Edit, Package } from "lucide-react";

const PecaRow = ({ peca, fornecedores, onEdit }) => {
  const fornecedor = fornecedores.find((f) => f.id === peca.fornecedorId);
  const quantidade = Number(peca.quantidade || peca.estoqueAtual || 0);
  const estoqueMinimo = Number(peca.estoqueMinimo || 0);
  const isEstoqueBaixo = quantidade <= estoqueMinimo;

  return (
    <TableRow className="bg-white hover:bg-slate-50">
      <TableCell>
        <div className="font-medium text-slate-800">{peca.nome}</div>
        <div className="text-sm text-slate-500">
          SKU: {peca.sku || peca.codigoFabricante}
        </div>
      </TableCell>
      <TableCell>
        <Badge variant={isEstoqueBaixo ? "destructive" : "secondary"}>
          {quantidade} em estoque
        </Badge>
      </TableCell>
      <TableCell className="text-slate-600">
        {fornecedor?.nome || "Não informado"}
      </TableCell>
      <TableCell className="font-medium text-slate-800">
        R$ {Number(peca.precoVenda || 0).toFixed(2)}
      </TableCell>
      <TableCell className="text-right">
        <Button variant="ghost" size="icon" onClick={() => onEdit(peca)}>
          <Edit className="w-4 h-4" />
        </Button>
      </TableCell>
    </TableRow>
  );
};

const EmptyState = () => (
  <TableRow>
    <TableCell colSpan={5} className="h-48 text-center">
      <Package className="w-12 h-12 mx-auto text-slate-300 mb-4" />
      <h3 className="font-semibold text-slate-700">Nenhuma peça encontrada</h3>
      <p className="text-sm text-slate-500">
        Tente ajustar os filtros ou adicione uma nova peça.
      </p>
    </TableCell>
  </TableRow>
);

export default function PecasListTable({ pecas, fornecedores, onEditPeca }) {
  return (
    <div className="border border-slate-200 rounded-xl">
      <Table>
        <TableHeader className="bg-slate-50">
          <TableRow>
            <TableHead className="w-[40%]">Peça</TableHead>
            <TableHead>Estoque</TableHead>
            <TableHead>Fornecedor</TableHead>
            <TableHead>Preço de Venda</TableHead>
            <TableHead className="text-right">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {pecas.length > 0 ? (
            pecas.map((peca) => (
              <PecaRow
                key={peca.id}
                peca={peca}
                fornecedores={fornecedores}
                onEdit={onEditPeca}
              />
            ))
          ) : (
            <EmptyState />
          )}
        </TableBody>
      </Table>
    </div>
  );
}
