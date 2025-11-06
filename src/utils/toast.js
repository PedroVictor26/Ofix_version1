import toast from "react-hot-toast";

/**
 * Toast helpers com ícones e estilos consistentes
 */

export const showSuccess = (message, options = {}) => {
  return toast.success(message, {
    duration: 3000,
    icon: '✅',
    style: {
      background: '#10b981',
      color: '#fff',
      fontWeight: '500',
    },
    ...options,
  });
};

export const showError = (message, options = {}) => {
  return toast.error(message, {
    duration: 4000,
    icon: '❌',
    style: {
      background: '#ef4444',
      color: '#fff',
      fontWeight: '500',
    },
    ...options,
  });
};

export const showInfo = (message, options = {}) => {
  return toast(message, {
    duration: 3000,
    icon: 'ℹ️',
    style: {
      background: '#3b82f6',
      color: '#fff',
      fontWeight: '500',
    },
    ...options,
  });
};

export const showWarning = (message, options = {}) => {
  return toast(message, {
    duration: 3500,
    icon: '⚠️',
    style: {
      background: '#f59e0b',
      color: '#fff',
      fontWeight: '500',
    },
    ...options,
  });
};

export const showLoading = (message = "Carregando...") => {
  return toast.loading(message, {
    style: {
      background: '#64748b',
      color: '#fff',
      fontWeight: '500',
    },
  });
};

export const dismissToast = (toastId) => {
  toast.dismiss(toastId);
};

export const dismissAllToasts = () => {
  toast.dismiss();
};
