import React from 'react';
import { Loader2 } from 'lucide-react';
import { getButtonClass } from '@/lib/designSystem';

/**
 * Componente StandardButton padronizado OFIX
 * Implementa o sistema de design consistente com todas as variantes
 */
const StandardButton = React.forwardRef(({
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  icon: IconComponent,
  iconPosition = 'left',
  children,
  className = '',
  ...props
}, ref) => {
  const isDisabled = disabled || loading;
  const buttonClass = getButtonClass(variant, size, isDisabled);
  
  const renderIcon = (position) => {
    if (loading && position === 'left') {
      return <Loader2 className="w-4 h-4 animate-spin" />;
    }
    
    if (IconComponent && iconPosition === position) {
      return <IconComponent className="w-4 h-4" />;
    }
    
    return null;
  };
  
  return (
    <button
      ref={ref}
      className={`${buttonClass} ${className}`}
      disabled={isDisabled}
      {...props}
    >
      <div className="flex items-center justify-center gap-2">
        {renderIcon('left')}
        {children}
        {renderIcon('right')}
      </div>
    </button>
  );
});

StandardButton.displayName = 'StandardButton';

export default StandardButton;