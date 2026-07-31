-- CreateEnum
CREATE TYPE "TraceStatus" AS ENUM ('RUNNING', 'DONE', 'ERROR');

-- CreateEnum
CREATE TYPE "TransferDirection" AS ENUM ('IN', 'OUT', 'SELF');

-- CreateEnum
CREATE TYPE "BridgeRole" AS ENUM ('SEND', 'RECV');

-- CreateEnum
CREATE TYPE "MatchType" AS ENUM ('DETERMINISTIC', 'HEURISTIC');

-- CreateTable
CREATE TABLE "TraceJob" (
    "id" TEXT NOT NULL,
    "rootAddress" TEXT NOT NULL,
    "status" "TraceStatus" NOT NULL DEFAULT 'RUNNING',
    "chainStatus" JSONB NOT NULL DEFAULT '{}',
    "truncated" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TraceJob_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ChainCursor" (
    "id" TEXT NOT NULL,
    "jobId" TEXT NOT NULL,
    "chainId" INTEGER NOT NULL,
    "endpoint" TEXT NOT NULL,
    "nextPageParams" JSONB,
    "pagesFetched" INTEGER NOT NULL DEFAULT 0,
    "exhausted" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "ChainCursor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Wallet" (
    "address" TEXT NOT NULL,
    "label" TEXT,
    "isContract" BOOLEAN NOT NULL DEFAULT false,
    "isCex" BOOLEAN NOT NULL DEFAULT false,
    "isBridge" BOOLEAN NOT NULL DEFAULT false,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Wallet_pkey" PRIMARY KEY ("address")
);

-- CreateTable
CREATE TABLE "Transfer" (
    "id" TEXT NOT NULL,
    "chainId" INTEGER NOT NULL,
    "txHash" TEXT NOT NULL,
    "logIndex" INTEGER NOT NULL,
    "blockNumber" INTEGER NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL,
    "fromAddr" TEXT NOT NULL,
    "toAddr" TEXT,
    "tokenAddr" TEXT,
    "tokenSymbol" TEXT,
    "decimals" INTEGER NOT NULL DEFAULT 18,
    "rawAmount" DECIMAL(78,0) NOT NULL,
    "method" TEXT,
    "direction" "TransferDirection" NOT NULL,

    CONSTRAINT "Transfer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BridgeEvent" (
    "id" TEXT NOT NULL,
    "transferId" TEXT NOT NULL,
    "protocol" TEXT NOT NULL,
    "role" "BridgeRole" NOT NULL,
    "joinKey" TEXT,
    "srcChainId" INTEGER,
    "dstChainId" INTEGER,
    "recipient" TEXT,
    "rawParams" JSONB NOT NULL,

    CONSTRAINT "BridgeEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BridgeHop" (
    "id" TEXT NOT NULL,
    "srcEventId" TEXT NOT NULL,
    "dstEventId" TEXT NOT NULL,
    "confidence" DECIMAL(3,2) NOT NULL,
    "matchType" "MatchType" NOT NULL,
    "evidence" JSONB NOT NULL,

    CONSTRAINT "BridgeHop_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProviderCache" (
    "cacheKey" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "fetchedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProviderCache_pkey" PRIMARY KEY ("cacheKey")
);

-- CreateTable
CREATE TABLE "RateLimitBucket" (
    "key" TEXT NOT NULL,
    "tokensUsed" INTEGER NOT NULL DEFAULT 0,
    "windowStart" TIMESTAMP(3) NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RateLimitBucket_pkey" PRIMARY KEY ("key")
);

-- CreateIndex
CREATE INDEX "TraceJob_rootAddress_idx" ON "TraceJob"("rootAddress");

-- CreateIndex
CREATE UNIQUE INDEX "ChainCursor_jobId_chainId_endpoint_key" ON "ChainCursor"("jobId", "chainId", "endpoint");

-- CreateIndex
CREATE INDEX "Transfer_fromAddr_idx" ON "Transfer"("fromAddr");

-- CreateIndex
CREATE INDEX "Transfer_toAddr_idx" ON "Transfer"("toAddr");

-- CreateIndex
CREATE INDEX "Transfer_chainId_timestamp_idx" ON "Transfer"("chainId", "timestamp");

-- CreateIndex
CREATE UNIQUE INDEX "Transfer_chainId_txHash_logIndex_key" ON "Transfer"("chainId", "txHash", "logIndex");

-- CreateIndex
CREATE INDEX "BridgeEvent_protocol_joinKey_idx" ON "BridgeEvent"("protocol", "joinKey");

-- CreateIndex
CREATE UNIQUE INDEX "BridgeHop_srcEventId_dstEventId_key" ON "BridgeHop"("srcEventId", "dstEventId");

-- CreateIndex
CREATE INDEX "ProviderCache_expiresAt_idx" ON "ProviderCache"("expiresAt");

-- CreateIndex
CREATE INDEX "RateLimitBucket_windowStart_idx" ON "RateLimitBucket"("windowStart");

-- AddForeignKey
ALTER TABLE "ChainCursor" ADD CONSTRAINT "ChainCursor_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "TraceJob"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BridgeEvent" ADD CONSTRAINT "BridgeEvent_transferId_fkey" FOREIGN KEY ("transferId") REFERENCES "Transfer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BridgeHop" ADD CONSTRAINT "BridgeHop_srcEventId_fkey" FOREIGN KEY ("srcEventId") REFERENCES "BridgeEvent"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BridgeHop" ADD CONSTRAINT "BridgeHop_dstEventId_fkey" FOREIGN KEY ("dstEventId") REFERENCES "BridgeEvent"("id") ON DELETE CASCADE ON UPDATE CASCADE;
