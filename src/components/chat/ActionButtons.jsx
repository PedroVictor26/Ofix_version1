import React from 'react';
import { Phone, Calendar, Eye, Edit, Trash2, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';

/**
 * Componente de botões de ação inline para mensagens do chat
 * Permite executar ações diretamente das respostas do assistente
 */
const ActionButtons = ({ actions, onAction }) => {
  const getIcon = (type) => {
    const icons = {
      'ver_os': <Eye className="w-3 h-3" />,
      'agendar': <Calendar className="w-3 h-3" />,
      'ligar': <Phone className="w-3 h-3" />,
      'editar': <Edit className="w-3 h-3" />,
      'excluir': <Trash2 className="w-3 h-3" />,
      'ver_detalhes': <FileText className="w-3 h-3" />
    };
    return icons[type] || null;
  };

  const getButtonStyle = (type) => {
    const styles = {
      'ver_os': 'bg-blue-500 hover:bg-blue-600 text-white',
      'agendar': 'bg-green-500 hover:bg-green-600 text-white',
      'ligar': 'bg-purple-500 hover:bg-purple-600 text-white',
      'editar': 'bg-yellow-500 hover:bg-yellow-600 text-white',
      'excluir': 'bg-red-500 hover:bg-red-600 text-white',
      'ver_detalhes': 'bg-cyan-500 hover:bg-cyan-600 text-white'
    };
    return styles[type] || 'bg-slate-500 hover:bg-slate-600 text-white';
  };

  if (!actions || actions.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t border-slate-200">
      {actions.map((action, index) => (
        <button
          key={index}
          onClick={() => onAction(action)}
          className={`
            px-3 py-1.5 rounded-lg text-xs font-medium
            flex items-center gap-1.5
            transition-all duration-200
            hover:shadow-md hover:scale-105 active:scale-95
            ${getButtonStyle(action.type)}
          `}
        >
          {getIcon(action.type)}
          <span>{action.label}</span>
        </button>
      ))}
    </div>
  );
};

export default ActionButtons;
