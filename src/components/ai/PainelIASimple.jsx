import React from 'react';
import { Brain } from 'lucide-react';

/**
 * Versão simplificada do Painel de IA para debug
 */
const PainelIASimple = () => {
  return (
    <div className="max-w-6xl mx-auto p-6 space-y-8">
      {/* Header */}
      <div className="text-center">
        <div className="inline-flex items-center space-x-3 mb-4">
          <Brain className="text-4xl text-blue-600" size={40} />
          <h1 className="text-3xl font-bold text-gray-800">
            Sistema de IA - OFIX (Versão Simples)
          </h1>
        </div>
        
        <p className="text-gray-600 text-lg max-w-2xl mx-auto">
          Painel de IA funcionando corretamente!
        </p>
      </div>

      {/* Status do Sistema */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">
          📊 Status do Sistema de IA
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-center">
          <div className="bg-white rounded-lg p-4 shadow-sm">
            <div className="text-2xl font-bold text-green-600">✅</div>
            <div className="text-sm text-gray-600">Sistema Funcionando</div>
          </div>
          
          <div className="bg-white rounded-lg p-4 shadow-sm">
            <div className="text-2xl font-bold text-blue-600">React</div>
            <div className="text-sm text-gray-600">Frontend OK</div>
          </div>
          
          <div className="bg-white rounded-lg p-4 shadow-sm">
            <div className="text-2xl font-bold text-purple-600">Tailwind</div>
            <div className="text-sm text-gray-600">Estilos OK</div>
          </div>
          
          <div className="bg-white rounded-lg p-4 shadow-sm">
            <div className="text-2xl font-bold text-orange-600">Lucide</div>
            <div className="text-sm text-gray-600">Ícones OK</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PainelIASimple;