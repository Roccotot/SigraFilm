import Link from "next/link";

export default function Navbar({ user }) {
  return (
    <header className="border-b border-gray-200 dark:border-gray-700">
      <div className="container flex items-center justify-between py-4">
        <Link href="/" className="text-xl font-bold">Sigra Film</Link>
        <nav className="flex items-center gap-4">
          <Link href="/segnala" className="hover:underline">Segnala problema</Link>
          {user?.role === 'admin' && (
            <Link href="/admin" className="hover:underline">Admin</Link>
          )}
          {user ? (
            <form method="post" action="/api/logout">
              <button className="btn">Logout</button>
            </form>
          ) : (
            <Link className="btn btn-primary" href="/login">Login</Link>
          )}
        </nav>
      </div>
    </header>
  );
}
