import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
    Bell, 
    BarChart3, 
    Clock as TimelineIcon, 
    Save, 
    CheckCircle2, 
    AlertTriangle, 
    TrendingUp,
    Clock,
    DollarSign,
    MessageCircle
} from "lucide-react";
import toast from 'react-hot-toast';

// Simulação de dados para demonstração
const servicoDemo = {
    id: 123,
    numeroOs: "OS-2025-001",
    status: "EM_ANDAMENTO",
    descricaoProblema: "Problema no motor - barulho estranho",
    valorTotalServicos: 350,
    valorTotalPecas: 480,
    valorTotalFinal: 830,
    dataInicio: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 dias atrás
    procedimentos: [
        { id: 1, descricao: "Diagnóstico inicial", concluido: true },
        { id: 2, descricao: "Desmontagem do motor", concluido: true },
        { id: 3, descricao: "Troca do rolamento", concluido: false },
        { id: 4, descricao: "Montagem final", concluido: false },
        { id: 5, descricao: "Teste de funcionamento", concluido: false }
    ],
    itensPeca: [
        { 
            id: 1, 
            quantidade: 2, 
            precoUnitarioCobrado: 240,
            peca: { nome: "Rolamento", estoqueAtual: 3, estoqueMinimo: 5 }
        }
    ]
};

