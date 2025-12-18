import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Settings, Wrench, MessageCircle, Plus } from "lucide-react";

import { useConfiguracoesData } from "@/hooks/useConfiguracoesData";
import ProcedimentoModal from "@/components/configuracoes/ProcedimentoModal";
import MensagemModal from "@/components/configuracoes/MensagemModal";
import ProcedimentosList from "@/components/configuracoes/ProcedimentosList";
import MensagensList from "@/components/configuracoes/MensagensList";
import DeleteProcedimentoDialog from "@/components/configuracoes/DeleteProcedimentoDialog";
import DeleteMensagemDialog from "@/components/configuracoes/DeleteMensagemDialog";
import { deleteProcedimento } from "@/services/procedimentos.service";
import { deleteMensagem } from "@/services/mensagens.service";
import toast from "react-hot-toast";

export default function Configuracoes() {
  const { procedimentos, mensagens, isLoading, error, reload } =
    useConfiguracoesData();
  const [activeTab, setActiveTab] = useState("procedimentos");
  const [showProcedimentoModal, setShowProcedimentoModal] = useState(false);
  const [editingProcedimento, setEditingProcedimento] = useState(null);
  const [showMensagemModal, setShowMensagemModal] = useState(false);
  const [editingMensagem, setEditingMensagem] = useState(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deletingProcedimento, setDeletingProcedimento] = useState(null);
  const [showDeleteMensagemDialog, setShowDeleteMensagemDialog] =
    useState(false);
  const [deletingMensagem, setDeletingMensagem] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleNewProcedimento = () => {
    setEditingProcedimento(null);
    setShowProcedimentoModal(true);
  };

  const handleEditProcedimento = (procedimento) => {
    setEditingProcedimento(procedimento);
    setShowProcedimentoModal(true);
  };

  const handleProcedimentoSuccess = () => {
    reload();
    setShowProcedimentoModal(false);
    setEditingProcedimento(null);
  };

  const handleNewMensagem = () => {
    setEditingMensagem(null);
    setShowMensagemModal(true);
  };

  const handleEditMensagem = (mensagem) => {
    setEditingMensagem(mensagem);
    setShowMensagemModal(true);
  };

  const handleMensagemSuccess = () => {
    reload();
    setShowMensagemModal(false);
    setEditingMensagem(null);
  };

  const handleDeleteProcedimento = (procedimento) => {
    setDeletingProcedimento(procedimento);
    setShowDeleteDialog(true);
  };

  const handleDeleteMensagem = (mensagem) => {
    setDeletingMensagem(mensagem);
    setShowDeleteMensagemDialog(true);
  };

  const handleConfirmDelete = async () => {
    if (!deletingProcedimento) return;

    setIsDeleting(true);
    try {
      await deleteProcedimento(deletingProcedimento.id);
      toast.success(
        `Procedimento "${deletingProcedimento.nome}" excluído com sucesso!`
      );
      reload();
      setShowDeleteDialog(false);
      setDeletingProcedimento(null);
    } catch (error) {
      console.error("Erro ao excluir procedimento:", error);
      toast.error(
        error.message || "Erro ao excluir procedimento. Tente novamente."
      );
    } finally {
      setIsDeleting(false);
    }
  };

  const handleConfirmDeleteMensagem = async () => {
    if (!deletingMensagem) return;

    setIsDeleting(true);
    try {
      await deleteMensagem(deletingMensagem.id);
      toast.success(
        `Template "${deletingMensagem.nome}" excluído com sucesso!`
      );
      reload();
      setShowDeleteMensagemDialog(false);
      setDeletingMensagem(null);
    } catch (error) {
      console.error("Erro ao excluir template:", error);
      toast.error(
        error.message || "Erro ao excluir template. Tente novamente."
      );
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="p-2">
      <div className="w-full">
        {/* Header */}
        <header className="mb-2">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold text-slate-800 dark:text-slate-100">
                Base de Conhecimento
              </h1>
              <p className="text-slate-500 dark:text-slate-400 mt-1">
                Gerencie procedimentos e templates de mensagem padrão.
              </p>
            </div>
          </div>
        </header>

        {/* Tabs */}
        <Card className="bg-white dark:bg-slate-900 shadow-sm border-slate-200 dark:border-slate-800">
          <CardContent className="p-0">
            <Tabs
              value={activeTab}
              onValueChange={setActiveTab}
              className="w-full"
            >
              <div className="p-4">
                <TabsList className="bg-transparent p-0 h-auto gap-2">
                  <TabsTrigger
                    value="procedimentos"
                    className="rounded-lg bg-blue-600 text-white hover:bg-blue-700 data-[state=active]:bg-blue-600 data-[state=active]:text-white px-6 py-3 text-base font-medium"
                  >
                    <Wrench className="w-5 h-5 mr-2" />
                    Procedimentos Padrão
                  </TabsTrigger>
                  <TabsTrigger
                    value="mensagens"
                    className="rounded-lg bg-gray-200 dark:bg-slate-800 text-gray-700 dark:text-slate-300 hover:bg-gray-300 dark:hover:bg-slate-700 data-[state=active]:bg-blue-600 data-[state=active]:text-white px-6 py-3 text-base font-medium"
                  >
                    <MessageCircle className="w-5 h-5 mr-2" />
                    Templates de Mensagem
                  </TabsTrigger>
                </TabsList>
              </div>

              <TabsContent value="procedimentos" className="p-6 space-y-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100">
                    Lista de Procedimentos
                  </h3>
                  <Button
                    onClick={handleNewProcedimento}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Novo Procedimento
                  </Button>
                </div>
                <ProcedimentosList
                  procedimentos={procedimentos}
                  onEdit={handleEditProcedimento}
                  onDelete={handleDeleteProcedimento}
                  isLoading={isLoading}
                />
              </TabsContent>

              <TabsContent value="mensagens" className="p-6 space-y-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100">
                    Lista de Templates
                  </h3>
                  <Button
                    onClick={handleNewMensagem}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Nova Mensagem
                  </Button>
                </div>
                <MensagensList
                  mensagens={mensagens}
                  onEdit={handleEditMensagem}
                  onDelete={handleDeleteMensagem}
                  isLoading={isLoading}
                />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>

      {/* Modals */}
      <ProcedimentoModal
        isOpen={showProcedimentoModal}
        onClose={() => setShowProcedimentoModal(false)}
        procedimento={editingProcedimento}
        onSuccess={handleProcedimentoSuccess}
      />
      <MensagemModal
        isOpen={showMensagemModal}
        onClose={() => setShowMensagemModal(false)}
        mensagem={editingMensagem}
        onSuccess={handleMensagemSuccess}
      />
      <DeleteProcedimentoDialog
        isOpen={showDeleteDialog}
        onClose={() => setShowDeleteDialog(false)}
        procedimento={deletingProcedimento}
        onConfirm={handleConfirmDelete}
        isDeleting={isDeleting}
      />
      <DeleteMensagemDialog
        isOpen={showDeleteMensagemDialog}
        onClose={() => setShowDeleteMensagemDialog(false)}
        mensagem={deletingMensagem}
        onConfirm={handleConfirmDeleteMensagem}
        isDeleting={isDeleting}
      />
    </div>
  );
}
