const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

async function main() {
  // 🔑 Admin
  const adminPassword = await bcrypt.hash("fgQGCYDn60XnUwUA", 10);
  await prisma.user.upsert({
    where: { username: "admin" },
    update: {},
    create: {
      username: "admin",
      password: adminPassword,
      role: "admin",
    },
  });

  // 🎬 Cinema
  const cinemaPassword = await bcrypt.hash("giomettiprato2025", 10);
  await prisma.user.upsert({
    where: { username: "giomettiprato" },
    update: {},
    create: {
      username: "giomettiprato",
      password: cinemaPassword,
      role: "cinema",
    },
  });
}

main()
  .then(() => {
    console.log("✅ Utenti creati con successo!");
  })
  .catch((e) => {
    console.error("❌ Errore nel seed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
