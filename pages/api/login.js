import prisma from "../../lib/prisma";
import bcrypt from 'bcryptjs';
import { signToken, setAuthCookie } from "../../lib/auth";

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();
  const { username, password } = req.body || {};
  if (!username || !password) return res.status(400).json({ error: 'Credenziali mancanti' });

  try {
    let user = await prisma.user.findUnique({ where: { username } });

    // Se non esiste e coincide con ADMIN_* crea admin la prima volta
    if (!user && username === process.env.ADMIN_USERNAME) {
      const hash = await bcrypt.hash(process.env.ADMIN_PASSWORD, 10);
      user = await prisma.user.create({ data: { username, password: hash, role: 'admin' } });
    }

    if (!user) return res.status(401).json({ error: 'Utente non trovato' });

    const ok = await bcrypt.compare(password, user.password);
    if (!ok) return res.status(401).json({ error: 'Password errata' });

    const token = signToken({ id: user.id, username: user.username, role: user.role });
    setAuthCookie(res, token);
    res.json({ ok: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Errore server' });
  }
}
