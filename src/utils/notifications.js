// Utilitários para disparar notificações
export const showNotification = (type, title, message, duration) => {
    window.dispatchEvent(new CustomEvent('showNotification', {
        detail: { type, title, message, duration }
    }));
};

// Atalhos para tipos específicos
export const showSuccess = (title, message = '', duration = 3000) => {
    showNotification('success', title, message, duration);
};

export const showError = (title, message = '', duration = 5000) => {
    showNotification('error', title, message, duration);
};

export const showWarning = (title, message = '', duration = 4000) => {
    showNotification('warning', title, message, duration);
};

export const showInfo = (title, message = '', duration = 3000) => {
    showNotification('info', title, message, duration);
};
