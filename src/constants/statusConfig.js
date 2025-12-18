// src/constants/statusConfig.js
import {
    Clock,
    Wrench,
    CheckCircle2,
} from "lucide-react";

export const statusConfig = {
    AGUARDANDO: {
        title: "Aguardando",
        color: "text-slate-700 dark:text-slate-300",
        bgColor: "bg-slate-100 dark:bg-slate-800",
        icon: Clock,
        gradient: "from-slate-500 to-slate-600",
    },
    EM_ANDAMENTO: {
        title: "Em Andamento",
        color: "text-blue-700 dark:text-blue-300",
        bgColor: "bg-blue-100 dark:bg-blue-900/30",
        icon: Wrench,
        gradient: "from-blue-500 to-blue-600",
    },
    FINALIZADO: {
        title: "Finalizado",
        color: "text-green-700 dark:text-green-300",
        bgColor: "bg-green-100 dark:bg-green-900/30",
        icon: CheckCircle2,
        gradient: "from-green-500 to-green-600",
    },
};
