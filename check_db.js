const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const tables = await prisma.$queryRaw`
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
    ORDER BY table_name
  `;
  console.log('Tables:', tables.map(t => t.table_name).join(', '));
  
  const fks = await prisma.$queryRaw`
    SELECT count(*) as fk_count 
    FROM information_schema.table_constraints 
    WHERE constraint_type = 'FOREIGN KEY' AND table_schema = 'public'
  `;
  console.log('Foreign key count:', fks[0].fk_count);
  
  const indexes = await prisma.$queryRaw`
    SELECT indexname 
    FROM pg_indexes 
    WHERE schemaname = 'public' AND tablename = 'AddressProfile'
    ORDER BY indexname
  `;
  console.log('AddressProfile indexes:', indexes.map(i => i.indexname).join(', '));
}

main().catch(console.error).finally(() => prisma.$disconnect());
