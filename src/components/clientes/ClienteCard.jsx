import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { User, Car, Phone, Mail, MapPin, Edit, Trash2 } from "lucide-react";

// Skeleton atualizado para refletir o novo design do card
export const ClienteCardSkeleton = () => (
  <Card className="border-slate-200 shadow-sm">
    <CardContent className="p-6">
      <div className="flex items-center gap-6">
        <Skeleton className="w-16 h-16 rounded-lg" />
        <div className="flex-1 space-y-3">
          <Skeleton className="h-6 w-3/4" />
          <div className="flex gap-4">
            <Skeleton className="h-4 w-1/3" />
            <Skeleton className="h-4 w-1/2" />
          </div>
        </div>
      </div>
    </CardContent>
  </Card>
);

// O componente do Card do Cliente com o novo design
export function ClienteCard({
  cliente,
  veiculos,
  servicos,
  onCardClick,
  onEditClick,
  onDeleteClick,
}) {
  return (
    <Card
      className="bg-white border border-slate-200 shadow-sm rounded-xl cursor-pointer transition-all duration-300 hover:shadow-lg hover:-translate-y-1 group"
      onClick={() => onCardClick(cliente)}
    >
      <CardContent className="p-6">
        <div className="flex items-start justify-between gap-6">
          {/* Lado Esquerdo: Ícone e Informações */}
          <div className="flex items-center gap-5 flex-1">
            <div className="w-16 h-16 bg-blue-100 rounded-lg flex items-center justify-center transition-transform duration-300 group-hover:scale-105">
              <User className="w-8 h-8 text-blue-600" />
            </div>
            <div className="flex-1">
              <h3 className="text-xl font-bold text-slate-800 group-hover:text-blue-600 transition-colors duration-300">
                {cliente.nomeCompleto}
              </h3>
              <div className="flex flex-wrap items-center gap-x-6 gap-y-1 mt-2 text-sm text-slate-500">
                {cliente.telefone && (
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-slate-400" />
                    <span>{cliente.telefone}</span>
                  </div>
                )}
                {cliente.email && (
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-slate-400" />
                    <span className="truncate">{cliente.email}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Lado Direito: Badges e Botão de Editar */}
          <div className="flex flex-col items-end justify-between h-full gap-4">
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="font-normal">
                <Car className="w-3.5 h-3.5 mr-1.5" />
                {veiculos.length} veículo{veiculos.length !== 1 ? "s" : ""}
              </Badge>
              <Badge variant="secondary" className="font-normal">
                {servicos.length} serviço{servicos.length !== 1 ? "s" : ""}
              </Badge>
            </div>
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              <Button
                variant="ghost"
                size="icon"
                onClick={(e) => {
                  e.stopPropagation();
                  onEditClick(cliente);
                }}
                className="h-9 w-9 rounded-full hover:bg-blue-100 hover:text-blue-600"
              >
                <Edit className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={(e) => {
                  e.stopPropagation();
                  onDeleteClick(cliente);
                }}
                className="h-9 w-9 rounded-full hover:bg-red-100 hover:text-red-600"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
