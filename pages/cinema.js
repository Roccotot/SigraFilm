import { useState } from "react";
import Layout from "../components/Layout";

export default function Cinema() {
  const [form, setForm] = useState({
    cinema: "",
    sala: "",
    tipo: "",
    descrizione: "",
    urgenza: "Normale",
  });
  const [success, setSuccess] = useState("");

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSuccess("");

    const res = await fetch("/api/tickets/create", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });

    if (res.ok) {
      setSuccess("Segnalazione inviata con successo ✅");
      setForm({ cinema: "", sala: "", tipo: "", descrizione: "", urgenza: "Normale" });
    }
  };

  return (
    <Layout>
      <div className="max-w-lg mx-auto bg-white p-8 rounded-2xl shadow-lg">
        <h2 className="text-2xl font-bold text-center text-indigo-700 mb-6">
          Segnala un Problema
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="text"
            name="cinema"
            value={form.cinema}
            onChange={handleChange}
            placeholder="Nome Cinema"
            required
            className="w-full border px-3 py-2 rounded-lg shadow-sm"
          />

          <input
            type="text"
            name="sala"
            value={form.sala}
            onChange={handleChange}
            placeholder="Sala"
            required
            className="w-full border px-3 py-2 rounded-lg shadow-sm"
          />

          <input
            type="text"
            name="tipo"
            value={form.tipo}
            onChange={handleChange}
            placeholder="Tipo di problematica"
            required
            className="w-full border px-3 py-2 rounded-lg shadow-sm"
          />

          <textarea
            name="descrizione"
            value={form.descrizione}
            onChange={handleChange}
            placeholder="Descrizione dettagliata"
            required
            className="w-full border px-3 py-2 rounded-lg shadow-sm"
          />

          <select
            name="urgenza"
            value={form.urgenza}
            onChange={handleChange}
            className="w-full border px-3 py-2 rounded-lg shadow-sm"
          >
            <option>Normale</option>
            <option>Alta</option>
            <option>Critica</option>
          </select>

          <button
            type="submit"
            className="w-full bg-indigo-600 text-white py-2 px-4 rounded-lg hover:bg-indigo-700 transition"
          >
            Invia Segnalazione
          </button>
        </form>

        {success && (
          <p className="mt-4 text-green-600 text-center">{success}</p>
        )}
      </div>
    </Layout>
  );
}
