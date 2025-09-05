import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  // 🔑 Admin di default
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

  // 🎬 Utente cinema: Giometti Prato
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
