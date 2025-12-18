import { useState } from "react";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Edit, Package, Trash2, AlertTriangle } from "lucide-react";
import { deletePeca } from "@/services/pecas.service";
import toast from "react-hot-toast";

const PecaRow = ({ peca, fornecedores, onEdit, onDelete }) => {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const fornecedor = fornecedores.find((f) => f.id === peca.fornecedorId);
  const quantidade = Number(peca.quantidade || peca.estoqueAtual || 0);
  const estoqueMinimo = Number(peca.estoqueMinimo || 0);
  const isEstoqueBaixo = quantidade <= estoqueMinimo;

  const handleDelete = async () => {
    setIsDeleting(true);
    const toastId = toast.loading('Excluindo peça...');

    try {
      await deletePeca(peca.id);
      toast.success('Peça excluída com sucesso! 🎉', { id: toastId });
      setShowDeleteConfirm(false);
      onDelete?.(); // Callback para recarregar lista
    } catch (error) {
      toast.error('Erro ao excluir peça', { id: toastId });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
      <TableRow className="bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800">
        <TableCell>
          <div className="font-medium text-slate-800 dark:text-slate-100">{peca.nome}</div>
          <div className="text-sm text-slate-500 dark:text-slate-400">
            SKU: {peca.sku || peca.codigoFabricante}
          </div>
        </TableCell>
        <TableCell>
          <Badge variant={isEstoqueBaixo ? "destructive" : "secondary"}>
            {quantidade} em estoque
          </Badge>
        </TableCell>
        <TableCell className="text-slate-600 dark:text-slate-300">
          {fornecedor?.nome || "Não informado"}
        </TableCell>
        <TableCell className="font-medium text-slate-800 dark:text-slate-100">
          R$ {Number(peca.precoVenda || 0).toFixed(2)}
        </TableCell>
        <TableCell className="text-right">
          <div className="flex items-center justify-end gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onEdit(peca)}
              title="Editar peça"
            >
              <Edit className="w-4 h-4" />
            </Button>

            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowDeleteConfirm(true)}
              className="hover:bg-red-50 dark:hover:bg-red-900/30 hover:text-red-600 dark:hover:text-red-400"
              title="Excluir peça"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </TableCell>
      </TableRow>

      {/* Modal de Confirmação */}
      <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="w-5 h-5" />
              Excluir Peça
            </DialogTitle>
            <DialogDescription>
              Tem certeza que deseja excluir <strong>{peca.nome}</strong>?
              <br />
              <span className="text-red-600 font-medium">
                Esta ação não pode ser desfeita.
              </span>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowDeleteConfirm(false)}
              disabled={isDeleting}
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={isDeleting}
            >
              {isDeleting ? 'Excluindo...' : 'Excluir'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

const EmptyState = () => (
  <TableRow>
    <TableCell colSpan={5} className="h-48 text-center">
      <Package className="w-12 h-12 mx-auto text-slate-300 mb-4" />
      <h3 className="font-semibold text-slate-700 dark:text-slate-200">Nenhuma peça encontrada</h3>
      <p className="text-sm text-slate-500 dark:text-slate-400">
        Tente ajustar os filtros ou adicione uma nova peça.
      </p>
    </TableCell>
  </TableRow>
);

export default function PecasListTable({ pecas, fornecedores, onEditPeca, onDeletePeca }) {
  return (
    <div className="border border-slate-200 dark:border-slate-800 rounded-xl">
      <Table>
        <TableHeader className="bg-slate-50 dark:bg-slate-800">
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
                onDelete={onDeletePeca}
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
