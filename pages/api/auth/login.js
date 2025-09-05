import prisma from "../../../lib/prisma";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Metodo non consentito" });
  }

  const { username, password } = req.body;

  try {
    // Cerca l’utente nel database
    const user = await prisma.user.findUnique({
      where: { username },
    });

    if (!user) {
      return res.status(401).json({ error: "Credenziali non valide" });
    }

    // Confronta la password
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return res.status(401).json({ error: "Credenziali non valide" });
    }

    // Genera un token JWT
    const token = jwt.sign(
      { id: user.id, role: user.role },
      process.env.JWT_SECRET || "default_secret", // Ricorda di mettere JWT_SECRET nelle env di Vercel
      { expiresIn: "1d" }
    );

    return res.status(200).json({
      message: "Login effettuato con successo",
      token,
      role: user.role,
    });
  } catch (error) {
    console.error("Errore login:", error);
    return res.status(500).json({ error: "Errore del server" });
  }
}
