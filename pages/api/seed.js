// pages/api/seed.js
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Metodo non consentito" });
  }

  try {
    const hashedAdminPass = await bcrypt.hash("fgQGCYDn60XnUwUA", 10);
    const hashedUserPass = await bcrypt.hash("giometti2025", 10);

    await prisma.user.upsert({
      where: { username: "admin" },
      update: {},
      create: {
        username: "admin",
        password: hashedAdminPass,
      },
    });

    await prisma.user.upsert({
      where: { username: "giomettiprato" },
      update: {},
      create: {
        username: "giomettiprato",
        password: hashedUserPass,
      },
    });

    res.status(200).json({ message: "Seed completato con successo!" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Errore durante il seed", details: error.message });
  } finally {
    await prisma.$disconnect();
  }
}
