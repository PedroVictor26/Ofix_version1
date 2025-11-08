import React, { useState } from 'react';
import { ArrowRight, CheckCircle, XCircle, Clock, Zap, Brain, Database } from 'lucide-react';

const scenarios = [
  {
    id: 1,
    tipo: 'Agendamento',
    mensagem: 'Agendar revisão segunda 14h para João',
    antes: {
      fluxo: ['Frontend', 'Backend', 'Agno AI', 'LLM processa', 'Tenta extrair JSON', 'Backend valida', 'Se erro → volta', 'Cria agendamento'],
      tempo: '4-6s',
      sucesso: '70%',
      chamadas_agno: 1,
      cor: 'red'
    },
    depois: {
      fluxo: ['Frontend', 'Backend', 'Classifier: AGENDAMENTO', 'NLP Local extrai', 'Valida', 'Cria agendamento'],
      tempo: '500ms',
      sucesso: '95%',
      chamadas_agno: 0,
      cor: 'green'
    }
  },
  {
    id: 2,
    tipo: 'Diagnóstico',
    mensagem: 'Meu carro está fazendo barulho no motor',
    antes: {
      fluxo: ['Frontend', 'Backend', 'Agno AI', 'LLM + Knowledge Base', 'Resposta técnica'],
      tempo: '3-5s',
      sucesso: '90%',
      chamadas_agno: 1,
      cor: 'green'
    },
    depois: {
      fluxo: ['Frontend', 'Backend', 'Classifier: CONVERSA', 'Agno AI', 'LLM + Knowledge Base', 'Resposta técnica'],
      tempo: '3-5s',
      sucesso: '90%',
      chamadas_agno: 1,
      cor: 'green'
    }
  },
  {
    id: 3,
    tipo: 'Consulta OS',
    mensagem: 'Status da OS 1234',
    antes: {
      fluxo: ['Frontend', 'Backend', 'NLP Local detecta', 'Consulta banco', 'Responde'],
      tempo: '300ms',
      sucesso: '95%',
      chamadas_agno: 0,
      cor: 'green'
    },
    depois: {
      fluxo: ['Frontend', 'Backend', 'Classifier: CONSULTA_OS', 'Consulta banco', 'Responde'],
      tempo: '300ms',
      sucesso: '95%',
      chamadas_agno: 0,
      cor: 'green'
    }
  },
  {
    id: 4,
    tipo: 'Orçamento',
    mensagem: 'Quanto custa trocar pastilhas de freio?',
    antes: {
      fluxo: ['Frontend', 'Backend', 'Agno AI', 'LLM calcula', 'Responde com faixa'],
      tempo: '3-4s',
      sucesso: '85%',
      chamadas_agno: 1,
      cor: 'yellow'
    },
    depois: {
      fluxo: ['Frontend', 'Backend', 'Classifier: ORCAMENTO', 'Agno AI', 'LLM + KB', 'Responde'],
      tempo: '3-4s',
      sucesso: '85%',
      chamadas_agno: 1,
      cor: 'green'
    }
  }
];

function FlowStep({ step, index, total }) {
  return (
    <div className="flex items-center">
      <div className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm font-medium whitespace-nowrap">
        {step}
      </div>
      {index < total - 1 && (
        <ArrowRight className="mx-2 text-gray-400" size={16} />
      )}
    </div>
  );
}

