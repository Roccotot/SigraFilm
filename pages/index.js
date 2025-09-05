import Navbar from "../components/Navbar";
import { getUserFromReq } from "../lib/auth";

export async function getServerSideProps({ req }) {
  const user = getUserFromReq(req);
  return { props: { user: user || null } };
}

export default function Home({ user }) {
  return (
    <>
      <Navbar user={user} />
      <main className="container py-10">
        <div className="card">
          <h1 className="text-2xl font-bold mb-2">Sigra Film</h1>
          <p className="text-gray-600 dark:text-gray-300">
            Installazione e manutenzione cinema – proiettori e impianti audio.
          </p>
          <ul className="mt-6 list-disc pl-5 space-y-2">
            <li>Accesso cinema per inviare segnalazioni.</li>
            <li>Pannello amministratore per gestione ticket.</li>
          </ul>
          <div className="mt-6 flex gap-3">
            <a href="/segnala" className="btn btn-primary">Segnala un problema</a>
            {user?.role === 'admin' && (
              <a href="/admin" className="btn">Vai all'admin</a>
            )}
          </div>
        </div>
      </main>
    </>
  );
}