export default function DemoMelhorias() {
    const [mostrarNotificacoes, setMostrarNotificacoes] = useState(false);
    const [mostrarEstatisticas, setMostrarEstatisticas] = useState(false);
    const [mostrarTimeline, setMostrarTimeline] = useState(false);
    const [mostrarAutoSave, setMostrarAutoSave] = useState(false);

    // Simular notificações inteligentes
    const demonstrarNotificacoes = () => {
        setMostrarNotificacoes(true);
        
                        // Notificação de progresso
        setTimeout(() => {
            toast.success('🎉 2 de 5 procedimentos concluídos!\nProgresso: 40%', {
                duration: 3000,
                position: 'top-right'
            });
        }, 500);

        // Notificação de estoque baixo
        setTimeout(() => {
            toast.error('⚠️ Estoque baixo detectado\nRolamento: 3/5 unidades', {
                duration: 4000,
                position: 'top-right'
            });
        }, 2000);

        // Sugestão automática
        setTimeout(() => {
            toast.custom((t) => (
                <div className="bg-white shadow-lg rounded-lg p-4 border-l-4 border-blue-500 max-w-md">
                    <div className="flex items-start">
                        <div className="flex-1">
                            <h3 className="text-sm font-medium text-gray-900">
                                💡 Sugestão Automática
                            </h3>
                            <p className="mt-1 text-sm text-gray-600">
                                Com base no progresso atual, este serviço deve ser concluído em aproximadamente 4 horas.
                            </p>
                            <div className="mt-3 flex gap-2">
                                <button
                                    onClick={() => {
                                        toast.dismiss(t.id);
                                        toast.success('Lembrete agendado!');
                                    }}
                                    className="text-sm bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700"
                                >
                                    Agendar Lembrete
                                </button>
                                <button
                                    onClick={() => toast.dismiss(t.id)}
                                    className="text-sm bg-gray-300 text-gray-700 px-3 py-1 rounded hover:bg-gray-400"
                                >
                                    Dispensar
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            ), { duration: Infinity });
        }, 4000);
    };

    // Simular auto-save
    const demonstrarAutoSave = () => {
        setMostrarAutoSave(true);
        
        // Indicador de "salvando"
        toast.loading('💾 Auto-salvando alterações...', { 
            id: 'autosave',
            duration: 2000 
        });
        
        setTimeout(() => {
            toast.success('✅ Alterações salvas automaticamente', { 
                id: 'autosave',
                duration: 2000 
            });
        }, 2000);

        // Simular validação
        setTimeout(() => {
            toast.custom((t) => (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 shadow-lg max-w-md">
                    <div className="flex items-center gap-2 mb-2">
                        <AlertTriangle className="w-4 h-4 text-yellow-600" />
                        <span className="text-sm font-medium text-yellow-800">
                            Avisos de Validação
                        </span>
                    </div>
                    <ul className="text-xs text-yellow-700 space-y-1">
                        <li>• Valores financeiros foram recalculados automaticamente</li>
                        <li>• Estoque baixo detectado para peça "Rolamento"</li>
                    </ul>
                </div>
            ), { duration: 4000 });
        }, 4500);
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
            <div className="max-w-7xl mx-auto space-y-8">
                {/* Header */}
                <div className="text-center">
                    <h1 className="text-4xl font-bold text-slate-900 mb-4">
                        🚀 Demonstração das Melhorias UX
                    </h1>
                    <p className="text-lg text-slate-600 max-w-3xl mx-auto">
                        Explore as novas funcionalidades implementadas no sistema de modais, 
                        incluindo notificações inteligentes, estatísticas em tempo real, 
                        auto-save e muito mais!
                    </p>
                </div>

                {/* Grid de Funcionalidades */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {/* Notificações Inteligentes */}
                    <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow cursor-pointer" 
                          onClick={demonstrarNotificacoes}>
                        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-purple-500/5 rounded-lg" />
                        <CardHeader className="relative">
                            <div className="w-12 h-12 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-xl flex items-center justify-center mb-4">
                                <Bell className="w-6 h-6 text-blue-600" />
                            </div>
                            <CardTitle className="text-lg">Notificações Inteligentes</CardTitle>
                        </CardHeader>
                        <CardContent className="relative">
                            <p className="text-sm text-slate-600 mb-4">
                                Sistema que detecta eventos e sugere ações automaticamente
                            </p>
                            <div className="space-y-2">
                                <Badge variant="outline" className="text-xs">Progresso automático</Badge>
                                <Badge variant="outline" className="text-xs">Alertas de estoque</Badge>
                                <Badge variant="outline" className="text-xs">Sugestões contextuais</Badge>
                            </div>
                            <Button className="w-full mt-4" variant="outline" size="sm">
                                Demonstrar
                            </Button>
                        </CardContent>
                    </Card>

                    {/* Estatísticas em Tempo Real */}
                    <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow cursor-pointer"
                          onClick={() => setMostrarEstatisticas(!mostrarEstatisticas)}>
                        <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 to-emerald-500/5 rounded-lg" />
                        <CardHeader className="relative">
                            <div className="w-12 h-12 bg-gradient-to-br from-green-500/20 to-emerald-500/20 rounded-xl flex items-center justify-center mb-4">
                                <BarChart3 className="w-6 h-6 text-green-600" />
                            </div>
                            <CardTitle className="text-lg">Estatísticas Avançadas</CardTitle>
                        </CardHeader>
                        <CardContent className="relative">
                            <p className="text-sm text-slate-600 mb-4">
                                Métricas detalhadas de desempenho e qualidade
                            </p>
                            <div className="space-y-2">
                                <Badge variant="outline" className="text-xs">Eficiência: 40%</Badge>
                                <Badge variant="outline" className="text-xs">Qualidade: 85%</Badge>
                                <Badge variant="outline" className="text-xs">Custo: 92%</Badge>
                            </div>
                            <Button className="w-full mt-4" variant="outline" size="sm">
                                {mostrarEstatisticas ? 'Ocultar' : 'Mostrar'}
                            </Button>
                        </CardContent>
                    </Card>

                    {/* Timeline Inteligente */}
                    <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow cursor-pointer"
                          onClick={() => setMostrarTimeline(!mostrarTimeline)}>
                        <div className="absolute inset-0 bg-gradient-to-br from-orange-500/5 to-red-500/5 rounded-lg" />
                        <CardHeader className="relative">
                            <div className="w-12 h-12 bg-gradient-to-br from-orange-500/20 to-red-500/20 rounded-xl flex items-center justify-center mb-4">
                                <TimelineIcon className="w-6 h-6 text-orange-600" />
                            </div>
                            <CardTitle className="text-lg">Timeline & Status</CardTitle>
                        </CardHeader>
                        <CardContent className="relative">
                            <p className="text-sm text-slate-600 mb-4">
                                Acompanhamento visual do progresso com sugestões
                            </p>
                            <div className="space-y-2">
                                <Badge variant="outline" className="text-xs">Histórico visual</Badge>
                                <Badge variant="outline" className="text-xs">Próximos passos</Badge>
                                <Badge variant="outline" className="text-xs">Estimativas</Badge>
                            </div>
                            <Button className="w-full mt-4" variant="outline" size="sm">
                                {mostrarTimeline ? 'Ocultar' : 'Mostrar'}
                            </Button>
                        </CardContent>
                    </Card>

                    {/* Auto-Save */}
                    <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow cursor-pointer"
                          onClick={demonstrarAutoSave}>
                        <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-purple-500/5 rounded-lg" />
                        <CardHeader className="relative">
                            <div className="w-12 h-12 bg-gradient-to-br from-indigo-500/20 to-purple-500/20 rounded-xl flex items-center justify-center mb-4">
                                <Save className="w-6 h-6 text-indigo-600" />
                            </div>
                            <CardTitle className="text-lg">Auto-Save Inteligente</CardTitle>
                        </CardHeader>
                        <CardContent className="relative">
                            <p className="text-sm text-slate-600 mb-4">
                                Salvamento automático com validação em tempo real
                            </p>
                            <div className="space-y-2">
                                <Badge variant="outline" className="text-xs">Validação automática</Badge>
                                <Badge variant="outline" className="text-xs">Feedback visual</Badge>
                                <Badge variant="outline" className="text-xs">Recuperação de erros</Badge>
                            </div>
                            <Button className="w-full mt-4" variant="outline" size="sm">
                                Demonstrar
                            </Button>
                        </CardContent>
                    </Card>
                </div>

                {/* Estatísticas Detalhadas */}
                {mostrarEstatisticas && (
                    <Card className="border-0 shadow-lg bg-white/90 backdrop-blur-sm">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-3">
                                <BarChart3 className="w-6 h-6 text-green-600" />
                                Estatísticas do Serviço OS-2025-001
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                                <div className="p-4 rounded-lg border border-slate-200 bg-white">
                                    <div className="flex items-center justify-between mb-2">
                                        <TrendingUp className="w-5 h-5 text-slate-500" />
                                        <span className="text-2xl font-bold text-orange-600">40%</span>
                                    </div>
                                    <h3 className="text-sm font-medium text-slate-700">Eficiência</h3>
                                    <div className="mt-2 h-1 rounded-full bg-orange-100">
                                        <div className="h-full rounded-full bg-orange-600" style={{ width: '40%' }} />
                                    </div>
                                </div>

                                <div className="p-4 rounded-lg border border-slate-200 bg-white">
                                    <div className="flex items-center justify-between mb-2">
                                        <Clock className="w-5 h-5 text-slate-500" />
                                        <span className="text-2xl font-bold text-blue-600">2d 4h</span>
                                    </div>
                                    <h3 className="text-sm font-medium text-slate-700">Tempo Gasto</h3>
                                </div>

                                <div className="p-4 rounded-lg border border-slate-200 bg-white">
                                    <div className="flex items-center justify-between mb-2">
                                        <DollarSign className="w-5 h-5 text-slate-500" />
                                        <span className="text-2xl font-bold text-green-600">92%</span>
                                    </div>
                                    <h3 className="text-sm font-medium text-slate-700">Eficiência de Custo</h3>
                                    <div className="mt-2 h-1 rounded-full bg-green-100">
                                        <div className="h-full rounded-full bg-green-600" style={{ width: '92%' }} />
                                    </div>
                                </div>

                                <div className="p-4 rounded-lg border border-slate-200 bg-white">
                                    <div className="flex items-center justify-between mb-2">
                                        <CheckCircle2 className="w-5 h-5 text-slate-500" />
                                        <span className="text-2xl font-bold text-green-600">85%</span>
                                    </div>
                                    <h3 className="text-sm font-medium text-slate-700">Score de Qualidade</h3>
                                    <div className="mt-2 h-1 rounded-full bg-green-100">
                                        <div className="h-full rounded-full bg-green-600" style={{ width: '85%' }} />
                                    </div>
                                </div>
                            </div>

                            <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                                <h4 className="font-medium text-yellow-800 mb-2">Recomendações:</h4>
                                <ul className="text-sm text-yellow-700 space-y-1">
                                    <li>• Eficiência baixa - considere revisar cronograma dos procedimentos restantes</li>
                                    <li>• Estoque baixo detectado para "Rolamento" - reabastecer em breve</li>
                                    <li>• Tempo estimado para conclusão: 4-6 horas</li>
                                </ul>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Timeline Detalhada */}
                {mostrarTimeline && (
                    <Card className="border-0 shadow-lg bg-white/90 backdrop-blur-sm">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-3">
                                <TimelineIcon className="w-6 h-6 text-orange-600" />
                                Timeline do Serviço OS-2025-001
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {/* Status Atual */}
                                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                                    <div className="flex items-center justify-between mb-2">
                                        <div className="flex items-center gap-3">
                                            <div className="w-3 h-3 rounded-full bg-blue-500" />
                                            <Badge variant="outline">EM_ANDAMENTO</Badge>
                                        </div>
                                        <span className="text-sm text-slate-600">40% concluído</span>
                                    </div>
                                    <div className="w-full bg-slate-200 rounded-full h-2">
                                        <div className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full" style={{ width: '40%' }} />
                                    </div>
                                </div>

                                {/* Próximos Passos */}
                                <div className="space-y-3">
                                    <h4 className="font-medium text-slate-900">Próximos passos:</h4>
                                    <div className="p-3 rounded-lg border-l-4 border-orange-200 bg-orange-50">
                                        <div className="flex items-start gap-3">
                                            <AlertTriangle className="w-5 h-5 mt-0.5 text-orange-600" />
                                            <div className="flex-1">
                                                <p className="font-medium text-slate-900 text-sm">
                                                    3 procedimentos pendentes
                                                </p>
                                                <p className="text-xs text-slate-600 mt-1">
                                                    Continue executando: Troca do rolamento, Montagem final, Teste
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Histórico */}
                                <div className="space-y-4">
                                    <h4 className="font-medium text-slate-900">Histórico:</h4>
                                    <div className="space-y-4">
                                        {[
                                            { status: 'EM_ANDAMENTO', time: '2h atrás', user: 'Maria Santos', desc: 'Cliente aprovou o orçamento' },
                                            { status: 'AGUARDANDO_APROVACAO', time: '1d atrás', user: 'João Silva', desc: 'Orçamento enviado para aprovação' },
                                            { status: 'CRIADO', time: '2d atrás', user: 'Sistema', desc: 'Serviço criado' }
                                        ].map((item, index) => (
                                            <div key={index} className="flex items-start gap-4">
                                                <div className="flex flex-col items-center">
                                                    <div className="w-3 h-3 rounded-full bg-blue-500" />
                                                    {index < 2 && <div className="w-px h-8 bg-slate-200 mt-2" />}
                                                </div>
                                                <div className="flex-1 pb-4">
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <span className="text-sm font-medium text-slate-900">{item.user}</span>
                                                        <span className="text-xs text-slate-500">{item.time}</span>
                                                    </div>
                                                    <p className="text-sm text-slate-600">{item.desc}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Como Acessar */}
                <Card className="border-0 shadow-lg bg-gradient-to-br from-indigo-50 to-purple-50">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-3">
                            <MessageCircle className="w-6 h-6 text-indigo-600" />
                            Como Acessar as Melhorias
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <h4 className="font-medium text-slate-900 mb-3">🎯 No Sistema Principal:</h4>
                                <ul className="space-y-2 text-sm text-slate-600">
                                    <li>1. Abra o Dashboard principal</li>
                                    <li>2. Clique em qualquer serviço para abrir o modal</li>
                                    <li>3. Na aba "Detalhes", você verá 3 sub-abas:</li>
                                    <li className="ml-4">• Informações Básicas</li>
                                    <li className="ml-4">• <strong>Estatísticas</strong> (novo!)</li>
                                    <li className="ml-4">• <strong>Timeline</strong> (novo!)</li>
                                    <li>4. As notificações aparecem automaticamente</li>
                                    <li>5. O auto-save funciona ao editar qualquer campo</li>
                                </ul>
                            </div>
                            <div>
                                <h4 className="font-medium text-slate-900 mb-3">✨ Funcionalidades Automáticas:</h4>
                                <ul className="space-y-2 text-sm text-slate-600">
                                    <li>• <strong>Notificações inteligentes</strong> ao completar procedimentos</li>
                                    <li>• <strong>Alertas de estoque baixo</strong> para peças utilizadas</li>
                                    <li>• <strong>Auto-save</strong> após 3 segundos de inatividade</li>
                                    <li>• <strong>Validação em tempo real</strong> de dados</li>
                                    <li>• <strong>Recálculo automático</strong> de valores financeiros</li>
                                    <li>• <strong>Sugestões contextuais</strong> baseadas no progresso</li>
                                    <li>• <strong>Métricas de desempenho</strong> atualizadas em tempo real</li>
                                </ul>
                            </div>
                        </div>
                        
                        <div className="mt-6 p-4 bg-indigo-100 rounded-lg">
                            <p className="text-sm text-indigo-800">
                                <strong>💡 Dica:</strong> Todas essas funcionalidades trabalham em segundo plano para 
                                melhorar sua experiência sem interromper o fluxo de trabalho!
                            </p>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
