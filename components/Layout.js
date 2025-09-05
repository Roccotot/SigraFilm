import Link from "next/link";

export default function Layout({ children }) {
  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-indigo-700 text-white p-4 shadow-lg">
        <div className="container mx-auto flex justify-between items-center">
          <h1 className="text-xl font-bold">🎬 Sigra Film</h1>
          <nav className="space-x-4">
            <Link href="/">Home</Link>
            <Link href="/cinema">Cinema</Link>
            <Link href="/admin">Admin</Link>
          </nav>
        </div>
      </header>
      <main className="container mx-auto py-10 px-4">{children}</main>
      <footer className="bg-gray-800 text-white text-center py-4 mt-10">
        <p>© {new Date().getFullYear()} Sigra Film</p>
      </footer>
    </div>
  );
}
