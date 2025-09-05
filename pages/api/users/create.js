import prisma from "../../../../lib/prisma";
import bcrypt from "bcryptjs";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Metodo non consentito" });
  }

  const { username, password, role } = req.body;

  try {
    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await prisma.user.create({
      data: {
        username,
        password: hashedPassword,
        role: role || "user",
      },
    });

    res.status(201).json(newUser);
  } catch (err) {
    console.error("Errore creazione utente:", err);
    res.status(500).json({ error: "Errore del server" });
  }
}
