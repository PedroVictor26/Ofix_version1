import React from 'react';
import { Check } from 'lucide-react';

/**
 * Componente para exibir opções de seleção quando há ambiguidade
 * Permite ao usuário escolher entre múltiplas opções
 */
const SelectionOptions = ({ options, onSelect, title }) => {
  if (!options || options.length === 0) return null;

  return (
    <div className="mt-3 pt-3 border-t border-slate-200">
      {title && (
        <p className="text-xs font-medium text-slate-600 mb-2">{title}</p>
      )}
      <div className="space-y-2">
        {options.map((option, index) => (
          <button
            key={index}
            onClick={() => onSelect(option)}
            className="w-full text-left px-3 py-2 rounded-lg border border-slate-200 hover:border-blue-400 hover:bg-blue-50 transition-all duration-200 group"
          >
            <div className="flex items-start gap-2">
              <div className="flex-shrink-0 w-6 h-6 rounded-full bg-slate-100 group-hover:bg-blue-100 flex items-center justify-center text-xs font-medium text-slate-600 group-hover:text-blue-600">
                {index + 1}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-slate-900 group-hover:text-blue-900">
                  {option.label}
                </div>
                {option.subtitle && (
                  <div className="text-xs text-slate-500 mt-0.5">
                    {option.subtitle}
                  </div>
                )}
                {option.details && (
                  <div className="text-xs text-slate-400 mt-1 flex flex-wrap gap-2">
                    {option.details.map((detail, i) => (
                      <span key={i} className="inline-flex items-center gap-1">
                        {detail}
                      </span>
                    ))}
                  </div>
                )}
              </div>
              <Check className="w-4 h-4 text-blue-500 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};

export default SelectionOptions;
