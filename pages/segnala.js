import { useState } from 'react';
import Navbar from "../components/Navbar";
import { getUserFromReq } from "../lib/auth";

export async function getServerSideProps({ req }) {
  const user = getUserFromReq(req);
  if (!user) {
    return { redirect: { destination: '/login', permanent: false } };
  }
  return { props: { user } };
}

export default function Segnala({ user }) {
  const [form, setForm] = useState({
    cinema: '', sala: '', tipo: 'proiettore', descrizione: '', urgenza: 'media'
  });
  const [ok, setOk] = useState('');

  async function onSubmit(e) {
    e.preventDefault();
    setOk('');
    const res = await fetch('/api/tickets', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });
    if (res.ok) { setOk('Segnalazione inviata.'); setForm({...form, descrizione:''}); }
  }

  return (
    <>
      <Navbar user={user} />
      <main className="container py-10">
        <div className="card max-w-2xl mx-auto">
          <h1 className="text-xl font-bold mb-4">Nuova segnalazione</h1>
          <form onSubmit={onSubmit} className="grid grid-cols-1 gap-4">
            <div>
              <label className="label">Cinema</label>
              <input className="input" value={form.cinema} onChange={e=>setForm({...form, cinema:e.target.value})} required />
            </div>
            <div>
              <label className="label">Sala</label>
              <input className="input" value={form.sala} onChange={e=>setForm({...form, sala:e.target.value})} required />
            </div>
            <div>
              <label className="label">Tipo di problematica</label>
              <select className="select" value={form.tipo} onChange={e=>setForm({...form, tipo:e.target.value})}>
                <option value="proiettore">Proiettore</option>
                <option value="audio">Impianto audio</option>
                <option value="altro">Altro</option>
              </select>
            </div>
            <div>
              <label className="label">Descrizione del problema</label>
              <textarea className="input h-28" value={form.descrizione} onChange={e=>setForm({...form, descrizione:e.target.value})} required />
            </div>
            <div>
              <label className="label">Urgenza</label>
              <select className="select" value={form.urgenza} onChange={e=>setForm({...form, urgenza:e.target.value})}>
                <option value="bassa">Bassa</option>
                <option value="media">Media</option>
                <option value="alta">Alta</option>
              </select>
            </div>
            {ok && <p className="text-green-600 text-sm">{ok}</p>}
            <button className="btn btn-primary" type="submit">Invia</button>
          </form>
        </div>
      </main>
    </>
  );
}

