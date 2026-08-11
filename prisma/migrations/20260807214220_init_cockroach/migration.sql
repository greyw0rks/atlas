-- CreateEnum
CREATE TYPE "TraceStatus" AS ENUM ('RUNNING', 'DONE', 'ERROR');

-- CreateEnum
CREATE TYPE "TransferDirection" AS ENUM ('IN', 'OUT', 'SELF');

-- CreateEnum
CREATE TYPE "BridgeRole" AS ENUM ('SEND', 'RECV');

-- CreateEnum
CREATE TYPE "MatchType" AS ENUM ('DETERMINISTIC', 'HEURISTIC');

-- CreateEnum
CREATE TYPE "ObservationSource" AS ENUM ('BRIDGE_CONTRACT', 'CEX_HEURISTIC', 'USER', 'LLM');

-- CreateTable
CREATE TABLE "TraceJob" (
    "id" STRING NOT NULL,
    "rootAddress" STRING NOT NULL,
    "status" "TraceStatus" NOT NULL DEFAULT 'RUNNING',
    "chainStatus" JSONB NOT NULL DEFAULT '{}',
    "truncated" BOOL NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TraceJob_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ChainCursor" (
    "id" STRING NOT NULL,
    "jobId" STRING NOT NULL,
    "chainId" INT4 NOT NULL,
    "endpoint" STRING NOT NULL,
    "nextPageParams" JSONB,
    "pagesFetched" INT4 NOT NULL DEFAULT 0,
    "exhausted" BOOL NOT NULL DEFAULT false,

    CONSTRAINT "ChainCursor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Wallet" (
    "address" STRING NOT NULL,
    "label" STRING,
    "isContract" BOOL NOT NULL DEFAULT false,
    "isCex" BOOL NOT NULL DEFAULT false,
    "isBridge" BOOL NOT NULL DEFAULT false,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Wallet_pkey" PRIMARY KEY ("address")
);

-- CreateTable
CREATE TABLE "Transfer" (
    "id" STRING NOT NULL,
    "chainId" INT4 NOT NULL,
    "txHash" STRING NOT NULL,
    "logIndex" INT4 NOT NULL,
    "blockNumber" INT4 NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL,
    "fromAddr" STRING NOT NULL,
    "toAddr" STRING,
    "tokenAddr" STRING,
    "tokenSymbol" STRING,
    "decimals" INT4 NOT NULL DEFAULT 18,
    "rawAmount" DECIMAL(78,0) NOT NULL,
    "method" STRING,
    "direction" "TransferDirection" NOT NULL,

    CONSTRAINT "Transfer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BridgeEvent" (
    "id" STRING NOT NULL,
    "transferId" STRING NOT NULL,
    "protocol" STRING NOT NULL,
    "role" "BridgeRole" NOT NULL,
    "joinKey" STRING,
    "srcChainId" INT4,
    "dstChainId" INT4,
    "recipient" STRING,
    "rawParams" JSONB NOT NULL,

    CONSTRAINT "BridgeEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BridgeHop" (
    "id" STRING NOT NULL,
    "srcEventId" STRING NOT NULL,
    "dstEventId" STRING NOT NULL,
    "confidence" DECIMAL(3,2) NOT NULL,
    "matchType" "MatchType" NOT NULL,
    "evidence" JSONB NOT NULL,

    CONSTRAINT "BridgeHop_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProviderCache" (
    "cacheKey" STRING NOT NULL,
    "payload" JSONB NOT NULL,
    "fetchedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProviderCache_pkey" PRIMARY KEY ("cacheKey")
);

-- CreateTable
CREATE TABLE "RateLimitBucket" (
    "key" STRING NOT NULL,
    "tokensUsed" INT4 NOT NULL DEFAULT 0,
    "windowStart" TIMESTAMP(3) NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RateLimitBucket_pkey" PRIMARY KEY ("key")
);

-- CreateTable
CREATE TABLE "Investigation" (
    "id" STRING NOT NULL,
    "rootAddress" STRING NOT NULL,
    "chainIds" INT4[],
    "transferCount" INT4 NOT NULL DEFAULT 0,
    "hopCount" INT4 NOT NULL DEFAULT 0,
    "truncated" BOOL NOT NULL DEFAULT false,
    "durationMs" INT4 NOT NULL DEFAULT 0,
    "narrative" STRING,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Investigation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AddressProfile" (
    "address" STRING NOT NULL,
    "firstSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastSeenAt" TIMESTAMP(3) NOT NULL,
    "observationCount" INT4 NOT NULL DEFAULT 1,
    "chainIds" INT4[],
    "bridgeProtocols" STRING[],
    "degree" INT4 NOT NULL DEFAULT 0,
    "topTokens" STRING[],
    "behaviorText" STRING NOT NULL DEFAULT '',
    "behaviorEmbedding" VECTOR(1024),
    "embeddedAt" TIMESTAMP(3),

    CONSTRAINT "AddressProfile_pkey" PRIMARY KEY ("address")
);

-- CreateTable
CREATE TABLE "BridgeRoute" (
    "id" STRING NOT NULL,
    "protocol" STRING NOT NULL,
    "srcChainId" INT4 NOT NULL,
    "dstChainId" INT4 NOT NULL,
    "tokenSymbol" STRING NOT NULL,
    "observationCount" INT4 NOT NULL DEFAULT 1,
    "medianFeeBps" DECIMAL(10,4) NOT NULL,
    "medianLatencySec" INT4 NOT NULL,
    "p90LatencySec" INT4 NOT NULL,
    "matchedCount" INT4 NOT NULL DEFAULT 0,
    "orphanSendCount" INT4 NOT NULL DEFAULT 0,
    "lastSeenAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BridgeRoute_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EntityObservation" (
    "id" STRING NOT NULL,
    "address" STRING NOT NULL,
    "label" STRING NOT NULL,
    "source" "ObservationSource" NOT NULL,
    "confidence" DECIMAL(3,2) NOT NULL,
    "evidence" JSONB NOT NULL,
    "observedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EntityObservation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MemoryRetrieval" (
    "id" STRING NOT NULL,
    "investigationId" STRING NOT NULL,
    "kind" STRING NOT NULL,
    "queryText" STRING NOT NULL,
    "hitIds" STRING[],
    "scores" DECIMAL(6,5)[],
    "latencyMs" INT4 NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MemoryRetrieval_pkey" PRIMARY KEY ("id")
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

-- CreateIndex
CREATE INDEX "Investigation_rootAddress_createdAt_idx" ON "Investigation"("rootAddress", "createdAt");

-- CreateIndex
CREATE INDEX "AddressProfile_lastSeenAt_idx" ON "AddressProfile"("lastSeenAt");

-- CreateIndex
CREATE INDEX "AddressProfile_degree_idx" ON "AddressProfile"("degree");

-- CreateIndex
CREATE UNIQUE INDEX "BridgeRoute_protocol_srcChainId_dstChainId_tokenSymbol_key" ON "BridgeRoute"("protocol", "srcChainId", "dstChainId", "tokenSymbol");

-- CreateIndex
CREATE INDEX "EntityObservation_label_idx" ON "EntityObservation"("label");

-- CreateIndex
CREATE UNIQUE INDEX "EntityObservation_address_label_source_key" ON "EntityObservation"("address", "label", "source");

-- CreateIndex
CREATE INDEX "MemoryRetrieval_investigationId_idx" ON "MemoryRetrieval"("investigationId");

-- AddForeignKey
ALTER TABLE "ChainCursor" ADD CONSTRAINT "ChainCursor_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "TraceJob"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BridgeEvent" ADD CONSTRAINT "BridgeEvent_transferId_fkey" FOREIGN KEY ("transferId") REFERENCES "Transfer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BridgeHop" ADD CONSTRAINT "BridgeHop_srcEventId_fkey" FOREIGN KEY ("srcEventId") REFERENCES "BridgeEvent"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BridgeHop" ADD CONSTRAINT "BridgeHop_dstEventId_fkey" FOREIGN KEY ("dstEventId") REFERENCES "BridgeEvent"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EntityObservation" ADD CONSTRAINT "EntityObservation_address_fkey" FOREIGN KEY ("address") REFERENCES "AddressProfile"("address") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MemoryRetrieval" ADD CONSTRAINT "MemoryRetrieval_investigationId_fkey" FOREIGN KEY ("investigationId") REFERENCES "Investigation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- CreateVectorIndex
-- Hand-written: Prisma cannot emit this. CockroachDB uses C-SPANN, so pgvector's
-- `USING hnsw` fails here. The `vector_cosine_ops` opclass is REQUIRED — without
-- it the index defaults to L2 and `<=>` queries silently fall back to a full scan.
CREATE VECTOR INDEX "AddressProfile_behaviorEmbedding_cos" ON "AddressProfile" ("behaviorEmbedding" vector_cosine_ops);
