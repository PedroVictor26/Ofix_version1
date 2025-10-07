// Serviço de notificações inteligentes
// import { toast } from 'sonner';

// Configurações de notificação por tipo
const notificationConfig = {
  service_overdue: {
    type: 'warning',
    title: 'Serviço em Atraso',
    priority: 'high'
  },
  parts_low_stock: {
    type: 'warning',
    title: 'Estoque Baixo',
    priority: 'medium'
  },
  service_completion: {
    type: 'success',
    title: 'Serviço Concluído',
    priority: 'low'
  },
  payment_due: {
    type: 'error',
    title: 'Pagamento Pendente',
    priority: 'high'
  }
};

/**
 * Verifica e gera notificações para um serviço
 */
export function checkServiceNotifications(service) {
  const notifications = [];
  
  if (!service) return notifications;
  
  // Verifica atraso no serviço
  if (service.data_limite) {
    const prazo = new Date(service.data_limite);
    const hoje = new Date();
    
    if (hoje > prazo && service.status !== 'concluido') {
      notifications.push({
        id: `overdue_${service.id}`,
        type: 'service_overdue',
        message: `Serviço #${service.id} está em atraso`,
        serviceId: service.id,
        timestamp: new Date()
      });
    }
  }
  
  // Verifica se está próximo da conclusão
  if (service.procedimentos) {
    const total = service.procedimentos.length;
    const concluidos = service.procedimentos.filter(p => p.concluido).length;
    
    if (total > 0 && concluidos / total >= 0.8 && service.status !== 'concluido') {
      notifications.push({
        id: `near_completion_${service.id}`,
        type: 'service_completion',
        message: `Serviço #${service.id} está quase pronto para finalização`,
        serviceId: service.id,
        timestamp: new Date()
      });
    }
  }
  
  return notifications;
}

/**
 * Exibe notificações usando console.log (fallback)
 */
export function showNotification(notification) {
  const config = notificationConfig[notification.type] || {
    type: 'info',
    title: 'Notificação'
  };
  
  console.log(`🔔 ${config.title}: ${notification.message}`);
}

/**
 * Processa múltiplas notificações
 */
export function processNotifications(notifications) {
  notifications.forEach(notification => {
    showNotification(notification);
  });
}

/**
 * Sugere conclusão de serviço baseado no progresso
 */
export function suggestServiceCompletion(service) {
  if (!service || !service.procedimentos) return null;
  
  const total = service.procedimentos.length;
  const concluidos = service.procedimentos.filter(p => p.concluido).length;
  
  if (total > 0 && concluidos === total && service.status !== 'concluido') {
    return {
      id: `suggest_completion_${service.id}`,
      type: 'service_completion',
      message: `Todos os procedimentos foram concluídos. Finalizar serviço #${service.id}?`,
      serviceId: service.id,
      action: 'complete_service',
      timestamp: new Date()
    };
  }
  
  return null;
}

/**
 * Verifica notificações para múltiplos serviços
 */
export function checkMultipleServices(services) {
  const allNotifications = [];
  
  services.forEach(service => {
    const serviceNotifications = checkServiceNotifications(service);
    allNotifications.push(...serviceNotifications);
    
    const completionSuggestion = suggestServiceCompletion(service);
    if (completionSuggestion) {
      allNotifications.push(completionSuggestion);
    }
  });
  
  return allNotifications;
}

/**
 * Gera notificação de auto-save
 */
export function notifyAutoSave(success = true) {
  if (success) {
    console.log('✅ Dados salvos automaticamente');
  } else {
    console.log('❌ Erro ao salvar automaticamente - Verifique sua conexão');
  }
}

export default {
  checkServiceNotifications,
  showNotification,
  processNotifications,
  suggestServiceCompletion,
  checkMultipleServices,
  notifyAutoSave
};
