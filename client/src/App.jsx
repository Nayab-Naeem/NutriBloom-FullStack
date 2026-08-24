import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { useState, useEffect } from 'react';
import Login from './pages/Login';
import Signup from './pages/Signup';
import ProtectedRoute from './components/ProtectedRoute';
import { logout } from './lib/auth';

function Dashboard() {
  const handleLogout = async () => {
    await logout();
    window.location.href = '/';
  };

  return (
    <div className="min-h-screen text-white">
      {/* Top Header */}
      <header className="flex items-center justify-between px-6 py-4 border-b border-white/10">
        <h1 className="text-2xl font-bold text-strong-cyan">NutriBloom</h1>

        <div className="flex items-center gap-3">
          {/* Mode Switcher */}
          <div className="flex gap-1 bg-black/30 p-1 rounded-lg">
            <button
              onClick={() => document.documentElement.setAttribute('data-mode', 'forest')}
              className="px-3 py-1.5 text-sm rounded-md hover:bg-white/10 transition"
            >
              Forest
            </button>
            <button
              onClick={() => document.documentElement.setAttribute('data-mode', 'ocean')}
              className="px-3 py-1.5 text-sm rounded-md hover:bg-white/10 transition"
            >
              Ocean
            </button>
            <button
              onClick={() => document.documentElement.setAttribute('data-mode', 'cosmic')}
              className="px-3 py-1.5 text-sm rounded-md hover:bg-white/10 transition"
            >
              Cosmic
            </button>
          </div>

          {/* Logout Button */}
          <button
            onClick={handleLogout}
            className="px-4 py-2 rounded-lg bg-red-500/20 border border-red-500/40 text-red-300 hover:bg-red-500/30 transition text-sm font-medium"
          >
            Logout
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="p-6">
        <div className="text-center mt-20">
          <h2 className="text-2xl font-semibold mb-3">Welcome to your Dashboard!</h2>
          <p className="text-white/60">
            We will build the calorie tracker and growth animation here next.
          </p>
        </div>
      </main>
    </div>
  );
}

function App() {
  const [mode, setMode] = useState(() => {
    return localStorage.getItem('nutribloom-mode') || 'forest';
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-mode', mode);
    localStorage.setItem('nutribloom-mode', mode);
  }, [mode]);

  // Sync mode when buttons are clicked inside Dashboard
  useEffect(() => {
    const observer = new MutationObserver(() => {
      const currentMode = document.documentElement.getAttribute('data-mode');
      if (currentMode && currentMode !== mode) {
        setMode(currentMode);
      }
    });

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-mode'],
    });

    return () => observer.disconnect();
  }, [mode]);

  return (
    <BrowserRouter>
      <div className="min-h-screen">
        <Routes>
          <Route path="/" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;