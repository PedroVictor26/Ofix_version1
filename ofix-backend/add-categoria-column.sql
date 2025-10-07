-- Adicionar coluna categoria à tabela ProcedimentoPadrao
ALTER TABLE "ProcedimentoPadrao" 
ADD COLUMN IF NOT EXISTS "categoria" TEXT DEFAULT 'manutencao_preventiva';

-- Atualizar registros existentes para ter a categoria padrão
UPDATE "ProcedimentoPadrao" 
SET "categoria" = 'manutencao_preventiva' 
WHERE "categoria" IS NULL;