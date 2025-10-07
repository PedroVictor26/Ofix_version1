-- CreateTable
CREATE TABLE "Financeiro" (
    "id" TEXT NOT NULL,
    "descricao" TEXT NOT NULL,
    "valor" DECIMAL(65,30) NOT NULL,
    "tipo" TEXT NOT NULL,
    "categoria" TEXT,
    "data" TIMESTAMP(3) NOT NULL,
    "servicoId" TEXT,
    "oficinaId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Financeiro_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Financeiro" ADD CONSTRAINT "Financeiro_oficinaId_fkey" FOREIGN KEY ("oficinaId") REFERENCES "Oficina"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
