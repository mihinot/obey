-- CreateEnum
CREATE TYPE "StarStatut" AS ENUM ('Nouveau', 'Actif', 'Occasionnel', 'EnPause', 'Ancien');

-- CreateEnum
CREATE TYPE "EventStatut" AS ENUM ('BROUILLON', 'EN_GENERATION', 'A_VALIDER', 'PUBLIE', 'ANNULE');

-- CreateEnum
CREATE TYPE "AssignmentStatut" AS ENUM ('Proposee', 'Validee', 'Publiee', 'Confirmee', 'Desistee');

-- CreateEnum
CREATE TYPE "ConflitType" AS ENUM ('INCOMPATIBLE', 'AVERTISSEMENT');

-- CreateEnum
CREATE TYPE "NotifCanal" AS ENUM ('INTERNE', 'EMAIL', 'WHATSAPP');

-- CreateEnum
CREATE TYPE "Tone" AS ENUM ('ok', 'warn', 'danger', 'primary', 'accent', 'muted');

-- CreateEnum
CREATE TYPE "AccountStatut" AS ENUM ('EnAttente', 'Actif', 'Suspendu', 'Refuse');

-- CreateEnum
CREATE TYPE "RoleType" AS ENUM ('STAR', 'REFERENT', 'COORDINATION_GENERALE', 'CORPS_PASTORAL', 'VIE_DES_STARS', 'ADMINISTRATEUR');

-- CreateTable
CREATE TABLE "User" (
    "id" SERIAL NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT,
    "googleId" TEXT,
    "statut" "AccountStatut" NOT NULL DEFAULT 'EnAttente',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RefreshToken" (
    "id" SERIAL NOT NULL,
    "token" TEXT NOT NULL,
    "userId" INTEGER NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RefreshToken_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Star" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "prenom" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "tel" TEXT NOT NULL DEFAULT '',
    "statut" "StarStatut" NOT NULL DEFAULT 'Actif',
    "charge" INTEGER NOT NULL DEFAULT 0,
    "fiab" DOUBLE PRECISION NOT NULL DEFAULT 1.0,
    "desist" INTEGER NOT NULL DEFAULT 0,
    "baptise" BOOLEAN NOT NULL DEFAULT false,
    "f001" BOOLEAN NOT NULL DEFAULT false,
    "f101" BOOLEAN NOT NULL DEFAULT false,
    "f201" BOOLEAN NOT NULL DEFAULT false,
    "famille" TEXT,
    "disciple" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Star_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Department" (
    "code" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "couleur" TEXT NOT NULL DEFAULT '#9a8fb0',
    "confidentiel" BOOLEAN NOT NULL DEFAULT false,
    "pilotage" BOOLEAN NOT NULL DEFAULT false,
    "actif" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "Department_pkey" PRIMARY KEY ("code")
);

-- CreateTable
CREATE TABLE "StarDept" (
    "starId" INTEGER NOT NULL,
    "deptCode" TEXT NOT NULL,

    CONSTRAINT "StarDept_pkey" PRIMARY KEY ("starId","deptCode")
);

