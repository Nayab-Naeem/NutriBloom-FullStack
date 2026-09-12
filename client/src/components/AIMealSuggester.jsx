import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { getLocalDateKey } from '../utils/date';

export default function AIMealSuggester({
  foodLogs = [],
  dailyGoals,
  goal,
  onMealLogged
}) {
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [loggingId, setLoggingId] = useState(null);
  const [error, setError] = useState('');

  const consumedCalories = foodLogs.reduce(
    (sum, item) => sum + (Number(item.calories) || 0),
    0
  );

  const consumedProtein = foodLogs.reduce(
    (sum, item) => sum + (Number(item.protein) || 0),
    0
  );

  const consumedCarbs = foodLogs.reduce(
    (sum, item) => sum + (Number(item.carbs) || 0),
    0
  );

  const consumedFat = foodLogs.reduce(
    (sum, item) => sum + (Number(item.fat) || 0),
    0
  );

  const remainingCalories = Math.max(
    0,
    Number(dailyGoals.calories) - consumedCalories
  );

  const remainingProtein = Math.max(
    0,
    Number(dailyGoals.protein) - consumedProtein
  );

  const remainingCarbs = Math.max(
    0,
    Number(dailyGoals.carbs) - consumedCarbs
  );

  const remainingFat = Math.max(
    0,
    Number(dailyGoals.fat) - consumedFat
  );

  const goalInfo = {
    lose: {
      emoji: '🔥',
      title: 'Smart Choices for Weight Loss',
      description:
        'Light, nutritious options to help you stay satisfied while supporting your calorie deficit.',
      button: 'Suggest Light Foods',
    },

    gain: {
      emoji: '💪',
      title: 'Foods for Healthy Weight Gain',
      description:
        'Nutrient-dense foods and snacks to help you reach your calorie and protein goals.',
      button: 'Suggest Foods to Gain',
    },

    maintain: {
      emoji: '⚖️',
      title: 'Balanced Food Suggestions',
      description:
        'Balanced meals and snacks to help you maintain your current weight and nutrition.',
      button: 'Suggest Something',
    }
  };

  const currentGoal = goalInfo[goal] || goalInfo.maintain;

  const fetchNextFoodSuggestions = async () => {
    setLoading(true);
    setSuggestions([]);
    setError('');
    try {
      const res = await fetch('/api/ai/suggest-meal', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          remainingCalories,
          remainingProtein,
          remainingCarbs,
          remainingFat,
          goal,
          mealType: 'snack'
        })
      });

      const responseText = await res.text();
      let result;

      try {
        result = responseText ? JSON.parse(responseText) : {};
      } catch {
        throw new Error(
          `AI server returned an invalid response (${res.status})`
        );
      }

      if (!res.ok) {
        throw new Error(
          result.error ||
          'Failed to generate food suggestions'
        );
      }

      const returnedSuggestions = Array.isArray(result.data)
        ? result.data
        : result.data
          ? [result.data]
          : [];

      const safeSuggestions = goal === 'lose'
        ? returnedSuggestions.filter((item) => Number(item.calories) <= 150)
        : returnedSuggestions;

      if (!result.success || safeSuggestions.length === 0) {
        throw new Error('The AI returned no food suggestions.');
      }

      setSuggestions(safeSuggestions);
    } catch (err) {
      console.error('Error fetching food suggestions:', err);
      setError(err.message || 'Unable to generate food suggestions.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogItem = async (foodItem, index) => {
    setLoggingId(index);
    setError('');

    try {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        throw new Error('You must be logged in to log food.');
      }

      const { data, error } = await supabase
        .from('food_logs')
        .insert([
          {
            user_id: user.id,
            logged_date: getLocalDateKey(),
            food_name: foodItem.foodName,
            calories: Number(foodItem.calories) || 0,
            protein: Number(foodItem.protein) || 0,
            carbs: Number(foodItem.carbs) || 0,
            fat: Number(foodItem.fat) || 0
          }
        ])
        .select();

      if (error) {
        throw error;
      }

      if (onMealLogged && data?.[0]) {
        onMealLogged(data[0]);
      }

      setSuggestions((prev) =>
        prev.filter((_, i) => i !== index)
      );
    } catch (err) {
      console.error('Failed to log food:', err);
      setError(err.message || 'Failed to log this food.');
    } finally {
      setLoggingId(null);
    }
  };

  return (
    <div className="nb-card p-5 sm:p-6 my-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="min-w-0">
          <h3 className="text-lg font-semibold flex items-start gap-2 break-words nb-section-title">
            <span>{currentGoal.emoji}</span>
            <span>{currentGoal.title}</span>
          </h3>
          <p className="text-xs nb-muted mt-1.5 leading-relaxed">
            {currentGoal.description}
          </p>

          <p className="text-xs nb-muted mt-2.5">
            Remaining today:{' '}
            <span className="text-strong-cyan font-semibold">
              {remainingCalories} kcal
            </span>
            {' '}|{' '}
            <span className="text-strong-cyan font-semibold">
              {remainingProtein}g protein
            </span>
          </p>
        </div>

        <button
          onClick={fetchNextFoodSuggestions}
          disabled={loading}
          className="w-full sm:w-auto shrink-0 nb-btn-primary px-5 py-2.5 text-sm disabled:opacity-50"
        >
          {loading ? 'Thinking...' : currentGoal.button}
        </button>
      </div>

      {error && (
        <div className="mt-4 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
          {error}
        </div>
      )}

      {suggestions.length > 0 && (
        <div className="mt-5 grid grid-cols-1 md:grid-cols-3 gap-3">
          {suggestions.map((item, index) => (
            <div
              key={`${item.foodName}-${index}`}
              className="nb-card-elevated p-4 flex flex-col justify-between min-w-0"
            >
              <div>
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2 mb-2">
                  <h4 className="font-semibold text-sm nb-section-title break-words">
                    {item.foodName}
                  </h4>
                  <span className="self-start shrink-0 text-xs font-bold text-strong-cyan bg-[var(--bg-overlay)] px-2.5 py-1 rounded-lg">
                    {item.calories} kcal
                  </span>
                </div>

                {item.description && (
                  <p className="text-xs nb-muted leading-relaxed mb-3">
                    {item.description}
                  </p>
                )}

                <div className="flex flex-wrap gap-x-3 gap-y-1 text-[11px] nb-muted">
                  <span>
                    P: <b className="text-[var(--text-primary)]">{item.protein}g</b>
                  </span>
                  <span>
                    C: <b className="text-[var(--text-primary)]">{item.carbs}g</b>
                  </span>
                  <span>
                    F: <b className="text-[var(--text-primary)]">{item.fat}g</b>
                  </span>
                </div>
              </div>
              <button
                onClick={() => handleLogItem(item, index)}
                disabled={loggingId === index}
                className="mt-3 w-full nb-btn-accent text-xs py-2 disabled:opacity-50"
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
