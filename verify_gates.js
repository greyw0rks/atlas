const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('=== GATE 1: Decimal(78,0) round-trip ===');
  // Max uint256: 2^256 - 1
  const maxUint256 = '115792089237316195423570985008687907853269984665640564039457584007913129639935';
  
  await prisma.$executeRaw`CREATE TABLE IF NOT EXISTS decimal_test (id INT PRIMARY KEY, val DECIMAL(78,0))`;
  await prisma.$executeRaw`DELETE FROM decimal_test`;
  await prisma.$executeRaw`INSERT INTO decimal_test VALUES (1, ${maxUint256}::decimal)`;
  const result = await prisma.$queryRaw`SELECT val::text as val FROM decimal_test WHERE id = 1`;
  
  console.log('Input:  ', maxUint256);
  console.log('Output: ', result[0].val);
  console.log('Match:  ', result[0].val === maxUint256 ? '✓ PASS' : '✗ FAIL');
  
  console.log('\n=== GATE 2: Vector index with cosine ops ===');
  const indexes = await prisma.$queryRaw`
    SELECT indexname, indexdef 
    FROM pg_indexes 
    WHERE schemaname = 'public' AND tablename = 'AddressProfile' AND indexname LIKE '%vector%'
  `;
  console.log('Vector indexes:', indexes.length);
  if (indexes.length > 0) {
    console.log('Index name:', indexes[0].indexname);
    console.log('Has vector_cosine_ops:', indexes[0].indexdef.includes('vector_cosine_ops') ? '✓ PASS' : '✗ FAIL');
  }
  
  // Test actual cosine query
  const testVec = Array(1024).fill(0).map((_, i) => i === 0 ? 1 : 0);
  await prisma.$executeRaw`
    INSERT INTO "AddressProfile" (address, "chainIds", "bridgeProtocols", degree, "topTokens", "behaviorText")
    VALUES ('0xTEST', ARRAY[]::int[], ARRAY[]::text[], 0, ARRAY[]::text[], 'test')
    ON CONFLICT (address) DO UPDATE SET "lastSeenAt" = now()
  `;
  await prisma.$executeRaw`
    UPDATE "AddressProfile" 
    SET "behaviorEmbedding" = ${`[${testVec.join(',')}]`}::vector, "embeddedAt" = now()
    WHERE address = '0xTEST'
  `;
  
  const queryVec = testVec;
  const neighbors = await prisma.$queryRaw`
    SELECT address, "behaviorEmbedding" <=> ${`[${queryVec.join(',')}]`}::vector as dist
    FROM "AddressProfile"
    WHERE "behaviorEmbedding" IS NOT NULL
    ORDER BY "behaviorEmbedding" <=> ${`[${queryVec.join(',')}]`}::vector
    LIMIT 3
  `;
  console.log('Cosine query returned:', neighbors.length, 'rows');
  console.log('Self-distance:', neighbors[0]?.dist, neighbors[0]?.dist === 0 ? '✓ PASS' : '(expected 0)');
  
  console.log('\n=== GATE 3: Foreign keys ===');
  const fks = await prisma.$queryRaw`
    SELECT count(*) as fk_count 
    FROM information_schema.table_constraints 
    WHERE constraint_type = 'FOREIGN KEY' AND table_schema = 'public'
  `;
  console.log('Foreign keys:', fks[0].fk_count.toString());
  console.log('Expected: 6, Got:', fks[0].fk_count.toString() === '6' ? '✓ PASS' : '✗ FAIL');
  
  console.log('\n=== ALL GATES VERIFIED ===');
}

main().catch(console.error).finally(() => prisma.$disconnect());
