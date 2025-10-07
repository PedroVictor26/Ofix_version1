-- DropForeignKey
ALTER TABLE "Cliente" DROP CONSTRAINT "Cliente_oficinaId_fkey";

-- DropForeignKey
ALTER TABLE "Financeiro" DROP CONSTRAINT "Financeiro_oficinaId_fkey";

-- DropForeignKey
ALTER TABLE "Fornecedor" DROP CONSTRAINT "Fornecedor_oficinaId_fkey";

-- DropForeignKey
ALTER TABLE "ItemServicoPeca" DROP CONSTRAINT "ItemServicoPeca_pecaId_fkey";

-- DropForeignKey
ALTER TABLE "ItemServicoPeca" DROP CONSTRAINT "ItemServicoPeca_servicoId_fkey";

-- DropForeignKey
ALTER TABLE "MensagemPadrao" DROP CONSTRAINT "MensagemPadrao_oficinaId_fkey";

-- DropForeignKey
ALTER TABLE "MensagemServico" DROP CONSTRAINT "MensagemServico_servicoId_fkey";

-- DropForeignKey
ALTER TABLE "Peca" DROP CONSTRAINT "Peca_fornecedorId_fkey";

-- DropForeignKey
ALTER TABLE "Peca" DROP CONSTRAINT "Peca_oficinaId_fkey";

-- DropForeignKey
ALTER TABLE "ProcedimentoPadrao" DROP CONSTRAINT "ProcedimentoPadrao_oficinaId_fkey";

-- DropForeignKey
ALTER TABLE "ProcedimentoPadraoServico" DROP CONSTRAINT "ProcedimentoPadraoServico_procedimentoPadraoId_fkey";

-- DropForeignKey
ALTER TABLE "ProcedimentoPadraoServico" DROP CONSTRAINT "ProcedimentoPadraoServico_servicoId_fkey";

-- DropForeignKey
ALTER TABLE "Servico" DROP CONSTRAINT "Servico_clienteId_fkey";

-- DropForeignKey
ALTER TABLE "Servico" DROP CONSTRAINT "Servico_oficinaId_fkey";

-- DropForeignKey
ALTER TABLE "Servico" DROP CONSTRAINT "Servico_responsavelId_fkey";

-- DropForeignKey
ALTER TABLE "Servico" DROP CONSTRAINT "Servico_veiculoId_fkey";

-- DropForeignKey
ALTER TABLE "User" DROP CONSTRAINT "User_oficinaId_fkey";

-- DropForeignKey
ALTER TABLE "Veiculo" DROP CONSTRAINT "Veiculo_clienteId_fkey";

-- DropForeignKey
ALTER TABLE "Veiculo" DROP CONSTRAINT "Veiculo_oficinaId_fkey";
