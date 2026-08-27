import React, { useState } from 'react';
import { supabase } from '../lib/supabase';

export default function AIMealSuggester({ foodLogs = [], dailyGoals = { calories: 2000, protein: 150, carbs: 200, fat: 65 }, onMealLogged }) {
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [loggingId, setLoggingId] = useState(null);

  // Calculate remaining macros
  const consumedCalories = foodLogs.reduce((sum, item) => sum + (Number(item.calories) || 0), 0);
  const consumedProtein = foodLogs.reduce((sum, item) => sum + (Number(item.protein) || 0), 0);
  const consumedCarbs = foodLogs.reduce((sum, item) => sum + (Number(item.carbs) || 0), 0);
  const consumedFat = foodLogs.reduce((sum, item) => sum + (Number(item.fat) || 0), 0);

  const remainingCalories = Math.max(0, dailyGoals.calories - consumedCalories);
  const remainingProtein = Math.max(0, dailyGoals.protein - consumedProtein);
  const remainingCarbs = Math.max(0, dailyGoals.carbs - consumedCarbs);
  const remainingFat = Math.max(0, dailyGoals.fat - consumedFat);

  // Fetch list of next food suggestions
  const fetchNextFoodSuggestions = async () => {
    setLoading(true);
    setSuggestions([]);

    try {
      const res = await fetch('/api/ai/suggest-meal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          remainingCalories,
          remainingProtein,
          remainingCarbs,
          remainingFat,
        })
      });

      const responseText = await res.text();
      let result;

      try {
        result = responseText ? JSON.parse(responseText) : {};
      } catch {
        throw new Error(`AI server returned an invalid response (${res.status})`);
      }

      if (!res.ok) throw new Error(result.error || 'Failed to generate meal suggestions');

      const suggestions = Array.isArray(result.data) ? result.data : [result.data];
      if (!result.success || !suggestions[0]) {
        throw new Error('The AI returned no meal suggestions');
      }

      setSuggestions(suggestions);
    } catch (err) {
      console.error('Error fetching suggestions:', err);
    } finally {
      setLoading(false);
    }
  };

  // Log specific food item from the list to Supabase
  const handleLogItem = async (foodItem, index) => {
    setLoggingId(index);

    try {
      const { data: { user } } = await supabase.auth.getUser();

      const { data, error } = await supabase
        .from('food_logs')
        .insert([
          {
            user_id: user.id,
            food_name: foodItem.foodName,
            calories: foodItem.calories,
            protein: foodItem.protein,
            carbs: foodItem.carbs,
            fat: foodItem.fat
          }
        ])
        .select();

      if (error) throw error;

      if (onMealLogged) onMealLogged(data[0]);

      // Remove logged item from list
      setSuggestions((prev) => prev.filter((_, i) => i !== index));
    } catch (err) {
      console.error('Failed to log food:', err.message);
    } finally {
      setLoggingId(null);
    }
  };

  return (
    <div className="bg-slate-900 text-white p-6 rounded-2xl shadow-md my-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-lg font-bold flex items-center gap-2">
            💡 Need Ideas For Your Next Bite?
          </h3>
          <p className="text-xs text-gray-300 mt-1">
            Remaining: <span className="text-emerald-400 font-bold">{remainingCalories} kcal</span> | <span className="text-emerald-400 font-bold">{remainingProtein}g protein</span>
          </p>
        </div>

        {/* Single Trigger Button */}
        <button
          onClick={fetchNextFoodSuggestions}
          disabled={loading}
          className="bg-emerald-500 hover:bg-emerald-600 text-white font-bold px-5 py-2.5 rounded-xl text-sm transition disabled:opacity-50"
        >
          {loading ? 'Thinking...' : 'What should I eat next?'}
        </button>
      </div>

      {/* Suggested List Grid */}
      {suggestions.length > 0 && (
        <div className="mt-5 grid grid-cols-1 md:grid-cols-3 gap-3">
          {suggestions.map((item, index) => (
            <div key={index} className="bg-slate-800 border border-slate-700 p-4 rounded-xl flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-start mb-2">
                  <h4 className="font-bold text-sm text-gray-100">{item.foodName}</h4>
                  <span className="text-xs font-extrabold text-emerald-400 bg-emerald-950 px-2 py-0.5 rounded-md">
                    +{item.calories} kcal
                  </span>
                </div>

                {/* Macros Badges */}
                <div className="flex gap-2 text-[11px] text-gray-300 my-2">
                  <span>P: <b className="text-white">{item.protein}g</b></span>
                  <span>C: <b className="text-white">{item.carbs}g</b></span>
                  <span>F: <b className="text-white">{item.fat}g</b></span>
                </div>
              </div>

              <button
                onClick={() => handleLogItem(item, index)}
                disabled={loggingId === index}
                className="mt-3 w-full bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold py-2 rounded-lg transition disabled:opacity-50"
              >
                {loggingId === index ? 'Logging...' : '+ Log This Food'}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}