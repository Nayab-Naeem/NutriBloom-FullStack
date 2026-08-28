import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { useState, useEffect } from 'react';
import Login from './pages/Login';
import Signup from './pages/Signup';
import ProtectedRoute from './components/ProtectedRoute';
import Dashboard from './pages/Dashboard';
import History from './pages/History';

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
          <Route
            path="/history"
            element={
              <ProtectedRoute>
                <History />
              </ProtectedRoute>
            }
          />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;