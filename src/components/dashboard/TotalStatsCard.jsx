import { Card, CardContent } from "@/components/ui/card";

// Componente para o card total destacado - versão compacta
export default function TotalStatsCard({ title, value, subtitle, icon: Icon }) {
    return (
        <Card className="bg-white/90 backdrop-blur-sm rounded-xl shadow-md hover:shadow-lg transition-all duration-300 border-0 group">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-transparent to-purple-500/5 rounded-xl" />
            
            <CardContent className="relative p-5">
                <div className="flex items-center justify-between">
                    <div className="space-y-2">
                        <p className="text-sm font-semibold text-slate-500 uppercase tracking-wide">
                            {title}
                        </p>
                        <p className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent group-hover:from-blue-700 group-hover:to-purple-700 transition-all duration-300">
                            {value}
                        </p>
                        <p className="text-xs text-slate-600 font-medium">
                            {subtitle}
                        </p>
                    </div>
                    <div className="relative">
                        <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 p-3 flex items-center justify-center shadow-md group-hover:shadow-blue-500/20 transition-all duration-300 group-hover:scale-105">
                            <div className="absolute inset-0 bg-white/20 rounded-xl backdrop-blur-sm" />
                            <Icon className="w-8 h-8 text-white relative z-10" />
                        </div>
                    </div>
                </div>
                
                {/* Modern accent line */}
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-blue-500 via-purple-500 to-blue-500 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left rounded-b-xl" />
            </CardContent>
        </Card>
    );
}

// Skeleton para o card total - versão compacta
export const TotalStatsCardSkeleton = () => (
    <Card className="bg-white/90 backdrop-blur-sm rounded-xl shadow-md border-0">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-purple-500/5 rounded-xl" />
        <CardContent className="relative p-5">
            <div className="flex items-center justify-between">
                <div className="space-y-2">
                    <div className="h-4 w-24 bg-gradient-to-r from-slate-200 to-slate-300 animate-pulse rounded-md" />
                    <div className="h-8 w-16 bg-gradient-to-r from-blue-200 to-blue-300 animate-pulse rounded-md" />
                    <div className="h-3 w-32 bg-gradient-to-r from-slate-200 to-slate-300 animate-pulse rounded-md" />
                </div>
                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-slate-200 to-slate-300 animate-pulse" />
            </div>
        </CardContent>
    </Card>
);
