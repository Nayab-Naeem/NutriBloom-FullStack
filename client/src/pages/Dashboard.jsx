import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { supabase } from '../lib/supabase';
import GrowthAnimation from '../components/modes/GrowthAnimation';
import AIFoodLogger from '../components/AIFoodLogger';
import DashboardFoodCard from '../components/DashboardFoodcard';
import AIMealSuggester from '../components/AIMealSuggester';
import Navbar from '../components/layout/Navbar';

function Dashboard() {
  const [foodItems, setFoodItems] = useState([]);
  const [calorieGoal, setCalorieGoal] = useState(2000);
  const [isEditingGoal, setIsEditingGoal] = useState(false);
  const [newGoalInput, setNewGoalInput] = useState(2000);
  const [savingGoal, setSavingGoal] = useState(false);
  const [loading, setLoading] = useState(true);

  // Today's Date String for Supabase query
  const todayDate = new Date().toISOString().split('T')[0];

  // Calculate total calories eaten today
  const caloriesEaten = foodItems.reduce(
    (sum, item) => sum + (Number(item.calories) || 0),
    0
  );

  const progress = Math.min(caloriesEaten / calorieGoal, 1);
  const percentage = Math.round(progress * 100);

  const [mode, setMode] = useState(
    document.documentElement.getAttribute('data-mode') || 'light'
  );

  // Fetch today's food logs and target goal
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        // 1. Fetch today's food logs
        const { data: logs } = await supabase
          .from('food_logs')
          .select('*')
          .eq('logged_date', todayDate)
          .order('created_at', { ascending: false });

        if (logs) setFoodItems(logs);

        // 2. Fetch user's custom daily calorie goal
        const { data: profile } = await supabase
          .from('profiles')
          .select('daily_calorie_goal')
          .eq('id', user.id)
          .single();

        if (profile?.daily_calorie_goal) {
          setCalorieGoal(profile.daily_calorie_goal);
          setNewGoalInput(profile.daily_calorie_goal);
        }
      } catch (err) {
        console.error('Error loading dashboard data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [todayDate]);

  // Handle theme mode changes
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

  // 🎯 Save updated calorie target to Supabase
  const handleSaveGoal = async (e) => {
    e.preventDefault();
    setSavingGoal(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();

      const { error } = await supabase
        .from('profiles')
        .upsert({
          id: user.id,
          daily_calorie_goal: Number(newGoalInput),
          updated_at: new Date().toISOString(),
        });

      if (!error) {
        setCalorieGoal(Number(newGoalInput));
        setIsEditingGoal(false);
      }
    } catch (err) {
      console.error('Failed to save goal:', err);
    } finally {
      setSavingGoal(false);
    }
  };

  const handleLogSuccess = (newFoodItem) => {
    if (!newFoodItem) return;
    setFoodItems((prev) => [newFoodItem, ...prev]);
  };

  const handleDeleteFood = async (id) => {
    try {
      const { error } = await supabase.from('food_logs').delete().eq('id', id);
      if (!error) {
        setFoodItems((prev) => prev.filter((food) => food.id !== id));
      }
    } catch (err) {
      console.error('Delete error:', err);
    }
  };

  return (
    <div className="min-h-screen text-white">
      <Navbar />

      {/* Main Content */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-8">

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
          
          {/* Left Side - Growth Animation */}
          <div className="flex flex-col items-center">
            <h2 className="text-xl font-semibold mb-2 text-white/80">Today's Growth</h2>
            <p className="text-sm text-white/50 mb-6">{percentage}% of daily goal</p>

            <GrowthAnimation progress={progress} mode={mode} />
          </div>

          {/* Right Side - Stats + Goal Setting */}
          <div className="space-y-8">
            <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
              
              {/* Header with Edit Goal Trigger */}
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-white/80">Today's Calories</h3>
                <button
                  onClick={() => setIsEditingGoal(!isEditingGoal)}
                  className="text-xs text-strong-cyan hover:underline font-medium"
                >
                  {isEditingGoal ? 'Cancel' : '⚙️ Set Target Goal'}
                </button>
              </div>

              {/* 🎯 EDIT GOAL INPUT FORM */}
              {isEditingGoal && (
                <form onSubmit={handleSaveGoal} className="mb-4 p-3 bg-black/40 border border-strong-cyan/30 rounded-xl flex flex-col sm:flex-row sm:items-center gap-2">
                  <span className="text-xs text-white/70">Target:</span>
                  <input
                    type="number"
                    value={newGoalInput}
                    onChange={(e) => setNewGoalInput(e.target.value)}
                    className="w-full min-w-0 flex-1 bg-white/10 px-3 py-1.5 rounded-lg text-sm text-white focus:outline-none focus:ring-1 focus:ring-strong-cyan"
                    placeholder="e.g. 2200"
                    required
                  />
                  <button
                    type="submit"
                    disabled={savingGoal}
                    className="w-full sm:w-auto bg-strong-cyan text-black font-bold px-3 py-1.5 rounded-lg text-xs hover:bg-opacity-80 transition"
                  >
                    {savingGoal ? 'Saving...' : 'Save'}
                  </button>
                </form>
              )}

              <div className="flex justify-between items-end mb-3">
                <div>
                  <p className="text-4xl font-bold text-strong-cyan">{caloriesEaten}</p>
                  <p className="text-white/50 text-sm">eaten</p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-semibold text-white/70">{calorieGoal}</p>
                  <p className="text-white/50 text-sm">target goal</p>
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

            {/* AI Food Logger */}
            <AIFoodLogger onLogSuccess={handleLogSuccess} />
          </div>
        </div>

        {/* AI Next Food Recommendation */}
        <AIMealSuggester 
          foodLogs={foodItems} 
          dailyGoals={{ calories: calorieGoal, protein: 150, carbs: 200, fat: 65 }}
          onMealLogged={handleLogSuccess}
        />

        {/* Food Log Grid */}
        <section className="mt-12">
          <div className="flex items-end justify-between gap-4 mb-5">
            <div>
              <h2 className="text-xl font-semibold text-white/90">AI Food Log</h2>
              <p className="text-sm text-white/50 mt-1">
                Meals analyzed today: {foodItems.length}
              </p>
            </div>
          </div>

          {loading ? (
            <div className="border border-dashed border-white/20 rounded-2xl p-8 text-center text-white/50">
              Loading today's food logs...
            </div>
          ) : foodItems.length === 0 ? (
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