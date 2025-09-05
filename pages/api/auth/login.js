import prisma from "../../../lib/prisma";
import bcrypt from "bcryptjs";
import { generateToken } from "../../../lib/auth";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Metodo non consentito" });
  }

  const { username, password } = req.body;

  try {
    const user = await prisma.user.findUnique({
      where: { username },
    });

    if (!user) {
      return res.status(401).json({ error: "Credenziali non valide" });
    }

    const valid = await bcrypt.compare(password, user.password);

    if (!valid) {
      return res.status(401).json({ error: "Credenziali non valide" });
    }

    const token = generateToken(user);

    res.status(200).json({
      message: "Login riuscito",
      token,
      user: { id: user.id, username: user.username, role: user.role },
    });
  } catch (error) {
    console.error("Errore login:", error);
    res.status(500).json({ error: "Errore del server" });
  }
}
