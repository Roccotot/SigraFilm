// scripts/seed.js
import bcrypt from "bcryptjs";
import prisma from "../lib/prisma.js";

async function main() {
  const password = await bcrypt.hash(process.env.ADMIN_PASSWORD || "admin123", 10);
  const adminUser = await prisma.user.upsert({
    where: { username: process.env.ADMIN_USERNAME || "admin" },
    update: {},
    create: { username: process.env.ADMIN_USERNAME || "admin", password, role: "admin" },
  });
  console.log("Admin:", adminUser.username);

  // Utente cinema di esempio
  const cinemaPass = await bcrypt.hash("cinema123", 10);
  await prisma.user.upsert({
    where: { username: "cinema_demo" },
    update: {},
    create: { username: "cinema_demo", password: cinemaPass, role: "cinema" },
  });
  console.log("Creato utente cinema: cinema_demo / cinema123");
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
