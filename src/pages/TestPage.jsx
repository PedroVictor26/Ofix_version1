import React from 'react';

const TestPage = () => {
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold text-gray-800 mb-4">
        Página de Teste
      </h1>
      <p className="text-gray-600">
        Se você está vendo esta página, o React está funcionando corretamente!
      </p>
      <div className="mt-4 p-4 bg-green-100 border border-green-300 rounded">
        <p className="text-green-800">✅ Sistema funcionando!</p>
      </div>
    </div>
  );
};

export default TestPage;