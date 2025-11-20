import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import * as servicosService from "../../services/servicos.service.js";
import { getAllProcedimentos } from "../../services/procedimentos.service";
import { getAllMensagens } from "../../services/mensagens.service";
import { getAllPecas } from "../../services/pecas.service";
import { Wrench, MessageCircle, Package, FileText } from "lucide-react";
import toast from "react-hot-toast";

import ServiceDetails from "./ServiceDetails";
import ServiceProcedures from "./ServiceProcedures";
import ServiceMessages from "./ServiceMessages";
import ServiceParts from "./ServiceParts";

export default function ServiceModal({
  isOpen,
  onClose,
  service,
  onUpdate,
  clientes,
  veiculos,
  isGuest,
}) {
  const [activeTab, setActiveTab] = useState("details");
  const [procedimentos, setProcedimentos] = useState([]);
  const [mensagens, setMensagens] = useState([]);
  const [pecas, setPecas] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  // Log para debugar
  console.log("ServiceModal - Props recebidas:", {
    isOpen,
    service,
    hasServiceId: service?.id,
  });

  useEffect(() => {
    if (isOpen && service) {
      const loadData = async () => {
        setIsLoading(true);
        try {
          const [procedimentosData, mensagensData, pecasData] =
            await Promise.all([
              getAllProcedimentos().catch((err) => {
                console.error("Erro ao carregar procedimentos:", err);
                return [];
              }),
              getAllMensagens().catch((err) => {
                console.error("Erro ao carregar mensagens:", err);
                return [];
              }),
              getAllPecas().catch((err) => {
                console.error("Erro ao carregar peças:", err);
                return [];
              }),
            ]);

          setProcedimentos(procedimentosData);
          setMensagens(mensagensData);
          setPecas(pecasData);
        } catch (error) {
          console.error("Erro ao carregar dados:", error);
          toast.error(
            "Erro ao carregar dados do serviço. Alguns recursos podem não funcionar corretamente."
          );
        }
        setIsLoading(false);
      };
      loadData();
    }
  }, [isOpen, service]);

  // onUpdate agora é reloadDashboard
  const handleServiceUpdate = async (updatedData) => {
    if (!service || !service.id) {
      toast.error("ID do serviço não encontrado para atualização.");
      return;
    }
    const toastId = toast.loading("Salvando alterações do serviço...");
    try {
      // Prepara os dados para enviar, garantindo que campos numéricos e datas estejam corretos
      // Os subcomponentes (ServiceDetails, etc.) devem fornecer `updatedData` já formatado.
      // Exemplo: se updatedData vier com `dataEntrada` como string, converter para Date.
      // No entanto, o backend Prisma espera strings ISO para datas, então pode não ser necessário converter aqui
      // se o formulário já estiver enviando strings no formato correto.
      // Por segurança, pode-se fazer uma normalização aqui ou garantir nos subcomponentes.

      await servicosService.updateServico(service.id, updatedData);
      toast.success("Serviço atualizado com sucesso!", { id: toastId });
      onUpdate(); // Chama a função reloadDashboard passada por props
      // onClose(); // Fechar o modal também, se onUpdate não o fizer. Geralmente onUpdate (reload) é suficiente e o modal fecha.
    } catch (error) {
      console.error("Erro ao atualizar serviço:", error);
      toast.error(error.message || "Falha ao atualizar serviço.", {
        id: toastId,
      });
    }
  };

  console.log("📦 Dados recebidos no modal:", { service, isOpen });

  // Verificação de segurança após todos os hooks
  if (!isOpen || !service || !service.id) {
    return null;
  }

  // Clientes e Veiculos - clientes é um mapa, veiculos é um array
  const cliente = clientes[service.clienteId];
  const veiculo = veiculos?.find(
    (v) => v.id === service.veiculoId || v.id === service.veiculo?.id
  );

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent
        aria-describedby="service-dialog-desc"
        className="bg-white text-black dark:bg-white dark:text-black p-6 rounded-xl shadow-xl max-w-4xl max-h-[90vh] overflow-y-auto"
      >
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-2xl font-bold text-slate-900">
              Ordem de Serviço #{service.numeroOs}
            </DialogTitle>
            <Badge variant="secondary" className="text-sm">
              {service.status?.replace("_", " ")}
            </Badge>
          </div>
        </DialogHeader>
        <p id="service-dialog-desc" className="sr-only">
          Detalhes do serviço selecionado
        </p>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="details" className="flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Detalhes
            </TabsTrigger>
            <TabsTrigger value="procedures" className="flex items-center gap-2">
              <Wrench className="w-4 h-4" />
              Procedimentos
            </TabsTrigger>
            <TabsTrigger value="parts" className="flex items-center gap-2">
              <Package className="w-4 h-4" />
              Peças
            </TabsTrigger>
            <TabsTrigger value="messages" className="flex items-center gap-2">
              <MessageCircle className="w-4 h-4" />
              Mensagens
            </TabsTrigger>
          </TabsList>

          <TabsContent value="details" className="mt-6">
            <ServiceDetails
              service={service}
              cliente={cliente}
              veiculo={veiculo}
              onUpdate={handleServiceUpdate}
              isGuest={isGuest}
            />
          </TabsContent>

          <TabsContent value="procedures" className="mt-6">
            <ServiceProcedures
              service={service}
              procedimentos={procedimentos}
              onUpdate={handleServiceUpdate}
              isGuest={isGuest}
            />
          </TabsContent>

          <TabsContent value="parts" className="mt-6">
            <ServiceParts
              service={service}
              pecas={pecas}
              onUpdate={handleServiceUpdate}
              isGuest={isGuest}
            />
          </TabsContent>

          <TabsContent value="messages" className="mt-6">
            <ServiceMessages
              service={service}
              cliente={cliente}
              veiculo={veiculo}
              mensagens={mensagens}
              isGuest={isGuest}
            />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
