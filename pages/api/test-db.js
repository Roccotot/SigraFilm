import prisma from "../../lib/prisma";

export default async function handler(req, res) {
  try {
    // Proviamo a leggere un utente
    const users = await prisma.user.findMany({
      take: 1,
    });

    res.status(200).json({
      success: true,
      message: "Connessione al database riuscita ✅",
      sampleUser: users.length > 0 ? users[0] : null,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Errore di connessione ❌",
      details: error.message,
    });
  }
}
