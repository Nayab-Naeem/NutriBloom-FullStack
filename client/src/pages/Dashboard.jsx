import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { logout } from '../lib/auth';
import GrowthAnimation from '../components/modes/GrowthAnimation';
import AIFoodLogger from '../components/AIFoodLogger';
import DashboardFoodCard from '../components/DashboardFoodcard';
import AIMealSuggester from '../components/AIMealSuggester';
function Dashboard() {
  // Temporary local state (later we will get this from Supabase)
  const [caloriesEaten, setCaloriesEaten] = useState(850);
  const calorieGoal = 2000;
  const [foodItems, setFoodItems] = useState([]);


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

  const handleLogSuccess = (foodItem) => {
    const itemWithId = {
      id: crypto.randomUUID(),
      ...foodItem,
    };

    setFoodItems((prev) => [itemWithId, ...prev]);
    setCaloriesEaten((prev) => prev + itemWithId.calories);
  };

  const handleDeleteFood = (id) => {
    setFoodItems((prev) => {
      const item = prev.find((food) => food.id === id);
      if (item) {
        setCaloriesEaten((calories) => Math.max(0, calories - item.calories));
      }
      return prev.filter((food) => food.id !== id);
    });
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
            <AIFoodLogger onLogSuccess={handleLogSuccess} />
        </div>
        </div>

           <AIMealSuggester 
          foodLogs={foodItems} 
        dailyGoals={{ calories: 2000, protein: 150, carbs: 200, fat: 65 }}
          onMealLogged={handleLogSuccess}
      />

        <section className="mt-12">
          <div className="flex items-end justify-between gap-4 mb-5">
            <div>
              <h2 className="text-xl font-semibold text-white/90">AI Food Log</h2>
              <p className="text-sm text-white/50 mt-1">
                Meals analyzed today: {foodItems.length}
              </p>
            </div>
          </div>

          {foodItems.length === 0 ? (
            <div className="border border-dashed border-white/20 rounded-2xl p-8 text-center text-white/50">
              Your analyzed meals will appear here.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {foodItems.map((foodItem) => (
                <DashboardFoodCard
                  key={foodItem.id}
                  foodItem={foodItem}
                  onDelete={handleDeleteFood}
                />
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

export default Dashboard;