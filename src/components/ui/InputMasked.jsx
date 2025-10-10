// Componente Input melhorado com máscaras e validação
// Arquivo: src/components/ui/InputMasked.jsx

import React, { forwardRef } from 'react';
import InputMask from 'react-input-mask';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AlertCircle, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';

const InputMasked = forwardRef(({
  label,
  mask,
  maskChar = "_",
  error,
  success,
  required = false,
  className,
  containerClassName,
  showValidIcon = false,
  ...props
}, ref) => {
  const hasError = !!error;
  const hasSuccess = !!success && !hasError;
  
  const inputClassName = cn(
    "transition-colors duration-200",
    hasError && "border-red-500 focus:border-red-500 focus:ring-red-500",
    hasSuccess && "border-green-500 focus:border-green-500 focus:ring-green-500",
    className
  );

  const InputComponent = mask ? InputMask : Input;
  const inputProps = mask 
    ? { mask, maskChar, ...props }
    : props;

  return (
    <div className={cn("space-y-2", containerClassName)}>
      {label && (
        <Label htmlFor={props.id} className="text-sm font-medium">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </Label>
      )}
      
      <div className="relative">
        <InputComponent
          ref={ref}
          className={inputClassName}
          {...inputProps}
        >
          {mask ? (inputProps) => <Input {...inputProps} /> : undefined}
        </InputComponent>
        
        {/* Ícone de validação */}
        {showValidIcon && (hasError || hasSuccess) && (
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
            {hasError && (
              <AlertCircle className="h-4 w-4 text-red-500" />
            )}
            {hasSuccess && (
              <CheckCircle2 className="h-4 w-4 text-green-500" />
            )}
          </div>
        )}
      </div>
      
      {/* Mensagem de erro ou sucesso */}
      {hasError && (
        <div className="flex items-center gap-2 text-sm text-red-600">
          <AlertCircle className="h-3 w-3 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}
      
      {hasSuccess && (
        <div className="flex items-center gap-2 text-sm text-green-600">
          <CheckCircle2 className="h-3 w-3 flex-shrink-0" />
          <span>{success}</span>
        </div>
      )}
    </div>
  );
});

InputMasked.displayName = "InputMasked";

export default InputMasked;