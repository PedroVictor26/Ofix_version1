// Skeleton components modernos

// Skeleton moderno para modais
export const ModernModalSkeleton = () => (
    <div className="border-0 shadow-2xl bg-white/80 backdrop-blur-sm rounded-2xl sm:max-w-lg">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-transparent to-purple-500/5 rounded-2xl" />
        
        <div className="relative p-6 space-y-6">
            {/* Header */}
            <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-slate-200 to-slate-300 animate-pulse" />
                <div className="space-y-2 flex-1">
                    <div className="h-6 w-3/4 bg-gradient-to-r from-slate-200 to-slate-300 animate-pulse rounded-lg" />
                    <div className="h-4 w-1/2 bg-gradient-to-r from-slate-200 to-slate-300 animate-pulse rounded-lg" />
                </div>
            </div>
            
            {/* Form fields */}
            <div className="space-y-4">
                <div className="space-y-2">
                    <div className="h-4 w-1/4 bg-gradient-to-r from-slate-200 to-slate-300 animate-pulse rounded-lg" />
                    <div className="h-12 w-full bg-gradient-to-r from-slate-200 to-slate-300 animate-pulse rounded-xl" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <div className="h-4 w-1/3 bg-gradient-to-r from-slate-200 to-slate-300 animate-pulse rounded-lg" />
                        <div className="h-12 w-full bg-gradient-to-r from-slate-200 to-slate-300 animate-pulse rounded-xl" />
                    </div>
                    <div className="space-y-2">
                        <div className="h-4 w-1/3 bg-gradient-to-r from-slate-200 to-slate-300 animate-pulse rounded-lg" />
                        <div className="h-12 w-full bg-gradient-to-r from-slate-200 to-slate-300 animate-pulse rounded-xl" />
                    </div>
                </div>
                <div className="space-y-2">
                    <div className="h-4 w-1/4 bg-gradient-to-r from-slate-200 to-slate-300 animate-pulse rounded-lg" />
                    <div className="h-24 w-full bg-gradient-to-r from-slate-200 to-slate-300 animate-pulse rounded-xl" />
                </div>
            </div>
            
            {/* Buttons */}
            <div className="flex justify-end gap-3 pt-4 border-t border-slate-200/60">
                <div className="h-12 w-24 bg-gradient-to-r from-slate-200 to-slate-300 animate-pulse rounded-xl" />
                <div className="h-12 w-32 bg-gradient-to-r from-blue-200 to-blue-300 animate-pulse rounded-xl" />
            </div>
        </div>
    </div>
);

// Skeleton para cards de lista (Kanban expandido)
export const ModernCardSkeleton = () => (
    <div className="border-0 shadow-md bg-white/90 backdrop-blur-sm rounded-xl mb-3 md:mb-4">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-purple-500/5 rounded-xl" />
        <div className="relative p-4 md:p-5">
            {/* Header com badges */}
            <div className="flex justify-between items-start mb-4">
                <div className="flex gap-2">
                    <div className="h-5 w-16 bg-gradient-to-r from-slate-200 to-slate-300 animate-pulse rounded-full" />
                    <div className="h-5 w-20 bg-gradient-to-r from-blue-200 to-blue-300 animate-pulse rounded-full" />
                </div>
            </div>
            <div className="h-6 w-4/5 bg-gradient-to-r from-slate-200 to-slate-300 animate-pulse rounded-lg mb-4" />
            
            {/* Cliente e Veículo */}
            <div className="space-y-3 mb-4">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-200 to-blue-300 animate-pulse" />
                    <div className="flex-1 space-y-1">
                        <div className="h-4 w-3/4 bg-gradient-to-r from-slate-200 to-slate-300 animate-pulse rounded-md" />
                        <div className="h-3 w-1/2 bg-gradient-to-r from-slate-200 to-slate-300 animate-pulse rounded-md" />
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-green-200 to-green-300 animate-pulse" />
                    <div className="flex-1 space-y-1">
                        <div className="h-4 w-2/3 bg-gradient-to-r from-slate-200 to-slate-300 animate-pulse rounded-md" />
                        <div className="h-3 w-1/3 bg-gradient-to-r from-slate-200 to-slate-300 animate-pulse rounded-md" />
                    </div>
                </div>
            </div>
            
            {/* Informações adicionais */}
            <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-md bg-gradient-to-br from-orange-200 to-orange-300 animate-pulse" />
                    <div className="space-y-1">
                        <div className="h-3 w-8 bg-gradient-to-r from-slate-200 to-slate-300 animate-pulse rounded-md" />
                        <div className="h-3 w-12 bg-gradient-to-r from-slate-200 to-slate-300 animate-pulse rounded-md" />
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-md bg-gradient-to-br from-purple-200 to-purple-300 animate-pulse" />
                    <div className="space-y-1">
                        <div className="h-3 w-8 bg-gradient-to-r from-slate-200 to-slate-300 animate-pulse rounded-md" />
                        <div className="h-3 w-14 bg-gradient-to-r from-slate-200 to-slate-300 animate-pulse rounded-md" />
                    </div>
                </div>
            </div>
            
            {/* Informações de Data Adicional */}
            <div className="pt-3 border-t border-slate-100">
                <div className="flex justify-between">
                    <div className="h-3 w-1/3 bg-gradient-to-r from-slate-200 to-slate-300 animate-pulse rounded-md" />
                    <div className="h-3 w-1/4 bg-gradient-to-r from-slate-200 to-slate-300 animate-pulse rounded-md" />
                </div>
            </div>
        </div>
    </div>
);

