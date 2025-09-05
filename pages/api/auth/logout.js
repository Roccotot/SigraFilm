export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).json({ error: `Metodo ${req.method} non consentito` });
  }

  try {
    // In un'API REST con JWT, il logout lato server non invalida il token.
    // Si fa lato client rimuovendo il token da cookie o localStorage.
    // Qui simuliamo un logout "logico".
    return res.status(200).json({ message: "Logout effettuato con successo" });
  } catch (err) {
    console.error("Errore durante il logout:", err);
    return res.status(500).json({ error: "Errore interno del server" });
  }
}
