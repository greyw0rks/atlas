const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const cols = await prisma.$queryRaw`
    SELECT column_name, is_nullable, column_default
    FROM information_schema.columns
    WHERE table_name = 'AddressProfile' AND table_schema = 'public'
    ORDER BY ordinal_position
  `;
  
  console.log('AddressProfile columns:');
  cols.forEach(c => {
    console.log(`  ${c.column_name}: nullable=${c.is_nullable}, default=${c.column_default || 'none'}`);
  });
}

main().catch(console.error).finally(() => prisma.$disconnect());
