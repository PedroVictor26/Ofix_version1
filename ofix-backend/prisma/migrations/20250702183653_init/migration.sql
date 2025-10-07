-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('ADMIN', 'USER');

-- CreateEnum
CREATE TYPE "ServiceStatus" AS ENUM ('AGUARDANDO', 'EM_ANDAMENTO', 'AGUARDANDO_PECAS', 'AGUARDANDO_APROVACAO', 'FINALIZADO', 'CANCELADO');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "role" "UserRole" NOT NULL DEFAULT 'ADMIN',
    "oficinaId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Oficina" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "cnpj" TEXT,
    "telefone" TEXT,
    "endereco" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Oficina_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Cliente" (
    "id" TEXT NOT NULL,
    "nomeCompleto" TEXT NOT NULL,
    "cpfCnpj" TEXT,
    "telefone" TEXT,
    "email" TEXT,
    "endereco" TEXT,
    "oficinaId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Cliente_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Veiculo" (
    "id" TEXT NOT NULL,
    "placa" TEXT NOT NULL,
    "marca" TEXT NOT NULL,
    "modelo" TEXT NOT NULL,
    "anoFabricacao" INTEGER,
    "anoModelo" INTEGER,
    "cor" TEXT,
    "chassi" TEXT,
    "kmAtual" INTEGER,
    "clienteId" TEXT NOT NULL,
    "oficinaId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Veiculo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Servico" (
    "id" TEXT NOT NULL,
    "numeroOs" TEXT NOT NULL,
    "status" "ServiceStatus" NOT NULL DEFAULT 'AGUARDANDO',
    "descricaoProblema" TEXT,
    "descricaoSolucao" TEXT,
    "dataEntrada" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dataPrevisaoEntrega" TIMESTAMP(3),
    "dataConclusao" TIMESTAMP(3),
    "dataEntregaCliente" TIMESTAMP(3),
    "valorTotalEstimado" DECIMAL(65,30),
    "valorTotalServicos" DECIMAL(65,30),
    "valorTotalPecas" DECIMAL(65,30),
    "valorTotalFinal" DECIMAL(65,30),
    "kmEntrada" INTEGER,
    "checklist" JSONB,
    "observacoes" TEXT,
    "clienteId" TEXT NOT NULL,
    "veiculoId" TEXT NOT NULL,
    "responsavelId" TEXT,
    "oficinaId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Servico_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Peca" (
    "id" TEXT NOT NULL,
    "codigoInterno" TEXT,
    "codigoFabricante" TEXT,
    "nome" TEXT NOT NULL,
    "descricao" TEXT,
    "fabricante" TEXT,
    "unidadeMedida" TEXT NOT NULL DEFAULT 'UN',
    "precoCusto" DECIMAL(65,30),
    "precoVenda" DECIMAL(65,30) NOT NULL,
    "estoqueAtual" INTEGER NOT NULL DEFAULT 0,
    "estoqueMinimo" INTEGER DEFAULT 0,
    "localizacao" TEXT,
    "oficinaId" TEXT NOT NULL,
    "fornecedorId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Peca_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Fornecedor" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "cnpjCpf" TEXT,
    "telefone" TEXT,
    "email" TEXT,
    "endereco" TEXT,
    "oficinaId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Fornecedor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ItemServicoPeca" (
    "id" TEXT NOT NULL,
    "servicoId" TEXT NOT NULL,
    "pecaId" TEXT NOT NULL,
    "quantidade" INTEGER NOT NULL,
    "precoUnitarioCobrado" DECIMAL(65,30) NOT NULL,
    "valorTotal" DECIMAL(65,30) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ItemServicoPeca_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProcedimentoPadrao" (
    "id" TEXT NOT NULL,
    "codigo" TEXT,
    "nome" TEXT NOT NULL,
    "descricao" TEXT,
    "tempoEstimadoHoras" DECIMAL(65,30),
    "checklistJson" JSONB,
    "oficinaId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProcedimentoPadrao_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProcedimentoPadraoServico" (
    "id" TEXT NOT NULL,
    "servicoId" TEXT NOT NULL,
    "procedimentoPadraoId" TEXT NOT NULL,
    "observacoes" TEXT,
    "concluido" BOOLEAN NOT NULL DEFAULT false,
    "dataConclusao" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProcedimentoPadraoServico_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MensagemPadrao" (
    "id" TEXT NOT NULL,
    "codigo" TEXT,
    "nome" TEXT NOT NULL,
    "template" TEXT NOT NULL,
    "oficinaId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MensagemPadrao_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MensagemServico" (
    "id" TEXT NOT NULL,
    "servicoId" TEXT NOT NULL,
    "conteudo" TEXT NOT NULL,
    "tipoEnvio" TEXT NOT NULL,
    "dataEnvio" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "enviadoPor" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MensagemServico_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Oficina_cnpj_key" ON "Oficina"("cnpj");

-- CreateIndex
CREATE UNIQUE INDEX "Cliente_cpfCnpj_key" ON "Cliente"("cpfCnpj");

-- CreateIndex
CREATE UNIQUE INDEX "Cliente_email_key" ON "Cliente"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Veiculo_placa_key" ON "Veiculo"("placa");

-- CreateIndex
CREATE UNIQUE INDEX "Veiculo_chassi_key" ON "Veiculo"("chassi");

-- CreateIndex
CREATE UNIQUE INDEX "Servico_numeroOs_key" ON "Servico"("numeroOs");

-- CreateIndex
CREATE UNIQUE INDEX "Peca_codigoInterno_key" ON "Peca"("codigoInterno");

-- CreateIndex
CREATE UNIQUE INDEX "Fornecedor_cnpjCpf_key" ON "Fornecedor"("cnpjCpf");

-- CreateIndex
CREATE UNIQUE INDEX "Fornecedor_email_key" ON "Fornecedor"("email");

-- CreateIndex
CREATE UNIQUE INDEX "ItemServicoPeca_servicoId_pecaId_key" ON "ItemServicoPeca"("servicoId", "pecaId");

-- CreateIndex
CREATE UNIQUE INDEX "ProcedimentoPadrao_codigo_key" ON "ProcedimentoPadrao"("codigo");

-- CreateIndex
CREATE UNIQUE INDEX "ProcedimentoPadraoServico_servicoId_procedimentoPadraoId_key" ON "ProcedimentoPadraoServico"("servicoId", "procedimentoPadraoId");

-- CreateIndex
CREATE UNIQUE INDEX "MensagemPadrao_codigo_key" ON "MensagemPadrao"("codigo");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_oficinaId_fkey" FOREIGN KEY ("oficinaId") REFERENCES "Oficina"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Cliente" ADD CONSTRAINT "Cliente_oficinaId_fkey" FOREIGN KEY ("oficinaId") REFERENCES "Oficina"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Veiculo" ADD CONSTRAINT "Veiculo_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "Cliente"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Veiculo" ADD CONSTRAINT "Veiculo_oficinaId_fkey" FOREIGN KEY ("oficinaId") REFERENCES "Oficina"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Servico" ADD CONSTRAINT "Servico_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "Cliente"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Servico" ADD CONSTRAINT "Servico_veiculoId_fkey" FOREIGN KEY ("veiculoId") REFERENCES "Veiculo"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Servico" ADD CONSTRAINT "Servico_responsavelId_fkey" FOREIGN KEY ("responsavelId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Servico" ADD CONSTRAINT "Servico_oficinaId_fkey" FOREIGN KEY ("oficinaId") REFERENCES "Oficina"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Peca" ADD CONSTRAINT "Peca_oficinaId_fkey" FOREIGN KEY ("oficinaId") REFERENCES "Oficina"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Peca" ADD CONSTRAINT "Peca_fornecedorId_fkey" FOREIGN KEY ("fornecedorId") REFERENCES "Fornecedor"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Fornecedor" ADD CONSTRAINT "Fornecedor_oficinaId_fkey" FOREIGN KEY ("oficinaId") REFERENCES "Oficina"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ItemServicoPeca" ADD CONSTRAINT "ItemServicoPeca_servicoId_fkey" FOREIGN KEY ("servicoId") REFERENCES "Servico"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ItemServicoPeca" ADD CONSTRAINT "ItemServicoPeca_pecaId_fkey" FOREIGN KEY ("pecaId") REFERENCES "Peca"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProcedimentoPadrao" ADD CONSTRAINT "ProcedimentoPadrao_oficinaId_fkey" FOREIGN KEY ("oficinaId") REFERENCES "Oficina"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProcedimentoPadraoServico" ADD CONSTRAINT "ProcedimentoPadraoServico_servicoId_fkey" FOREIGN KEY ("servicoId") REFERENCES "Servico"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProcedimentoPadraoServico" ADD CONSTRAINT "ProcedimentoPadraoServico_procedimentoPadraoId_fkey" FOREIGN KEY ("procedimentoPadraoId") REFERENCES "ProcedimentoPadrao"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MensagemPadrao" ADD CONSTRAINT "MensagemPadrao_oficinaId_fkey" FOREIGN KEY ("oficinaId") REFERENCES "Oficina"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MensagemServico" ADD CONSTRAINT "MensagemServico_servicoId_fkey" FOREIGN KEY ("servicoId") REFERENCES "Servico"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
