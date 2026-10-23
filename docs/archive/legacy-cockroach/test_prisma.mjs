import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
  log: ['query', 'error', 'warn']
});

console.log('Testing repository lookup...');
try {
  const repo = await prisma.repository.findUnique({
    where: { path: '/home/greyw0rks/atlas-2' }
  });
  console.log('Repo found:', repo ? `id=${repo.id}` : 'null');
} catch (err) {
  console.error('Error:', err.message);
}
await prisma.$disconnect();
