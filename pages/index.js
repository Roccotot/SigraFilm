import { useState } from "react";

export default function Home() {
  const [result, setResult] = useState(null);

  const testConnection = async () => {
    setResult("⏳ Test in corso...");
    try {
      const res = await fetch("/api/test-db");
      const data = await res.json();
      if (data.success) {
        setResult(
          `✅ OK: ${data.message} ${
            data.sampleUser
              ? "(utente trovato: " + data.sampleUser.username + ")"
              : "(nessun utente in DB)"
          }`
        );
      } else {
        setResult(`❌ Errore: ${data.message}`);
      }
    } catch (err) {
      setResult("❌ Errore imprevisto: " + err.message);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 text-center">
      <h1 className="text-3xl font-bold mb-6">Benvenuto su SigraFilm 🎬</h1>
      <button
        onClick={testConnection}
        className="px-6 py-3 bg-blue-600 text-white rounded-lg shadow hover:bg-blue-700"
      >
        🔗 Test Connessione Database
      </button>
      {result && <p className="mt-4 text-lg">{result}</p>}
    </div>
  );
}
