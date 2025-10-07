import { MessageSquare, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * Componente para enviar notificação via WhatsApp
 * @param {Object} props
 * @param {Object} props.servico - Dados do serviço
 * @param {Object} props.cliente - Dados do cliente  
 * @param {Object} props.veiculo - Dados do veículo
 * @param {string} props.nomeOficina - Nome da oficina
 */
export default function WhatsAppNotification({ servico, cliente, veiculo, nomeOficina = "OFIX" }) {
    const handleNotificarCliente = () => {
        if (!cliente?.telefone) {
            alert('Cliente não possui telefone cadastrado.');
            return;
        }

        // Limpar telefone para formato WhatsApp
        const telefone = cliente.telefone.replace(/\D/g, '');
        
        // Montar mensagem personalizada
        const mensagem = `
Olá, ${cliente.nomeCompleto}! 

🔧 *${nomeOficina}* - Atualização do seu serviço

🚗 *Veículo:* ${veiculo?.marca} ${veiculo?.modelo} - ${veiculo?.placa}
📋 *OS:* #${servico.numeroOs}
📊 *Status atual:* ${getStatusMessage(servico.status)}

${getStatusDetails(servico)}

Att, Equipe ${nomeOficina}
        `.trim();

        // Abrir WhatsApp Web
        const whatsappUrl = `https://wa.me/55${telefone}?text=${encodeURIComponent(mensagem)}`;
        window.open(whatsappUrl, '_blank');
    };

    const getStatusMessage = (status) => {
        const statusMessages = {
            'AGUARDANDO': 'Aguardando início dos trabalhos',
            'EM_ANDAMENTO': 'Em andamento na oficina',
            'AGUARDANDO_PECAS': 'Aguardando chegada de peças',
            'AGUARDANDO_APROVACAO': 'Aguardando sua aprovação',
            'FINALIZADO': 'Serviço concluído - Pronto para retirada!',
            'CANCELADO': 'Serviço cancelado'
        };
        return statusMessages[status] || status;
    };

    const getStatusDetails = (servico) => {
        switch (servico.status) {
            case 'AGUARDANDO_APROVACAO':
                return `💰 *Valor orçado:* R$ ${(servico.valorTotalEstimado || 0).toFixed(2)}\n\n⏰ *Aguardamos sua confirmação para dar continuidade ao serviço.*`;
            case 'FINALIZADO':
                return `💰 *Valor final:* R$ ${(servico.valorTotalFinal || servico.valorTotalEstimado || 0).toFixed(2)}\n\n✅ *Seu veículo está pronto! Pode vir buscar.*`;
            case 'AGUARDANDO_PECAS':
                return `📦 *Peças solicitadas ao fornecedor*\n\n⏱️ *Prazo estimado:* ${servico.dataPrevisaoEntrega ? new Date(servico.dataPrevisaoEntrega).toLocaleDateString('pt-BR') : '2-3 dias úteis'}`;
            case 'EM_ANDAMENTO':
                return `🔧 *Nossos mecânicos estão trabalhando no seu veículo*\n\n📅 *Previsão de conclusão:* ${servico.dataPrevisaoEntrega ? new Date(servico.dataPrevisaoEntrega).toLocaleDateString('pt-BR') : 'Em breve'}`;
            default:
                return `📞 *Dúvidas?* Entre em contato conosco!`;
        }
    };

    return (
        <Button
            onClick={handleNotificarCliente}
            className="w-full bg-green-600 hover:bg-green-700 text-white flex items-center gap-2"
            disabled={!cliente?.telefone}
        >
            <MessageSquare className="w-4 h-4" />
            Notificar Cliente via WhatsApp
            <ExternalLink className="w-3 h-3" />
        </Button>
    );
}
