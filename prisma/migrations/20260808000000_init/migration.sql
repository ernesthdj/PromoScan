-- CreateEnum
CREATE TYPE "StoreStrategy" AS ENUM ('api', 'html', 'headless');

-- CreateEnum
CREATE TYPE "CollectionRunStatus" AS ENUM ('running', 'partial', 'complete', 'failed');

-- CreateEnum
CREATE TYPE "ChainRunStatus" AS ENUM ('pending', 'running', 'complete', 'failed', 'format_drift');

-- CreateEnum
CREATE TYPE "RunTrigger" AS ENUM ('cron', 'manual');

-- CreateTable
CREATE TABLE "store_chains" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "strategy" "StoreStrategy" NOT NULL,
    "baseUrl" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "crawlDelayMs" INTEGER NOT NULL DEFAULT 2000,
    "formatDriftThreshold" DOUBLE PRECISION NOT NULL DEFAULT 0.5,

    CONSTRAINT "store_chains_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "products" (
    "id" TEXT NOT NULL,
    "canonicalName" TEXT NOT NULL,
    "category" TEXT,
    "aliases" TEXT[],

    CONSTRAINT "products_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "promotions" (
    "id" TEXT NOT NULL,
    "storeChainId" TEXT NOT NULL,
    "productId" TEXT,
    "rawProductName" TEXT NOT NULL,
    "category" TEXT,
    "unitLabel" TEXT,
    "regularPrice" DECIMAL(10,2),
    "promoPrice" DECIMAL(10,2) NOT NULL,
    "discountPercent" DOUBLE PRECISION,
    "pricePerUnit" DECIMAL(10,2),
    "originLabel" TEXT,
    "validFrom" TIMESTAMP(3) NOT NULL,
    "validTo" TIMESTAMP(3) NOT NULL,
    "sourceUrl" TEXT NOT NULL,
    "collectedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "promotions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "collection_runs" (
    "id" TEXT NOT NULL,
    "weekKey" TEXT,
    "trigger" "RunTrigger" NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "finishedAt" TIMESTAMP(3),
    "status" "CollectionRunStatus" NOT NULL DEFAULT 'running',

    CONSTRAINT "collection_runs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "collection_run_chains" (
    "id" TEXT NOT NULL,
    "collectionRunId" TEXT NOT NULL,
    "storeChainId" TEXT NOT NULL,
    "status" "ChainRunStatus" NOT NULL DEFAULT 'pending',
    "itemsCollected" INTEGER,
    "errorMessage" TEXT,
    "startedAt" TIMESTAMP(3),
    "finishedAt" TIMESTAMP(3),

    CONSTRAINT "collection_run_chains_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DietProfile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,

    CONSTRAINT "DietProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Budget" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,

    CONSTRAINT "Budget_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Circuit" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,

    CONSTRAINT "Circuit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StoreLocation" (
    "id" TEXT NOT NULL,
    "storeChainId" TEXT NOT NULL,

    CONSTRAINT "StoreLocation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "store_chains_slug_key" ON "store_chains"("slug");

-- CreateIndex
CREATE INDEX "promotions_storeChainId_validFrom_idx" ON "promotions"("storeChainId", "validFrom");

-- CreateIndex
CREATE INDEX "promotions_productId_idx" ON "promotions"("productId");

-- CreateIndex
CREATE UNIQUE INDEX "promotions_storeChainId_rawProductName_validFrom_key" ON "promotions"("storeChainId", "rawProductName", "validFrom");

-- CreateIndex
CREATE UNIQUE INDEX "collection_runs_weekKey_key" ON "collection_runs"("weekKey");

-- CreateIndex
CREATE INDEX "collection_runs_startedAt_idx" ON "collection_runs"("startedAt" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "collection_run_chains_collectionRunId_storeChainId_key" ON "collection_run_chains"("collectionRunId", "storeChainId");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- AddForeignKey
ALTER TABLE "promotions" ADD CONSTRAINT "promotions_storeChainId_fkey" FOREIGN KEY ("storeChainId") REFERENCES "store_chains"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "promotions" ADD CONSTRAINT "promotions_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "collection_run_chains" ADD CONSTRAINT "collection_run_chains_collectionRunId_fkey" FOREIGN KEY ("collectionRunId") REFERENCES "collection_runs"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "collection_run_chains" ADD CONSTRAINT "collection_run_chains_storeChainId_fkey" FOREIGN KEY ("storeChainId") REFERENCES "store_chains"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DietProfile" ADD CONSTRAINT "DietProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Budget" ADD CONSTRAINT "Budget_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Circuit" ADD CONSTRAINT "Circuit_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StoreLocation" ADD CONSTRAINT "StoreLocation_storeChainId_fkey" FOREIGN KEY ("storeChainId") REFERENCES "store_chains"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

