import prisma from "../../lib/prisma";

export default async function handler(req, res) {
  if (req.method === "GET") {
    try {
      const tickets = await prisma.ticket.findMany({
        orderBy: { createdAt: "desc" },
      });
      res.status(200).json(tickets);
    } catch (err) {
      console.error("Errore recupero ticket:", err);
      res.status(500).json({ error: "Errore del server" });
    }
  } else if (req.method === "POST") {
    const { title, description, userId } = req.body;

    try {
      const newTicket = await prisma.ticket.create({
        data: {
          title,
          description,
          userId,
        },
      });
      res.status(201).json(newTicket);
    } catch (err) {
      console.error("Errore creazione ticket:", err);
      res.status(500).json({ error: "Errore del server" });
    }
  } else {
    res.status(405).json({ error: "Metodo non consentito" });
  }
}
