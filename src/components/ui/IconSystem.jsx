import {
  User,
  Car,
  Plus,
  Search,
  Edit,
  Trash2,
  Eye,
  Save,
  X,
  Check,
  AlertCircle,
  Info,
  Home,
  ChevronRight,
  ChevronLeft,
  ChevronDown,
  ChevronUp,
  Settings,
  Bell,
  Menu,
  MoreVertical,
  Download,
  Upload,
  Printer,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Clock,
  DollarSign,
  FileText,
  Wrench,
  Package,
  BarChart3,
  PieChart,
  TrendingUp,
  Filter,
  SortAsc,
  SortDesc,
  RefreshCw,
  Loader2,
  HelpCircle,
  ExternalLink,
  Copy,
  Share2
} from "lucide-react";

/**
 * Sistema de Ícones Padronizado OFIX
 * Centraliza todos os ícones usados na aplicação com tamanhos consistentes
 */

// Mapeamento de ícones por categoria
export const iconMap = {
  // Ícones de entidades
  entities: {
    user: User,
    cliente: User,
    vehicle: Car,
    veiculo: Car,
    order: FileText,
    ordem: FileText,
    service: Wrench,
    servico: Wrench,
    stock: Package,
    estoque: Package,
    financial: DollarSign,
    financeiro: DollarSign,
  },
  
  // Ícones de ações
  actions: {
    add: Plus,
    create: Plus,
    search: Search,
    edit: Edit,
    delete: Trash2,
    view: Eye,
    save: Save,
    cancel: X,
    close: X,
    confirm: Check,
    download: Download,
    upload: Upload,
    print: Printer,
    copy: Copy,
    share: Share2,
    refresh: RefreshCw,
  },
  
  // Ícones de navegação
  navigation: {
    home: Home,
    back: ChevronLeft,
    forward: ChevronRight,
    up: ChevronUp,
    down: ChevronDown,
    menu: Menu,
    more: MoreVertical,
    external: ExternalLink,
  },
  
  // Ícones de estado
  status: {
    loading: Loader2,
    success: Check,
    error: AlertCircle,
    warning: AlertCircle,
    info: Info,
    help: HelpCircle,
  },
  
  // Ícones de contato
  contact: {
    email: Mail,
    phone: Phone,
    address: MapPin,
    calendar: Calendar,
    clock: Clock,
  },
  
  // Ícones de dados
  data: {
    chart: BarChart3,
    pie: PieChart,
    trending: TrendingUp,
    filter: Filter,
    sortAsc: SortAsc,
    sortDesc: SortDesc,
  },
  
  // Ícones de configuração
  config: {
    settings: Settings,
    notifications: Bell,
  }
};

// Tamanhos padrão dos ícones
export const iconSizes = {
  xs: 12,
  sm: 16,
  md: 18, // Padrão OFIX
  lg: 24,
  xl: 32,
};

// Classes CSS para tamanhos
export const iconSizeClasses = {
  xs: 'w-3 h-3',
  sm: 'w-4 h-4',
  md: 'w-[18px] h-[18px]', // Padrão OFIX
  lg: 'w-6 h-6',
  xl: 'w-8 h-8',
};

/**
 * Componente Icon padronizado
 */
export const Icon = ({ 
  name, 
  category = 'actions', 
  size = 'md', 
  className = '', 
  color = 'currentColor',
  ...props 
}) => {
  // Buscar o ícone na categoria especificada
  const IconComponent = iconMap[category]?.[name];
  
  if (!IconComponent) {
    console.warn(`Icon "${name}" not found in category "${category}"`);
    return <Info className={`${iconSizeClasses[size]} ${className}`} {...props} />;
  }
  
  return (
    <IconComponent 
      className={`${iconSizeClasses[size]} ${className}`}
      style={{ color }}
      {...props} 
    />
  );
};

/**
 * Ícones específicos para ações comuns
 */
export const ActionIcon = ({ action, size = 'md', className = '', ...props }) => (
  <Icon name={action} category="actions" size={size} className={className} {...props} />
);

export const EntityIcon = ({ entity, size = 'md', className = '', ...props }) => (
  <Icon name={entity} category="entities" size={size} className={className} {...props} />
);

export const StatusIcon = ({ status, size = 'md', className = '', ...props }) => (
  <Icon name={status} category="status" size={size} className={className} {...props} />
);

export const NavigationIcon = ({ direction, size = 'md', className = '', ...props }) => (
  <Icon name={direction} category="navigation" size={size} className={className} {...props} />
);

/**
 * Botão com ícone padronizado
 */
export const IconButton = ({ 
  icon, 
  category = 'actions',
  variant = 'ghost',
  size = 'md',
  className = '',
  children,
  ...props 
}) => {
  const iconSizeMap = {
    sm: 'sm',
    md: 'md',
    lg: 'md'
  };
  
  return (
    <button 
      className={`inline-flex items-center justify-center gap-2 ${className}`}
      {...props}
    >
      <Icon name={icon} category={category} size={iconSizeMap[size]} />
      {children}
    </button>
  );
};

// Exportação de todos os ícones do Lucide para casos especiais
export * from "lucide-react";

export default {
  Icon,
  ActionIcon,
  EntityIcon,
  StatusIcon,
  NavigationIcon,
  IconButton,
  iconMap,
  iconSizes,
  iconSizeClasses
};