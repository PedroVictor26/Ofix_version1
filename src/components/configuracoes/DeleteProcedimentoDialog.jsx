import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Trash2, AlertTriangle } from "lucide-react";

export default function DeleteProcedimentoDialog({
  isOpen,
  onClose,
  procedimento,
  onConfirm,
  isDeleting = false,
}) {
  if (!procedimento) return null;

  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent className="bg-white">
        <AlertDialogHeader>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
              <AlertTriangle className="w-6 h-6 text-red-600" />
            </div>
            <div>
              <AlertDialogTitle className="text-xl font-bold text-slate-800">
                Excluir Procedimento
              </AlertDialogTitle>
              <AlertDialogDescription className="text-slate-600 mt-1">
                Esta ação não pode ser desfeita.
              </AlertDialogDescription>
            </div>
          </div>
        </AlertDialogHeader>

        <div className="py-4">
          <p className="text-slate-700">
            Tem certeza que deseja excluir o procedimento{" "}
            <span className="font-semibold">{procedimento.nome}</span>?
          </p>
          <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-lg">
            <p className="text-sm text-amber-800 font-medium mb-1">
              ⚠️ Esta ação irá excluir permanentemente:
            </p>
            <ul className="text-sm text-amber-700 space-y-1">
              <li>• O procedimento padrão</li>
              <li>• Toda a descrição e checklist</li>
              <li>• Configurações de tempo estimado</li>
            </ul>
          </div>
          <p className="text-sm text-slate-500 mt-2">
            Esta ação não pode ser desfeita.
          </p>
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel
            onClick={onClose}
            disabled={isDeleting}
            className="bg-slate-100 hover:bg-slate-200 text-slate-700"
          >
            Cancelar
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            disabled={isDeleting}
            className="bg-red-600 hover:bg-red-700 text-white"
          >
            {isDeleting ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                Excluindo...
              </>
            ) : (
              <>
                <Trash2 className="w-4 h-4 mr-2" />
                Excluir Procedimento
              </>
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
