import { Link, useLocation } from 'react-router-dom';

export default function Navbar() {
  const location = useLocation();

  return (
    <header className="flex flex-col gap-4 border-b border-white/10 px-3 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
      <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-center sm:gap-6">
        <Link to="/dashboard" className="text-xl font-bold text-strong-cyan sm:text-2xl">
          NutriBloom
        </Link>
        <nav className="flex w-full items-center gap-1 rounded-lg bg-black/30 p-1 text-sm sm:w-auto" aria-label="Main navigation">
          <Link
            to="/dashboard"
            className={`flex-1 rounded-md px-2 py-1.5 text-center transition hover:bg-white/10 sm:flex-none sm:px-3 ${location.pathname === '/dashboard' ? 'bg-white/10 text-strong-cyan' : 'text-white/70'}`}
          >
            Dashboard
          </Link>
          <Link
            to="/history"
            className={`flex-1 rounded-md px-2 py-1.5 text-center transition hover:bg-white/10 sm:flex-none sm:px-3 ${location.pathname === '/history' ? 'bg-white/10 text-strong-cyan' : 'text-white/70'}`}
          >
            History
          </Link>
          <Link
            to="/settings"
            className={`flex-1 rounded-md px-2 py-1.5 text-center transition hover:bg-white/10 sm:flex-none sm:px-3 ${location.pathname === '/settings' ? 'bg-white/10 text-strong-cyan' : 'text-white/70'}`}
          >
            Settings
          </Link>
        </nav>
      </div>
    </header>
  );
}
