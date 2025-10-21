/**
 * 💬 MessageBubble Component
 * 
 * Bolha de mensagem individual com suporte a diferentes tipos
 */

import React from 'react';
import { User, Bot, AlertCircle, CheckCircle, HelpCircle } from 'lucide-react';
import { Button } from '../ui/button';

const MessageBubble = ({ conversa, onAbrirModal, onExecutarAcao }) => {
  const { tipo, conteudo, timestamp, metadata } = conversa;

  // Configuração de cores e ícones por tipo
  const tipoConfig = {
    usuario: {
      bg: 'bg-blue-600',
      text: 'text-white',
      icon: User,
      align: 'justify-end'
    },
    agente: {
      bg: 'bg-white border border-slate-200',
      text: 'text-slate-900',
      icon: Bot,
      align: 'justify-start'
    },
    sistema: {
      bg: 'bg-slate-100',
      text: 'text-slate-700',
      icon: Bot,
      align: 'justify-center'
    },
    erro: {
      bg: 'bg-red-50 border border-red-200',
      text: 'text-red-900',
      icon: AlertCircle,
      align: 'justify-start'
    },
    confirmacao: {
      bg: 'bg-green-50 border border-green-200',
      text: 'text-green-900',
      icon: CheckCircle,
      align: 'justify-start'
    },
    pergunta: {
      bg: 'bg-yellow-50 border border-yellow-200',
      text: 'text-yellow-900',
      icon: HelpCircle,
      align: 'justify-start'
    },
    cadastro: {
      bg: 'bg-purple-50 border border-purple-200',
      text: 'text-purple-900',
      icon: Bot,
      align: 'justify-start'
    }
  };

  const config = tipoConfig[tipo] || tipoConfig.agente;
  const Icon = config.icon;

  // Formatar timestamp
  const formatarHora = (timestamp) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  };

  // Renderizar botões de ação se houver
  const renderAcoes = () => {
    if (!metadata?.dadosExtraidos || tipo !== 'cadastro') return null;

    return (
      <div className="mt-3 pt-3 border-t border-slate-200">
        <Button
          size="sm"
          onClick={() => onAbrirModal?.(metadata.dadosExtraidos)}
          className="w-full"
        >
          📝 Cadastrar Cliente
        </Button>
      </div>
    );
  };

  return (
    <div className={`flex gap-3 ${config.align}`}>
      {/* Avatar (apenas para não-usuário) */}
      {tipo !== 'usuario' && (
        <div className={`w-8 h-8 rounded-full ${config.bg} flex items-center justify-center flex-shrink-0`}>
          <Icon className={`w-4 h-4 ${tipo === 'usuario' ? 'text-white' : 'text-slate-600'}`} />
        </div>
      )}

      {/* Conteúdo da Mensagem */}
      <div className={`max-w-[70%] ${tipo === 'sistema' ? 'max-w-full' : ''}`}>
        <div className={`rounded-2xl px-4 py-3 ${config.bg}`}>
          <p className={`text-sm whitespace-pre-wrap ${config.text}`}>
            {conteudo}
          </p>
          
          {renderAcoes()}
        </div>

        {/* Timestamp */}
        {timestamp && (
          <span className="text-xs text-slate-400 mt-1 block px-2">
            {formatarHora(timestamp)}
          </span>
        )}
      </div>

      {/* Avatar (apenas para usuário) */}
      {tipo === 'usuario' && (
        <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center flex-shrink-0">
          <User className="w-4 h-4 text-white" />
        </div>
      )}
    </div>
  );
};

export default React.memo(MessageBubble);
