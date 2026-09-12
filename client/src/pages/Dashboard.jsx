import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { supabase } from '../lib/supabase';
import GrowthAnimation from '../components/modes/GrowthAnimation';
import AIFoodLogger from '../components/AIFoodLogger';
import DashboardFoodCard from '../components/DashboardFoodCard';
import AIMealSuggester from '../components/AIMealSuggester';
import Navbar from '../components/layout/Navbar';
import OnboardingModal from '../components/OnBoardingModal';
import WeightGainComponent from '../components/WeightGainComponent';
import WeightLossComponent from '../components/WeightLossComponent';
import WeightMaintainComponent from '../components/WeightMaintainComponent';
import { getLocalDateKey } from '../utils/date';

function Dashboard() {
  const [foodItems, setFoodItems] = useState([]);
  const [calorieGoal, setCalorieGoal] = useState(2000);
  const [loading, setLoading] = useState(true);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [userGoal, setUserGoal] = useState('maintain');
  const [user, setUser] = useState(null);
  const [userWeight, setUserWeight] = useState(0);
  const [macros, setMacros] = useState({ protein: 150, carbs: 250, fat: 75 });

  const todayDate = getLocalDateKey();

  const caloriesEaten = foodItems.reduce(
    (sum, item) => sum + (Number(item.calories) || 0),
    0
  );

  const progress = Math.min(caloriesEaten / calorieGoal, 1);
  const percentage = Math.round(progress * 100);

  const proteinEaten = foodItems.reduce(
    (sum, item) => sum + (Number(item.protein) || 0),
    0
  );

  const carbsEaten = foodItems.reduce(
    (sum, item) => sum + (Number(item.carbs) || 0),
    0
  );

  const fatEaten = foodItems.reduce(
    (sum, item) => sum + (Number(item.fat) || 0),
    0
  );

  const proteinPercentage = Math.min(
    100,
    Math.round((proteinEaten / macros.protein) * 100)
  );

  const carbsPercentage = Math.min(
    100,
    Math.round((carbsEaten / macros.carbs) * 100)
  );

  const fatPercentage = Math.min(
    100,
    Math.round((fatEaten / macros.fat) * 100)
  );

  const [mode, setMode] = useState(
    document.documentElement.getAttribute('data-mode') || 'light'
  );

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) return;

        setUser(user);

        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();

        if (!profile || !profile.is_profile_complete) {
          setShowOnboarding(true);
        } else {
          setUserGoal(profile.goal || 'maintain');
          setUserWeight(profile.weight_kg || 0);
          setCalorieGoal(Number(profile.calorie_goal) || 2000);
          setMacros({
            protein: Number(profile.protein_goal) || 150,
            carbs: Number(profile.carbs_goal) || 250,
            fat: Number(profile.fat_goal) || 75,
          });
        }

        const { data: logs } = await supabase
          .from('food_logs')
          .select('*')
          .eq('user_id', user.id)
          .eq('logged_date', todayDate)
          .order('created_at', { ascending: false });

        if (logs) setFoodItems(logs);
      } catch (err) {
        console.error('Error loading dashboard data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [todayDate]);

  useEffect(() => {
    const handleModeChange = () => {
      setMode(document.documentElement.getAttribute('data-mode') || 'light');
    };

    const observer = new MutationObserver(handleModeChange);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-mode'],
    });

    return () => observer.disconnect();
  }, []);

  const handleOnboardingComplete = async (goal) => {
    setUserGoal(goal);
    setShowOnboarding(false);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (profile && profile.weight_kg) {
        setUserWeight(profile.weight_kg);
        setCalorieGoal(Number(profile.calorie_goal) || 2000);
        setMacros({
          protein: Number(profile.protein_goal) || 150,
          carbs: Number(profile.carbs_goal) || 250,
          fat: Number(profile.fat_goal) || 75,
        });
      }
    } catch (err) {
      console.error('Error fetching updated profile:', err);
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
    <div className="min-h-screen">
      {showOnboarding && user && (
        <OnboardingModal user={user} onComplete={handleOnboardingComplete} />
      )}

      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <section className="mb-10">
          {loading ? (
            <div className="text-center nb-muted py-10 text-sm">Loading your dashboard...</div>
          ) : (
            <>
              {userGoal === 'gain' && (
                <WeightGainComponent calorieGoal={calorieGoal} macros={macros} />
              )}
              {userGoal === 'lose' && (
                <WeightLossComponent calorieGoal={calorieGoal} macros={macros} />
              )}
              {userGoal === 'maintain' && (
                <WeightMaintainComponent calorieGoal={calorieGoal} macros={macros} />
              )}
            </>
          )}
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-10 items-center">
          <div className="flex flex-col items-center">
            <h2 className="text-lg font-semibold nb-section-title mb-1">Today's Growth</h2>
            <p className="text-sm nb-muted mb-5">{percentage}% of daily goal</p>
            <GrowthAnimation progress={progress} mode={mode} />
          </div>

          <div className="space-y-6">
            <div className="nb-card p-5 sm:p-6">
              <h3 className="text-base font-semibold nb-section-title mb-4">Today's Calories</h3>

              <div className="flex justify-between items-end mb-3">
                <div>
                  <p className="text-4xl font-bold text-strong-cyan tracking-tight">{caloriesEaten}</p>
                  <p className="nb-muted text-sm">eaten</p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-semibold text-[var(--text-primary)]">{calorieGoal}</p>
                  <p className="nb-muted text-sm">target goal</p>
                </div>
              </div>

              <div className="w-full h-3 nb-progress-track">
                <motion.div
                  className="h-full bg-strong-cyan rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${percentage}%` }}
                  transition={{ duration: 0.8, ease: 'easeOut' }}
                />
              </div>

              <div className="grid grid-cols-3 gap-3 mt-5">
                <div>
                  <div className="flex justify-between text-[10px] nb-muted mb-1.5">
                    <span>Protein</span>
                    <span>
                      {Math.round(proteinEaten)}g / {Math.round(macros.protein)}g
                    </span>
                  </div>
                  <div className="w-full h-1.5 nb-progress-track">
                    <motion.div
                      className="h-full bg-emerald-400 rounded-full"
                      initial={{ width: 0 }}
                      animate={{ width: `${proteinPercentage}%` }}
                      transition={{ duration: 0.6, ease: 'easeOut' }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-[10px] nb-muted mb-1.5">
                    <span>Carbs</span>
                    <span>
                      {Math.round(carbsEaten)}g / {Math.round(macros.carbs)}g
                    </span>
                  </div>
                  <div className="w-full h-1.5 nb-progress-track">
                    <motion.div
                      className="h-full bg-amber-400 rounded-full"
                      initial={{ width: 0 }}
                      animate={{ width: `${carbsPercentage}%` }}
                      transition={{ duration: 0.6, ease: 'easeOut' }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-[10px] nb-muted mb-1.5">
                    <span>Fat</span>
                    <span>
                      {Math.round(fatEaten)}g / {Math.round(macros.fat)}g
                    </span>
                  </div>
                  <div className="w-full h-1.5 nb-progress-track">
                    <motion.div
                      className="h-full bg-rose-400 rounded-full"
                      initial={{ width: 0 }}
                      animate={{ width: `${fatPercentage}%` }}
                      transition={{ duration: 0.6, ease: 'easeOut' }}
                    />
                  </div>
                </div>
              </div>
            </div>

            <AIFoodLogger onLogSuccess={handleLogSuccess} />
          </div>
        </div>

        <AIMealSuggester
          foodLogs={foodItems}
          dailyGoals={{
            calories: calorieGoal,
            protein: macros.protein,
            carbs: macros.carbs,
            fat: macros.fat,
          }}
          goal={userGoal}
          onMealLogged={handleLogSuccess}
        />

        <section className="mt-10">
          <div className="mb-5">
            <h2 className="text-lg font-semibold nb-section-title">AI Food Log</h2>
            <p className="text-sm nb-muted mt-1">
              Meals analyzed today: {foodItems.length}
            </p>
          </div>

          {loading ? (
            <div className="border border-dashed border-[var(--border-strong)] rounded-2xl p-8 text-center nb-muted text-sm">
              Loading today's food logs...
            </div>
          ) : foodItems.length === 0 ? (
            <div className="border border-dashed border-[var(--border-strong)] rounded-2xl p-8 text-center nb-muted text-sm">
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
