import { useEffect, useCallback } from 'react';

/**
 * Hook para melhorar a navegação por teclado em modais
 * Implementa ESC para fechar, Tab para navegação, e outras funcionalidades
 */
export const useKeyboardNavigation = ({
  isOpen,
  onClose,
  hasUnsavedChanges = false,
  confirmMessage = "Tem certeza que deseja fechar? Alterações não salvas serão perdidas."
}) => {
  // Função para lidar com tecla ESC
  const handleEscape = useCallback((event) => {
    if (event.key === 'Escape' && isOpen) {
      event.preventDefault();
      
      if (hasUnsavedChanges) {
        const confirmed = window.confirm(confirmMessage);
        if (confirmed) {
          onClose();
        }
      } else {
        onClose();
      }
    }
  }, [isOpen, onClose, hasUnsavedChanges, confirmMessage]);

  // Função para gerenciar foco dentro do modal
  const trapFocus = useCallback((event) => {
    if (!isOpen) return;

    const modal = document.querySelector('[role="dialog"]');
    if (!modal) return;

    const focusableElements = modal.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    
    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    if (event.key === 'Tab') {
      if (event.shiftKey) {
        // Shift + Tab: volta para o último elemento se estiver no primeiro
        if (document.activeElement === firstElement) {
          event.preventDefault();
          lastElement?.focus();
        }
      } else {
        // Tab: vai para o primeiro elemento se estiver no último
        if (document.activeElement === lastElement) {
          event.preventDefault();
          firstElement?.focus();
        }
      }
    }
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.addEventListener('keydown', trapFocus);
      
      // Previne scroll do body quando modal está aberto
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.removeEventListener('keydown', trapFocus);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, handleEscape, trapFocus]);

  return {
    // Função para verificar se há mudanças não salvas
    checkUnsavedChanges: () => hasUnsavedChanges,
    
    // Função para focar no primeiro elemento
    focusFirst: () => {
      setTimeout(() => {
        const modal = document.querySelector('[role="dialog"]');
        const firstInput = modal?.querySelector('input, textarea, select');
        firstInput?.focus();
      }, 100);
    }
  };
};

/**
 * Hook para detectar clique fora do modal
 */
export const useClickOutside = ({
  isOpen,
  onClose,
  hasUnsavedChanges = false,
  confirmMessage = "Tem certeza que deseja fechar? Alterações não salvas serão perdidas."
}) => {
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event) => {
      const modal = document.querySelector('[role="dialog"]');
      const modalContent = modal?.querySelector('[data-modal-content]');
      
      if (modal && !modalContent?.contains(event.target)) {
        if (hasUnsavedChanges) {
          const confirmed = window.confirm(confirmMessage);
          if (confirmed) {
            onClose();
          }
        } else {
          onClose();
        }
      }
    };

    // Pequeno delay para evitar fechar imediatamente após abrir
    const timeoutId = setTimeout(() => {
      document.addEventListener('mousedown', handleClickOutside);
    }, 100);

    return () => {
      clearTimeout(timeoutId);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose, hasUnsavedChanges, confirmMessage]);
};

/**
 * Hook combinado para navegação completa em modais
 */
export const useModalNavigation = (options) => {
  const keyboardNav = useKeyboardNavigation(options);
  useClickOutside(options);
  
  return keyboardNav;
};