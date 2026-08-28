import { useState } from 'react';

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

      onLogSuccess({
        food_name: aiResponse.items?.join(', ') || input.trim(),
        calories: Number(aiResponse.calories) || 0,
        protein: Number(aiResponse.protein) || 0,
        carbs: Number(aiResponse.carbs) || 0,
        fat: Number(aiResponse.fat) || 0,
      });
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
    <div className="bg-[var(--bg-secondary)] border border-white/10 rounded-2xl p-6 shadow-lg shadow-black/10">
      <div className="flex items-center justify-between gap-4 mb-4">
        <div>
          <h3 className="text-lg font-medium text-white/90">AI Food Logger</h3>
          <p className="text-xs text-white/45 mt-1">Describe a meal to estimate its nutrition.</p>
        </div>
       
      </div>

      {error && (
        <div className="mb-4 p-3 rounded-lg bg-red-500/20 border border-red-500/40 text-red-300 text-sm">
          {error}
        </div>
      )}

      <form onSubmit={handleAiSubmit} className="flex flex-col sm:flex-row gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="e.g. 2 eggs and avocado toast"
          className="min-w-0 flex-1 px-4 py-3 rounded-xl bg-[var(--bg-primary)] border border-white/20 text-white placeholder:text-white/35 focus:outline-none focus:border-strong-cyan focus:ring-1 focus:ring-strong-cyan transition"
          required
        />
        <button
          type="submit"
          disabled={loading}
          className="bg-[var(--accent)] hover:opacity-90 text-charcoal-blue font-semibold px-6 py-3 rounded-xl transition disabled:opacity-50"
        >
          {loading ? 'Analyzing...' : 'Log Food'}
        </button>
      </form>
    </div>
  );
}