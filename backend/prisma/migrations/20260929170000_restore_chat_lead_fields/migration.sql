-- Restaura campos usados pelo chat do site e mantém compatibilidade com o modelo atual.
-- Migration aditiva: não remove colunas nem dados existentes.

ALTER TABLE "conversations"
  ADD COLUMN IF NOT EXISTS "visitorName" TEXT,
  ADD COLUMN IF NOT EXISTS "visitorPhone" TEXT,
  ADD COLUMN IF NOT EXISTS "visitorEmail" TEXT;

ALTER TABLE "messages"
  ADD COLUMN IF NOT EXISTS "senderType" TEXT,
  ADD COLUMN IF NOT EXISTS "senderName" TEXT;

-- Mantém mensagens antigas legíveis pela interface nova/antiga.
UPDATE "messages"
SET "senderType" = COALESCE("senderType", "sender")
WHERE "senderType" IS NULL;
