// Tema de cores padronizado para botões do OFIX
// Arquivo: src/lib/buttonThemes.js

export const buttonThemes = {
  // Ações principais (criar, login, salvar principais)
  primary: "bg-blue-600 hover:bg-blue-700 text-white border-blue-600 hover:border-blue-700 focus:ring-blue-500",
  
  // Salvar e confirmar ações
  success: "bg-green-600 hover:bg-green-700 text-white border-green-600 hover:border-green-700 focus:ring-green-500",
  
  // Editar e modificar
  warning: "bg-yellow-600 hover:bg-yellow-700 text-white border-yellow-600 hover:border-yellow-700 focus:ring-yellow-500",
  
  // Excluir e ações destrutivas
  danger: "bg-red-600 hover:bg-red-700 text-white border-red-600 hover:border-red-700 focus:ring-red-500",
  
  // Cancelar e ações secundárias
  secondary: "bg-gray-600 hover:bg-gray-700 text-white border-gray-600 hover:border-gray-700 focus:ring-gray-500",
  
  // Versões outline para botões menos proeminentes
  outline: {
    primary: "border-blue-600 text-blue-600 hover:bg-blue-50",
    success: "border-green-600 text-green-600 hover:bg-green-50",
    warning: "border-yellow-600 text-yellow-600 hover:bg-yellow-50", 
    danger: "border-red-600 text-red-600 hover:bg-red-50",
    secondary: "border-gray-600 text-gray-600 hover:bg-gray-50"
  },
  
  // Versões ghost para ícones e ações sutis
  ghost: {
    primary: "text-blue-600 hover:bg-blue-100",
    success: "text-green-600 hover:bg-green-100", 
    warning: "text-yellow-600 hover:bg-yellow-100",
    danger: "text-red-600 hover:bg-red-100",
    secondary: "text-gray-600 hover:bg-gray-100"
  }
};

// Função helper para aplicar temas
export const getButtonClass = (variant = 'primary', type = 'default') => {
  if (type === 'outline') {
    return buttonThemes.outline[variant] || buttonThemes.outline.primary;
  }
  
  if (type === 'ghost') {
    return buttonThemes.ghost[variant] || buttonThemes.ghost.primary;
  }
  
  return buttonThemes[variant] || buttonThemes.primary;
};

// Mapping de ações para temas (para facilitar o uso)
export const actionThemes = {
  // CRUD Operations
  create: 'success',
  save: 'success', 
  update: 'warning',
  edit: 'warning',
  delete: 'danger',
  remove: 'danger',
  cancel: 'secondary',
  
  // Auth & Navigation
  login: 'primary',
  logout: 'secondary',
  back: 'secondary',
  next: 'primary',
  submit: 'primary',
  
  // Status Actions
  approve: 'success',
  reject: 'danger',
  pending: 'warning',
  complete: 'success'
};

// Função para obter tema por ação
export const getThemeByAction = (action) => {
  return actionThemes[action] || 'primary';
};