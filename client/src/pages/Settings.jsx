import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Moon, RotateCcw, Sun, LogOut } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { logout } from '../lib/auth';
import Navbar from '../components/layout/Navbar';

const modes = [
  { id: 'light', label: 'Light', icon: Sun },
  { id: 'dark', label: 'Dark', icon: Moon },
];

function Settings() {
  const navigate = useNavigate();
  const [mode, setMode] = useState(() => (
    document.documentElement.getAttribute('data-mode') || 'light'
  ));
  const [resetting, setResetting] = useState(false);
  const [error, setError] = useState('');

  const changeMode = (nextMode) => {
    document.documentElement.setAttribute('data-mode', nextMode);
    localStorage.setItem('nutribloom-mode', nextMode);
    setMode(nextMode);
  };

  const handleResetProfile = async () => {
    if (!window.confirm('Reset your profile and complete onboarding again?')) return;

    setResetting(true);
    setError('');

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/');
        return;
      }

      const { error: resetError } = await supabase
        .from('profiles')
        .update({ is_profile_complete: false, updated_at: new Date().toISOString() })
        .eq('id', user.id);

      if (resetError) throw resetError;
      navigate('/dashboard');
    } catch (resetError) {
      console.error('Error resetting profile:', resetError);
      setError('We could not reset your profile. Please try again.');
    } finally {
      setResetting(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    window.location.href = '/';
  };

  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="mx-auto w-full max-w-3xl px-4 py-6 sm:px-6 sm:py-10">
        <div className="mb-8">
          <p className="mb-2 text-xs font-medium uppercase tracking-[0.2em] text-strong-cyan">Personalize your space</p>
          <h1 className="text-3xl font-bold nb-section-title sm:text-4xl">Settings</h1>
          <p className="mt-2 nb-muted text-sm">Manage the way NutriBloom looks and your profile journey.</p>
        </div>

        {error && (
          <div className="mb-6 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-400">
            {error}
          </div>
        )}

        <section className="space-y-4">
          <div className="nb-card p-5 sm:p-6">
            <div className="mb-5">
              <h2 className="text-base font-semibold nb-section-title">Appearance</h2>
              <p className="mt-1 text-sm nb-muted">Choose your preferred color mode.</p>
            </div>
            <div className="grid grid-cols-2 gap-3" role="group" aria-label="Color mode">
              {modes.map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  type="button"
                  aria-pressed={mode === id}
                  onClick={() => changeMode(id)}
                  className={`flex min-h-12 items-center justify-center gap-2 rounded-xl border px-4 py-3 text-sm font-medium transition ${
                    mode === id
                      ? 'border-strong-cyan bg-strong-cyan/15 text-strong-cyan'
                      : 'border-[var(--border-color)] bg-[var(--bg-overlay)] text-[var(--text-muted)] hover:bg-[var(--bg-card)]'
                  }`}
                >
                  <Icon size={17} aria-hidden="true" />
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div className="nb-card p-5 sm:p-6">
            <div className="mb-5">
              <h2 className="text-base font-semibold nb-section-title">Profile</h2>
              <p className="mt-1 text-sm nb-muted">Start onboarding again to update your goals and nutrition targets.</p>
            </div>
            <button
              type="button"
              onClick={handleResetProfile}
              disabled={resetting}
              className="flex min-h-12 w-full items-center justify-center gap-2 rounded-xl border border-honey-bronze/40 bg-honey-bronze/10 px-4 py-3 text-sm font-medium text-honey-bronze transition hover:bg-honey-bronze/20 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
            >
              <RotateCcw size={17} aria-hidden="true" />
              {resetting ? 'Resetting profile...' : 'Reset Profile'}
            </button>
          </div>

          <div className="nb-card p-5 sm:p-6 border-red-500/20">
            <div className="mb-5">
              <h2 className="text-base font-semibold nb-section-title">Account</h2>
              <p className="mt-1 text-sm nb-muted">Sign out of your NutriBloom account.</p>
            </div>
            <button
              type="button"
              onClick={handleLogout}
              className="flex min-h-12 w-full items-center justify-center gap-2 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm font-medium text-red-400 transition hover:bg-red-500/15 sm:w-auto"
            >
              <LogOut size={17} aria-hidden="true" />
              Logout
            </button>
          </div>
        </section>

        <Link to="/dashboard" className="mt-8 inline-flex text-sm font-medium text-strong-cyan hover:underline">
          Back to dashboard
        </Link>
      </main>
    </div>
  );
}

export default Settings;
