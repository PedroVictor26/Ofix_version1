// src/constants/statusConfig.js
import {
    Clock,
    Wrench,
    CheckCircle2,
} from "lucide-react";

export const statusConfig = {
    AGUARDANDO: {
        title: "Aguardando",
        color: "bg-slate-100 text-slate-700",
        icon: Clock,
        gradient: "from-slate-500 to-slate-600",
    },
    EM_ANDAMENTO: {
        title: "Em Andamento",
        color: "bg-blue-100 text-blue-700",
        icon: Wrench,
        gradient: "from-blue-500 to-blue-600",
    },
    FINALIZADO: {
        title: "Finalizado",
        color: "bg-green-100 text-green-700",
        icon: CheckCircle2,
        gradient: "from-green-500 to-green-600",
    },
};