function ScenarioCard({ scenario, view }) {
  const data = view === 'antes' ? scenario.antes : scenario.depois;
  const isImproved = view === 'depois' && (
    parseFloat(data.tempo) < parseFloat(scenario.antes.tempo) ||
    parseFloat(data.sucesso) > parseFloat(scenario.antes.sucesso)
  );

  return (
    <div className={`bg-white rounded-lg shadow-md p-6 border-2 ${
      isImproved ? 'border-green-500' : 'border-gray-200'
    }`}>
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-lg font-bold text-gray-900">{scenario.tipo}</h3>
          <p className="text-sm text-gray-600 mt-1 italic">"{scenario.mensagem}"</p>
        </div>
        {isImproved && (
          <div className="bg-green-100 text-green-700 px-2 py-1 rounded text-xs font-bold">
            MELHORADO
          </div>
        )}
      </div>

      {/* Fluxo */}
      <div className="mb-4">
        <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Fluxo:</p>
        <div className="flex flex-wrap gap-2">
          {data.fluxo.map((step, idx) => (
            <FlowStep key={idx} step={step} index={idx} total={data.fluxo.length} />
          ))}
        </div>
      </div>

      {/* Métricas */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-gray-50 rounded p-3">
          <div className="flex items-center gap-2 mb-1">
            <Clock size={16} className="text-blue-600" />
            <p className="text-xs font-semibold text-gray-600">Tempo</p>
          </div>
          <p className="text-lg font-bold text-gray-900">{data.tempo}</p>
        </div>

        <div className="bg-gray-50 rounded p-3">
          <div className="flex items-center gap-2 mb-1">
            <CheckCircle size={16} className="text-green-600" />
            <p className="text-xs font-semibold text-gray-600">Sucesso</p>
          </div>
          <p className="text-lg font-bold text-gray-900">{data.sucesso}</p>
        </div>

        <div className="bg-gray-50 rounded p-3">
          <div className="flex items-center gap-2 mb-1">
            <Brain size={16} className="text-purple-600" />
            <p className="text-xs font-semibold text-gray-600">Agno</p>
          </div>
          <p className="text-lg font-bold text-gray-900">{data.chamadas_agno}x</p>
        </div>
      </div>
    </div>
  );
}

export default function VisualComparison() {
  const [view, setView] = useState('depois');

  const calcularMelhorias = () => {
    let tempoTotal = { antes: 0, depois: 0 };
    let chamadasAgno = { antes: 0, depois: 0 };

    scenarios.forEach(s => {
      tempoTotal.antes += parseFloat(s.antes.tempo);
      tempoTotal.depois += parseFloat(s.depois.tempo);
      chamadasAgno.antes += s.antes.chamadas_agno;
      chamadasAgno.depois += s.depois.chamadas_agno;
    });

    return {
      tempoEconomizado: ((tempoTotal.antes - tempoTotal.depois) / tempoTotal.antes * 100).toFixed(0),
      chamadasReduzidas: chamadasAgno.antes - chamadasAgno.depois,
      percentualReducao: ((chamadasAgno.antes - chamadasAgno.depois) / chamadasAgno.antes * 100).toFixed(0)
    };
  };

  const melhorias = calcularMelhorias();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            🔄 Comparação: Arquitetura Antiga vs Nova
          </h1>
          <p className="text-gray-600">
            Veja o impacto da separação Backend Local vs Agno AI
          </p>
        </div>

        {/* Toggle */}
        <div className="flex justify-center gap-4 mb-8">
          <button
            onClick={() => setView('antes')}
            className={`px-6 py-3 rounded-lg font-semibold transition-all ${
              view === 'antes'
                ? 'bg-red-600 text-white shadow-lg scale-105'
                : 'bg-white text-gray-600 hover:bg-gray-100'
            }`}
          >
            ❌ Antes (Problemático)
          </button>
          <button
            onClick={() => setView('depois')}
            className={`px-6 py-3 rounded-lg font-semibold transition-all ${
              view === 'depois'
                ? 'bg-green-600 text-white shadow-lg scale-105'
                : 'bg-white text-gray-600 hover:bg-gray-100'
            }`}
          >
            ✅ Depois (Otimizado)
          </button>
        </div>

        {/* Resumo de Melhorias */}
        {view === 'depois' && (
          <div className="bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl shadow-xl p-6 mb-8 text-white">
            <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
              <Zap className="text-yellow-300" />
              Ganhos com a Nova Arquitetura
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white/20 backdrop-blur rounded-lg p-4">
                <p className="text-sm opacity-90 mb-1">Tempo Economizado</p>
                <p className="text-4xl font-bold">{melhorias.tempoEconomizado}%</p>
                <p className="text-xs opacity-75 mt-1">Ações estruturadas 10x mais rápidas</p>
              </div>
              <div className="bg-white/20 backdrop-blur rounded-lg p-4">
                <p className="text-sm opacity-90 mb-1">Chamadas Agno Reduzidas</p>
                <p className="text-4xl font-bold">-{melhorias.percentualReducao}%</p>
                <p className="text-xs opacity-75 mt-1">Menor custo operacional</p>
              </div>
              <div className="bg-white/20 backdrop-blur rounded-lg p-4">
                <p className="text-sm opacity-90 mb-1">Confiabilidade</p>
                <p className="text-4xl font-bold">95%+</p>
                <p className="text-xs opacity-75 mt-1">Taxa de sucesso consistente</p>
              </div>
            </div>
          </div>
        )}

        {/* Cenários */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {scenarios.map(scenario => (
            <ScenarioCard key={scenario.id} scenario={scenario} view={view} />
          ))}
        </div>

        {/* Legenda */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4">📖 Legenda</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-start gap-3">
              <Database className="text-blue-600 mt-1" size={20} />
              <div>
                <p className="font-semibold text-gray-900">Backend Local</p>
                <p className="text-sm text-gray-600">
                  Processa ações estruturadas (CRUD). Rápido e confiável.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Brain className="text-purple-600 mt-1" size={20} />
              <div>
                <p className="font-semibold text-gray-900">Agno AI</p>
                <p className="text-sm text-gray-600">
                  Processa conversas complexas. Inteligente mas mais lento.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Zap className="text-yellow-600 mt-1" size={20} />
              <div>
                <p className="font-semibold text-gray-900">NLP Local</p>
                <p className="text-sm text-gray-600">
                  Extração de entidades com regex. Instantâneo.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle className="text-green-600 mt-1" size={20} />
              <div>
                <p className="font-semibold text-gray-900">Taxa de Sucesso</p>
                <p className="text-sm text-gray-600">
                  Percentual de requisições processadas com sucesso.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Recomendações */}
        <div className="mt-8 bg-blue-50 border-2 border-blue-200 rounded-lg p-6">
          <h3 className="text-lg font-bold text-blue-900 mb-3">
            💡 Regra de Ouro
          </h3>
          <div className="space-y-2 text-sm text-blue-800">
            <p className="flex items-start gap-2">
              <span className="font-bold mt-1">✅</span>
              <span><strong>Use Backend Local</strong> para: Formulários, CRUD, validações, consultas diretas</span>
            </p>
            <p className="flex items-start gap-2">
              <span className="font-bold mt-1">✅</span>
              <span><strong>Use Agno AI</strong> para: Diagnósticos, explicações, recomendações, dúvidas abertas</span>
            </p>
            <p className="flex items-start gap-2">
              <span className="font-bold mt-1">🎯</span>
              <span><strong>Resultado</strong>: Sistema mais rápido, confiável e fácil de manter</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
