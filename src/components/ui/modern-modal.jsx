import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from "@/components/ui/dialog";
import { X } from "lucide-react";
import { ModernButton } from "./modern-input";

// Modal moderno com glass morphism
export const ModernModal = ({ 
    isOpen, 
    onClose, 
    title, 
    description, 
    children, 
    footer,
    size = "default" // default, sm, lg, xl
}) => {
    const sizeClasses = {
        sm: "sm:max-w-md",
        default: "sm:max-w-lg", 
        lg: "sm:max-w-2xl",
        xl: "sm:max-w-4xl"
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className={`border-0 shadow-2xl bg-white/90 backdrop-blur-md rounded-2xl ${sizeClasses[size]} p-0 overflow-hidden`}>
                {/* Background gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-transparent to-purple-500/5 rounded-2xl" />
                
                {/* Close button */}
                <button
                    onClick={onClose}
                    className="absolute right-4 top-4 z-50 p-2 rounded-xl bg-white/80 backdrop-blur-sm hover:bg-white transition-all duration-200 hover:scale-110 shadow-lg"
                >
                    <X className="w-4 h-4 text-slate-600" />
                </button>

                <div className="relative p-6 space-y-6">
                    {/* Header */}
                    {(title || description) && (
                        <DialogHeader className="space-y-3">
                            {title && (
                                <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent">
                                    {title}
                                </DialogTitle>
                            )}
                            {description && (
                                <DialogDescription className="text-slate-600 text-base">
                                    {description}
                                </DialogDescription>
                            )}
                        </DialogHeader>
                    )}

                    {/* Content */}
                    <div className="space-y-4">
                        {children}
                    </div>

                    {/* Footer */}
                    {footer && (
                        <DialogFooter className="pt-4 border-t border-slate-200/60">
                            {footer}
                        </DialogFooter>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
};

// Form Section para organizar formulários
export const FormSection = ({ title, children, className = "" }) => (
    <div className={`space-y-4 ${className}`}>
        {title && (
            <h3 className="text-lg font-semibold text-slate-700 border-b border-slate-200/60 pb-2">
                {title}
            </h3>
        )}
        <div className="space-y-4">
            {children}
        </div>
    </div>
);

// Error display component
export const FormError = ({ message }) => (
    message ? (
        <div className="flex items-center gap-2 text-sm text-red-600 mt-1 p-2 rounded-lg bg-red-50/80 backdrop-blur-sm border border-red-200/60">
            <div className="w-1 h-4 bg-red-500 rounded-full" />
            <span>{message}</span>
        </div>
    ) : null
);

// Success message component
export const FormSuccess = ({ message }) => (
    message ? (
        <div className="flex items-center gap-2 text-sm text-green-600 mt-1 p-2 rounded-lg bg-green-50/80 backdrop-blur-sm border border-green-200/60">
            <div className="w-1 h-4 bg-green-500 rounded-full" />
            <span>{message}</span>
        </div>
    ) : null
);
