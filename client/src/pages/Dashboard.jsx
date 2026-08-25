import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { logout } from '../lib/auth';
import GrowthAnimation from '../components/modes/GrowthAnimation';
function Dashboard() {
  // Temporary local state (later we will get this from Supabase)
  const [caloriesEaten, setCaloriesEaten] = useState(850);
  const calorieGoal = 2000;
  const [foodInput, setFoodInput] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');


  const progress = Math.min(caloriesEaten / calorieGoal, 1); // 0 to 1
  const percentage = Math.round(progress * 100);
   const [mode, setMode] = useState(
  document.documentElement.getAttribute('data-mode') || 'forest'
);

  useEffect(() => {
    const handleModeChange = () => {
      setMode(document.documentElement.getAttribute('data-mode') || 'forest');
    };

    const observer = new MutationObserver(handleModeChange);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-mode'],
    });

    return () => observer.disconnect();
  }, []);

  const changeMode = (nextMode) => {
    document.documentElement.setAttribute('data-mode', nextMode);
    setMode(nextMode);
  };

  const handleLogout = async () => {
    await logout();
    window.location.href = '/';
  };

  const handleAddMeal = async (e) => {
  e.preventDefault();
  if (!foodInput.trim()) return;

  setLoading(true);
  setError('');

  try {
    const response = await fetch('http://localhost:5000/api/estimate-calories', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ description: foodInput }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Something went wrong');
    }

    // Add real calories from AI
    setCaloriesEaten((prev) => prev + data.calories);
    setFoodInput('');
    
    console.log('AI Result:', data); // for testing
  } catch (err) {
    console.error(err);
    setError(err.message || 'Failed to estimate calories');
  } finally {
    setLoading(false);
  }
};

  return (
    <div className="min-h-screen text-white">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-4 border-b border-white/10">
        <h1 className="text-2xl font-bold text-strong-cyan">NutriBloom</h1>

        <div className="flex items-center gap-3">
          {/* Mode Switcher */}
          <div className="flex gap-1 bg-black/30 p-1 rounded-lg text-sm">
            <button
              onClick={() => changeMode('forest')}
              className="px-3 py-1.5 rounded-md hover:bg-white/10 transition"
            >
              Forest
            </button>
            <button
              onClick={() => changeMode('ocean')}
              className="px-3 py-1.5 rounded-md hover:bg-white/10 transition"
            >
              Ocean
            </button>
            <button
              onClick={() => changeMode('cosmic')}
              className="px-3 py-1.5 rounded-md hover:bg-white/10 transition"
            >
              Cosmic
            </button>
          </div>

          <button
            onClick={handleLogout}
            className="px-4 py-2 rounded-lg bg-red-500/20 border border-red-500/40 text-red-300 hover:bg-red-500/30 transition text-sm font-medium"
          >
            Logout
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-5xl mx-auto px-6 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
          
     {/* Left Side - Growth Animation */}
<div className="flex flex-col items-center">
  <h2 className="text-xl font-semibold mb-2 text-white/80">Today's Growth</h2>
  <p className="text-sm text-white/50 mb-6">{percentage}% of daily goal</p>

  <GrowthAnimation progress={progress} mode={mode} />
</div>

          {/* Right Side - Stats + Add Meal */}
          <div className="space-y-8">
            {/* Calorie Stats */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
              <h3 className="text-lg font-medium mb-4 text-white/80">Today's Calories</h3>

              <div className="flex justify-between items-end mb-3">
                <div>
                  <p className="text-4xl font-bold text-strong-cyan">{caloriesEaten}</p>
                  <p className="text-white/50 text-sm">eaten</p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-semibold text-white/70">{calorieGoal}</p>
                  <p className="text-white/50 text-sm">goal</p>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="w-full h-3 bg-white/10 rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-strong-cyan rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${percentage}%` }}
                  transition={{ duration: 0.8, ease: 'easeOut' }}
                />
              </div>
            </div>
{/* Add Meal Form */}
<div className="bg-white/5 border border-white/10 rounded-2xl p-6">
  <h3 className="text-lg font-medium mb-4 text-white/80">Add Meal</h3>

  {error && (
    <div className="mb-4 p-3 rounded-lg bg-red-500/20 border border-red-500/40 text-red-300 text-sm">
      {error}
    </div>
  )}

  <form onSubmit={handleAddMeal} className="space-y-4">
    <input
      type="text"
      value={foodInput}
      onChange={(e) => setFoodInput(e.target.value)}
      placeholder="What did you eat? (e.g. 2 eggs and toast)"
      className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 focus:outline-none focus:border-strong-cyan transition"
      disabled={loading}
    />

    <button
      type="submit"
      disabled={loading}
      className="w-full py-3 rounded-xl bg-strong-cyan text-charcoal-blue font-semibold hover:bg-strong-cyan/90 transition disabled:opacity-60"
    >
      {loading ? 'Calculating...' : 'Add Meal'}
    </button>
  </form>

  <p className="text-xs text-white/40 mt-3">
    Powered by Google Gemini AI
  </p>
</div>
        </div>
        </div>
      </main>
    </div>
  );
}

export default Dashboard;