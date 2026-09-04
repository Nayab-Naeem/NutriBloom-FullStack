import React, { useState } from 'react';
import { supabase } from '../lib/supabase';

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

  // --------------------------------------------------
  // Calculate consumed nutrition
  // --------------------------------------------------

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

  // --------------------------------------------------
  // Calculate remaining nutrition
  // --------------------------------------------------

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

  // --------------------------------------------------
  // Goal-specific UI information
  // --------------------------------------------------

  const goalInfo = {
    lose: {
      emoji: '🔥',
      title: 'Smart Choices for Weight Loss',
      description:
        'Light, nutritious options to help you stay satisfied while supporting your calorie deficit.',
      button: 'Suggest Light Foods',
      color: 'emerald'
    },

    gain: {
      emoji: '💪',
      title: 'Foods for Healthy Weight Gain',
      description:
        'Nutrient-dense foods and snacks to help you reach your calorie and protein goals.',
      button: 'Suggest Foods to Gain',
      color: 'orange'
    },

    maintain: {
      emoji: '⚖️',
      title: 'Balanced Food Suggestions',
      description:
        'Balanced meals and snacks to help you maintain your current weight and nutrition.',
      button: 'Suggest Something',
      color: 'cyan'
    }
  };

  const currentGoal = goalInfo[goal];
  if (!currentGoal) {
  console.error('Invalid user goal:', goal);
}
  // --------------------------------------------------
  // Fetch AI food suggestions
  // --------------------------------------------------

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
          // IMPORTANT:
          // Send the user's actual goal to the backend.
          goal,
          // We are asking for snack / food ideas,
          // not necessarily a full meal.
          mealType: 'snack'
        })
      });

      const responseText = await res.text();
      let result;

      try {
        result = responseText
          ? JSON.parse(responseText)
          : {};
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

      if (
        !result.success ||
        returnedSuggestions.length === 0
      ) {
        throw new Error(
          'The AI returned no food suggestions.'
        );
      }

      setSuggestions(returnedSuggestions);

    } catch (err) {
      console.error(
        'Error fetching food suggestions:',
        err
      );

      setError(
        err.message ||
        'Unable to generate food suggestions.'
      );

    } finally {
      setLoading(false);
    }
  };

  // --------------------------------------------------
  // Log selected food to Supabase
  // --------------------------------------------------
  const handleLogItem = async (foodItem, index) => {
    setLoggingId(index);
    setError('');

    try {
      const {
        data: { user }
      } = await supabase.auth.getUser();

      if (!user) {
        throw new Error(
          'You must be logged in to log food.'
        );
      }

      const { data, error } = await supabase
        .from('food_logs')
        .insert([
          {
            user_id: user.id,
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

      // Remove logged suggestion
      setSuggestions((prev) =>
        prev.filter((_, i) => i !== index)
      );

    } catch (err) {
      console.error(
        'Failed to log food:',
        err
      );

      setError(
        err.message ||
        'Failed to log this food.'
      );

    } finally {
      setLoggingId(null);
    }
  };

  // --------------------------------------------------
  // Render
  // --------------------------------------------------

  return (
    <div className="bg-slate-900 text-white p-4 sm:p-6 rounded-2xl shadow-md my-6">

      {/* --------------------------------------------------
          Header
      -------------------------------------------------- */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">

        <div className="min-w-0">

          <h3 className="text-lg font-bold flex items-start gap-2 break-words">
            <span>{currentGoal.emoji}</span>

            <span>
              {currentGoal.title}
            </span>
          </h3>
          <p className="text-xs text-gray-300 mt-1">
            {currentGoal.description}
          </p>

          <p className="text-xs text-gray-400 mt-2">
            Remaining today:{' '}

            <span className="text-emerald-400 font-bold">
              {remainingCalories} kcal
            </span>

            {' '}|{' '}

            <span className="text-emerald-400 font-bold">
              {remainingProtein}g protein
            </span>
          </p>
        </div>

        {/* --------------------------------------------------
            Suggest Button
        -------------------------------------------------- */}

        <button
          onClick={fetchNextFoodSuggestions}
          disabled={loading}
          className="w-full sm:w-auto shrink-0 bg-emerald-500 hover:bg-emerald-600 text-white font-bold px-5 py-2.5 rounded-xl text-sm transition disabled:opacity-50"
        >
          {loading
            ? 'Thinking...'
            : currentGoal.button}
        </button>
      </div>

      {/* --------------------------------------------------
          Error
      -------------------------------------------------- */}

      {error && (
        <div className="mt-4 p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-300 text-sm">
          {error}
        </div>
      )}

      {/* --------------------------------------------------
          Suggestions
      -------------------------------------------------- */}

      {suggestions.length > 0 && (
        <div className="mt-5 grid grid-cols-1 md:grid-cols-3 gap-3">
          {suggestions.map((item, index) => (

            <div
              key={`${item.foodName}-${index}`}
              className="bg-slate-800 border border-slate-700 p-4 rounded-xl flex flex-col justify-between min-w-0"
            >

              <div>
                {/* Food name */}
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2 mb-2">

                  <h4 className="font-bold text-sm text-gray-100 break-words">
                    {item.foodName}
                  </h4>

                  <span className="self-start shrink-0 text-xs font-extrabold text-emerald-400 bg-emerald-950 px-2 py-0.5 rounded-md">
                    {item.calories} kcal
                  </span>
                </div>

                {/* Description */}

                {item.description && (
                  <p className="text-xs text-gray-400 leading-relaxed mb-3">
                    {item.description}
                  </p>
                )}

                {/* Macros */}

                <div className="flex flex-wrap gap-x-2 gap-y-1 text-[11px] text-gray-300">

                  <span>
                    P:{' '}
                    <b className="text-white">
                      {item.protein}g
                    </b>
                  </span>

                  <span>
                    C:{' '}
                    <b className="text-white">
                      {item.carbs}g
                    </b>
                  </span>

                  <span>
                    F:{' '}
                    <b className="text-white">
                      {item.fat}g
                    </b>
                  </span>

                </div>
              </div>
              {/* Log button */}
              <button
                onClick={() =>
                  handleLogItem(item, index)
                }
                disabled={loggingId === index}
                className="mt-3 w-full bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold py-2 rounded-lg transition disabled:opacity-50"
              >
                {loggingId === index
                  ? 'Logging...'
                  : '+ Log This Food'}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}