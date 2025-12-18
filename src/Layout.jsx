import { useState, useMemo, useEffect } from "react";
import { Link, useLocation, Outlet } from "react-router-dom";
import {
    LayoutDashboard,
    Users,
    Package,
    DollarSign,
    Settings,
    Brain,
    Wrench,
    Bell,
    LogOut,
    X,
    AlertTriangle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "./context/AuthContext.jsx";
import useDashboardData from "./hooks/useDashboardData.js";
import { useEstoqueData } from "./hooks/useEstoqueData.js";
import {
    Sidebar,
    SidebarContent,
    SidebarGroup,
    SidebarGroupContent,
    SidebarGroupLabel,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarHeader,
    SidebarFooter,
    SidebarProvider,
    SidebarTrigger,
} from "@/components/ui/sidebar";
import { Toaster } from 'react-hot-toast';
import toast from 'react-hot-toast';
import VirtualAssistant from './components/ai/VirtualAssistant.jsx';
import { ThemeToggle } from "./components/ui/ThemeToggle";

// --- Constantes ---
const NAVIGATION_ITEMS = [
    { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard, description: "Visão geral operacional" },
    { title: "Clientes", url: "/clientes", icon: Users, description: "Gestão de clientes" },
    { title: "Estoque", url: "/estoque", icon: Package, description: "Controle de peças" },
    { title: "Financeiro", url: "/financeiro", icon: DollarSign, description: "Gestão financeira" },
    { title: "Assistente IA", url: "/assistente-ia", icon: Brain, description: "Inteligência artificial com memória" },
    { title: "Configurações", url: "/configuracoes", icon: Settings, description: "Base de conhecimento" },
];

const PAGE_TITLES = {
    "/dashboard": "Dashboard Operacional",
    "/clientes": "Gestão de Clientes",
    "/estoque": "Controle de Estoque",
    "/financeiro": "Gestão Financeira",
    "/assistente-ia": "Assistente de IA",
    "/configuracoes": "Configurações do Sistema",
};

const USER_ROLES = {
    MECANICO: ['MECAN', 'TECNICO', 'OFICIAL'],
    ADMIN: ['ADMIN', 'GERENTE', 'SUPER']
};

// --- Subcomponentes ---
const LogoIcon = () => (
    <div className="relative group">
        <div className="w-12 h-12 bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-700 rounded-xl flex items-center justify-center shadow-lg transform group-hover:scale-105 transition-transform duration-200">
            <Wrench className="w-7 h-7 text-white" />
        </div>
        <div className="absolute -top-1 -right-1 w-4 h-4 bg-gradient-to-r from-orange-400 to-orange-500 rounded-full flex items-center justify-center shadow-sm">
            <div className="w-2 h-2 bg-white rounded-full"></div>
        </div>
    </div>
);

const SystemStatusPanel = ({ onEstoqueBaixoClick }) => {
    const { servicos } = useDashboardData();
    const { pecas } = useEstoqueData();

    // Calcular serviços ativos (mesma lógica do dashboard)
    const servicosAtivos = useMemo(() => {
        if (!servicos) return 0;
        return servicos.filter(servico => servico.status !== 'FINALIZADO').length;
    }, [servicos]);

    // Calcular estoque baixo (mesma lógica da tela de peças)
    const estoqueBaixo = useMemo(() => {
        if (!pecas) return 0;
        return pecas.filter(peca => {
            const quantidade = Number(peca.quantidade || peca.estoqueAtual || 0);
            const estoqueMinimo = Number(peca.estoqueMinimo || 0);
            return quantidade <= estoqueMinimo;
        }).length;
    }, [pecas]);

    return (
        <SidebarGroup className="mt-8">
            <SidebarGroupLabel className="text-xs font-bold text-slate-500 uppercase tracking-wider px-3 py-2 flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                Status do Sistema
            </SidebarGroupLabel>
            <SidebarGroupContent>
                <div className="px-3 py-2 space-y-4">
                    <div className="flex items-center justify-between p-3 bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-lg border border-blue-200 dark:border-blue-800">
                        <div>
                            <span className="text-sm font-medium text-slate-700 dark:text-slate-200">Serviços Ativos</span>
                            <div className="text-xs text-slate-500 dark:text-slate-400">Em andamento</div>
                        </div>
                        <span className="font-bold text-blue-600 bg-blue-200 px-3 py-1 rounded-full text-sm">
                            {servicosAtivos}
                        </span>
                    </div>
                    <div
                        onClick={() => onEstoqueBaixoClick()}
                        className="flex items-center justify-between p-3 bg-gradient-to-r from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20 rounded-lg border border-orange-200 dark:border-orange-800 cursor-pointer hover:from-orange-100 hover:to-orange-200 dark:hover:from-orange-900/30 dark:hover:to-orange-800/30 transition-all duration-200"
                    >
                        <div>
                            <span className="text-sm font-medium text-slate-700 dark:text-slate-200">Estoque Baixo</span>
                            <div className="text-xs text-slate-500 dark:text-slate-400">
                                {estoqueBaixo > 0 ? 'Clique para ver detalhes' : 'Requer atenção'}
                            </div>
                        </div>
                        <span className="font-bold text-orange-600 bg-orange-200 px-3 py-1 rounded-full text-sm">
                            {estoqueBaixo}
                        </span>
                    </div>
                </div>
            </SidebarGroupContent>
        </SidebarGroup>
    );
};

const UserPanel = ({ user, isAuthenticated, isLoadingAuth, logout }) => (
    <div className="flex items-center gap-3 p-3 bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700">
        <div className="relative">
            <div className="w-10 h-10 bg-gradient-to-br from-slate-600 to-slate-700 rounded-full flex items-center justify-center shadow-md">
                <span className="text-white font-semibold text-sm">
                    {user?.nome ? user.nome.charAt(0).toUpperCase() : 'U'}
                </span>
            </div>
            <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white ${isAuthenticated ? 'bg-green-500' : 'bg-slate-400'}`}></div>
        </div>
        <div className="flex-1 min-w-0">
            <p className="font-semibold text-slate-900 dark:text-slate-100 text-sm truncate">
                {isLoadingAuth ? "Carregando..." : (isAuthenticated && user?.nome ? user.nome : "Visitante")}
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                {isAuthenticated && user?.role
                    ? user.role.replace('_', ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase())
                    : "Não autenticado"}
            </p>
        </div>
        {isAuthenticated && (
            <Button
                variant="ghost"
                size="icon"
                onClick={logout}
                aria-label="Sair"
                className="text-slate-500 dark:text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg transition-all duration-200"
            >
                <LogOut className="w-5 h-5" />
            </Button>
        )}
        <Button
            variant="ghost"
            size="icon"
            aria-label="Notificações"
            className="text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-all duration-200"
        >
            <Bell className="w-5 h-5" />
        </Button>
    </div>
);

// --- Componente principal ---
export default function Layout() {
    const location = useLocation();
    const { user, logout, isAuthenticated, isLoadingAuth } = useAuth();
    const [showEstoqueBaixoModal, setShowEstoqueBaixoModal] = useState(false);
    const [showNotificationsDropdown, setShowNotificationsDropdown] = useState(false);
    const { pecas } = useEstoqueData();
    const { servicos } = useDashboardData();

    // Fechar dropdown ao clicar fora
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (showNotificationsDropdown && !event.target.closest('.notifications-container')) {
                setShowNotificationsDropdown(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [showNotificationsDropdown]);

    // Calcular peças com estoque baixo para o modal
    const pecasEstoqueBaixo = useMemo(() => {
        if (!pecas) return [];
        return pecas.filter(peca => {
            const quantidade = Number(peca.quantidade || peca.estoqueAtual || 0);
            const estoqueMinimo = Number(peca.estoqueMinimo || 0);
            return quantidade <= estoqueMinimo;
        });
    }, [pecas]);

    // Calcular notificações (peças com estoque baixo + serviços atrasados)
    const notificationsCount = useMemo(() => {
        let count = 0;

        // Contar peças com estoque baixo
        if (pecasEstoqueBaixo) {
            count += pecasEstoqueBaixo.length;
        }

        // Contar serviços atrasados (exemplo: mais de 7 dias)
        if (servicos) {
            const servicosAtrasados = servicos.filter(servico => {
                if (servico.status === 'FINALIZADO') return false;
                const dataInicio = new Date(servico.dataInicio || servico.createdAt);
                const hoje = new Date();
                const diasDiferenca = (hoje - dataInicio) / (1000 * 60 * 60 * 24);
                return diasDiferenca > 7;
            });
            count += servicosAtrasados.length;
        }

        return count;
    }, [pecasEstoqueBaixo, servicos]);

    // Determina tipo de usuário com useMemo
    const userTypeForAssistant = useMemo(() => {
        const role = (user?.role || '').toUpperCase();
        if (USER_ROLES.MECANICO.some(kw => role.includes(kw))) return 'mecanico';
        if (USER_ROLES.ADMIN.some(kw => role.includes(kw))) return 'admin';
        return 'cliente';
    }, [user?.role]);

    // Atalhos de teclado globais
    useEffect(() => {
        const handleKeyDown = (e) => {
            // Alt + M: Abrir Matias
            if (e.altKey && e.key.toLowerCase() === 'm') {
                e.preventDefault();
                if (location.pathname !== '/assistente-ia') {
                    window.location.href = '/assistente-ia';
                }
            }
            // Alt + H: Mostrar atalhos (Help)
            if (e.altKey && e.key.toLowerCase() === 'h') {
                e.preventDefault();
                toast(
                    <div className="text-sm">
                        <p className="font-bold mb-2">⌨️ Atalhos Disponíveis:</p>
                        <p><kbd className="px-2 py-1 bg-slate-200 rounded text-xs">Alt+M</kbd> Abrir Matias</p>
                        <p><kbd className="px-2 py-1 bg-slate-200 rounded text-xs">Alt+H</kbd> Mostrar atalhos</p>
                    </div>,
                    { duration: 4000 }
                );
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [location.pathname]);

    return (
        <SidebarProvider defaultOpen={true}>
            <Toaster
                position="top-right"
                reverseOrder={false}
                toastOptions={{
                    duration: 3000,
                    style: { background: '#333', color: '#fff' },
                    success: { duration: 3000, theme: { primary: 'green', secondary: 'black' } },
                    error: { duration: 4000, theme: { primary: 'red', secondary: 'black' } }
                }}
            />

            <div className="min-h-screen w-full bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-950 dark:to-slate-900 flex flex-col">

                {/* Header Global Fixo */}
                <header className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200/60 dark:border-slate-800/60 shadow-sm z-30 flex-shrink-0 sticky top-0">
                    <div className="flex items-center justify-between h-16">
                        <div className="flex items-center gap-4 px-6">
                            <SidebarTrigger className="md:hidden hover:bg-slate-100 p-2 rounded-lg transition-colors duration-200" />

                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg flex items-center justify-center shadow-md">
                                    <Wrench className="w-4 h-4 text-white" />
                                </div>
                                <div className="flex items-center gap-2 md:gap-4">
                                    {/* Parte fixa - OFIX Sistema Operacional */}
                                    <div className="hidden sm:block">
                                        <h1 className="text-lg md:text-xl font-bold text-slate-900 tracking-tight">
                                            OFIX Sistema Operacional
                                        </h1>
                                        <p className="text-xs text-slate-600 font-medium uppercase tracking-wider">
                                            Gestão Completa de Oficina
                                        </p>
                                    </div>

                                    {/* Versão mobile - apenas OFIX */}
                                    <div className="block sm:hidden">
                                        <h1 className="text-lg font-bold text-slate-900 tracking-tight">
                                            OFIX
                                        </h1>
                                        <p className="text-xs text-slate-600 font-medium uppercase tracking-wider">
                                            Sistema
                                        </p>
                                    </div>

                                    {/* Divisor visual */}
                                    <div className="h-8 md:h-10 w-px bg-slate-300"></div>

                                    {/* Parte dinâmica - Nome da página */}
                                    <div>
                                        <h2 className="text-base md:text-lg font-semibold text-blue-700 tracking-tight">
                                            {PAGE_TITLES[location.pathname] || "Página"}
                                        </h2>
                                        <p className="text-xs text-slate-500 font-medium hidden sm:block">
                                            Área atual do sistema
                                        </p>
                                    </div>

                                    {/* Theme Toggle */}
                                    <ThemeToggle />

                                    <div className="relative notifications-container">
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => setShowNotificationsDropdown(!showNotificationsDropdown)}
                                            aria-label="Notificações"
                                            className="text-slate-500 hover:text-slate-700 hover:bg-blue-100 rounded-lg transition-all duration-200"
                                        >
                                            <Bell className="w-5 h-5" />
                                        </Button>

                                        {/* Badge de notificações */}
                                        {notificationsCount > 0 && (
                                            <div className="absolute -top-1 -right-1 min-w-[20px] h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center px-1.5 shadow-lg">
                                                {notificationsCount > 99 ? '99+' : notificationsCount}
                                            </div>
                                        )}

                                        {/* Dropdown de Notificações */}
                                        {showNotificationsDropdown && (
                                            <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-xl shadow-2xl border border-slate-200 z-50">
                                                {/* Header do Dropdown */}
                                                <div className="flex items-center justify-between p-4 border-b border-slate-200 bg-gradient-to-r from-blue-50 to-blue-100">
                                                    <h3 className="text-lg font-semibold text-slate-900">Notificações</h3>
                                                    <button
                                                        onClick={() => setShowNotificationsDropdown(false)}
                                                        className="p-1 hover:bg-slate-100 rounded-lg transition-colors duration-200"
                                                    >
                                                        <X className="w-4 h-4 text-slate-500" />
                                                    </button>
                                                </div>

                                                {/* Lista de Notificações */}
                                                <div className="max-h-96 overflow-y-auto">
                                                    {notificationsCount > 0 ? (
                                                        <div className="p-2">
                                                            {/* Notificações de Estoque Baixo */}
                                                            {pecasEstoqueBaixo.length > 0 && (
                                                                <div className="space-y-1">
                                                                    <div className="px-3 py-2 text-xs font-semibold text-orange-600 uppercase tracking-wider">
                                                                        Estoque Baixo ({pecasEstoqueBaixo.length})
                                                                    </div>
                                                                    {pecasEstoqueBaixo.slice(0, 3).map((peca, index) => (
                                                                        <div
                                                                            key={peca.id || index}
                                                                            onClick={() => {
                                                                                setShowNotificationsDropdown(false);
                                                                                setShowEstoqueBaixoModal(true);
                                                                            }}
                                                                            className="flex items-center gap-3 p-3 hover:bg-orange-50 rounded-lg cursor-pointer transition-colors duration-200"
                                                                        >
                                                                            <div className="w-2 h-2 bg-orange-500 rounded-full flex-shrink-0"></div>
                                                                            <div className="flex-1 min-w-0">
                                                                                <p className="text-sm font-medium text-slate-900 truncate">
                                                                                    {peca.nome || peca.descricao || 'Peça sem nome'}
                                                                                </p>
                                                                                <p className="text-xs text-slate-500">
                                                                                    Estoque: {Number(peca.quantidade || peca.estoqueAtual || 0)} (Mín: {Number(peca.estoqueMinimo || 0)})
                                                                                </p>
                                                                            </div>
                                                                        </div>
                                                                    ))}
                                                                    {pecasEstoqueBaixo.length > 3 && (
                                                                        <div
                                                                            onClick={() => {
                                                                                setShowNotificationsDropdown(false);
                                                                                setShowEstoqueBaixoModal(true);
                                                                            }}
                                                                            className="p-3 text-center text-sm text-orange-600 hover:bg-orange-50 rounded-lg cursor-pointer transition-colors duration-200"
                                                                        >
                                                                            Ver mais {pecasEstoqueBaixo.length - 3} peças...
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            )}

                                                            {/* Notificações de Serviços Atrasados */}
                                                            {servicos && servicos.filter(servico => {
                                                                const dataInicio = new Date(servico.dataInicio);
                                                                const hoje = new Date();
                                                                const diasDecorridos = Math.floor((hoje - dataInicio) / (1000 * 60 * 60 * 24));
                                                                return servico.status !== 'FINALIZADO' && diasDecorridos > 7;
                                                            }).length > 0 && (
                                                                    <div className="space-y-1 mt-4">
                                                                        <div className="px-3 py-2 text-xs font-semibold text-red-600 uppercase tracking-wider">
                                                                            Serviços Atrasados
                                                                        </div>
                                                                        {servicos.filter(servico => {
                                                                            const dataInicio = new Date(servico.dataInicio);
                                                                            const hoje = new Date();
                                                                            const diasDecorridos = Math.floor((hoje - dataInicio) / (1000 * 60 * 60 * 24));
                                                                            return servico.status !== 'FINALIZADO' && diasDecorridos > 7;
                                                                        }).slice(0, 2).map((servico, index) => {
                                                                            const dataInicio = new Date(servico.dataInicio);
                                                                            const hoje = new Date();
                                                                            const diasDecorridos = Math.floor((hoje - dataInicio) / (1000 * 60 * 60 * 24));
                                                                            return (
                                                                                <div
                                                                                    key={servico.id || index}
                                                                                    className="flex items-center gap-3 p-3 hover:bg-red-50 rounded-lg cursor-pointer transition-colors duration-200"
                                                                                >
                                                                                    <div className="w-2 h-2 bg-red-500 rounded-full flex-shrink-0"></div>
                                                                                    <div className="flex-1 min-w-0">
                                                                                        <p className="text-sm font-medium text-slate-900 truncate">
                                                                                            OS #{servico.numeroOS || servico.id}
                                                                                        </p>
                                                                                        <p className="text-xs text-slate-500">
                                                                                            {diasDecorridos} dias em andamento
                                                                                        </p>
                                                                                    </div>
                                                                                </div>
                                                                            );
                                                                        })}
                                                                    </div>
                                                                )}
                                                        </div>
                                                    ) : (
                                                        <div className="p-6 text-center">
                                                            <Bell className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                                                            <p className="text-slate-500 text-sm">Nenhuma notificação nova</p>
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Footer do Dropdown */}
                                                {notificationsCount > 0 && (
                                                    <div className="p-3 border-t border-slate-200 bg-slate-50">
                                                        <button
                                                            onClick={() => setShowNotificationsDropdown(false)}
                                                            className="w-full text-sm text-slate-600 hover:text-slate-800 transition-colors duration-200"
                                                        >
                                                            Fechar notificações
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>

                                    {/* Botão de Logout no Header */}
                                    {isAuthenticated && (
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={logout}
                                            aria-label="Sair da conta"
                                            className="text-slate-500 hover:text-red-600 hover:bg-red-100 rounded-lg transition-all duration-200 p-3"
                                        >
                                            <LogOut className="w-5 h-5" />
                                        </Button>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </header>

                {/* Container com Sidebar e Conteúdo */}
                <div className="flex flex-1 h-full overflow-hidden">
                    {/* Sidebar */}
                    <Sidebar className="border-r border-slate-200/60 dark:border-slate-800/60 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md shadow-xl z-20 w-64 flex-shrink-0 fixed h-full top-16 left-0 hidden md:flex md:flex-col">
                        <SidebarContent className="p-4 pt-6 flex-1 overflow-y-auto">
                            {/* Menu de navegação */}
                            <SidebarGroup>
                                <SidebarGroupLabel className="text-xs font-bold text-slate-500 uppercase tracking-wider px-3 py-2 flex items-center gap-2">
                                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                                    Navegação Principal
                                </SidebarGroupLabel>
                                <SidebarGroupContent>
                                    <SidebarMenu className="space-y-2">
                                        {NAVIGATION_ITEMS.map((item) => {
                                            const isActive = location.pathname === item.url;
                                            return (
                                                <SidebarMenuItem key={item.title}>
                                                    <SidebarMenuButton
                                                        asChild
                                                        className={`sidebar-transition rounded-xl group ${isActive
                                                            ? 'nav-item-active text-blue-700 dark:text-blue-400'
                                                            : 'text-slate-600 dark:text-slate-400 nav-item-hover hover:text-slate-900 dark:hover:text-slate-200'
                                                            }`}
                                                    >
                                                        <Link to={item.url} className="flex items-center gap-4 px-4 py-3">
                                                            <div className={`p-2 rounded-lg transition-all duration-200 ${isActive
                                                                ? 'bg-blue-500 text-white shadow-lg dark:bg-blue-600'
                                                                : 'bg-slate-100 group-hover:bg-slate-200 dark:bg-slate-800 dark:group-hover:bg-slate-700'
                                                                }`}>
                                                                <item.icon className="w-4 h-4" />
                                                            </div>
                                                            <div className="flex-1 min-w-0">
                                                                <div className={`font-semibold text-sm ${isActive ? 'text-blue-700 dark:text-blue-400' : ''}`}>
                                                                    {item.title}
                                                                </div>
                                                                <div className="text-xs text-slate-500 dark:text-slate-500 truncate">
                                                                    {item.description}
                                                                </div>
                                                            </div>
                                                        </Link>
                                                    </SidebarMenuButton>
                                                </SidebarMenuItem>
                                            );
                                        })}
                                    </SidebarMenu>
                                </SidebarGroupContent>
                            </SidebarGroup>

                            <SystemStatusPanel
                                onEstoqueBaixoClick={() => setShowEstoqueBaixoModal(true)}
                            />
                        </SidebarContent>

                        <SidebarFooter className="border-t border-slate-200/60 dark:border-slate-800/60 p-4 bg-gradient-to-r from-slate-50 to-gray-50 dark:from-slate-900 dark:to-slate-800 sticky bottom-0">
                            <UserPanel
                                user={user}
                                isAuthenticated={isAuthenticated}
                                isLoadingAuth={isLoadingAuth}
                                logout={logout}
                            />
                        </SidebarFooter>
                    </Sidebar>

                    {/* Sidebar Mobile - dentro do SidebarProvider já gerencia automaticamente */}

                    {/* Conteúdo principal */}
                    <main className="flex flex-col flex-1 overflow-hidden">
                        <div className="flex-1 overflow-y-auto bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-950 dark:to-slate-900">
                            <Outlet />
                        </div>
                    </main>
                </div>
            </div>

            {/* Assistente virtual apenas se autenticado - COMENTADO TEMPORARIAMENTE */}
            {/* {isAuthenticated && (
                <VirtualAssistant
                    userType={userTypeForAssistant}
                    initialContext={{
                        userId: user?.id,
                        userName: user?.nome,
                        role: user?.role || 'cliente'
                    }}
                />
            )} */}

            {/* Botão Flutuante Matias */}
            {isAuthenticated && location.pathname !== '/assistente-ia' && (
                <Link
                    to="/assistente-ia"
                    className="fixed bottom-6 right-6 w-14 h-14 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 rounded-full shadow-lg flex items-center justify-center z-40 transition-all duration-300 hover:scale-110 group"
                    aria-label="Abrir Assistente Matias"
                >
                    <Brain className="w-6 h-6 text-white" />
                    <span className="absolute -top-2 -right-2 w-6 h-6 bg-green-500 rounded-full border-2 border-white flex items-center justify-center">
                        <span className="w-2 h-2 bg-white rounded-full animate-pulse"></span>
                    </span>
                    <div className="absolute bottom-full mb-2 right-0 bg-slate-900 text-white text-xs px-3 py-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                        Matias IA (Alt+M)
                    </div>
                </Link>
            )}

            {/* Modal de Estoque Baixo - Overlay Global */}
            {showEstoqueBaixoModal && (
                <div className="fixed inset-0 bg-black/50 z-[9999] flex items-center justify-center p-4">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[80vh] overflow-hidden">
                        {/* Header do Modal */}
                        <div className="flex items-center justify-between p-6 border-b border-slate-200 bg-gradient-to-r from-orange-50 to-orange-100">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-orange-500 rounded-lg">
                                    <AlertTriangle className="w-5 h-5 text-white" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-semibold text-slate-900">
                                        Peças com Estoque Baixo
                                    </h3>
                                    <p className="text-sm text-slate-600">
                                        {pecasEstoqueBaixo.length} {pecasEstoqueBaixo.length === 1 ? 'peça precisa' : 'peças precisam'} de reposição
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={() => setShowEstoqueBaixoModal(false)}
                                className="p-2 hover:bg-slate-100 rounded-lg transition-colors duration-200"
                            >
                                <X className="w-5 h-5 text-slate-500" />
                            </button>
                        </div>

                        {/* Conteúdo do Modal */}
                        <div className="p-6 overflow-y-auto max-h-96">
                            {pecasEstoqueBaixo.length > 0 ? (
                                <div className="space-y-3">
                                    {pecasEstoqueBaixo.map((peca, index) => {
                                        const quantidade = Number(peca.quantidade || peca.estoqueAtual || 0);
                                        const estoqueMinimo = Number(peca.estoqueMinimo || 0);
                                        return (
                                            <div
                                                key={peca.id || index}
                                                className="flex items-center justify-between p-4 bg-slate-50 rounded-lg border border-slate-200"
                                            >
                                                <div className="flex-1">
                                                    <h4 className="font-medium text-slate-900">
                                                        {peca.nome || peca.descricao || 'Peça sem nome'}
                                                    </h4>
                                                    <p className="text-sm text-slate-600">
                                                        Código: {peca.codigo || 'N/A'}
                                                    </p>
                                                </div>
                                                <div className="text-right">
                                                    <div className="text-sm font-medium text-orange-600">
                                                        Atual: {quantidade}
                                                    </div>
                                                    <div className="text-xs text-slate-500">
                                                        Mínimo: {estoqueMinimo}
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            ) : (
                                <div className="text-center py-8">
                                    <Package className="w-12 h-12 text-slate-400 mx-auto mb-3" />
                                    <p className="text-slate-600">Nenhuma peça com estoque baixo encontrada.</p>
                                </div>
                            )}
                        </div>

                        {/* Footer do Modal */}
                        <div className="flex items-center justify-between p-6 border-t border-slate-200 bg-slate-50">
                            <div className="text-sm text-slate-600">
                                📝 Dica: Considere repor essas peças o quanto antes
                            </div>
                            <div className="flex items-center gap-3">
                                <button
                                    onClick={() => setShowEstoqueBaixoModal(false)}
                                    className="px-4 py-2 text-slate-600 hover:text-slate-800 transition-colors duration-200"
                                >
                                    Fechar
                                </button>
                                <Link
                                    to="/estoque"
                                    onClick={() => setShowEstoqueBaixoModal(false)}
                                    className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg transition-colors duration-200 font-medium"
                                >
                                    Ver Estoque
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </SidebarProvider>
    );
}