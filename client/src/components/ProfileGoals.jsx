import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export default function ProfileGoals({ onGoalsUpdated }) {
  const [goals, setGoals] = useState({
    daily_calorie_goal: 2000,
    daily_protein_goal: 150,
    daily_carbs_goal: 200,
    daily_fat_goal: 65,
  });
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState('');

  // Fetch current user goals from Supabase
  useEffect(() => {
    const fetchGoals = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (data) {
        setGoals(data);
      } else if (error && error.code === 'PGRST116') {
        // Profile doesn't exist yet, create default profile row
        await supabase.from('profiles').insert([{ id: user.id }]);
      }
    };

    fetchGoals();
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMsg('');

    try {
      const { data: { user } } = await supabase.auth.getUser();

      const { error } = await supabase
        .from('profiles')
        .upsert({
          id: user.id,
          ...goals,
          updated_at: new Date().toISOString(),
        });

      if (error) throw error;

      setMsg('Goals updated successfully!');
      if (onGoalsUpdated) onGoalsUpdated(goals);
    } catch (err) {
      setMsg('Failed to update goals.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm mb-6">
      <h3 className="text-md font-bold text-gray-800 mb-3">⚙️ Set Daily Targets</h3>
      {msg && <p className="text-xs text-emerald-600 font-semibold mb-2">{msg}</p>}

      <form onSubmit={handleSave} className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
        <div>
          <label className="block text-gray-500 font-medium mb-1">Calories (kcal)</label>
          <input
            type="number"
            value={goals.daily_calorie_goal}
            onChange={(e) => setGoals({ ...goals, daily_calorie_goal: Number(e.target.value) })}
            className="w-full p-2 border rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500"
          />
        </div>
        <div>
          <label className="block text-gray-500 font-medium mb-1">Protein (g)</label>
          <input
            type="number"
            value={goals.daily_protein_goal}
            onChange={(e) => setGoals({ ...goals, daily_protein_goal: Number(e.target.value) })}
            className="w-full p-2 border rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500"
          />
        </div>
        <div>
          <label className="block text-gray-500 font-medium mb-1">Carbs (g)</label>
          <input
            type="number"
            value={goals.daily_carbs_goal}
            onChange={(e) => setGoals({ ...goals, daily_carbs_goal: Number(e.target.value) })}
            className="w-full p-2 border rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500"
          />
        </div>
        <div>
          <label className="block text-gray-500 font-medium mb-1">Fats (g)</label>
          <input
            type="number"
            value={goals.daily_fat_goal}
            onChange={(e) => setGoals({ ...goals, daily_fat_goal: Number(e.target.value) })}
            className="w-full p-2 border rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500"
          />
        </div>

        <div className="col-span-2 md:col-span-4 flex justify-end mt-2">
          <button
            type="submit"
            disabled={loading}
            className="bg-emerald-600 text-white font-bold px-4 py-2 rounded-lg hover:bg-emerald-700 text-xs"
          >
            {loading ? 'Saving...' : 'Save Goals'}
          </button>
        </div>
      </form>
    </div>
  );
}