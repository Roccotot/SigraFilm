import prisma from "../../../lib/prisma";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

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

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(401).json({ error: "Credenziali non valide" });
    }

    const token = jwt.sign(
      { id: user.id, role: user.role },
      process.env.JWT_SECRET || "default_secret",
      { expiresIn: "1d" }
    );

    res.status(200).json({ token, role: user.role });
  } catch (err) {
    console.error("Errore login:", err);
    res.status(500).json({ error: "Errore del server" });
  }
}
