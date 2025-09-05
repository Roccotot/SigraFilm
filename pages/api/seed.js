// pages/api/seed.js
import prisma from "../../lib/prisma";
import bcrypt from "bcryptjs";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Metodo non consentito" });
  }

  try {
    // password hash
    const adminPassword = await bcrypt.hash("fgQGCYDn60XnUwUA", 10);
    const userPassword = await bcrypt.hash("giometti2025", 10);

    // crea o aggiorna admin
    await prisma.user.upsert({
      where: { username: "admin" },
      update: { password: adminPassword, role: "ADMIN" },
      create: {
        username: "admin",
        password: adminPassword,
        role: "ADMIN",
      },
    });

    // crea o aggiorna giomettiprato
    await prisma.user.upsert({
      where: { username: "giomettiprato" },
      update: { password: userPassword, role: "USER" },
      create: {
        username: "giomettiprato",
        password: userPassword,
        role: "USER",
      },
    });

    return res.status(200).json({ message: "Utenti iniziali creati con successo" });
  } catch (error) {
    console.error("Errore nel seed:", error);
    return res.status(500).json({ error: "Errore durante il seed", details: error.message });
  }
}
