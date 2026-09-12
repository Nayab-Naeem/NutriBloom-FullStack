import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { supabase } from '../lib/supabase';
import Navbar from '../components/layout/Navbar';
import { getLocalDateKey } from '../utils/date';

const defaultGoals = {
  calorie_goal: 2000,
  protein_goal: 150,
  carbs_goal: 200,
  fat_goal: 65,
  goal: 'maintain',
};

const getWeekStart = () => {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  const day = date.getDay();
  date.setDate(date.getDate() - (day === 0 ? 6 : day - 1));
  return date;
};

const formatDay = (date) =>
  new Intl.DateTimeFormat('en-US', {
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
  const weekDays = useMemo(
    () =>
      Array.from({ length: 7 }, (_, index) => {
        const date = new Date(weekStart);
        date.setDate(weekStart.getDate() + index);
        return date;
      }),
    [weekStart]
  );
  const todayKey = getLocalDateKey();
  const weekEndKey = getLocalDateKey(weekDays[6]);
  const weekLabel = `${formatDay(weekDays[0])} - ${formatDay(weekDays[6])}`;

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        setLoading(true);
        setError('');
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) return;

        const [{ data: foodLogs, error: logsError }, { data: profile, error: profileError }] =
          await Promise.all([
            supabase
              .from('food_logs')
              .select('*')
              .eq('user_id', user.id)
              .gte('logged_date', getLocalDateKey(weekStart))
              .lte('logged_date', weekEndKey),
            supabase
              .from('profiles')
              .select('calorie_goal, protein_goal, carbs_goal, fat_goal, goal')
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
    const dateKey = getLocalDateKey(date);
    const dayLogs = logs.filter((log) => log.logged_date === dateKey);
    const totals = dayLogs.reduce(
      (result, log) => ({
        calories: result.calories + (Number(log.calories) || 0),
        protein: result.protein + (Number(log.protein) || 0),
        carbs: result.carbs + (Number(log.carbs) || 0),
        fat: result.fat + (Number(log.fat) || 0),
      }),
      { calories: 0, protein: 0, carbs: 0, fat: 0 }
    );
    const isFuture = dateKey > todayKey;
    const achieved = !isFuture && totals.calories >= Number(goals.calorie_goal);

    return { date, dateKey, totals, achieved, isFuture, mealCount: dayLogs.length };
  });

  const completedDays = dailyHistory.filter((day) => !day.isFuture);
  const achievedDays = completedDays.filter((day) => day.achieved).length;

  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="mx-auto w-full max-w-5xl px-4 py-6 sm:px-6 sm:py-10">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="mb-8"
        >
          <p className="mb-2 text-xs font-medium uppercase tracking-[0.2em] text-strong-cyan">
            Your rhythm
          </p>
          <div className="flex min-w-0 flex-col justify-between gap-4 sm:flex-row sm:items-end">
            <div className="min-w-0">
              <h1 className="text-3xl font-bold nb-section-title sm:text-4xl">Weekly History</h1>
              <p className="mt-2 break-words nb-muted text-sm">{weekLabel}</p>
            </div>
            <div className="w-full rounded-xl border border-[var(--border-color)] bg-[var(--bg-card)] px-4 py-3 text-left sm:w-auto sm:min-w-32 sm:text-right">
              <p className="text-2xl font-bold text-strong-cyan">
                {achievedDays}/{completedDays.length}
              </p>
              <p className="text-xs uppercase tracking-wider nb-muted">days achieved</p>
            </div>
          </div>
        </motion.div>

        {error && (
          <div className="mb-6 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-400">
            {error}
          </div>
        )}

        {loading ? (
          <div className="rounded-2xl border border-dashed border-[var(--border-strong)] p-10 text-center nb-muted text-sm">
            Loading your week...
          </div>
        ) : (
          <section className="grid gap-4 md:grid-cols-2">
            {dailyHistory.map((day, index) => {
              const caloriePercent = Math.min(
                100,
                Math.round((day.totals.calories / Number(goals.calorie_goal)) * 100)
              );
              return (
                <motion.article
                  key={day.dateKey}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.03 }}
                  className="nb-card min-w-0 p-4 sm:p-5"
                >
                  <div className="mb-4 flex min-w-0 items-start justify-between gap-2 sm:gap-3">
                    <div className="min-w-0">
                      <h2 className="font-semibold nb-section-title">{formatDay(day.date)}</h2>
                      <p className="mt-1 text-xs nb-muted">
                        {day.mealCount} {day.mealCount === 1 ? 'meal' : 'meals'} logged
                      </p>
                    </div>
                    <span
                      className={`shrink-0 rounded-full px-2.5 py-1 text-center text-[11px] font-semibold sm:text-xs ${
                        day.isFuture
                          ? 'bg-[var(--bg-overlay)] nb-muted'
                          : day.achieved
                            ? 'bg-emerald-400/15 text-emerald-600'
                            : 'bg-honey-bronze/15 text-honey-bronze'
                      }`}
                    >
                      {day.isFuture ? 'Upcoming' : day.achieved ? 'Achieved' : 'Not achieved'}
                    </span>
                  </div>

                  <div className="mb-3 flex min-w-0 items-end justify-between gap-3">
                    <div>
                      <p className="text-3xl font-bold text-strong-cyan tracking-tight">
                        {day.totals.calories}
                      </p>
                      <p className="text-xs nb-muted">of {goals.calorie_goal} kcal</p>
                    </div>
                    <p className="text-sm font-semibold nb-muted">{caloriePercent}%</p>
                  </div>

                  <div className="mb-4 h-2 nb-progress-track">
                    <div
                      className="h-full rounded-full bg-strong-cyan transition-all"
                      style={{ width: `${caloriePercent}%` }}
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-1 border-t border-[var(--border-color)] pt-4 text-center text-xs sm:gap-2">
                    <div>
                      <p className="nb-muted">Protein</p>
                      <p className="mt-1 font-semibold text-[var(--text-primary)]">
                        {Math.round(day.totals.protein)}g
                      </p>
                    </div>
                    <div>
                      <p className="nb-muted">Carbs</p>
                      <p className="mt-1 font-semibold text-[var(--text-primary)]">
                        {Math.round(day.totals.carbs)}g
                      </p>
                    </div>
                    <div>
                      <p className="nb-muted">Fat</p>
                      <p className="mt-1 font-semibold text-[var(--text-primary)]">
                        {Math.round(day.totals.fat)}g
                      </p>
                    </div>
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
