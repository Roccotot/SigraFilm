import { clearAuthCookie } from "../../lib/auth";
export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();
  clearAuthCookie(res);
  res.redirect(302, '/');
}
