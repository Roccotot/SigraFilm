export default function Layout({ children }) {
  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      {/* Header */}
      <header className="bg-indigo-700 text-white p-4 shadow-lg">
        <div className="container mx-auto flex justify-between items-center">
          <h1 className="text-xl font-bold">🎬 Sigra Film</h1>
        </div>
      </header>

      {/* Main */}
      <main className="flex-grow container mx-auto py-10 px-4">
        {children}
      </main>

      {/* Footer */}
      <footer className="bg-gray-800 text-white text-center py-4">
        <p>© {new Date().getFullYear()} Sigra Film - Installazione & Manutenzione Cinema</p>
      </footer>
    </div>
  );
}
