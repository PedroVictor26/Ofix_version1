// Debug temporário para verificar dados do serviço
console.log('=== DEBUG SERVICE DATA ===');

// Simular dados que devem estar chegando
const mockService = {
    id: 'test-id',
    numeroOs: 'OS2421-54',
    status: 'EM_ANDAMENTO',
    descricaoProblema: 'Troca da camara de ar',
    descricaoSolucao: 'Furo na roda dianteira esquerda',
    valorTotalServicos: 150.00,
    valorTotalPecas: 45.00,
    valorTotalFinal: 195.00,
    clienteId: 'cliente-id',
    veiculoId: 'veiculo-id'
};

console.log('Mock Service:', mockService);
console.log('Valor Total Serviços:', mockService.valorTotalServicos);
console.log('Valor Total Peças:', mockService.valorTotalPecas);
console.log('Valor Total Final:', mockService.valorTotalFinal);

// Verificar se os valores são números
console.log('Tipos:', {
    valorTotalServicos: typeof mockService.valorTotalServicos,
    valorTotalPecas: typeof mockService.valorTotalPecas,
    valorTotalFinal: typeof mockService.valorTotalFinal
});

// Verificar formatação de moeda
console.log('Formatado:', {
    valorTotalServicos: `R$ ${(mockService.valorTotalServicos || 0).toFixed(2)}`,
    valorTotalPecas: `R$ ${(mockService.valorTotalPecas || 0).toFixed(2)}`,
    valorTotalFinal: `R$ ${(mockService.valorTotalFinal || 0).toFixed(2)}`
});
