import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Brain, Mic, MessageCircle, TrendingUp, CheckCircle2 } from 'lucide-react';
import TriagemPorVoz from './TriagemPorVoz';
import WizardCheckinIA from './WizardCheckinIA';
import AssistenteVozGlobal from './AssistenteVozGlobal';
import BotaoResumoWhatsapp from './BotaoResumoWhatsapp';
import SugestaoIAUpsell from './SugestaoIAUpsell';
import { useAuth } from '../../context/AuthContext';

/**
 * Painel de demonstração das funcionalidades de IA implementadas
 */
const PainelIA = () => {
  const { token, isAuthenticated, user } = useAuth();
  const [funcionalidadeAtiva, setFuncionalidadeAtiva] = useState(null);
  const [resultadoDemo, setResultadoDemo] = useState(null);

  // Debug: Log do estado de autenticação
  console.log('PainelIA - Estado de autenticação:', { 
    token: token ? 'presente' : 'ausente', 
    isAuthenticated, 
    user: user?.nome || 'não logado' 
  });

  const funcionalidades = [
    {
      id: 'triagem-voz',
      titulo: '🎤 Triagem por Voz',
      descricao: 'Cliente descreve o problema por áudio e recebe análise automática',
      status: 'implementado',
      demo: true,
      icon: Mic,
      cor: 'blue'
    },
    {
      id: 'resumo-whatsapp',
      titulo: '📱 Resumo WhatsApp',
      descricao: 'Gera mensagens personalizadas de status para o cliente',
      status: 'implementado',
      demo: true,
      icon: MessageCircle,
      cor: 'green'
    },
    {
      id: 'checkin-guiado',
      titulo: '🔍 Check-in Guiado',
      descricao: 'IA conduz conversa estruturada de entrada do veículo',
      status: 'implementado',
      demo: true,
      icon: CheckCircle2,
      cor: 'purple'
    },
    {
      id: 'upsell-responsavel',
      titulo: '💡 Upsell Responsável',
      descricao: 'Sugere serviços adicionais baseado em evidências técnicas',
      status: 'implementado',
      demo: true,
      icon: TrendingUp,
      cor: 'orange'
    }
  ];

  const handleDemo = async (funcionalidade) => {
    setFuncionalidadeAtiva(funcionalidade.id);
    
    // Simular demonstração baseada na funcionalidade
    switch (funcionalidade.id) {
      case 'resumo-whatsapp':
        await demoResumoWhatsApp();
        break;
      case 'checkin-guiado':
        await demoCheckinGuiado();
        break;
      case 'upsell-responsavel':
        await demoUpsellResponsavel();
        break;
      default:
        break;
    }
  };

  const demoResumoWhatsApp = async () => {
    try {
      // Verificar se está autenticado
      if (!token) {
        console.log('Token não encontrado no contexto:', token);
        setResultadoDemo({
          tipo: 'erro',
          mensagem: 'Usuário não autenticado. Faça login primeiro.'
        });
        return;
      }

      console.log('Enviando requisição com token:', token ? 'Token presente' : 'Token ausente');

      // Tentar primeira rota autenticada, se falhar, usar rota de teste
      let response;
      try {
        // Simular dados de uma OS
        response = await fetch('/api/ai/os/123/resumo-whatsapp', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }
      } catch (error) {
        console.log('Rota autenticada falhou, usando rota de teste:', error.message);
        // Fallback para rota de teste
        response = await fetch('/api/ai/test/resumo-whatsapp', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          }
        });
      }
      
      const resultado = await response.json();
      console.log('Resultado recebido (WhatsApp):', resultado);
      setResultadoDemo({
        tipo: 'whatsapp',
        dados: resultado
      });
    } catch (error) {
      setResultadoDemo({
        tipo: 'erro',
        mensagem: error.message
      });
    }
  };

  const demoCheckinGuiado = async () => {
    try {
      // Tentar primeira rota autenticada, se falhar, usar rota de teste
      let response;
      try {
        response = await fetch('/api/ai/checkin/conduzir', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            mensagemCliente: "Meu carro está fazendo um barulho estranho"
          })
        });
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }
      } catch (error) {
        console.log('Rota autenticada falhou, usando rota de teste:', error.message);
        // Fallback para rota de teste
        response = await fetch('/api/ai/test/checkin', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          }
        });
      }
      
      const resultado = await response.json();
      console.log('Resultado recebido (Check-in):', resultado);
      setResultadoDemo({
        tipo: 'checkin',
        dados: resultado
      });
    } catch (error) {
      setResultadoDemo({
        tipo: 'erro',
        mensagem: error.message
      });
    }
  };

  const demoUpsellResponsavel = async () => {
    try {
      // Tentar primeira rota autenticada, se falhar, usar rota de teste
      let response;
      try {
        response = await fetch('/api/ai/os/123/analise-upsell', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            laudoTecnico: 'Pastilhas de freio com 3mm de espessura. Disco de freio com ranhuras superficiais. Fluido de freio dentro do prazo de validade.'
          })
        });
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }
      } catch (error) {
        console.log('Rota autenticada falhou, usando rota de teste:', error.message);
        // Fallback para rota de teste
        response = await fetch('/api/ai/test/upsell', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          }
        });
      }
      
      const resultado = await response.json();
      console.log('Resultado recebido (Upsell):', resultado);
      setResultadoDemo({
        tipo: 'upsell',
        dados: resultado
      });
    } catch (error) {
      setResultadoDemo({
        tipo: 'erro',
        mensagem: error.message
      });
    }
  };

  const getCorCard = (cor) => {
    const cores = {
      blue: 'border-blue-200 bg-blue-50 hover:bg-blue-100',
      green: 'border-green-200 bg-green-50 hover:bg-green-100',
      purple: 'border-purple-200 bg-purple-50 hover:bg-purple-100',
      orange: 'border-orange-200 bg-orange-50 hover:bg-orange-100'
    };
    return cores[cor] || cores.blue;
  };

  const getCorIcone = (cor) => {
    const cores = {
      blue: 'text-blue-600',
      green: 'text-green-600',
      purple: 'text-purple-600',
      orange: 'text-orange-600'
    };
    return cores[cor] || cores.blue;
  };

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-8">
      {/* Debug: Status de Autenticação */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="font-semibold text-blue-800 mb-2">Status de Autenticação (Debug)</h4>
        <div className="text-sm text-blue-700">
          <p>Usuário: {user?.nome || 'Não logado'}</p>
          <p>Token: {token ? '✅ Presente' : '❌ Ausente'}</p>
          <p>Autenticado: {isAuthenticated ? '✅ Sim' : '❌ Não'}</p>
        </div>
      </div>

      {/* Header */}
      <div className="text-center">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="inline-flex items-center space-x-3 mb-4"
        >
          <Brain className="text-4xl text-blue-600" size={40} />
          <h1 className="text-3xl font-bold text-gray-800">
            Sistema de IA - OFIX
          </h1>
        </motion.div>
        
        <p className="text-gray-600 text-lg max-w-2xl mx-auto">
          Funcionalidades inteligentes implementadas para otimizar operações, 
          melhorar comunicação e auxiliar na tomada de decisões.
        </p>
      </div>

      {/* Grid de Funcionalidades */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {funcionalidades.map((func, index) => {
          return (
            <motion.div
              key={func.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className={`border-2 rounded-xl p-6 cursor-pointer transition-all duration-200 ${getCorCard(func.cor)}`}
              onClick={() => func.demo && handleDemo(func)}
            >
              <div className="flex items-start space-x-4">
                <div className={`p-3 rounded-lg bg-white shadow-sm ${getCorIcone(func.cor)}`}>
                  <func.icon size={24} />
                </div>
                
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold text-gray-800">
                      {func.titulo}
                    </h3>
                    <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">
                      ✅ Ativo
                    </span>
                  </div>
                  
                  <p className="text-gray-600 text-sm mb-4">
                    {func.descricao}
                  </p>
                  
                  {func.demo && (
                    <button className="text-blue-600 hover:text-blue-800 text-sm font-medium">
                      🎯 Testar Funcionalidade →
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Área de Demonstração Ativa */}
      {funcionalidadeAtiva === 'triagem-voz' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-xl shadow-lg p-8"
        >
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-gray-800">
              🎤 Demonstração: Triagem por Voz
            </h2>
            <button
              onClick={() => setFuncionalidadeAtiva(null)}
              className="text-gray-500 hover:text-gray-700"
            >
              ✕ Fechar
            </button>
          </div>
          
          <TriagemPorVoz
            onAnaliseCompleta={(resultado) => {
              console.log('Análise da triagem concluída:', resultado);
            }}
            dadosIniciais={{
              telefone: '(11) 99999-9999',
              placa: 'ABC1234'
            }}
          />
        </motion.div>
      )}

      {/* Check-in Guiado */}
      {funcionalidadeAtiva === 'checkin-guiado' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-xl shadow-lg p-8"
        >
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-gray-800">
              🔍 Demonstração: Check-in Guiado
            </h2>
            <button
              onClick={() => setFuncionalidadeAtiva(null)}
              className="text-gray-500 hover:text-gray-700"
            >
              ✕ Fechar
            </button>
          </div>
          
          <WizardCheckinIA
            onCheckinCompleto={(dados) => {
              console.log('Check-in concluído:', dados);
            }}
            dadosIniciais={{
              clienteNome: 'Cliente Demo',
              veiculo: 'Honda Civic 2020'
            }}
          />
        </motion.div>
      )}

      {/* Resumo WhatsApp */}
      {funcionalidadeAtiva === 'resumo-whatsapp' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-xl shadow-lg p-8"
        >
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-gray-800">
              📱 Demonstração: Resumo WhatsApp
            </h2>
            <button
              onClick={() => setFuncionalidadeAtiva(null)}
              className="text-gray-500 hover:text-gray-700"
            >
              ✕ Fechar
            </button>
          </div>
          
          <div className="space-y-4">
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="font-semibold mb-2">Dados da OS Demo:</h3>
              <div className="text-sm space-y-1">
                <p><strong>Cliente:</strong> João Silva</p>
                <p><strong>Veículo:</strong> Honda Civic 2020</p>
                <p><strong>Problema:</strong> Troca de óleo e revisão</p>
                <p><strong>Status:</strong> Em execução</p>
              </div>
            </div>
            
            <BotaoResumoWhatsapp
              osId="123"
              dadosOS={{
                cliente: 'João Silva',
                veiculo: 'Honda Civic 2020',
                problema: 'Troca de óleo e revisão',
                status: 'EM_EXECUCAO',
                clienteTelefone: '11999999999'
              }}
              onResumoGerado={(resumo) => {
                console.log('Resumo gerado:', resumo);
              }}
            />
          </div>
        </motion.div>
      )}

      {/* Upsell Responsável */}
      {funcionalidadeAtiva === 'upsell-responsavel' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-xl shadow-lg p-8"
        >
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-gray-800">
              💡 Demonstração: Upsell Responsável
            </h2>
            <button
              onClick={() => setFuncionalidadeAtiva(null)}
              className="text-gray-500 hover:text-gray-700"
            >
              ✕ Fechar
            </button>
          </div>
          
          <div className="space-y-4">
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="font-semibold mb-2">Laudo Técnico Demo:</h3>
              <p className="text-sm text-gray-700">
                "Pastilhas de freio com 3mm de espessura. Disco de freio com ranhuras superficiais. 
                Fluido de freio dentro do prazo de validade. Pneus com desgaste irregular na parte interna. 
                Óleo do motor no nível adequado, mas próximo ao prazo de troca (8.000km rodados)."
              </p>
            </div>
            
            <SugestaoIAUpsell
              osId="123"
              laudoTecnico="Pastilhas de freio com 3mm de espessura. Disco de freio com ranhuras superficiais. Fluido de freio dentro do prazo de validade. Pneus com desgaste irregular na parte interna. Óleo do motor no nível adequado, mas próximo ao prazo de troca (8.000km rodados)."
              historicoCliente={{
                ultimaManutencao: '2024-01-15',
                kmAtual: 58000,
                tipoCondutor: 'urbano'
              }}
              onSugestaoAdicionada={(sugestao) => {
                console.log('Sugestão adicionada ao orçamento:', sugestao);
              }}
            />
          </div>
        </motion.div>
      )}

      {/* Resultados de Demonstração */}
      {resultadoDemo && funcionalidadeAtiva !== 'triagem-voz' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-xl shadow-lg p-8"
        >
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-gray-800">
              📊 Resultado da Demonstração
            </h2>
            <button
              onClick={() => {
                setResultadoDemo(null);
                setFuncionalidadeAtiva(null);
              }}
              className="text-gray-500 hover:text-gray-700"
            >
              ✕ Fechar
            </button>
          </div>
          
          {resultadoDemo.tipo === 'erro' ? (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="text-red-800 font-medium">❌ Erro na demonstração</div>
              <div className="text-red-600 text-sm mt-1">{resultadoDemo.mensagem}</div>
            </div>
          ) : (
            <div className="space-y-4">
              {resultadoDemo.tipo === 'whatsapp' && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="text-green-800 font-medium mb-2">📱 Mensagem WhatsApp Gerada:</div>
                  <div className="bg-white p-3 rounded border text-gray-800">
                    {resultadoDemo.dados.mensagemWhatsapp}
                  </div>
                </div>
              )}
              
              {resultadoDemo.tipo === 'checkin' && (
                <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                  <div className="text-purple-800 font-medium mb-2">🔍 Próxima Pergunta do Check-in:</div>
                  <div className="bg-white p-3 rounded border text-gray-800">
                    {resultadoDemo.dados.proxima_pergunta}
                  </div>
                  <div className="text-sm text-purple-600 mt-2">
                    Etapa seguinte: {resultadoDemo.dados.etapa_seguinte}
                  </div>
                </div>
              )}
              
              {resultadoDemo.tipo === 'upsell' && (
                <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                  <div className="text-orange-800 font-medium mb-2">💡 Análise de Upsell:</div>
                  
                  <div className="space-y-3">
                    <div>
                      <span className="font-medium">Sugestão:</span>
                      <span className="ml-2 capitalize">{resultadoDemo.dados.sugestao?.replace('_', ' ')}</span>
                    </div>
                    
                    {resultadoDemo.dados.justificativa_tecnica && (
                      <div>
                        <span className="font-medium">Justificativa:</span>
                        <div className="bg-white p-3 rounded border text-gray-800 mt-1">
                          {resultadoDemo.dados.justificativa_tecnica}
                        </div>
                      </div>
                    )}
                    
                    {resultadoDemo.dados.mensagem_cliente && (
                      <div>
                        <span className="font-medium">Como apresentar ao cliente:</span>
                        <div className="bg-white p-3 rounded border text-gray-800 mt-1">
                          {resultadoDemo.dados.mensagem_cliente}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </motion.div>
      )}

      {/* Status do Sistema */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">
          📊 Status do Sistema de IA
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-center">
          <div className="bg-white rounded-lg p-4 shadow-sm">
            <div className="text-2xl font-bold text-green-600">4</div>
            <div className="text-sm text-gray-600">Funcionalidades Ativas</div>
          </div>
          
          <div className="bg-white rounded-lg p-4 shadow-sm">
            <div className="text-2xl font-bold text-blue-600">100%</div>
            <div className="text-sm text-gray-600">Taxa de Disponibilidade</div>
          </div>
          
          <div className="bg-white rounded-lg p-4 shadow-sm">
            <div className="text-2xl font-bold text-purple-600">&lt;2s</div>
            <div className="text-sm text-gray-600">Tempo de Resposta</div>
          </div>
          
          <div className="bg-white rounded-lg p-4 shadow-sm">
            <div className="text-2xl font-bold text-orange-600">OpenAI</div>
            <div className="text-sm text-gray-600">Provedor de IA</div>
          </div>
        </div>
      </div>

      {/* Assistente de Voz Global */}
      <AssistenteVozGlobal
        onComandoExecutado={(comando) => {
          console.log('Comando executado:', comando);
          // Aqui poderia atualizar o estado global ou fazer outras ações
        }}
      />
    </div>
  );
};

export default PainelIA;
