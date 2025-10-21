/**
 * 🎨 ChatHeader Component
 * 
 * Header do chat com status de conexão e botões de ação
 */

import React from 'react';
import { Bot, CheckCircle, Loader2, AlertCircle, Volume2, VolumeX, Trash2, Settings } from 'lucide-react';
import { Button } from '../ui/button';

const ChatHeader = ({
  statusConexao = 'desconectado',
  vozHabilitada = true,
  falando = false,
  onToggleVoz,
  onPararFala,
  onLimparHistorico,
  onToggleConfig,
  onReconectar
}) => {
  const getStatusIcon = () => {
    switch (statusConexao) {
      case 'conectado':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'conectando':
        return <Loader2 className="w-4 h-4 text-yellow-500 animate-spin" />;
      case 'erro':
        return <AlertCircle className="w-4 h-4 text-red-500" />;
      default:
        return <AlertCircle className="w-4 h-4 text-gray-400" />;
    }
  };

  const getStatusText = () => {
    switch (statusConexao) {
      case 'conectado':
        return 'Agente Online';
      case 'conectando':
        return 'Conectando...';
      case 'erro':
        return 'Erro de Conexão';
      default:
        return 'Desconectado';
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200/60 p-4 mb-4">
      <div className="flex items-center justify-between">
        {/* Logo e Título */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
            <Bot className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900">Assistente IA OFIX</h1>
            <p className="text-sm text-slate-600">Powered by Agno AI Agent</p>
          </div>
        </div>

        {/* Status e Ações */}
        <div className="flex items-center gap-4">
          {/* Status da Conexão */}
          <div className="flex items-center gap-2 px-3 py-2 bg-slate-50 rounded-lg">
            {getStatusIcon()}
            <span className="text-sm font-medium text-slate-700">
              {getStatusText()}
            </span>
          </div>

          {/* Botões de Ação */}
          <div className="flex items-center gap-2">
            {/* Toggle Voz */}
            <Button
              variant="outline"
              size="sm"
              onClick={onToggleVoz}
              className={`flex items-center gap-2 ${
                vozHabilitada 
                  ? 'text-green-600 hover:bg-green-50' 
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
              title={vozHabilitada ? 'Desativar voz' : 'Ativar voz'}
            >
              {vozHabilitada ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </Button>

            {/* Parar Fala */}
            {falando && (
              <Button
                variant="outline"
                size="sm"
                onClick={onPararFala}
                className="text-red-600 hover:bg-red-50"
                title="Parar fala"
              >
                <VolumeX className="w-4 h-4" />
              </Button>
            )}

            {/* Limpar Histórico */}
            <Button
              variant="outline"
              size="sm"
              onClick={onLimparHistorico}
              className="flex items-center gap-2 text-red-600 hover:bg-red-50"
              title="Limpar histórico"
            >
              <Trash2 className="w-4 h-4" />
            </Button>

            {/* Configurações */}
            <Button
              variant="outline"
              size="sm"
              onClick={onToggleConfig}
              className="flex items-center gap-2"
              title="Configurações de voz"
            >
              <Settings className="w-4 h-4" />
            </Button>

            {/* Reconectar */}
            <Button
              variant="outline"
              size="sm"
              onClick={onReconectar}
              disabled={statusConexao === 'conectando'}
              className="flex items-center gap-2"
            >
              <Settings className="w-4 h-4" />
              Reconectar
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatHeader;
