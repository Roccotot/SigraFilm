import { useState } from 'react';
import Navbar from "../components/Navbar";
import { getUserFromReq } from "../lib/auth";

export async function getServerSideProps({ req }) {
  const user = getUserFromReq(req);
  return { props: { user: user || null } };
}

export default function Login({ user }) {
  const [form, setForm] = useState({ username: '', password: '' });
  const [error, setError] = useState('');

  async function onSubmit(e) {
    e.preventDefault();
    setError('');
    const res = await fetch('/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });
    if (res.ok) window.location.href = '/';
    else setError((await res.json()).error || 'Errore di login');
  }

  return (
    <>
      <Navbar user={user} />
      <main className="container py-10">
        <div className="card max-w-md mx-auto">
          <h1 className="text-xl font-bold mb-4">Login</h1>
          <form onSubmit={onSubmit} className="space-y-4">
            <div>
              <label className="label">Nome utente</label>
              <input className="input" value={form.username} onChange={e=>setForm({...form, username:e.target.value})} required />
            </div>
            <div>
              <label className="label">Password</label>
              <input type="password" className="input" value={form.password} onChange={e=>setForm({...form, password:e.target.value})} required />
            </div>
            {error && <p className="text-rose-600 text-sm">{error}</p>}
            <button className="btn btn-primary w-full" type="submit">Accedi</button>
          </form>
        </div>
      </main>
    </>
  );
}
