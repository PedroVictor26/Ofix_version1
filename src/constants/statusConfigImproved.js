// src/constants/statusConfigImproved.js - Status alinhados com o prompt dos requisitos

import {
    Calendar,
    Wrench,
    AlertCircle,
    CheckCircle2,
    Package,
    Clock
} from "lucide-react";

/**
 * Configuração de status alinhada com os requisitos do prompt:
 * Agendados, Aguardando Peças, Em Serviço, Pronto para Retirada
 */
export const statusConfigImproved = {
    AGENDADOS: {
        title: "Agendados",
        color: "bg-blue-100 text-blue-700",
        icon: Calendar,
        gradient: "from-blue-500 to-blue-600",
        description: "Veículos com horário marcado"
    },
    AGUARDANDO_PECAS: {
        title: "Aguardando Peças",
        color: "bg-orange-100 text-orange-700", 
        icon: Package,
        gradient: "from-orange-500 to-orange-600",
        description: "Aguardando chegada de peças"
    },
    EM_SERVICO: {
        title: "Em Serviço",
        color: "bg-purple-100 text-purple-700",
        icon: Wrench,
        gradient: "from-purple-500 to-purple-600", 
        description: "Veículos sendo reparados"
    },
    PRONTO_RETIRADA: {
        title: "Pronto para Retirada",
        color: "bg-green-100 text-green-700",
        icon: CheckCircle2,
        gradient: "from-green-500 to-green-600",
        description: "Serviço concluído"
    },
    // Status auxiliares (mantidos para compatibilidade)
    CANCELADO: {
        title: "Cancelado",
        color: "bg-red-100 text-red-700",
        icon: AlertCircle,
        gradient: "from-red-500 to-red-600",
        description: "Serviços cancelados"
    },
    AGUARDANDO_APROVACAO: {
        title: "Aguardando Aprovação", 
        color: "bg-yellow-100 text-yellow-700",
        icon: Clock,
        gradient: "from-yellow-500 to-yellow-600",
        description: "Aguardando aprovação do cliente"
    }
};

/**
 * Mapeamento entre os status atuais e os novos status
 */
export const statusMapping = {
    // Status atuais -> Novos status
    'AGUARDANDO': 'AGENDADOS',
    'EM_ANDAMENTO': 'EM_SERVICO', 
    'AGUARDANDO_PECAS': 'AGUARDANDO_PECAS', // Mantém
    'FINALIZADO': 'PRONTO_RETIRADA',
    'CANCELADO': 'CANCELADO', // Mantém
    'AGUARDANDO_APROVACAO': 'AGUARDANDO_APROVACAO' // Mantém
};

/**
 * Função para mapear status atual para o novo formato
 * @param {string} currentStatus - Status atual
 * @returns {string} Novo status mapeado
 */
export function mapToNewStatus(currentStatus) {
    return statusMapping[currentStatus] || currentStatus;
}

/**
 * Função para obter configuração do status (compatível com ambos os formatos)
 * @param {string} status - Status (atual ou novo formato)
 * @returns {object} Configuração do status
 */
export function getStatusConfig(status) {
    // Primeiro tenta o novo formato
    if (statusConfigImproved[status]) {
        return statusConfigImproved[status];
    }
    
    // Se não encontrar, mapeia do formato antigo
    const mappedStatus = mapToNewStatus(status);
    return statusConfigImproved[mappedStatus] || statusConfigImproved.AGENDADOS;
}
