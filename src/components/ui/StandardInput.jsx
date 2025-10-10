import React from 'react';
import { getInputClass } from '@/lib/designSystem';

/**
 * Componente Input padronizado OFIX
 * Implementa estados visuais consistentes
 */
const StandardInput = React.forwardRef(({
  variant = 'default',
  error,
  success,
  helperText,
  label,
  required = false,
  className = '',
  ...props
}, ref) => {
  // Determina a variante baseada no estado
  let inputVariant = variant;
  if (error) inputVariant = 'error';
  if (success) inputVariant = 'success';
  
  const inputClass = getInputClass(inputVariant);
  
  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      
      <div className="relative">
        <input
          ref={ref}
          className={`${inputClass} ${className}`}
          {...props}
        />
      </div>
      
      {/* Texto de ajuda ou erro */}
      {(error || helperText) && (
        <div className="mt-1">
          {error && (
            <p className="text-sm text-red-600">
              {error}
            </p>
          )}
          {helperText && !error && (
            <p className="text-sm text-gray-500">{helperText}</p>
          )}
        </div>
      )}
    </div>
  );
});

StandardInput.displayName = 'StandardInput';

export default StandardInput;