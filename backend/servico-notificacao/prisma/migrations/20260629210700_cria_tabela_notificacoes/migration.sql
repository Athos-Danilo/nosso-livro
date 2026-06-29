-- CreateEnum
CREATE TYPE "TipoNotificacao" AS ENUM ('EMAIL', 'WHATSAPP');

-- CreateEnum
CREATE TYPE "EstadoNotificacao" AS ENUM ('ENVIADO', 'FALHOU', 'PENDENTE');

-- CreateTable
CREATE TABLE "notificacoes" (
    "id" TEXT NOT NULL,
    "idUsuario" TEXT NOT NULL,
    "tipo" "TipoNotificacao" NOT NULL,
    "estado" "EstadoNotificacao" NOT NULL DEFAULT 'PENDENTE',
    "titulo" TEXT NOT NULL,
    "conteudo" TEXT NOT NULL,
    "mensagemErro" TEXT,
    "tentativas" INTEGER NOT NULL DEFAULT 0,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notificacoes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "notificacoes_idUsuario_idx" ON "notificacoes"("idUsuario");

-- CreateIndex
CREATE INDEX "notificacoes_estado_idx" ON "notificacoes"("estado");

-- CreateIndex
CREATE INDEX "notificacoes_idUsuario_estado_idx" ON "notificacoes"("idUsuario", "estado");
