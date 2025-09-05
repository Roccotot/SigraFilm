// pages/index.js
import { useState } from "react";

export default function Home() {
  const [message, setMessage] = useState("");

  const runSeed = async () => {
    try {
      const res = await fetch("/api/seed", {
        method: "POST",
      });
      const data = await res.json();
      if (res.ok) {
        setMessage(data.message);
      } else {
        setMessage(data.error || "Errore sconosciuto");
      }
    } catch (err) {
      setMessage("Errore di rete");
    }
  };

  return (
    <div style={{ textAlign: "center", padding: "2rem" }}>
      <h1>Benvenuto su SigraFilm 🎬</h1>
      <button
        onClick={runSeed}
        style={{
          padding: "10px 20px",
          background: "black",
          color: "white",
          border: "none",
          borderRadius: "5px",
          cursor: "pointer",
          marginTop: "20px",
        }}
      >
        Avvia Seed Database
      </button>
      {message && <p style={{ marginTop: "20px" }}>{message}</p>}
    </div>
  );
}