// Skeleton para tabelas
export const ModernTableSkeleton = ({ rows = 5 }) => (
    <div className="border-0 shadow-lg rounded-2xl overflow-hidden bg-white/80 backdrop-blur-sm">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-purple-500/5 rounded-2xl" />
        <div className="relative">
            <div className="bg-gradient-to-r from-slate-50 via-slate-100 to-slate-50 border-b border-slate-200/60 p-4">
                <div className="grid grid-cols-4 gap-4">
                    {Array(4).fill(0).map((_, i) => (
                        <div key={i} className="h-5 bg-gradient-to-r from-slate-200 to-slate-300 animate-pulse rounded-lg" />
                    ))}
                </div>
            </div>
            <div className="divide-y divide-slate-100/60">
                {Array(rows).fill(0).map((_, i) => (
                    <div key={i} className="p-4">
                        <div className="grid grid-cols-4 gap-4 items-center">
                            <div className="space-y-2">
                                <div className="h-4 w-3/4 bg-gradient-to-r from-slate-200 to-slate-300 animate-pulse rounded-lg" />
                                <div className="h-3 w-1/2 bg-gradient-to-r from-slate-200 to-slate-300 animate-pulse rounded-lg" />
                            </div>
                            <div className="h-6 w-20 bg-gradient-to-r from-slate-200 to-slate-300 animate-pulse rounded-full" />
                            <div className="h-4 w-2/3 bg-gradient-to-r from-slate-200 to-slate-300 animate-pulse rounded-lg" />
                            <div className="flex justify-end">
                                <div className="h-8 w-8 bg-gradient-to-r from-slate-200 to-slate-300 animate-pulse rounded-lg" />
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    </div>
);

// Skeleton para stats cards
export const ModernStatsCardSkeleton = () => (
    <div className="border-0 shadow-sm bg-white/90 backdrop-blur-sm rounded-lg">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-500/3 to-purple-500/3 rounded-lg" />
        <div className="relative p-3">
            <div className="flex flex-col items-center text-center space-y-2">
                {/* Icon skeleton - ultra compacto */}
                <div className="w-8 h-8 rounded-md bg-gradient-to-br from-slate-200 to-slate-300 animate-pulse" />
                
                {/* Text content skeleton - ultra compacto */}
                <div className="space-y-0.5 w-full">
                    <div className="h-2.5 w-14 bg-gradient-to-r from-slate-200 to-slate-300 animate-pulse rounded-md mx-auto" />
                    <div className="h-5 w-8 bg-gradient-to-r from-blue-200 to-blue-300 animate-pulse rounded-md mx-auto" />
                </div>
            </div>
        </div>
    </div>
);

// Skeleton para página completa
export const ModernPageSkeleton = () => (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/20 to-indigo-50/30">
        <div className="absolute inset-0 bg-grid-pattern opacity-30" />
        <div className="relative z-10 p-6 lg:p-8 space-y-8">
            {/* Header */}
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg p-6 border-0">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-purple-500/5 rounded-2xl" />
                <div className="relative flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div className="space-y-2">
                        <div className="h-8 w-64 bg-gradient-to-r from-slate-200 to-slate-300 animate-pulse rounded-lg" />
                        <div className="h-4 w-96 bg-gradient-to-r from-slate-200 to-slate-300 animate-pulse rounded-lg" />
                    </div>
                    <div className="h-12 w-36 bg-gradient-to-r from-blue-200 to-blue-300 animate-pulse rounded-xl" />
                </div>
            </div>
            
            {/* Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                {Array(4).fill(0).map((_, i) => (
                    <ModernStatsCardSkeleton key={i} />
                ))}
            </div>
            
            {/* Content Area */}
            <div className="space-y-6">
                <div className="h-6 w-48 bg-gradient-to-r from-slate-200 to-slate-300 animate-pulse rounded-lg" />
                <ModernTableSkeleton />
            </div>
        </div>
    </div>
);

// Loading spinner moderno
export const ModernSpinner = ({ size = "md", className = "" }) => {
    const sizeClasses = {
        sm: "w-4 h-4",
        md: "w-6 h-6", 
        lg: "w-8 h-8",
        xl: "w-12 h-12"
    };

    return (
        <div className={`${sizeClasses[size]} border-2 border-slate-200 border-t-gradient-to-r from-blue-500 to-purple-500 rounded-full animate-spin ${className}`} />
    );
};

// Loading state para botões
export const ButtonLoadingSpinner = () => (
    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
);
