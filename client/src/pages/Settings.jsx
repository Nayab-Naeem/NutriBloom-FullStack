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
    <div className="min-h-screen text-white">
      <Navbar />
      <main className="mx-auto w-full max-w-3xl px-3 py-6 sm:px-6 sm:py-10">
        <div className="mb-8">
          <p className="mb-2 text-sm font-medium uppercase tracking-[0.2em] text-strong-cyan">Personalize your space</p>
          <h1 className="text-3xl font-bold text-white/95 sm:text-4xl">Settings</h1>
          <p className="mt-2 text-white/55">Manage the way NutriBloom looks and your profile journey.</p>
        </div>

        {error && <div className="mb-6 rounded-xl border border-red-500/40 bg-red-500/15 p-4 text-sm text-red-200">{error}</div>}

        <section className="space-y-4">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-5 shadow-lg shadow-black/10 sm:p-6">
            <div className="mb-5">
              <h2 className="text-lg font-semibold text-white/90">Appearance</h2>
              <p className="mt-1 text-sm text-white/50">Choose your preferred color mode.</p>
            </div>
            <div className="grid grid-cols-2 gap-3" role="group" aria-label="Color mode">
              {modes.map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  type="button"
                  aria-pressed={mode === id}
                  onClick={() => changeMode(id)}
                  className={`flex min-h-12 items-center justify-center gap-2 rounded-xl border px-4 py-3 text-sm font-medium transition ${mode === id ? 'border-strong-cyan bg-strong-cyan/15 text-strong-cyan' : 'border-white/10 bg-white/5 text-white/70 hover:bg-white/10'}`}
                >
                  <Icon size={17} aria-hidden="true" />
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/5 p-5 shadow-lg shadow-black/10 sm:p-6">
            <div className="mb-5">
              <h2 className="text-lg font-semibold text-white/90">Profile</h2>
              <p className="mt-1 text-sm text-white/50">Start onboarding again to update your goals and nutrition targets.</p>
            </div>
            <button
              type="button"
              onClick={handleResetProfile}
              disabled={resetting}
              className="flex min-h-12 w-full items-center justify-center gap-2 rounded-xl border border-honey-bronze/50 bg-honey-bronze/10 px-4 py-3 text-sm font-medium text-honey-bronze transition hover:bg-honey-bronze/20 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
            >
              <RotateCcw size={17} aria-hidden="true" />
              {resetting ? 'Resetting profile...' : 'Reset Profile'}
            </button>
          </div>

          <div className="rounded-2xl border border-red-500/25 bg-red-500/5 p-5 shadow-lg shadow-black/10 sm:p-6">
            <div className="mb-5">
              <h2 className="text-lg font-semibold text-white/90">Account</h2>
              <p className="mt-1 text-sm text-white/50">Sign out of your NutriBloom account.</p>
            </div>
            <button
              type="button"
              onClick={handleLogout}
              className="flex min-h-12 w-full items-center justify-center gap-2 rounded-xl border border-red-500/40 bg-red-500/15 px-4 py-3 text-sm font-medium text-red-300 transition hover:bg-red-500/25 sm:w-auto"
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
