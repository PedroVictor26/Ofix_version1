import { useState } from 'react';
import toast from 'react-hot-toast';

export const useToast = () => {
  const [toasts, setToasts] = useState([]);

  const showToast = ({ title, description, variant = 'default' }) => {
    const id = Date.now();
    
    const toastOptions = {
      id,
      duration: 4000,
      style: {
        background: variant === 'destructive' ? '#ef4444' : 
                   variant === 'success' ? '#10b981' : 
                   'rgba(255, 255, 255, 0.95)',
        color: variant === 'destructive' || variant === 'success' ? 'white' : '#1f2937',
        backdropFilter: 'blur(10px)',
        border: '1px solid rgba(255, 255, 255, 0.2)',
        borderRadius: '12px',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
      },
    };

    if (variant === 'destructive') {
      toast.error(title || description, toastOptions);
    } else if (variant === 'success') {
      toast.success(title || description, toastOptions);
    } else {
      toast(title || description, toastOptions);
    }

    const newToast = { id, title, description, variant };
    setToasts(prev => [...prev, newToast]);

    // Remove o toast após o timeout
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4000);

    return id;
  };

  const dismissToast = (id) => {
    toast.dismiss(id);
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  return {
    toast: showToast,
    dismiss: dismissToast,
    toasts
  };
};
