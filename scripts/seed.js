// scripts/seed.js
import bcrypt from "bcryptjs";
import prisma from "../lib/prisma.js";

async function main() {
  // Crea o aggiorna l'utente admin con username "admin" e password "Drinkcup1!"
  const adminPass = await bcrypt.hash("Drinkcup1!", 10);
  const adminUser = await prisma.user.upsert({
    where: { username: "admin" },
    update: {},
    create: {
      username: "admin",
      password: adminPass,
      role: "admin",
    },
  });
  console.log("✅ Admin creato:", adminUser.username, "/ Drinkcup1!");

  // Crea un utente cinema di esempio
  const cinemaPass = await bcrypt.hash("cinema123", 10);
  const cinemaUser = await prisma.user.upsert({
    where: { username: "cinema_demo" },
    update: {},
    create: {
      username: "cinema_demo",
      password: cinemaPass,
      role: "cinema",
    },
  });
  console.log("✅ Utente cinema creato:", cinemaUser.username, "/ cinema123");
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error("❌ Errore durante il seed:", e);
    process.exit(1);
  });
