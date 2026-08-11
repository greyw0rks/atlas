const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const setting = await prisma.$queryRaw`SHOW CLUSTER SETTING feature.vector_index.enabled`;
  console.log('Vector setting enabled:', setting[0].value);
  
  const indexes = await prisma.$queryRaw`
    SELECT indexname, indexdef 
    FROM pg_indexes 
    WHERE schemaname = 'public' AND tablename = 'AddressProfile'
    ORDER BY indexname
  `;
  console.log('\nAddressProfile indexes:');
  indexes.forEach(i => console.log(' -', i.indexname));
  
  const vectorIdx = indexes.find(i => i.indexname.includes('vector'));
  if (vectorIdx) {
    console.log('\nVector index found:', vectorIdx.indexname);
    console.log('Uses cosine ops:', vectorIdx.indexdef.includes('vector_cosine_ops'));
  } else {
    console.log('\n⚠ No vector index found');
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
