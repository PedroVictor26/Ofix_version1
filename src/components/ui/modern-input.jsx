import React from 'react';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { AlertCircle } from "lucide-react";

// Componente de erro reutilizável
export const FormError = ({ message }) => (
    <div className="flex items-center gap-2 text-sm text-red-600 mt-1">
        <AlertCircle className="w-4 h-4" />
        <span>{message}</span>
    </div>
);

// Input moderno com efeitos glass morphism
export const ModernInput = ({ 
    label, 
    error, 
    className = "",
    required = false,
    ...props 
}) => {
    return (
        <div className="space-y-2">
            {label && (
                <Label 
                    htmlFor={props.id} 
                    className="text-sm font-semibold text-slate-700"
                >
                    {label} {required && <span className="text-red-500">*</span>}
                </Label>
            )}
            <div className="relative group">
                <Input
                    {...props}
                    className={`border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all duration-200 bg-white/70 backdrop-blur-sm group-hover:bg-white ${
                        error ? "border-red-400 focus:border-red-500 focus:ring-red-100" : ""
                    } ${className}`}
                />
                <div className="absolute inset-0 rounded-lg bg-gradient-to-r from-blue-500/10 to-purple-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none" />
            </div>
            {error && <FormError message={error} />}
        </div>
    );
};

// Textarea moderno
export const ModernTextarea = ({ 
    label, 
    error, 
    className = "",
    required = false,
    ...props 
}) => {
    return (
        <div className="space-y-2">
            {label && (
                <Label 
                    htmlFor={props.id} 
                    className="text-sm font-semibold text-slate-700"
                >
                    {label} {required && <span className="text-red-500">*</span>}
                </Label>
            )}
            <div className="relative group">
                <Textarea
                    {...props}
                    className={`border-slate-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-100 transition-all duration-200 bg-white/70 backdrop-blur-sm group-hover:bg-white resize-none ${
                        error ? "border-red-400 focus:border-red-500 focus:ring-red-100" : ""
                    } ${className}`}
                />
                <div className="absolute inset-0 rounded-lg bg-gradient-to-r from-purple-500/10 to-blue-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none" />
            </div>
            {error && <FormError message={error} />}
        </div>
    );
};

// Seção de formulário com background
export const FormSection = ({ 
    title, 
    children, 
    gradient = "from-blue-50/50 to-purple-50/50",
    accentColor = "blue"
}) => {
    const dotColor = accentColor === "blue" ? "bg-blue-500" : 
                     accentColor === "green" ? "bg-green-500" : 
                     accentColor === "purple" ? "bg-purple-500" : "bg-blue-500";
                     
    return (
        <div className={`p-4 md:p-5 rounded-xl bg-gradient-to-r ${gradient} border border-${accentColor}-100/50 backdrop-blur-sm space-y-4`}>
            <h3 className="text-base font-semibold text-slate-800 flex items-center gap-2">
                <div className={`w-2 h-2 ${dotColor} rounded-full`}></div>
                {title}
            </h3>
            {children}
        </div>
    );
};

// Botão moderno com gradiente
export const ModernButton = ({ 
    children, 
    variant = "primary",
    loading = false,
    loadingText = "Carregando...",
    className = "",
    ...props 
}) => {
    const variantClasses = {
        primary: "bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg hover:shadow-xl",
        success: "bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white shadow-lg hover:shadow-xl",
        danger: "bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white shadow-lg hover:shadow-xl",
        outline: "border-slate-300 text-slate-700 hover:bg-slate-50 hover:border-slate-400"
    };

    return (
        <button
            {...props}
            disabled={loading || props.disabled}
            className={`px-6 py-2.5 transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed rounded-lg font-medium ${variantClasses[variant]} ${className}`}
        >
            {loading ? (
                <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    {loadingText}
                </div>
            ) : (
                children
            )}
        </button>
    );
};

// Container de modal moderno
export const ModernModalContent = ({ 
    children, 
    className = "",
    maxWidth = "lg"
}) => {
    const maxWidthClasses = {
        sm: "sm:max-w-sm",
        md: "sm:max-w-md", 
        lg: "sm:max-w-lg",
        xl: "sm:max-w-xl",
        "2xl": "sm:max-w-2xl",
        "3xl": "sm:max-w-3xl",
        "4xl": "max-w-4xl"
    };

    return (
        <div className={`border-0 shadow-2xl bg-gradient-to-br from-white via-white to-slate-50/30 backdrop-blur-sm rounded-2xl ${maxWidthClasses[maxWidth]} ${className}`}>
            {/* Glass morphism overlay */}
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-transparent to-purple-500/5 rounded-2xl" />
            {children}
        </div>
    );
};

// Header de modal moderno
export const ModernModalHeader = ({ 
    title, 
    subtitle, 
    icon: Icon,
    gradient = "from-blue-600 to-purple-600"
}) => {
    return (
        <div className="relative">
            <div className="text-xl md:text-2xl font-bold text-slate-900 flex items-center gap-3">
                {Icon && (
                    <div className="p-3 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 shadow-lg">
                        <Icon className="w-5 h-5 text-white" />
                    </div>
                )}
                <div>
                    <span className={`bg-gradient-to-r ${gradient} bg-clip-text text-transparent`}>
                        {title}
                    </span>
                    {subtitle && (
                        <p className="text-sm text-slate-500 font-normal mt-1">
                            {subtitle}
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
};
