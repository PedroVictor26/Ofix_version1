// Configurações de animações modernas para Tailwind CSS
export const animations = {
    // Fade In/Out
    fadeIn: 'animate-in fade-in duration-300',
    fadeOut: 'animate-out fade-out duration-300',
    
    // Slide In
    slideInFromTop: 'animate-in slide-in-from-top duration-300',
    slideInFromBottom: 'animate-in slide-in-from-bottom duration-300',
    slideInFromLeft: 'animate-in slide-in-from-left duration-300',
    slideInFromRight: 'animate-in slide-in-from-right duration-300',
    
    // Slide Out
    slideOutToTop: 'animate-out slide-out-to-top duration-300',
    slideOutToBottom: 'animate-out slide-out-to-bottom duration-300',
    slideOutToLeft: 'animate-out slide-out-to-left duration-300',
    slideOutToRight: 'animate-out slide-out-to-right duration-300',
    
    // Scale
    scaleIn: 'animate-in zoom-in duration-300',
    scaleOut: 'animate-out zoom-out duration-300',
    
    // Bounce
    bounceIn: 'animate-bounce',
    
    // Pulse
    pulse: 'animate-pulse',
    
    // Spin
    spin: 'animate-spin',
    
    // Custom transitions
    slideUpModal: 'animate-in slide-in-from-bottom-1/2 fade-in duration-300',
    slideDownModal: 'animate-out slide-out-to-bottom-1/2 fade-out duration-300',
    
    // Hover effects
    hoverScale: 'hover:scale-105 transition-transform duration-200',
    hoverLift: 'hover:-translate-y-1 hover:shadow-lg transition-all duration-200',
    hoverGlow: 'hover:shadow-lg hover:shadow-blue-500/25 transition-all duration-200',
    
    // Button animations
    buttonPress: 'active:scale-95 transition-transform duration-100',
    buttonHover: 'hover:scale-105 hover:-translate-y-0.5 transition-all duration-200',
    
    // Card animations
    cardHover: 'hover:scale-102 hover:-translate-y-1 hover:shadow-xl transition-all duration-300',
    cardFloat: 'hover:-translate-y-2 hover:shadow-2xl transition-all duration-300',
    
    // Loading animations
    shimmer: 'animate-pulse bg-gradient-to-r from-slate-200 via-slate-100 to-slate-200 bg-[length:200%_100%]',
    skeleton: 'animate-pulse bg-slate-200',
    
    // Notification animations
    notificationSlideIn: 'animate-in slide-in-from-right duration-500 ease-out',
    notificationSlideOut: 'animate-out slide-out-to-right duration-300 ease-in',
    
    // Stagger animations for lists
    staggerDelay: {
        1: 'animation-delay-75',
        2: 'animation-delay-150', 
        3: 'animation-delay-300',
        4: 'animation-delay-500',
        5: 'animation-delay-700'
    }
};

// Componente para animações de entrada
export const AnimatedContainer = ({ 
    children, 
    animation = 'fadeIn', 
    delay = 0, 
    className = '',
    ...props 
}) => {
    const delayClass = delay > 0 ? `animation-delay-[${delay}ms]` : '';
    
    return (
        <div 
            className={`${animations[animation]} ${delayClass} ${className}`}
            {...props}
        >
            {children}
        </div>
    );
};

// Hook para animações sequenciais
export const useStaggeredAnimation = (items, baseDelay = 100) => {
    return items.map((item, index) => ({
        ...item,
        delay: index * baseDelay
    }));
};

// Componente para loading com esqueleto animado
export const SkeletonLoader = ({ 
    width = 'w-full', 
    height = 'h-4', 
    className = '',
    rounded = 'rounded' 
}) => {
    return (
        <div 
            className={`${animations.shimmer} ${width} ${height} ${rounded} ${className}`}
        />
    );
};

// Componente para transições de página
export const PageTransition = ({ children, isLoading = false }) => {
    if (isLoading) {
        return (
            <div className={animations.fadeIn}>
                <div className="space-y-4 p-6">
                    <SkeletonLoader height="h-8" width="w-1/3" />
                    <SkeletonLoader height="h-4" width="w-2/3" />
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
                        {Array(6).fill(0).map((_, i) => (
                            <div key={i} className="space-y-3">
                                <SkeletonLoader height="h-32" rounded="rounded-lg" />
                                <SkeletonLoader height="h-4" width="w-3/4" />
                                <SkeletonLoader height="h-3" width="w-1/2" />
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className={animations.fadeIn}>
            {children}
        </div>
    );
};

// Componente para cards com animação de hover
export const AnimatedCard = ({ 
    children, 
    hoverEffect = 'cardHover',
    className = '',
    ...props 
}) => {
    return (
        <div 
            className={`${animations[hoverEffect]} ${className}`}
            {...props}
        >
            {children}
        </div>
    );
};

// Componente para botões com animações
export const AnimatedButton = ({ 
    children, 
    onClick,
    loading = false,
    disabled = false,
    className = '',
    variant = 'default',
    ...props 
}) => {
    const baseClasses = `
        ${animations.buttonHover} ${animations.buttonPress}
        disabled:hover:scale-100 disabled:hover:translate-y-0
        disabled:opacity-50 disabled:cursor-not-allowed
        transition-all duration-200
    `;

    return (
        <button
            onClick={onClick}
            disabled={disabled || loading}
            className={`${baseClasses} ${className}`}
            {...props}
        >
            {loading ? (
                <div className="flex items-center gap-2">
                    <div className={animations.spin + ' w-4 h-4 border-2 border-current border-t-transparent rounded-full'} />
                    {children}
                </div>
            ) : (
                children
            )}
        </button>
    );
};

// Componente para modais com animações suaves
export const AnimatedModal = ({ 
    isOpen, 
    onClose, 
    children, 
    className = '' 
}) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            {/* Backdrop */}
            <div 
                className={`fixed inset-0 bg-black/50 backdrop-blur-sm ${animations.fadeIn}`}
                onClick={onClose}
            />
            
            {/* Modal Content */}
            <div className={`relative ${animations.slideUpModal} ${className}`}>
                {children}
            </div>
        </div>
    );
};

// Utilitários de CSS personalizados para animações avançadas
export const customAnimations = `
@keyframes shimmer {
    0% { background-position: -200% 0; }
    100% { background-position: 200% 0; }
}

@keyframes float {
    0%, 100% { transform: translateY(0px); }
    50% { transform: translateY(-10px); }
}

@keyframes glow {
    0%, 100% { box-shadow: 0 0 20px rgba(59, 130, 246, 0.3); }
    50% { box-shadow: 0 0 30px rgba(59, 130, 246, 0.6); }
}

.animate-shimmer {
    animation: shimmer 2s infinite;
}

.animate-float {
    animation: float 3s ease-in-out infinite;
}

.animate-glow {
    animation: glow 2s ease-in-out infinite;
}

.animation-delay-75 { animation-delay: 75ms; }
.animation-delay-150 { animation-delay: 150ms; }
.animation-delay-300 { animation-delay: 300ms; }
.animation-delay-500 { animation-delay: 500ms; }
.animation-delay-700 { animation-delay: 700ms; }
`;

export default {
    animations,
    AnimatedContainer,
    useStaggeredAnimation,
    SkeletonLoader,
    PageTransition,
    AnimatedCard,
    AnimatedButton,
    AnimatedModal,
    customAnimations
};
