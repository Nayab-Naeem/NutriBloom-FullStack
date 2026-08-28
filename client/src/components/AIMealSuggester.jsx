import React, { useState } from 'react';
import { supabase } from '../lib/supabase';

export default function AIMealSuggester({ foodLogs = [], dailyGoals = { calories: 2000 }, onMealLogged }) {
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [loggingIndex, setLoggingIndex] = useState(null);

  // Calculate remaining calories for today
  const caloriesEaten = foodLogs.reduce((sum, item) => sum + (Number(item.calories) || 0), 0);
  const remainingCalories = Math.max(0, dailyGoals.calories - caloriesEaten);

  // Get quick suggestions from AI
  const handleGetSuggestions = async () => {
    setLoading(true);
    setSuggestions([]);

    try {
      const res = await fetch('/api/ai/suggest-meal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ remainingCalories })
      });

      const result = await res.json();
      if (result.success && Array.isArray(result.data)) {
        setSuggestions(result.data);
      }
    } catch (err) {
      console.error('Error getting suggestions:', err);
    } finally {
      setLoading(false);
    }
  };

  // Log selected pill directly to Supabase
  const handleLogPill = async (item, index) => {
    setLoggingIndex(index);
    try {
      const { data: { user } } = await supabase.auth.getUser();

      const { data, error } = await supabase
        .from('food_logs')
        .insert([
          {
            user_id: user.id,
            food_name: item.foodName,
            calories: item.calories,
            protein: item.protein || 0,
            carbs: item.carbs || 0,
            fat: item.fat || 0
          }
        ])
        .select();

      if (error) throw error;

      if (onMealLogged) onMealLogged(data[0]);

      // Remove the logged item from suggestions
      setSuggestions((prev) => prev.filter((_, i) => i !== index));
    } catch (err) {
      console.error('Failed to log suggestion:', err.message);
    } finally {
      setLoggingIndex(null);
    }
  };

  return (
    <div className="bg-white/5 border border-white/10 p-5 rounded-2xl my-6 text-white">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div>
          <h3 className="text-base font-bold text-strong-cyan">
            💡 Need Ideas To Complete Your Daily Goal?
          </h3>
          <p className="text-xs text-white/60 mt-0.5">
            You still need <span className="text-strong-cyan font-bold">{remainingCalories} kcal</span> today.
          </p>
        </div>

        <button
          onClick={handleGetSuggestions}
          disabled={loading || remainingCalories <= 0}
          className="bg-strong-cyan text-black font-bold px-4 py-2 rounded-xl text-xs hover:bg-opacity-80 transition disabled:opacity-50"
        >
          {loading ? 'Finding ideas...' : 'Get Suggestions'}
        </button>
      </div>

      {/* Suggestion List Banner */}
      {suggestions.length > 0 && (
        <div className="mt-3 pt-3 border-t border-white/10">
          <p className="text-xs text-white/80 font-medium mb-3">
            Here are some quick foods to complete your goal (click to log):
          </p>

          {/* Clickable Food Pills / Badges */}
          <div className="flex flex-wrap gap-2">
            {suggestions.map((item, index) => (
              <button
                key={index}
                onClick={() => handleLogPill(item, index)}
                disabled={loggingIndex === index}
                className="flex items-center gap-2 bg-white/10 hover:bg-strong-cyan hover:text-black border border-white/20 text-white px-3 py-2 rounded-xl text-xs font-semibold transition group"
              >
                <span>{item.foodName}</span>
                <span className="text-[10px] bg-black/30 group-hover:bg-black/20 text-strong-cyan group-hover:text-black px-1.5 py-0.5 rounded-md font-bold">
                  +{item.calories} kcal
                </span>
                <span className="text-xs font-bold ml-1">
                  {loggingIndex === index ? '...' : '+'}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}