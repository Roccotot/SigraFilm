import prisma from "../../lib/prisma";
import { getUserFromReq, requireRole } from "../../lib/auth";

export default async function handler(req, res) {
  if (req.method === 'GET') {
    const user = requireRole(req, res, ['admin']);
    if (!user) return; // risposta già inviata
    const tickets = await prisma.ticket.findMany({ orderBy: { createdAt: 'desc' } });
    return res.json(tickets);
  }

  if (req.method === 'POST') {
    const user = getUserFromReq(req);
    if (!user) return res.status(401).json({ error: 'Non autenticato' });

    const { cinema, sala, tipo, descrizione, urgenza } = req.body || {};
    if (!cinema || !sala || !tipo || !descrizione || !urgenza) {
      return res.status(400).json({ error: 'Campi obbligatori mancanti' });
    }
    const ticket = await prisma.ticket.create({
      data: { cinema, sala, tipo, descrizione, urgenza, createdById: user.id },
    });
    return res.status(201).json(ticket);
  }

  if (req.method === 'PUT') {
    const user = requireRole(req, res, ['admin']);
    if (!user) return;
    const id = parseInt(req.query.id);
    const { stato } = req.body || {};
    if (!['NON_RISOLTO','IN_RISOLUZIONE','RISOLTO'].includes(stato)) {
      return res.status(400).json({ error: 'Stato non valido' });
    }
    const updated = await prisma.ticket.update({ where: { id }, data: { stato } });
    return res.json(updated);
  }

  if (req.method === 'DELETE') {
    const user = requireRole(req, res, ['admin']);
    if (!user) return;
    const id = parseInt(req.query.id);
    await prisma.ticket.delete({ where: { id } });
    return res.json({ ok: true });
  }

  return res.status(405).end();
}
