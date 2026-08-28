import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { supabase } from '../lib/supabase';
import Navbar from '../components/layout/Navbar';

const defaultGoals = {
  daily_calorie_goal: 2000,
  daily_protein_goal: 150,
  daily_carbs_goal: 200,
  daily_fat_goal: 65,
};

const getDateKey = (date) => date.toISOString().split('T')[0];

const getWeekStart = () => {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  const day = date.getDay();
  date.setDate(date.getDate() - (day === 0 ? 6 : day - 1));
  return date;
};

const formatDay = (date) => new Intl.DateTimeFormat('en-US', {
  weekday: 'short',
  month: 'short',
  day: 'numeric',
}).format(date);

function History() {
  const [logs, setLogs] = useState([]);
  const [goals, setGoals] = useState(defaultGoals);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const weekStart = useMemo(() => getWeekStart(), []);
  const weekDays = useMemo(() => Array.from({ length: 7 }, (_, index) => {
    const date = new Date(weekStart);
    date.setDate(weekStart.getDate() + index);
    return date;
  }), [weekStart]);
  const todayKey = getDateKey(new Date());
  const weekEndKey = getDateKey(weekDays[6]);
  const weekLabel = `${formatDay(weekDays[0])} - ${formatDay(weekDays[6])}`;

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        setLoading(true);
        setError('');
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const [{ data: foodLogs, error: logsError }, { data: profile, error: profileError }] = await Promise.all([
          supabase
            .from('food_logs')
            .select('*')
            .eq('user_id', user.id)
            .gte('logged_date', getDateKey(weekStart))
            .lte('logged_date', weekEndKey),
          supabase
            .from('profiles')
            .select('daily_calorie_goal, daily_protein_goal, daily_carbs_goal, daily_fat_goal')
            .eq('id', user.id)
            .single(),
        ]);

        if (logsError) throw logsError;
        if (profileError && profileError.code !== 'PGRST116') throw profileError;
        setLogs(foodLogs || []);
        setGoals({ ...defaultGoals, ...(profile || {}) });
      } catch (err) {
        console.error('Error loading history:', err);
        setError('We could not load your weekly history.');
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, [weekEndKey, weekStart]);

  const dailyHistory = weekDays.map((date) => {
    const dateKey = getDateKey(date);
    const dayLogs = logs.filter((log) => log.logged_date === dateKey);
    const totals = dayLogs.reduce((result, log) => ({
      calories: result.calories + (Number(log.calories) || 0),
      protein: result.protein + (Number(log.protein) || 0),
      carbs: result.carbs + (Number(log.carbs) || 0),
      fat: result.fat + (Number(log.fat) || 0),
    }), { calories: 0, protein: 0, carbs: 0, fat: 0 });
    const isFuture = dateKey > todayKey;
    const achieved = !isFuture && totals.calories >= Number(goals.daily_calorie_goal);

    return { date, dateKey, totals, achieved, isFuture, mealCount: dayLogs.length };
  });

  const completedDays = dailyHistory.filter((day) => !day.isFuture);
  const achievedDays = completedDays.filter((day) => day.achieved).length;

  return (
    <div className="min-h-screen text-white">
      <Navbar />
      <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6 sm:py-10">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45 }}
          className="mb-8"
        >
          <p className="mb-2 text-sm font-medium uppercase tracking-[0.2em] text-strong-cyan">Your rhythm</p>
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
            <div>
              <h1 className="text-3xl font-bold text-white/95 sm:text-4xl">Weekly History</h1>
              <p className="mt-2 text-white/55">{weekLabel}</p>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-left sm:text-right">
              <p className="text-2xl font-bold text-strong-cyan">{achievedDays}/{completedDays.length}</p>
              <p className="text-xs uppercase tracking-wider text-white/50">days achieved</p>
            </div>
          </div>
        </motion.div>

        {error && <div className="mb-6 rounded-xl border border-red-500/40 bg-red-500/15 p-4 text-sm text-red-200">{error}</div>}
        {loading ? (
          <div className="rounded-2xl border border-dashed border-white/20 p-10 text-center text-white/50">Loading your week...</div>
        ) : (
          <section className="grid gap-4 md:grid-cols-2">
            {dailyHistory.map((day, index) => {
              const caloriePercent = Math.min(100, Math.round((day.totals.calories / Number(goals.daily_calorie_goal)) * 100));
              return (
                <motion.article
                  key={day.dateKey}
                  initial={{ opacity: 0, y: 14 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.35, delay: index * 0.04 }}
                  className="rounded-2xl border border-white/10 bg-white/5 p-5 shadow-lg shadow-black/10"
                >
                  <div className="mb-5 flex items-start justify-between gap-3">
                    <div>
                      <h2 className="font-semibold text-white/90">{formatDay(day.date)}</h2>
                      <p className="mt-1 text-xs text-white/45">{day.mealCount} {day.mealCount === 1 ? 'meal' : 'meals'} logged</p>
                    </div>
                    <span className={`rounded-full px-3 py-1 text-xs font-semibold ${day.isFuture ? 'bg-white/10 text-white/50' : day.achieved ? 'bg-emerald-400/15 text-emerald-300' : 'bg-honey-bronze/15 text-honey-bronze'}`}>
                      {day.isFuture ? 'Upcoming' : day.achieved ? 'Achieved' : 'Not achieved'}
                    </span>
                  </div>

                  <div className="mb-4 flex items-end justify-between">
                    <div>
                      <p className="text-3xl font-bold text-strong-cyan">{day.totals.calories}</p>
                      <p className="text-xs text-white/45">of {goals.daily_calorie_goal} kcal</p>
                    </div>
                    <p className="text-sm font-semibold text-white/60">{caloriePercent}%</p>
                  </div>
                  <div className="mb-5 h-2 overflow-hidden rounded-full bg-white/10">
                    <div className="h-full rounded-full bg-strong-cyan transition-all" style={{ width: `${caloriePercent}%` }} />
                  </div>

                  <div className="grid grid-cols-3 gap-2 border-t border-white/10 pt-4 text-center text-xs">
                    <div><p className="text-white/40">Protein</p><p className="mt-1 font-semibold text-white/80">{Math.round(day.totals.protein)}g</p></div>
                    <div><p className="text-white/40">Carbs</p><p className="mt-1 font-semibold text-white/80">{Math.round(day.totals.carbs)}g</p></div>
                    <div><p className="text-white/40">Fat</p><p className="mt-1 font-semibold text-white/80">{Math.round(day.totals.fat)}g</p></div>
                  </div>
                </motion.article>
              );
            })}
          </section>
        )}
      </main>
    </div>
  );
}

export default History;
