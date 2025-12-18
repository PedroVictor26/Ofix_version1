import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

// Skeleton para o StatsCard com shimmer effect
export const StatsCardSkeleton = () => (
    <Card className="border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden bg-white dark:bg-slate-900">
        <CardContent className="p-4">
            <div className="flex items-center justify-between">
                <div className="space-y-2">
                    <Skeleton className="h-4 w-24 bg-gradient-to-r from-slate-200 via-slate-100 to-slate-200 dark:from-slate-800 dark:via-slate-700 dark:to-slate-800 bg-[length:200%_100%] animate-shimmer" />
                    <Skeleton className="h-8 w-12 bg-gradient-to-r from-slate-200 via-slate-100 to-slate-200 dark:from-slate-800 dark:via-slate-700 dark:to-slate-800 bg-[length:200%_100%] animate-shimmer" />
                </div>
                <Skeleton className="w-10 h-10 rounded-lg bg-gradient-to-r from-slate-200 via-slate-100 to-slate-200 dark:from-slate-800 dark:via-slate-700 dark:to-slate-800 bg-[length:200%_100%] animate-shimmer" />
            </div>
        </CardContent>
    </Card>
);

// Componente StatsCards com design refinado e animação
export default function StatsCards({ title, value, icon: Icon, color = "text-slate-600", bgColor = "bg-slate-100" }) {
    return (
        <Card className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm rounded-xl hover:shadow-md transition-shadow duration-200">
            <CardContent className="p-4">
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">{title}</p>
                        <p className="text-3xl font-bold text-slate-800 dark:text-slate-100 mt-1">{value}</p>
                    </div>
                    <div className={`p-3 rounded-lg ${bgColor}`}>
                        <Icon className={`w-6 h-6 ${color}`} />
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
