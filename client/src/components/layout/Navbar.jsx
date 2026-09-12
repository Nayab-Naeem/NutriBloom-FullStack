import { Link, useLocation } from 'react-router-dom';

export default function Navbar() {
  const location = useLocation();

  const linkClass = (path) =>
    `flex-1 rounded-lg px-3 py-2 text-center text-sm font-medium transition sm:flex-none ${
      location.pathname === path
        ? 'bg-[var(--bg-overlay)] text-strong-cyan shadow-sm'
        : 'text-[var(--text-muted)] hover:bg-[var(--bg-overlay)] hover:text-[var(--text-primary)]'
    }`;

  return (
    <header className="sticky top-0 z-40 border-b border-[var(--border-color)] bg-[var(--bg-primary)]/85 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-3.5 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-center sm:gap-6">
          <Link
            to="/dashboard"
            className="text-xl font-bold tracking-tight text-strong-cyan sm:text-2xl"
          >
            NutriBloom
          </Link>
          <nav
            className="flex w-full items-center gap-1 rounded-xl bg-[var(--bg-overlay)] p-1 sm:w-auto"
            aria-label="Main navigation"
          >
            <Link to="/dashboard" className={linkClass('/dashboard')}>
              Dashboard
            </Link>
            <Link to="/history" className={linkClass('/history')}>
              History
            </Link>
            <Link to="/settings" className={linkClass('/settings')}>
              Settings
            </Link>
          </nav>
        </div>
      </div>
    </header>
  );
}
