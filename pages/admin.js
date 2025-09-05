import Navbar from "../components/Navbar";
import { getUserFromReq } from "../lib/auth";

export async function getServerSideProps({ req }) {
  const user = getUserFromReq(req);
  if (!user || user.role !== 'admin') {
    return { redirect: { destination: '/login', permanent: false } };
  }
  return { props: { user } };
}

import { useEffect, useState } from 'react';

export default function Admin({ user }) {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    const res = await fetch('/api/tickets');
    const data = await res.json();
    setTickets(data);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function changeStatus(id, stato) {
    await fetch(`/api/tickets?id=${id}`, { method: 'PUT', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ stato }) });
    load();
  }

  async function del(id) {
    if (!confirm('Cancellare questo ticket?')) return;
    await fetch(`/api/tickets?id=${id}`, { method: 'DELETE' });
    load();
  }

  function Badge({ stato }) {
    const map = {
      NON_RISOLTO: 'bg-rose-100 text-rose-700',
      IN_RISOLUZIONE: 'bg-amber-100 text-amber-700',
      RISOLTO: 'bg-emerald-100 text-emerald-700',
    };
    return <span className={`badge ${map[stato]}`}>{stato.replace('_',' ')}</span>;
  }

  return (
    <>
      <Navbar user={user} />
      <main className="container py-8">
        <div className="card">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-bold">Pannello Admin</h1>
            <button onClick={load} className="btn">Aggiorna</button>
          </div>

          {loading ? <p className="mt-6">Caricamento…</p> : (
            <div className="mt-6 overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="text-left text-gray-500">
                    <th className="py-2 pr-4">ID</th>
                    <th className="py-2 pr-4">Cinema</th>
                    <th className="py-2 pr-4">Sala</th>
                    <th className="py-2 pr-4">Tipo</th>
                    <th className="py-2 pr-4">Urgenza</th>
                    <th className="py-2 pr-4">Stato</th>
                    <th className="py-2 pr-4">Creato</th>
                    <th className="py-2 pr-4">Azioni</th>
                  </tr>
                </thead>
                <tbody>
                  {tickets.map(t => (
                    <tr key={t.id} className="border-t border-gray-200 dark:border-gray-700">
                      <td className="py-2 pr-4">{t.id}</td>
                      <td className="py-2 pr-4 font-medium">{t.cinema}</td>
                      <td className="py-2 pr-4">{t.sala}</td>
                      <td className="py-2 pr-4">{t.tipo}</td>
                      <td className="py-2 pr-4">{t.urgenza}</td>
                      <td className="py-2 pr-4"><Badge stato={t.stato} /></td>
                      <td className="py-2 pr-4">{new Date(t.createdAt).toLocaleString()}</td>
                      <td className="py-2 pr-4 flex gap-2">
                        <select className="select" value={t.stato} onChange={e=>changeStatus(t.id, e.target.value)}>
                          <option value="NON_RISOLTO">Non risolto</option>
                          <option value="IN_RISOLUZIONE">In via di risoluzione</option>
                          <option value="RISOLTO">Risolto</option>
                        </select>
                        <button className="btn btn-danger" onClick={()=>del(t.id)}>Elimina</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </>
  );
}
