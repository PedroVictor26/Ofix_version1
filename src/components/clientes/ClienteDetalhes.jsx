import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  User,
  Car,
  Wrench,
  Phone,
  Mail,
  MapPin,
  Plus,
  Edit,
  Calendar,
  Hash,
  ShieldCheck,
  Trash2,
} from "lucide-react";

// Sub-componente para a seção de informações de contato
const ContactInfo = ({ cliente }) => (
  <section className="space-y-4">
    <h3 className="text-lg font-semibold text-slate-800">
      Informações de Contato
    </h3>
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
      <div className="flex items-start gap-3">
        <Phone className="w-4 h-4 text-slate-500 mt-1 flex-shrink-0" />
        <span className="text-slate-700">
          {cliente.telefone || "Não informado"}
        </span>
      </div>
      <div className="flex items-start gap-3">
        <Mail className="w-4 h-4 text-slate-500 mt-1 flex-shrink-0" />
        <span className="text-slate-700 truncate">
          {cliente.email || "Não informado"}
        </span>
      </div>
      <div className="flex items-start gap-3 sm:col-span-2">
        <MapPin className="w-4 h-4 text-slate-500 mt-1 flex-shrink-0" />
        <span className="text-slate-700">
          {cliente.endereco || "Endereço não informado"}
        </span>
      </div>
    </div>
  </section>
);

// Sub-componente para a lista de veículos
const VeiculosSection = ({ veiculos, onAddVeiculo }) => (
  <section>
    <div className="flex justify-between items-center mb-4">
      <h3 className="text-lg font-semibold text-slate-800">
        Veículos ({veiculos.length})
      </h3>
      <Button variant="outline" size="sm" onClick={onAddVeiculo}>
        <Plus className="w-4 h-4 mr-2" />
        Adicionar
      </Button>
    </div>
    <div className="space-y-4">
      {veiculos.length > 0 ? (
        veiculos.map((veiculo) => (
          <div
            key={veiculo.id}
            className="p-4 rounded-lg border border-slate-200 bg-slate-50"
          >
            <div className="flex justify-between items-start">
              <div>
                <p className="font-bold text-slate-800">{veiculo.modelo}</p>
                <p className="text-sm text-slate-500">{veiculo.cor}</p>
              </div>
              <Badge variant="secondary" className="font-mono text-xs">
                {veiculo.placa}
              </Badge>
            </div>
            <div className="flex items-center gap-4 mt-2 text-xs text-slate-500">
              <div className="flex items-center gap-1.5">
                <Calendar className="w-3 h-3" />
                <span>{veiculo.ano}</span>
              </div>
            </div>
          </div>
        ))
      ) : (
        <div className="text-center py-8 px-4 rounded-lg border-2 border-dashed border-slate-200">
          <Car className="w-8 h-8 mx-auto text-slate-400 mb-2" />
          <p className="text-sm text-slate-500">Nenhum veículo cadastrado.</p>
        </div>
      )}
    </div>
  </section>
);

// Sub-componente para o histórico de serviços
const ServicosSection = ({ servicos, veiculos }) => (
  <section>
    <h3 className="text-lg font-semibold text-slate-800 mb-4">
      Histórico de Serviços ({servicos.length})
    </h3>
    <div className="space-y-4">
      {servicos.length > 0 ? (
        servicos.map((servico) => {
          const veiculo = veiculos.find((v) => v.id === servico.veiculo_id);
          return (
            <div
              key={servico.id}
              className="p-4 rounded-lg border border-slate-200 bg-slate-50"
            >
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-bold text-slate-800">{servico.problema}</p>
                  <p className="text-sm text-slate-500">
                    {veiculo
                      ? `${veiculo.modelo} - ${veiculo.placa}`
                      : "Veículo não identificado"}
                  </p>
                </div>
                <Badge
                  className="capitalize"
                  variant={
                    servico.status === "finalizado" ? "success" : "default"
                  }
                >
                  {servico.status.replace("_", " ")}
                </Badge>
              </div>
              <div className="flex items-center gap-4 mt-3 text-xs text-slate-500">
                <div className="flex items-center gap-1.5">
                  <Hash className="w-3 h-3" />
                  <span>OS: {servico.id}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Calendar className="w-3 h-3" />
                  <span>{servico.data_entrada}</span>
                </div>
              </div>
            </div>
          );
        })
      ) : (
        <div className="text-center py-8 px-4 rounded-lg border-2 border-dashed border-slate-200">
          <Wrench className="w-8 h-8 mx-auto text-slate-400 mb-2" />
          <p className="text-sm text-slate-500">Nenhum serviço registrado.</p>
        </div>
      )}
    </div>
  </section>
);

export default function ClienteDetalhes({
  isOpen,
  onClose,
  cliente,
  veiculos,
  servicos,
  onEditCliente,
  onAddVeiculo,
  onDeleteCliente,
}) {
  if (!cliente) return null;

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent
        className="w-full sm:max-w-lg bg-white p-0 flex flex-col"
        aria-describedby="cliente-detalhes-description"
      >
        <SheetHeader className="p-6">
          <SheetTitle className="text-2xl font-bold text-slate-900 flex items-center gap-3">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <User className="w-6 h-6 text-blue-600" />
            </div>
            {cliente.nome}
          </SheetTitle>
          <p id="cliente-detalhes-description" className="sr-only">
            Detalhes do cliente, veículos e histórico de serviços.
          </p>
        </SheetHeader>

        <div className="px-6 pb-6 space-y-6 overflow-y-auto flex-1">
          <ContactInfo cliente={cliente} />
          <Separator />
          <VeiculosSection veiculos={veiculos} onAddVeiculo={onAddVeiculo} />
          <Separator />
          <ServicosSection servicos={servicos} veiculos={veiculos} />
        </div>

        <SheetFooter className="p-6 bg-slate-50 border-t border-slate-200">
          <div className="flex gap-3 w-full">
            <Button
              variant="outline"
              onClick={() => onEditCliente(cliente)}
              className="flex-1"
            >
              <Edit className="w-4 h-4 mr-2" />
              Editar Cliente
            </Button>
            <Button
              variant="outline"
              onClick={() => onDeleteCliente(cliente)}
              className="flex-1 text-red-600 border-red-200 hover:bg-red-50 hover:border-red-300"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Excluir Cliente
            </Button>
          </div>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
