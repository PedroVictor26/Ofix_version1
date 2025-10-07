import { useState, useEffect } from 'react';
import { CheckCircle, XCircle, AlertCircle, Info, X } from 'lucide-react';

const NotificationContainer = () => {
    const [notifications, setNotifications] = useState([]);

    useEffect(() => {
        // Escuta eventos de notificação globais
        const handleNotification = (event) => {
            const { type, title, message, duration = 5000 } = event.detail;
            const id = Date.now() + Math.random();
            
            setNotifications(prev => [...prev, { id, type, title, message }]);
            
            if (duration > 0) {
                setTimeout(() => {
                    removeNotification(id);
                }, duration);
            }
        };

        window.addEventListener('showNotification', handleNotification);
        return () => window.removeEventListener('showNotification', handleNotification);
    }, []);

    const removeNotification = (id) => {
        setNotifications(prev => prev.filter(n => n.id !== id));
    };

    if (notifications.length === 0) return null;

    return (
        <div className="fixed top-4 right-4 z-50 space-y-3 max-w-sm">
            {notifications.map((notification) => (
                <NotificationItem 
                    key={notification.id}
                    notification={notification}
                    onRemove={() => removeNotification(notification.id)}
                />
            ))}
        </div>
    );
};

const NotificationItem = ({ notification, onRemove }) => {
    const { type, title, message } = notification;
    
    const config = {
        success: {
            icon: CheckCircle,
            bgColor: 'from-green-500 to-emerald-600',
            borderColor: 'border-green-400',
            textColor: 'text-green-50'
        },
        error: {
            icon: XCircle,
            bgColor: 'from-red-500 to-red-600',
            borderColor: 'border-red-400',
            textColor: 'text-red-50'
        },
        warning: {
            icon: AlertCircle,
            bgColor: 'from-amber-500 to-orange-600',
            borderColor: 'border-amber-400',
            textColor: 'text-amber-50'
        },
        info: {
            icon: Info,
            bgColor: 'from-blue-500 to-blue-600',
            borderColor: 'border-blue-400',
            textColor: 'text-blue-50'
        }
    };

    const { icon: Icon, bgColor, borderColor, textColor } = config[type] || config.info;

    return (
        <div className={`
            relative overflow-hidden rounded-xl shadow-lg border ${borderColor}
            bg-gradient-to-r ${bgColor}
            backdrop-blur-sm animate-in slide-in-from-right duration-300
            transform transition-all hover:scale-105
        `}>
            <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent" />
            
            <div className="relative p-4">
                <div className="flex items-start gap-3">
                    <Icon className={`w-5 h-5 mt-0.5 ${textColor} flex-shrink-0`} />
                    
                    <div className="flex-1 min-w-0">
                        <h4 className={`font-semibold ${textColor} text-sm`}>
                            {title}
                        </h4>
                        {message && (
                            <p className={`text-xs ${textColor} opacity-90 mt-1`}>
                                {message}
                            </p>
                        )}
                    </div>
                    
                    <button
                        onClick={onRemove}
                        className={`
                            ${textColor} opacity-70 hover:opacity-100 
                            transition-opacity duration-200 flex-shrink-0
                            p-1 rounded-md hover:bg-white/10
                        `}
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>
            </div>
            
            {/* Barra de progresso animada */}
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/20">
                <div className="h-full bg-white/60 animate-pulse" />
            </div>
        </div>
    );
};

export default NotificationContainer;
