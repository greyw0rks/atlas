const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('=== D1 GATE VERIFICATION ===\n');
  
  // GATE 1: Decimal(78,0) holds uint256
  console.log('GATE 1: Decimal(78,0) round-trip');
  const maxUint256 = '115792089237316195423570985008687907853269984665640564039457584007913129639935';
  await prisma.$executeRaw`CREATE TABLE IF NOT EXISTS decimal_test (id INT PRIMARY KEY, val DECIMAL(78,0))`;
  await prisma.$executeRaw`DELETE FROM decimal_test`;
  await prisma.$executeRaw`INSERT INTO decimal_test VALUES (1, ${maxUint256}::decimal)`;
  const dec = await prisma.$queryRaw`SELECT val::text as val FROM decimal_test WHERE id = 1`;
  console.log('  Input:  ', maxUint256.substring(0, 40) + '...');
  console.log('  Output: ', dec[0].val.substring(0, 40) + '...');
  console.log('  Result: ', dec[0].val === maxUint256 ? '✅ PASS' : '❌ FAIL');
  
  // GATE 2: Vector index with cosine ops
  console.log('\nGATE 2: Vector index with cosine ops');
  const idx = await prisma.$queryRaw`
    SELECT indexname, indexdef 
    FROM pg_indexes 
    WHERE schemaname = 'public' AND indexname = 'AddressProfile_behaviorEmbedding_cos'
  `;
  console.log('  Index found:', idx[0] ? '✅ YES' : '❌ NO');
  if (idx[0]) {
    const hasCosine = idx[0].indexdef.includes('vector_cosine_ops');
    console.log('  Has vector_cosine_ops:', hasCosine ? '✅ YES' : '❌ NO');
    console.log('  Index type:', idx[0].indexdef.match(/USING (\w+)/)?.[1] || 'unknown');
  }
  
  // Test actual cosine query
  const testVec = Array(1024).fill(0).map((_, i) => i === 0 ? 1 : 0);
  await prisma.$executeRaw`
    INSERT INTO "AddressProfile" (
      address, "lastSeenAt", "chainIds", "bridgeProtocols", 
      degree, "topTokens", "behaviorText", "behaviorEmbedding", "embeddedAt"
    )
    VALUES (
      '0xGATE2TEST', 
      now(),
      ARRAY[]::int[], 
      ARRAY[]::text[], 
      0, 
      ARRAY[]::text[], 
      'gate 2 test',
      ${`[${testVec.join(',')}]`}::vector,
      now()
    )
    ON CONFLICT (address) DO UPDATE SET 
      "behaviorEmbedding" = ${`[${testVec.join(',')}]`}::vector,
      "embeddedAt" = now(),
      "lastSeenAt" = now()
  `;
  
  const neighbors = await prisma.$queryRaw`
    SELECT address, "behaviorEmbedding" <=> ${`[${testVec.join(',')}]`}::vector as dist
    FROM "AddressProfile"
    WHERE "behaviorEmbedding" IS NOT NULL
    ORDER BY "behaviorEmbedding" <=> ${`[${testVec.join(',')}]`}::vector
    LIMIT 1
  `;
  console.log('  Cosine query works:', neighbors.length > 0 ? '✅ YES' : '❌ NO');
  console.log('  Self-distance:', neighbors[0]?.dist, neighbors[0]?.dist === 0 ? '(perfect)' : '');
  console.log('  Result:', neighbors[0]?.dist === 0 ? '✅ PASS' : '❌ FAIL');
  
  // GATE 3: Foreign keys
  console.log('\nGATE 3: Foreign key constraints');
  const fks = await prisma.$queryRaw`
    SELECT constraint_name
    FROM information_schema.table_constraints 
    WHERE constraint_type = 'FOREIGN KEY' AND table_schema = 'public'
    ORDER BY constraint_name
  `;
  console.log('  Foreign keys found:', fks.length);
  fks.forEach(fk => console.log('    -', fk.constraint_name));
  console.log('  Result:', fks.length === 6 ? '✅ PASS (6/6)' : `❌ FAIL (${fks.length}/6)`);
  
  console.log('\n=== D1 GATE STATUS ===');
  const allPass = dec[0].val === maxUint256 && idx[0] && neighbors[0]?.dist === 0 && fks.length === 6;
  console.log(allPass ? '✅ ALL GATES PASSED' : '⚠ Some gates failed');
}

main().catch(console.error).finally(() => prisma.$disconnect());
