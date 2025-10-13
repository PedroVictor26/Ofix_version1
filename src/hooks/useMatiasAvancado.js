/**
 * 🤖 Hook Avançado do Matias
 * Integra todas as funcionalidades reais do assistente
 */

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import * as conversasService from '../services/conversas.service';
import * as agendamentosService from '../services/agendamentos.service';
import * as consultasOSService from '../services/consultasOS.service';

export const useMatiasAvancado = () => {
  const { user } = useAuth();
  const [conversaAtual, setConversaAtual] = useState(null);
  const [mensagens, setMensagens] = useState([]);
  const [carregando, setCarregando] = useState(false);
  const [historicoConversas, setHistoricoConversas] = useState([]);
  const [estatisticas, setEstatisticas] = useState(null);

  // Inicializar Matias com dados reais
  useEffect(() => {
    if (user?.id) {
      inicializarMatias();
    }
  }, [user?.id]);

  const inicializarMatias = async () => {
    try {
      setCarregando(true);
      
      // Carregar histórico de conversas
      const historico = await conversasService.buscarHistoricoConversas(user.id);
      setHistoricoConversas(historico);
      
      // Carregar estatísticas rápidas
      const stats = await consultasOSService.consultarEstatisticas();
      setEstatisticas(stats.estatisticas);
      
      // Mensagem de boas-vindas com dados reais
      const mensagemBoasVindas = criarMensagemBoasVindas(stats.estatisticas);
      setMensagens([mensagemBoasVindas]);
      
    } catch (error) {
      console.error('Erro ao inicializar Matias:', error);
    } finally {
      setCarregando(false);
    }
  };

  const criarMensagemBoasVindas = (stats) => ({
    id: Date.now(),
    tipo: 'matias',
    conteudo: `👋 **Olá ${user?.nome}! Eu sou o Matias - Mecânico-Chefe da Ofix**

🔧 **Status Atual da Oficina:**
• **${stats?.osEmAndamento || 0}** serviços em andamento
• **${stats?.osAbertas || 0}** OS aguardando início
• **${stats?.totalAtivo || 0}** serviços ativos no total

**Como posso ajudá-lo hoje?**

🎯 **Funcionalidades Disponíveis:**
• 📅 **Agendamentos** - Marcar, consultar, reagendar
• 📋 **Consultar OS** - Status, histórico, detalhes
• 🔍 **Buscar por Placa** - Histórico completo do veículo
• 📊 **Relatórios** - Estatísticas operacionais
• 🆘 **Emergências** - Suporte 24/7

*Fale comigo como faria com seu mecânico de confiança!*`,
    timestamp: new Date(),
    acoes: [
      { tipo: 'consultar_os', label: '📋 Consultar OS' },
      { tipo: 'agendar_servico', label: '📅 Novo Agendamento' },
      { tipo: 'buscar_veiculo', label: '🔍 Buscar Veículo' },
      { tipo: 'estatisticas', label: '📊 Ver Estatísticas' }
    ]
  });

  // Enviar mensagem com processamento inteligente
  const enviarMensagem = useCallback(async (conteudo) => {
    if (!conteudo.trim()) return;

    try {
      setCarregando(true);
      
      const mensagemUsuario = {
        id: Date.now(),
        tipo: 'user',
        conteudo,
        timestamp: new Date()
      };
      
      setMensagens(prev => [...prev, mensagemUsuario]);
      
      // Salvar no histórico
      if (conversaAtual) {
        await conversasService.salvarMensagem(
          user.id, 
          conversaAtual.id, 
          'user', 
          conteudo
        );
      }
      
      // Processar mensagem e gerar resposta
      const resposta = await processarMensagemInteligente(conteudo);
      
      const mensagemMatias = {
        id: Date.now() + 1,
        tipo: 'matias',
        conteudo: resposta.conteudo,
        timestamp: new Date(),
        acoes: resposta.acoes || [],
        dados: resposta.dados || null
      };
      
      setMensagens(prev => [...prev, mensagemMatias]);
      
      // Salvar resposta no histórico
      if (conversaAtual) {
        await conversasService.salvarMensagem(
          user.id, 
          conversaAtual.id, 
          'matias', 
          resposta.conteudo,
          { acoes: resposta.acoes, dados: resposta.dados }
        );
      }
      
    } catch (error) {
      console.error('Erro ao enviar mensagem:', error);
      
      const mensagemErro = {
        id: Date.now() + 1,
        tipo: 'erro',
        conteudo: 'Desculpe, ocorreu um erro ao processar sua solicitação. Tente novamente.',
        timestamp: new Date()
      };
      
      setMensagens(prev => [...prev, mensagemErro]);
    } finally {
      setCarregando(false);
    }
  }, [user.id, conversaAtual]);

  // Processar mensagem com IA local + dados reais
  const processarMensagemInteligente = async (mensagem) => {
    const msgLower = mensagem.toLowerCase();
    
    // 📋 CONSULTAR OS
    if (msgLower.includes('os ') || msgLower.includes('ordem') || msgLower.includes('serviço')) {
      const numeroOS = extrairNumeroOS(mensagem);
      if (numeroOS) {
        const resultado = await consultasOSService.consultarOS(numeroOS);
        
        if (resultado.encontrado) {
          const os = resultado.os;
          return {
            conteudo: `📋 **OS #${os.numero} - Encontrada!**

👤 **Cliente:** ${os.cliente}
📞 **Telefone:** ${os.telefone}
🚗 **Veículo:** ${os.veiculo}
🏷️ **Placa:** ${os.placa}

📊 **Status:** ${formatarStatus(os.status)}
📅 **Abertura:** ${formatarData(os.dataAbertura)}
🔧 **Problema:** ${os.descricaoProblema}
💰 **Valor:** R$ ${os.valorTotal.toFixed(2)}

${os.procedimentos.length > 0 ? 
  `🛠️ **Procedimentos:** ${os.procedimentos.length} item(ns)` : ''}

${os.observacoes !== 'Nenhuma' ? `📝 **Obs:** ${os.observacoes}` : ''}`,
            acoes: [
              { tipo: 'atualizar_os', label: '🔄 Atualizar Status', dados: { osId: os.numero } },
              { tipo: 'historico_cliente', label: '📋 Ver Histórico Cliente', dados: { clienteId: os.cliente } }
            ],
            dados: { os: os }
          };
        } else {
          return {
            conteudo: `❌ **OS #${numeroOS} não encontrada**

Verifique se o número está correto. Posso ajudar com:
• Buscar por placa do veículo
• Consultar histórico do cliente  
• Verificar OS em andamento

Digite o número correto ou tente uma busca diferente.`,
            acoes: [
              { tipo: 'buscar_veiculo', label: '🔍 Buscar por Placa' },
              { tipo: 'os_andamento', label: '📊 OS em Andamento' }
            ]
          };
        }
      }
    }
    
    // 🔍 BUSCAR POR PLACA
    if (msgLower.includes('placa') || /[a-z]{3}[-]?\d{4}/.test(msgLower)) {
      const placa = extrairPlaca(mensagem);
      if (placa) {
        const resultado = await consultasOSService.buscarOSPorPlaca(placa);
        
        if (resultado.encontrado) {
          const { veiculo, ordensServico } = resultado;
          return {
            conteudo: `🚗 **Veículo ${veiculo.placa} - Encontrado!**

**${veiculo.marca} ${veiculo.modelo} ${veiculo.ano}**

📋 **Histórico de Serviços (${ordensServico.length}):**
${ordensServico.slice(0, 5).map(os => 
  `• OS #${os.numero} - ${formatarStatus(os.status)} - R$ ${os.valor.toFixed(2)}`
).join('\n')}

${ordensServico.length > 5 ? `\n...e mais ${ordensServico.length - 5} serviços` : ''}`,
            acoes: [
              { tipo: 'novo_agendamento', label: '📅 Novo Agendamento', dados: { veiculo } },
              { tipo: 'historico_completo', label: '📋 Histórico Completo', dados: { veiculo } }
            ],
            dados: { veiculo, ordensServico }
          };
        }
      }
    }
    
    // 📅 AGENDAMENTOS
    if (msgLower.includes('agendar') || msgLower.includes('marcar')) {
      const horariosHoje = await agendamentosService.buscarHorariosHoje();
      const proximosHorarios = await agendamentosService.buscarProximosHorarios();
      
      return {
        conteudo: `📅 **Sistema de Agendamentos - Matias**

🕐 **Disponibilidade HOJE:**
${horariosHoje.horarios.length > 0 ? 
  `✅ ${horariosHoje.horarios.join(', ')}` : 
  '❌ Sem horários disponíveis hoje'}

📆 **Próximos horários disponíveis:**
${proximosHorarios.horariosDisponiveis.slice(0, 3).map(h => 
  `• ${h.data} - ${h.horarios.join(', ')}`
).join('\n')}

Para agendar, preciso de:
• Cliente (nome ou ID)
• Tipo de serviço
• Data/hora preferida`,
        acoes: [
          { tipo: 'agendamento_urgente', label: '🚨 Urgente (Hoje)' },
          { tipo: 'agendamento_normal', label: '📅 Normal (3 dias)' },
          { tipo: 'agendamento_programado', label: '🔧 Manutenção Programada' }
        ]
      };
    }
    
    // 📊 ESTATÍSTICAS
    if (msgLower.includes('status') || msgLower.includes('relatório') || msgLower.includes('estatística')) {
      const stats = await consultasOSService.consultarEstatisticas();
      const osAndamento = await consultasOSService.buscarOSEmAndamento();
      
      return {
        conteudo: `📊 **Relatório Operacional - Ofix**

**Status Atual:**
• 🟡 **${stats.estatisticas.osEmAndamento}** serviços em andamento
• 🔵 **${stats.estatisticas.osAbertas}** OS aguardando início  
• ✅ **${stats.estatisticas.osConcluidas}** serviços concluídos
• 🎯 **${stats.estatisticas.totalAtivo}** total ativo

${osAndamento.ordensServico.length > 0 ? `
🔧 **Serviços em Andamento:**
${osAndamento.ordensServico.slice(0, 3).map(os => 
  `• OS #${os.numero} - ${os.cliente} - ${os.veiculo}`
).join('\n')}` : ''}

*Dados atualizados em tempo real*`,
        dados: { estatisticas: stats.estatisticas, osAndamento }
      };
    }
    
    // Resposta padrão inteligente
    return {
      conteudo: `🤖 **Matias analisando:** "${mensagem}"

Como mecânico-chefe da Ofix, posso ajudar com:

📋 **Consultar OS:** "OS 123" ou "Ordem 456"
🔍 **Buscar Veículo:** "Placa ABC-1234"
📅 **Agendamentos:** "Quero agendar" ou "Marcar horário"
📊 **Relatórios:** "Status da oficina" ou "Estatísticas"
🆘 **Emergência:** "Problema urgente" ou "Preciso de ajuda"

*Seja mais específico para que eu possa ajudá-lo melhor!*`,
      acoes: [
        { tipo: 'exemplo_os', label: '📋 Exemplo: Consultar OS' },
        { tipo: 'exemplo_placa', label: '🔍 Exemplo: Buscar Placa' },
        { tipo: 'exemplo_agendar', label: '📅 Exemplo: Agendar' }
      ]
    };
  };

  // Funções auxiliares
  const extrairNumeroOS = (texto) => {
    const match = texto.match(/(?:os|ordem)\s*#?(\d+)/i);
    return match ? match[1] : null;
  };

  const extrairPlaca = (texto) => {
    const match = texto.match(/([a-z]{3}[-]?\d{4})/i);
    return match ? match[1].toUpperCase() : null;
  };

  const formatarStatus = (status) => {
    const statusMap = {
      'aberta': '🔵 Aberta',
      'em_andamento': '🟡 Em Andamento', 
      'aguardando_pecas': '⏳ Aguardando Peças',
      'concluida': '✅ Concluída',
      'cancelada': '❌ Cancelada'
    };
    return statusMap[status] || status;
  };

  const formatarData = (data) => {
    return new Date(data).toLocaleDateString('pt-BR');
  };

  // Executar ação específica
  const executarAcao = useCallback(async (acao) => {
    switch (acao.tipo) {
      case 'consultar_os':
        await enviarMensagem('Consultar OS');
        break;
      case 'agendar_servico':
        await enviarMensagem('Quero agendar um serviço');
        break;
      case 'buscar_veiculo':
        await enviarMensagem('Buscar veículo por placa');
        break;
      case 'estatisticas':
        await enviarMensagem('Status da oficina');
        break;
      default:
        console.log('Ação não implementada:', acao);
    }
  }, [enviarMensagem]);

  return {
    // Estado
    mensagens,
    carregando,
    conversaAtual,
    historicoConversas,
    estatisticas,
    
    // Ações
    enviarMensagem,
    executarAcao,
    inicializarMatias,
    
    // Dados do usuário
    usuario: user
  };
};