-- CreateTable
CREATE TABLE "Role" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "type" "RoleType" NOT NULL,
    "deptCode" TEXT,

    CONSTRAINT "Role_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EventTemplate" (
    "id" SERIAL NOT NULL,
    "nom" TEXT NOT NULL,
    "actif" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "EventTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EventTemplateNeed" (
    "id" SERIAL NOT NULL,
    "templateId" INTEGER NOT NULL,
    "deptCode" TEXT NOT NULL,
    "requis" INTEGER NOT NULL,

    CONSTRAINT "EventTemplateNeed_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Event" (
    "id" SERIAL NOT NULL,
    "nom" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'Culte dominical',
    "date" TIMESTAMP(3) NOT NULL,
    "debut" TEXT NOT NULL,
    "fin" TEXT NOT NULL,
    "lieu" TEXT NOT NULL DEFAULT '',
    "statut" "EventStatut" NOT NULL DEFAULT 'BROUILLON',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Event_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EventNeed" (
    "id" SERIAL NOT NULL,
    "eventId" INTEGER NOT NULL,
    "deptCode" TEXT NOT NULL,
    "requis" INTEGER NOT NULL,

    CONSTRAINT "EventNeed_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Assignment" (
    "id" SERIAL NOT NULL,
    "starId" INTEGER NOT NULL,
    "eventId" INTEGER NOT NULL,
    "deptCode" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'STAR',
    "statut" "AssignmentStatut" NOT NULL DEFAULT 'Proposee',
    "confirme" BOOLEAN NOT NULL DEFAULT false,
    "conflit" "ConflitType",
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Assignment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Availability" (
    "id" SERIAL NOT NULL,
    "starId" INTEGER NOT NULL,
    "dateFrom" TIMESTAMP(3) NOT NULL,
    "dateTo" TIMESTAMP(3) NOT NULL,
    "motif" TEXT NOT NULL DEFAULT '',

    CONSTRAINT "Availability_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Substitution" (
    "id" SERIAL NOT NULL,
    "assignmentId" INTEGER NOT NULL,
    "replacedById" INTEGER,
    "statut" TEXT NOT NULL DEFAULT 'EnAttente',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Substitution_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "titre" TEXT NOT NULL,
    "msg" TEXT NOT NULL,
    "canal" "NotifCanal" NOT NULL DEFAULT 'INTERNE',
    "lu" BOOLEAN NOT NULL DEFAULT false,
    "tone" "Tone" NOT NULL DEFAULT 'primary',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "action" TEXT NOT NULL,
    "entite" TEXT NOT NULL,
    "entityId" TEXT,
    "meta" JSONB,
    "tone" "Tone" NOT NULL DEFAULT 'primary',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Parameter" (
    "cle" TEXT NOT NULL,
    "val" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'text',
    "label" TEXT NOT NULL,
    "desc" TEXT NOT NULL DEFAULT '',
    "unite" TEXT NOT NULL DEFAULT '',
    "groupe" TEXT NOT NULL DEFAULT 'general',

    CONSTRAINT "Parameter_pkey" PRIMARY KEY ("cle")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_googleId_key" ON "User"("googleId");

-- CreateIndex
CREATE UNIQUE INDEX "RefreshToken_token_key" ON "RefreshToken"("token");

-- CreateIndex
CREATE UNIQUE INDEX "Star_userId_key" ON "Star"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Role_userId_type_deptCode_key" ON "Role"("userId", "type", "deptCode");

-- CreateIndex
CREATE UNIQUE INDEX "EventNeed_eventId_deptCode_key" ON "EventNeed"("eventId", "deptCode");

-- CreateIndex
CREATE UNIQUE INDEX "Assignment_starId_eventId_key" ON "Assignment"("starId", "eventId");

-- AddForeignKey
ALTER TABLE "RefreshToken" ADD CONSTRAINT "RefreshToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Star" ADD CONSTRAINT "Star_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StarDept" ADD CONSTRAINT "StarDept_starId_fkey" FOREIGN KEY ("starId") REFERENCES "Star"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StarDept" ADD CONSTRAINT "StarDept_deptCode_fkey" FOREIGN KEY ("deptCode") REFERENCES "Department"("code") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Role" ADD CONSTRAINT "Role_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Role" ADD CONSTRAINT "Role_deptCode_fkey" FOREIGN KEY ("deptCode") REFERENCES "Department"("code") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventTemplateNeed" ADD CONSTRAINT "EventTemplateNeed_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "EventTemplate"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventNeed" ADD CONSTRAINT "EventNeed_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventNeed" ADD CONSTRAINT "EventNeed_deptCode_fkey" FOREIGN KEY ("deptCode") REFERENCES "Department"("code") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Assignment" ADD CONSTRAINT "Assignment_starId_fkey" FOREIGN KEY ("starId") REFERENCES "Star"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Assignment" ADD CONSTRAINT "Assignment_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Assignment" ADD CONSTRAINT "Assignment_deptCode_fkey" FOREIGN KEY ("deptCode") REFERENCES "Department"("code") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Availability" ADD CONSTRAINT "Availability_starId_fkey" FOREIGN KEY ("starId") REFERENCES "Star"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Substitution" ADD CONSTRAINT "Substitution_assignmentId_fkey" FOREIGN KEY ("assignmentId") REFERENCES "Assignment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

