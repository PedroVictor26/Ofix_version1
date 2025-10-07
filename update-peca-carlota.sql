-- Script para atualizar a peça Carlota de Corolla com valores reais
UPDATE "Peca" 
SET 
  "precoVenda" = '890',
  "precoCusto" = '500', 
  "estoqueAtual" = 10,
  "estoqueMinimo" = 2
WHERE "nome" = 'Carlota de Corolla' 
  AND "codigoFabricante" = 'FO-123';

-- Verificar a atualização
SELECT "nome", "precoVenda", "precoCusto", "estoqueAtual", "estoqueMinimo" 
FROM "Peca" 
WHERE "nome" = 'Carlota de Corolla';
