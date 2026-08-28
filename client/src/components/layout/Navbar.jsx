import { Link, useLocation } from 'react-router-dom';
import { logout } from '../../lib/auth';

const modes = ['forest', 'ocean', 'cosmic'];

export default function Navbar() {
  const location = useLocation();

  const changeMode = (nextMode) => {
    document.documentElement.setAttribute('data-mode', nextMode);
  };

  const handleLogout = async () => {
    await logout();
    window.location.href = '/';
  };

  return (
    <header className="flex flex-col gap-4 border-b border-white/10 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
      <div className="flex items-center justify-between gap-6">
        <Link to="/dashboard" className="text-2xl font-bold text-strong-cyan">
          NutriBloom
        </Link>
        <nav className="flex items-center gap-1 rounded-lg bg-black/30 p-1 text-sm" aria-label="Main navigation">
          <Link
            to="/dashboard"
            className={`rounded-md px-3 py-1.5 transition hover:bg-white/10 ${location.pathname === '/dashboard' ? 'bg-white/10 text-strong-cyan' : 'text-white/70'}`}
          >
            Dashboard
          </Link>
          <Link
            to="/history"
            className={`rounded-md px-3 py-1.5 transition hover:bg-white/10 ${location.pathname === '/history' ? 'bg-white/10 text-strong-cyan' : 'text-white/70'}`}
          >
            History
          </Link>
        </nav>
      </div>

      <div className="flex w-full items-center gap-2 sm:w-auto sm:gap-3">
        <div className="flex flex-1 gap-1 rounded-lg bg-black/30 p-1 text-sm sm:flex-none">
          {modes.map((mode) => (
            <button
              key={mode}
              type="button"
              onClick={() => changeMode(mode)}
              className="flex-1 rounded-md px-2 py-1.5 capitalize transition hover:bg-white/10 sm:px-3"
            >
              {mode}
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={handleLogout}
          className="shrink-0 rounded-lg border border-red-500/40 bg-red-500/20 px-3 py-2 text-sm font-medium text-red-300 transition hover:bg-red-500/30 sm:px-4"
        >
          Logout
        </button>
      </div>
    </header>
  );
}
