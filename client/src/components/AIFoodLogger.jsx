import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { getLocalDateKey } from '../utils/date';

export default function AIFoodLogger({ onLogSuccess }) {
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleAiSubmit = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/estimate-calories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ description: input }),
      });
      const responseText = await res.text();
      let aiResponse;

      try {
        aiResponse = responseText ? JSON.parse(responseText) : {};
      } catch {
        throw new Error(`AI server returned an invalid response (${res.status})`);
      }

      if (!res.ok) throw new Error(aiResponse.error || 'Failed to estimate calories');

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('You must be signed in to log food');

      const { data: savedFood, error: saveError } = await supabase
        .from('food_logs')
        .insert([{
          user_id: user.id,
          logged_date: getLocalDateKey(),
          food_name: aiResponse.items?.join(', ') || input.trim(),
          calories: Number(aiResponse.calories) || 0,
          protein: Number(aiResponse.protein) || 0,
          carbs: Number(aiResponse.carbs) || 0,
          fat: Number(aiResponse.fat) || 0,
        }])
        .select()
        .single();

      if (saveError) throw saveError;

      onLogSuccess(savedFood);
      setInput('');
    } catch (err) {
      console.error('Error logging food:', err.message);
      setError(
        err instanceof TypeError && err.message === 'Failed to fetch'
          ? 'Cannot reach the AI server. Start the server with "npm start" from the server folder.'
          : err.message || 'Failed to estimate calories'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="nb-card p-5 sm:p-6">
      <div className="mb-4">
        <h3 className="text-lg font-semibold nb-section-title">AI Food Logger</h3>
        <p className="text-xs nb-muted mt-1">Describe a meal to estimate its nutrition.</p>
      </div>

      {error && (
        <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
          {error}
        </div>
      )}

      <form onSubmit={handleAiSubmit} className="flex flex-col sm:flex-row gap-2.5">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="e.g. 2 eggs and avocado toast"
          className="nb-input min-w-0 flex-1 px-4 py-3 text-sm"
          required
        />
        <button
          type="submit"
          disabled={loading}
          className="nb-btn-accent px-6 py-3 text-sm disabled:opacity-50"
        >
          {loading ? 'Analyzing...' : 'Log Food'}
        </button>
      </form>
    </div>
  );
}
