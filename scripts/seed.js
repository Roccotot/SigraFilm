const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  // Hash delle password
  const adminPassword = await bcrypt.hash("fgQGCYDn60XnUwUA", 10);
  const giomettiPassword = await bcrypt.hash("giometti2025", 10);

  // Admin
  await prisma.user.upsert({
    where: { username: "admin" },
    update: {},
    create: {
      username: "admin",
      password: adminPassword,
      role: "ADMIN",
    },
  });

  // Utente cinema Giometti
  await prisma.user.upsert({
    where: { username: "giomettiprato" },
    update: {},
    create: {
      username: "giomettiprato",
      password: giomettiPassword,
      role: "USER",
    },
  });

  console.log("✅ Utenti creati/aggiornati con successo!");
}

main()
  .catch((e) => {
    console.error("❌ Errore nel seed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
