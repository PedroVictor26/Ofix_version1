import { useState, useEffect } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
    Wifi, WifiOff, Database, Clock, RefreshCw, 
    CheckCircle, AlertCircle, Info 
} from "lucide-react";

export default function SystemStatus({ lastUpdate, isCacheValid, onRefresh, isLoading }) {
    const [isOnline, setIsOnline] = useState(navigator.onLine);
    const [connectionSpeed, setConnectionSpeed] = useState('unknown');

    useEffect(() => {
        const handleOnline = () => setIsOnline(true);
        const handleOffline = () => setIsOnline(false);

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        // Detectar velocidade da conexão se disponível
        if ('connection' in navigator) {
            const connection = navigator.connection;
            setConnectionSpeed(connection.effectiveType || 'unknown');
            
            const updateConnection = () => {
                setConnectionSpeed(connection.effectiveType || 'unknown');
            };
            
            connection.addEventListener('change', updateConnection);
            
            return () => {
                window.removeEventListener('online', handleOnline);
                window.removeEventListener('offline', handleOffline);
                connection.removeEventListener('change', updateConnection);
            };
        }

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, []);

    const getConnectionIcon = () => {
        if (!isOnline) return WifiOff;
        return Wifi;
    };

    const getConnectionColor = () => {
        if (!isOnline) return 'text-red-500';
        if (connectionSpeed === '4g' || connectionSpeed === '5g') return 'text-green-500';
        if (connectionSpeed === '3g') return 'text-amber-500';
        return 'text-blue-500';
    };

    const getCacheStatus = () => {
        if (isCacheValid) {
            return {
                icon: CheckCircle,
                color: 'text-green-500',
                text: 'Cache válido',
                bgColor: 'bg-green-50',
                borderColor: 'border-green-200'
            };
        } else {
            return {
                icon: AlertCircle,
                color: 'text-amber-500',
                text: 'Cache expirado',
                bgColor: 'bg-amber-50',
                borderColor: 'border-amber-200'
            };
        }
    };

    const formatLastUpdate = () => {
        if (!lastUpdate) return 'Nunca';
        
        const now = new Date();
        const diff = now - lastUpdate;
        const minutes = Math.floor(diff / (1000 * 60));
        
        if (minutes < 1) return 'Agora mesmo';
        if (minutes === 1) return '1 minuto atrás';
        if (minutes < 60) return `${minutes} minutos atrás`;
        
        const hours = Math.floor(minutes / 60);
        if (hours === 1) return '1 hora atrás';
        if (hours < 24) return `${hours} horas atrás`;
        
        return lastUpdate.toLocaleDateString('pt-BR');
    };

    const ConnectionIcon = getConnectionIcon();
    const cacheStatus = getCacheStatus();
    const CacheIcon = cacheStatus.icon;

    return (
        <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-md">
            <CardContent className="p-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        {/* Status da Conexão */}
                        <div className="flex items-center gap-2">
                            <ConnectionIcon className={`w-4 h-4 ${getConnectionColor()}`} />
                            <div className="text-xs">
                                <p className="font-medium text-slate-700">
                                    {isOnline ? 'Online' : 'Offline'}
                                </p>
                                {connectionSpeed !== 'unknown' && (
                                    <p className="text-slate-500 uppercase">
                                        {connectionSpeed}
                                    </p>
                                )}
                            </div>
                        </div>

                        {/* Status do Cache */}
                        <div className="flex items-center gap-2">
                            <CacheIcon className={`w-4 h-4 ${cacheStatus.color}`} />
                            <div className="text-xs">
                                <p className="font-medium text-slate-700">Cache</p>
                                <p className={`${cacheStatus.color}`}>
                                    {cacheStatus.text}
                                </p>
                            </div>
                        </div>

                        {/* Última Atualização */}
                        <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4 text-slate-500" />
                            <div className="text-xs">
                                <p className="font-medium text-slate-700">Atualizado</p>
                                <p className="text-slate-500">
                                    {formatLastUpdate()}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Botão de Refresh */}
                    <Button
                        onClick={onRefresh}
                        disabled={isLoading}
                        variant="outline"
                        size="sm"
                        className="h-8 px-3 text-xs border-slate-200 hover:bg-slate-50"
                    >
                        <RefreshCw className={`w-3 h-3 mr-1 ${isLoading ? 'animate-spin' : ''}`} />
                        Atualizar
                    </Button>
                </div>

                {/* Indicadores de Status */}
                <div className="flex items-center gap-2 mt-3">
                    <Badge 
                        variant="outline" 
                        className={`text-xs ${isOnline ? 'border-green-200 text-green-700' : 'border-red-200 text-red-700'}`}
                    >
                        {isOnline ? 'Conectado' : 'Desconectado'}
                    </Badge>
                    
                    <Badge 
                        variant="outline" 
                        className={`text-xs ${cacheStatus.borderColor} ${cacheStatus.color}`}
                    >
                        {isCacheValid ? 'Dados Atuais' : 'Dados em Cache'}
                    </Badge>

                    {!isOnline && (
                        <Badge variant="outline" className="text-xs border-amber-200 text-amber-700">
                            <Info className="w-3 h-3 mr-1" />
                            Modo Offline
                        </Badge>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}