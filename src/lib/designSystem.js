/**
 * Sistema de Design OFIX - Cores e Temas Padronizados
 * Centraliza todas as definições de cores e estilos para consistência visual
 */

// Paleta de cores principal
export const colors = {
  // Azuis (Primário)
  primary: {
    50: '#eff6ff',
    100: '#dbeafe',
    200: '#bfdbfe',
    300: '#93c5fd',
    400: '#60a5fa',
    500: '#3b82f6', // Cor principal
    600: '#2563eb',
    700: '#1d4ed8',
    800: '#1e40af',
    900: '#1e3a8a',
  },
  
  // Verdes (Sucesso)
  success: {
    50: '#f0fdf4',
    100: '#dcfce7',
    200: '#bbf7d0',
    300: '#86efac',
    400: '#4ade80',
    500: '#22c55e', // Verde principal
    600: '#16a34a',
    700: '#15803d',
    800: '#166534',
    900: '#14532d',
  },
  
  // Vermelhos (Erro/Danger)
  danger: {
    50: '#fef2f2',
    100: '#fee2e2',
    200: '#fecaca',
    300: '#fca5a5',
    400: '#f87171',
    500: '#ef4444', // Vermelho principal
    600: '#dc2626',
    700: '#b91c1c',
    800: '#991b1b',
    900: '#7f1d1d',
  },
  
  // Amarelos (Warning)
  warning: {
    50: '#fffbeb',
    100: '#fef3c7',
    200: '#fde68a',
    300: '#fcd34d',
    400: '#fbbf24',
    500: '#f59e0b', // Amarelo principal
    600: '#d97706',
    700: '#b45309',
    800: '#92400e',
    900: '#78350f',
  },
  
  // Cinzas (Neutro)
  gray: {
    50: '#f9fafb',
    100: '#f3f4f6',
    200: '#e5e7eb',
    300: '#d1d5db',
    400: '#9ca3af',
    500: '#6b7280',
    600: '#4b5563', // Cinza principal
    700: '#374151',
    800: '#1f2937',
    900: '#111827',
  }
};

// Variantes de botões padronizadas
export const buttonVariants = {
  // Botão primário (ações principais)
  primary: {
    base: `bg-blue-600 hover:bg-blue-700 active:bg-blue-800 
           text-white border-transparent
           focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
           transition-all duration-200 ease-in-out
           shadow-sm hover:shadow-md`,
    sizes: {
      sm: 'px-3 py-1.5 text-sm',
      md: 'px-4 py-2 text-sm',
      lg: 'px-6 py-3 text-base'
    }
  },
  
  // Botão de sucesso (salvar/confirmar)
  success: {
    base: `bg-green-600 hover:bg-green-700 active:bg-green-800
           text-white border-transparent
           focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2
           transition-all duration-200 ease-in-out
           shadow-sm hover:shadow-md`,
    sizes: {
      sm: 'px-3 py-1.5 text-sm',
      md: 'px-4 py-2 text-sm',
      lg: 'px-6 py-3 text-base'
    }
  },
  
  // Botão de perigo (excluir/deletar)
  danger: {
    base: `bg-red-600 hover:bg-red-700 active:bg-red-800
           text-white border-transparent
           focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2
           transition-all duration-200 ease-in-out
           shadow-sm hover:shadow-md`,
    sizes: {
      sm: 'px-3 py-1.5 text-sm',
      md: 'px-4 py-2 text-sm',
      lg: 'px-6 py-3 text-base'
    }
  },
  
  // Botão de aviso (editar/atenção)
  warning: {
    base: `bg-yellow-500 hover:bg-yellow-600 active:bg-yellow-700
           text-yellow-900 border-transparent
           focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:ring-offset-2
           transition-all duration-200 ease-in-out
           shadow-sm hover:shadow-md`,
    sizes: {
      sm: 'px-3 py-1.5 text-sm',
      md: 'px-4 py-2 text-sm',
      lg: 'px-6 py-3 text-base'
    }
  },
  
  // Botão secundário (cancelar/voltar)
  secondary: {
    base: `bg-gray-200 hover:bg-gray-300 active:bg-gray-400
           text-gray-900 border border-gray-300
           focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2
           transition-all duration-200 ease-in-out
           shadow-sm hover:shadow-md`,
    sizes: {
      sm: 'px-3 py-1.5 text-sm',
      md: 'px-4 py-2 text-sm',
      lg: 'px-6 py-3 text-base'
    }
  },
  
  // Botão outline
  outline: {
    base: `bg-transparent hover:bg-gray-50 active:bg-gray-100
           text-gray-700 border border-gray-300
           focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
           transition-all duration-200 ease-in-out`,
    sizes: {
      sm: 'px-3 py-1.5 text-sm',
      md: 'px-4 py-2 text-sm',
      lg: 'px-6 py-3 text-base'
    }
  },
  
  // Botão ghost (apenas texto)
  ghost: {
    base: `bg-transparent hover:bg-gray-100 active:bg-gray-200
           text-gray-700 border-transparent
           focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2
           transition-all duration-200 ease-in-out`,
    sizes: {
      sm: 'px-3 py-1.5 text-sm',
      md: 'px-4 py-2 text-sm',
      lg: 'px-6 py-3 text-base'
    }
  }
};

// Estilos de input padronizados
export const inputVariants = {
  default: `
    flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 
    text-sm text-gray-900 placeholder:text-gray-500
    focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
    disabled:cursor-not-allowed disabled:opacity-50
    transition-all duration-200 ease-in-out
  `,
  error: `
    flex h-10 w-full rounded-md border border-red-300 bg-white px-3 py-2 
    text-sm text-gray-900 placeholder:text-gray-500
    focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent
    disabled:cursor-not-allowed disabled:opacity-50
    transition-all duration-200 ease-in-out
  `,
  success: `
    flex h-10 w-full rounded-md border border-green-300 bg-white px-3 py-2 
    text-sm text-gray-900 placeholder:text-gray-500
    focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent
    disabled:cursor-not-allowed disabled:opacity-50
    transition-all duration-200 ease-in-out
  `
};

// Estilos de cards padronizados
export const cardVariants = {
  default: `
    bg-white rounded-lg border border-gray-200 shadow-sm
    transition-all duration-200 ease-in-out
    hover:shadow-md hover:border-gray-300
  `,
  elevated: `
    bg-white rounded-lg shadow-lg border border-gray-200
    transition-all duration-200 ease-in-out
    hover:shadow-xl
  `,
  flat: `
    bg-gray-50 rounded-lg border border-gray-200
    transition-all duration-200 ease-in-out
    hover:bg-gray-100
  `
};

// Função helper para combinar classes
export const getButtonClass = (variant = 'primary', size = 'md', disabled = false) => {
  const variantClasses = buttonVariants[variant];
  if (!variantClasses) return '';
  
  let classes = `${variantClasses.base} ${variantClasses.sizes[size]} rounded-md font-medium`;
  
  if (disabled) {
    classes += ' opacity-50 cursor-not-allowed pointer-events-none';
  }
  
  return classes;
};

// Função para obter classes de input
export const getInputClass = (variant = 'default') => {
  return inputVariants[variant] || inputVariants.default;
};

// Função para obter classes de card
export const getCardClass = (variant = 'default') => {
  return cardVariants[variant] || cardVariants.default;
};

// Exportação padrão com todas as utilidades
export default {
  colors,
  buttonVariants,
  inputVariants,
  cardVariants,
  getButtonClass,
  getInputClass,
  getCardClass
};