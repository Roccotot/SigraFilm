import prisma from "../../../../lib/prisma";
import bcrypt from "bcryptjs";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Metodo non consentito" });
  }

  const { username, password, role } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: "Username e password sono obbligatori" });
  }

  try {
    // controlla se esiste già
    const existingUser = await prisma.user.findUnique({
      where: { username },
    });

    if (existingUser) {
      return res.status(400).json({ error: "Utente già esistente" });
    }

    // hash password con bcryptjs
    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        username,
        password: hashedPassword,
        role: role || "user",
      },
    });

    res.status(201).json({ message: "Utente creato con successo", user });
  } catch (error) {
    console.error("Errore creazione utente:", error);
    res.status(500).json({ error: "Errore del server" });
  }
}
