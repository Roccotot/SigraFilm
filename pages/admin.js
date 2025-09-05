import { useEffect, useState } from "react";
import Layout from "../components/Layout";

export default function Admin() {
  const [tickets, setTickets] = useState([]);

  const fetchTickets = async () => {
    const res = await fetch("/api/tickets/list");
    if (res.ok) {
      const data = await res.json();
      setTickets(data);
    }
  };

  const updateStatus = async (id, status) => {
    await fetch(`/api/tickets/update/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ stato: status }),
    });
    fetchTickets();
  };

  const deleteTicket = async (id) => {
    await fetch(`/api/tickets/delete/${id}`, { method: "DELETE" });
    fetchTickets();
  };

  useEffect(() => {
    fetchTickets();
  }, []);

  return (
    <Layout>
      <h2 className="text-2xl font-bold text-indigo-700 mb-6 text-center">
        Pannello Admin - Segnalazioni
      </h2>
      <div className="overflow-x-auto">
        <table className="w-full bg-white shadow-lg rounded-lg overflow-hidden">
          <thead className="bg-indigo-600 text-white">
            <tr>
              <th className="p-3 text-left">Cinema</th>
              <th className="p-3 text-left">Sala</th>
              <th className="p-3 text-left">Problema</th>
              <th className="p-3 text-left">Urgenza</th>
              <th className="p-3 text-left">Stato</th>
              <th className="p-3 text-left">Azioni</th>
            </tr>
          </thead>
          <tbody>
            {tickets.length > 0 ? (
              tickets.map((t) => (
                <tr key={t.id} className="border-b hover:bg-gray-50">
                  <td className="p-3">{t.cinema}</td>
                  <td className="p-3">{t.sala}</td>
                  <td className="p-3">{t.tipo}</td>
                  <td className="p-3">{t.urgenza}</td>
                  <td className="p-3">{t.stato}</td>
                  <td className="p-3 space-x-2">
                    <button
                      onClick={() => updateStatus(t.id, "IN_RISOLUZIONE")}
                      className="bg-yellow-500 text-white px-2 py-1 rounded-lg text-sm"
                    >
                      In Risoluzione
                    </button>
                    <button
                      onClick={() => updateStatus(t.id, "RISOLTO")}
                      className="bg-green-600 text-white px-2 py-1 rounded-lg text-sm"
                    >
                      Risolto
                    </button>
                    <button
                      onClick={() => deleteTicket(t.id)}
                      className="bg-red-600 text-white px-2 py-1 rounded-lg text-sm"
                    >
                      Elimina
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="6" className="text-center p-6 text-gray-500">
                  Nessuna segnalazione trovata
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </Layout>
  );
}
