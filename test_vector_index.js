const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  // Check the index definition
  const idx = await prisma.$queryRaw`
    SELECT indexname, indexdef 
    FROM pg_indexes 
    WHERE schemaname = 'public' AND indexname = 'AddressProfile_behaviorEmbedding_cos'
  `;
  console.log('Index definition:', idx[0]?.indexdef || 'NOT FOUND');
  
  if (!idx[0]) {
    console.log('⚠ Index not found, attempting to create...');
    try {
      await prisma.$executeRaw`
        CREATE VECTOR INDEX "AddressProfile_behaviorEmbedding_cos" 
        ON "AddressProfile" ("behaviorEmbedding" vector_cosine_ops)
      `;
      console.log('✓ Index created');
    } catch (e) {
      console.log('Error:', e.message);
    }
    return;
  }
  
  // Test with a real vector
  const testVec = Array(1024).fill(0).map((_, i) => i === 0 ? 1 : 0);
  
  // Insert test row with all required fields
  await prisma.$executeRaw`
    INSERT INTO "AddressProfile" (
      address, "chainIds", "bridgeProtocols", degree, "topTokens", 
      "behaviorText", "behaviorEmbedding", "embeddedAt"
    )
    VALUES (
      '0xTEST123', 
      ARRAY[]::int[], 
      ARRAY[]::text[], 
      0, 
      ARRAY[]::text[], 
      'test profile',
      ${`[${testVec.join(',')}]`}::vector,
      now()
    )
    ON CONFLICT (address) DO UPDATE SET 
      "behaviorEmbedding" = ${`[${testVec.join(',')}]`}::vector,
      "embeddedAt" = now()
  `;
  
  // Query with cosine distance
  const neighbors = await prisma.$queryRaw`
    SELECT 
      address, 
      "behaviorEmbedding" <=> ${`[${testVec.join(',')}]`}::vector as dist
    FROM "AddressProfile"
    WHERE "behaviorEmbedding" IS NOT NULL
    ORDER BY "behaviorEmbedding" <=> ${`[${testVec.join(',')}]`}::vector
    LIMIT 1
  `;
  
  console.log('\n✓ Cosine query succeeded');
  console.log('Address:', neighbors[0]?.address);
  console.log('Distance to self:', neighbors[0]?.dist);
  console.log('Gate 2:', neighbors[0]?.dist === 0 ? '✓ PASS' : '⚠ Check distance');
}

main().catch(console.error).finally(() => prisma.$disconnect());
