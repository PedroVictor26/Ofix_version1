import React from 'react';
import { getCardClass } from '@/lib/designSystem';

/**
 * Componente Card padronizado OFIX
 * Variantes: default, bordered, elevated, interactive
 */
const StandardCard = ({
  variant = 'default',
  className = '',
  children,
  ...props
}) => {
  const cardClass = getCardClass(variant);
  
  return (
    <div 
      className={`${cardClass} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};

/**
 * Header do Card
 */
const StandardCardHeader = ({
  className = '',
  children,
  ...props
}) => {
  return (
    <div 
      className={`px-6 py-4 border-b border-gray-200 ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};

/**
 * Conteúdo do Card
 */
const StandardCardContent = ({
  className = '',
  children,
  ...props
}) => {
  return (
    <div 
      className={`px-6 py-4 ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};

/**
 * Footer do Card
 */
const StandardCardFooter = ({
  className = '',
  children,
  ...props
}) => {
  return (
    <div 
      className={`px-6 py-4 border-t border-gray-200 bg-gray-50 ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};

// Exportar componentes
StandardCard.Header = StandardCardHeader;
StandardCard.Content = StandardCardContent;
StandardCard.Footer = StandardCardFooter;

export default StandardCard;