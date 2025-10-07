import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
    Database, 
    Settings, 
    Users, 
    FileSpreadsheet, 
    Activity,
    AlertTriangle,
    Wrench,
    MessageCircle,
    RefreshCw
} from "lucide-react";

import DataMigrationPanel from "@/components/admin/DataMigrationPanel";
import { useAdminData } from "@/hooks/useAdminData";
import { Button } from "@/components/ui/button";

// Stats cards modernos para Admin
const AdminStatsCard = ({ title, value, icon: Icon, color, bgColor, description }) => (
    <Card className="border-0 shadow-lg bg-gradient-to-br from-white to-slate-50/30 backdrop-blur-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
        <CardContent className="p-4 md:p-6">
            <div className="flex items-center justify-between">
                <div className="space-y-2">
                    <p className="text-sm font-medium text-slate-600">{title}</p>
                    <p className="text-2xl md:text-3xl font-bold text-slate-800">{value}</p>
                    {description && (
                        <p className="text-xs text-slate-500">{description}</p>
                    )}
                </div>
                <div className={`w-12 md:w-14 h-12 md:h-14 rounded-xl ${bgColor} flex items-center justify-center`}>
                    <Icon className={`w-6 md:w-7 h-6 md:h-7 ${color}`} />
                </div>
            </div>
        </CardContent>
    </Card>
);

