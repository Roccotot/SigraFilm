import prisma from "../../lib/prisma";
import bcrypt from "bcryptjs";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    // Passwords in chiaro
    const adminPassword = "fgQGCYDn60XnUwUA";
    const giomettiPassword = "giometti2025";

    // Hash delle password
    const hashedAdmin = await bcrypt.hash(adminPassword, 10);
    const hashedGiometti = await bcrypt.hash(giomettiPassword, 10);

    // Inserimento utenti
    const users = await prisma.user.createMany({
      data: [
        {
          username: "admin",
          password: hashedAdmin,
          role: "ADMIN",
        },
        {
          username: "giomettiprato",
          password: hashedGiometti,
          role: "USER",
        },
      ],
      skipDuplicates: true, // evita errori se già esistono
    });

    return res.status(200).json({
      message: "Utenti creati con successo!",
      users,
    });
  } catch (error) {
    console.error("Errore seed:", error);
    return res.status(500).json({ error: "Errore durante il seed" });
  }
}
