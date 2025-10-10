import { useState } from "react";
import { Info, HelpCircle, AlertTriangle, CheckCircle } from "lucide-react";

/**
 * Componente de Tooltip customizado avançado
 */
const CustomTooltip = ({
  children,
  content,
  type = "default",
  position = "top",
  delay = 200,
  className = ""
}) => {
  const [isVisible, setIsVisible] = useState(false);
  let timeoutId;

  const typeIcons = {
    default: Info,
    help: HelpCircle,
    warning: AlertTriangle,
    success: CheckCircle
  };

  const typeStyles = {
    default: "bg-gray-900 text-white",
    help: "bg-blue-600 text-white",
    warning: "bg-yellow-500 text-black",
    success: "bg-green-600 text-white"
  };

  const positionStyles = {
    top: "bottom-full left-1/2 transform -translate-x-1/2 mb-2",
    bottom: "top-full left-1/2 transform -translate-x-1/2 mt-2",
    left: "right-full top-1/2 transform -translate-y-1/2 mr-2",
    right: "left-full top-1/2 transform -translate-y-1/2 ml-2"
  };

  const IconComponent = typeIcons[type];

  const showTooltip = () => {
    timeoutId = setTimeout(() => {
      setIsVisible(true);
    }, delay);
  };

  const hideTooltip = () => {
    clearTimeout(timeoutId);
    setIsVisible(false);
  };

  return (
    <div
      className={`relative inline-block ${className}`}
      onMouseEnter={showTooltip}
      onMouseLeave={hideTooltip}
      onFocus={showTooltip}
      onBlur={hideTooltip}
    >
      {children}
      
      {isVisible && (
        <div
          className={`absolute z-50 px-3 py-2 text-sm rounded-lg shadow-lg transition-opacity duration-200 whitespace-nowrap ${typeStyles[type]} ${positionStyles[position]}`}
          role="tooltip"
        >
          <div className="flex items-center space-x-2">
            <IconComponent className="w-4 h-4" />
            <span>{content}</span>
          </div>
        </div>
      )}
    </div>
  );
};

/**
 * Tooltip específico para campos de formulário
 */
export const FieldTooltip = ({ content, type = "help" }) => (
  <CustomTooltip content={content} type={type} position="right">
    <HelpCircle className="w-4 h-4 text-gray-400 hover:text-gray-600 cursor-help ml-1" />
  </CustomTooltip>
);

/**
 * Tooltip para botões de ação
 */
export const ActionTooltip = ({ content, children, type = "default" }) => (
  <CustomTooltip content={content} type={type} position="top">
    {children}
  </CustomTooltip>
);

export default CustomTooltip;