export default function Admin() {
    const [activeTab, setActiveTab] = useState("migration");
    const adminData = useAdminData();

    const statsData = [
        {
            title: "Total de Clientes",
            value: adminData.loading ? "..." : adminData.totalClientes,
            icon: Users,
            color: "text-blue-600",
            bgColor: "bg-gradient-to-br from-blue-100 to-blue-200",
            description: "Cadastrados no sistema"
        },
        {
            title: "Total de Veículos", 
            value: adminData.loading ? "..." : adminData.totalVeiculos,
            icon: Database,
            color: "text-green-600", 
            bgColor: "bg-gradient-to-br from-green-100 to-green-200",
            description: "Veículos cadastrados"
        },
        {
            title: "Ordens de Serviço",
            value: adminData.loading ? "..." : adminData.totalServicos,
            icon: FileSpreadsheet,
            color: "text-purple-600",
            bgColor: "bg-gradient-to-br from-purple-100 to-purple-200", 
            description: "Total de OS"
        },
        {
            title: "Status do Sistema",
            value: adminData.systemStatus,
            icon: Activity,
            color: adminData.isOnline ? "text-emerald-600" : "text-red-600",
            bgColor: adminData.isOnline ? 
                "bg-gradient-to-br from-emerald-100 to-emerald-200" : 
                "bg-gradient-to-br from-red-100 to-red-200",
            description: adminData.lastUpdate ? `Atualizado: ${adminData.lastUpdate}` : "Estado atual"
        }
    ];

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-red-50/20 to-orange-50/30">
            <div className="absolute inset-0 bg-grid-pattern opacity-30" />
            
            <div className="relative z-10 p-6 lg:p-8">
                <div className="max-w-7xl mx-auto space-y-8">
                    {/* Header da Administração */}
                    <header className="mb-8">
                        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg p-6 border-0">
                            <div className="absolute inset-0 bg-gradient-to-r from-red-500/5 to-orange-500/5 rounded-2xl" />
                            <div className="relative">
                                {/* Alerta de erro, se houver */}
                                {adminData.error && (
                                    <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3">
                                        <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0" />
                                        <div className="flex-1">
                                            <h4 className="font-semibold text-red-800">Erro na Conexão</h4>
                                            <p className="text-sm text-red-600">
                                                Não foi possível carregar alguns dados: {adminData.error}
                                            </p>
                                        </div>
                                        <Button
                                            onClick={adminData.refresh}
                                            size="sm"
                                            variant="outline"
                                            className="border-red-300 text-red-700 hover:bg-red-100"
                                        >
                                            Tentar novamente
                                        </Button>
                                    </div>
                                )}
                                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                                    <div className="space-y-2">
                                        <h1 className="text-3xl font-bold bg-gradient-to-r from-red-700 to-orange-600 bg-clip-text text-transparent flex items-center gap-3">
                                            <Database className="w-8 h-8 text-red-600" />
                                            Administração
                                        </h1>
                                        <p className="text-slate-600">
                                            Painel administrativo com dados reais do sistema OFIX
                                        </p>
                                        {adminData.lastUpdate && (
                                            <p className="text-xs text-slate-500">
                                                Última atualização: {adminData.lastUpdate}
                                            </p>
                                        )}
                                    </div>
                                    <div className="flex gap-3">
                                        <Button
                                            onClick={adminData.refresh}
                                            disabled={adminData.loading}
                                            variant="outline"
                                            size="sm"
                                            className="bg-white hover:bg-slate-50"
                                        >
                                            <RefreshCw className={`w-4 h-4 mr-2 ${adminData.loading ? 'animate-spin' : ''}`} />
                                            {adminData.loading ? 'Atualizando...' : 'Atualizar'}
                                        </Button>
                                        <div className="w-16 h-16 bg-gradient-to-br from-red-600 to-orange-600 rounded-2xl flex items-center justify-center shadow-lg">
                                            <Settings className="w-8 h-8 text-white" />
                                        </div>
                                    </div>
                                </div>

                                {/* Stats Cards Admin */}
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                                    {statsData.map((stat, index) => (
                                        <AdminStatsCard 
                                            key={index}
                                            title={stat.title}
                                            value={stat.value}
                                            icon={stat.icon}
                                            color={stat.color}
                                            bgColor={stat.bgColor}
                                            description={stat.description}
                                        />
                                    ))}
                                </div>
                            </div>
                        </div>
                    </header>

                    {/* Tabs de Administração */}
                    <Card className="border-0 shadow-xl bg-gradient-to-br from-white via-white to-slate-50/30 backdrop-blur-sm overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-br from-red-500/5 via-transparent to-orange-500/5" />
                        
                        <CardContent className="relative p-0">
                            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                                {/* Tab Headers */}
                                <div className="border-b border-slate-200/60 bg-gradient-to-r from-slate-50/50 to-white/50 backdrop-blur-sm">
                                    <TabsList className="w-full justify-start bg-transparent p-0 h-auto">
                                        <TabsTrigger
                                            value="migration"
                                            className="relative rounded-none border-b-2 border-transparent data-[state=active]:border-red-500 data-[state=active]:bg-gradient-to-r data-[state=active]:from-red-50 data-[state=active]:to-transparent px-6 py-4 text-base font-medium transition-all duration-300 hover:bg-slate-50/50"
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-red-600 rounded-xl flex items-center justify-center">
                                                    <Database className="w-5 h-5 text-white" />
                                                </div>
                                                <div className="text-left">
                                                    <div className="font-semibold text-slate-800">Migração de Dados</div>
                                                    <div className="text-xs text-slate-500">Importar dados antigos</div>
                                                </div>
                                            </div>
                                        </TabsTrigger>
                                        <TabsTrigger
                                            value="users"
                                            className="relative rounded-none border-b-2 border-transparent data-[state=active]:border-orange-500 data-[state=active]:bg-gradient-to-r data-[state=active]:from-orange-50 data-[state=active]:to-transparent px-6 py-4 text-base font-medium transition-all duration-300 hover:bg-slate-50/50"
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl flex items-center justify-center">
                                                    <Users className="w-5 h-5 text-white" />
                                                </div>
                                                <div className="text-left">
                                                    <div className="font-semibold text-slate-800">Usuários</div>
                                                    <div className="text-xs text-slate-500">Gestão de acesso</div>
                                                </div>
                                            </div>
                                        </TabsTrigger>
                                        <TabsTrigger
                                            value="system"
                                            className="relative rounded-none border-b-2 border-transparent data-[state=active]:border-purple-500 data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-50 data-[state=active]:to-transparent px-6 py-4 text-base font-medium transition-all duration-300 hover:bg-slate-50/50"
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center">
                                                    <Settings className="w-5 h-5 text-white" />
                                                </div>
                                                <div className="text-left">
                                                    <div className="font-semibold text-slate-800">Sistema</div>
                                                    <div className="text-xs text-slate-500">Configurações avançadas</div>
                                                </div>
                                            </div>
                                        </TabsTrigger>
                                    </TabsList>
                                </div>

                                {/* Tab Content - Migração de Dados */}
                                <TabsContent value="migration" className="p-6 md:p-8 space-y-6">
                                    <div className="space-y-1 mb-8">
                                        <h3 className="text-xl md:text-2xl font-bold bg-gradient-to-r from-red-700 to-red-800 bg-clip-text text-transparent flex items-center gap-3">
                                            <FileSpreadsheet className="w-6 h-6 text-red-600" />
                                            Migração de Dados Antigos
                                        </h3>
                                        <p className="text-slate-600">
                                            Importe seus dados existentes de outros sistemas para o OFIX
                                        </p>
                                    </div>
                                    
                                    {/* Componente de Migração de Dados */}
                                    <DataMigrationPanel />
                                </TabsContent>

                                {/* Tab Content - Usuários */}
                                <TabsContent value="users" className="p-6 md:p-8 space-y-6">
                                    <div className="space-y-1 mb-8">
                                        <h3 className="text-xl md:text-2xl font-bold bg-gradient-to-r from-orange-700 to-orange-800 bg-clip-text text-transparent flex items-center gap-3">
                                            <Users className="w-6 h-6 text-orange-600" />
                                            Gestão de Usuários
                                        </h3>
                                        <p className="text-slate-600">
                                            Gerencie permissões e acessos dos usuários do sistema
                                        </p>
                                    </div>
                                    
                                    <Card className="border-2 border-dashed border-orange-200 bg-gradient-to-br from-orange-50 to-white">
                                        <CardContent className="p-8 text-center">
                                            <AlertTriangle className="w-12 h-12 text-orange-500 mx-auto mb-4" />
                                            <h4 className="text-lg font-semibold text-orange-800 mb-2">
                                                Gestão de Usuários
                                            </h4>
                                            <p className="text-orange-600">
                                                Funcionalidade em desenvolvimento. Em breve você poderá gerenciar usuários, permissões e acessos.
                                            </p>
                                        </CardContent>
                                    </Card>
                                </TabsContent>

                                {/* Tab Content - Sistema */}
                                <TabsContent value="system" className="p-6 md:p-8 space-y-6">
                                    <div className="space-y-1 mb-8">
                                        <h3 className="text-xl md:text-2xl font-bold bg-gradient-to-r from-purple-700 to-purple-800 bg-clip-text text-transparent flex items-center gap-3">
                                            <Settings className="w-6 h-6 text-purple-600" />
                                            Configurações do Sistema
                                        </h3>
                                        <p className="text-slate-600">
                                            Configurações avançadas e manutenção do sistema OFIX
                                        </p>
                                    </div>
                                    
                                    <Card className="border-2 border-dashed border-purple-200 bg-gradient-to-br from-purple-50 to-white">
                                        <CardContent className="p-8 text-center">
                                            <Settings className="w-12 h-12 text-purple-500 mx-auto mb-4" />
                                            <h4 className="text-lg font-semibold text-purple-800 mb-2">
                                                Configurações Avançadas
                                            </h4>
                                            <p className="text-purple-600">
                                                Funcionalidade em desenvolvimento. Em breve configurações de sistema, backups e manutenção.
                                            </p>
                                        </CardContent>
                                    </Card>
                                </TabsContent>
                            </Tabs>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
