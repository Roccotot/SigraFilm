const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function main() {
  const adminPassword = await bcrypt.hash('Admin2025!', 10);
  const userPassword = await bcrypt.hash('User2025!', 10);

  await prisma.user.upsert({
    where: { username: 'admin' },
    update: {},
    create: {
      username: 'admin',
      password: adminPassword,
      role: 'admin',
    },
  });

  await prisma.user.upsert({
    where: { username: 'giometti' },
    update: {},
    create: {
      username: 'giometti',
      password: userPassword,
      role: 'user',
    },
  });
}

main()
  .then(() => {
    console.log('Database seeded ✅');
    prisma.$disconnect();
  })
  .catch((err) => {
    console.error('Errore durante il seed ❌', err);
    prisma.$disconnect();
    process.exit(1);
  });
